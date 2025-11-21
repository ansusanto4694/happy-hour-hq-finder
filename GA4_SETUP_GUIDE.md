# Google Analytics 4 (GA4) Setup Guide

## Current Implementation Status ✅

Your app is now sending events to GA4 with:
- Clean parameter formatting (no undefined values)
- Conversion event tracking
- Custom dimensions for merchant_id, location_query, search_term
- Debug mode enabled in development
- Automatic GA4 verification on app load

## Next Steps: Configure GA4 Admin

### 1. Verify Events in GA4 DebugView

1. Open Google Analytics 4
2. Go to **Admin** → **DebugView**
3. Open your app in development mode
4. You should see events flowing in real-time with parameters

**Events to verify:**
- `page_view` (with merchant_id, location_query)
- `search_submitted` (marked as conversion)
- `contact_clicked` (marked as conversion)
- `merchant_interaction_*` events
- `location_landing_*` events

### 2. Mark Conversion Events

In GA4 Admin → **Events**:

1. Find these events and click "Mark as conversion":
   - `contact_clicked`
   - `search_submitted`
   - `merchant_profile_viewed`
   - `phone_clicked`
   - `website_clicked`
   - `directions_clicked`

### 3. Configure Custom Dimensions

In GA4 Admin → **Custom Definitions** → **Custom Dimensions**:

Create these custom dimensions:

| Dimension Name | Scope | Event Parameter |
|---------------|-------|-----------------|
| Merchant ID | Event | `merchant_id` |
| Location Query | Event | `location_query` |
| Search Term | Event | `search_term` |
| Device Type | Event | `device_type` |
| Page Path | Event | `page_path` |
| User ID | User | `user_id` |

**Why these matter:**
- **merchant_id**: Track which restaurants get the most engagement
- **location_query**: See which neighborhoods/cities drive traffic
- **search_term**: Understand what users are searching for
- **device_type**: Optimize for mobile vs desktop
- **user_id**: Connect authenticated user behavior across sessions

### 4. Create Audiences (Optional)

Suggested audiences in GA4:

- **High-Intent Users**: Users who clicked contact info (conversion event)
- **Location Browsers**: Users who visited 3+ location landing pages
- **Mobile Users**: device_type = 'mobile' with 2+ page views
- **Engaged Searchers**: Users who performed 3+ searches

### 5. Set Up Conversion Funnels

In GA4 → **Explore** → **Funnel Exploration**:

**Example Funnel: "Search to Contact"**
1. `search_submitted` (entry)
2. `merchant_profile_viewed`
3. `contact_clicked` (conversion)

This shows drop-off rates at each step.

## Testing Your Setup

### Check Console Logs

Open browser console (F12) and look for:
```
[Analytics] GA4 Setup Check: { gtag_available: true, dataLayer_available: true, ... }
[Analytics] GA4 event sent: search_submitted { merchant_id: 188, ... }
```

### Verify in GA4 Realtime

1. Open GA4 → **Reports** → **Realtime**
2. Navigate your app
3. Events should appear within ~10 seconds
4. Check "Event count by Event name" card

### Debug Mode

In development, debug mode is automatically enabled. You'll see:
```
[Analytics] GA4 Debug Mode enabled - check DebugView in GA4
```

## Troubleshooting

### Events Not Appearing in GA4

1. Check if gtag is loaded:
   - Open console
   - Type `window.gtag`
   - Should show function, not undefined

2. Check dataLayer:
   - Type `window.dataLayer`
   - Should show array with events

3. Verify GA4 Measurement ID:
   - Check your index.html or GA4 script
   - Replace `G-XXXXXXXXXX` in `enableGA4Debug()` with your actual ID

### Custom Dimensions Not Working

- Custom dimensions need 24-48 hours to populate after configuration
- Make sure parameter names match exactly (case-sensitive)
- Verify in DebugView that parameters are being sent

### Conversions Not Tracking

- Mark events as conversions in GA4 Admin → Events
- Wait 24 hours for conversion data to populate
- Check that `conversion: true` parameter is being sent

## Performance Impact

Our analytics implementation is optimized for performance:
- ✅ Event batching (50 events/batch desktop, 20 mobile)
- ✅ Non-blocking async calls
- ✅ Throttled session updates
- ✅ Mobile-friendly (aggressive flushing on pagehide)
- ✅ No impact on Core Web Vitals

## Data Privacy

- Anonymous users get persistent `anonymous_user_id` in localStorage
- Authenticated users tracked via `user_id`
- No PII sent to GA4 (emails, names, addresses excluded)
- Bot traffic filtered via `is_bot` flag
