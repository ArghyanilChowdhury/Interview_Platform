# Test Credentials for Interview Platform

## Test User (Created for Iteration 10)
- **Email**: test@example.com
- **Password**: test123
- **User ID**: test_user_iter10
- **Auth Type**: local (email/password)

## How to Create Test User
If database is wiped, run this command to create a test user:

```bash
# Generate bcrypt hash
python3 -c "import bcrypt; print(bcrypt.hashpw('test123'.encode(), bcrypt.gensalt()).decode())"

# Insert user into MongoDB
mongosh --quiet --eval "
use('test_database');
db.users.insertOne({
  user_id: 'test_user_iter10',
  email: 'test@example.com',
  name: 'Test User Iter10',
  password_hash: '<BCRYPT_HASH_FROM_ABOVE>',
  picture: null,
  auth_type: 'local',
  email_verified: true,
  created_at: new Date().toISOString()
});
"
```

## OTP Testing
For OTP testing, send OTP to any email, then query the database:
```bash
mongosh --quiet --eval "
use('test_database');
db.otps.findOne({email: 'your_email@example.com'});
"
```
