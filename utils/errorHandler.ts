/**
 * Error Handler Utility
 * Sanitizes error messages to prevent API key leakage and provides user-friendly messages
 */

export interface SanitizedError {
    message: string;
    userMessage: string;
    timestamp: number;
}

/**
 * Sanitize error by removing sensitive information (API keys, tokens, etc.)
 */
export function sanitizeError(error: any): SanitizedError {
    const timestamp = Date.now();

    // Extract base error message
    let message = '';
    if (error instanceof Error) {
        message = error.message;
    } else if (typeof error === 'string') {
        message = error;
    } else if (error?.message) {
        message = String(error.message);
    } else {
        message = 'Unknown error occurred';
    }

    // Remove API keys and tokens
    const sanitized = message
        .replace(/AIzaSy[a-zA-Z0-9_-]{33}/g, '[REDACTED_GEMINI_KEY]')
        .replace(/sk-[a-zA-Z0-9]{48}/g, '[REDACTED_API_KEY]')
        .replace(/Bearer\s+[a-zA-Z0-9_-]+/g, 'Bearer [REDACTED]')
        .replace(/api[_-]?key[=:]\s*[^\s&]+/gi, 'api_key=[REDACTED]');

    // Generate user-friendly message
    const userMessage = getUserFriendlyMessage(sanitized, error);

    return {
        message: sanitized,
        userMessage,
        timestamp
    };
}

/**
 * Convert technical error into user-friendly message
 */
function getUserFriendlyMessage(sanitizedMessage: string, originalError: any): string {
    const lower = sanitizedMessage.toLowerCase();

    // API Key errors
    if (lower.includes('api key') || lower.includes('unauthorized') || lower.includes('401')) {
        return 'API key is missing or invalid. Please check your settings.';
    }

    // Quota errors
    if (lower.includes('quota') || lower.includes('rate limit') || lower.includes('429')) {
        return 'API rate limit reached. Please try again in a few moments.';
    }

    // Network errors
    if (lower.includes('network') || lower.includes('fetch') || lower.includes('cors')) {
        return 'Network error. Please check your internet connection.';
    }

    // Storage errors
    if (lower.includes('quota exceeded') || lower.includes('storage')) {
        return 'Storage limit reached. Please clear some space or export your data.';
    }

    // Model errors
    if (lower.includes('model') || lower.includes('not found') || lower.includes('404')) {
        return 'The requested AI model is not available. Please try a different model.';
    }

    // Safety/Content filter
    if (lower.includes('safety') || lower.includes('blocked') || lower.includes('content')) {
        return 'Content was blocked by safety filters. Please modify your prompt.';
    }

    // Generic fallback
    return 'An error occurred. Please try again or check the console for details.';
}

/**
 * Log error to console with sanitization
 */
export function logError(error: any, context?: string): void {
    const sanitized = sanitizeError(error);
    const prefix = context ? `[${context}]` : '[Error]';

    console.error(`${prefix} ${sanitized.message}`, {
        timestamp: new Date(sanitized.timestamp).toISOString(),
        userMessage: sanitized.userMessage
    });
}

/**
 * Display error to user (can be used with toast notifications)
 */
export function displayError(error: any, context?: string): string {
    const sanitized = sanitizeError(error);
    logError(error, context);
    return sanitized.userMessage;
}
