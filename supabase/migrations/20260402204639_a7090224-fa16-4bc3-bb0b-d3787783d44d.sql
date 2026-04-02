
UPDATE user_events ue
SET merchant_id = m.id
FROM "Merchant" m
WHERE m.slug = regexp_replace(ue.page_path, '^/restaurant/', '')
  AND ue.event_action IN ('phone_clicked','directions_clicked','website_clicked')
  AND ue.merchant_id IS NULL
  AND ue.page_path LIKE '/restaurant/%';
