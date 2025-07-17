# Session System Manual Testing Guide

## Overview
This document provides comprehensive manual testing test cases for the complete Session System in the SkillSwap Hub platform. The session system enables users to create, manage, and complete skill-swap sessions with other users.

## Test Environment Setup
- **Browser:** Chrome, Firefox, Safari, Edge
- **Users:** Minimum 3 test users with different skills
- **Data:** Pre-populated user skills and profiles
- **Network:** Test on different connection speeds

---

## Test Categories

### 1. Session Creation & Management
### 2. Session Acceptance & Rejection
### 3. Counter Offers System
### 4. Progress Tracking
### 5. Work Submission & Review
### 6. Session Completion Flow
### 7. Session Cancellation
### 8. Reporting System
### 9. UI/UX Components
### 10. Edge Cases & Error Handling

---

## 1. SESSION CREATION & MANAGEMENT

### TC-SC-001: Create New Session Request
**Priority:** High
**Prerequisites:** 
- User A and User B exist with different skills
- User A is logged in
- Users have less than 3 active sessions between them

**Test Steps:**
1. Navigate to User B's profile or chat
2. Click "New Session" button
3. Select skill you want to learn from User B
4. Select skill you want to offer to User B
5. Enter detailed description of service you'll provide
6. Set start date (today or future)
7. Set expected end date (optional)
8. Click "Create Session Request"

**Expected Results:**
- Session created with status "pending"
- User B receives notification
- Session appears in both users' session lists
- Session ID generated and stored
- All required fields validated

**Test Data:**
- Valid user IDs
- Valid skill IDs
- Description: minimum 10 characters
- Start date: today or future
- End date: after start date

---

### TC-SC-002: Session Creation Validation
**Priority:** High
**Prerequisites:** User logged in with skills

**Test Steps:**
1. Try creating session with missing required fields
2. Try creating session with yourself
3. Try creating session with non-existent user
4. Try creating session with invalid skill IDs
5. Try creating session with past start date
6. Try creating session when already have 3 active sessions

**Expected Results:**
- Appropriate error messages for each validation
- Form prevents submission with invalid data
- Clear feedback on what needs to be corrected
- Session limit error when at maximum

---

### TC-SC-003: Session List Display
**Priority:** Medium
**Prerequisites:** Multiple sessions exist

**Test Steps:**
1. Navigate to sessions page
2. Verify all session statuses display correctly
3. Check session sorting (newest first)
4. Verify user and skill information populated
5. Check session action buttons based on status

**Expected Results:**
- Sessions grouped by status (pending, active, completed, etc.)
- Correct user names and avatars displayed
- Skill titles and descriptions shown
- Appropriate action buttons for each status
- Pagination if many sessions exist

---

## 2. SESSION ACCEPTANCE & REJECTION

### TC-AR-001: Accept Session Request
**Priority:** High
**Prerequisites:** 
- Session exists with status "pending"
- User B (receiver) is logged in

**Test Steps:**
1. Navigate to session request
2. Review session details
3. Click "Accept" button
4. Confirm acceptance in modal dialog

**Expected Results:**
- Session status changes to "active"
- Progress tracking created for both users
- Notification sent to requester (User A)
- Session appears in active sessions
- Session workspace becomes accessible

---

### TC-AR-002: Reject Session Request
**Priority:** High
**Prerequisites:** 
- Session exists with status "pending"
- User B (receiver) is logged in

**Test Steps:**
1. Navigate to session request
2. Review session details
3. Click "Reject" button
4. Optionally provide rejection reason
5. Confirm rejection

**Expected Results:**
- Session status changes to "rejected"
- Rejection timestamp recorded
- Notification sent to requester
- Session appears in rejected sessions
- Rejection reason stored if provided

---

### TC-AR-003: Edit Session Before Acceptance
**Priority:** Medium
**Prerequisites:** 
- User A created session
- Session status is "pending"
- User A is logged in

**Test Steps:**
1. Navigate to pending session
2. Click "Edit" button
3. Modify description or dates
4. Save changes

**Expected Results:**
- Session updated with new information
- Last modified timestamp updated
- User B sees updated information
- Edit history maintained

---

## 3. COUNTER OFFERS SYSTEM

### TC-CO-001: Create Counter Offer
**Priority:** Medium
**Prerequisites:** 
- Session exists with status "pending" or "active"
- User has permission to create counter offer

**Test Steps:**
1. Navigate to session details
2. Click "Counter Offer" button
3. Modify offered skill or description
4. Adjust dates if needed
5. Provide reason for counter offer
6. Submit counter offer

**Expected Results:**
- Counter offer created and linked to session
- Original session status unchanged
- Notification sent to other user
- Counter offer appears in session interface

---

### TC-CO-002: Accept Counter Offer
**Priority:** Medium
**Prerequisites:** Counter offer exists

**Test Steps:**
1. Navigate to session with counter offer
2. Review counter offer details
3. Click "Accept Counter Offer"
4. Confirm acceptance

**Expected Results:**
- Original session updated with counter offer terms
- Counter offer marked as accepted
- Session progresses to appropriate status
- Both users notified of acceptance

---

### TC-CO-003: Reject Counter Offer
**Priority:** Medium
**Prerequisites:** Counter offer exists

**Test Steps:**
1. Navigate to session with counter offer
2. Review counter offer details
3. Click "Reject Counter Offer"
4. Optionally provide reason
5. Confirm rejection

**Expected Results:**
- Counter offer marked as rejected
- Original session terms remain
- Rejection reason stored
- User notified of rejection

---

## 4. PROGRESS TRACKING

### TC-PT-001: Update Session Progress
**Priority:** High
**Prerequisites:** 
- Active session exists
- User is session participant

**Test Steps:**
1. Navigate to session workspace
2. Go to Progress tab
3. Update completion percentage (0-100%)
4. Select progress status (not_started, in_progress, completed, blocked)
5. Add progress notes
6. Set or update due date
7. Save progress update

**Expected Results:**
- Progress saved to database
- Other user can see updated progress
- Progress timeline updated
- Percentage validates (0-100)
- Status reflects actual progress

---

### TC-PT-002: View Progress Timeline
**Priority:** Medium
**Prerequisites:** Session with progress updates

**Test Steps:**
1. Navigate to session Progress tab
2. View progress history
3. Check timestamps and notes
4. Verify progress by both users displayed

**Expected Results:**
- Chronological progress timeline
- Both users' progress shown separately
- Clear timestamps for each update
- Progress notes displayed properly

---

### TC-PT-003: Progress Notifications
**Priority:** Medium
**Prerequisites:** Active session with progress tracking

**Test Steps:**
1. User A updates progress significantly
2. Check if User B receives notification
3. Verify notification content accuracy

**Expected Results:**
- Notification sent to other user
- Progress percentage included in notification
- Link to session provided in notification

---

## 5. WORK SUBMISSION & REVIEW

### TC-WS-001: Submit Work
**Priority:** High
**Prerequisites:** 
- Active session exists
- User has work to submit

**Test Steps:**
1. Navigate to session workspace
2. Go to "Submit Work" tab
3. Enter work title and description
4. Upload files (if applicable)
5. Select work type
6. Submit work

**Expected Results:**
- Work submission created
- Files uploaded successfully
- Other user notified of submission
- Work appears in "View Works" tab
- Submission timestamp recorded

---

### TC-WS-002: File Upload Validation
**Priority:** High
**Prerequisites:** Submit Work tab open

**Test Steps:**
1. Try uploading different file types
2. Try uploading oversized files
3. Try uploading malicious files
4. Test multiple file uploads

**Expected Results:**
- Only allowed file types accepted
- File size limits enforced
- Security validation performed
- Multiple files handled correctly
- Clear error messages for invalid files

---

### TC-WS-003: Review Submitted Work
**Priority:** High
**Prerequisites:** Work has been submitted

**Test Steps:**
1. Navigate to "View Works" tab
2. Select work submission to review
3. Download and view attached files
4. Click "Accept" or "Reject" work
5. Provide review comments
6. Submit review

**Expected Results:**
- Work details displayed correctly
- Files download properly
- Review options available
- Comments recorded with review
- Submitter notified of review result

---

### TC-WS-004: Work Rejection Workflow
**Priority:** Medium
**Prerequisites:** Work submission exists

**Test Steps:**
1. Review submitted work
2. Click "Reject" button
3. Provide detailed rejection reason
4. Submit rejection

**Expected Results:**
- Work marked as rejected
- Rejection reason stored
- Submitter notified with reason
- Work can be resubmitted after fixes

---

## 6. SESSION COMPLETION FLOW

### TC-CF-001: Request Session Completion
**Priority:** High
**Prerequisites:** 
- Active session with substantial progress
- User believes session should be completed

**Test Steps:**
1. Navigate to session overview
2. Click "Request Completion" button
3. Confirm completion request
4. Optionally add completion notes

**Expected Results:**
- Completion request created
- Other user notified of request
- Session status updated to show pending completion
- Request timestamp recorded

---

### TC-CF-002: Approve Session Completion
**Priority:** High
**Prerequisites:** Completion request exists

**Test Steps:**
1. Navigate to session with completion request
2. Review completion request details
3. Click "Approve Completion"
4. Confirm approval

**Expected Results:**
- Session status changes to "completed"
- Both users receive completion notification
- Rating system becomes available
- Session workspace becomes read-only

---

### TC-CF-003: Reject Completion Request
**Priority:** High
**Prerequisites:** Completion request exists

**Test Steps:**
1. Navigate to session with completion request
2. Review completion request
3. Click "Reject Completion"
4. Provide rejection reason
5. Submit rejection

**Expected Results:**
- Completion request rejected
- Session remains active
- Rejection reason provided to requester
- Session can continue

---

### TC-CF-004: Post-Completion Rating
**Priority:** Medium
**Prerequisites:** Session completed

**Test Steps:**
1. Navigate to completed session
2. Access rating interface
3. Provide rating (1-5 stars)
4. Write detailed review comment
5. Submit rating

**Expected Results:**
- Rating recorded for other user
- Review comment saved
- Rating affects user's overall rating
- Cannot rate same session twice

---

## 7. SESSION CANCELLATION

### TC-CAN-001: Cancel Active Session
**Priority:** High
**Prerequisites:** 
- Active session exists
- User is session participant

**Test Steps:**
1. Navigate to active session
2. Click "Cancel Session" option
3. Provide cancellation reason
4. Confirm cancellation

**Expected Results:**
- Session status changes to "canceled"
- Other user notified of cancellation
- Cancellation reason stored
- Session becomes read-only

---

### TC-CAN-002: Cancel Request Workflow
**Priority:** Medium
**Prerequisites:** Session exists

**Test Steps:**
1. User A requests session cancellation
2. User B receives cancellation request
3. User B can approve or reject cancellation
4. Test both approval and rejection paths

**Expected Results:**
- Cancellation request system works
- Both users involved in decision
- Clear communication about cancellation
- Proper status updates

---

## 8. REPORTING SYSTEM

### TC-REP-001: Report Session Issue
**Priority:** Medium
**Prerequisites:** 
- Session exists
- User experienced issue

**Test Steps:**
1. Navigate to session Report tab
2. Select issue category
3. Provide detailed description
4. Upload evidence files (optional)
5. Submit report

**Expected Results:**
- Report created and stored
- Admin notification sent
- Report ID generated
- Evidence files uploaded correctly

---

### TC-REP-002: Report Categories
**Priority:** Low
**Prerequisites:** Report tab accessible

**Test Steps:**
1. Test each report category:
   - Inappropriate behavior
   - Quality issues
   - Communication problems
   - Technical issues
   - Violation of terms

**Expected Results:**
- All categories selectable
- Appropriate sub-options for each category
- Relevant guidance text displayed

---

## 9. UI/UX COMPONENTS

### TC-UI-001: Session Box Component
**Priority:** Medium
**Prerequisites:** Users with sessions

**Test Steps:**
1. Navigate to chat interface
2. Open session box with another user
3. Test all interactive elements
4. Verify session counter (3 max limit)
5. Test responsive design

**Expected Results:**
- Session box loads properly
- All buttons functional
- Session limit displayed correctly
- Responsive on different screen sizes
- Performance smooth

---

### TC-UI-002: Session Workspace Tabs
**Priority:** Medium
**Prerequisites:** Active session

**Test Steps:**
1. Navigate to session workspace
2. Test each tab:
   - Overview
   - Submit Work
   - View Works
   - Progress
   - Report Issue
3. Verify tab navigation works
4. Check disabled states for completed/canceled sessions

**Expected Results:**
- All tabs accessible when appropriate
- Tab content loads correctly
- Navigation smooth
- Proper disabling of tabs when session completed/canceled

---

### TC-UI-003: Modal Components
**Priority:** Medium
**Prerequisites:** Various modal-triggering actions

**Test Steps:**
1. Test each modal:
   - Create Session Modal
   - Edit Session Modal
   - Counter Offer Modal
   - Rejection Reason Modal
   - Rating Modal
2. Verify modal functionality
3. Test escape key and click-outside closing

**Expected Results:**
- Modals open and close properly
- Form validation works in modals
- Data persists correctly
- Good user experience

---

### TC-UI-004: Alert and Confirmation Dialogs
**Priority:** Low
**Prerequisites:** Actions that trigger alerts

**Test Steps:**
1. Trigger various alerts (success, error, warning, info)
2. Test confirmation dialogs
3. Verify auto-close functionality
4. Test manual close

**Expected Results:**
- Alerts display with correct styling
- Auto-close works for appropriate alerts
- Confirmation dialogs require user action
- Clear and informative messages

---

## 10. EDGE CASES & ERROR HANDLING

### TC-EC-001: Network Connectivity Issues
**Priority:** Medium
**Prerequisites:** Session system loaded

**Test Steps:**
1. Disconnect network during session creation
2. Reconnect and retry
3. Test partial form submission with connection loss
4. Verify data recovery mechanisms

**Expected Results:**
- Graceful handling of network errors
- Clear error messages
- Data not lost on reconnection
- Retry mechanisms work

---

### TC-EC-002: Concurrent User Actions
**Priority:** Medium
**Prerequisites:** Two users in same session

**Test Steps:**
1. Both users try to accept/reject simultaneously
2. Both users update progress at same time
3. Test work submission conflicts
4. Test completion request timing

**Expected Results:**
- First action wins, second gets appropriate error
- No data corruption
- Clear conflict resolution
- Proper user feedback

---

### TC-EC-003: Data Validation Edge Cases
**Priority:** Medium
**Prerequisites:** Various form inputs

**Test Steps:**
1. Test extremely long text inputs
2. Test special characters and emoji
3. Test SQL injection attempts
4. Test XSS attempts
5. Test malformed date inputs

**Expected Results:**
- Input length limits enforced
- Special characters handled properly
- Security vulnerabilities prevented
- Malformed data rejected gracefully

---

### TC-EC-004: Session Limit Edge Cases
**Priority:** Medium
**Prerequisites:** Users near session limits

**Test Steps:**
1. Create exactly 3 active sessions between users
2. Try to create 4th session
3. Complete one session and try creating new one
4. Test with different session statuses

**Expected Results:**
- Limit enforced correctly
- Clear error message when limit reached
- Counter updates when sessions complete
- Different statuses counted correctly

---

### TC-EC-005: User Permission Edge Cases
**Priority:** High
**Prerequisites:** Various user scenarios

**Test Steps:**
1. Test suspended user creating sessions
2. Test deleted user in existing session
3. Test unauthorized user accessing session
4. Test admin user accessing any session

**Expected Results:**
- Suspended users blocked appropriately
- Deleted users handled gracefully
- Unauthorized access prevented
- Admin access works where intended

---

### TC-EC-006: Database Consistency
**Priority:** High
**Prerequisites:** Complex session scenarios

**Test Steps:**
1. Create session and immediately refresh page
2. Test orphaned progress records
3. Test session without required references
4. Verify data migration scenarios

**Expected Results:**
- Data consistency maintained
- Orphaned records handled
- Required references validated
- Migration scripts work correctly

---

## Performance Testing

### TC-PERF-001: Load Testing
**Priority:** Medium
**Test Steps:**
1. Load 100+ sessions for single user
2. Test pagination and filtering
3. Measure page load times
4. Test with large file uploads

**Expected Results:**
- Page loads within 3 seconds
- Pagination handles large datasets
- File uploads complete successfully
- No memory leaks detected

---

## Security Testing

### TC-SEC-001: Authentication & Authorization
**Priority:** High
**Test Steps:**
1. Access session endpoints without authentication
2. Try accessing other users' sessions
3. Test admin-only functions as regular user
4. Verify JWT token validation

**Expected Results:**
- All endpoints properly secured
- Authorization checks work correctly
- Admin functions protected
- Token validation prevents access

---

## Browser Compatibility

### TC-BC-001: Cross-Browser Testing
**Priority:** Medium
**Test Steps:**
1. Test core session functionality in:
   - Chrome (latest)
   - Firefox (latest)
   - Safari (latest)
   - Edge (latest)
2. Test responsive design on mobile browsers

**Expected Results:**
- Consistent functionality across browsers
- UI displays correctly
- Mobile experience optimized
- No JavaScript errors

---

## Data Migration Testing

### TC-MIG-001: Schema Migrations
**Priority:** High (for production deployments)
**Prerequisites:** Access to migration endpoints

**Test Steps:**
1. Test session schema migration
2. Test completion data migration
3. Verify data integrity after migration
4. Test rollback procedures

**Expected Results:**
- Migrations complete successfully
- No data loss during migration
- Schema changes applied correctly
- Rollback works if needed

---

## Accessibility Testing

### TC-ACC-001: Screen Reader Compatibility
**Priority:** Medium
**Test Steps:**
1. Test with screen reader software
2. Verify keyboard navigation works
3. Check ARIA labels and roles
4. Test high contrast mode

**Expected Results:**
- Screen readers can navigate interface
- All interactive elements accessible via keyboard
- Proper ARIA labels implemented
- High contrast mode supported

---

## Test Execution Checklist

### Pre-Testing Setup
- [ ] Test environment configured
- [ ] Test users created with various skill sets
- [ ] Database backup taken
- [ ] Test data prepared
- [ ] Browser dev tools available

### Test Execution
- [ ] Execute tests in order of priority
- [ ] Document all bugs found
- [ ] Capture screenshots for UI issues
- [ ] Record network requests for API issues
- [ ] Test on different devices/screen sizes

### Post-Testing
- [ ] Compile bug report
- [ ] Verify critical path functionality
- [ ] Test fixes for reported bugs
- [ ] Update test cases based on findings
- [ ] Clean up test data

---

## Bug Reporting Template

### Bug Report Format
```
**Bug ID:** [Unique identifier]
**Test Case:** [Reference to test case]
**Priority:** [High/Medium/Low]
**Severity:** [Critical/Major/Minor]
**Environment:** [Browser, OS, etc.]
**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Result:** 
**Actual Result:** 
**Screenshots/Videos:** [If applicable]
**Additional Notes:** 
```

---

## Test Sign-off Criteria

The session system testing is considered complete when:
- [ ] All High priority test cases pass
- [ ] 95% of Medium priority test cases pass
- [ ] Critical security tests pass
- [ ] Performance tests meet requirements
- [ ] No critical or major bugs remain
- [ ] Cross-browser compatibility verified
- [ ] Mobile responsiveness confirmed
- [ ] Data integrity validated

---

**Document Version:** 1.0
**Last Updated:** July 16, 2025
**Prepared By:** Manual Testing Team
**Review Status:** Ready for execution

This comprehensive test suite covers all aspects of the session system and should be executed thoroughly before any production deployment. Each test case should be executed multiple times under different conditions to ensure robustness and reliability of the session system.
