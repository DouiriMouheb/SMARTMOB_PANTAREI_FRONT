import toast from 'react-hot-toast';

/**
 * Error types for categorization
 */
export const ErrorType = {
  NETWORK: 'NETWORK',
  VALIDATION: 'VALIDATION',
  AUTH: 'AUTH',
  NOT_FOUND: 'NOT_FOUND',
  SERVER: 'SERVER',
  UNKNOWN: 'UNKNOWN',
};

/**
 * Parse error and extract meaningful information
 */
export const parseError = (error) => {
  // Network errors
  if (error.message === 'Failed to fetch' || error.message.includes('NetworkError')) {
    return {
      type: ErrorType.NETWORK,
      message: 'Errore di connessione. Verifica la tua connessione internet.',
      originalError: error,
    };
  }

  // HTTP errors
  if (error.status) {
    switch (error.status) {
      case 400:
        return {
          type: ErrorType.VALIDATION,
          message: error.message || 'Richiesta non valida. Verifica i dati inseriti.',
          originalError: error,
        };
      case 401:
        return {
          type: ErrorType.AUTH,
          message: 'Non autorizzato. Effettua nuovamente il login.',
          originalError: error,
        };
      case 403:
        return {
          type: ErrorType.AUTH,
          message: 'Accesso negato. Non hai i permessi necessari.',
          originalError: error,
        };
      case 404:
        return {
          type: ErrorType.NOT_FOUND,
          message: 'Risorsa non trovata.',
          originalError: error,
        };
      case 500:
      case 502:
      case 503:
        return {
          type: ErrorType.SERVER,
          message: 'Errore del server. Riprova più tardi.',
          originalError: error,
        };
      default:
        return {
          type: ErrorType.SERVER,
          message: error.message || 'Si è verificato un errore imprevisto.',
          originalError: error,
        };
    }
  }

  // Generic error
  return {
    type: ErrorType.UNKNOWN,
    message: error.message || 'Si è verificato un errore imprevisto.',
    originalError: error,
  };
};

/**
 * Handle errors with appropriate user feedback
 */
export const handleError = (error, options = {}) => {
  const {
    showToast = true,
    toastDuration = 4000,
    logToConsole = true,
    context = '',
  } = options;

  const parsedError = parseError(error);

  // Log to console in development
  if (logToConsole && import.meta.env.DEV) {
    console.error(`[Error Handler]${context ? ` ${context}:` : ''}`, {
      type: parsedError.type,
      message: parsedError.message,
      originalError: parsedError.originalError,
    });
  }

  // Log to console in production (less verbose)
  if (logToConsole && !import.meta.env.DEV) {
    console.error(`Error: ${parsedError.message}`);
  }

  // Show toast notification
  if (showToast) {
    switch (parsedError.type) {
      case ErrorType.NETWORK:
        toast.error(parsedError.message, { 
          duration: toastDuration,
          icon: '🌐',
        });
        break;
      case ErrorType.AUTH:
        toast.error(parsedError.message, { 
          duration: toastDuration,
          icon: '🔒',
        });
        break;
      case ErrorType.VALIDATION:
        toast.error(parsedError.message, { 
          duration: toastDuration,
          icon: '⚠️',
        });
        break;
      default:
        toast.error(parsedError.message, { 
          duration: toastDuration,
        });
    }
  }

  return parsedError;
};

/**
 * Log errors without showing user notifications
 * Useful for non-critical errors
 */
export const logError = (error, context = '') => {
  if (import.meta.env.DEV) {
    console.warn(`[Warning]${context ? ` ${context}:` : ''}`, error);
  }
};

/**
 * Wrapper for async functions with automatic error handling
 */
export const withErrorHandling = async (fn, options = {}) => {
  try {
    return await fn();
  } catch (error) {
    handleError(error, options);
    throw error; // Re-throw to allow caller to handle if needed
  }
};
