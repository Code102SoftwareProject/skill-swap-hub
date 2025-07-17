# Notification System - Manual Test Cases

## Test Environment Setup
- **Browser**: Chrome, Firefox, Safari, Edge
- **Devices**: Desktop, Tablet, Mobile
- **Theme**: Light mode and Dark mode
- **Authentication**: Valid user account with notifications

---

## Test Case 1: Page Loading and Authentication

### TC-1.1: Authenticated User Access
**Objective**: Verify that authenticated users can access the notification page
**Preconditions**: User is logged in with valid credentials

**Steps**:
1. Navigate to `/user/notification`
2. Observe the page loading behavior

**Expected Results**:
- Page loads successfully
- Navbar is displayed
- User greeting message shows: "Hi {firstName}, here are your notifications:"
- Loading spinner appears briefly while fetching notifications
- No authentication errors occur

**Test Data**: Any valid authenticated user

---

### TC-1.2: Unauthenticated User Redirect
**Objective**: Verify that unauthenticated users are redirected to login
**Preconditions**: User is not logged in

**Steps**:
1. Navigate directly to `/user/notification`
2. Observe the redirect behavior

**Expected Results**:
- User is redirected to `/login?redirect=/user/notification`
- After successful login, user is redirected back to notification page

**Test Data**: No authentication token

---

## Test Case 2: Notification Display and UI

### TC-2.1: Empty Notification State
**Objective**: Verify the display when no notifications exist
**Preconditions**: User has no notifications

**Steps**:
1. Access notification page
2. Wait for page to load completely

**Expected Results**:
- Bell icon with "You have no notifications yet" message is displayed
- No notification count badge appears
- "Mark all as read" button is not visible
- Sort dropdown is not visible

---

### TC-2.2: Notifications with Unread Items
**Objective**: Verify display of notifications with unread items
**Preconditions**: User has both read and unread notifications

**Steps**:
1. Access notification page
2. Observe the layout and organization

**Expected Results**:
- Unread count badge displays correct number
- "Unread" section appears first with Inbox icon
- "Read" section appears below with History icon
- Unread notifications have colored left border
- Read notifications have gray styling
- "Mark all as read" button is visible

---

### TC-2.3: Notification Information Display
**Objective**: Verify all notification details are displayed correctly
**Preconditions**: User has various types of notifications

**Steps**:
1. Access notification page
2. Examine individual notification items

**Expected Results**:
- Each notification shows:
  - Type badge with appropriate color
  - Description text
  - Formatted timestamp (e.g., "Jan 15, 2:30 PM")
  - Info icon with type color
  - Action buttons (Mark Read/View) when applicable

---

## Test Case 3: Notification Actions

### TC-3.1: Mark Single Notification as Read
**Objective**: Verify marking individual notifications as read
**Preconditions**: User has unread notifications

**Steps**:
1. Locate an unread notification
2. Click "Mark Read" button
3. Observe the changes

**Expected Results**:
- Notification moves from "Unread" to "Read" section
- Visual styling changes to read state (gray border/background)
- "Mark Read" button disappears
- Unread count badge decreases by 1
- Server request is made to `/api/notification/read`

**Error Handling**:
- If server request fails, notification reverts to unread state
- Error is logged to console

---

### TC-3.2: Mark All Notifications as Read
**Objective**: Verify bulk marking of all notifications as read
**Preconditions**: User has multiple unread notifications

**Steps**:
1. Click "Mark all as read" button
2. Observe the changes

**Expected Results**:
- All notifications move to "Read" section
- Unread count badge disappears
- "Mark all as read" button disappears
- All notifications show read styling
- Server request is made to `/api/notification/read-all`

**Error Handling**:
- If server request fails, all notifications revert to previous state
- Error is logged to console

---

### TC-3.3: View Notification Target
**Objective**: Verify navigation to notification target destination
**Preconditions**: Notification has `targetDestination` property

**Steps**:
1. Locate a notification with "View" button
2. Click "View" button
3. Observe navigation behavior

**Expected Results**:
- User is navigated to the target destination URL
- Navigation occurs in the same window

---

## Test Case 4: Sorting and Filtering

### TC-4.1: Sort by Newest First (Default)
**Objective**: Verify default sorting behavior
**Preconditions**: User has multiple notifications with different timestamps

**Steps**:
1. Access notification page
2. Observe notification order
3. Check sort dropdown value

**Expected Results**:
- Notifications are sorted with newest first
- Sort dropdown shows "Newest First"
- Most recent notification appears at the top

---

### TC-4.2: Sort by Oldest First
**Objective**: Verify oldest first sorting
**Preconditions**: User has multiple notifications

**Steps**:
1. Click sort dropdown
2. Select "Oldest First"
3. Observe notification reordering

**Expected Results**:
- Notifications reorder with oldest first
- Order is maintained within read/unread sections
- Sort preference is retained during session

---

## Test Case 5: Real-time Notifications

### TC-5.1: Receive New Notification
**Objective**: Verify real-time notification reception
**Preconditions**: Socket connection is established, another user/admin can send notifications

**Steps**:
1. Keep notification page open
2. Have another user or trigger system send a notification
3. Observe real-time updates

**Expected Results**:
- New notification appears immediately at top of unread list
- Unread count badge increments
- No duplicate notifications appear
- Socket connection status can be verified in browser dev tools

---

### TC-5.2: Socket Connection Handling
**Objective**: Verify behavior with socket connection issues
**Preconditions**: Ability to simulate network issues

**Steps**:
1. Access notification page
2. Simulate network disconnection
3. Reconnect network
4. Trigger notification while disconnected and after reconnection

**Expected Results**:
- Page gracefully handles connection loss
- Notifications received after reconnection appear correctly
- No JavaScript errors occur

---

## Test Case 6: Error Handling

### TC-6.1: API Error Handling
**Objective**: Verify error handling for failed API requests
**Preconditions**: Ability to simulate API failures

**Steps**:
1. Simulate API failure for notification fetch
2. Observe error display

**Expected Results**:
- Red error banner appears with appropriate message
- Loading state is cleared
- User can retry by refreshing page

---

### TC-6.2: Invalid User ID
**Objective**: Verify handling of missing user identification
**Preconditions**: Corrupted or missing user data

**Steps**:
1. Access page with invalid user session
2. Observe error handling

**Expected Results**:
- Error message: "Could not identify user. Please log in again."
- No infinite loading state
- User is prompted to re-authenticate

---

## Test Case 7: Responsive Design

### TC-7.1: Mobile View
**Objective**: Verify mobile responsiveness
**Preconditions**: Mobile device or browser dev tools

**Steps**:
1. Access notification page on mobile viewport
2. Test all interactive elements

**Expected Results**:
- Layout adapts to mobile screen
- Action buttons are easily tappable
- Sort dropdown functions properly
- Text remains readable
- No horizontal scrolling required

---

### TC-7.2: Tablet View
**Objective**: Verify tablet responsiveness
**Preconditions**: Tablet device or browser dev tools

**Steps**:
1. Access notification page on tablet viewport
2. Test layout and interactions

**Expected Results**:
- Layout uses available space efficiently
- Touch interactions work properly
- Flex layouts adjust appropriately

---

## Test Case 8: Dark Mode

### TC-8.1: Dark Mode Display
**Objective**: Verify dark mode styling
**Preconditions**: Dark mode enabled in system/browser

**Steps**:
1. Enable dark mode
2. Access notification page
3. Verify all elements display correctly

**Expected Results**:
- All text is readable with proper contrast
- Background colors use dark theme
- Icons and borders adapt to dark mode
- No elements appear broken or invisible

---

### TC-8.2: Theme Switching
**Objective**: Verify dynamic theme switching
**Preconditions**: Ability to toggle theme while page is open

**Steps**:
1. Access page in light mode
2. Switch to dark mode
3. Switch back to light mode

**Expected Results**:
- Theme changes apply immediately
- No visual artifacts remain from previous theme
- All interactive elements continue to function

---

## Test Case 9: Performance

### TC-9.1: Large Notification Count
**Objective**: Verify performance with many notifications
**Preconditions**: User account with 100+ notifications

**Steps**:
1. Access notification page
2. Observe loading time and responsiveness
3. Test sorting and marking actions

**Expected Results**:
- Page loads within reasonable time (< 3 seconds)
- Scrolling is smooth
- Actions respond quickly
- No browser freezing or lag

---

### TC-9.2: Memory Usage
**Objective**: Verify memory efficiency during extended use
**Preconditions**: Browser dev tools open

**Steps**:
1. Keep notification page open for extended period
2. Receive multiple real-time notifications
3. Perform various actions repeatedly
4. Monitor memory usage in dev tools

**Expected Results**:
- Memory usage remains stable
- No significant memory leaks detected
- Performance doesn't degrade over time

---

## Test Case 10: Accessibility

### TC-10.1: Keyboard Navigation
**Objective**: Verify keyboard accessibility
**Preconditions**: Keyboard-only navigation

**Steps**:
1. Navigate to page using only Tab key
2. Activate buttons using Enter/Space
3. Use screen reader if available

**Expected Results**:
- All interactive elements are focusable
- Focus indicators are visible
- Buttons can be activated with keyboard
- ARIA labels provide context

---

### TC-10.2: Screen Reader Compatibility
**Objective**: Verify screen reader support
**Preconditions**: Screen reader software

**Steps**:
1. Navigate page with screen reader
2. Listen to announcement of page content

**Expected Results**:
- Page structure is announced clearly
- Notification content is readable
- Button purposes are clear
- Status changes are announced

---

## Browser Compatibility Test Matrix

| Feature | Chrome | Firefox | Safari | Edge | Notes |
|---------|--------|---------|--------|------|-------|
| Page Loading | ✓ | ✓ | ✓ | ✓ | Test basic functionality |
| Real-time Updates | ✓ | ✓ | ✓ | ✓ | Socket.io compatibility |
| Responsive Design | ✓ | ✓ | ✓ | ✓ | CSS Grid/Flexbox |
| Dark Mode | ✓ | ✓ | ✓ | ✓ | CSS custom properties |
| Date Formatting | ✓ | ✓ | ✓ | ✓ | date-fns library |

---

## Test Data Requirements

### Sample Notification Objects:
```json
{
  "_id": "notification_id_1",
  "typename": "Friend Request",
  "color": "#10B981",
  "description": "John Doe sent you a friend request",
  "createdAt": "2025-01-15T14:30:00Z",
  "isRead": false,
  "targetDestination": "/user/friends"
}
```

### User Test Accounts:
- **Primary Test User**: Account with various notification types
- **Secondary User**: For triggering real-time notifications
- **Admin Account**: For system notifications testing

---

## Test Environment Checklist

- [ ] Database contains test notifications
- [ ] Socket.io server is running
- [ ] Authentication system is functional
- [ ] API endpoints are accessible
- [ ] Test users have appropriate permissions
- [ ] Network simulation tools available (if testing offline scenarios)

---

## Regression Test Checklist

Before each release, verify:
- [ ] All critical paths work (TC-1.1, TC-2.2, TC-3.1, TC-3.2)
- [ ] Real-time notifications function (TC-5.1)
- [ ] Mobile responsiveness (TC-7.1)
- [ ] Error handling (TC-6.1, TC-6.2)
- [ ] Performance acceptable (TC-9.1)
- [ ] Cross-browser compatibility
