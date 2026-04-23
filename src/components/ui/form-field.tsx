import * as React from "react";
import { cn } from "./utils";
import { Label } from "./label";
import { AlertCircle } from "lucide-react";

interface FormFieldProps {
    label: string;
    htmlFor?: string;
    required?: boolean;
    error?: string;
    hint?: string;
    children: React.ReactNode;
    className?: string;
}

export function FormField({
    label,
    htmlFor,
    required,
    error,
    hint,
    children,
    className,
}: FormFieldProps) {
    return (
        <div className={cn("space-y-1.5", className)}>
            <Label
                htmlFor={htmlFor}
                className={cn(
                    "flex items-center gap-1",
                    error && "text-destructive"
                )}
            >
                {label}
                {required && <span className="text-destructive">*</span>}
            </Label>
            {children}
            {error && (
                <p className="flex items-center gap-1 text-xs text-destructive animate-in fade-in slide-in-from-top-1">
                    <AlertCircle className="w-3 h-3" />
                    {error}
                </p>
            )}
            {hint && !error && (
                <p className="text-xs text-muted-foreground">{hint}</p>
            )}
        </div>
    );
}
