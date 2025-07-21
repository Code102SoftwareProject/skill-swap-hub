# 🟦 KYC Verification Tick Integration Guideline

## 1. API Endpoint

Use the endpoint:

```
/api/kyc/status?userId=<USER_ID>
```

This returns:

```json
{
  "success": true,
  "status": "Accepted" | "Approved" | "Rejected" | "Not Reviewed" | null,
  "reason": "..." // only if rejected
}
```

---

## 2. When to Show the Blue Tick

Show the blue tick **only if**:

```js
kycStatus === "Accepted" || kycStatus === "Approved"
```

---

## 3. Use the Reusable VerifiedAvatar Component

A reusable `VerifiedAvatar` component is available. It encapsulates the logic for fetching KYC status and displaying the blue tick overlay if the user is verified.

### a. Import the Component

```tsx
import VerifiedAvatar from '@/components/VerifiedAvatar';
```

### b. Usage Example

```tsx
<VerifiedAvatar
  userId={user._id}
  avatarUrl={user.avatar}
  size={64} // or any size you want
/>
```

- The component will automatically fetch the KYC status and show the blue tick if the user is verified.
- You can use it anywhere you want to display a user's avatar and verification status (profile pages, user lists, chat, etc.).
- Optional props: `size` (number, px, default 96), `className` (string for custom styling).

---

## 4. How to Use

Follow these steps to use the `VerifiedAvatar` component in your project:

1. **Import the component** where you want to use it:
   ```tsx
   import VerifiedAvatar from '@/components/VerifiedAvatar';
   ```
2. **Pass the required props**:
   - `userId`: The user's unique ID (string)
   - `avatarUrl`: The user's avatar image URL (string, optional)
   - `size`: The size of the avatar in pixels (number, optional)
   - `className`: Additional CSS classes (string, optional)

3. **Example in a React component**:

   ```tsx
   import VerifiedAvatar from '@/components/VerifiedAvatar';

   export default function UserCard({ user }) {
     return (
       <div className="flex items-center space-x-3 p-4 bg-white rounded shadow">
         <VerifiedAvatar
           userId={user._id}
           avatarUrl={user.avatar}
           size={48}
         />
         <div>
           <div className="font-semibold">{user.firstName} {user.lastName}</div>
           <div className="text-sm text-gray-500">{user.title}</div>
         </div>
       </div>
     );
   }
   ```

4. **Result:**
   - The avatar will display with a blue verification tick if the user is KYC verified.
   - You can use this component anywhere you need a verified avatar.

---

## 5. Where to Use
- **Profile pages** (when viewing another user)
- **User lists** (search, admin, etc.)
- **Chat participants**
- **Anywhere you show a user avatar**

---
