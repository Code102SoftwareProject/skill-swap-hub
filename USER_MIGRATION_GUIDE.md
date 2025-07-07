# User Schema Migration Guide

## Overview

This guide covers the migration process for adding the `suspension` field to existing users in the database.

## What Was Added

### User Schema Changes

Added a `suspension` object to the User schema with the following structure:

```typescript
suspension: {
  isSuspended: { type: Boolean, default: false },
  suspendedAt: { type: Date },
  reason: { type: String }
}
```

### Interface Update

Updated the `IUser` interface to include:

```typescript
suspension: {
  isSuspended: boolean;
  suspendedAt?: Date;
  reason?: string;
};
```

## Migration Scripts

### 1. Migration Status Check

```bash
npm run migration:user-suspension-status
```

This checks:

- Total users in database
- Users with suspension field
- Users without suspension field
- Shows sample user data

### 2. Run Migration

```bash
npm run migrate:user-suspension
```

This will:

- Find all users without the suspension field
- Add the suspension field with default values
- Process users in batches of 100
- Verify the migration was successful

### 3. Test Migration

```bash
npm run test:user-suspension
```

This tests:

- Document structure
- Field updates (suspension/unsuspension)
- MongoDB operations
- Default values

### 4. Rollback (if needed)

```bash
npm run migration:user-suspension-rollback
```

This will remove the suspension field from all users.

## Migration Process

### For Existing Applications

1. **Backup Database** (recommended)

   ```bash
   mongodump --uri="your-mongodb-uri" --out backup-$(date +%Y%m%d)
   ```

2. **Check Current Status**

   ```bash
   npm run migration:user-suspension-status
   ```

3. **Run Migration**

   ```bash
   npm run migrate:user-suspension
   ```

4. **Verify Migration**
   ```bash
   npm run migration:user-suspension-status
   npm run test:user-suspension
   ```

### For New Applications

New users created through the application will automatically have the suspension field with default values:

- `isSuspended: false`
- `suspendedAt: null`
- `reason: null`

## Usage Examples

### Admin Suspension API Usage

Once migrated, the admin reports system can suspend users:

```javascript
// Suspend a user
await User.findByIdAndUpdate(userId, {
  "suspension.isSuspended": true,
  "suspension.suspendedAt": new Date(),
  "suspension.reason": "Violation of community guidelines",
});
```

### Check if User is Suspended

```javascript
// In your authentication middleware
const user = await User.findById(userId);
if (user.suspension.isSuspended) {
  return res.status(403).json({
    error: "Account suspended",
    reason: user.suspension.reason,
    suspendedAt: user.suspension.suspendedAt,
  });
}
```

### Query Suspended Users

```javascript
// Find all suspended users
const suspendedUsers = await User.find({
  "suspension.isSuspended": true,
});

// Find users suspended after a certain date
const recentlySuspended = await User.find({
  "suspension.suspendedAt": { $gte: new Date("2024-01-01") },
});
```

## File Structure

```
scripts/
├── migrateUserSuspension.mjs          # Main migration script
├── testUserSuspensionSimple.mjs       # Test script
src/
├── lib/
│   └── models/
│       └── userSchema.ts              # Updated schema
└── scripts/
    └── migrations/
        ├── migrate-user-suspension.mjs    # Alternative migration
        └── migrate-user-suspension.js     # Old version (problematic)
```

## Troubleshooting

### No Users Found

If the migration shows 0 users, this is normal for new applications. The schema is ready for when users are created.

### Migration Fails

1. Check database connection
2. Verify MongoDB URI in .env
3. Check for sufficient database permissions
4. Review error logs

### ES Module Issues

The migration scripts use `.mjs` extension to work with ES modules. If you encounter import issues:

1. Ensure you're using Node.js 14+
2. Check that the file has `.mjs` extension
3. Verify the MongoDB connection string

## Verification

After migration, you should see:

- ✅ All existing users have suspension field
- ✅ New users automatically get suspension field
- ✅ Admin reports system can suspend/unsuspend users
- ✅ Email notifications work for suspended users

## Next Steps

1. **Test the Admin Reports System**

   ```bash
   npm run test:admin-reports
   ```

2. **Test Email Service**

   ```bash
   npm run test:email-service your-email@example.com
   ```

3. **Update Frontend** (if needed)
   - Add suspension status checks to login/auth
   - Display suspension messages to users
   - Update admin dashboard to show suspension status

## Security Considerations

- Only admins should be able to suspend/unsuspend users
- Always log suspension actions for audit trails
- Consider implementing suspension appeals process
- Notify users via email when suspended/unsuspended

The migration is complete and the system is ready for production use!
