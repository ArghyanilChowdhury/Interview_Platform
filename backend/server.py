from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Form, Depends, Request, Response
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import json
import aiofiles
import requests

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'interview-platform-jwt-secret-2024-secure')
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = 72

# Create the main app
app = FastAPI()

# Create a router with /api prefix
api_router = APIRouter(prefix="/api")

# Uploads directory
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

# ============ PYDANTIC MODELS ============

class UserCreate(BaseModel):
    email: str
    password: str
    name: str

class UserLogin(BaseModel):
    email: str
    password: str

class InterviewCreate(BaseModel):
    type: str
    role: Optional[str] = None
    experience_level: Optional[str] = None
    skills: Optional[List[str]] = None

class ResponseSave(BaseModel):
    question_index: int
    transcript: str
    recording_path: Optional[str] = None
    duration: Optional[int] = 0

class ProfileUpdate(BaseModel):
    name: Optional[str] = None

# ============ AUTH HELPERS ============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_jwt(user_id: str) -> str:
    payload = {
        "user_id": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRY_HOURS),
        "iat": datetime.now(timezone.utc)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("session_token")
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    # Try JWT first
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"user_id": payload["user_id"]}, {"_id": 0})
        if user:
            return user
    except (jwt.InvalidTokenError, jwt.ExpiredSignatureError):
        pass

    # Try session token (Google OAuth)
    session = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if session:
        expires_at = session["expires_at"]
        if isinstance(expires_at, str):
            expires_at = datetime.fromisoformat(expires_at)
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at < datetime.now(timezone.utc):
            raise HTTPException(status_code=401, detail="Session expired")
        user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
        if user:
            return user

    raise HTTPException(status_code=401, detail="Not authenticated")

# ============ AUTH ROUTES ============

@api_router.post("/auth/register")
async def register(data: UserCreate, response: Response):
    existing = await db.users.find_one({"email": data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_id = f"user_{uuid.uuid4().hex[:12]}"
    user_doc = {
        "user_id": user_id,
        "email": data.email,
        "name": data.name,
        "password_hash": hash_password(data.password),
        "picture": None,
        "auth_type": "local",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)

    token = create_jwt(user_id)
    response.set_cookie(
        key="session_token",
        value=token,
        path="/",
        secure=True,
        httponly=True,
        samesite="none",
        max_age=JWT_EXPIRY_HOURS * 3600
    )

    return {
        "user_id": user_id,
        "email": data.email,
        "name": data.name,
        "picture": None,
        "auth_type": "local",
        "token": token
    }

@api_router.post("/auth/login")
async def login(data: UserLogin, response: Response):
    user = await db.users.find_one({"email": data.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if user.get("auth_type") == "google":
        raise HTTPException(status_code=400, detail="Please use Google login for this account")
    if not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_jwt(user["user_id"])
    response.set_cookie(
        key="session_token",
        value=token,
        path="/",
        secure=True,
        httponly=True,
        samesite="none",
        max_age=JWT_EXPIRY_HOURS * 3600
    )

    return {
        "user_id": user["user_id"],
        "email": user["email"],
        "name": user["name"],
        "picture": user.get("picture"),
        "auth_type": user["auth_type"],
        "token": token
    }

@api_router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    return {
        "user_id": user["user_id"],
        "email": user["email"],
        "name": user["name"],
        "picture": user.get("picture"),
        "auth_type": user.get("auth_type", "local")
    }

@api_router.get("/auth/session")
async def exchange_session(request: Request, response: Response):
    session_id = request.headers.get("X-Session-ID")
    if not session_id:
        raise HTTPException(status_code=400, detail="Missing session ID")

    try:
        auth_response = requests.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        )
        if auth_response.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid session")
        auth_data = auth_response.json()
    except requests.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Auth service error: {str(e)}")

    email = auth_data["email"]
    name = auth_data["name"]
    picture = auth_data.get("picture")
    session_token = auth_data["session_token"]

    existing_user = await db.users.find_one({"email": email}, {"_id": 0})
    if existing_user:
        user_id = existing_user["user_id"]
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"name": name, "picture": picture}}
        )
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id,
            "email": email,
            "name": name,
            "picture": picture,
            "password_hash": None,
            "auth_type": "google",
            "created_at": datetime.now(timezone.utc).isoformat()
        })

    await db.user_sessions.insert_one({
        "session_token": session_token,
        "user_id": user_id,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })

    response.set_cookie(
        key="session_token",
        value=session_token,
        path="/",
        secure=True,
        httponly=True,
        samesite="none",
        max_age=7 * 24 * 3600
    )

    return {
        "user_id": user_id,
        "email": email,
        "name": name,
        "picture": picture,
        "auth_type": "google"
    }

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    token = request.cookies.get("session_token")
    if token:
        await db.user_sessions.delete_many({"session_token": token})
    response.delete_cookie(key="session_token", path="/", secure=True, samesite="none")
    return {"message": "Logged out"}

# ============ INTERVIEW ROUTES ============

@api_router.post("/interviews/start")
async def start_interview(data: InterviewCreate, user: dict = Depends(get_current_user)):
    interview_id = f"int_{uuid.uuid4().hex[:12]}"
    questions = await generate_questions(
        data.type, data.role,
        experience_level=data.experience_level,
        skills=data.skills
    )

    interview_doc = {
        "interview_id": interview_id,
        "user_id": user["user_id"],
        "type": data.type,
        "role": data.role,
        "experience_level": data.experience_level,
        "skills": data.skills or [],
        "questions": questions,
        "responses": [],
        "status": "in_progress",
        "summary": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "completed_at": None
    }
    await db.interviews.insert_one(interview_doc)

    return {
        "interview_id": interview_id,
        "type": data.type,
        "role": data.role,
        "experience_level": data.experience_level,
        "skills": data.skills or [],
        "questions": questions,
        "status": "in_progress"
    }

@api_router.post("/interviews/start-resume")
async def start_resume_interview(
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user)
):
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in [".pdf", ".doc", ".docx"]:
        raise HTTPException(status_code=400, detail="Only PDF, DOC, DOCX files are supported")

    resume_filename = f"resume_{uuid.uuid4().hex[:8]}{file_ext}"
    resume_path = UPLOAD_DIR / resume_filename

    content = await file.read()
    async with aiofiles.open(str(resume_path), "wb") as f:
        await f.write(content)

    resume_text = parse_resume(str(resume_path), file_ext)
    questions = await generate_questions("resume", resume_text=resume_text)

    interview_id = f"int_{uuid.uuid4().hex[:12]}"
    interview_doc = {
        "interview_id": interview_id,
        "user_id": user["user_id"],
        "type": "resume",
        "role": None,
        "resume_filename": resume_filename,
        "resume_text": resume_text[:2000],
        "questions": questions,
        "responses": [],
        "status": "in_progress",
        "summary": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "completed_at": None
    }
    await db.interviews.insert_one(interview_doc)

    return {
        "interview_id": interview_id,
        "type": "resume",
        "questions": questions,
        "status": "in_progress"
    }

@api_router.get("/interviews")
async def list_interviews(user: dict = Depends(get_current_user)):
    interviews = await db.interviews.find(
        {"user_id": user["user_id"]},
        {"_id": 0, "resume_text": 0}
    ).sort("created_at", -1).to_list(100)
    return interviews

@api_router.get("/interviews/{interview_id}")
async def get_interview(interview_id: str, user: dict = Depends(get_current_user)):
    interview = await db.interviews.find_one(
        {"interview_id": interview_id, "user_id": user["user_id"]},
        {"_id": 0}
    )
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    return interview

@api_router.post("/interviews/{interview_id}/responses")
async def save_response(
    interview_id: str,
    data: ResponseSave,
    user: dict = Depends(get_current_user)
):
    interview = await db.interviews.find_one(
        {"interview_id": interview_id, "user_id": user["user_id"]},
        {"_id": 0}
    )
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    response_doc = {
        "question_index": data.question_index,
        "transcript": data.transcript,
        "recording_path": data.recording_path,
        "duration": data.duration,
        "feedback": None
    }

    await db.interviews.update_one(
        {"interview_id": interview_id},
        {"$push": {"responses": response_doc}}
    )

    return {"message": "Response saved", "question_index": data.question_index}

@api_router.post("/interviews/{interview_id}/complete")
async def complete_interview(interview_id: str, user: dict = Depends(get_current_user)):
    interview = await db.interviews.find_one(
        {"interview_id": interview_id, "user_id": user["user_id"]},
        {"_id": 0}
    )
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    responses = interview.get("responses", [])
    questions = interview.get("questions", [])

    for resp in responses:
        idx = resp["question_index"]
        if idx < len(questions) and resp.get("transcript"):
            feedback = await generate_feedback(questions[idx], resp["transcript"])
            resp["feedback"] = feedback

    summary = await generate_summary(questions, responses, interview.get("role", "General"))

    await db.interviews.update_one(
        {"interview_id": interview_id},
        {
            "$set": {
                "status": "completed",
                "responses": responses,
                "summary": summary,
                "completed_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )

    updated = await db.interviews.find_one(
        {"interview_id": interview_id},
        {"_id": 0}
    )
    return updated

# ============ RECORDING ROUTES ============

@api_router.post("/recordings/upload")
async def upload_recording(
    file: UploadFile = File(...),
    interview_id: str = Form(...),
    question_index: int = Form(...),
    user: dict = Depends(get_current_user)
):
    filename = f"rec_{interview_id}_{question_index}_{uuid.uuid4().hex[:6]}.webm"
    file_path = UPLOAD_DIR / filename

    content = await file.read()
    async with aiofiles.open(str(file_path), "wb") as f:
        await f.write(content)

    recording_url = f"/api/recordings/{filename}"
    return {"recording_path": recording_url, "filename": filename}

@api_router.get("/recordings/{filename}")
async def serve_recording(filename: str):
    file_path = UPLOAD_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Recording not found")
    return FileResponse(str(file_path), media_type="video/webm")

# ============ RESUME PARSING ============

def parse_resume(file_path: str, file_ext: str) -> str:
    try:
        if file_ext == ".pdf":
            from PyPDF2 import PdfReader
            reader = PdfReader(file_path)
            text = ""
            for page in reader.pages:
                text += page.extract_text() or ""
            return text.strip()
        elif file_ext in [".docx", ".doc"]:
            from docx import Document
            doc = Document(file_path)
            text = "\n".join([para.text for para in doc.paragraphs])
            return text.strip()
    except Exception as e:
        logger.error(f"Resume parsing error: {e}")
    return "Unable to parse resume content"

# ============ AI SERVICE ============

async def generate_questions(interview_type: str, role: str = None, resume_text: str = None, experience_level: str = None, skills: list = None) -> list:
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage

        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            return get_fallback_questions(role or "general")

        chat = LlmChat(
            api_key=api_key,
            session_id=f"questions_{uuid.uuid4().hex[:8]}",
            system_message="You are an expert interview coach. Generate professional interview questions. Return ONLY a JSON array of strings, each being one question. No markdown, no explanation, no code blocks."
        ).with_model("gemini", "gemini-3-flash-preview")

        if interview_type == "role" and role:
            level_str = f" The candidate is at {experience_level} level." if experience_level else ""
            skills_str = f" Focus on these specific skills: {', '.join(skills)}." if skills and len(skills) > 0 else ""
            prompt = f"Generate 7 interview questions for a {role} position.{level_str}{skills_str} Mix technical and behavioral questions appropriate for the candidate's experience level. Return as JSON array of strings only."
        elif interview_type == "resume" and resume_text:
            prompt = f"Based on this resume, generate 7 personalized interview questions targeting the candidate's specific skills, projects, and experience:\n\n{resume_text[:3000]}\n\nReturn as JSON array of strings only."
        else:
            prompt = "Generate 7 general professional interview questions. Return as JSON array of strings only."

        msg = UserMessage(text=prompt)
        response_text = await chat.send_message(msg)

        try:
            cleaned = response_text.strip()
            if cleaned.startswith("```"):
                lines = cleaned.split("\n")
                cleaned = "\n".join(lines[1:-1])
            questions = json.loads(cleaned)
            if isinstance(questions, list) and len(questions) > 0:
                return [str(q) for q in questions[:7]]
        except json.JSONDecodeError:
            pass

        return get_fallback_questions(role or "general")
    except Exception as e:
        logger.error(f"AI question generation error: {e}")
        return get_fallback_questions(role or "general")

async def generate_feedback(question: str, answer: str) -> str:
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage

        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key or not answer.strip():
            return "No feedback available."

        chat = LlmChat(
            api_key=api_key,
            session_id=f"feedback_{uuid.uuid4().hex[:8]}",
            system_message="You are an expert interview coach. Provide brief, constructive feedback on interview answers. Keep feedback to 3-4 sentences max."
        ).with_model("gemini", "gemini-3-flash-preview")

        msg = UserMessage(text=f"Question: {question}\n\nCandidate's Answer: {answer}\n\nProvide brief constructive feedback covering: content quality, communication clarity, and one improvement suggestion.")
        resp = await chat.send_message(msg)
        return resp.strip()
    except Exception as e:
        logger.error(f"AI feedback error: {e}")
        return "Feedback generation unavailable at this time."

async def generate_summary(questions: list, responses: list, role: str) -> str:
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage

        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            return "Interview completed. Review your responses above for details."

        qa_pairs = []
        for resp in responses:
            idx = resp["question_index"]
            if idx < len(questions):
                qa_pairs.append(f"Q: {questions[idx]}\nA: {resp.get('transcript', 'No response')}")

        qa_text = "\n\n".join(qa_pairs)

        chat = LlmChat(
            api_key=api_key,
            session_id=f"summary_{uuid.uuid4().hex[:8]}",
            system_message="You are an expert interview coach. Provide a brief interview performance summary."
        ).with_model("gemini", "gemini-3-flash-preview")

        msg = UserMessage(text=f"Role: {role}\n\nInterview Q&A:\n\n{qa_text}\n\nProvide a brief performance summary (4-5 sentences) covering overall performance, strengths, areas for improvement, and a confidence rating out of 10.")
        resp = await chat.send_message(msg)
        return resp.strip()
    except Exception as e:
        logger.error(f"AI summary error: {e}")
        return "Interview completed successfully. Review individual responses for feedback."

def get_fallback_questions(role: str) -> list:
    questions_bank = {
        "Frontend Developer": [
            "Can you explain the difference between React's useState and useReducer hooks?",
            "How would you optimize the performance of a large React application?",
            "Describe your experience with CSS-in-JS solutions vs traditional CSS.",
            "How do you handle state management in complex applications?",
            "Tell me about a challenging UI problem you solved recently.",
            "How do you ensure web accessibility in your projects?",
            "Walk me through your approach to responsive design."
        ],
        "Backend Developer": [
            "Explain the difference between SQL and NoSQL databases. When would you use each?",
            "How do you design a RESTful API? What principles do you follow?",
            "Describe your approach to handling authentication and authorization.",
            "How would you optimize a slow database query?",
            "Tell me about a time you had to debug a complex production issue.",
            "How do you ensure API security in your applications?",
            "Explain microservices architecture and its trade-offs."
        ],
        "Full Stack Developer": [
            "How do you decide between server-side and client-side rendering?",
            "Describe your experience with CI/CD pipelines.",
            "How do you handle data consistency between frontend and backend?",
            "Tell me about a full-stack project you're most proud of.",
            "How do you approach database schema design?",
            "What's your strategy for error handling across the stack?",
            "How do you balance feature development with technical debt?"
        ],
        "Data Analyst": [
            "How do you approach cleaning and preprocessing messy data?",
            "Describe a data analysis project that drove business decisions.",
            "What statistical methods do you commonly use?",
            "How do you communicate complex data insights to non-technical stakeholders?",
            "What tools and technologies are in your data analysis toolkit?",
            "How do you validate the accuracy of your analysis?",
            "Tell me about a time your analysis revealed unexpected insights."
        ],
        "DevOps Engineer": [
            "Explain your experience with containerization using Docker and Kubernetes.",
            "How do you implement infrastructure as code?",
            "Describe your approach to monitoring and alerting in production.",
            "How would you design a deployment pipeline for a microservices architecture?",
            "Tell me about a time you improved system reliability or uptime.",
            "How do you handle secrets management in your infrastructure?",
            "What's your approach to disaster recovery and backup strategies?"
        ],
        "HR Interview": [
            "Tell me about yourself and your career journey.",
            "Why are you interested in this role and our company?",
            "Describe a situation where you had to work with a difficult team member.",
            "What are your greatest strengths and areas for improvement?",
            "Where do you see yourself in the next five years?",
            "Tell me about a time you showed leadership in a challenging situation.",
            "How do you handle tight deadlines and pressure?"
        ]
    }
    return questions_bank.get(role, questions_bank.get("HR Interview", questions_bank["Frontend Developer"]))

# ============ PROFILE ROUTES ============

@api_router.get("/profile")
async def get_profile(user: dict = Depends(get_current_user)):
    total_interviews = await db.interviews.count_documents({"user_id": user["user_id"]})
    completed_interviews = await db.interviews.count_documents(
        {"user_id": user["user_id"], "status": "completed"}
    )

    return {
        "user_id": user["user_id"],
        "email": user["email"],
        "name": user["name"],
        "picture": user.get("picture"),
        "auth_type": user.get("auth_type", "local"),
        "created_at": user.get("created_at"),
        "total_interviews": total_interviews,
        "completed_interviews": completed_interviews
    }

@api_router.put("/profile")
async def update_profile(data: ProfileUpdate, user: dict = Depends(get_current_user)):
    update_data = {}
    if data.name is not None:
        update_data["name"] = data.name

    if update_data:
        await db.users.update_one(
            {"user_id": user["user_id"]},
            {"$set": update_data}
        )

    updated_user = await db.users.find_one(
        {"user_id": user["user_id"]},
        {"_id": 0, "password_hash": 0}
    )
    return updated_user

# ============ HEALTH CHECK ============

@api_router.get("/")
async def root():
    return {"message": "Interview Platform API", "status": "running"}

# Include the router in the main app
app.include_router(api_router)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
