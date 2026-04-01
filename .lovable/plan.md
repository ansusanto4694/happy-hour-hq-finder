

## Bulk Upload JOEY Logo to 35 Merchants

### What happens
A script will take the uploaded logo image and, for each of the 35 JOEY merchant IDs:
1. Upload the image to the `restaurant-logos` Supabase storage bucket (one copy per merchant, named `{merchantId}-logo.png`)
2. Update the `logo_url` column on the `Merchant` table to point to the new public URL

### Technical details

| Step | Action |
|------|--------|
| 1 | Copy `user-uploads://image.png` to `/tmp/joey-logo.png` |
| 2 | Run a Node.js script that loops through all 35 merchant IDs (902–936), uploads the image to `restaurant-logos` bucket as `{id}-logo.png`, then builds a bulk SQL `UPDATE` using the public URLs |
| 3 | Execute the SQL update via `psql` to set `logo_url` for all 35 merchants |

### Merchant IDs
902, 903, 904, 905, 906, 907, 908, 909, 910, 911, 912, 913, 914, 915, 916, 917, 918, 919, 920, 921, 922, 923, 924, 925, 926, 927, 928, 929, 930, 931, 932, 933, 934, 935, 936

### Result
All 35 JOEY merchants will display the wine glass logo on their profiles and in search results.

