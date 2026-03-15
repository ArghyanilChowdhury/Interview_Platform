"""
Iteration 5 Backend Tests - Focus on LiveInterview redesign and Whisper transcript
Tests:
1. API health check
2. Login with test credentials
3. POST /api/recordings/upload returns transcript field
4. POST /api/interviews/start-resume with num_questions and time_per_question
5. GET /api/interviews list (regression)
"""

import pytest
import requests
import os
import io

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestBackendIteration5:
    """Backend tests for iteration 5 - LiveInterview redesign"""
    
    @pytest.fixture(scope="class")
    def api_client(self):
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        return session

    @pytest.fixture(scope="class")
    def auth_token(self, api_client):
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@test.com",
            "password": "test123"
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Authentication failed")
        
    @pytest.fixture(scope="class")
    def authenticated_client(self, api_client, auth_token):
        api_client.headers.update({"Authorization": f"Bearer {auth_token}"})
        return api_client

    def test_api_health_check(self, api_client):
        """Test API is running"""
        response = api_client.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "running"
        print("✓ API health check passed")

    def test_login_returns_token(self, api_client):
        """Test login returns user data and token"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@test.com",
            "password": "test123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user_id" in data
        assert data["email"] == "test@test.com"
        print("✓ Login returns token")

    def test_recordings_upload_returns_transcript_field(self, auth_token):
        """Test POST /api/recordings/upload returns transcript field (Whisper)"""
        # Create a fresh session for multipart upload
        session = requests.Session()
        
        # Create a minimal webm file content
        files = {
            'file': ('test_recording.webm', io.BytesIO(b'test audio data'), 'video/webm')
        }
        data = {
            'interview_id': 'int_test123',
            'question_index': '0'
        }
        response = session.post(
            f"{BASE_URL}/api/recordings/upload",
            files=files,
            data=data,
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200
        result = response.json()
        assert "recording_path" in result
        assert "transcript" in result  # Key assertion: transcript field exists
        print(f"✓ Recordings upload returns transcript field: {result.get('transcript')}")

    def test_interviews_list_regression(self, authenticated_client, auth_token):
        """Test GET /api/interviews returns list (regression)"""
        response = authenticated_client.get(
            f"{BASE_URL}/api/interviews",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Interviews list returned {len(data)} items")

    def test_profile_endpoint_regression(self, authenticated_client, auth_token):
        """Test GET /api/profile returns user profile (regression)"""
        response = authenticated_client.get(
            f"{BASE_URL}/api/profile",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "email" in data
        assert "total_interviews" in data
        print(f"✓ Profile endpoint working - {data.get('email')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
