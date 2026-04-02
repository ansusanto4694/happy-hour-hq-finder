

## Bump Cache Buster

Update the `buster` string in `src/App.tsx` from `'v3'` to `'v4'` in the `PersistQueryClientProvider` config. This forces all returning users' browsers to discard stale cached data and fetch fresh.

### File Changed

| File | Change |
|------|--------|
| `src/App.tsx` | Change `buster: 'v3'` → `buster: 'v4'` |

