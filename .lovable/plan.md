

## Add "Gay Bar" Category

### What
Insert a new "Gay Bar" subcategory under the existing "Bar" parent (`d12930d9-3ce1-4436-829d-b9357e7414c0`) in the `categories` table.

### How
Single SQL INSERT via the insert tool:

```sql
INSERT INTO categories (name, slug, parent_id, category_type)
VALUES ('Gay Bar', 'gay-bar', 'd12930d9-3ce1-4436-829d-b9357e7414c0', 'venue_type')
RETURNING id;
```

The returned `id` (UUID) will be shared with you immediately after insertion.

### Files affected
None — data-only change, no code modifications needed.

