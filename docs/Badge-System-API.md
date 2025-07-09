# Badge System API Documentation

## Overview

The badge system has been reorganized to separate badge logic from match completion logic. Badge assignments are now handled through dedicated endpoints and services.

## API Endpoints

### 1. Badge Assignment after Match Completion

**Endpoint:** `POST /api/badge-assignments/match-completion`
**Purpose:** Handles badge assignments when a skill exchange match is completed

**Request Body:**

```json
{
  "userOneId": "string",
  "userTwoId": "string",
  "matchId": "string"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Badge assignment completed for match {matchId}",
  "data": {
    "matchId": "string",
    "userOneAssigned": ["First Exchange"],
    "userTwoAssigned": [],
    "totalBadgesAssigned": 1
  }
}
```

**Usage:** This endpoint is automatically called when a match status is updated to "completed" via the matches API.

---

### 2. Check Badge Eligibility

**Endpoint:** `GET /api/badge-assignments/match-completion?userOneId=string&userTwoId=string`
**Purpose:** Check badge eligibility for two users without assigning badges

**Response:**

```json
{
  "success": true,
  "data": {
    "userOne": {
      "userId": "string",
      "completedSessions": 1,
      "hasFirstExchangeBadge": false,
      "eligibleForFirstExchange": true
    },
    "userTwo": {
      "userId": "string",
      "completedSessions": 3,
      "hasFirstExchangeBadge": true,
      "eligibleForFirstExchange": false
    }
  }
}
```

---

### 3. Manual Badge Assignment

**Endpoint:** `POST /api/user-badges`
**Purpose:** Manually assign a specific badge to a user

**Request Body:**

```json
{
  "userId": "string",
  "badgeName": "First Exchange"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Badge 'First Exchange' assigned successfully"
}
```

---

### 4. Check and Assign All Badges

**Endpoint:** `PATCH /api/user-badges`
**Purpose:** Check all badge eligibility and assign qualifying badges

**Request Body:**

```json
{
  "userId": "string",
  "specificBadge": "First Exchange" // Optional - for specific badge only
}
```

**Response:**

```json
{
  "success": true,
  "assignedBadges": ["First Exchange", "Quick Learner"],
  "badgeCount": 2,
  "message": "Assigned 2 new badges: First Exchange, Quick Learner"
}
```

---

### 5. Get User Badges

**Endpoint:** `GET /api/user-badges?userId=string`
**Purpose:** Retrieve all badges assigned to a user

**Response:**

```json
{
  "success": true,
  "badges": [
    {
      "_id": "string",
      "badgeName": "First Exchange",
      "badgeImage": "string",
      "description": "Completed your first skill exchange",
      "criteria": "Complete 1 skill exchange session"
    }
  ],
  "badgeCount": 1
}
```

---

### 6. Badge CRUD Operations

**Endpoint:** `/api/badge`

- `GET` - Get all available badges
- `POST` - Create new badge
- `PUT` - Update existing badge
- `DELETE` - Delete badge

---

## Service Functions

### Core Service: `badgeAssignmentService.ts`

#### `handleMatchCompletionBadges(userOneId, userTwoId, matchId)`

- **Purpose:** Central function for processing badge assignments after match completion
- **Returns:** `{ userOneAssigned: string[], userTwoAssigned: string[] }`
- **Usage:** Called automatically when matches are completed

#### `checkAndAssignFirstExchangeBadge(userId)`

- **Purpose:** Checks if user qualifies for "First Exchange" badge and assigns it
- **Logic:** Assigns badge if user has completed exactly 1 session and doesn't already have the badge
- **Returns:** `boolean` - true if badge was assigned

#### `assignBadgeToUser(userId, badgeName)`

- **Purpose:** Assigns any badge to a user if they don't already have it
- **Returns:** `boolean` - true if badge was assigned

#### `userHasBadge(userId, badgeName)`

- **Purpose:** Check if user already has a specific badge
- **Returns:** `boolean`

#### `getCompletedSkillSessionsCount(userId)`

- **Purpose:** Count how many skill exchange sessions a user has completed
- **Returns:** `number`

## Badge Types

### Currently Implemented

1. **First Exchange** - Awarded after completing the first skill exchange session
2. **Quick Learner** - Awarded for completing sessions quickly
3. **Skill Master** - Awarded for demonstrating expertise in multiple skills
4. **Community Champion** - Awarded for active community participation

### Badge Criteria

- **First Exchange:** Complete exactly 1 skill exchange session
- **Quick Learner:** Complete sessions within specific time frames
- **Skill Master:** Have 5+ verified skills with high ratings
- **Community Champion:** Active in forums, help other users

## Integration Points

### Match Completion Flow

1. User marks match as "completed" via `PUT /api/matches/[id]`
2. Match API calls `handleMatchCompletionBadges()`
3. Badge service checks eligibility for both users
4. Qualifying badges are automatically assigned
5. Badge assignment results are logged

### Error Handling

- Badge assignment failures don't prevent match completion
- All badge operations are wrapped in try-catch blocks
- Detailed logging for debugging badge assignment issues

## Testing

### Test Scripts Available

- `src/scripts/testBadgeRefactoring.ts` - Test the refactored badge system
- `src/scripts/testBadgeSystem.ts` - Comprehensive badge system testing
- `src/scripts/setupBadgeSystem.ts` - Setup and initialize badge system

### Testing Workflow

1. Run badge system setup: `npm run setup-badges`
2. Test badge assignment: `npm run test-badges`
3. Test match completion flow: Complete a match via API and verify badge assignment

## Migration Notes

### Changes Made

1. **Removed** badge assignment logic from `matches/[id]/route.ts`
2. **Added** dedicated badge assignment service function `handleMatchCompletionBadges()`
3. **Created** specialized endpoint `/api/badge-assignments/match-completion`
4. **Maintained** existing user-badges API for manual operations

### Benefits

- **Separation of Concerns:** Badge logic is now isolated from match logic
- **Reusability:** Badge functions can be used from multiple places
- **Maintainability:** Easier to add new badge types and modify criteria
- **Testing:** Badge logic can be tested independently
- **Performance:** Dedicated endpoints for specific badge operations

### Backward Compatibility

- All existing badge APIs continue to work
- Match completion still triggers badge assignment automatically
- No changes required to frontend code
