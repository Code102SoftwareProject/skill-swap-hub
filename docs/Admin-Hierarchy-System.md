# Admin Hierarchy System

This document explains the new hierarchical admin system implemented in the Skill Swap Hub platform.

## Overview

The admin system now supports two levels of administrators:

1. **Super Admin** - Can manage all system functions including creating/managing other admins
2. **Admin** - Can manage users and system functions but cannot manage other admins

## Admin Roles

### Super Admin

- **Role**: `super_admin`
- **Default Permissions**:
  - `manage_admins` - Create, update, and delete admin accounts
  - `manage_users` - Manage user accounts and profiles
  - `manage_kyc` - Handle KYC verification processes
  - `manage_suggestions` - Review and manage user suggestions
  - `manage_system` - System configuration and settings
  - `manage_verification` - Handle document verification
  - `manage_reporting` - Access to reporting and analytics
  - `view_dashboard` - Access to dashboard overview

### Admin

- **Role**: `admin`
- **Default Permissions**:
  - `manage_users` - Manage user accounts and profiles
  - `manage_kyc` - Handle KYC verification processes
  - `manage_suggestions` - Review and manage user suggestions
  - `manage_verification` - Handle document verification
  - `view_dashboard` - Access to dashboard overview

## Database Schema Changes

The admin schema has been updated with the following new fields:

```javascript
{
  // ... existing fields ...

  // Admin role - either 'super_admin' or 'admin'
  role: {
    type: String,
    enum: ["super_admin", "admin"],
    default: "admin",
    required: true,
  },

  // ID of the super admin who created this admin
  createdBy: {
    type: mongoose.Types.ObjectId,
    ref: "Admin",
    default: null,
  },

  // Admin status - active, inactive, suspended
  status: {
    type: String,
    enum: ["active", "inactive", "suspended"],
    default: "active",
    required: true,
  },

  // Permissions array for granular access control
  permissions: {
    type: [String],
    default: function() { /* role-based defaults */ },
  },
}
```

## API Endpoints

### Create Admin

**POST** `/api/admin/create-admin`

Creates a new admin account. Only super admins can access this endpoint.

**Request Body:**

```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "role": "admin" | "super_admin",
  "permissions": ["permission1", "permission2", ...] // optional
}
```

### Get All Admins

**GET** `/api/admin/create-admin`

Retrieves all admin accounts. Only super admins can access this endpoint.

### Update Admin

**PUT** `/api/admin/manage-admin`

Updates an existing admin account. Only super admins can access this endpoint.

**Request Body:**

```json
{
  "adminId": "string",
  "username": "string", // optional
  "email": "string", // optional
  "password": "string", // optional
  "role": "admin" | "super_admin", // optional
  "permissions": ["permission1", "permission2", ...], // optional
  "status": "active" | "inactive" | "suspended" // optional
}
```

### Delete Admin

**DELETE** `/api/admin/manage-admin?id=adminId`

Deletes an admin account. Only super admins can access this endpoint.

## Frontend Components

### AdminManagementContent

A comprehensive admin management interface that allows super admins to:

- View all admin accounts
- Create new admin accounts
- Edit existing admin accounts
- Delete admin accounts
- Manage permissions and roles
- Filter and search admins

### Updated AdminSidebar

The sidebar now includes permission-based navigation:

- Shows "Admin Management" option only to super admins
- Hides navigation items based on user permissions

## Setup Instructions

### 1. Run the Setup Script

Execute the setup script to create the first super admin and update existing admins:

```bash
node scripts/setupSuperAdmin.js
```

This script will:

- Create the first super admin account
- Update existing admin accounts with the new role structure
- Set default permissions based on roles

### 2. Default Super Admin Credentials

The script creates a super admin with these credentials:

- **Username**: `superadmin`
- **Email**: `superadmin@skillswaphub.com`
- **Password**: `SuperAdmin123!`

**⚠️ IMPORTANT**: Change these credentials immediately after first login!

### 3. Environment Variables

Ensure your environment variables are set:

```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
```

## Security Features

1. **Permission-based Access Control**: Each admin has specific permissions that control what they can access
2. **Role-based Defaults**: Permissions are automatically assigned based on the admin's role
3. **Audit Trail**: All admin accounts track who created them
4. **Status Management**: Admins can be activated, deactivated, or suspended
5. **Secure Password Storage**: All passwords are hashed with bcrypt (12 rounds)
6. **JWT Authentication**: Secure token-based authentication for API calls

## Usage Examples

### Creating a New Admin (Super Admin Only)

1. Navigate to the Admin Management section
2. Click "Create Admin"
3. Fill in the required information
4. Select role and permissions
5. Click "Create Admin"

### Updating Admin Permissions

1. Navigate to the Admin Management section
2. Find the admin you want to update
3. Click the edit icon
4. Modify permissions as needed
5. Click "Update Admin"

### Promoting an Admin to Super Admin

1. Navigate to the Admin Management section
2. Find the admin you want to promote
3. Click the edit icon
4. Change role to "Super Admin"
5. Permissions will be automatically updated
6. Click "Update Admin"

## Migration from Old System

If you're upgrading from the old admin system:

1. Run the setup script to update existing admins
2. The first super admin will be created automatically
3. All existing admins will be assigned the "admin" role with default permissions
4. No data will be lost during the migration

## Troubleshooting

### Common Issues

1. **"Unauthorized" Error**: Make sure you're logged in as a super admin
2. **Permission Denied**: Check that your admin account has the required permissions
3. **Database Connection**: Ensure MongoDB is running and connection string is correct
4. **JWT Token Invalid**: Try logging out and logging back in

### Support

For additional support or questions about the admin hierarchy system, please contact the development team.
