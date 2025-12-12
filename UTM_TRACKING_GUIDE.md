# UTM Tracking Guide for SipMunchYap

This guide explains how to use UTM parameters to track the effectiveness of your marketing campaigns.

## What Are UTM Parameters?

UTM (Urchin Tracking Module) parameters are tags added to the end of URLs that help you track where your traffic comes from. When someone clicks a link with UTM parameters, that data is captured in our analytics.

## The Five UTM Parameters

| Parameter | Required | Description | Example |
|-----------|----------|-------------|---------|
| `utm_source` | ✅ Yes | Where the traffic comes from | `instagram`, `facebook`, `newsletter` |
| `utm_medium` | ✅ Yes | The marketing channel type | `social`, `email`, `cpc`, `referral` |
| `utm_campaign` | ✅ Yes | The specific campaign name | `summer_promo`, `launch_2025` |
| `utm_content` | ❌ No | Differentiates similar content | `hero_button`, `sidebar_link` |
| `utm_term` | ❌ No | Paid search keywords | `happy_hour_sf` |

## Standard Naming Conventions

### Sources (`utm_source`)
Use lowercase, no spaces:
- Social: `instagram`, `facebook`, `twitter`, `reddit`, `linkedin`, `tiktok`
- Email: `newsletter`, `email`
- Paid: `google`, `bing`, `facebook_ads`
- Other: `partner_name`, `qr_code`, `flyer`

### Mediums (`utm_medium`)
- `social` - Organic social media posts
- `paid_social` - Paid social media ads
- `email` - Email campaigns
- `cpc` - Paid search (cost-per-click)
- `referral` - Partner referrals
- `influencer` - Influencer partnerships
- `pr` - Press/media mentions
- `offline` - QR codes, print, flyers

### Campaigns (`utm_campaign`)
Use lowercase with underscores:
- `bio_link` - Profile/bio links
- `organic_post` - Regular social posts
- `story` - Instagram/Facebook stories
- `summer_promo_2025` - Seasonal campaigns
- `launch_jan2025` - Launch campaigns
- `partner_restaurantname` - Partner campaigns

## Ready-to-Use UTM Links

### Instagram Bio Link
```
https://sipmunchyap.com?utm_source=instagram&utm_medium=social&utm_campaign=bio_link
```

### Instagram Story Swipe-Up
```
https://sipmunchyap.com?utm_source=instagram&utm_medium=social&utm_campaign=story&utm_content=swipe_up
```

### Facebook Post
```
https://sipmunchyap.com?utm_source=facebook&utm_medium=social&utm_campaign=organic_post
```

### Twitter/X Post
```
https://sipmunchyap.com?utm_source=twitter&utm_medium=social&utm_campaign=organic_post
```

### Reddit Post
```
https://sipmunchyap.com?utm_source=reddit&utm_medium=social&utm_campaign=organic_post&utm_content=subreddit_name
```

### TikTok Bio
```
https://sipmunchyap.com?utm_source=tiktok&utm_medium=social&utm_campaign=bio_link
```

### Email Newsletter
```
https://sipmunchyap.com?utm_source=newsletter&utm_medium=email&utm_campaign=weekly_digest
```

### Partner Referral
```
https://sipmunchyap.com?utm_source=partner_name&utm_medium=referral&utm_campaign=partner
```

### QR Code (Print/Flyer)
```
https://sipmunchyap.com?utm_source=qr_code&utm_medium=offline&utm_campaign=flyer_downtown
```

### Google Ads
```
https://sipmunchyap.com?utm_source=google&utm_medium=cpc&utm_campaign=happy_hour_sf&utm_term=keyword
```

### Facebook/Instagram Ads
```
https://sipmunchyap.com?utm_source=facebook&utm_medium=paid_social&utm_campaign=spring_promo
```

## Creating Custom UTM Links

### Manual Method
Add parameters to any URL:
```
https://sipmunchyap.com/results?location=san-francisco
  &utm_source=instagram
  &utm_medium=social
  &utm_campaign=sf_happy_hours
  &utm_content=story_link
```

### Using the Code Helper
In the codebase, you can use the `generateUtmUrl` function:

```typescript
import { generateUtmUrl, UTM_TEMPLATES, generateUtmUrlFromTemplate } from '@/utils/analytics';

// Using a template
const instaBioLink = generateUtmUrlFromTemplate(
  'https://sipmunchyap.com',
  'instagram_bio'
);
// Result: https://sipmunchyap.com?utm_source=instagram&utm_medium=social&utm_campaign=bio_link

// Custom UTM
const customLink = generateUtmUrl('https://sipmunchyap.com/results', {
  source: 'partner_yelp',
  medium: 'referral',
  campaign: 'cross_promo',
  content: 'sidebar_banner'
});
```

## Available Templates

| Template Name | Source | Medium | Campaign |
|--------------|--------|--------|----------|
| `instagram_bio` | instagram | social | bio_link |
| `instagram_story` | instagram | social | story |
| `instagram_post` | instagram | social | organic_post |
| `facebook_post` | facebook | social | organic_post |
| `facebook_group` | facebook | social | group_post |
| `twitter_post` | twitter | social | organic_post |
| `reddit_post` | reddit | social | organic_post |
| `linkedin_post` | linkedin | social | organic_post |
| `tiktok_bio` | tiktok | social | bio_link |
| `facebook_ad` | facebook | paid_social | (custom) |
| `instagram_ad` | instagram | paid_social | (custom) |
| `google_ad` | google | cpc | (custom) |
| `email_newsletter` | newsletter | email | (custom) |
| `email_promo` | email | email | promotion |
| `partner_referral` | (custom) | referral | partner |
| `qr_code` | qr_code | offline | (custom) |
| `flyer` | flyer | offline | (custom) |

## Best Practices

### ✅ Do
- Use consistent naming across all campaigns
- Keep parameters lowercase with underscores
- Be specific in campaign names (include dates/locations)
- Test links before sharing widely
- Use `utm_content` to A/B test different link placements

### ❌ Don't
- Use spaces or special characters
- Change UTM conventions mid-campaign
- Use overly generic campaign names like "promo"
- Forget to include all three required parameters
- Use UTM parameters on internal links (within sipmunchyap.com)

## Viewing UTM Data

UTM data is captured automatically when users click tagged links. You can view the results in:

1. **Analytics Dashboard** → Traffic Sources tab
2. **Database Query**: Check `user_sessions` table for `utm_source`, `utm_medium`, `utm_campaign` columns

## Quick Reference Card

```
Instagram Bio:    ?utm_source=instagram&utm_medium=social&utm_campaign=bio_link
Facebook Post:    ?utm_source=facebook&utm_medium=social&utm_campaign=organic_post
Email Newsletter: ?utm_source=newsletter&utm_medium=email&utm_campaign=weekly_digest
Partner Referral: ?utm_source=PARTNER&utm_medium=referral&utm_campaign=partner
QR Code:          ?utm_source=qr_code&utm_medium=offline&utm_campaign=LOCATION
Google Ads:       ?utm_source=google&utm_medium=cpc&utm_campaign=CAMPAIGN&utm_term=KEYWORD
```

## Questions?

If you need help setting up UTM tracking for a specific campaign, check the codebase for `UTM_TEMPLATES` in `src/utils/analytics.ts` or reach out to the dev team.
