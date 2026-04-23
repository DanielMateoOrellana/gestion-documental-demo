/**
 * Validation utilities for form fields
 */

export interface ValidationResult {
    isValid: boolean;
    error?: string;
}

export const validators = {
    required: (value: unknown, fieldName = "Este campo"): ValidationResult => {
        if (value === undefined || value === null || value === "") {
            return { isValid: false, error: `${fieldName} es requerido` };
        }
        if (typeof value === "string" && value.trim() === "") {
            return { isValid: false, error: `${fieldName} es requerido` };
        }
        return { isValid: true };
    },

    email: (value: string): ValidationResult => {
        if (!value) return { isValid: true }; // Let required handle empty
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            return { isValid: false, error: "Ingrese un email válido" };
        }
        return { isValid: true };
    },

    minLength: (value: string, min: number, fieldName = "Este campo"): ValidationResult => {
        if (!value) return { isValid: true }; // Let required handle empty
        if (value.length < min) {
            return { isValid: false, error: `${fieldName} debe tener al menos ${min} caracteres` };
        }
        return { isValid: true };
    },

    maxLength: (value: string, max: number, fieldName = "Este campo"): ValidationResult => {
        if (!value) return { isValid: true };
        if (value.length > max) {
            return { isValid: false, error: `${fieldName} no puede exceder ${max} caracteres` };
        }
        return { isValid: true };
    },

    password: (value: string): ValidationResult => {
        if (!value) return { isValid: true };
        if (value.length < 6) {
            return { isValid: false, error: "La contraseña debe tener al menos 6 caracteres" };
        }
        return { isValid: true };
    },

    fileSize: (file: File | null, maxSizeMB: number): ValidationResult => {
        if (!file) return { isValid: true };
        const maxBytes = maxSizeMB * 1024 * 1024;
        if (file.size > maxBytes) {
            return { isValid: false, error: `El archivo no debe superar ${maxSizeMB} MB` };
        }
        return { isValid: true };
    },

    fileType: (file: File | null, allowedTypes: string[]): ValidationResult => {
        if (!file) return { isValid: true };
        const extension = file.name.split('.').pop()?.toLowerCase();
        if (!extension || !allowedTypes.includes(`.${extension}`)) {
            return { isValid: false, error: `Tipo de archivo no permitido. Use: ${allowedTypes.join(", ")}` };
        }
        return { isValid: true };
    },
};

/**
 * Validate multiple fields at once
 * Returns an object with field names as keys and error messages as values
 */
export function validateForm<T extends Record<string, unknown>>(
    data: T,
    rules: Partial<Record<keyof T, ((value: unknown) => ValidationResult)[]>>
): Partial<Record<keyof T, string>> {
    const errors: Partial<Record<keyof T, string>> = {};

    for (const [field, fieldRules] of Object.entries(rules)) {
        if (!fieldRules) continue;

        for (const rule of fieldRules as ((value: unknown) => ValidationResult)[]) {
            const result = rule(data[field as keyof T]);
            if (!result.isValid && result.error) {
                errors[field as keyof T] = result.error;
                break; // Stop at first error for this field
            }
        }
    }

    return errors;
}

/**
 * Check if an errors object has any errors
 */
export function hasErrors(errors: Record<string, string | undefined>): boolean {
    return Object.values(errors).some(error => !!error);
}
