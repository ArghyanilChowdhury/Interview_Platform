"""
Iteration 10 Backend Tests - Performance Fix Testing
Key change: /api/recordings/upload now returns QUICKLY (no Whisper blocking)
- Returns only recording_path and filename (NO transcript field)
- Whisper runs in background asyncio task and updates DB asynchronously

Tests cover:
1. Auth endpoints (send-otp, verify-otp, register, login, forgot-password)
2. Interview endpoints (start, responses, complete, delete, abort)
3. Recording upload (FAST response, no transcript field)
4. Contact and Feedback endpoints
5. Profile endpoints
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    BASE_URL = "https://mock-interview-coach-1.preview.emergentagent.com"

# Test credentials - created via mongosh
TEST_EMAIL = "test@example.com"
TEST_PASSWORD = "test123"
TEST_NAME = "Test User Iter10"


class TestHealthCheck:
    """Basic API health check"""
    
    def test_api_health(self):
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "running"
        print("✓ API health check passed")


class TestAuthEndpoints:
    """Authentication endpoint tests"""
    
    def test_send_otp(self):
        """POST /api/auth/send-otp sends OTP to email"""
        response = requests.post(f"{BASE_URL}/api/auth/send-otp", json={
            "email": "otp_test_iter10@example.com"
        })
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "OTP sent" in data["message"]
        print("✓ POST /api/auth/send-otp - OTP sent successfully")
    
    def test_verify_otp_invalid(self):
        """POST /api/auth/verify-otp rejects invalid OTP"""
        response = requests.post(f"{BASE_URL}/api/auth/verify-otp", json={
            "email": "nonexistent@example.com",
            "otp": "000000"
        })
        assert response.status_code == 400
        data = response.json()
        assert "Invalid OTP" in data.get("detail", "")
        print("✓ POST /api/auth/verify-otp - Invalid OTP rejected")
    
    def test_register_without_otp(self):
        """POST /api/auth/register requires valid OTP"""
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": "newuser@example.com",
            "otp": "000000",
            "password": "password123",
            "name": "New User"
        })
        assert response.status_code == 400
        data = response.json()
        assert "Invalid OTP" in data.get("detail", "") or "verify" in data.get("detail", "").lower()
        print("✓ POST /api/auth/register - Requires valid OTP")
    
    def test_login_success(self):
        """POST /api/auth/login returns token for valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user_id" in data
        assert data["email"] == TEST_EMAIL
        print(f"✓ POST /api/auth/login - Login successful, token received")
        return data["token"]
    
    def test_login_invalid_credentials(self):
        """POST /api/auth/login rejects invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("✓ POST /api/auth/login - Invalid credentials rejected (401)")
    
    def test_forgot_password(self):
        """POST /api/auth/forgot-password sends reset OTP"""
        response = requests.post(f"{BASE_URL}/api/auth/forgot-password", json={
            "email": TEST_EMAIL
        })
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        # Security: doesn't reveal if email exists
        print("✓ POST /api/auth/forgot-password - Reset OTP flow works")


class TestInterviewEndpoints:
    """Interview CRUD and workflow tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Authentication failed")
    
    @pytest.fixture
    def auth_headers(self, auth_token):
        """Get headers with auth token"""
        return {"Authorization": f"Bearer {auth_token}"}
    
    def test_start_interview_with_config(self, auth_headers):
        """POST /api/interviews/start creates interview with configurable num_questions and time_per_question"""
        response = requests.post(f"{BASE_URL}/api/interviews/start", json={
            "type": "role",
            "role": "Backend Developer",
            "experience_level": "mid",
            "skills": ["Python", "FastAPI"],
            "num_questions": 5,
            "time_per_question": 90
        }, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "interview_id" in data
        assert data["num_questions"] == 5
        assert data["time_per_question"] == 90
        assert data["status"] == "in_progress"
        assert len(data["questions"]) == 5
        print(f"✓ POST /api/interviews/start - Interview created with {data['num_questions']} questions, {data['time_per_question']}s per question")
        return data["interview_id"]
    
    def test_save_response(self, auth_headers):
        """POST /api/interviews/{id}/responses saves response"""
        # First create an interview
        create_resp = requests.post(f"{BASE_URL}/api/interviews/start", json={
            "type": "role",
            "role": "Frontend Developer",
            "num_questions": 3,
            "time_per_question": 60
        }, headers=auth_headers)
        assert create_resp.status_code == 200
        interview_id = create_resp.json()["interview_id"]
        
        # Save a response
        response = requests.post(f"{BASE_URL}/api/interviews/{interview_id}/responses", json={
            "question_index": 0,
            "transcript": "This is my test answer for question 1",
            "recording_path": "/api/recordings/test_recording.webm",
            "duration": 45
        }, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["question_index"] == 0
        print(f"✓ POST /api/interviews/{interview_id}/responses - Response saved")
        return interview_id
    
    def test_complete_interview_generates_feedback(self, auth_headers):
        """POST /api/interviews/{id}/complete generates AI feedback"""
        # Create interview
        create_resp = requests.post(f"{BASE_URL}/api/interviews/start", json={
            "type": "role",
            "role": "Data Analyst",
            "num_questions": 3,
            "time_per_question": 60
        }, headers=auth_headers)
        interview_id = create_resp.json()["interview_id"]
        
        # Save responses
        for i in range(3):
            requests.post(f"{BASE_URL}/api/interviews/{interview_id}/responses", json={
                "question_index": i,
                "transcript": f"My answer to question {i+1} about data analysis",
                "duration": 30
            }, headers=auth_headers)
        
        # Complete interview
        response = requests.post(f"{BASE_URL}/api/interviews/{interview_id}/complete", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "completed"
        assert data["summary"] is not None
        assert "completed_at" in data
        print(f"✓ POST /api/interviews/{interview_id}/complete - AI feedback generated")
        return interview_id
    
    def test_delete_interview(self, auth_headers):
        """DELETE /api/interviews/{id} deletes interview"""
        # Create interview
        create_resp = requests.post(f"{BASE_URL}/api/interviews/start", json={
            "type": "role",
            "role": "DevOps Engineer",
            "num_questions": 3
        }, headers=auth_headers)
        interview_id = create_resp.json()["interview_id"]
        
        # Delete it
        response = requests.delete(f"{BASE_URL}/api/interviews/{interview_id}", headers=auth_headers)
        assert response.status_code == 200
        
        # Verify it's gone
        get_resp = requests.get(f"{BASE_URL}/api/interviews/{interview_id}", headers=auth_headers)
        assert get_resp.status_code == 404
        print(f"✓ DELETE /api/interviews/{interview_id} - Interview deleted")
    
    def test_abort_interview(self, auth_headers):
        """POST /api/interviews/{id}/abort aborts interview"""
        # Create interview
        create_resp = requests.post(f"{BASE_URL}/api/interviews/start", json={
            "type": "role",
            "role": "HR Interview",
            "num_questions": 3
        }, headers=auth_headers)
        interview_id = create_resp.json()["interview_id"]
        
        # Abort it
        response = requests.post(f"{BASE_URL}/api/interviews/{interview_id}/abort", headers=auth_headers)
        assert response.status_code == 200
        
        # Verify status
        get_resp = requests.get(f"{BASE_URL}/api/interviews/{interview_id}", headers=auth_headers)
        assert get_resp.status_code == 200
        assert get_resp.json()["status"] == "aborted"
        print(f"✓ POST /api/interviews/{interview_id}/abort - Interview aborted")
    
    def test_send_feedback_email(self, auth_headers):
        """POST /api/interviews/{id}/send-feedback sends email"""
        # Create and complete interview
        create_resp = requests.post(f"{BASE_URL}/api/interviews/start", json={
            "type": "role",
            "role": "Full Stack Developer",
            "num_questions": 3
        }, headers=auth_headers)
        interview_id = create_resp.json()["interview_id"]
        
        # Save responses
        for i in range(3):
            requests.post(f"{BASE_URL}/api/interviews/{interview_id}/responses", json={
                "question_index": i,
                "transcript": f"Answer {i+1}",
                "duration": 20
            }, headers=auth_headers)
        
        # Complete
        requests.post(f"{BASE_URL}/api/interviews/{interview_id}/complete", headers=auth_headers)
        
        # Send feedback email
        response = requests.post(f"{BASE_URL}/api/interviews/{interview_id}/send-feedback", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✓ POST /api/interviews/{interview_id}/send-feedback - Email sent")


class TestRecordingUpload:
    """Recording upload tests - KEY PERFORMANCE FIX"""
    
    @pytest.fixture
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Authentication failed")
    
    @pytest.fixture
    def auth_headers(self, auth_token):
        return {"Authorization": f"Bearer {auth_token}"}
    
    def test_upload_returns_quickly_no_transcript(self, auth_headers):
        """
        POST /api/recordings/upload returns QUICKLY (no Whisper blocking)
        - Should return in <1 second (not 10-30s like before)
        - Response should have recording_path and filename ONLY
        - NO transcript field in response (Whisper runs in background)
        """
        # Create interview first
        create_resp = requests.post(f"{BASE_URL}/api/interviews/start", json={
            "type": "role",
            "role": "Backend Developer",
            "num_questions": 3
        }, headers=auth_headers)
        interview_id = create_resp.json()["interview_id"]
        
        # Create a small test audio file (webm format)
        test_audio_content = b'\x1a\x45\xdf\xa3' + b'\x00' * 100  # Minimal webm header
        
        # Measure upload time
        start_time = time.time()
        response = requests.post(
            f"{BASE_URL}/api/recordings/upload",
            files={"file": ("test_recording.webm", test_audio_content, "video/webm")},
            data={
                "interview_id": interview_id,
                "question_index": "0"
            },
            headers=auth_headers
        )
        elapsed_time = time.time() - start_time
        
        assert response.status_code == 200
        data = response.json()
        
        # KEY ASSERTIONS for performance fix:
        # 1. Response should be fast (< 2 seconds, not 10-30s)
        assert elapsed_time < 2.0, f"Upload took {elapsed_time:.2f}s - should be < 2s (Whisper should be async)"
        
        # 2. Response should have recording_path and filename
        assert "recording_path" in data, "Response should have recording_path"
        assert "filename" in data, "Response should have filename"
        
        # 3. Response should NOT have transcript (Whisper runs in background)
        assert "transcript" not in data, "Response should NOT have transcript field (Whisper is async now)"
        
        print(f"✓ POST /api/recordings/upload - Fast response ({elapsed_time:.2f}s)")
        print(f"  - recording_path: {data['recording_path']}")
        print(f"  - filename: {data['filename']}")
        print(f"  - NO transcript field (Whisper runs in background)")


class TestContactEndpoint:
    """Contact form endpoint tests"""
    
    def test_contact_sends_email(self):
        """POST /api/contact sends query email"""
        response = requests.post(f"{BASE_URL}/api/contact", json={
            "name": "Test Contact",
            "email": "contact_test@example.com",
            "subject": "Test Query from Iteration 10",
            "message": "This is a test message from iteration 10 testing."
        })
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print("✓ POST /api/contact - Query email sent")
    
    def test_contact_validation(self):
        """POST /api/contact validates required fields"""
        response = requests.post(f"{BASE_URL}/api/contact", json={
            "name": "Test",
            "email": "test@example.com"
            # Missing subject and message
        })
        assert response.status_code == 422
        print("✓ POST /api/contact - Validation works (422 for missing fields)")


class TestFeedbackEndpoints:
    """Feedback form endpoint tests"""
    
    def test_submit_feedback(self):
        """POST /api/feedback saves feedback to DB"""
        response = requests.post(f"{BASE_URL}/api/feedback", json={
            "name": "Iteration 10 Tester",
            "email": "feedback_test@example.com",
            "rating": 5,
            "text": "Great platform! Testing iteration 10 features."
        })
        assert response.status_code == 200
        data = response.json()
        assert "feedback_id" in data
        assert "message" in data
        print(f"✓ POST /api/feedback - Feedback saved with ID: {data['feedback_id']}")
    
    def test_get_feedbacks(self):
        """GET /api/feedbacks returns feedbacks list"""
        response = requests.get(f"{BASE_URL}/api/feedbacks")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/feedbacks - Returns {len(data)} feedbacks")


class TestProfileEndpoints:
    """Profile endpoint tests"""
    
    @pytest.fixture
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Authentication failed")
    
    @pytest.fixture
    def auth_headers(self, auth_token):
        return {"Authorization": f"Bearer {auth_token}"}
    
    def test_get_profile_with_stats(self, auth_headers):
        """GET /api/profile returns user with stats"""
        response = requests.get(f"{BASE_URL}/api/profile", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "user_id" in data
        assert "email" in data
        assert "name" in data
        assert "total_interviews" in data
        assert "completed_interviews" in data
        print(f"✓ GET /api/profile - Profile with stats: {data['total_interviews']} total, {data['completed_interviews']} completed")
    
    def test_upload_profile_picture(self, auth_headers):
        """POST /api/profile/upload-picture uploads profile picture"""
        # Create a minimal PNG image
        png_header = b'\x89PNG\r\n\x1a\n' + b'\x00' * 100
        
        response = requests.post(
            f"{BASE_URL}/api/profile/upload-picture",
            files={"file": ("test_avatar.png", png_header, "image/png")},
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "picture" in data
        assert data["picture"].startswith("/api/recordings/")
        print(f"✓ POST /api/profile/upload-picture - Picture uploaded: {data['picture']}")
    
    def test_profile_requires_auth(self):
        """GET /api/profile requires authentication"""
        response = requests.get(f"{BASE_URL}/api/profile")
        assert response.status_code == 401
        print("✓ GET /api/profile - Requires authentication (401)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
