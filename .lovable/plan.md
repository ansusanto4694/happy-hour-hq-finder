

# Protect Analytics Page: Admin-Only Access

## You're Absolutely Right

The lazy-loading optimization we did for the Calendar is **missing the point**. The real issue is:

1. **The Analytics page has no access protection** — anyone can visit `/analytics`
2. **All the Analytics code still gets downloaded** — even though it's lazy-loaded, any visitor who navigates to `/analytics` downloads the entire page
3. **This is internal/private data** — traffic stats, session metrics, and conversion funnels should only be visible to admins

The code is already split into a separate chunk (because of `lazy()`), but there's **nothing stopping a non-admin from accessing it**.

---

## What We Need to Do

| Problem | Solution |
|---------|----------|
| Anyone can visit `/analytics` | Add admin role check and redirect non-admins |
| Analytics code downloads for non-admins who visit the URL | Keep the code in a separate chunk, but the route protection means non-admins never trigger the download |
| No visual indication that this is restricted | Show "Access Denied" or redirect to home |

---

## The Current State

```text
User visits /analytics
    ↓
Analytics page loads (for everyone)
    ↓
Data fetches fail for non-admins (RLS policies block the queries)
    ↓
User sees empty charts with "no data" messages
```

**Problem:** The page still loads, the code still downloads, and it looks broken rather than properly restricted.

---

## The Proposed Solution

```text
User visits /analytics
    ↓
Check if user is admin (from useAuth)
    ↓
If NOT admin → Show access denied message OR redirect to home
    ↓
If admin → Load and show Analytics page
```

---

## Implementation Options

### Option A: Protect at the Route Level (Recommended)

Create a reusable `AdminRoute` component that wraps admin-only pages. This:
- Prevents the Analytics page from even loading for non-admins
- Shows a clean "access denied" message or redirects
- Can be reused for any future admin-only pages

### Option B: Protect Inside the Analytics Page

Add an admin check at the top of the Analytics component. This:
- Still downloads the Analytics code before checking
- Shows access denied after the code loads
- Slightly simpler but less efficient

**I recommend Option A** because it truly prevents non-admins from downloading the admin code.

---

## Technical Implementation

### 1. Create AdminRoute Component

A new wrapper component that:
- Uses `useAuth()` to check `isAdmin` status
- Shows a loading state while auth is being checked
- Redirects to homepage (or shows "Access Denied") if not admin
- Renders the protected content if user is admin

```text
Location: src/components/AdminRoute.tsx

Logic:
  - If loading → show spinner
  - If !user → redirect to /auth
  - If user but !isAdmin → redirect to / (or show "not authorized")
  - If isAdmin → render children
```

### 2. Update App.tsx to Use AdminRoute

Wrap the Analytics route with the new AdminRoute component:

```text
// Before:
<Route path="/analytics" element={<Analytics />} />

// After:
<Route path="/analytics" element={<AdminRoute><Analytics /></AdminRoute>} />
```

### 3. Keep the Lazy Loading

The Analytics page should remain lazy-loaded. The key difference is that now:
- Non-admins are redirected BEFORE the lazy component loads
- The Analytics chunk is only downloaded when an admin visits the page
- Regular users never download the ~100+ KB of analytics components

---

## Security Considerations

| Aspect | How It's Handled |
|--------|------------------|
| **Client-side check** | The AdminRoute component reads `isAdmin` from `useAuth()` |
| **Server-side protection** | Already exists — RLS policies on `user_sessions` and `user_events` tables require admin role to read |
| **Role storage** | Correctly stored in `user_roles` table (not on profile) |
| **No client bypass** | Even if someone bypasses the client check, they can't read data due to RLS |

This is **defense in depth**:
1. Client-side: Prevents loading unnecessary code
2. Server-side: Prevents data access even if client is bypassed

---

## What This Achieves

| Benefit | Description |
|---------|-------------|
| **Code not downloaded** | Non-admins never trigger the Analytics chunk download |
| **Clean UX** | Non-admins see a proper redirect, not broken charts |
| **Reusable pattern** | AdminRoute can protect future admin features |
| **Maintains security** | Works with existing RLS policies |

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/components/AdminRoute.tsx` | Create | Reusable admin protection wrapper |
| `src/App.tsx` | Modify | Wrap Analytics route with AdminRoute |

---

## What About the Calendar Lazy Loading?

The calendar lazy-loading we added is **still useful** as a micro-optimization for admins. When an admin visits the Analytics page:
- The main Analytics page loads
- The Calendar component only loads when they open the date picker

But you're right that this was a minor optimization compared to **preventing non-admins from downloading the entire Analytics module**.

---

## Summary

| Aspect | Details |
|--------|---------|
| **What** | Add admin-only access control to Analytics page |
| **Why** | Prevent code download and access for non-admins |
| **How** | Create AdminRoute wrapper component |
| **Files** | 1 new file, 1 modified file |
| **Risk** | Very low — adds protection, doesn't break existing functionality |
| **Security** | Client-side check + existing RLS = defense in depth |

