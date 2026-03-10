#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class InterviewPlatformAPITester:
    def __init__(self, base_url="https://mock-interview-coach-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.session = requests.Session()

    def log(self, message):
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {message}")

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        self.log(f"🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = self.session.get(url, headers=test_headers)
            elif method == 'POST':
                response = self.session.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = self.session.put(url, json=data, headers=test_headers)

            success = response.status_code == expected_status
            
            if success:
                self.tests_passed += 1
                self.log(f"✅ {name} - Status: {response.status_code}")
                try:
                    return True, response.json()
                except:
                    return True, {}
            else:
                self.log(f"❌ {name} - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    self.log(f"   Error: {error_detail}")
                except:
                    self.log(f"   Error: {response.text}")
                
                self.failed_tests.append({
                    "test": name,
                    "expected": expected_status,
                    "actual": response.status_code,
                    "endpoint": endpoint,
                    "method": method
                })
                return False, {}

        except Exception as e:
            self.log(f"❌ {name} - Exception: {str(e)}")
            self.failed_tests.append({
                "test": name,
                "error": str(e),
                "endpoint": endpoint,
                "method": method
            })
            return False, {}

    def test_health_check(self):
        """Test API health check"""
        return self.run_test("API Health Check", "GET", "", 200)

    def test_register(self, email, password, name):
        """Test user registration"""
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data={"email": email, "password": password, "name": name}
        )
        if success and 'token' in response:
            self.token = response['token']
            self.log(f"   ✓ Registration successful, got token")
            return True, response
        return success, response

    def test_login(self, email, password):
        """Test user login"""
        success, response = self.run_test(
            "User Login",
            "POST", 
            "auth/login",
            200,
            data={"email": email, "password": password}
        )
        if success and 'token' in response:
            self.token = response['token']
            self.log(f"   ✓ Login successful, got token")
            return True, response
        return success, response

    def test_auth_me(self):
        """Test getting current user info"""
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )
        if success:
            self.log(f"   ✓ User: {response.get('name')} ({response.get('email')})")
        return success, response

    def test_get_profile(self):
        """Test getting user profile"""
        success, response = self.run_test(
            "Get User Profile",
            "GET",
            "profile",
            200
        )
        if success:
            self.log(f"   ✓ Profile loaded: {response.get('total_interviews', 0)} interviews")
        return success, response

    def test_update_profile(self, new_name):
        """Test updating user profile"""
        return self.run_test(
            "Update Profile",
            "PUT",
            "profile",
            200,
            data={"name": new_name}
        )

    def test_start_role_interview(self, role):
        """Test starting a role-based interview"""
        success, response = self.run_test(
            "Start Role Interview",
            "POST",
            "interviews/start",
            200,
            data={"type": "role", "role": role}
        )
        if success:
            self.log(f"   ✓ Interview started: {response.get('interview_id')}")
            return True, response
        return success, response

    def test_list_interviews(self):
        """Test listing user interviews"""
        success, response = self.run_test(
            "List Interviews",
            "GET",
            "interviews", 
            200
        )
        if success:
            interview_count = len(response) if isinstance(response, list) else 0
            self.log(f"   ✓ Found {interview_count} interviews")
        return success, response

    def test_with_existing_token(self, token):
        """Test using existing JWT token"""
        self.token = token
        self.log(f"Using provided JWT token: {token[:50]}...")
        return self.test_auth_me()

def main():
    """Run the complete test suite"""
    tester = InterviewPlatformAPITester()
    
    print("=" * 60)
    print("🚀 INTERVIEW PLATFORM API TESTING")
    print("=" * 60)
    
    # Test with provided credentials first
    test_email = "test@example.com"
    test_password = "test123"
    provided_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoidXNlcl81MTk2NzQyMTQwZjEiLCJleHAiOjE3NzM0MDQzMTgsImlhdCI6MTc3MzE0NTExOH0.QT5k5G8-VSsrgsnGJqJqyoZ8hjT4612ea6f-zXKd7ps"
    
    # Basic tests
    tester.test_health_check()
    
    # Test with provided token first
    tester.log(f"\n📋 Testing with provided JWT token...")
    token_success, _ = tester.test_with_existing_token(provided_token)
    
    if token_success:
        tester.log("✓ Provided token is valid, continuing with protected endpoints")
    else:
        tester.log("⚠️ Provided token invalid/expired, trying login")
        login_success, _ = tester.test_login(test_email, test_password)
        
        if not login_success:
            tester.log("⚠️ Login failed, trying registration")
            reg_success, _ = tester.test_register(test_email, test_password, "Test User")
            if not reg_success:
                tester.log("❌ Both login and registration failed, skipping protected tests")
                print_results(tester)
                return 1

    # Test protected endpoints
    if tester.token:
        tester.log(f"\n🔐 Testing protected endpoints...")
        tester.test_get_profile()
        tester.test_update_profile("Updated Test User")
        
        # Test interview functionality
        interview_success, interview_data = tester.test_start_role_interview("Frontend Developer")
        tester.test_list_interviews()

    print_results(tester)
    return 0 if len(tester.failed_tests) == 0 else 1

def print_results(tester):
    """Print test results summary"""
    print("\n" + "=" * 60)
    print("📊 TEST RESULTS")
    print("=" * 60)
    print(f"Total Tests: {tester.tests_run}")
    print(f"Passed: {tester.tests_passed}")
    print(f"Failed: {len(tester.failed_tests)}")
    print(f"Success Rate: {(tester.tests_passed/tester.tests_run*100):.1f}%" if tester.tests_run > 0 else "0%")
    
    if tester.failed_tests:
        print(f"\n❌ Failed Tests:")
        for fail in tester.failed_tests:
            error_msg = fail.get('error', f"Expected {fail.get('expected')}, got {fail.get('actual')}")
            print(f"  - {fail['test']}: {error_msg}")
    else:
        print(f"\n🎉 All tests passed!")

if __name__ == "__main__":
    sys.exit(main())