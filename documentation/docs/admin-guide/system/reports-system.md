# Admin Report Management System

## Overview

This system allows administrators to manage reports filed between users during active sessions.

## Data Models

### ReportInSession Schema

- `sessionId`: Reference to the session
- `reportedBy`: User who filed the report
- `reportedUser`: User being reported
- `reason`: Reason for the report
- `description`: Detailed description
- `evidenceFiles`: Array of file URLs
- `status`: 'pending' | 'under_review' | 'resolved' | 'dismissed'
- `adminResponse`: Admin's response message
- `adminId`: Admin who resolved the report
- `resolvedAt`: Date when report was resolved

### User Schema (Updated)

Added suspension object:

```typescript
suspension: {
  isSuspended: boolean;
  suspendedAt?: Date;
  reason?: string;
}
```

## API Endpoints

### GET /api/admin/reports

List all reports with filtering, pagination, and sorting.

**Query Parameters:**

- `status`: Filter by status (pending, under_review, resolved, dismissed)
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 10)
- `sortBy`: Sort field (default: createdAt)
- `sortOrder`: Sort order (asc/desc, default: desc)

**Response:**

```json
{
  "success": true,
  "data": {
    "reports": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalCount": 45,
      "limit": 10,
      "hasNext": true,
      "hasPrev": false
    },
    "statusSummary": {
      "pending": 12,
      "under_review": 8,
      "resolved": 23,
      "dismissed": 2
    }
  }
}
```

### GET /api/admin/reports/[id]

Get a single report with full details. First admin access changes status from 'pending' to 'under_review'.

**Response:**

```json
{
  "success": true,
  "data": {
    "report": {
      "_id": "...",
      "sessionId": {...},
      "reportedBy": {...},
      "reportedUser": {...},
      "reason": "not_submitting_work",
      "description": "...",
      "status": "under_review",
      "adminResponse": null,
      "adminId": null,
      "resolvedAt": null,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### PATCH /api/admin/reports/[id]/action

Resolve a report with an action (warn or suspend).

**Request Body:**

```json
{
  "action": "warn" | "suspend",
  "adminMessage": "Admin response message (max 1000 chars)",
  "adminId": "admin_user_id"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Report resolved with warn action",
  "data": {
    "report": {...}
  }
}
```

## Business Rules

1. **Status Flow**: pending → under_review → resolved/dismissed
2. **First Access**: When an admin first opens a report (GET /api/admin/reports/[id]), status changes from 'pending' to 'under_review'
3. **Action Validation**:
   - Admin message is required and must be ≤ 1000 characters
   - Action must be either 'warn' or 'suspend'
4. **Suspension**: When action is 'suspend', the user's suspension status is updated
5. **Transaction**: Report resolution and user suspension are handled in a single database transaction
6. **Email Notifications**: Both the reporting user and reported user receive email notifications

## Email Service

The system uses Nodemailer with Gmail SMTP. Configure these environment variables:

```env
GMAIL_USER=your-email@gmail.com
GMAIL_PASS=your-app-password
```

### Email Templates

- **Reported User**: Receives notification about warning/suspension
- **Reporting User**: Receives confirmation that their report was resolved

## Error Handling

- Input validation for all endpoints
- Transaction rollback on errors
- Email failures don't affect report resolution
- Proper HTTP status codes and error messages

## Usage Examples

### List pending reports

```bash
GET /api/admin/reports?status=pending&page=1&limit=10
```

### Get report details

```bash
GET /api/admin/reports/67581234567890abcdef1234
```

### Resolve report with warning

```bash
PATCH /api/admin/reports/67581234567890abcdef1234/action
Content-Type: application/json

{
  "action": "warn",
  "adminMessage": "This is a warning about your session behavior...",
  "adminId": "67581234567890abcdef5678"
}
```

### Resolve report with suspension

```bash
PATCH /api/admin/reports/67581234567890abcdef1234/action
Content-Type: application/json

{
  "action": "suspend",
  "adminMessage": "Your account has been suspended due to repeated violations...",
  "adminId": "67581234567890abcdef5678"
}
```

## Security Considerations

1. **Authentication**: All endpoints should be protected with admin authentication
2. **Authorization**: Only admins with appropriate permissions should access these endpoints
3. **Input Validation**: All inputs are validated and sanitized
4. **Transaction Safety**: Database operations use transactions to ensure consistency
5. **Email Security**: Use app-specific passwords for Gmail integration

## Testing

Use the provided test files to verify the system:

- Test report creation and retrieval
- Test report resolution with different actions
- Test email functionality
- Test error handling and edge cases
