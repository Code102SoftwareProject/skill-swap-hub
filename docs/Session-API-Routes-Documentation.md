# Session API Routes Documentation

## Overview
The Session API provides comprehensive functionality for managing skill-swap sessions between users in the SkillSwap Hub platform. This includes session creation, management, progress tracking, completion, and reporting.

## Base Route
All session API routes are under: `/api/session/`

---

## Core Session Management

### 1. `/api/session` (Main Route)
**File:** `src/app/api/session/route.ts`

#### GET - Get All Sessions
- **Purpose:** Retrieve sessions with optional filtering
- **Query Parameters:**
  - `userId` (optional): Filter sessions for a specific user
  - `status` (optional): Filter by session status (pending, active, completed, canceled, rejected)
  - `search` (optional): Search by user names or skill titles
- **Response:** List of sessions with populated user and skill data
- **Features:**
  - Data consistency fixes (ensures status matches isAccepted field)
  - Full population of user, skill, and progress data
  - Search functionality across user names and skills

#### POST - Create New Session
- **Purpose:** Create a skill-swap session between two users
- **Required Fields:**
  - `user1Id`: ID of the first user
  - `skill1Id`: ID of the skill offered by user1
  - `descriptionOfService1`: Description of service from user1
  - `user2Id`: ID of the second user
  - `skill2Id`: ID of the skill offered by user2
  - `descriptionOfService2`: Description of service from user2
  - `startDate`: Session start date
- **Optional Fields:**
  - `expectedEndDate`: Expected completion date
- **Response:** Created session with populated data
- **Initial Status:** `pending` (waiting for acceptance)

#### PUT - Accept/Reject Session
- **Purpose:** Accept or reject a pending session
- **Query Parameters:**
  - `id`: Session ID
  - `action`: "accept" or "reject"
- **Features:**
  - Creates progress tracking documents when accepted
  - Updates session status appropriately
  - Links progress documents to session

---

## User-Specific Routes

### 2. `/api/session/user/[userId]`
**File:** `src/app/api/session/user/[userId]/route.ts`

#### GET - Get User's Sessions
- **Purpose:** Retrieve all sessions for a specific user
- **Parameters:** `userId` in URL path
- **Response:** All sessions where user is participant (user1 or user2)
- **Features:**
  - Full population of related data
  - Sorted by creation date (newest first)

### 3. `/api/session/between-users`
**File:** `src/app/api/session/between-users/route.ts`

#### GET - Get Sessions Between Two Users
- **Purpose:** Find all sessions between two specific users
- **Query Parameters:**
  - `user1Id`: First user ID
  - `user2Id`: Second user ID
- **Response:** Sessions between the two users (in either direction)
- **Features:**
  - Bidirectional search (A→B and B→A)
  - Data consistency fixes for rejected sessions
  - Full population including rejection details

### 4. `/api/session/[id]`
**File:** `src/app/api/session/[id]/route.ts`

#### GET - Get Session by ID
- **Purpose:** Retrieve a specific session by its ID
- **Parameters:** `id` in URL path
- **Response:** Single session with populated data
- **Features:** Optimized with lean queries for better performance

#### DELETE - Delete Session
- **Purpose:** Delete a session (admin/cleanup functionality)
- **Parameters:** `id` in URL path
- **Authorization:** Typically admin-only

---

## Session Actions

### 5. `/api/session/[id]/accept`
**File:** `src/app/api/session/[id]/accept/route.ts`

#### PATCH - Accept/Reject Session
- **Purpose:** Accept or reject a session request
- **Parameters:** 
  - `id`: Session ID in URL path
  - `action`: "accept" or "reject" in request body
  - `userId`: ID of user performing action
- **Features:**
  - Creates progress tracking for both users when accepted
  - Sets appropriate status and rejection details
  - Validates user authorization

### 6. `/api/session/[id]/cancel`
**File:** `src/app/api/session/[id]/cancel/route.ts`

#### PATCH - Cancel Session
- **Purpose:** Cancel an active session
- **Parameters:** `id` in URL path
- **Authorization:** Must be a participant in the session
- **Features:**
  - Updates session status to canceled
  - Preserves session history

---

## Progress Tracking

### 7. `/api/session/progress/[userId]`
**File:** `src/app/api/session/progress/[userId]/route.ts`

#### GET - Get User's Progress
- **Purpose:** Retrieve progress records for a user
- **Parameters:** `userId` in URL path
- **Response:** List of progress records with session data

#### PATCH - Update Progress
- **Purpose:** Update session progress for a user
- **Required Fields:**
  - `sessionId`: Session being updated
  - `completionPercentage`: Progress percentage (0-100)
  - `status`: Progress status
- **Optional Fields:**
  - `notes`: Progress notes
- **Features:**
  - Validates user participation in session
  - Updates or creates progress records

---

## Session Completion

### 8. `/api/session/complete`
**File:** `src/app/api/session/complete/route.ts`

#### POST - Request Session Completion (Legacy)
- **Purpose:** Legacy completion request system
- **Required Fields:**
  - `sessionId`: Session to complete
  - `userId`: User requesting completion
- **Status:** Being replaced by newer completion system

### 9. `/api/session/completion`
**File:** `src/app/api/session/completion/route.ts`

#### POST - Request Session Completion (New System)
- **Purpose:** Modern completion request system with approval workflow
- **Required Fields:**
  - `sessionId`: Session to complete
  - `userId`: User requesting completion
  - `requestForUser`: "self", "other", or "both"
- **Features:**
  - Handles completion requests and approvals
  - Supports rating system integration
  - Manages completion status transitions

#### GET - Get Completion Requests
- **Purpose:** Retrieve pending completion requests
- **Query Parameters:**
  - `sessionId` (optional): Filter by session
  - `userId` (optional): Filter by user
- **Response:** List of completion requests

### 10. `/api/session/completion-new`
**File:** `src/app/api/session/completion-new/route.ts`

#### POST - Advanced Completion System
- **Purpose:** Enhanced completion system with detailed workflow
- **Features:**
  - Multi-stage completion process
  - Automatic status management
  - Integration with rating system

---

## Counter Offers

### 11. `/api/session/counter-offer`
**File:** `src/app/api/session/counter-offer/route.ts`

#### POST - Create Counter Offer
- **Purpose:** Create a counter-proposal for a session
- **Required Fields:**
  - `originalSessionId`: Original session being countered
  - `counterOfferedBy`: User making the counter offer
  - `skill1Id`, `skill2Id`: Modified skill offerings
  - `descriptionOfService1`, `descriptionOfService2`: Updated descriptions
  - `startDate`, `expectedEndDate`: Modified timeline
  - `counterOfferMessage`: Explanation of changes
- **Features:**
  - Links to original session
  - Preserves negotiation history

#### GET - Get Counter Offers
- **Purpose:** Retrieve counter offers for sessions
- **Query Parameters:**
  - `sessionId` (optional): Filter by original session
  - `userId` (optional): Filter by user

### 12. `/api/session/counter-offer/[id]`
**File:** `src/app/api/session/counter-offer/[id]/route.ts`

#### GET - Get Specific Counter Offer
- **Purpose:** Retrieve details of a specific counter offer
- **Parameters:** `id` in URL path

#### PATCH - Accept/Reject Counter Offer
- **Purpose:** Respond to a counter offer
- **Features:**
  - Creates new session if accepted
  - Updates original session status

---

## Reporting System

### 13. `/api/session/report`
**File:** `src/app/api/session/report/route.ts`

#### POST - Submit Session Report
- **Purpose:** Report issues or misconduct in a session
- **Required Fields:**
  - `sessionId`: Session where issue occurred
  - `reportedBy`: User submitting report
  - `reportedUser`: User being reported
  - `reason`: Reason for report
  - `description`: Detailed description
- **Optional Fields:**
  - `evidenceFiles`: Supporting evidence
- **Features:**
  - Integrates with admin reporting system
  - Links to session and user records

#### GET - Get Session Reports
- **Purpose:** Retrieve reports for administrative review
- **Authorization:** Admin only
- **Query Parameters:**
  - `sessionId` (optional): Filter by session
  - `status` (optional): Filter by report status

### 14. `/api/session/report/[sessionId]`
**File:** `src/app/api/session/report/[sessionId]/route.ts`

#### GET - Get Reports for Specific Session
- **Purpose:** Retrieve all reports related to a specific session
- **Parameters:** `sessionId` in URL path
- **Authorization:** Admin or session participants

---

## Utility and Debug Routes

### 15. `/api/session/debug`
**File:** `src/app/api/session/debug/route.ts`

#### GET - Debug Session Data
- **Purpose:** Development tool for debugging session issues
- **Query Parameters:**
  - `userId`: User to debug
- **Features:**
  - Returns raw session data
  - Helpful for troubleshooting data inconsistencies
- **Environment:** Development/staging only

### 16. `/api/session/fix-status`
**File:** `src/app/api/session/fix-status/route.ts`

#### POST - Fix Session Status Inconsistencies
- **Purpose:** Repair data inconsistencies in session status
- **Features:**
  - Aligns status with isAccepted field
  - Batch updates for data migration

### 17. `/api/session/fix-completion`
**File:** `src/app/api/session/fix-completion/route.ts`

#### POST - Fix Completion Issues
- **Purpose:** Repair completion-related data issues
- **Features:**
  - Fixes stuck completion requests
  - Resolves completion status conflicts

### 18. `/api/session/fix-all-completions`
**File:** `src/app/api/session/fix-all-completions/route.ts`

#### POST - Bulk Fix Completion Issues
- **Purpose:** System-wide completion data repair
- **Features:**
  - Batch processing for all sessions
  - Comprehensive completion status fixes

---

## Session Status Flow

### Status Values:
- **pending**: Waiting for user acceptance
- **active**: Session is ongoing
- **completed**: Session finished successfully
- **canceled**: Session canceled by participant
- **rejected**: Session declined by recipient

### Typical Flow:
1. **Creation**: Session created with `pending` status
2. **Response**: Recipient accepts (`active`) or rejects (`rejected`)
3. **Progress**: Participants update progress during `active` phase
4. **Completion**: Session moves to `completed` when both users finish
5. **Alternative**: Session can be `canceled` by participants at any time

---

## Common Response Format

All routes follow this standard response format:

```json
{
  "success": boolean,
  "message": string (on error),
  "data": object (route-specific data),
  "sessions": array (for list endpoints),
  "session": object (for single session endpoints)
}
```

---

## Error Handling

All routes include comprehensive error handling for:
- Invalid ObjectId formats
- Missing required fields
- Authorization failures
- Database connection issues
- Data validation errors

Standard HTTP status codes are used:
- **200**: Success
- **201**: Created
- **400**: Bad Request
- **401**: Unauthorized
- **403**: Forbidden
- **404**: Not Found
- **500**: Internal Server Error

---

## Security Considerations

- User authorization is validated for all user-specific operations
- ObjectId validation prevents injection attacks
- Session participants are verified before allowing modifications
- Admin-only routes are properly protected
- Input validation prevents malformed data

---

## Integration Points

The Session API integrates with:
- **User Management**: User profiles and authentication
- **Skill System**: User skills and categories
- **Progress Tracking**: Session progress and completion
- **Rating System**: Post-session user ratings
- **Notification System**: Session updates and alerts
- **Reporting System**: Misconduct and issue reporting
- **Admin Dashboard**: Session management and oversight

This comprehensive API structure supports the full lifecycle of skill-swap sessions from creation to completion, with robust error handling, security measures, and administrative tools.
