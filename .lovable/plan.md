

## Fix Bot Detection: Whitelist Google Services

### Problem
Google-InspectionTool and Google's Web Rendering Service (WRS) are being misclassified as "suspicious" because:
1. Google-InspectionTool isn't in the `searchEngineBots` list
2. Google WRS uses `X11; Linux x86_64` with modern Chrome, triggering the `isLinuxDesktop` heuristic

### Changes

**File: `src/utils/botDetection.ts`**

1. Add `'Google-InspectionTool'` and `'Google-Read-Aloud'` to the `searchEngineBots` array
2. Add a Google WRS detection check **before** the Linux/outdated Chrome heuristics — if the UA contains both `X11; Linux x86_64` and a Chrome version within 10 of current, plus no Android, check for Google rendering signatures (e.g., presence of `Chrome/` with version >= `CURRENT_CHROME_VERSION - 10` on Linux = likely Google WRS)
3. Refine `isLinuxDesktop` to exclude known Google patterns by adding a helper `isGoogleRenderer` that checks for modern Chrome on Linux (version within ~10 of current) combined with absence of other bot indicators — Google WRS uses near-current Chrome versions

Specifically:
- Add a new function `isGoogleWebRenderer(ua)` that returns true when: Linux x86_64 + Chrome version >= (current - 10) + no headless indicators
- In `detectBot()`, check `isGoogleWebRenderer` early and return `{ isBot: true, botType: 'search_engine', botName: 'Google Web Renderer' }`
- This runs before the `isLinuxDesktop` and `isOutdatedChrome` heuristics, so Google WRS gets correctly classified

**File: `supabase/functions/comprehensive-backfill/index.ts`** — No changes needed (backfill recalculates from existing flags)

**Post-deploy**: Run a SQL update to reclassify existing misidentified sessions (optional, can be done separately)

