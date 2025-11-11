# Comprehensive Event Tracking Implementation

## Overview
This document details the comprehensive event tracking system implemented across the application with throttling, debouncing, sampling, and metadata size limits to optimize performance and data quality.

## Key Features

### 1. Performance Optimization Utilities

#### Throttling
- **Purpose**: Limit high-frequency events (e.g., map zoom, pan)
- **Implementation**: `throttle()` function in `src/utils/analytics.ts`
- **Usage**: Ensures events fire at most once per specified delay
- **Example**: Map zoom events throttled to 2 seconds

#### Debouncing
- **Purpose**: Capture final state of rapid changes (e.g., filter selections)
- **Implementation**: `debounce()` function in `src/utils/analytics.ts`
- **Usage**: Waits for user to finish action before tracking
- **Example**: Search term typing debounced to 1 second

#### Sampling
- **Purpose**: Reduce volume for low-value, high-frequency events
- **Implementation**: `shouldSampleEvent()` function in `src/utils/analytics.ts`
- **Usage**: Only track percentage of events (e.g., 30% of map pan events)
- **Sample Rates**:
  - Map zoom: 50%
  - Map pan: 30%
  - Map marker clicks: 100% (high-value events)

#### Metadata Size Limits
- **Purpose**: Prevent large payloads and database bloat
- **Implementation**: `limitMetadataSize()` function in `src/utils/analytics.ts`
- **Limit**: 1KB per event metadata
- **Behavior**: Automatically truncates large objects/arrays while preserving essential data

## Tracked Events

### 1. Search Queries
**Location**: `src/components/SearchBar.tsx`

Events tracked:
- `search_term_typed`: When user types 3+ characters (debounced 1s)
- `search_input_focus`: When search input is focused
- `search_term_cleared`: When user clears search
- `location_typed`: When location input has 3+ characters (debounced 1s)
- `location_input_focus`: When location input is focused
- `location_cleared`: When user clears location
- `location_suggestions_displayed`: When autocomplete shows suggestions
- `location_suggestion_selected`: When user selects a suggestion
- `keyboard_navigation`: Arrow key usage in suggestions
- `search_submitted`: Final search submission
- `locate_me_clicked`: GPS location button click
- `gps_success` / `gps_failed`: GPS location results

**Metadata**: Search terms, location queries, GPS coordinates, suggestion counts

### 2. Filter Changes
**Location**: `src/components/UnifiedFilterBar.tsx`

Events tracked:
- `category_selected` / `category_deselected`: Category filter toggles
- `day_filter_toggled`: Day of week selection
- `radius_changed`: Distance radius changes
- `start_time_changed` / `end_time_changed`: Happy hour time filters
- `clear_all_filters`: When all filters are cleared

**Metadata**: Total filters selected, previous values, filter states

**Performance**: Filter changes are tracked immediately (non-debounced) for better UX feedback

### 3. Restaurant Clicks
**Location**: `src/components/SearchResultCard.tsx`

Events tracked:
- `card_impression`: When card becomes visible (IntersectionObserver)
- `card_clicked`: When user clicks restaurant card
- `card_hovered`: When user hovers over card (desktop only)

**Metadata**: Restaurant position in list, has offers, has happy hours, category badges

**Performance**: Impressions tracked once per card per session

### 4. Map Interactions (Throttled)
**Location**: `src/components/MapInteractionTracker.tsx`

Events tracked:
- `map_zoom`: Zoom level changes (throttled 2s, sampled 50%)
- `map_pan`: Map movement (throttled 3s, sampled 30%)
- `map_marker_clicked`: Restaurant marker clicks (100%, no throttle)
- `map_moved`: Map move end event (tracked in ResultsMap)
- `search_area_clicked`: "Search this area" button

**Metadata**: Zoom levels, coordinates, merchant IDs, marker positions

**Performance**: 
- High-frequency events (zoom/pan) are throttled and sampled
- High-value events (marker clicks) tracked at 100%
- Uses `moveend` and `zoomend` events instead of continuous streams

### 5. Directions Clicks
**Location**: `src/components/RestaurantContactInfo.tsx`

Events tracked:
- `directions_clicked`: Google Maps directions link clicked
- `phone_clicked`: Phone number clicked (with funnel tracking)
- `website_clicked`: Website link clicked (with funnel tracking)

**Metadata**: Full address, phone numbers, website URLs

**Performance**: Immediate tracking (non-blocking)

### 6. Happy Hour Deal Views
**Location**: `src/components/HappyHourDealsDisplay.tsx`

Events tracked:
- `happy_hour_deals_viewed`: When deals are loaded and displayed
- `happy_hour_deal_clicked`: When individual deal is clicked
- `deal_source_clicked`: When deal source link is clicked
- `deals_expanded` / `deals_collapsed`: Mobile collapsible toggle

**Metadata**: Deal count, verified count, deal IDs, deal titles, verification status

**Performance**: Deals viewed tracked once per load, individual interactions tracked immediately

## Implementation Architecture

### Component Structure
```
src/
├── utils/
│   └── analytics.ts          # Core tracking functions + utilities
├── hooks/
│   └── useAnalytics.ts       # React hook for components
├── components/
│   ├── MapInteractionTracker.tsx    # Dedicated map tracking
│   ├── SearchBar.tsx                # Search tracking
│   ├── UnifiedFilterBar.tsx         # Filter tracking
│   ├── SearchResultCard.tsx         # Card impression/click tracking
│   ├── ResultsMap.tsx               # Map integration
│   ├── RestaurantContactInfo.tsx    # Directions/contact tracking
│   └── HappyHourDealsDisplay.tsx    # Deal view tracking
```

### Data Flow
1. User interaction occurs
2. Component calls `track()` from `useAnalytics` hook
3. Event passes through throttle/debounce/sampling utilities if applicable
4. Metadata size is limited to 1KB
5. Event is added to queue (batched)
6. Queue flushes based on:
   - Mobile: 20 events or 15 seconds
   - Desktop: 50 events or 45 seconds
7. Events batch-inserted to `user_events` table
8. Session updated with event counts

### Database Schema
Events are stored in `public.user_events` table with the following key fields:
- `session_id`: Links to user session
- `event_type`: click, page_view, interaction, impression, etc.
- `event_category`: search, filter, map_interaction, merchant_interaction, etc.
- `event_action`: Specific action name
- `metadata`: JSONB field with event-specific data (limited to 1KB)

## Performance Considerations

### Mobile Optimizations
- More aggressive batching (20 events vs 50 on desktop)
- Shorter flush timeout (15s vs 45s on desktop)
- Touch event tracking for engagement
- Page visibility API for reliable data capture

### Desktop Optimizations
- Larger batch sizes for fewer database calls
- Hover events tracked (not available on mobile)
- Mouse movement tracked for engagement

### General Optimizations
- All tracking calls are non-blocking (async)
- Batched database inserts reduce connection overhead
- Metadata size limits prevent payload bloat
- Sampling reduces volume for low-value events
- Throttling prevents excessive tracking of high-frequency events

## Usage Examples

### Basic Event Tracking
```typescript
const { track } = useAnalytics();

track({
  eventType: 'click',
  eventCategory: 'navigation',
  eventAction: 'menu_opened',
  metadata: { menuType: 'main' }
});
```

### Throttled Event Tracking
```typescript
import { throttle } from '@/utils/analytics';

const handleScroll = throttle(
  () => {
    track({
      eventType: 'interaction',
      eventCategory: 'scroll',
      eventAction: 'page_scrolled'
    });
  },
  'page_scroll',
  2000 // 2 second throttle
);
```

### Sampled Event Tracking
```typescript
import { shouldSampleEvent } from '@/utils/analytics';

if (shouldSampleEvent(0.3)) { // 30% sample rate
  track({
    eventType: 'interaction',
    eventCategory: 'hover',
    eventAction: 'element_hovered'
  });
}
```

## Best Practices

1. **Use appropriate event types**: Choose from click, page_view, interaction, impression, etc.
2. **Keep metadata concise**: Only include essential data (automatically limited to 1KB)
3. **Throttle high-frequency events**: Use throttle for zoom, pan, scroll events
4. **Sample low-value events**: Use sampling for ambient interactions
5. **Track high-value events at 100%**: Never sample clicks, conversions, or critical actions
6. **Use meaningful action names**: Be descriptive and consistent
7. **Include context in metadata**: User state, feature flags, AB test variants

## Future Enhancements

1. **A/B Testing Integration**: Add variant tracking to metadata
2. **Conversion Tracking**: Enhanced funnel analysis with drop-off points
3. **Error Tracking**: Comprehensive error boundaries with analytics
4. **Performance Metrics**: Integration with Core Web Vitals tracking
5. **Real-time Dashboards**: Admin analytics interface
6. **Heatmap Generation**: From click and hover data
7. **Cohort Analysis**: User segmentation and retention tracking
