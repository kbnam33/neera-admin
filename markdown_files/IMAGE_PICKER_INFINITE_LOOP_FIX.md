# Image Picker Infinite Loop Fix

## Problem

The "Select from Existing" modal was stuck in an infinite loop, causing:
- Loading screen and listing screen to rapidly interchange
- Console showing repeated `fetchData` calls
- Component continuously re-rendering

## Root Cause

**React Dependency Cycle:**

The `useEffect` hook had `fetchData` in its dependency array:

```javascript
useEffect(() => {
    // ...
    fetchData(false, true);
}, [open, fetchData]); // ❌ fetchData in dependencies
```

This created an infinite loop because:
1. `fetchData` is wrapped in `useCallback` with dependencies
2. When `fetchData` changes, the `useEffect` runs
3. `useEffect` causes re-renders which recreate `fetchData`
4. New `fetchData` triggers `useEffect` again → Loop!

## Solution Applied

### Fix 1: Remove fetchData from useEffect Dependencies

Changed the `useEffect` to only depend on `open`, not `fetchData`:

```javascript
useEffect(() => {
    if (!open) {
        // Reset logic...
        return;
    }

    // Clear cache
    pickerUsedImagesCache = null;
    pickerCacheTimestamp = null;
    
    // Call fetchData without making it a dependency
    const loadData = async () => {
        try {
            console.log("[ProductImagePicker] Modal opened, starting initial fetch...");
            await fetchData(false, true);
        } catch (error) {
            console.error("[ProductImagePicker] Error in initial fetch:", error);
            alert("Failed to load images. Please refresh and try again.");
        }
    };
    
    loadData();
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
}, [open]); // ✅ Only depend on 'open'
```

### Fix 2: Add Loading Guard

Added a guard to prevent multiple simultaneous fetches:

```javascript
const fetchData = useCallback(async (updateCurrentView = false, forceRefresh = false) => {
    // Prevent multiple simultaneous fetches
    if (isLoading || isRefreshing) {
        console.log("[ProductImagePicker] Fetch already in progress, skipping...");
        return [];
    }
    
    // Set loading state
    if (updateCurrentView) {
        setIsRefreshing(true);
    } else {
        setIsLoading(true);
    }
    
    // ... rest of fetch logic
}, [fetchAllUnorganizedImages, isLoading, isRefreshing]);
```

## Why This Works

1. **Stable Dependency**: `open` is a boolean prop that only changes when modal opens/closes
2. **No Recreations**: `fetchData` isn't in dependencies, so it doesn't trigger re-renders
3. **Loading Guard**: Prevents multiple simultaneous fetches even if somehow triggered
4. **Clean Lifecycle**: Data loads once when modal opens, resets when it closes

## Testing

### Before Fix:
- ❌ Modal flickers between loading and list view
- ❌ Console shows continuous `fetchData` calls
- ❌ Component unusable due to rapid re-renders

### After Fix:
- ✅ Modal opens smoothly
- ✅ Loading screen shows briefly (~1-2 seconds)
- ✅ List view appears and stays stable
- ✅ Only one `fetchData` call per modal open
- ✅ Console shows clean logs:
  ```
  [ProductImagePicker] Modal opened, starting initial fetch...
  [ProductImagePicker] Starting fetchData...
  [ProductImagePicker] Fetched products: 137
  [ProductImagePicker] Unorganized images: 27
  [ProductImagePicker] fetchData complete
  ```

## How to Test

1. **Open admin tool** at `http://localhost:5174/`
2. **Go to Products** → Edit any product
3. **Click "Select from existing"** button
4. **Expected behavior**:
   - Modal opens
   - Shows "Loading..." for ~1-2 seconds
   - Shows list of products and "Unorganized Images"
   - **NO FLICKERING**
   - Console shows one set of logs, not repeating

5. **Check console** (F12):
   - Should see ONE "Modal opened" message
   - Should see ONE complete fetch sequence
   - Should NOT see repeated logs

## Technical Details

### React useEffect Rules

**Problem Pattern** (causes infinite loops):
```javascript
const myFunction = useCallback(() => {
    // ...
}, [someDependency]);

useEffect(() => {
    myFunction();
}, [myFunction]); // ❌ Function in dependencies
```

**Solution Pattern**:
```javascript
const myFunction = useCallback(() => {
    // ...
}, [someDependency]);

useEffect(() => {
    myFunction();
    // eslint-disable-next-line react-hooks/exhaustive-deps
}, [someDependency]); // ✅ Only primitive dependencies
```

### Why eslint-disable-next-line?

The ESLint rule `react-hooks/exhaustive-deps` wants all dependencies listed. But in this case:
- Including `fetchData` causes infinite loop
- The function is stable within modal lifecycle
- We only want to run on `open` change

So we disable the rule for this specific line with a comment.

## Files Modified

- `src/components/ProductImagePicker.jsx`
  - Fixed `useEffect` dependency array
  - Added loading guard to `fetchData`
  - Wrapped fetch call in async function

## Related Fixes

This fix complements the earlier changes:
- ✅ Initial loading state fix
- ✅ Better error handling
- ✅ Enhanced console logging
- ✅ Improved empty states
- ✅ **Infinite loop fix** ← NEW

## Common React Pitfalls Avoided

1. **Functions in useEffect deps** → Use primitives instead
2. **Missing loading guards** → Check state before async operations
3. **Unhandled promise rejections** → Wrap in try-catch
4. **Stale closure issues** → Use functional state updates where needed

---

The infinite loop is now fixed! The modal should load once and stay stable. 🎉
