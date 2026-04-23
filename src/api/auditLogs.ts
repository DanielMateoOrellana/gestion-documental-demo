import {
    getDemoActionTypes,
    getDemoAuditLogById,
    getDemoAuditLogs,
    getDemoAuditLogStats,
    getDemoEntityTypes,
    simulateRequest,
} from "../demo/demoStore";

export interface AuditLogUser {
    id: number;
    fullName: string;
    email: string;
    role: string;
}

export interface AuditLog {
    id: number;
    action: string;
    entityType: string;
    entityId: number | null;
    description: string;
    details: string | null;
    userId: number | null;
    user: AuditLogUser | null;
    ipAddress: string | null;
    createdAt: string;
}

export interface AuditLogResponse {
    data: AuditLog[];
    total: number;
    limit: number;
    offset: number;
}

export interface AuditLogFilter {
    action?: string;
    entityType?: string;
    userId?: number;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
}

export interface AuditLogStats {
    totalLogs: number;
    byAction: { action: string; count: number }[];
    byEntityType: { entityType: string; count: number }[];
    recentActivity: AuditLog[];
}

// Obtener registros de la bitácora con filtros
export async function fetchAuditLogs(filter: AuditLogFilter = {}): Promise<AuditLogResponse> {
    return simulateRequest(() => getDemoAuditLogs(filter));
}

export async function fetchAuditLogById(id: number): Promise<AuditLog> {
    return simulateRequest(() => getDemoAuditLogById(id));
}

export async function fetchAuditLogStats(): Promise<AuditLogStats> {
    return simulateRequest(() => getDemoAuditLogStats());
}

export async function fetchActionTypes(): Promise<string[]> {
    return simulateRequest(() => getDemoActionTypes());
}

export async function fetchEntityTypes(): Promise<string[]> {
    return simulateRequest(() => getDemoEntityTypes());
}

export const actionLabels: Record<string, string> = {
    CREATE: "Crear",
    UPDATE: "Actualizar",
    DELETE: "Eliminar",
    LOGIN: "Iniciar sesión",
    LOGOUT: "Cerrar sesión",
    UPLOAD: "Subir archivo",
    DOWNLOAD: "Descargar archivo",
    ASSIGN: "Asignar",
    UNASSIGN: "Desasignar",
    COMPLETE: "Completar",
    ACTIVATE: "Activar",
    DEACTIVATE: "Desactivar",
};

export const entityTypeLabels: Record<string, string> = {
    USER: "Usuario",
    PROCESS_CATEGORY: "Categoría de proceso",
    PROCESS_TYPE: "Tipo de proceso",
    PROCESS_TEMPLATE: "Plantilla",
    TEMPLATE_STEP: "Paso de plantilla",
    PROCESS_INSTANCE: "Proceso",
    STEP_INSTANCE: "Paso",
    TAG: "Etiqueta",
    FILE: "Archivo",
    SESSION: "Sesión",
};

export const actionColors: Record<string, string> = {
    CREATE: "#10B981", // green
    UPDATE: "#3B82F6", // blue
    DELETE: "#EF4444", // red
    LOGIN: "#8B5CF6", // purple
    LOGOUT: "#6B7280", // gray
    UPLOAD: "#14B8A6", // teal
    DOWNLOAD: "#06B6D4", // cyan
    ASSIGN: "#F59E0B", // amber
    UNASSIGN: "#F97316", // orange
    COMPLETE: "#22C55E", // green
    ACTIVATE: "#10B981", // green
    DEACTIVATE: "#6B7280", // gray
};
