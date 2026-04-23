import * as React from "react";
import { cn } from "./utils";
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
    size?: "sm" | "md" | "lg";
    text?: string;
    className?: string;
}

const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
};

export function LoadingSpinner({
    size = "md",
    text,
    className,
}: LoadingSpinnerProps) {
    return (
        <div className={cn("flex flex-col items-center justify-center gap-2", className)}>
            <Loader2 className={cn("animate-spin text-primary", sizeClasses[size])} />
            {text && (
                <p className="text-sm text-muted-foreground animate-pulse">{text}</p>
            )}
        </div>
    );
}

interface LoadingOverlayProps {
    loading: boolean;
    children: React.ReactNode;
    text?: string;
}

export function LoadingOverlay({ loading, children, text }: LoadingOverlayProps) {
    return (
        <div className="relative">
            {children}
            {loading && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 rounded-lg">
                    <LoadingSpinner size="lg" text={text} />
                </div>
            )}
        </div>
    );
}

interface TableSkeletonProps {
    rows?: number;
    columns?: number;
}

export function TableSkeleton({ rows = 5, columns = 5 }: TableSkeletonProps) {
    return (
        <div className="space-y-3 animate-pulse">
            {/* Header */}
            <div className="flex gap-4 pb-2 border-b">
                {Array.from({ length: columns }).map((_, i) => (
                    <div key={i} className="h-4 bg-muted rounded flex-1" />
                ))}
            </div>
            {/* Rows */}
            {Array.from({ length: rows }).map((_, rowIndex) => (
                <div key={rowIndex} className="flex gap-4 py-2">
                    {Array.from({ length: columns }).map((_, colIndex) => (
                        <div
                            key={colIndex}
                            className="h-4 bg-muted rounded flex-1"
                            style={{ opacity: 1 - rowIndex * 0.1 }}
                        />
                    ))}
                </div>
            ))}
        </div>
    );
}
