# Vite + SockJS Compatibility Fix

## Issue
When using `sockjs-client` with Vite, you may encounter:
```
Uncaught ReferenceError: global is not defined
```

## Root Cause
SockJS expects the Node.js `global` variable, which doesn't exist in browser environments. Vite doesn't polyfill this by default.

## Solution Applied ✅

Updated `vite.config.js` to map `global` to `globalThis`:

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
  },
})
```

## How to Apply

1. **Update `vite.config.js`** (already done)
2. **Restart the dev server**:
   ```powershell
   # Stop current dev server (Ctrl+C)
   # Then restart:
   npm run dev
   ```

3. **Clear browser cache** if needed:
   - Press `Ctrl+Shift+R` (hard reload)
   - Or clear cache in DevTools

## Verification

After restarting, check the browser console:
- ❌ Before: `global is not defined`
- ✅ After: No error, WebSocket connects successfully

## Additional Notes

This is a common issue when using libraries designed for Node.js in browser environments with Vite. The `globalThis` is the standard way to access the global object in both Node.js and browser contexts.

## Alternative Solutions (Not Needed)

If the simple fix doesn't work, you could also:

1. **Use native WebSocket instead of SockJS**:
   ```javascript
   const client = new Client({
     brokerURL: 'ws://localhost:60/ws',
     // Remove webSocketFactory
   });
   ```

2. **Install vite-plugin-node-polyfills**:
   ```powershell
   npm install --save-dev vite-plugin-node-polyfills
   ```
   
   Then update `vite.config.js`:
   ```javascript
   import { nodePolyfills } from 'vite-plugin-node-polyfills'
   
   export default defineConfig({
     plugins: [react(), nodePolyfills()],
   })
   ```

But the simple `define: { global: 'globalThis' }` fix is sufficient for our use case.
