

# Add Bot Filtering Comparison to Analytics Dashboard

## Context
Lovable's built-in analytics (last 7 days) shows **858 visitors** and **2,450 pageviews**. Your custom Supabase analytics already filters bots via the `is_bot` flag on `user_sessions`. Here's the actual breakdown from your database for the same period:

- **Total sessions**: 1,096 (711 human + 385 bot)
- **Human visitors**: ~454 unique
- **Bot sessions**: 385 (246 unknown, 100 search engine, 39 malicious)
- **Bot traffic**: ~35% of all sessions are bots

Lovable's analytics likely includes some of this bot traffic since it uses a lightweight JS-based tracker that headless browsers and sophisticated bots can trigger.

## Plan

### 1. Create a new comparison component: `AnalyticsComparisonCard`
A new card for the Traffic tab that shows a side-by-side comparison table:

| Metric | Lovable Analytics | Custom (Bot-Filtered) | Difference |
|--------|------------------|-----------------------|------------|
| Visitors | (from Lovable API) | (from user_sessions) | delta % |
| Pageviews | (from Lovable API) | (from user_events) | delta % |
| Bounce Rate | (from Lovable API) | (from user_sessions) | delta % |
| Avg Duration | (from Lovable API) | (from user_sessions) | delta % |

### 2. Create a hook: `useAnalyticsComparison`
- Fetches custom Supabase metrics (reuses existing `useTrafficOverview` and `useSessionMetrics` data)
- Accepts Lovable analytics numbers as props (manually entered or fetched via the Lovable analytics API if available)
- Calculates percentage differences

### 3. Add bot traffic breakdown card
A small summary card showing:
- Total bot sessions detected
- Breakdown by bot type (search engine, malicious, unknown)
- Percentage of total traffic that is bots

### 4. Add to Analytics page
Place the comparison card and bot breakdown card in the Traffic tab, below the existing `TrafficOverviewChart`.

## Files to create/modify
- **`src/components/analytics/BotTrafficCard.tsx`** -- New component showing bot breakdown
- **`src/components/analytics/AnalyticsComparisonCard.tsx`** -- New component with side-by-side comparison
- **`src/hooks/useBotTraffic.ts`** -- New hook querying bot session data from `user_sessions`
- **`src/pages/Analytics.tsx`** -- Add the two new components to the Traffic tab

