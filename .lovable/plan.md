

## Bug #3: MobileCTABar — Dead code cleanup (Yellow severity)

### Issues

1. **`buttonCount` (line 103)** — Declared but never used anywhere. It was likely intended for dynamic sizing but never wired up.

2. **`cn()` wrapping single strings (lines 113, 128, 144)** — `cn()` is a classname merger utility. When called with a single static string (no conditionals, no merging), it's a no-op wrapper. Since `buttonCount` is unused, there's no conditional logic to justify `cn()` here.

3. **`React` import (line 2)** — Not needed in React 18 with the JSX transform. Minor but worth cleaning up.

### Fix

**File: `src/components/MobileCTABar.tsx`**

- **Remove** line 2: `import React from 'react';`
- **Remove** line 7: `import { cn } from '@/lib/utils';`
- **Remove** line 103: `const buttonCount = ...`
- **Replace** `className={cn("flex-1 bg-success...")}` with `className="flex-1 bg-success..."` on all three buttons (lines 113, 128, 144)

No behavioral changes. Pure cleanup — removes dead code and unnecessary abstractions.

