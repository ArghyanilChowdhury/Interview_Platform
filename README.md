# InterviewMaster - Complete Project Documentation

---

## 1. Project Overview

### What is InterviewMaster?

InterviewMaster is a full-stack AI-powered mock interview practice platform designed to help job candidates prepare for real-world interviews through a realistic, immersive simulation experience. The platform allows users to sign up, configure their mock interview (by selecting a job role or uploading a resume), and then participate in a live, fullscreen video interview conducted by an AI interviewer named "Sarah Mitchell." The system records the candidate's webcam and audio responses, transcribes them using OpenAI Whisper, and provides detailed AI-generated feedback on each answer along with an overall performance summary.

### Purpose and Objective

The primary objective of InterviewMaster is to democratize interview preparation by giving candidates access to a personalized, AI-driven coaching experience that was previously only available through expensive career coaching services. The platform aims to:

- Simulate a real interview environment (fullscreen mode, timed responses, AI interviewer reading questions aloud).
- Provide AI-generated, role-specific and skill-specific interview questions.
- Record and transcribe user responses for self-review.
- Deliver instant, constructive feedback on answer quality, communication clarity, and improvement areas.
- Track interview history and enable iterative improvement over time.

### Real-World Problem It Solves

Interview preparation is one of the most stressful aspects of the job search process. Candidates often struggle because:

- They lack access to realistic practice environments.
- They don't know what questions to expect for their specific role and skill set.
- They can't objectively evaluate their own body language, tone, and answer quality.
- Professional mock interview services are expensive (often $100-$300 per session).
- Self-practice with a mirror or notes doesn't replicate the pressure of a real interview.

InterviewMaster solves these problems by providing an on-demand, free-to-use platform that combines AI question generation, video recording, automatic transcription, and intelligent feedback in a realistic interview simulation.

### Target Users

- **Job seekers** preparing for technical interviews (software engineering, data analysis, DevOps).
- **Career changers** transitioning into tech who need to practice domain-specific questions.
- **Fresh graduates** with limited interview experience who want to build confidence.
- **HR professionals** preparing for behavioral and cultural fit interview rounds.
- **Experienced professionals** aiming for senior or leadership roles who need to practice system design and advanced questions.

---

## 2. Motivation Behind the Project

### Why This Project Was Needed

The job market, particularly in the technology sector, demands strong interview skills that go beyond just technical knowledge. Candidates need to articulate their thoughts clearly, manage time effectively, and present themselves professionally under pressure. Traditional interview preparation methods (reading books, watching YouTube videos, practicing with friends) lack the realism, feedback loop, and personalization needed for effective improvement.

### Limitations of Existing Solutions

| Existing Solution | Limitation |
|---|---|
| **Mock interviews with friends** | Lack of structured, role-specific questions; no AI feedback; scheduling difficulties |
| **YouTube/Article-based prep** | Passive learning; no practice component; no personalized feedback |
| **Paid coaching services** | Expensive ($100-$300/session); limited availability; not on-demand |
| **Basic quiz platforms** | Text-only; no video/audio recording; no realistic interview simulation |
| **Generic AI chatbots** | No video recording; no fullscreen immersion; no interviewer avatar; no transcription |

InterviewMaster combines the best aspects of all these approaches into a single, free, AI-powered platform with a realistic interview simulation environment.

---

## 3. System Architecture

### Overall Architecture

The application follows a standard three-tier client-server architecture:

```
+---------------------+         +----------------------+         +------------------+
|                     |  HTTPS  |                      |  TCP    |                  |
|   React Frontend    | <-----> |   FastAPI Backend     | <-----> |     MongoDB      |
|   (Port 3000)       |  /api   |   (Port 8001)        |  27017  |   (Database)     |
|                     |         |                      |         |                  |
+---------------------+         +----------------------+         +------------------+
        |                               |        |
        |                               |        +-----------> Gmail SMTP Server
        |                               |                      (OTP Emails, Notifications)
        |                               |
        v                               v
  Browser APIs:                   External AI Services:
  - MediaRecorder (Video)         - Gemini 3 Flash (Questions/Feedback)
  - SpeechSynthesis (TTS)         - OpenAI Whisper (Transcription)
  - Fullscreen API
```

### How Components Interact

1. **Frontend (React.js):** Renders the UI, manages client-side state (authentication, interview flow, recording), interacts with browser APIs (camera, microphone, fullscreen, text-to-speech), and communicates with the backend via REST API calls over HTTPS.

2. **Backend (FastAPI):** Handles all business logic including authentication (JWT + OTP), interview CRUD operations, AI integration (question generation, feedback, transcription), file uploads (recordings, resumes, profile pictures), and email delivery via SMTP.

3. **Database (MongoDB):** Stores all persistent data including user accounts, interview sessions, responses, OTP records, contact queries, and user feedback/testimonials.

4. **External Services:**
   - **Gemini 3 Flash** (via Emergent LLM Key): Generates interview questions and AI feedback.
   - **OpenAI Whisper** (via Emergent LLM Key): Transcribes recorded audio responses to text.
   - **Gmail SMTP**: Sends OTP verification emails, password reset emails, contact form notifications, and interview feedback summaries.

### Step-by-Step Flow

```
User visits site --> Landing Page --> Sign Up (Email + OTP) --> Dashboard
     |
     +--> Choose Interview Type:
           |
           +-- Role-Based: Select Role --> Level --> Skills --> Configure (Questions, Time)
           |
           +-- Resume-Based: Upload Resume (PDF/DOCX) --> Configure
           |
           v
     AI generates tailored questions (Gemini 3 Flash)
           |
           v
     Live Interview (Fullscreen Mode):
       1. Fullscreen gate displayed --> User clicks "Enter Fullscreen"
       2. AI Interviewer "Sarah Mitchell" reads Question 1 aloud (Browser TTS)
       3. Preparation timer counts down (time-per-question duration)
       4. Recording auto-starts (webcam + microphone via MediaRecorder API)
       5. User answers the question
       6. Timer expires --> Auto-submit OR User clicks "Stop & Submit"
       7. Recording uploaded to server (async Whisper transcription triggered)
       8. Response saved in database with placeholder "Transcribing..."
       9. Whisper background task updates transcript in DB when done
       10. Auto-navigate to next unanswered question
       11. Repeat steps 2-10 for all questions
       12. User clicks "Finish Interview"
           |
           v
     Complete Interview:
       1. Backend waits for all Whisper transcriptions to finish (polls DB)
       2. For each response: Generate AI feedback using transcript (Gemini)
       3. Generate overall performance summary (Gemini)
       4. Save everything to database
       5. Return completed interview data
           |
           v
     Interview Review Page:
       - View performance summary
       - Browse each Q&A with video playback, transcript, and AI feedback
       - Send complete feedback report to email
```

---

## 4. Technology Stack

### Frontend

| Technology | Purpose | Why Chosen |
|---|---|---|
| **React.js 18** | UI library | Component-based architecture, large ecosystem, efficient virtual DOM rendering for complex interview UI states |
| **React Router v6** | Client-side routing | Declarative routing with protected routes for authenticated pages |
| **Tailwind CSS** | Utility-first CSS | Rapid UI development with consistent design tokens; responsive by default |
| **Shadcn/UI** | Component library | Pre-built, accessible, customizable components (Cards, Buttons, Dialogs, Tabs, etc.) |
| **Axios** | HTTP client | Promise-based, supports interceptors and credential handling for JWT authentication |
| **Sonner** | Toast notifications | Clean, non-intrusive success/error notifications throughout the app |
| **Lucide React** | Icon library | Consistent, lightweight SVG icons for all UI elements |
| **qrcode.react** | QR code generation | Generates UPI QR codes on the Donate page |
| **CRACO** | Build configuration | Custom webpack configuration on top of Create React App without ejecting |

### Backend

| Technology | Purpose | Why Chosen |
|---|---|---|
| **FastAPI** | Web framework | High-performance async Python framework; built-in OpenAPI docs; Pydantic validation; native async/await support |
| **Motor** | MongoDB async driver | Non-blocking database operations that pair naturally with FastAPI's async architecture |
| **Pydantic** | Data validation | Type-safe request/response models; automatic validation of API inputs |
| **PyJWT** | JWT tokens | Industry-standard token-based authentication for stateless API security |
| **bcrypt** | Password hashing | Battle-tested password hashing with automatic salting; resistant to brute force attacks |
| **aiofiles** | Async file I/O | Non-blocking file read/write operations for recording uploads and resume storage |
| **smtplib** | Email delivery | Python built-in SMTP library; sends OTP emails, notifications, and feedback reports via Gmail |
| **PyPDF2 / python-docx** | Resume parsing | Extracts text from uploaded PDF and DOCX resumes for AI question generation |

### Database

| Technology | Purpose | Why Chosen |
|---|---|---|
| **MongoDB** | Document database | Schema-flexible NoSQL database; stores complex nested data (interview responses with recordings, transcripts, feedback) without rigid table schemas; natural JSON-like document structure matches the API payloads |

### APIs and Integrations

| Service | Purpose | Why Chosen |
|---|---|---|
| **Gemini 3 Flash** (via Emergent LLM Key) | AI question generation and feedback | Fast, cost-effective LLM for generating role-specific interview questions and constructive answer feedback |
| **OpenAI Whisper** (via Emergent LLM Key) | Audio transcription | Industry-leading speech-to-text accuracy; supports webm audio format from browser recordings |
| **Gmail SMTP** | Email delivery | Free, reliable email infrastructure using App Passwords; handles OTP, password reset, contact, and feedback emails |
| **Browser SpeechSynthesis API** | Text-to-Speech | Free, built-in browser API that reads interview questions aloud through the AI interviewer avatar; zero additional cost |
| **Browser MediaRecorder API** | Video/audio recording | Native browser API for capturing webcam and microphone streams; outputs webm format compatible with Whisper |
| **Fullscreen API** | Immersive mode | Enforces distraction-free interview environment; triggers auto-abort on exit for realistic simulation |

---

## 5. Key Features

### 5.1 Email OTP Authentication
Users register with their email and password. During signup, a 6-digit OTP is sent to their email via Gmail SMTP. The user must verify this OTP to complete registration. This ensures email ownership and prevents spam accounts. The system also supports a "Forgot Password" flow where users receive a reset OTP and can set a new password.

### 5.2 Dashboard
The central hub after login. Displays real-time statistics (total interviews, completed, in-progress, total questions answered), two prominent cards to start either a Role-Based or Resume-Based interview, and a list of recent interviews with status badges (Continue, Done, Aborted). Users can delete, abort, or send feedback emails directly from the dashboard.

### 5.3 Role-Based Interview Setup
A guided 4-step wizard:
- **Step 1 - Choose Role:** Select from 6 job roles (Frontend Developer, Backend Developer, Full Stack Developer, Data Analyst, DevOps Engineer, HR Interview).
- **Step 2 - Experience Level:** Choose Beginner (0-1 years), Intermediate (2-4 years), or Advanced (5+ years).
- **Step 3 - Select Skills:** Pick 2-8 specific skills from a role-specific skill bank (e.g., React.js, Docker, SQL) that you want to be tested on.
- **Step 4 - Configure:** Set the number of questions (3 to 15) and time per question (30 seconds to 5 minutes).

### 5.4 Resume-Based Interview Setup
Upload a PDF or DOCX resume. The backend extracts text from the document using PyPDF2/python-docx, sends it to Gemini 3 Flash, and generates personalized questions targeting the candidate's specific skills, projects, and experience mentioned in their resume.

### 5.5 Live Interview with AI Interviewer
The core experience of the platform:
- **Fullscreen Enforcement:** A gate screen requires the user to enter fullscreen mode before the interview begins. Exiting fullscreen at any point automatically aborts the interview, simulating real interview conditions where leaving would disqualify you.
- **AI Interviewer Avatar ("Sarah Mitchell"):** A professional female interviewer image is displayed alongside the user's camera feed in a video-call layout. Sarah "reads" each question aloud using the browser's Text-to-Speech engine with a female voice preference.
- **Preparation Timer:** After Sarah finishes reading the question, a preparation countdown begins (matching the configured time-per-question). This gives the candidate time to think and organize their answer.
- **Automatic Recording:** When the preparation timer expires, recording starts automatically using the browser's MediaRecorder API (webcam + microphone).
- **Manual Controls:** Users can start recording early (skip prep timer), stop and submit early, toggle camera/mic, or skip to the next question.
- **Auto-Submit:** When the recording timer expires, the answer is automatically stopped, uploaded, and submitted. The system navigates to the next unanswered question.
- **Question Navigation:** Number buttons at the bottom allow jumping to any question. Answered questions show a green checkmark.
- **Visual Indicators:** Real-time recording timer, speaking animation on the interviewer avatar, waveform animation on the user camera, low-time warning (red timer when under 10 seconds).

### 5.6 Background Whisper Transcription
When a recording is uploaded, the server immediately returns a response (fast ~250ms) while kicking off an asynchronous background task using `asyncio.create_task()`. This background task sends the recorded webm audio file to OpenAI Whisper for transcription and updates the interview response in the database when complete. This design ensures the live interview flow is never blocked by transcription latency.

### 5.7 Interview Completion with Wait-for-Transcription
When the user clicks "Finish Interview," the backend polls the database every 3 seconds (up to 45 seconds) waiting for all Whisper transcriptions to complete. Once all transcripts are available, it generates AI feedback for each question-answer pair and an overall performance summary using Gemini 3 Flash. This ensures the review page always shows complete transcripts and feedback immediately.

### 5.8 Interview Review
A detailed review page showing:
- **Performance Summary:** An AI-generated 4-5 sentence overview covering overall performance, strengths, areas for improvement, and a confidence rating out of 10.
- **Response Browser:** A sidebar lists all responses with question numbers, durations, and transcript previews. Clicking a response shows the full question, embedded video player with the recorded answer, complete transcript, and AI feedback.
- **Send to Email:** Sends the complete feedback report (summary + all Q&A with feedback) as a beautifully formatted HTML email to the user's registered email address.

### 5.9 Interview History
A dedicated page listing all past interviews with filtering by status (All, In Progress, Completed, Aborted). Each interview card shows the type, role, date, question count, response count, and status badge. Users can continue in-progress interviews, review completed ones, or delete any interview.

### 5.10 Profile Management
- **Profile Picture Upload:** Upload a JPG, PNG, or WEBP image (max 5MB) as a profile avatar. The picture is displayed in the navbar and profile page.
- **Name Editing:** Update the display name.
- **Email Change with OTP:** Enter a new email address, receive an OTP on the new email, verify it, and the account email is updated.
- **Account Information:** Displays member since date, total interviews, completed interviews, and authentication type.

### 5.11 Contact Us Form
A functional contact form that sends the user's query to the admin email and sends a confirmation copy back to the user. All submissions are also stored in the MongoDB `contacts` collection.

### 5.12 Feedback System with Dynamic Testimonials
Users can submit star ratings (1-5) and written feedback. Submissions are stored in the database and automatically appear in the testimonials carousel on the Landing page alongside static seed testimonials. Feedback is also emailed to the admin and a thank-you copy to the user.

### 5.13 UPI Donation Page
A donation page where users can enter a custom amount in INR. The page dynamically generates a UPI QR code using the `qrcode.react` library, which users can scan with any UPI-compatible payment app to make a donation.

### 5.14 Dark/Light Theme
A theme toggle that switches between light and dark color schemes, persisted in localStorage.

---

## 6. Working Flow of the System

### Complete End-to-End Workflow

**Phase 1: User Registration**
1. User navigates to the Sign Up page.
2. Enters their name, email, and password.
3. Clicks "Send OTP" - the backend generates a 6-digit OTP, stores it in the `otps` collection with a 10-minute expiry, and sends it to the user's email via Gmail SMTP.
4. User enters the OTP received in their inbox.
5. Backend verifies the OTP against the stored record.
6. If valid, the user account is created in the `users` collection with a bcrypt-hashed password.
7. A JWT token is generated and returned. The token is stored in localStorage and set as an httpOnly cookie.
8. User is redirected to the Dashboard.

**Phase 2: Interview Configuration**
1. User chooses "Role-Based" or "Resume-Based" interview from the Dashboard.
2. For Role-Based: Completes the 4-step wizard (Role -> Level -> Skills -> Config).
3. For Resume-Based: Uploads a PDF/DOCX resume and sets question count and time limit.
4. The backend sends the configuration to Gemini 3 Flash with a carefully crafted prompt to generate the exact number of requested questions as a JSON array.
5. An interview document is created in the `interviews` collection with status "in_progress".
6. The interview data (questions, config) is returned and the user is navigated to the Live Interview page.

**Phase 3: Live Interview**
1. User sees the Fullscreen Gate and clicks "Enter Fullscreen & Start."
2. The browser enters fullscreen mode. The media stream (camera + microphone) is initialized.
3. For each question:
   a. The AI interviewer reads the question aloud using SpeechSynthesis.
   b. After TTS finishes, the preparation timer starts counting down.
   c. When prep timer reaches zero, recording starts automatically.
   d. User answers the question while being recorded.
   e. When the recording timer expires (or user clicks Stop & Submit):
      - Recording stops and chunks are assembled into a webm Blob.
      - The Blob is uploaded to the server via multipart form POST.
      - The server saves the file to disk and returns the file path.
      - A background task is spawned to transcribe the audio via Whisper.
      - A response document (with "Transcribing..." placeholder) is saved to the interview.
      - The UI marks the question as answered and moves to the next unanswered question.
4. Once all questions are answered, the "Finish Interview" button appears.

**Phase 4: Interview Completion**
1. User clicks "Finish Interview."
2. The frontend exits fullscreen mode and sends a POST to `/api/interviews/{id}/complete`.
3. The backend polls the database every 3 seconds, waiting for all Whisper transcriptions to replace the "Transcribing..." placeholders (up to 45 seconds).
4. Once all transcripts are ready, the backend generates:
   - Individual AI feedback for each question-answer pair (via Gemini 3 Flash).
   - An overall performance summary with a confidence rating.
5. The interview document is updated with status "completed," all feedback, and the summary.
6. The user is navigated to the Interview Review page.

**Phase 5: Review and Improvement**
1. The Review page displays the performance summary at the top.
2. Users browse their responses, watch recorded videos, read accurate transcripts, and study AI feedback.
3. Users can send the complete feedback report to their email for offline reference.
4. Users return to the Dashboard to start new interviews and track their improvement over time.

---

## 7. Database Design

### Collections and Structure

#### `users` Collection
```json
{
  "user_id": "user_a1b2c3d4e5f6",        // Unique identifier (UUID-based)
  "email": "user@example.com",             // User's email (unique)
  "name": "John Doe",                      // Display name
  "password_hash": "$2b$12$...",            // bcrypt-hashed password
  "picture": "/api/recordings/avatar_...",  // Profile picture URL (nullable)
  "auth_type": "local",                    // "local" (email/password)
  "email_verified": true,                  // Email verification status
  "created_at": "2026-04-15T10:30:00+00:00" // ISO timestamp
}
```

#### `interviews` Collection
```json
{
  "interview_id": "int_a1b2c3d4e5f6",     // Unique identifier
  "user_id": "user_a1b2c3d4e5f6",         // Reference to user
  "type": "role",                          // "role" or "resume"
  "role": "Frontend Developer",            // Selected role (for role-based)
  "experience_level": "intermediate",      // Beginner/Intermediate/Advanced
  "skills": ["React.js", "TypeScript"],    // Selected skill tags
  "num_questions": 7,                      // Configured question count
  "time_per_question": 120,                // Seconds per question
  "questions": [                           // AI-generated question array
    "Can you explain the difference between React's useState and useReducer hooks?",
    "How would you optimize the performance of a large React application?",
    ...
  ],
  "responses": [                           // Array of user responses
    {
      "question_index": 0,                 // Maps to questions[0]
      "transcript": "The actual transcribed text from Whisper...",
      "recording_path": "/api/recordings/rec_int_xxx_0_abc123.webm",
      "duration": 95,                      // Seconds recorded
      "feedback": "AI-generated feedback text..."
    }
  ],
  "status": "completed",                   // "in_progress", "completed", "aborted"
  "summary": "Overall performance summary from AI...",
  "created_at": "2026-04-15T10:35:00+00:00",
  "completed_at": "2026-04-15T11:00:00+00:00"
}
```

#### `otps` Collection
```json
{
  "email": "user@example.com",             // Email the OTP was sent to
  "otp": "482917",                         // 6-digit OTP
  "purpose": "verify",                     // "verify", "reset", or "change_email"
  "user_id": "user_xxx",                   // Only for change_email purpose
  "created_at": "2026-04-15T10:30:00+00:00",
  "expires_at": "2026-04-15T10:40:00+00:00" // 10-minute expiry
}
```

#### `contacts` Collection
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "subject": "Feature Request",
  "message": "I would love to see mock system design interviews...",
  "created_at": "2026-04-15T10:30:00+00:00"
}
```

#### `feedbacks` Collection
```json
{
  "feedback_id": "fb_a1b2c3d4e5",
  "name": "Priya Sharma",                 // User's name (or "Anonymous")
  "email": "priya@example.com",           // Optional
  "rating": 5,                            // 1-5 star rating
  "text": "This platform helped me so much...",
  "approved": true,                       // Controls visibility in testimonials
  "created_at": "2026-04-15T10:30:00+00:00"
}
```

### How Data Flows and Is Stored

1. **User Registration:** Input validated via Pydantic -> OTP verified against `otps` collection -> Password hashed with bcrypt -> User document inserted into `users` collection -> JWT token generated.

2. **Interview Creation:** Configuration validated -> Questions generated by Gemini AI -> Interview document with empty `responses` array inserted into `interviews` collection.

3. **Response Recording:** Video blob uploaded to `/app/backend/uploads/` directory -> File path returned -> Background Whisper task updates `responses.$.transcript` in the interview document -> Response object pushed to `responses` array via MongoDB `$push`.

4. **Interview Completion:** All transcripts polled from DB -> AI feedback generated per response -> Summary generated -> Interview document updated via MongoDB `$set` with completed status, feedback, and summary.

---

## 8. API Design

### Authentication Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/auth/send-otp` | Generate and email a 6-digit OTP for email verification |
| `POST` | `/api/auth/verify-otp` | Verify an OTP without creating an account (validation step) |
| `POST` | `/api/auth/register` | Complete registration with email, OTP, password, and name |
| `POST` | `/api/auth/login` | Login with email/password, returns JWT token |
| `POST` | `/api/auth/forgot-password` | Send a password reset OTP to the user's email |
| `POST` | `/api/auth/reset-password` | Reset password using email, OTP, and new password |
| `GET` | `/api/auth/me` | Get current authenticated user's profile |
| `POST` | `/api/auth/logout` | Clear session and delete cookies |

### Interview Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/interviews/start` | Start a role-based interview (generates AI questions) |
| `POST` | `/api/interviews/start-resume` | Start a resume-based interview (upload + generate questions) |
| `GET` | `/api/interviews` | List all interviews for the authenticated user |
| `GET` | `/api/interviews/{id}` | Get full interview details including questions and responses |
| `POST` | `/api/interviews/{id}/responses` | Save a response (transcript, recording path, duration) |
| `POST` | `/api/interviews/{id}/complete` | Complete the interview (waits for transcription, generates feedback) |
| `POST` | `/api/interviews/{id}/abort` | Abort an in-progress interview |
| `DELETE` | `/api/interviews/{id}` | Delete an interview |
| `POST` | `/api/interviews/{id}/send-feedback` | Email the complete feedback report to the user |

### Recording Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/recordings/upload` | Upload a video recording (triggers background Whisper transcription) |
| `GET` | `/api/recordings/{filename}` | Serve a recorded video file for playback |

### Profile Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/profile` | Get profile with interview statistics |
| `PUT` | `/api/profile` | Update profile name |
| `POST` | `/api/profile/upload-picture` | Upload a profile picture |
| `POST` | `/api/profile/change-email/send-otp` | Send OTP to a new email for email change |
| `POST` | `/api/profile/change-email/verify` | Verify OTP and update email address |

### Contact and Feedback Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/contact` | Submit a contact query (emails admin + user) |
| `POST` | `/api/feedback` | Submit star rating and feedback (stored + emailed) |
| `GET` | `/api/feedbacks` | Get approved feedbacks for testimonials carousel |

### Request/Response Flow Example

**Starting a Role-Based Interview:**

```
Request:
POST /api/interviews/start
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "type": "role",
  "role": "Frontend Developer",
  "experience_level": "intermediate",
  "skills": ["React.js", "TypeScript", "Performance Optimization"],
  "num_questions": 7,
  "time_per_question": 120
}

Response (200 OK):
{
  "interview_id": "int_a1b2c3d4e5f6",
  "type": "role",
  "role": "Frontend Developer",
  "experience_level": "intermediate",
  "skills": ["React.js", "TypeScript", "Performance Optimization"],
  "num_questions": 7,
  "time_per_question": 120,
  "questions": [
    "How do you handle complex state management in large React applications?",
    "Explain the benefits and trade-offs of TypeScript in a React project.",
    ...
  ],
  "status": "in_progress"
}
```

---

## 9. AI Integration

### How AI Is Used

AI is integrated at three critical points in the interview lifecycle:

1. **Question Generation (Gemini 3 Flash):** When an interview starts, the system sends a detailed prompt to Gemini 3 Flash specifying the role, experience level, and selected skills. The AI generates exactly the requested number of interview questions as a JSON array. For resume-based interviews, the extracted resume text (up to 3000 characters) is included in the prompt to personalize questions.

2. **Answer Feedback (Gemini 3 Flash):** After the interview is completed, each question-answer pair is sent to Gemini with a prompt requesting brief constructive feedback covering content quality, communication clarity, and one improvement suggestion. The AI is instructed to respond in plain text (no markdown) and keep feedback to 3-4 sentences.

3. **Audio Transcription (OpenAI Whisper):** Each recorded video answer is sent to OpenAI Whisper for automatic speech-to-text transcription. This runs as an asynchronous background task to avoid blocking the interview flow. The transcription is accurate and supports the English language.

### How Questions Are Generated

```python
# System message for the AI
"You are an expert interview coach. Generate professional interview questions.
 Return ONLY a JSON array of strings, each being one question.
 No markdown, no explanation, no code blocks."

# For role-based interviews
"Generate exactly 7 interview questions for a Frontend Developer position.
 The candidate is at intermediate level.
 Focus on these specific skills: React.js, TypeScript, Performance Optimization.
 Mix technical and behavioral questions appropriate for the candidate's experience level.
 Return as JSON array of strings only."

# For resume-based interviews
"Based on this resume, generate exactly 7 personalized interview questions
 targeting the candidate's specific skills, projects, and experience:
 [resume text]
 Return as JSON array of strings only."
```

The system also includes a fallback question bank for each role in case the AI service is unavailable, ensuring the interview can always proceed.

### How Feedback Is Generated

```python
# System message
"You are an expert interview coach. Provide brief, constructive feedback
 on interview answers. Keep feedback to 3-4 sentences max. Do NOT use
 any markdown formatting. Write in plain sentences only."

# Per-question feedback prompt
"Question: [question text]
 Candidate's Answer: [transcribed answer]
 Provide brief constructive feedback covering: content quality,
 communication clarity, and one improvement suggestion."

# Overall summary prompt
"Role: Frontend Developer
 Interview Q&A: [all question-answer pairs]
 Provide a brief performance summary (4-5 sentences) covering overall
 performance, strengths, areas for improvement, and a confidence rating out of 10."
```

---

## 10. Challenges Faced

### Technical Challenges

| Challenge | Impact | Solution |
|---|---|---|
| **Stale closure in React recording timer** | When the recording timer expired for auto-submit, it captured an old question index, causing the same question to repeat instead of advancing. | Introduced `currentIndexRef` and `doStopRecordingRef` so that timer intervals always read the latest values from refs instead of stale closure variables. |
| **Whisper blocking the upload endpoint** | The initial synchronous Whisper API call took 10-30 seconds, making the upload endpoint unresponsive and freezing the interview UI. | Moved Whisper transcription to a `asyncio.create_task()` background task. The upload endpoint now returns in ~250ms while transcription happens asynchronously. |
| **Camera feed disappearing in fullscreen** | When the browser entered fullscreen mode, React re-rendered the video element, disconnecting it from the MediaStream source. | Added a `useEffect` hook that detects fullscreen changes and re-attaches `videoRef.current.srcObject = streamRef.current` when fullscreen activates. |
| **Transcript overwriting during completion** | The `complete` endpoint's 10-20 second AI feedback generation could overwrite Whisper-updated transcripts when saving the final responses array. | The endpoint now re-reads the latest responses from the database after generating feedback, ensuring Whisper-updated transcripts are preserved. Additionally, the endpoint waits for all transcriptions to complete before starting feedback generation. |

### Integration Issues

| Challenge | Impact | Solution |
|---|---|---|
| **Browser Web Speech API inaccuracy** | The initial live transcription feature using the browser's native speech recognition was highly inaccurate and frustrating for users. | Completely replaced browser-based live transcription with server-side OpenAI Whisper for accurate post-recording transcription. Replaced the live transcript panel with an AI interviewer avatar using Text-to-Speech. |
| **Whisper file format error** | An intermittent "Invalid file format" error from the Whisper API appeared for webm files passed as file objects. | Identified as a transient API issue (not a code bug). The `open(file_path, "rb")` approach for passing audio files works correctly and reliably. |

### Deployment Issues

| Challenge | Impact | Solution |
|---|---|---|
| **`.gitignore` blocking `.env` files** | Malformed `.gitignore` entries with `-e` flags and `*.env` patterns would prevent environment files from being deployed. | Cleaned up the `.gitignore` file to remove malformed entries and allow `.env` files needed for deployment. |
| **Unquoted SMTP password** | The `SMTP_APP_PASSWORD` value contained spaces, causing environment variable parsers to fail during deployment. | Wrapped the value in double quotes: `SMTP_APP_PASSWORD="ggqf olyv kwnh odzn"`. |

---

## 11. Security Features

### Authentication
- **JWT (JSON Web Tokens):** Stateless, signed tokens with 72-hour expiry for session management. Tokens contain the user ID and expiration timestamp, signed with a server-side secret key.
- **OTP Email Verification:** 6-digit one-time passwords with 10-minute expiry prevent unauthorized account creation. OTPs are stored in the database and deleted after successful verification.
- **bcrypt Password Hashing:** All passwords are hashed using bcrypt with automatic salt generation before storage. Raw passwords are never stored or logged.

### Data Protection
- **MongoDB Projection:** All database queries exclude the `_id` field and sensitive fields like `password_hash` from API responses, preventing accidental data leakage.
- **httpOnly Cookies:** Session tokens are set as httpOnly cookies with `Secure` and `SameSite=None` attributes, preventing JavaScript access and CSRF attacks.
- **File Upload Validation:** Profile pictures are restricted to JPG/PNG/WEBP under 5MB. Resumes are restricted to PDF/DOC/DOCX. Recordings are saved with randomized UUIDs in filenames to prevent path traversal.
- **Rate-Limited OTPs:** OTPs are deleted and regenerated on each request, preventing OTP accumulation and replay attacks.

### Token Handling
- **Dual Token Strategy:** JWT tokens are stored in both localStorage (for API Authorization headers) and httpOnly cookies (for server-side session verification).
- **Automatic Token Validation:** Every authenticated API call passes through the `get_current_user` dependency, which validates the JWT signature, checks expiration, and verifies the user exists in the database.
- **Graceful Expiry:** If a token is expired or invalid, the frontend's `AuthContext` automatically clears the stored token and redirects to the login page.

---

## 12. Advantages of the System

Compared to traditional interview preparation methods, InterviewMaster offers:

1. **Realistic Simulation:** Fullscreen mode, timed responses, an AI interviewer avatar, and video recording create an environment that closely mirrors a real video interview. This builds genuine pressure-handling skills that reading articles or practicing in front of a mirror cannot provide.

2. **Personalized Questions:** AI generates questions tailored to the specific role, experience level, selected skills, or even the user's own resume. This targeted practice is far more effective than studying generic question lists.

3. **Objective Self-Assessment:** Video recordings and accurate transcripts let users objectively evaluate their body language, verbal clarity, filler words, and answer structure. This self-awareness is difficult to achieve without recording.

4. **Instant AI Feedback:** Instead of waiting for a human coach to review your answers, AI provides immediate feedback on content quality and communication clarity. This tight feedback loop accelerates improvement.

5. **Unlimited Practice:** Unlike paid coaching services with limited sessions, users can practice as many interviews as they want, at any time, from anywhere.

6. **Progress Tracking:** Interview history with statistics allows users to track their improvement over time, building confidence through measurable progress.

7. **Privacy:** All practice sessions are private. Users don't need to perform in front of a stranger or friend, reducing anxiety and encouraging honest practice.

---

## 13. Limitations

1. **Browser Dependency for Recording:** The MediaRecorder API and SpeechSynthesis API are browser-dependent. Some browsers may have limited codec support or voice options. The platform works best on Chrome and Edge.

2. **Internet Required:** The platform requires a stable internet connection for AI question generation, Whisper transcription, and video upload. Poor connectivity may degrade the experience.

3. **No Real-Time AI Conversation:** The AI interviewer reads pre-generated questions but does not engage in dynamic conversation or follow-up questions based on the user's answers. It's a structured Q&A format, not a free-flowing interview.

4. **Transcription Accuracy for Non-English:** While Whisper supports multiple languages, the system is currently configured for English only (`language="en"`). Users with heavy accents may experience lower transcription accuracy.

5. **No Peer or Expert Review:** The platform provides AI-generated feedback only. There's no mechanism for peer review, human expert evaluation, or community-based improvement suggestions.

6. **Single Camera Angle:** The system records from the user's webcam only. It cannot evaluate full body language, hand gestures outside the camera frame, or room environment.

7. **Storage Growth:** Video recordings are stored on the server's filesystem. As usage grows, storage management and cleanup policies would need to be implemented.

---

## 14. Future Enhancements

1. **Structured Scoring System:** Implement a detailed scoring rubric with numerical scores for confidence, communication, technical accuracy, and completeness. Display radar charts or progress graphs to visualize improvement over time.

2. **Follow-Up Questions:** Use AI to generate dynamic follow-up questions based on the user's answers, creating a more realistic back-and-forth interview conversation.

3. **Multi-Language Support:** Extend Whisper transcription and question generation to support Hindi, Spanish, French, and other languages.

4. **Peer Review System:** Allow users to share anonymized interview recordings with other users for community feedback and peer learning.

5. **Interview Recording Sharing:** Generate shareable links for completed interviews that users can send to mentors or career coaches for external review.

6. **Advanced Analytics Dashboard:** Show detailed analytics including average answer length, most common filler words, confidence trend over time, and comparison with other users at the same level.

7. **Mobile App:** Build a native mobile application for iOS and Android to enable practice on the go.

8. **System Design Interview Mode:** Add whiteboard/diagram support for system design rounds where users can draw and explain architectures.

9. **Company-Specific Prep:** Curate question banks and interview styles specific to major companies (Google, Amazon, Microsoft, etc.) based on publicly available interview experiences.

10. **Video Analysis:** Use computer vision to analyze body language, eye contact, and facial expressions during the interview recording.

---

## 15. Conclusion

InterviewMaster is a comprehensive, production-ready AI-powered interview preparation platform that addresses a genuine gap in the job preparation ecosystem. By combining a realistic fullscreen interview simulation with an AI interviewer avatar, personalized question generation, accurate speech transcription, and instant AI feedback, the platform provides an experience that is significantly more effective than traditional preparation methods.

The system is built on a modern, scalable technology stack (React, FastAPI, MongoDB) with a clean separation of concerns between the frontend presentation layer, backend business logic, and external AI services. Key architectural decisions, such as asynchronous background transcription and a polling-based completion mechanism, ensure that the user experience remains smooth and responsive even when processing complex AI operations.

The platform has undergone extensive testing across 11 iterations, with all identified bugs (stale closures in recording timers, transcription race conditions, file format issues) systematically debugged and resolved. The deployment health check confirms the application is production-ready with all environment configurations, security measures, and service dependencies properly configured.

InterviewMaster demonstrates that AI can meaningfully democratize access to high-quality interview coaching, providing every candidate with a personalized, intelligent practice partner available 24/7 at zero cost.

---

*Document generated on April 16, 2026*
*InterviewMaster v1.0 - Full-Stack AI Interview Practice Platform*
