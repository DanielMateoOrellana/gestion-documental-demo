// Types based on FIEC database schema

export enum UserRoleEnum {
  ADMINISTRADOR = 'ADMINISTRADOR',
  GESTOR = 'GESTOR',
  LECTOR = 'LECTOR',
  AYUDANTE = 'AYUDANTE',
}

export interface User {
  id: number;
  fullName: string;
  email: string;
  role: UserRoleEnum;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: number;
  name: string;
  code: string;
  description: string;
}


export interface ProcessType {
  id: number;
  code: string;
  name: string;
  description: string;
  active: boolean;
  created_by: number;
  created_at: string;
}

export interface ProcessTemplate {
  id: number;
  process_type_id: number;
  description: string;
  version: number;
  is_published: boolean;
  is_active?: boolean; // Added to mark templates as Active or Obsolete
  created_by: number;
  created_at: string;
  updated_at?: string; // Added
}

export interface StepTemplate {
  id: number;
  template_id: number;
  ord: number;
  title: string;
  description: string;
  required: boolean;
  reviewer_role_id: number;
  created_at: string;
}

export type ProcessState =
  | "DRAFT"
  | "IN_PROGRESS"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "REJECTED"
  | "CLOSED"
  | "ARCHIVED"; // Added ARCHIVED state
export type StepStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "APPROVED"
  | "REJECTED"
  | "SKIPPED"
  | "CARGADO" // Added for loaded files
  | "OBSERVADO"; // Added for observations

export type NotificationType =
  | "INFO"
  | "REMINDER"
  | "APPROVAL_PENDING"
  | "RETURNED"
  | "SYSTEM";

export interface ProcessInstance {
  id: number;
  process_type_id: number;
  template_id: number;
  parent_instance_id?: number;
  year: number;
  month: number;
  state: ProcessState;
  responsible_user_id: number;
  title?: string;
  comment?: string;
  revised_at?: string;
  reviewed_by?: number;
  reversed_at?: string;
  due_at?: string;
  security_level?: string;
  archived: boolean;
  closing_type?: string;
  created_by: number;
  created_at: string;
  updated_at: string;
  closed_at?: string;
  tags?: string[]; // Added for TAG-001
  metadata?: Record<string, any>; // Added for extra metadata
}

export interface StepInstance {
  id: number;
  process_instance_id: number;
  step_template_id: number;
  title: string;
  status: StepStatus;
  comment?: string;
  reviewer_role_id: number;
  reviewed_by?: number;
  due_at?: string;
  created_at: string;
  updated_at: string;
  observation?: string; // Added for observations (DEC-001)
}

export interface File {
  id: number;
  step_instance_id: number;
  filename: string;
  version: number;
  name_type: string;
  size_bytes: number;
  storage_backend: string;
  sha256: string;
  uploaded_by: number;
  uploaded_at: string;
  version_comment?: string; // Added for VER-001
  replaced_file_id?: number; // Added to track previous version
}

export interface Notification {
  id: number;
  user_id: number;
  type: NotificationType;
  title: string;
  body: string;
  is_read: boolean;
  payload?: string;
  due_at?: string;
  process_instance_id?: number;
  step_instance_id?: number;
  created_at: string;
}

export interface AuditLog {
  id: number;
  user_id: number;
  action: string;
  entity_type: string;
  entity_id: number;
  details?: string;
  created_at: string;
  ip_address?: string; // Added for BTA-001
}

export interface ProcessProgress {
  process_instance_id: number;
  total_steps: number;
  completed_steps: number;
  progress_percent: number;
}

export interface SavedView {
  id: number;
  owner_user_id: number;
  name: string;
  filters: string;
  is_shared: boolean;
  created_at: string;
}

export interface ExportLog {
  id: number;
  user_id: number;
  file_url: string;
  size_bytes: number;
  created_at: string;
  filters?: string; // Added to track applied filters
  export_type?: string; // Added (CSV, XLSX, ZIP, PDF)
}

// New interfaces for additional functionality

export interface Tag {
  id: number;
  name: string;
  color?: string;
  created_by: number;
  created_at: string;
}

export interface ProcessTag {
  process_instance_id: number;
  tag_id: number;
  created_at: string;
}

export interface ArchiveOperation {
  id: number;
  user_id: number;
  date_from: string;
  date_to: string;
  total_processes: number;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  created_at: string;
  completed_at?: string;
}

export interface FileVersion {
  file_id: number;
  version: number;
  uploaded_by: number;
  uploaded_at: string;
  comment?: string;
  size_bytes: number;
}

export interface ProcessFilter {
  process_type_id?: number;
  year?: number;
  month?: number;
  responsible_user_id?: number;
  state?: ProcessState;
  tags?: string[];
  search_text?: string;
  date_from?: string;
  date_to?: string;
}