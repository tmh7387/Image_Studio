/**
 * Input Validation Utility
 * Validates user inputs for security and API constraints
 */

export interface ValidationResult {
    valid: boolean;
    error?: string;
    warning?: string;
}

const MAX_PROMPT_LENGTH = 2000;
const MAX_SAFE_PROMPT_LENGTH = 1500;
const MAX_BASE64_SIZE_MB = 20; // 20MB per image

/**
 * Validate text prompt
 */
export function validatePrompt(prompt: string): ValidationResult {
    if (!prompt || prompt.trim().length === 0) {
        return {
            valid: false,
            error: 'Prompt cannot be empty'
        };
    }

    const length = prompt.length;

    if (length > MAX_PROMPT_LENGTH) {
        return {
            valid: false,
            error: `Prompt is too long (${length}/${MAX_PROMPT_LENGTH} characters). Please shorten it.`
        };
    }

    if (length > MAX_SAFE_PROMPT_LENGTH) {
        return {
            valid: true,
            warning: `Prompt is quite long (${length} characters). Consider shortening for better results.`
        };
    }

    return { valid: true };
}

/**
 * Validate base64 image size
 */
export function validateImageSize(base64Data: string): ValidationResult {
    if (!base64Data) {
        return {
            valid: false,
            error: 'Image data is required'
        };
    }

    // Calculate size in MB
    const sizeInBytes = (base64Data.length * 3) / 4;
    const sizeInMB = sizeInBytes / (1024 * 1024);

    if (sizeInMB > MAX_BASE64_SIZE_MB) {
        return {
            valid: false,
            error: `Image is too large (${sizeInMB.toFixed(1)}MB). Maximum allowed is ${MAX_BASE64_SIZE_MB}MB.`
        };
    }

    return { valid: true };
}

/**
 * Sanitize user input (basic XSS prevention, though React handles this)
 */
export function sanitizeUserInput(input: string): string {
    return input
        .trim()
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
        .slice(0, MAX_PROMPT_LENGTH); // Enforce max length
}

/**
 * Validate character name
 */
export function validateCharacterName(name: string): ValidationResult {
    if (!name || name.trim().length === 0) {
        return {
            valid: false,
            error: 'Character name is required'
        };
    }

    if (name.length > 50) {
        return {
            valid: false,
            error: 'Character name must be 50 characters or less'
        };
    }

    return { valid: true };
}

/**
 * Get prompt character count with formatting
 */
export function getPromptStats(prompt: string): {
    length: number;
    percentage: number;
    isNearLimit: boolean;
    isOverLimit: boolean;
} {
    const length = prompt.length;
    const percentage = (length / MAX_PROMPT_LENGTH) * 100;

    return {
        length,
        percentage,
        isNearLimit: length > MAX_SAFE_PROMPT_LENGTH,
        isOverLimit: length > MAX_PROMPT_LENGTH
    };
}

/**
 * Constants export for use in components
 */
export const VALIDATION_LIMITS = {
    MAX_PROMPT_LENGTH,
    MAX_SAFE_PROMPT_LENGTH,
    MAX_BASE64_SIZE_MB
};
