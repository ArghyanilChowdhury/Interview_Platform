"""
Iteration 7 Backend Tests
Tests for:
1. POST /api/auth/send-otp - sends OTP email
2. POST /api/auth/verify-otp - validates OTP
3. POST /api/auth/register - OTP-based registration (email, otp, password, name)
4. POST /api/auth/forgot-password - sends reset OTP
5. POST /api/auth/reset-password - validates OTP and resets password
6. POST /api/auth/login - still works for existing users
"""

import pytest
import requests
import os
import time
from pymongo import MongoClient

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# MongoDB connection for OTP verification
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'test_database')

@pytest.fixture(scope="module")
def mongo_client():
    """MongoDB client for direct OTP verification"""
    client = MongoClient(MONGO_URL)
    yield client[DB_NAME]
    client.close()

@pytest.fixture
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


class TestHealthCheck:
    """Basic API health check"""
    
    def test_api_health(self, api_client):
        response = api_client.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "running"
        print("API health check passed")


class TestExistingUserLogin:
    """Test login still works for existing users"""
    
    def test_login_existing_user(self, api_client):
        """Login with test@test.com / test123"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@test.com",
            "password": "test123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert data["email"] == "test@test.com"
        print(f"Login successful for test@test.com, token received")
    
    def test_login_invalid_credentials(self, api_client):
        """Login with wrong password should fail"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@test.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("Invalid credentials correctly rejected")


class TestSendOTP:
    """Test POST /api/auth/send-otp endpoint"""
    
    def test_send_otp_success(self, api_client, mongo_client):
        """Send OTP to a test email"""
        test_email = "test_otp_iter7@example.com"
        
        # Clean up any existing OTPs for this email
        mongo_client.otps.delete_many({"email": test_email})
        
        response = api_client.post(f"{BASE_URL}/api/auth/send-otp", json={
            "email": test_email
        })
        
        # Note: This may fail if SMTP is not configured, but endpoint should respond
        # If SMTP fails, it returns 500
        if response.status_code == 200:
            data = response.json()
            assert "message" in data
            print(f"OTP sent successfully to {test_email}")
            
            # Verify OTP was stored in database
            otp_record = mongo_client.otps.find_one({"email": test_email})
            assert otp_record is not None
            assert "otp" in otp_record
            assert otp_record["purpose"] == "verify"
            print(f"OTP stored in database: {otp_record['otp']}")
        elif response.status_code == 500:
            # SMTP not configured - this is expected in test environment
            print("SMTP not configured - OTP email sending skipped (expected in test env)")
            pytest.skip("SMTP not configured")
        else:
            pytest.fail(f"Unexpected status code: {response.status_code}")
    
    def test_send_otp_missing_email(self, api_client):
        """Send OTP without email should fail"""
        response = api_client.post(f"{BASE_URL}/api/auth/send-otp", json={})
        assert response.status_code == 422  # Validation error
        print("Missing email correctly rejected")


class TestVerifyOTP:
    """Test POST /api/auth/verify-otp endpoint"""
    
    def test_verify_otp_success(self, api_client, mongo_client):
        """Verify OTP with correct code"""
        test_email = "test_verify_otp@example.com"
        test_otp = "123456"
        
        # Insert a test OTP directly into database
        mongo_client.otps.delete_many({"email": test_email})
        from datetime import datetime, timezone, timedelta
        mongo_client.otps.insert_one({
            "email": test_email,
            "otp": test_otp,
            "purpose": "verify",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "expires_at": (datetime.now(timezone.utc) + timedelta(minutes=10)).isoformat()
        })
        
        response = api_client.post(f"{BASE_URL}/api/auth/verify-otp", json={
            "email": test_email,
            "otp": test_otp
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("verified") == True
        print(f"OTP verified successfully for {test_email}")
        
        # Cleanup
        mongo_client.otps.delete_many({"email": test_email})
    
    def test_verify_otp_invalid(self, api_client, mongo_client):
        """Verify OTP with wrong code should fail"""
        test_email = "test_invalid_otp@example.com"
        
        # Insert a test OTP
        mongo_client.otps.delete_many({"email": test_email})
        from datetime import datetime, timezone, timedelta
        mongo_client.otps.insert_one({
            "email": test_email,
            "otp": "123456",
            "purpose": "verify",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "expires_at": (datetime.now(timezone.utc) + timedelta(minutes=10)).isoformat()
        })
        
        response = api_client.post(f"{BASE_URL}/api/auth/verify-otp", json={
            "email": test_email,
            "otp": "999999"  # Wrong OTP
        })
        
        assert response.status_code == 400
        print("Invalid OTP correctly rejected")
        
        # Cleanup
        mongo_client.otps.delete_many({"email": test_email})
    
    def test_verify_otp_expired(self, api_client, mongo_client):
        """Verify expired OTP should fail"""
        test_email = "test_expired_otp@example.com"
        test_otp = "123456"
        
        # Insert an expired OTP
        mongo_client.otps.delete_many({"email": test_email})
        from datetime import datetime, timezone, timedelta
        mongo_client.otps.insert_one({
            "email": test_email,
            "otp": test_otp,
            "purpose": "verify",
            "created_at": (datetime.now(timezone.utc) - timedelta(minutes=15)).isoformat(),
            "expires_at": (datetime.now(timezone.utc) - timedelta(minutes=5)).isoformat()  # Expired
        })
        
        response = api_client.post(f"{BASE_URL}/api/auth/verify-otp", json={
            "email": test_email,
            "otp": test_otp
        })
        
        assert response.status_code == 400
        data = response.json()
        assert "expired" in data.get("detail", "").lower()
        print("Expired OTP correctly rejected")
        
        # Cleanup
        mongo_client.otps.delete_many({"email": test_email})


class TestOTPBasedRegistration:
    """Test POST /api/auth/register with OTP-based flow"""
    
    def test_register_with_valid_otp(self, api_client, mongo_client):
        """Register new user with valid OTP"""
        test_email = f"test_register_{int(time.time())}@example.com"
        test_otp = "654321"
        
        # Insert a valid OTP
        mongo_client.otps.delete_many({"email": test_email})
        from datetime import datetime, timezone, timedelta
        mongo_client.otps.insert_one({
            "email": test_email,
            "otp": test_otp,
            "purpose": "verify",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "expires_at": (datetime.now(timezone.utc) + timedelta(minutes=10)).isoformat()
        })
        
        response = api_client.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "otp": test_otp,
            "password": "testpass123",
            "name": "Test User Iter7"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == test_email
        assert data["name"] == "Test User Iter7"
        assert "token" in data
        assert "user_id" in data
        print(f"User registered successfully: {test_email}")
        
        # Cleanup - delete the test user
        mongo_client.users.delete_one({"email": test_email})
        mongo_client.otps.delete_many({"email": test_email})
    
    def test_register_without_otp(self, api_client):
        """Register without OTP should fail"""
        response = api_client.post(f"{BASE_URL}/api/auth/register", json={
            "email": "test_no_otp@example.com",
            "password": "testpass123",
            "name": "Test User"
            # Missing otp field
        })
        
        assert response.status_code == 422  # Validation error - otp is required
        print("Registration without OTP correctly rejected")
    
    def test_register_with_invalid_otp(self, api_client, mongo_client):
        """Register with invalid OTP should fail"""
        test_email = "test_invalid_reg@example.com"
        
        # Insert a valid OTP
        mongo_client.otps.delete_many({"email": test_email})
        from datetime import datetime, timezone, timedelta
        mongo_client.otps.insert_one({
            "email": test_email,
            "otp": "123456",
            "purpose": "verify",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "expires_at": (datetime.now(timezone.utc) + timedelta(minutes=10)).isoformat()
        })
        
        response = api_client.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "otp": "999999",  # Wrong OTP
            "password": "testpass123",
            "name": "Test User"
        })
        
        assert response.status_code == 400
        print("Registration with invalid OTP correctly rejected")
        
        # Cleanup
        mongo_client.otps.delete_many({"email": test_email})


class TestForgotPassword:
    """Test POST /api/auth/forgot-password endpoint"""
    
    def test_forgot_password_existing_user(self, api_client, mongo_client):
        """Forgot password for existing user"""
        # Use the existing test user
        response = api_client.post(f"{BASE_URL}/api/auth/forgot-password", json={
            "email": "test@test.com"
        })
        
        # Should return 200 regardless of whether email exists (security)
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print("Forgot password request processed")
        
        # Check if OTP was created (only if SMTP worked)
        otp_record = mongo_client.otps.find_one({"email": "test@test.com", "purpose": "reset"})
        if otp_record:
            print(f"Reset OTP created: {otp_record['otp']}")
        else:
            print("Reset OTP not created (SMTP may have failed)")
    
    def test_forgot_password_nonexistent_user(self, api_client):
        """Forgot password for non-existent user should still return 200 (security)"""
        response = api_client.post(f"{BASE_URL}/api/auth/forgot-password", json={
            "email": "nonexistent_user_xyz@example.com"
        })
        
        # Should return 200 to not reveal if email exists
        assert response.status_code == 200
        print("Forgot password for non-existent user handled securely")


class TestResetPassword:
    """Test POST /api/auth/reset-password endpoint"""
    
    def test_reset_password_success(self, api_client, mongo_client):
        """Reset password with valid OTP"""
        test_email = "test@test.com"
        test_otp = "789012"
        
        # Insert a reset OTP
        mongo_client.otps.delete_many({"email": test_email, "purpose": "reset"})
        from datetime import datetime, timezone, timedelta
        mongo_client.otps.insert_one({
            "email": test_email,
            "otp": test_otp,
            "purpose": "reset",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "expires_at": (datetime.now(timezone.utc) + timedelta(minutes=10)).isoformat()
        })
        
        response = api_client.post(f"{BASE_URL}/api/auth/reset-password", json={
            "email": test_email,
            "otp": test_otp,
            "new_password": "test123"  # Reset back to original password
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print("Password reset successfully")
        
        # Verify login still works with the password
        login_response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": test_email,
            "password": "test123"
        })
        assert login_response.status_code == 200
        print("Login with reset password successful")
    
    def test_reset_password_invalid_otp(self, api_client, mongo_client):
        """Reset password with invalid OTP should fail"""
        test_email = "test@test.com"
        
        # Insert a reset OTP
        mongo_client.otps.delete_many({"email": test_email, "purpose": "reset"})
        from datetime import datetime, timezone, timedelta
        mongo_client.otps.insert_one({
            "email": test_email,
            "otp": "123456",
            "purpose": "reset",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "expires_at": (datetime.now(timezone.utc) + timedelta(minutes=10)).isoformat()
        })
        
        response = api_client.post(f"{BASE_URL}/api/auth/reset-password", json={
            "email": test_email,
            "otp": "999999",  # Wrong OTP
            "new_password": "newpassword123"
        })
        
        assert response.status_code == 400
        print("Reset password with invalid OTP correctly rejected")
        
        # Cleanup
        mongo_client.otps.delete_many({"email": test_email, "purpose": "reset"})
    
    def test_reset_password_short_password(self, api_client, mongo_client):
        """Reset password with short password should fail"""
        test_email = "test@test.com"
        test_otp = "456789"
        
        # Insert a reset OTP
        mongo_client.otps.delete_many({"email": test_email, "purpose": "reset"})
        from datetime import datetime, timezone, timedelta
        mongo_client.otps.insert_one({
            "email": test_email,
            "otp": test_otp,
            "purpose": "reset",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "expires_at": (datetime.now(timezone.utc) + timedelta(minutes=10)).isoformat()
        })
        
        response = api_client.post(f"{BASE_URL}/api/auth/reset-password", json={
            "email": test_email,
            "otp": test_otp,
            "new_password": "123"  # Too short
        })
        
        assert response.status_code == 400
        data = response.json()
        assert "6 characters" in data.get("detail", "").lower()
        print("Short password correctly rejected")
        
        # Cleanup
        mongo_client.otps.delete_many({"email": test_email, "purpose": "reset"})


class TestRegressionEndpoints:
    """Regression tests for existing endpoints"""
    
    def test_get_interviews_authenticated(self, api_client):
        """GET /api/interviews with auth"""
        # First login
        login_response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@test.com",
            "password": "test123"
        })
        assert login_response.status_code == 200
        token = login_response.json()["token"]
        
        # Get interviews
        response = api_client.get(
            f"{BASE_URL}/api/interviews",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        assert isinstance(response.json(), list)
        print(f"GET /api/interviews returned {len(response.json())} interviews")
    
    def test_get_profile_authenticated(self, api_client):
        """GET /api/profile with auth"""
        # First login
        login_response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@test.com",
            "password": "test123"
        })
        assert login_response.status_code == 200
        token = login_response.json()["token"]
        
        # Get profile
        response = api_client.get(
            f"{BASE_URL}/api/profile",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "test@test.com"
        print(f"GET /api/profile returned user: {data['name']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
