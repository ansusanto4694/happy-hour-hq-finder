
# Add Password Requirement Hint to Signup Form

Add a small helper text below the password field on the signup form showing "Minimum 6 characters" so users know the requirement before submitting.

## Change

**File: `src/pages/Auth.tsx`**

Add a `<p>` tag with muted styling immediately after the password input's wrapper `<div>` (the one containing the eye toggle), within the existing `space-y-2` container. Text: "Minimum 6 characters".

This is a single-line addition -- no new components or dependencies needed.
