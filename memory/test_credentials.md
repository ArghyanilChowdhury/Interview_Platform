# Test Credentials for Interview Platform

## Test User
- **Email**: test@interviewmaster.com
- **Password**: Test@123
- **User ID**: user_test_e2e
- **Auth Type**: local (email/password)

## API URL
- **Backend URL**: https://mock-interview-coach-1.preview.emergentagent.com

## OTP Testing
For OTP testing, send OTP to any email, then query the database:
```bash
mongosh --quiet --eval "
use('test_database');
db.otps.findOne({email: 'your_email@example.com'});
"
```

Or check backend logs:
```bash
tail -n 50 /var/log/supervisor/backend.err.log
```
