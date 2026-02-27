

## Empty State Messaging Update

### Problem
When users search for locations outside NYC, the query runs slowly (hitting the normalize-location edge function as a last resort), and then shows a generic "No restaurants found" message that doesn't guide users on what to do next.

### Changes

**File: `src/components/SearchResultsEmpty.tsx`**

Replace the current generic messaging with a friendlier, actionable message:

- **Heading**: "We aren't in your neighborhood yet!"
- **Body**: "Reach out to andrew@sipmunchyap.com and let me know where you're coming from so I can add in your neighborhood."
- Make the email a clickable `mailto:` link for convenience
- Remove the time-based conditional messaging since this component is primarily hit for out-of-area searches
- Keep it simple -- no other logic changes needed

This also applies to the `LocationLanding.tsx` page which uses the same component.

### Technical Details

- Single file change: `src/components/SearchResultsEmpty.tsx`
- The `startTime`/`endTime` props can be kept in the interface for backward compatibility but the display will use the new unified message
- The email will be wrapped in an anchor tag with `mailto:` for easy one-tap contact on mobile

### Note on Query Speed
The slowness comes from the location normalization pipeline (cache miss leading to edge function call). That's a separate optimization -- this change addresses the user-facing messaging.

