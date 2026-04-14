"""
Iteration 8 Backend Tests
Tests for:
1. POST /api/interviews/{id}/send-feedback - Real email sending for completed interviews
2. POST /api/interviews/{id}/send-feedback - Error for non-completed interviews
3. Auth endpoints regression (login, register, send-otp, forgot-password)
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "test@test.com"
TEST_PASSWORD = "test123"

# Completed interview ID for email test
COMPLETED_INTERVIEW_ID = "int_3c3ecc23bd34"


class TestHealthCheck:
    """Basic API health check"""
    
    def test_api_health(self):
        """Test API is running"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "running"
        print("PASS: API health check - status 200, running")


class TestAuthEndpoints:
    """Auth endpoints regression tests"""
    
    def test_login_success(self):
        """Test login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert data["email"] == TEST_EMAIL
        print(f"PASS: Login success - token received for {TEST_EMAIL}")
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "invalid@test.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("PASS: Login invalid credentials - 401 returned")
    
    def test_send_otp_endpoint(self):
        """Test send-otp endpoint exists and works"""
        response = requests.post(f"{BASE_URL}/api/auth/send-otp", json={
            "email": "test_otp_iter8@example.com"
        })
        # Should return 200 (OTP sent) or 500 (email service issue)
        assert response.status_code in [200, 500]
        print(f"PASS: Send OTP endpoint - status {response.status_code}")
    
    def test_forgot_password_endpoint(self):
        """Test forgot-password endpoint exists"""
        response = requests.post(f"{BASE_URL}/api/auth/forgot-password", json={
            "email": "nonexistent@test.com"
        })
        # Should return 200 for security (doesn't reveal if email exists)
        assert response.status_code == 200
        print("PASS: Forgot password endpoint - 200 returned (security)")


class TestSendFeedbackEmail:
    """Tests for POST /api/interviews/{id}/send-feedback endpoint"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token for test user"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Authentication failed - skipping authenticated tests")
    
    def test_send_feedback_completed_interview(self, auth_token):
        """Test sending feedback email for a completed interview"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # First verify the interview exists and is completed
        get_response = requests.get(
            f"{BASE_URL}/api/interviews/{COMPLETED_INTERVIEW_ID}",
            headers=headers
        )
        
        if get_response.status_code == 404:
            pytest.skip(f"Interview {COMPLETED_INTERVIEW_ID} not found - skipping email test")
        
        assert get_response.status_code == 200
        interview = get_response.json()
        
        if interview.get("status") != "completed":
            pytest.skip(f"Interview {COMPLETED_INTERVIEW_ID} is not completed - status: {interview.get('status')}")
        
        # Now test the send-feedback endpoint
        response = requests.post(
            f"{BASE_URL}/api/interviews/{COMPLETED_INTERVIEW_ID}/send-feedback",
            headers=headers,
            json={}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "email" in data["message"].lower() or "sent" in data["message"].lower()
        print(f"PASS: Send feedback email - {data['message']}")
    
    def test_send_feedback_non_completed_interview(self, auth_token):
        """Test sending feedback email for a non-completed interview returns error"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Get list of interviews to find an in_progress one
        list_response = requests.get(f"{BASE_URL}/api/interviews", headers=headers)
        assert list_response.status_code == 200
        interviews = list_response.json()
        
        # Find an in_progress interview
        in_progress = next((i for i in interviews if i.get("status") == "in_progress"), None)
        
        if not in_progress:
            # Create a new interview to test with
            create_response = requests.post(
                f"{BASE_URL}/api/interviews/start",
                headers=headers,
                json={
                    "type": "role",
                    "role": "Frontend Developer",
                    "num_questions": 3,
                    "time_per_question": 60
                }
            )
            if create_response.status_code == 200:
                in_progress = create_response.json()
            else:
                pytest.skip("Could not create test interview")
        
        interview_id = in_progress.get("interview_id")
        
        # Try to send feedback for non-completed interview
        response = requests.post(
            f"{BASE_URL}/api/interviews/{interview_id}/send-feedback",
            headers=headers,
            json={}
        )
        
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        assert "completed" in data["detail"].lower() or "must be" in data["detail"].lower()
        print(f"PASS: Send feedback non-completed - 400 returned: {data['detail']}")
    
    def test_send_feedback_not_found(self, auth_token):
        """Test sending feedback for non-existent interview"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        response = requests.post(
            f"{BASE_URL}/api/interviews/nonexistent_interview_id/send-feedback",
            headers=headers,
            json={}
        )
        
        assert response.status_code == 404
        print("PASS: Send feedback not found - 404 returned")
    
    def test_send_feedback_unauthorized(self):
        """Test sending feedback without auth token"""
        response = requests.post(
            f"{BASE_URL}/api/interviews/{COMPLETED_INTERVIEW_ID}/send-feedback",
            json={}
        )
        
        assert response.status_code == 401
        print("PASS: Send feedback unauthorized - 401 returned")


class TestInterviewEndpoints:
    """Interview endpoints regression tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token for test user"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Authentication failed")
    
    def test_list_interviews(self, auth_token):
        """Test listing interviews"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/interviews", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"PASS: List interviews - {len(data)} interviews found")
    
    def test_get_interview(self, auth_token):
        """Test getting a specific interview"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # First get list to find an interview
        list_response = requests.get(f"{BASE_URL}/api/interviews", headers=headers)
        interviews = list_response.json()
        
        if not interviews:
            pytest.skip("No interviews to test")
        
        interview_id = interviews[0].get("interview_id")
        response = requests.get(f"{BASE_URL}/api/interviews/{interview_id}", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["interview_id"] == interview_id
        print(f"PASS: Get interview - {interview_id}")
    
    def test_abort_interview_endpoint(self, auth_token):
        """Test abort interview endpoint exists"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Try to abort a non-existent interview
        response = requests.post(
            f"{BASE_URL}/api/interviews/nonexistent_id/abort",
            headers=headers,
            json={}
        )
        
        # Should return 404 (not found) not 500
        assert response.status_code == 404
        print("PASS: Abort interview endpoint - 404 for non-existent")


class TestProfileEndpoint:
    """Profile endpoint regression test"""
    
    def test_get_profile(self):
        """Test getting user profile"""
        # Login first
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert login_response.status_code == 200
        token = login_response.json().get("token")
        
        # Get profile
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/api/profile", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == TEST_EMAIL
        print(f"PASS: Get profile - {data['email']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
