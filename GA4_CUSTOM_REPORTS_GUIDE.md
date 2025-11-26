# GA4 Custom Reports & Conversion Funnels Setup Guide

## Overview

This guide walks you through setting up custom reports and conversion funnels in Google Analytics 4 to visualize attribution data and track user journeys from traffic source to conversion.

## Prerequisites

✅ GA4 property created and tracking code installed
✅ Events flowing to GA4 (verify in Realtime report)
✅ Custom dimensions configured (see GA4_SETUP_GUIDE.md)

## Part 1: Configure Custom Dimensions

**Important:** Set these up first, as they're required for custom reports.

### Navigate to Custom Definitions
1. Go to GA4 Admin (bottom left gear icon)
2. Under **Property** column → **Custom definitions**
3. Click **Create custom dimensions**

### Required Custom Dimensions

| Display Name | Scope | Event Parameter | Description |
|--------------|-------|-----------------|-------------|
| Traffic Source | EVENT | `traffic_source` | Direct/organic/social/referral |
| Traffic Medium | EVENT | `traffic_medium` | Source category |
| Traffic Campaign | EVENT | `traffic_campaign` | Campaign name |
| Referrer URL | EVENT | `referrer_url` | Full referring URL |
| Device Category | EVENT | `device_category` | Mobile/tablet/desktop |
| Session ID | EVENT | `session_id` | Unique session identifier |
| Merchant ID | EVENT | `merchant_id` | Restaurant/merchant ID |
| Location Query | EVENT | `location_query` | Search location |
| Search Term | EVENT | `search_term` | Search query |
| Referrer Source | EVENT | `referrer_source` | Specific platform (Google, Facebook, etc.) |
| Referrer Category | EVENT | `referrer_category` | Search engine/social media/referral |

**Note:** GA4 has a limit of 50 custom dimensions per property (25 user-scoped, 25 event-scoped). Prioritize the most important ones if you're near the limit.

---

## Part 2: Mark Conversion Events

### Navigate to Events
1. GA4 Admin → **Events** (under Property column)
2. Wait for events to appear (may take 24 hours for new events)

### Events to Mark as Conversions

Find these events and toggle **Mark as conversion**:

- ✅ `contact_clicked` - User clicked contact info
- ✅ `search_submitted` - User performed a search
- ✅ `merchant_profile_viewed` - User viewed restaurant profile
- ✅ `phone_clicked` - User clicked phone number
- ✅ `website_clicked` - User clicked website link
- ✅ `directions_clicked` - User clicked directions

**Why these matter:** Conversions appear in key GA4 reports and can be used as goals in attribution and funnel analysis.

---

## Part 3: Create Custom Reports

### Report 1: Traffic Source Attribution

**Purpose:** Understand which traffic sources drive the most engaged users and conversions.

#### Steps:
1. Go to **Explore** (left sidebar)
2. Click **Blank** template
3. Name: "Traffic Source Attribution"

#### Configure:
**Dimensions (drag to Rows):**
- Traffic Source (custom)
- Traffic Medium (custom)
- Referrer Source (custom)

**Metrics (drag to Values):**
- Active users
- Sessions
- Conversions (select specific conversion events)
- Engagement rate
- Average engagement time

**Filters:**
- Exclude internal traffic: `Traffic Source` does not exactly match "lovable.dev"

#### Visualization:
- Use **Table** for detailed breakdown
- Add **Bar chart** for visual comparison

---

### Report 2: Campaign Performance

**Purpose:** Measure ROI of marketing campaigns with UTM parameters.

#### Steps:
1. **Explore** → **Blank** template
2. Name: "Campaign Performance Dashboard"

#### Configure:
**Dimensions:**
- Traffic Campaign (custom)
- Traffic Source (custom)
- Traffic Medium (custom)

**Metrics:**
- Sessions
- New users
- Conversions (all)
- Conversion rate
- Engagement rate

**Breakdown:**
- Device Category (custom)

**Segments:**
- Compare "Converters" vs "Non-converters"

#### Advanced Settings:
- **Date range comparison:** Enable to track week-over-week changes
- **Cohort analysis:** Group users by acquisition date

---

### Report 3: Location & Search Analysis

**Purpose:** See what locations and searches drive engagement.

#### Steps:
1. **Explore** → **Blank** template
2. Name: "Location & Search Insights"

#### Configure:
**Dimensions:**
- Location Query (custom)
- Search Term (custom)
- Traffic Source (custom)

**Metrics:**
- Active users
- Event count (`search_submitted`)
- Event count (`merchant_profile_viewed`)
- Conversions

**Filter:**
- Location Query is not null
- Exclude: andrewnsusanto@gmail.com activity

---

### Report 4: Device & User Behavior

**Purpose:** Optimize UX for different devices and understand behavior patterns.

#### Steps:
1. **Explore** → **Free form** template
2. Name: "Device Performance Analysis"

#### Configure:
**Dimensions:**
- Device Category (custom)
- Session ID (for unique session analysis)
- Traffic Source (custom)

**Metrics:**
- Sessions
- Average engagement time per session
- Pages per session
- Bounce rate
- Conversions by device

**Visualization:**
- **Donut chart** for device distribution
- **Line chart** for engagement time trends

---

## Part 4: Create Conversion Funnels

### Funnel 1: Search to Contact Journey

**Purpose:** Track drop-off from search to contact conversion.

#### Steps:
1. **Explore** → **Funnel exploration** template
2. Name: "Search → Contact Funnel"

#### Configure Steps:
**Step 1:** Homepage View
- Event name: `page_view`
- Page location contains: `/`
- Label: "Landing Page"

**Step 2:** Search Submitted
- Event name: `search_submitted`
- Label: "Search Performed"

**Step 3:** Results Viewed
- Event name: `page_view`
- Page location contains: `/results`
- Label: "Viewed Results"

**Step 4:** Merchant Profile Viewed
- Event name: `merchant_profile_viewed`
- Label: "Clicked Restaurant"

**Step 5:** Contact Clicked (Conversion)
- Event name: `contact_clicked`
- Label: "Contact Info Clicked"

#### Breakdown Options:
- **Traffic Source** - See which sources convert best
- **Device Category** - Compare mobile vs desktop
- **Location Query** - Analyze by search location

#### Analysis Tips:
- Look for largest drop-off points
- Compare conversion rates by traffic source
- Identify opportunities to improve UX

---

### Funnel 2: Discovery to Engagement

**Purpose:** Measure how users engage with merchant listings.

#### Configure Steps:
**Step 1:** Homepage Carousel View
- Event name: `carousel_impression`
- Label: "Saw Carousel"

**Step 2:** Carousel Card Clicked
- Event name: `carousel_card_click`
- Label: "Clicked from Carousel"

**Step 3:** Profile Viewed
- Event name: `merchant_profile_viewed`
- Label: "Viewed Profile"

**Step 4:** Any Engagement
- Event name: In list: `phone_clicked`, `website_clicked`, `directions_clicked`, `contact_clicked`
- Label: "Engaged with Merchant"

---

### Funnel 3: Location Landing to Conversion

**Purpose:** Track effectiveness of location-specific landing pages.

#### Configure Steps:
**Step 1:** Location Page View
- Event name: `page_view`
- Page location contains: `/location/`
- Label: "Location Landing Page"

**Step 2:** Merchant Clicked
- Event name: `location_landing_merchant_click`
- Label: "Clicked Restaurant"

**Step 3:** Profile Viewed
- Event name: `merchant_profile_viewed`
- Label: "Viewed Full Profile"

**Step 4:** Conversion
- Event name: Any conversion event
- Label: "Converted"

---

## Part 5: Advanced Attribution Analysis

### Multi-Channel Attribution

**Purpose:** Understand how different channels work together to drive conversions.

#### Steps:
1. **Advertising** → **Attribution** → **Conversion paths**
2. Name: "Multi-Touch Attribution"

#### Configure:
**Conversion event:** Select primary conversion (e.g., `contact_clicked`)

**Attribution model options:**
- **Last click:** Credit to final touchpoint
- **First click:** Credit to first touchpoint
- **Linear:** Equal credit to all touchpoints
- **Position-based:** More credit to first & last (40-20-40)

**Dimensions to analyze:**
- Traffic Source
- Traffic Medium
- Device Category

#### Key Insights:
- Which sources assist conversions vs directly convert
- Typical customer journey length
- Most effective channel combinations

---

## Part 6: Create Dashboard Collections

### Custom Dashboard: Executive Summary

Combine multiple visualizations into one dashboard.

#### Steps:
1. **Explore** → Create multiple reports
2. **Dashboards** → **Create**
3. Name: "SipMunchYap Executive Dashboard"

#### Recommended Cards:
1. **Traffic Overview** (scorecard)
   - Total sessions
   - Total conversions
   - Conversion rate
   - Avg. engagement time

2. **Traffic Source Performance** (table)
   - Breakdown by source/medium
   - With conversions and engagement

3. **Conversion Funnel** (funnel visualization)
   - Search → Contact journey

4. **Top Locations** (bar chart)
   - Most searched locations
   - Conversion rate by location

5. **Device Split** (pie chart)
   - Mobile vs Desktop sessions
   - Conversion rates

---

## Part 7: Set Up Automated Insights & Alerts

### Anomaly Detection

**Purpose:** Get notified of unusual traffic or conversion patterns.

#### Steps:
1. **Explore** → Any custom report
2. Click **Share** → **Schedule email**
3. Set frequency: Daily/Weekly
4. Add recipients

### Custom Alerts

1. **Admin** → **Custom alerts** (under Property)
2. **Create alert**
3. Example: "Alert if conversions drop by 20%"

#### Recommended Alerts:
- Daily conversions drop > 30%
- Traffic source changes significantly
- Bounce rate increases > 50%

---

## Part 8: Integration with BigQuery (Optional)

For advanced analysis beyond GA4's UI:

### Export to BigQuery
1. **Admin** → **BigQuery Links**
2. **Link** → Select project
3. Enable daily export

### Sample SQL Queries

```sql
-- Top converting traffic sources
SELECT
  traffic_source,
  traffic_medium,
  COUNT(DISTINCT session_id) as sessions,
  COUNTIF(event_name = 'contact_clicked') as conversions,
  SAFE_DIVIDE(COUNTIF(event_name = 'contact_clicked'), COUNT(DISTINCT session_id)) as conversion_rate
FROM `project.dataset.events_*`
WHERE traffic_source != 'lovable.dev'
GROUP BY traffic_source, traffic_medium
ORDER BY conversions DESC
LIMIT 20;
```

---

## Testing Your Setup

### Verify Data Flow
1. **Realtime** report → Check events appearing with custom parameters
2. **DebugView** (if debug mode enabled) → Verify parameter values
3. Wait 24-48 hours for custom dimensions to populate in reports

### Test Funnels
1. Perform a complete user journey yourself
2. Check if it appears in funnel within 10 minutes (Realtime)
3. Verify drop-off calculations

---

## Troubleshooting

### Custom Dimensions Not Showing Data
- ✅ Wait 24-48 hours after creation
- ✅ Verify parameter names match exactly (case-sensitive)
- ✅ Check events are sending parameters in DebugView

### Funnel Steps Not Matching
- ✅ Ensure event names match exactly
- ✅ Check step conditions (AND vs OR logic)
- ✅ Verify events are firing in correct order

### Low Sample Size
- ✅ GA4 samples data at high traffic volumes
- ✅ Use BigQuery export for unsampled data
- ✅ Reduce date ranges or narrow filters

---

## Best Practices

1. **Start Simple:** Create core reports first, add complexity later
2. **Regular Reviews:** Check reports weekly to spot trends
3. **Document Changes:** Note when you modify tracking or reports
4. **Compare Periods:** Always use date comparisons to spot anomalies
5. **Segment Users:** Analyze converters vs non-converters separately
6. **Mobile First:** Always check mobile vs desktop behavior
7. **Exclude Test Traffic:** Filter out internal traffic and test sessions

---

## Next Steps

After setup:
1. ✅ Monitor Realtime report to verify events
2. ✅ Wait 24-48 hours for data to populate
3. ✅ Create baseline reports for comparison
4. ✅ Set up automated email reports
5. ✅ Review conversion funnels weekly
6. ✅ Optimize based on insights

---

## Resources

- [GA4 Explore Reports Documentation](https://support.google.com/analytics/answer/9327972)
- [Funnel Exploration Guide](https://support.google.com/analytics/answer/9327974)
- [Custom Dimensions Best Practices](https://support.google.com/analytics/answer/10075209)
- [Attribution Reports](https://support.google.com/analytics/answer/10596366)

---

**Need Help?** Refer to the main GA4_SETUP_GUIDE.md for basic setup and troubleshooting.
