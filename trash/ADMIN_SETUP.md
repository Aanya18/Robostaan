# Admin Setup Instructions

## Admin Key Information

The admin key for creating admin accounts is: **`ROBOSTAAN_ADMIN_2024`**

## How to Create Admin Account

1. Go to the signup page: `/signup`
2. Select **"Admin"** account type
3. Fill in your details:
   - Full Name
   - Email Address
   - Admin Key: `ROBOSTAAN_ADMIN_2024`
   - Password
   - Confirm Password
4. Click "Create Admin Account"

## Admin Privileges

Admin accounts have the following privileges:
- ✅ Create, edit, and delete blog posts
- ✅ Create, edit, and delete courses
- ✅ Mark courses as "Coming Soon"
- ✅ Manage user accounts
- ✅ Access admin panel
- ✅ View analytics and reports

## Security Notes

- The admin key is hardcoded for demo purposes
- In production, this should be:
  - Stored as an environment variable
  - Rotated regularly
  - Logged for security auditing
  - Validated against a secure database

## Demo Admin Account

You can also use the pre-created demo admin account:
- **Email**: `admin@robostaan.in`
- **Password**: `admin123`

## Changing the Admin Key

To change the admin key:
1. Update the `ADMIN_SECRET_KEY` constant in `src/pages/Signup.tsx`
2. Inform authorized personnel of the new key
3. Consider implementing a more secure key management system

## Production Recommendations

For production deployment:
1. Move admin key to environment variables
2. Implement key rotation mechanism
3. Add audit logging for admin account creation
4. Consider multi-factor authentication for admin accounts
5. Implement role-based permissions system