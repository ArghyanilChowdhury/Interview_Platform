"""
Comprehensive backend tests for Interview Platform API
Testing: Auth (register/login/me), Interviews (CRUD, configurable settings, abort),
Recordings (upload/serve), Profile endpoints
"""
import pytest
import requests
import os
import uuid
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test user credentials
TEST_EMAIL = "test@test.com"
TEST_PASSWORD = "test123"
TEST_NAME = "Test User"

# Unique test user for registration tests
UNIQUE_EMAIL = f"test_{uuid.uuid4().hex[:8]}@example.com"


class TestHealthCheck:
    """API health and availability tests"""
    
    def test_api_root_health(self):
        """Check API root endpoint is responding"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "running"
        assert "Interview Platform API" in data["message"]
        print("✓ API root health check passed")


class TestAuthentication:
    """Authentication flow tests - register, login, me"""
    
    def test_register_new_user(self):
        """POST /api/auth/register - create new user"""
        payload = {
            "email": UNIQUE_EMAIL,
            "password": "testpass123",
            "name": "New Test User"
        }
        response = requests.post(f"{BASE_URL}/api/auth/register", json=payload)
        
        # May return 400 if email already exists from previous test
        if response.status_code == 400:
            assert "already registered" in response.json().get("detail", "").lower()
            print("✓ Register endpoint correctly rejects duplicate email")
            return
            
        assert response.status_code == 200
        data = response.json()
        assert "user_id" in data
        assert data["email"] == UNIQUE_EMAIL
        assert data["name"] == "New Test User"
        assert "token" in data
        assert data["auth_type"] == "local"
        print(f"✓ User registered successfully: {data['user_id']}")
    
    def test_register_duplicate_email(self):
        """POST /api/auth/register - reject duplicate email"""
        payload = {
            "email": TEST_EMAIL,  # Already exists
            "password": "anypass",
            "name": "Duplicate"
        }
        response = requests.post(f"{BASE_URL}/api/auth/register", json=payload)
        assert response.status_code == 400
        assert "already registered" in response.json()["detail"].lower()
        print("✓ Duplicate email registration correctly rejected")
    
    def test_login_valid_credentials(self):
        """POST /api/auth/login - login with valid credentials"""
        payload = {"email": TEST_EMAIL, "password": TEST_PASSWORD}
        response = requests.post(f"{BASE_URL}/api/auth/login", json=payload)
        
        assert response.status_code == 200
        data = response.json()
        assert "user_id" in data
        assert data["email"] == TEST_EMAIL
        assert "token" in data
        assert len(data["token"]) > 0
        print(f"✓ Login successful, token received: {data['token'][:20]}...")
    
    def test_login_invalid_credentials(self):
        """POST /api/auth/login - reject invalid password"""
        payload = {"email": TEST_EMAIL, "password": "wrongpassword"}
        response = requests.post(f"{BASE_URL}/api/auth/login", json=payload)
        
        assert response.status_code == 401
        assert "invalid" in response.json()["detail"].lower()
        print("✓ Invalid credentials correctly rejected")
    
    def test_login_nonexistent_user(self):
        """POST /api/auth/login - reject nonexistent email"""
        payload = {"email": "nonexistent@example.com", "password": "anypass"}
        response = requests.post(f"{BASE_URL}/api/auth/login", json=payload)
        
        assert response.status_code == 401
        print("✓ Nonexistent user login correctly rejected")
    
    def test_get_me_with_valid_token(self):
        """GET /api/auth/me - return user profile with valid token"""
        # First login to get token
        login_res = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL, "password": TEST_PASSWORD
        })
        assert login_res.status_code == 200
        token = login_res.json()["token"]
        
        # Now call /me with token
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == TEST_EMAIL
        assert "user_id" in data
        assert "name" in data
        print(f"✓ /me returned user profile: {data['name']}")
    
    def test_get_me_without_token(self):
        """GET /api/auth/me - reject without authentication"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401
        print("✓ /me correctly rejects unauthenticated request")


class TestInterviews:
    """Interview CRUD and workflow tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token before each test"""
        login_res = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL, "password": TEST_PASSWORD
        })
        assert login_res.status_code == 200
        self.token = login_res.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_start_interview_default_settings(self):
        """POST /api/interviews/start - create interview with defaults"""
        payload = {
            "type": "role",
            "role": "Frontend Developer"
        }
        response = requests.post(f"{BASE_URL}/api/interviews/start", 
                                 json=payload, headers=self.headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "interview_id" in data
        assert data["type"] == "role"
        assert data["role"] == "Frontend Developer"
        assert data["status"] == "in_progress"
        assert "questions" in data
        assert len(data["questions"]) == 7  # Default num_questions
        assert data["num_questions"] == 7
        assert data["time_per_question"] == 120  # Default
        print(f"✓ Interview started with defaults: {data['interview_id']}")
        
        # Cleanup - delete the interview
        requests.delete(f"{BASE_URL}/api/interviews/{data['interview_id']}", 
                       headers=self.headers)
    
    def test_start_interview_configurable_settings(self):
        """POST /api/interviews/start - create interview with custom num_questions and time_per_question"""
        payload = {
            "type": "role",
            "role": "Backend Developer",
            "experience_level": "intermediate",
            "skills": ["Python", "REST API Design", "SQL Databases"],
            "num_questions": 5,
            "time_per_question": 180
        }
        response = requests.post(f"{BASE_URL}/api/interviews/start", 
                                 json=payload, headers=self.headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["num_questions"] == 5
        assert data["time_per_question"] == 180
        assert len(data["questions"]) == 5
        assert data["experience_level"] == "intermediate"
        assert data["skills"] == ["Python", "REST API Design", "SQL Databases"]
        print(f"✓ Configurable interview created: {data['num_questions']} questions, {data['time_per_question']}s each")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/interviews/{data['interview_id']}", 
                       headers=self.headers)
    
    def test_start_interview_boundary_questions(self):
        """POST /api/interviews/start - test boundary values for num_questions"""
        # Test minimum boundary (3)
        payload = {"type": "role", "role": "HR Interview", "num_questions": 2}  # Below min
        response = requests.post(f"{BASE_URL}/api/interviews/start", 
                                 json=payload, headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert data["num_questions"] == 3  # Should be clamped to minimum 3
        
        requests.delete(f"{BASE_URL}/api/interviews/{data['interview_id']}", 
                       headers=self.headers)
        
        # Test maximum boundary (20)
        payload = {"type": "role", "role": "HR Interview", "num_questions": 25}  # Above max
        response = requests.post(f"{BASE_URL}/api/interviews/start", 
                                 json=payload, headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert data["num_questions"] == 20  # Should be clamped to maximum 20
        print(f"✓ Boundary test passed: min=3, max=20 enforced")
        
        requests.delete(f"{BASE_URL}/api/interviews/{data['interview_id']}", 
                       headers=self.headers)
    
    def test_list_interviews(self):
        """GET /api/interviews - list user's interviews"""
        response = requests.get(f"{BASE_URL}/api/interviews", headers=self.headers)
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Listed {len(data)} interviews")
    
    def test_get_interview_by_id(self):
        """GET /api/interviews/{id} - get specific interview details"""
        # First create an interview
        create_res = requests.post(f"{BASE_URL}/api/interviews/start", 
                                   json={"type": "role", "role": "Data Analyst", "num_questions": 3},
                                   headers=self.headers)
        interview_id = create_res.json()["interview_id"]
        
        # Get it by ID
        response = requests.get(f"{BASE_URL}/api/interviews/{interview_id}", 
                               headers=self.headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["interview_id"] == interview_id
        assert data["role"] == "Data Analyst"
        assert "questions" in data
        print(f"✓ Retrieved interview: {interview_id}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/interviews/{interview_id}", 
                       headers=self.headers)
    
    def test_get_nonexistent_interview(self):
        """GET /api/interviews/{id} - 404 for nonexistent interview"""
        response = requests.get(f"{BASE_URL}/api/interviews/int_nonexistent123", 
                               headers=self.headers)
        assert response.status_code == 404
        print("✓ Nonexistent interview returns 404")
    
    def test_save_response(self):
        """POST /api/interviews/{id}/responses - save a response"""
        # Create interview
        create_res = requests.post(f"{BASE_URL}/api/interviews/start", 
                                   json={"type": "role", "role": "DevOps Engineer", "num_questions": 3},
                                   headers=self.headers)
        interview_id = create_res.json()["interview_id"]
        
        # Save response
        response_payload = {
            "question_index": 0,
            "transcript": "This is my answer about Docker and containerization...",
            "recording_path": None,
            "duration": 45
        }
        response = requests.post(f"{BASE_URL}/api/interviews/{interview_id}/responses",
                                json=response_payload, headers=self.headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["question_index"] == 0
        print(f"✓ Response saved for question 0")
        
        # Verify response was saved
        get_res = requests.get(f"{BASE_URL}/api/interviews/{interview_id}", 
                              headers=self.headers)
        interview_data = get_res.json()
        assert len(interview_data["responses"]) == 1
        assert interview_data["responses"][0]["transcript"] == response_payload["transcript"]
        print("✓ Response persisted correctly")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/interviews/{interview_id}", 
                       headers=self.headers)
    
    def test_complete_interview(self):
        """POST /api/interviews/{id}/complete - complete interview and generate feedback"""
        # Create interview
        create_res = requests.post(f"{BASE_URL}/api/interviews/start", 
                                   json={"type": "role", "role": "HR Interview", "num_questions": 3},
                                   headers=self.headers)
        interview_id = create_res.json()["interview_id"]
        
        # Save a response
        requests.post(f"{BASE_URL}/api/interviews/{interview_id}/responses",
                     json={"question_index": 0, "transcript": "I have 5 years of experience...", "duration": 30},
                     headers=self.headers)
        
        # Complete interview
        response = requests.post(f"{BASE_URL}/api/interviews/{interview_id}/complete",
                                headers=self.headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "completed"
        assert "summary" in data
        assert data["completed_at"] is not None
        print(f"✓ Interview completed with summary")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/interviews/{interview_id}", 
                       headers=self.headers)
    
    def test_delete_interview(self):
        """DELETE /api/interviews/{id} - delete an interview"""
        # Create interview
        create_res = requests.post(f"{BASE_URL}/api/interviews/start", 
                                   json={"type": "role", "role": "Full Stack Developer", "num_questions": 3},
                                   headers=self.headers)
        interview_id = create_res.json()["interview_id"]
        
        # Delete it
        response = requests.delete(f"{BASE_URL}/api/interviews/{interview_id}", 
                                  headers=self.headers)
        
        assert response.status_code == 200
        assert "deleted" in response.json()["message"].lower()
        print(f"✓ Interview deleted: {interview_id}")
        
        # Verify it's gone
        get_res = requests.get(f"{BASE_URL}/api/interviews/{interview_id}", 
                              headers=self.headers)
        assert get_res.status_code == 404
        print("✓ Deleted interview returns 404")
    
    def test_abort_in_progress_interview(self):
        """POST /api/interviews/{id}/abort - abort an in-progress interview"""
        # Create interview
        create_res = requests.post(f"{BASE_URL}/api/interviews/start", 
                                   json={"type": "role", "role": "Backend Developer", "num_questions": 3},
                                   headers=self.headers)
        interview_id = create_res.json()["interview_id"]
        assert create_res.json()["status"] == "in_progress"
        
        # Abort it
        response = requests.post(f"{BASE_URL}/api/interviews/{interview_id}/abort", 
                                headers=self.headers)
        
        assert response.status_code == 200
        assert "aborted" in response.json()["message"].lower()
        print(f"✓ Interview aborted: {interview_id}")
        
        # Verify status changed
        get_res = requests.get(f"{BASE_URL}/api/interviews/{interview_id}", 
                              headers=self.headers)
        assert get_res.json()["status"] == "aborted"
        print("✓ Interview status is 'aborted'")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/interviews/{interview_id}", 
                       headers=self.headers)
    
    def test_abort_completed_interview_fails(self):
        """POST /api/interviews/{id}/abort - cannot abort completed interview"""
        # Create and complete interview
        create_res = requests.post(f"{BASE_URL}/api/interviews/start", 
                                   json={"type": "role", "role": "HR Interview", "num_questions": 3},
                                   headers=self.headers)
        interview_id = create_res.json()["interview_id"]
        
        # Save response and complete
        requests.post(f"{BASE_URL}/api/interviews/{interview_id}/responses",
                     json={"question_index": 0, "transcript": "Test answer", "duration": 10},
                     headers=self.headers)
        requests.post(f"{BASE_URL}/api/interviews/{interview_id}/complete", 
                     headers=self.headers)
        
        # Try to abort completed interview
        response = requests.post(f"{BASE_URL}/api/interviews/{interview_id}/abort", 
                                headers=self.headers)
        
        assert response.status_code == 400
        assert "not in progress" in response.json()["detail"].lower()
        print("✓ Cannot abort completed interview (correct behavior)")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/interviews/{interview_id}", 
                       headers=self.headers)


class TestRecordings:
    """Recording upload and serve tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token before each test"""
        login_res = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL, "password": TEST_PASSWORD
        })
        self.token = login_res.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_serve_nonexistent_recording(self):
        """GET /api/recordings/{filename} - 404 for nonexistent file"""
        response = requests.get(f"{BASE_URL}/api/recordings/nonexistent_file.webm")
        assert response.status_code == 404
        print("✓ Nonexistent recording returns 404")


class TestProfile:
    """Profile endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token before each test"""
        login_res = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL, "password": TEST_PASSWORD
        })
        self.token = login_res.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_profile(self):
        """GET /api/profile - get user profile with stats"""
        response = requests.get(f"{BASE_URL}/api/profile", headers=self.headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == TEST_EMAIL
        assert "total_interviews" in data
        assert "completed_interviews" in data
        assert isinstance(data["total_interviews"], int)
        assert isinstance(data["completed_interviews"], int)
        print(f"✓ Profile retrieved: {data['total_interviews']} total, {data['completed_interviews']} completed")
    
    def test_update_profile_name(self):
        """PUT /api/profile - update user name"""
        new_name = f"Updated Name {uuid.uuid4().hex[:4]}"
        response = requests.put(f"{BASE_URL}/api/profile", 
                               json={"name": new_name}, headers=self.headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == new_name
        print(f"✓ Profile name updated to: {new_name}")
        
        # Reset to original
        requests.put(f"{BASE_URL}/api/profile", 
                    json={"name": TEST_NAME}, headers=self.headers)


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
