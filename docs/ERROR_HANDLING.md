# Error Handling Documentation

## Overview

This document describes the error handling implementation in the Smartmob Pantarei Front application.

## Architecture

### Components

1. **ErrorBoundary** (`src/components/ErrorBoundary.jsx`)
   - React error boundary to catch rendering errors
   - Displays user-friendly error UI
   - Shows detailed error information in development mode
   - Provides reset and navigation options

2. **Error Handler Utility** (`src/utils/errorHandler.js`)
   - Centralized error handling logic
   - Parses and categorizes errors
   - Provides user-friendly error messages
   - Handles toast notifications
   - Development vs production logging

3. **Enhanced ApiService** (`src/services/ApiService.js`)
   - Custom `ApiError` class with status codes
   - Structured error responses
   - Consistent error handling across API calls

## Error Types

The system categorizes errors into the following types:

- **NETWORK**: Connection issues, offline mode
- **VALIDATION**: Invalid input or request data (400)
- **AUTH**: Authentication/authorization failures (401, 403)
- **NOT_FOUND**: Resource not found (404)
- **SERVER**: Server errors (500, 502, 503)
- **UNKNOWN**: Uncategorized errors

## Usage

### In Components

```javascript
import { handleError, logError } from '../utils/errorHandler';

// For critical errors with user notification
try {
  await someApiCall();
} catch (error) {
  handleError(error, {
    context: 'Loading data',
    showToast: true,
  });
}

// For non-critical warnings
try {
  someOptionalOperation();
} catch (error) {
  logError(error, 'Optional operation failed');
}
```

### In Custom Hooks

```javascript
import { handleError } from '../utils/errorHandler';

const fetchData = async () => {
  try {
    setLoading(true);
    setError(null);
    const result = await ApiService.getData();
    setData(result);
  } catch (err) {
    const parsedError = handleError(err, {
      context: 'Fetch data',
      showToast: true,
    });
    setError(parsedError.message);
  } finally {
    setLoading(false);
  }
};
```

### In Services

```javascript
import { handleError } from '../utils/errorHandler';

async getData() {
  try {
    const response = await fetch(url);
    return await this.handleResponse(response);
  } catch (error) {
    handleError(error, {
      context: 'Service: getData',
      showToast: true,
    });
    throw error;
  }
}
```

## Features

### User-Friendly Messages

All error messages are translated to Italian and provide clear, actionable information:

- ❌ ~~"HTTP error! status: 404"~~
- ✅ "Risorsa non trovata."

- ❌ ~~"Failed to fetch"~~
- ✅ "Errore di connessione. Verifica la tua connessione internet."

### Development vs Production

- **Development**: Detailed error logs with stack traces
- **Production**: Clean error messages without sensitive information

### Toast Notifications

Errors are displayed with appropriate icons:
- 🌐 Network errors
- 🔒 Authentication errors
- ⚠️ Validation errors
- ❌ General errors

### Silent Errors Eliminated

All previous silent error swallowing has been replaced with proper logging:

```javascript
// ❌ Before
try {
  doSomething();
} catch (e) {
  // ignore
}

// ✅ After
try {
  doSomething();
} catch (e) {
  logError(e, 'Context of the operation');
}
```

## Error Boundary

The global error boundary wraps the entire application:

```jsx
<ErrorBoundary>
  <Router>
    <App />
  </Router>
</ErrorBoundary>
```

Features:
- Catches React rendering errors
- Prevents entire app crash
- Displays user-friendly error page
- Provides recovery options
- Shows technical details in dev mode

## Console Logging Strategy

### Development Mode
- Detailed error information
- Stack traces
- Context information
- Debug messages

### Production Mode
- Minimal error messages
- No stack traces
- No sensitive information
- Critical errors only

## Best Practices

1. **Always use handleError for user-facing errors**
   ```javascript
   handleError(error, { context: 'Operation name', showToast: true });
   ```

2. **Use logError for non-critical warnings**
   ```javascript
   logError(error, 'Non-critical operation failed');
   ```

3. **Wrap development-only console.logs**
   ```javascript
   if (import.meta.env.DEV) {
     console.log('Debug info:', data);
   }
   ```

4. **Provide context in error messages**
   ```javascript
   handleError(error, { context: 'Loading user data' });
   ```

5. **Don't swallow errors silently**
   - Always log or handle errors
   - Use try-catch appropriately
   - Re-throw when necessary

## Testing Error Handling

### Simulate Network Error
```javascript
// In development tools, set offline mode
window.navigator.onLine = false;
```

### Trigger Error Boundary
```javascript
// Throw error in component
throw new Error('Test error boundary');
```

### Test API Errors
```javascript
// Mock API responses with error status codes
fetch.mockResponseOnce('', { status: 404 });
```

## Migration Notes

### Updated Files

- ✅ `src/components/ErrorBoundary.jsx` - New component
- ✅ `src/utils/errorHandler.js` - New utility
- ✅ `src/services/ApiService.js` - Enhanced error handling
- ✅ `src/services/acquisizioniService.js` - Updated to use error handler
- ✅ `src/hooks/useAcquisizioni.js` - Updated error handling
- ✅ `src/hooks/usePostazioni.js` - Updated error handling
- ✅ `src/hooks/useLineePostazioni.js` - Updated error handling
- ✅ `src/hooks/useAcquisizioniRealTime.js` - Updated error handling
- ✅ `src/pages/Acquisizioni.jsx` - Cleaned up console logs
- ✅ `src/pages/RealTimeMonitoring.jsx` - Cleaned up error swallowing
- ✅ `src/App.jsx` - Added ErrorBoundary wrapper

### Removed Patterns

1. ❌ Silent error swallowing: `catch (e) { /* ignore */ }`
2. ❌ Direct console.error in production code
3. ❌ Inconsistent error messages
4. ❌ Raw error.message displayed to users

### New Patterns

1. ✅ Centralized error handling
2. ✅ User-friendly error messages
3. ✅ Development vs production logging
4. ✅ Error categorization
5. ✅ Global error boundary

## Future Improvements

1. **Error Reporting Service Integration**
   - Sentry, LogRocket, or similar
   - Automatic error tracking
   - User session replay

2. **Retry Logic**
   - Automatic retry for network errors
   - Exponential backoff
   - User-triggered retry

3. **Offline Support**
   - Service worker integration
   - Offline data caching
   - Queue failed requests

4. **Error Analytics**
   - Track error frequency
   - Identify problem areas
   - Monitor error trends
