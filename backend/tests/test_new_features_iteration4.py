"""
Backend API tests for Interview Platform - Iteration 4
Tests for 5 new features:
1. Resume interview with configurable num_questions and time_per_question
2. Recording upload with Whisper transcript field
3. Footer cleanup (frontend only)
4. Login/Signup back buttons (frontend only)
5. Auto-navigate to next unanswered question (frontend only)
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://mock-interview-coach-1.preview.emergentagent.com')

class TestHealthCheck:
    """API health check"""
    
    def test_api_is_running(self):
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "running"
        print("✅ API health check passed")


class TestAuthentication:
    """Authentication tests"""
    
    @pytest.fixture
    def session(self):
        return requests.Session()
    
    def test_login_success(self, session):
        """Test login with valid credentials"""
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@test.com",
            "password": "test123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert data["email"] == "test@test.com"
        print("✅ Login successful")
        return data["token"]


class TestResumeInterviewWithConfig:
    """Tests for resume interview with configurable settings (Feature 1)"""
    
    @pytest.fixture
    def auth_headers(self):
        """Get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@test.com",
            "password": "test123"
        })
        token = response.json()["token"]
        return {"Authorization": f"Bearer {token}"}
    
    @pytest.fixture
    def test_resume_file(self, tmp_path):
        """Create a minimal test PDF file"""
        pdf_content = b"""%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >> endobj
xref
0 4
trailer << /Size 4 /Root 1 0 R >>
startxref
100
%%EOF"""
        pdf_file = tmp_path / "test_resume.pdf"
        pdf_file.write_bytes(pdf_content)
        return pdf_file
    
    def test_resume_interview_with_custom_questions_count(self, auth_headers, test_resume_file):
        """Test POST /api/interviews/start-resume with num_questions parameter"""
        with open(test_resume_file, "rb") as f:
            response = requests.post(
                f"{BASE_URL}/api/interviews/start-resume",
                headers=auth_headers,
                files={"file": ("resume.pdf", f, "application/pdf")},
                data={"num_questions": "5", "time_per_question": "120"}
            )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify num_questions is correctly set
        assert data["num_questions"] == 5, f"Expected 5 questions, got {data['num_questions']}"
        assert len(data["questions"]) == 5, f"Expected 5 questions, got {len(data['questions'])}"
        print("✅ Resume interview respects num_questions=5")
    
    def test_resume_interview_with_custom_time_per_question(self, auth_headers, test_resume_file):
        """Test POST /api/interviews/start-resume with time_per_question parameter"""
        with open(test_resume_file, "rb") as f:
            response = requests.post(
                f"{BASE_URL}/api/interviews/start-resume",
                headers=auth_headers,
                files={"file": ("resume.pdf", f, "application/pdf")},
                data={"num_questions": "3", "time_per_question": "90"}
            )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify time_per_question is correctly set
        assert data["time_per_question"] == 90, f"Expected 90 seconds, got {data['time_per_question']}"
        print("✅ Resume interview respects time_per_question=90")
    
    def test_resume_interview_default_values(self, auth_headers, test_resume_file):
        """Test POST /api/interviews/start-resume with default values"""
        with open(test_resume_file, "rb") as f:
            response = requests.post(
                f"{BASE_URL}/api/interviews/start-resume",
                headers=auth_headers,
                files={"file": ("resume.pdf", f, "application/pdf")}
                # No num_questions or time_per_question - should use defaults
            )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify defaults (num_questions=7, time_per_question=120)
        assert data["num_questions"] == 7, f"Expected default 7 questions, got {data['num_questions']}"
        assert data["time_per_question"] == 120, f"Expected default 120 seconds, got {data['time_per_question']}"
        print("✅ Resume interview uses correct defaults")


class TestRecordingUploadWithWhisperTranscript:
    """Tests for recording upload with Whisper transcript (Feature 2)"""
    
    @pytest.fixture
    def auth_headers(self):
        """Get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@test.com",
            "password": "test123"
        })
        token = response.json()["token"]
        return {"Authorization": f"Bearer {token}"}
    
    @pytest.fixture
    def interview_id(self, auth_headers):
        """Create an interview for testing"""
        response = requests.post(
            f"{BASE_URL}/api/interviews/start",
            headers=auth_headers,
            json={"type": "role", "role": "Frontend Developer", "num_questions": 3}
        )
        return response.json()["interview_id"]
    
    def test_recording_upload_returns_transcript_field(self, auth_headers, interview_id):
        """Test POST /api/recordings/upload returns transcript field"""
        # Create a minimal audio file (will fail Whisper but should return null gracefully)
        audio_content = b'\x00' * 100  # Minimal binary content
        
        response = requests.post(
            f"{BASE_URL}/api/recordings/upload",
            headers=auth_headers,
            files={"file": ("recording.webm", audio_content, "video/webm")},
            data={"interview_id": interview_id, "question_index": "0"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify transcript field exists in response (even if null)
        assert "transcript" in data, "Response must include 'transcript' field"
        assert "recording_path" in data
        assert "filename" in data
        print(f"✅ Recording upload returns transcript field (value: {data['transcript']})")


class TestExistingFeaturesRegression:
    """Regression tests for existing features"""
    
    @pytest.fixture
    def auth_headers(self):
        """Get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@test.com",
            "password": "test123"
        })
        token = response.json()["token"]
        return {"Authorization": f"Bearer {token}"}
    
    def test_role_interview_start(self, auth_headers):
        """Test POST /api/interviews/start still works"""
        response = requests.post(
            f"{BASE_URL}/api/interviews/start",
            headers=auth_headers,
            json={
                "type": "role",
                "role": "Backend Developer",
                "experience_level": "Mid",
                "num_questions": 5,
                "time_per_question": 120
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["type"] == "role"
        assert data["role"] == "Backend Developer"
        print("✅ Role interview start still works")
    
    def test_interviews_list(self, auth_headers):
        """Test GET /api/interviews still works"""
        response = requests.get(f"{BASE_URL}/api/interviews", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Interviews list returns {len(data)} interviews")
    
    def test_profile_endpoint(self, auth_headers):
        """Test GET /api/profile still works"""
        response = requests.get(f"{BASE_URL}/api/profile", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "email" in data
        assert "name" in data
        assert "total_interviews" in data
        print("✅ Profile endpoint still works")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
