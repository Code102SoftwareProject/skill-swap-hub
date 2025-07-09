# Instructions to Clean Badge Assignment Testing

## The Issue

New accounts are getting badges automatically, likely due to:

1. Someone calling `/api/user-badges` PATCH endpoint which runs `checkAndAssignAllBadges()`
2. Test scripts being run that assign badges
3. Potential logic errors in badge criteria

## Solutions

### Option 1: Use Fresh Database

1. Clear your database or use fresh user accounts with unique emails
2. Ensure no test scripts are running

### Option 2: Temporarily Disable Auto-Assignment

Add this check to badgeAssignmentService.ts functions:

```typescript
// Add to beginning of each badge check function
if (
  process.env.NODE_ENV === "development" &&
  process.env.DISABLE_AUTO_BADGES === "true"
) {
  console.log("Auto badge assignment disabled for testing");
  return false;
}
```

### Option 3: Clean Test Process

1. Create users with unique emails (e.g., test_TIMESTAMP@example.com)
2. Never call `/api/user-badges` PATCH endpoint
3. Only test the match completion badge assignment
4. Monitor server logs carefully

## Recommended Environment Variables

Add to your .env file:

```
DISABLE_AUTO_BADGES=true  # For testing only
DEBUG_BADGES=true         # For verbose badge logging
```
