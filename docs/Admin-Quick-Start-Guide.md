# Quick Start Guide: Admin Hierarchy System

## 🚀 Getting Started

### Step 1: Set Up the First Super Admin

Run the setup script to create your first super admin:

```bash
npm run setup:super-admin
```

This will create a super admin with these credentials:

- **Username**: `superadmin`
- **Email**: `superadmin@skillswaphub.com`
- **Password**: `SuperAdmin123!`

### Step 2: Login as Super Admin

1. Navigate to `/admin/login`
2. Use the credentials above to log in
3. **⚠️ Important**: Change the password immediately after first login!

### Step 3: Create Additional Admins

1. Go to the Admin Management section (only visible to super admins)
2. Click "Create Admin"
3. Fill in the admin details
4. Choose role: "Admin" or "Super Admin"
5. Set permissions as needed
6. Click "Create Admin"

## 🔑 Key Features

### Role-Based Access Control

- **Super Admin**: Can manage other admins + all system functions
- **Admin**: Can manage users and system functions (no admin management)

### Permission System

Each admin has specific permissions that control access to:

- Dashboard overview
- User management
- KYC processes
- Suggestions management
- System settings
- Document verification
- Reporting and analytics
- Admin management (super admin only)

### Security Features

- ✅ Secure password hashing
- ✅ JWT-based authentication
- ✅ Permission-based access control
- ✅ Audit trail for admin creation
- ✅ Admin status management (active/inactive/suspended)

## 📱 Using the Admin Interface

### Navigation

The sidebar shows different options based on your permissions:

- Super admins see "Admin Management" option
- Regular admins don't see admin management features

### Managing Admins (Super Admin Only)

1. **View All Admins**: See all administrator accounts
2. **Create New Admin**: Add new administrators with specific roles
3. **Edit Admin**: Update admin details, permissions, and status
4. **Delete Admin**: Remove administrator accounts (with confirmation)
5. **Search & Filter**: Find admins by username, email, role, or status

### Admin Status Management

- **Active**: Admin can log in and use the system
- **Inactive**: Admin account is disabled
- **Suspended**: Admin account is temporarily suspended

## 🔧 Troubleshooting

### Common Issues

**Q: I can't see the Admin Management option**
A: Only super admins can see this option. Make sure you're logged in with a super admin account.

**Q: Getting "Unauthorized" errors**
A: Check that you're logged in and have the required permissions for the action.

**Q: Setup script fails**
A: Make sure MongoDB is running and your connection string is correct in the environment variables.

### Default Permissions

**Super Admin Permissions:**

- manage_admins
- manage_users
- manage_kyc
- manage_suggestions
- manage_system
- manage_verification
- manage_reporting
- view_dashboard

**Admin Permissions:**

- manage_users
- manage_kyc
- manage_suggestions
- manage_verification
- view_dashboard

## 📋 Best Practices

1. **Change Default Passwords**: Always change the default super admin password
2. **Use Strong Passwords**: Require strong passwords for all admin accounts
3. **Regular Audits**: Regularly review admin accounts and permissions
4. **Principle of Least Privilege**: Only give admins the permissions they need
5. **Monitor Activity**: Keep track of admin actions and changes

## 🆘 Need Help?

If you encounter any issues:

1. Check the console for error messages
2. Verify your database connection
3. Ensure environment variables are set correctly
4. Check that you have the required permissions
5. Contact the development team for support

## 📊 System Overview

```
Super Admin (superadmin@skillswaphub.com)
├── Can create/manage other admins
├── Full system access
├── All permissions enabled
└── Cannot delete own account

Regular Admin (created by super admin)
├── Cannot manage other admins
├── Limited system access
├── Subset of permissions
└── Can be managed by super admin
```

This hierarchical system ensures secure and controlled access to your admin panel while maintaining flexibility for different admin roles.
