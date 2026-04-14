"""
Iteration 9 Backend Tests
Tests for 4 NEW tasks:
1. Contact form - POST /api/contact sends email
2. Feedback form - POST /api/feedback saves to DB, GET /api/feedbacks returns approved feedbacks
3. Profile picture upload - POST /api/profile/upload-picture
4. Change email with OTP - POST /api/profile/change-email/send-otp, POST /api/profile/change-email/verify
5. Profile stats - GET /api/profile returns total_interviews and completed_interviews
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "test@test.com"
TEST_PASSWORD = "test123"


class TestHealthCheck:
    """Basic API health check"""
    
    def test_api_health(self):
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "running"
        print("✓ API health check passed")


class TestContactForm:
    """Contact form endpoint tests"""
    
    def test_contact_form_success(self):
        """POST /api/contact - sends email and returns success"""
        payload = {
            "name": "Test User",
            "email": "testcontact@example.com",
            "subject": "Test Subject",
            "message": "This is a test message from automated testing."
        }
        response = requests.post(f"{BASE_URL}/api/contact", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "sent" in data["message"].lower() or "query" in data["message"].lower()
        print("✓ Contact form submission successful")
    
    def test_contact_form_missing_fields(self):
        """POST /api/contact - missing fields returns 422"""
        payload = {"name": "Test User"}  # Missing email, subject, message
        response = requests.post(f"{BASE_URL}/api/contact", json=payload)
        assert response.status_code == 422
        print("✓ Contact form validation works (missing fields rejected)")


class TestFeedbackForm:
    """Feedback form endpoint tests"""
    
    def test_feedback_submission_success(self):
        """POST /api/feedback - saves feedback to DB and returns feedback_id"""
        payload = {
            "name": "Test Reviewer",
            "email": "testfeedback@example.com",
            "rating": 5,
            "text": "This is an excellent platform for interview preparation! Automated test feedback."
        }
        response = requests.post(f"{BASE_URL}/api/feedback", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "feedback_id" in data
        assert data["feedback_id"].startswith("fb_")
        print(f"✓ Feedback submission successful, feedback_id: {data['feedback_id']}")
        return data["feedback_id"]
    
    def test_feedback_submission_anonymous(self):
        """POST /api/feedback - anonymous feedback (no name/email)"""
        payload = {
            "rating": 4,
            "text": "Great platform! Anonymous test feedback."
        }
        response = requests.post(f"{BASE_URL}/api/feedback", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "feedback_id" in data
        print("✓ Anonymous feedback submission successful")
    
    def test_feedback_missing_rating(self):
        """POST /api/feedback - missing rating returns 422"""
        payload = {"text": "Missing rating"}
        response = requests.post(f"{BASE_URL}/api/feedback", json=payload)
        assert response.status_code == 422
        print("✓ Feedback validation works (missing rating rejected)")
    
    def test_get_feedbacks(self):
        """GET /api/feedbacks - returns list of approved feedbacks"""
        response = requests.get(f"{BASE_URL}/api/feedbacks")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Check structure of feedbacks
        if len(data) > 0:
            feedback = data[0]
            assert "name" in feedback
            assert "rating" in feedback
            assert "text" in feedback
            assert "approved" in feedback
            assert feedback["approved"] == True
        print(f"✓ GET /api/feedbacks returned {len(data)} approved feedbacks")


class TestProfilePictureUpload:
    """Profile picture upload tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Authentication failed - skipping authenticated tests")
    
    def test_upload_profile_picture(self, auth_token):
        """POST /api/profile/upload-picture - uploads image and returns picture URL"""
        # Create a simple test image (1x1 pixel PNG)
        import base64
        # Minimal valid PNG (1x1 transparent pixel)
        png_data = base64.b64decode(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        )
        
        files = {"file": ("test_avatar.png", png_data, "image/png")}
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        response = requests.post(
            f"{BASE_URL}/api/profile/upload-picture",
            files=files,
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "picture" in data
        assert data["picture"].startswith("/api/recordings/")
        print(f"✓ Profile picture uploaded successfully: {data['picture']}")
        return data["picture"]
    
    def test_upload_invalid_file_type(self, auth_token):
        """POST /api/profile/upload-picture - rejects non-image files"""
        files = {"file": ("test.txt", b"not an image", "text/plain")}
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        response = requests.post(
            f"{BASE_URL}/api/profile/upload-picture",
            files=files,
            headers=headers
        )
        assert response.status_code == 400
        print("✓ Invalid file type rejected correctly")
    
    def test_upload_without_auth(self):
        """POST /api/profile/upload-picture - requires authentication"""
        import base64
        png_data = base64.b64decode(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        )
        files = {"file": ("test_avatar.png", png_data, "image/png")}
        
        response = requests.post(f"{BASE_URL}/api/profile/upload-picture", files=files)
        assert response.status_code == 401
        print("✓ Unauthenticated upload rejected correctly")


class TestChangeEmailOTP:
    """Change email with OTP verification tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Authentication failed - skipping authenticated tests")
    
    def test_send_change_email_otp(self, auth_token):
        """POST /api/profile/change-email/send-otp - sends OTP to new email"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        payload = {"new_email": "newemail_test@example.com"}
        
        response = requests.post(
            f"{BASE_URL}/api/profile/change-email/send-otp",
            json=payload,
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "OTP" in data["message"] or "sent" in data["message"].lower()
        print("✓ Change email OTP sent successfully")
    
    def test_send_otp_existing_email(self, auth_token):
        """POST /api/profile/change-email/send-otp - rejects already registered email"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        payload = {"new_email": TEST_EMAIL}  # Same as current email
        
        response = requests.post(
            f"{BASE_URL}/api/profile/change-email/send-otp",
            json=payload,
            headers=headers
        )
        assert response.status_code == 400
        data = response.json()
        assert "already registered" in data["detail"].lower()
        print("✓ Existing email rejected correctly")
    
    def test_verify_invalid_otp(self, auth_token):
        """POST /api/profile/change-email/verify - rejects invalid OTP"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        payload = {
            "new_email": "newemail_test@example.com",
            "otp": "000000"  # Invalid OTP
        }
        
        response = requests.post(
            f"{BASE_URL}/api/profile/change-email/verify",
            json=payload,
            headers=headers
        )
        assert response.status_code == 400
        data = response.json()
        assert "invalid" in data["detail"].lower() or "otp" in data["detail"].lower()
        print("✓ Invalid OTP rejected correctly")
    
    def test_change_email_without_auth(self):
        """POST /api/profile/change-email/send-otp - requires authentication"""
        payload = {"new_email": "newemail_test@example.com"}
        
        response = requests.post(f"{BASE_URL}/api/profile/change-email/send-otp", json=payload)
        assert response.status_code == 401
        print("✓ Unauthenticated change email request rejected correctly")


class TestProfileStats:
    """Profile endpoint with interview stats tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Authentication failed - skipping authenticated tests")
    
    def test_get_profile_with_stats(self, auth_token):
        """GET /api/profile - returns user profile with interview stats"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        response = requests.get(f"{BASE_URL}/api/profile", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        # Check required fields
        assert "user_id" in data
        assert "email" in data
        assert "name" in data
        assert "total_interviews" in data
        assert "completed_interviews" in data
        
        # Check stats are integers
        assert isinstance(data["total_interviews"], int)
        assert isinstance(data["completed_interviews"], int)
        
        print(f"✓ Profile returned with stats: total={data['total_interviews']}, completed={data['completed_interviews']}")
    
    def test_profile_has_picture_field(self, auth_token):
        """GET /api/profile - includes picture field"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        response = requests.get(f"{BASE_URL}/api/profile", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        # Picture field should exist (can be null or a URL)
        assert "picture" in data
        print(f"✓ Profile includes picture field: {data.get('picture')}")
    
    def test_profile_has_created_at(self, auth_token):
        """GET /api/profile - includes created_at for 'member since'"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        response = requests.get(f"{BASE_URL}/api/profile", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        assert "created_at" in data
        print(f"✓ Profile includes created_at: {data.get('created_at')}")


class TestAuthRegression:
    """Regression tests for existing auth functionality"""
    
    def test_login_valid_credentials(self):
        """POST /api/auth/login - valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user_id" in data
        assert data["email"] == TEST_EMAIL
        print("✓ Login with valid credentials works")
    
    def test_login_invalid_credentials(self):
        """POST /api/auth/login - invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "wrong@example.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("✓ Login with invalid credentials rejected")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
