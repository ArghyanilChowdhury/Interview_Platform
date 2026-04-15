"""
Interview Platform Backend API Tests - Iteration 11
Tests all major endpoints: auth, interviews, profile, contact, feedback
Test credentials: test@interviewmaster.com / Test@123
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://mock-interview-coach-1.preview.emergentagent.com')

# Test credentials
TEST_EMAIL = "test@interviewmaster.com"
TEST_PASSWORD = "Test@123"


class TestHealthCheck:
    """API health check tests"""
    
    def test_api_root(self):
        """Test API root endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "running"
        print("✓ API health check passed")


class TestAuthentication:
    """Authentication endpoint tests"""
    
    def test_login_success(self):
        """Test login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data, "No token in response"
        assert "user_id" in data, "No user_id in response"
        assert data["email"] == TEST_EMAIL
        assert data["auth_type"] == "local"
        print(f"✓ Login success - user_id: {data['user_id']}")
        return data["token"]
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials returns 401"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": "WrongPassword123"
        })
        assert response.status_code == 401
        print("✓ Invalid credentials rejected with 401")
    
    def test_login_nonexistent_user(self):
        """Test login with non-existent user returns 401"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "nonexistent@example.com",
            "password": "SomePassword123"
        })
        assert response.status_code == 401
        print("✓ Non-existent user rejected with 401")
    
    def test_auth_me_without_token(self):
        """Test /auth/me without token returns 401"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401
        print("✓ /auth/me without token returns 401")
    
    def test_auth_me_with_token(self):
        """Test /auth/me with valid token returns user data"""
        # First login to get token
        login_res = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        token = login_res.json()["token"]
        
        # Now test /auth/me
        response = requests.get(f"{BASE_URL}/api/auth/me", headers={
            "Authorization": f"Bearer {token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == TEST_EMAIL
        print(f"✓ /auth/me returns user: {data['name']}")
    
    def test_send_otp(self):
        """Test OTP sending endpoint"""
        response = requests.post(f"{BASE_URL}/api/auth/send-otp", json={
            "email": "test_otp_iter11@example.com"
        })
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print("✓ OTP send endpoint works")
    
    def test_verify_otp_invalid(self):
        """Test OTP verification with invalid OTP"""
        response = requests.post(f"{BASE_URL}/api/auth/verify-otp", json={
            "email": "test_otp_iter11@example.com",
            "otp": "000000"
        })
        assert response.status_code == 400
        print("✓ Invalid OTP rejected with 400")
    
    def test_forgot_password(self):
        """Test forgot password endpoint"""
        response = requests.post(f"{BASE_URL}/api/auth/forgot-password", json={
            "email": TEST_EMAIL
        })
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print("✓ Forgot password endpoint works")
    
    def test_logout(self):
        """Test logout endpoint"""
        # First login
        login_res = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        token = login_res.json()["token"]
        
        # Logout
        response = requests.post(f"{BASE_URL}/api/auth/logout", headers={
            "Authorization": f"Bearer {token}"
        })
        assert response.status_code == 200
        print("✓ Logout endpoint works")


class TestInterviews:
    """Interview CRUD tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token before each test"""
        login_res = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        self.token = login_res.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_list_interviews(self):
        """Test listing interviews"""
        response = requests.get(f"{BASE_URL}/api/interviews", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ List interviews - found {len(data)} interviews")
    
    def test_start_role_interview(self):
        """Test starting a role-based interview"""
        response = requests.post(f"{BASE_URL}/api/interviews/start", json={
            "type": "role",
            "role": "Frontend Developer",
            "experience_level": "intermediate",
            "skills": ["React.js", "TypeScript"],
            "num_questions": 3,
            "time_per_question": 60
        }, headers=self.headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "interview_id" in data
        assert "questions" in data
        assert len(data["questions"]) == 3
        assert data["type"] == "role"
        assert data["role"] == "Frontend Developer"
        assert data["status"] == "in_progress"
        print(f"✓ Started role interview: {data['interview_id']} with {len(data['questions'])} questions")
        return data["interview_id"]
    
    def test_get_interview(self):
        """Test getting a specific interview"""
        # First create an interview
        create_res = requests.post(f"{BASE_URL}/api/interviews/start", json={
            "type": "role",
            "role": "Backend Developer",
            "num_questions": 3
        }, headers=self.headers)
        interview_id = create_res.json()["interview_id"]
        
        # Get the interview
        response = requests.get(f"{BASE_URL}/api/interviews/{interview_id}", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert data["interview_id"] == interview_id
        print(f"✓ Get interview {interview_id} works")
    
    def test_save_response(self):
        """Test saving a response to an interview"""
        # Create interview
        create_res = requests.post(f"{BASE_URL}/api/interviews/start", json={
            "type": "role",
            "role": "Full Stack Developer",
            "num_questions": 3
        }, headers=self.headers)
        interview_id = create_res.json()["interview_id"]
        
        # Save response
        response = requests.post(f"{BASE_URL}/api/interviews/{interview_id}/responses", json={
            "question_index": 0,
            "transcript": "This is my test answer for the first question.",
            "duration": 45
        }, headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert data["question_index"] == 0
        print(f"✓ Saved response to interview {interview_id}")
    
    def test_complete_interview(self):
        """Test completing an interview (generates AI feedback)"""
        # Create interview
        create_res = requests.post(f"{BASE_URL}/api/interviews/start", json={
            "type": "role",
            "role": "Data Analyst",
            "num_questions": 3
        }, headers=self.headers)
        interview_id = create_res.json()["interview_id"]
        
        # Save a response
        requests.post(f"{BASE_URL}/api/interviews/{interview_id}/responses", json={
            "question_index": 0,
            "transcript": "I have experience with SQL, Python, and data visualization tools like Tableau.",
            "duration": 60
        }, headers=self.headers)
        
        # Complete interview (this calls AI for feedback - may take time)
        response = requests.post(f"{BASE_URL}/api/interviews/{interview_id}/complete", 
                                headers=self.headers, timeout=60)
        assert response.status_code == 200, f"Complete failed: {response.text}"
        data = response.json()
        assert data["status"] == "completed"
        assert "summary" in data
        print(f"✓ Completed interview {interview_id} with AI feedback")
    
    def test_abort_interview(self):
        """Test aborting an in-progress interview"""
        # Create interview
        create_res = requests.post(f"{BASE_URL}/api/interviews/start", json={
            "type": "role",
            "role": "DevOps Engineer",
            "num_questions": 3
        }, headers=self.headers)
        interview_id = create_res.json()["interview_id"]
        
        # Abort
        response = requests.post(f"{BASE_URL}/api/interviews/{interview_id}/abort", headers=self.headers)
        assert response.status_code == 200
        
        # Verify status
        get_res = requests.get(f"{BASE_URL}/api/interviews/{interview_id}", headers=self.headers)
        assert get_res.json()["status"] == "aborted"
        print(f"✓ Aborted interview {interview_id}")
    
    def test_delete_interview(self):
        """Test deleting an interview"""
        # Create interview
        create_res = requests.post(f"{BASE_URL}/api/interviews/start", json={
            "type": "role",
            "role": "HR Interview",
            "num_questions": 3
        }, headers=self.headers)
        interview_id = create_res.json()["interview_id"]
        
        # Delete
        response = requests.delete(f"{BASE_URL}/api/interviews/{interview_id}", headers=self.headers)
        assert response.status_code == 200
        
        # Verify deleted
        get_res = requests.get(f"{BASE_URL}/api/interviews/{interview_id}", headers=self.headers)
        assert get_res.status_code == 404
        print(f"✓ Deleted interview {interview_id}")
    
    def test_interview_not_found(self):
        """Test getting non-existent interview returns 404"""
        response = requests.get(f"{BASE_URL}/api/interviews/nonexistent_id", headers=self.headers)
        assert response.status_code == 404
        print("✓ Non-existent interview returns 404")


class TestProfile:
    """Profile endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token before each test"""
        login_res = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        self.token = login_res.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_profile(self):
        """Test getting user profile"""
        response = requests.get(f"{BASE_URL}/api/profile", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == TEST_EMAIL
        assert "total_interviews" in data
        assert "completed_interviews" in data
        print(f"✓ Profile: {data['name']}, {data['total_interviews']} interviews")
    
    def test_get_profile_unauthorized(self):
        """Test profile without auth returns 401"""
        response = requests.get(f"{BASE_URL}/api/profile")
        assert response.status_code == 401
        print("✓ Profile without auth returns 401")
    
    def test_update_profile_name(self):
        """Test updating profile name"""
        # Update name
        response = requests.put(f"{BASE_URL}/api/profile", json={
            "name": "E2E Test User Updated"
        }, headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "E2E Test User Updated"
        
        # Restore original name
        requests.put(f"{BASE_URL}/api/profile", json={
            "name": "E2E Test User"
        }, headers=self.headers)
        print("✓ Profile name update works")


class TestContactAndFeedback:
    """Contact and Feedback endpoint tests"""
    
    def test_submit_contact(self):
        """Test contact form submission"""
        response = requests.post(f"{BASE_URL}/api/contact", json={
            "name": "Test User",
            "email": "testcontact@example.com",
            "subject": "Test Query",
            "message": "This is a test message from automated testing."
        })
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print("✓ Contact form submission works")
    
    def test_submit_contact_missing_fields(self):
        """Test contact form with missing fields returns 422"""
        response = requests.post(f"{BASE_URL}/api/contact", json={
            "name": "Test User"
            # Missing email, subject, message
        })
        assert response.status_code == 422
        print("✓ Contact form validates required fields")
    
    def test_submit_feedback(self):
        """Test feedback submission"""
        response = requests.post(f"{BASE_URL}/api/feedback", json={
            "name": "Test Reviewer",
            "email": "testfeedback@example.com",
            "rating": 5,
            "text": "Great platform for interview practice! Automated test feedback."
        })
        assert response.status_code == 200
        data = response.json()
        assert "feedback_id" in data
        print(f"✓ Feedback submitted: {data['feedback_id']}")
    
    def test_submit_feedback_anonymous(self):
        """Test anonymous feedback submission"""
        response = requests.post(f"{BASE_URL}/api/feedback", json={
            "rating": 4,
            "text": "Anonymous feedback from automated testing."
        })
        assert response.status_code == 200
        data = response.json()
        assert "feedback_id" in data
        print("✓ Anonymous feedback works")
    
    def test_get_feedbacks(self):
        """Test getting feedbacks list"""
        response = requests.get(f"{BASE_URL}/api/feedbacks")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Get feedbacks - found {len(data)} feedbacks")


class TestRecordingUpload:
    """Recording upload tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token before each test"""
        login_res = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        self.token = login_res.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_upload_recording(self):
        """Test recording upload returns quickly (async Whisper)"""
        # Create interview first
        create_res = requests.post(f"{BASE_URL}/api/interviews/start", json={
            "type": "role",
            "role": "Frontend Developer",
            "num_questions": 3
        }, headers=self.headers)
        interview_id = create_res.json()["interview_id"]
        
        # Create a minimal webm file (just header bytes for testing)
        webm_header = bytes([0x1A, 0x45, 0xDF, 0xA3])  # EBML header
        
        start_time = time.time()
        response = requests.post(
            f"{BASE_URL}/api/recordings/upload",
            files={"file": ("test.webm", webm_header, "video/webm")},
            data={"interview_id": interview_id, "question_index": "0"},
            headers=self.headers
        )
        elapsed = time.time() - start_time
        
        assert response.status_code == 200, f"Upload failed: {response.text}"
        data = response.json()
        assert "recording_path" in data
        assert "filename" in data
        # Verify it's fast (async Whisper)
        assert elapsed < 5, f"Upload took too long: {elapsed}s (should be <5s)"
        print(f"✓ Recording upload works - {elapsed:.2f}s (async Whisper)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
