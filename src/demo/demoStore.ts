import { UserRoleEnum } from '../types';

type DemoProcessState = 'PENDIENTE' | 'COMPLETADO';
type DemoEntityType =
  | 'USER'
  | 'PROCESS_CATEGORY'
  | 'PROCESS_TYPE'
  | 'PROCESS_TEMPLATE'
  | 'PROCESS_INSTANCE'
  | 'STEP_INSTANCE'
  | 'FILE'
  | 'SESSION';
type DemoAuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'UPLOAD'
  | 'DOWNLOAD'
  | 'ASSIGN'
  | 'UNASSIGN'
  | 'COMPLETE'
  | 'ACTIVATE'
  | 'DEACTIVATE';
type DemoFolderType = 'category' | 'processType' | 'process' | 'step';

type DemoUser = {
  id: number;
  email: string;
  fullName: string;
  password: string;
  role: UserRoleEnum;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type DemoCategory = {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type DemoProcessType = {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  categoryId: number;
  createdAt: string;
  updatedAt: string;
};

type DemoTemplateStep = {
  id: number;
  templateId: number;
  order: number;
  name: string;
  description: string | null;
  responsibleRole?: string;
  dueDaysFromStart?: number;
  isMandatory: boolean;
  createdAt: string;
  updatedAt: string;
};

type DemoTemplate = {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  isLocked: boolean;
  processTypeId: number;
  createdAt: string;
  updatedAt: string;
  steps: DemoTemplateStep[];
};

type DemoStepSnapshot = {
  id: number;
  name: string;
  description: string | null;
  order: number;
  isMandatory: boolean;
};

type DemoProcessStep = {
  id: number;
  title: string;
  estado: DemoProcessState;
  comment: string | null;
  processInstanceId: number;
  templateStepId: number;
  dueAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  assignedToId: number | null;
  templateStep: DemoStepSnapshot;
};

type DemoProcess = {
  id: number;
  title: string;
  estado: DemoProcessState;
  processTypeId: number;
  templateId: number;
  responsibleUserId: number | null;
  year: number | null;
  month: number | null;
  comment: string | null;
  dueAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  steps: DemoProcessStep[];
};

type DemoFile = {
  id: number;
  stepId: number;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  version: number;
  uploadedAt: string;
  uploadedById: number | null;
  previewHtml: string;
  downloadText: string;
};

type DemoAuditLog = {
  id: number;
  action: DemoAuditAction;
  entityType: DemoEntityType;
  entityId: number | null;
  description: string;
  details: string | null;
  userId: number | null;
  ipAddress: string | null;
  createdAt: string;
};

type DemoState = {
  version: 1;
  users: DemoUser[];
  categories: DemoCategory[];
  processTypes: DemoProcessType[];
  templates: DemoTemplate[];
  processes: DemoProcess[];
  files: DemoFile[];
  auditLogs: DemoAuditLog[];
  nextIds: {
    user: number;
    category: number;
    processType: number;
    template: number;
    templateStep: number;
    process: number;
    processStep: number;
    file: number;
    auditLog: number;
  };
};

type DemoUserView = Omit<DemoUser, 'password'>;

const STORAGE_KEY = 'gestion-documental-demo::state::v2';
const DEFAULT_DELAY_MS = 120;
const DEMO_TOKEN_PREFIX = 'demo-token-';
const FALLBACK_IP = '127.0.0.1';

let cachedState: DemoState | null = null;

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export async function simulateRequest<T>(
  operation: () => T | Promise<T>,
  delayMs = DEFAULT_DELAY_MS,
): Promise<T> {
  await sleep(delayMs);
  return operation();
}

export function createApiError(message: string, status = 400): never {
  const error = new Error(message) as Error & {
    response: { status: number; data: { message: string } };
  };
  error.response = {
    status,
    data: { message },
  };
  throw error;
}

function deepClone<T>(value: T): T {
  if (value === null || value === undefined) {
    return value;
  }
  return JSON.parse(JSON.stringify(value)) as T;
}

function nowIso() {
  return new Date().toISOString();
}

function isoDaysAgo(days: number, extraHours = 0) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(9 + extraHours, 15, 0, 0);
  return date.toISOString();
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sanitizeUser(user: DemoUser): DemoUserView {
  const { password: _password, ...safeUser } = user;
  return safeUser;
}

function buildPreviewHtml(
  fileName: string,
  mimeType: string,
  sizeBytes: number,
  uploadedAt: string,
  body: string,
) {
  const uploadedLabel = new Date(uploadedAt).toLocaleString('es-EC');
  const sizeLabel =
    sizeBytes < 1024
      ? `${sizeBytes} B`
      : `${(sizeBytes / 1024).toFixed(1)} KB`;

  return [
    '<!doctype html>',
    '<html lang="es">',
    '<head>',
    '<meta charset="utf-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1" />',
    `<title>${escapeHtml(fileName)}</title>`,
    '<style>',
    'body{font-family:Segoe UI,Arial,sans-serif;background:#f5f7fb;color:#1f2937;margin:0;padding:32px;}',
    '.card{max-width:760px;margin:0 auto;background:#fff;border:1px solid #dbe3f0;border-radius:18px;padding:28px;box-shadow:0 16px 40px rgba(15,23,42,.08);}',
    'h1{margin:0 0 10px;font-size:28px;}',
    '.meta{display:flex;flex-wrap:wrap;gap:12px;margin-bottom:20px;color:#475569;font-size:14px;}',
    '.tag{background:#eef4ff;border:1px solid #c7d8ff;border-radius:999px;padding:6px 10px;}',
    'pre{white-space:pre-wrap;background:#0f172a;color:#e2e8f0;padding:18px;border-radius:14px;font-size:14px;line-height:1.55;}',
    '</style>',
    '</head>',
    '<body>',
    '<div class="card">',
    `<h1>${escapeHtml(fileName)}</h1>`,
    '<div class="meta">',
    `<span class="tag">Tipo: ${escapeHtml(mimeType || 'archivo/demo')}</span>`,
    `<span class="tag">Tamano: ${escapeHtml(sizeLabel)}</span>`,
    `<span class="tag">Subido: ${escapeHtml(uploadedLabel)}</span>`,
    '</div>',
    `<pre>${escapeHtml(body)}</pre>`,
    '</div>',
    '</body>',
    '</html>',
  ].join('');
}

function generateDownloadText(fileName: string, sizeBytes: number) {
  return [
    `Archivo demo: ${fileName}`,
    '',
    'Este repositorio funciona sin backend ni base de datos.',
    'Los archivos se simulan localmente para la demostracion del frontend.',
    '',
    `Tamano reportado: ${sizeBytes} bytes`,
    `Generado: ${new Date().toLocaleString('es-EC')}`,
  ].join('\n');
}

function createFileRecord(params: {
  id: number;
  stepId: number;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  version: number;
  uploadedAt: string;
  uploadedById: number | null;
  body?: string;
}): DemoFile {
  const body =
    params.body ??
    `Documento demo asociado a ${params.originalName}.\n\n` +
      'En esta version del proyecto la experiencia es frontend-only.';

  return {
    id: params.id,
    stepId: params.stepId,
    originalName: params.originalName,
    mimeType: params.mimeType || 'application/octet-stream',
    sizeBytes: params.sizeBytes,
    version: params.version,
    uploadedAt: params.uploadedAt,
    uploadedById: params.uploadedById,
    previewHtml: buildPreviewHtml(
      params.originalName,
      params.mimeType,
      params.sizeBytes,
      params.uploadedAt,
      body,
    ),
    downloadText: generateDownloadText(params.originalName, params.sizeBytes),
  };
}

function createInitialState(): DemoState {
  const users: DemoUser[] = [
    {
      id: 1,
      email: 'admin.demo@tuempresa.com',
      fullName: 'Ana Administradora',
      password: 'demo123',
      role: UserRoleEnum.ADMINISTRADOR,
      isActive: true,
      createdAt: isoDaysAgo(25),
      updatedAt: isoDaysAgo(2),
    },
    {
      id: 2,
      email: 'gestor.demo@tuempresa.com',
      fullName: 'Gabriel Gestor',
      password: 'demo123',
      role: UserRoleEnum.GESTOR,
      isActive: true,
      createdAt: isoDaysAgo(24),
      updatedAt: isoDaysAgo(3),
    },
    {
      id: 3,
      email: 'lector.demo@tuempresa.com',
      fullName: 'Laura Lectora',
      password: 'demo123',
      role: UserRoleEnum.LECTOR,
      isActive: true,
      createdAt: isoDaysAgo(23),
      updatedAt: isoDaysAgo(4),
    },
    {
      id: 4,
      email: 'ayudante.demo@tuempresa.com',
      fullName: 'Andrés Ayudante',
      password: 'demo123',
      role: UserRoleEnum.AYUDANTE,
      isActive: true,
      createdAt: isoDaysAgo(22),
      updatedAt: isoDaysAgo(5),
    },
  ];

  const categories: DemoCategory[] = [
    {
      id: 1,
      name: 'Contratos',
      description: 'Procesos legales y documentacion contractual con clientes y proveedores.',
      isActive: true,
      createdAt: isoDaysAgo(40),
      updatedAt: isoDaysAgo(10),
    },
    {
      id: 2,
      name: 'Recursos Humanos',
      description: 'Documentacion operativa del ciclo de vida del empleado.',
      isActive: true,
      createdAt: isoDaysAgo(39),
      updatedAt: isoDaysAgo(12),
    },
    {
      id: 3,
      name: 'Finanzas',
      description: 'Respaldos y reportes del area financiera y contable.',
      isActive: true,
      createdAt: isoDaysAgo(38),
      updatedAt: isoDaysAgo(9),
    },
  ];

  const processTypes: DemoProcessType[] = [
    {
      id: 1,
      name: 'Revision de Contratos',
      description: 'Flujo de revision legal y aprobacion de contratos.',
      isActive: true,
      categoryId: 1,
      createdAt: isoDaysAgo(35),
      updatedAt: isoDaysAgo(8),
    },
    {
      id: 2,
      name: 'Onboarding de Empleados',
      description: 'Incorporacion y documentacion de nuevos colaboradores.',
      isActive: true,
      categoryId: 2,
      createdAt: isoDaysAgo(34),
      updatedAt: isoDaysAgo(8),
    },
    {
      id: 3,
      name: 'Cierre Contable Mensual',
      description: 'Consolidacion de reportes y soportes del cierre financiero.',
      isActive: true,
      categoryId: 3,
      createdAt: isoDaysAgo(33),
      updatedAt: isoDaysAgo(6),
    },
  ];

  const templates: DemoTemplate[] = [
    {
      id: 1,
      name: 'Revision de Contratos 2026',
      description: 'Plantilla base para la revision legal y aprobacion de contratos.',
      isActive: true,
      isLocked: false,
      processTypeId: 1,
      createdAt: isoDaysAgo(20),
      updatedAt: isoDaysAgo(5),
      steps: [
        {
          id: 1,
          templateId: 1,
          order: 1,
          name: 'Revision legal inicial',
          description: 'Analisis de clausulas y riesgos por el area legal.',
          isMandatory: true,
          createdAt: isoDaysAgo(20),
          updatedAt: isoDaysAgo(5),
        },
        {
          id: 2,
          templateId: 1,
          order: 2,
          name: 'Documentacion de soporte',
          description: 'Anexar documentos del proveedor y propuestas comerciales.',
          isMandatory: true,
          createdAt: isoDaysAgo(20),
          updatedAt: isoDaysAgo(5),
        },
        {
          id: 3,
          templateId: 1,
          order: 3,
          name: 'Aprobacion final',
          description: 'Firma y cierre del expediente contractual.',
          isMandatory: true,
          createdAt: isoDaysAgo(20),
          updatedAt: isoDaysAgo(5),
        },
      ],
    },
    {
      id: 2,
      name: 'Onboarding de Empleados',
      description: 'Flujo de incorporacion y documentacion de nuevos colaboradores.',
      isActive: true,
      isLocked: true,
      processTypeId: 2,
      createdAt: isoDaysAgo(18),
      updatedAt: isoDaysAgo(4),
      steps: [
        {
          id: 4,
          templateId: 2,
          order: 1,
          name: 'Contrato firmado',
          description: 'Contrato laboral firmado por el colaborador.',
          isMandatory: true,
          createdAt: isoDaysAgo(18),
          updatedAt: isoDaysAgo(4),
        },
        {
          id: 5,
          templateId: 2,
          order: 2,
          name: 'Validacion de RRHH',
          description: 'Verificacion documental por Recursos Humanos.',
          isMandatory: true,
          createdAt: isoDaysAgo(18),
          updatedAt: isoDaysAgo(4),
        },
      ],
    },
    {
      id: 3,
      name: 'Cierre Contable Mensual',
      description: 'Plantilla para consolidar el cierre financiero del mes.',
      isActive: true,
      isLocked: false,
      processTypeId: 3,
      createdAt: isoDaysAgo(16),
      updatedAt: isoDaysAgo(3),
      steps: [
        {
          id: 6,
          templateId: 3,
          order: 1,
          name: 'Balance preliminar',
          description: 'Balance general preliminar del periodo.',
          isMandatory: true,
          createdAt: isoDaysAgo(16),
          updatedAt: isoDaysAgo(3),
        },
        {
          id: 7,
          templateId: 3,
          order: 2,
          name: 'Soportes y comprobantes',
          description: 'Comprobantes, facturas y conciliaciones bancarias.',
          isMandatory: false,
          createdAt: isoDaysAgo(16),
          updatedAt: isoDaysAgo(3),
        },
        {
          id: 8,
          templateId: 3,
          order: 3,
          name: 'Informe financiero final',
          description: 'Informe consolidado firmado por el CFO.',
          isMandatory: true,
          createdAt: isoDaysAgo(16),
          updatedAt: isoDaysAgo(3),
        },
      ],
    },
  ];

  const processes: DemoProcess[] = [
    {
      id: 1,
      title: 'Revision de Contrato - Proveedor Alpha',
      estado: 'PENDIENTE',
      processTypeId: 1,
      templateId: 1,
      responsibleUserId: 2,
      year: 2026,
      month: 4,
      comment: 'Pendiente aprobacion final.',
      dueAt: isoDaysAgo(-4),
      completedAt: null,
      createdAt: isoDaysAgo(9),
      updatedAt: isoDaysAgo(1),
      steps: [
        {
          id: 1,
          title: 'Revision legal inicial',
          estado: 'COMPLETADO',
          comment: 'Revision legal validada.',
          processInstanceId: 1,
          templateStepId: 1,
          dueAt: isoDaysAgo(7),
          completedAt: isoDaysAgo(6),
          createdAt: isoDaysAgo(9),
          updatedAt: isoDaysAgo(6),
          assignedToId: 4,
          templateStep: {
            id: 1,
            name: 'Revision legal inicial',
            description: 'Analisis de clausulas y riesgos por el area legal.',
            order: 1,
            isMandatory: true,
          },
        },
        {
          id: 2,
          title: 'Documentacion de soporte',
          estado: 'COMPLETADO',
          comment: 'Se anexaron propuestas y RUC del proveedor.',
          processInstanceId: 1,
          templateStepId: 2,
          dueAt: isoDaysAgo(4),
          completedAt: isoDaysAgo(2),
          createdAt: isoDaysAgo(9),
          updatedAt: isoDaysAgo(2),
          assignedToId: 4,
          templateStep: {
            id: 2,
            name: 'Documentacion de soporte',
            description: 'Anexar documentos del proveedor y propuestas comerciales.',
            order: 2,
            isMandatory: true,
          },
        },
        {
          id: 3,
          title: 'Aprobacion final',
          estado: 'PENDIENTE',
          comment: null,
          processInstanceId: 1,
          templateStepId: 3,
          dueAt: isoDaysAgo(-2),
          completedAt: null,
          createdAt: isoDaysAgo(9),
          updatedAt: isoDaysAgo(1),
          assignedToId: 1,
          templateStep: {
            id: 3,
            name: 'Aprobacion final',
            description: 'Firma y cierre del expediente contractual.',
            order: 3,
            isMandatory: true,
          },
        },
      ],
    },
    {
      id: 2,
      title: 'Onboarding Q1 2026 - Desarrollador Senior',
      estado: 'COMPLETADO',
      processTypeId: 2,
      templateId: 2,
      responsibleUserId: 2,
      year: 2026,
      month: 3,
      comment: 'Proceso cerrado para la demo.',
      dueAt: isoDaysAgo(10),
      completedAt: isoDaysAgo(6),
      createdAt: isoDaysAgo(14),
      updatedAt: isoDaysAgo(6),
      steps: [
        {
          id: 4,
          title: 'Contrato firmado',
          estado: 'COMPLETADO',
          comment: 'Contrato firmado por el colaborador.',
          processInstanceId: 2,
          templateStepId: 4,
          dueAt: isoDaysAgo(12),
          completedAt: isoDaysAgo(11),
          createdAt: isoDaysAgo(14),
          updatedAt: isoDaysAgo(11),
          assignedToId: 2,
          templateStep: {
            id: 4,
            name: 'Contrato firmado',
            description: 'Contrato laboral firmado por el colaborador.',
            order: 1,
            isMandatory: true,
          },
        },
        {
          id: 5,
          title: 'Validacion de RRHH',
          estado: 'COMPLETADO',
          comment: 'Aprobado por Recursos Humanos.',
          processInstanceId: 2,
          templateStepId: 5,
          dueAt: isoDaysAgo(8),
          completedAt: isoDaysAgo(6),
          createdAt: isoDaysAgo(14),
          updatedAt: isoDaysAgo(6),
          assignedToId: 1,
          templateStep: {
            id: 5,
            name: 'Validacion de RRHH',
            description: 'Verificacion documental por Recursos Humanos.',
            order: 2,
            isMandatory: true,
          },
        },
      ],
    },
    {
      id: 3,
      title: 'Cierre Contable - Marzo 2026',
      estado: 'PENDIENTE',
      processTypeId: 3,
      templateId: 3,
      responsibleUserId: 4,
      year: 2026,
      month: 3,
      comment: 'Pendiente consolidacion del informe financiero.',
      dueAt: isoDaysAgo(-6),
      completedAt: null,
      createdAt: isoDaysAgo(12),
      updatedAt: isoDaysAgo(1),
      steps: [
        {
          id: 6,
          title: 'Balance preliminar',
          estado: 'COMPLETADO',
          comment: 'Balance preliminar aprobado.',
          processInstanceId: 3,
          templateStepId: 6,
          dueAt: isoDaysAgo(11),
          completedAt: isoDaysAgo(10),
          createdAt: isoDaysAgo(12),
          updatedAt: isoDaysAgo(10),
          assignedToId: 4,
          templateStep: {
            id: 6,
            name: 'Balance preliminar',
            description: 'Balance general preliminar del periodo.',
            order: 1,
            isMandatory: true,
          },
        },
        {
          id: 7,
          title: 'Soportes y comprobantes',
          estado: 'PENDIENTE',
          comment: null,
          processInstanceId: 3,
          templateStepId: 7,
          dueAt: isoDaysAgo(-1),
          completedAt: null,
          createdAt: isoDaysAgo(12),
          updatedAt: isoDaysAgo(1),
          assignedToId: 4,
          templateStep: {
            id: 7,
            name: 'Soportes y comprobantes',
            description: 'Comprobantes, facturas y conciliaciones bancarias.',
            order: 2,
            isMandatory: false,
          },
        },
        {
          id: 8,
          title: 'Informe financiero final',
          estado: 'PENDIENTE',
          comment: null,
          processInstanceId: 3,
          templateStepId: 8,
          dueAt: isoDaysAgo(-4),
          completedAt: null,
          createdAt: isoDaysAgo(12),
          updatedAt: isoDaysAgo(1),
          assignedToId: 2,
          templateStep: {
            id: 8,
            name: 'Informe financiero final',
            description: 'Informe consolidado firmado por el CFO.',
            order: 3,
            isMandatory: true,
          },
        },
      ],
    },
  ];

  const files: DemoFile[] = [
    createFileRecord({
      id: 1,
      stepId: 1,
      originalName: 'revision_legal_proveedor_alpha.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 184320,
      version: 1,
      uploadedAt: isoDaysAgo(6),
      uploadedById: 4,
      body:
        'Documento demo de revision legal del contrato con Proveedor Alpha.\n\n' +
        'Incluye analisis de clausulas, riesgos y recomendaciones.',
    }),
    createFileRecord({
      id: 2,
      stepId: 2,
      originalName: 'soportes_contrato_alpha.zip',
      mimeType: 'application/zip',
      sizeBytes: 524288,
      version: 1,
      uploadedAt: isoDaysAgo(2),
      uploadedById: 4,
      body:
        'Paquete demo con documentacion de soporte: propuesta comercial, RUC y certificados del proveedor.',
    }),
    createFileRecord({
      id: 3,
      stepId: 4,
      originalName: 'contrato_onboarding_q1_2026.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 143360,
      version: 1,
      uploadedAt: isoDaysAgo(11),
      uploadedById: 2,
      body:
        'Contrato laboral firmado para onboarding Q1 2026.\n\nDocumento generado para la demo.',
    }),
    createFileRecord({
      id: 4,
      stepId: 5,
      originalName: 'validacion_rrhh.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 102400,
      version: 1,
      uploadedAt: isoDaysAgo(6),
      uploadedById: 1,
      body: 'Constancia demo de validacion por Recursos Humanos.',
    }),
    createFileRecord({
      id: 5,
      stepId: 6,
      originalName: 'balance_preliminar_marzo_2026.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 153600,
      version: 1,
      uploadedAt: isoDaysAgo(10),
      uploadedById: 4,
      body: 'Balance preliminar demo del cierre contable de marzo 2026.',
    }),
  ];

  const auditLogs: DemoAuditLog[] = [
    {
      id: 1,
      action: 'LOGIN',
      entityType: 'SESSION',
      entityId: null,
      description: 'Inicio de sesion del administrador demo',
      details: JSON.stringify({ email: 'admin.demo@tuempresa.com' }),
      userId: 1,
      ipAddress: FALLBACK_IP,
      createdAt: isoDaysAgo(1, 1),
    },
    {
      id: 2,
      action: 'UPLOAD',
      entityType: 'FILE',
      entityId: 2,
      description: 'Se cargaron soportes del contrato con Proveedor Alpha',
      details: JSON.stringify({ processId: 1, stepId: 2 }),
      userId: 4,
      ipAddress: FALLBACK_IP,
      createdAt: isoDaysAgo(2, 2),
    },
    {
      id: 3,
      action: 'COMPLETE',
      entityType: 'STEP_INSTANCE',
      entityId: 5,
      description: 'Se completo la validacion de RRHH del onboarding',
      details: JSON.stringify({ processId: 2 }),
      userId: 1,
      ipAddress: FALLBACK_IP,
      createdAt: isoDaysAgo(6, 3),
    },
    {
      id: 4,
      action: 'CREATE',
      entityType: 'PROCESS_INSTANCE',
      entityId: 3,
      description: 'Se creo el expediente de Cierre Contable - Marzo 2026',
      details: JSON.stringify({ templateId: 3, responsibleUserId: 4 }),
      userId: 2,
      ipAddress: FALLBACK_IP,
      createdAt: isoDaysAgo(12, 4),
    },
  ];

  return {
    version: 1,
    users,
    categories,
    processTypes,
    templates,
    processes,
    files,
    auditLogs,
    nextIds: {
      user: 5,
      category: 4,
      processType: 4,
      template: 4,
      templateStep: 9,
      process: 4,
      processStep: 9,
      file: 6,
      auditLog: 5,
    },
  };
}

function ensureBrowserStorage() {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    createApiError('El modo demo solo esta disponible en el navegador.', 500);
  }
}

function getState(): DemoState {
  if (cachedState) {
    return cachedState;
  }

  ensureBrowserStorage();
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    cachedState = createInitialState();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cachedState));
    return cachedState;
  }

  try {
    cachedState = JSON.parse(raw) as DemoState;
  } catch {
    cachedState = createInitialState();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cachedState));
  }

  return cachedState;
}

function persistState(state: DemoState) {
  cachedState = state;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function readState<T>(reader: (state: DemoState) => T): T {
  return deepClone(reader(getState()));
}

function mutateState<T>(mutator: (state: DemoState) => T): T {
  const state = getState();
  const result = mutator(state);
  persistState(state);
  return deepClone(result);
}

function nextId(state: DemoState, key: keyof DemoState['nextIds']) {
  const value = state.nextIds[key];
  state.nextIds[key] += 1;
  return value;
}

function getUserFromState(state: DemoState, userId: number | null | undefined) {
  if (!userId) {
    return null;
  }
  return state.users.find((user) => user.id === userId) ?? null;
}

function getCurrentToken() {
  if (typeof window === 'undefined') {
    return null;
  }
  return window.localStorage.getItem('auth_token');
}

function getUserIdFromToken(token: string | null) {
  if (!token || !token.startsWith(DEMO_TOKEN_PREFIX)) {
    return null;
  }

  const rawId = Number(token.replace(DEMO_TOKEN_PREFIX, ''));
  return Number.isFinite(rawId) ? rawId : null;
}

function getCurrentUserId() {
  return getUserIdFromToken(getCurrentToken());
}

function addAuditLog(
  state: DemoState,
  input: {
    action: DemoAuditAction;
    entityType: DemoEntityType;
    entityId: number | null;
    description: string;
    details?: Record<string, unknown> | null;
    userId?: number | null;
  },
) {
  state.auditLogs.unshift({
    id: nextId(state, 'auditLog'),
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    description: input.description,
    details: input.details ? JSON.stringify(input.details) : null,
    userId: input.userId ?? getCurrentUserId(),
    ipAddress: FALLBACK_IP,
    createdAt: nowIso(),
  });
}

function enrichCategory(state: DemoState, category: DemoCategory) {
  return {
    ...category,
    _count: {
      processTypes: state.processTypes.filter(
        (processType) => processType.categoryId === category.id,
      ).length,
    },
  };
}

function enrichProcessType(state: DemoState, processType: DemoProcessType) {
  const category = state.categories.find(
    (item) => item.id === processType.categoryId,
  );

  return {
    ...processType,
    category: category ? enrichCategory(state, category) : null,
    _count: {
      templates: state.templates.filter(
        (template) => template.processTypeId === processType.id,
      ).length,
    },
  };
}

function enrichTemplate(state: DemoState, template: DemoTemplate) {
  return {
    ...template,
    processType: enrichProcessType(
      state,
      state.processTypes.find((item) => item.id === template.processTypeId) ??
        createApiError('Tipo de proceso no encontrado.', 404),
    ),
    steps: [...template.steps].sort((a, b) => a.order - b.order),
  };
}

function enrichProcessStep(state: DemoState, step: DemoProcessStep) {
  const assignedTo = getUserFromState(state, step.assignedToId);
  return {
    ...step,
    assignedToId: step.assignedToId,
    assignedTo: assignedTo
      ? {
          id: assignedTo.id,
          fullName: assignedTo.fullName,
          email: assignedTo.email,
        }
      : null,
    templateStep: { ...step.templateStep },
  };
}

function recalculateProcessState(process: DemoProcess) {
  const requiredSteps = process.steps.filter(
    (step) => step.templateStep.isMandatory !== false,
  );
  const allRequiredComplete = requiredSteps.every(
    (step) => step.estado === 'COMPLETADO',
  );

  process.estado = allRequiredComplete ? 'COMPLETADO' : 'PENDIENTE';
  process.completedAt = allRequiredComplete ? process.completedAt ?? nowIso() : null;
  process.updatedAt = nowIso();
}

function enrichProcess(state: DemoState, process: DemoProcess) {
  const responsibleUser = getUserFromState(state, process.responsibleUserId);
  const processType = state.processTypes.find(
    (item) => item.id === process.processTypeId,
  );
  const template = state.templates.find((item) => item.id === process.templateId);

  return {
    ...process,
    responsibleUser: responsibleUser
      ? {
          id: responsibleUser.id,
          fullName: responsibleUser.fullName,
          email: responsibleUser.email,
        }
      : null,
    processType: processType ? enrichProcessType(state, processType) : undefined,
    template: template
      ? {
          id: template.id,
          name: template.name,
          description: template.description,
          isActive: template.isActive,
          isLocked: template.isLocked,
          processTypeId: template.processTypeId,
          createdAt: template.createdAt,
          updatedAt: template.updatedAt,
        }
      : undefined,
    steps: [...process.steps]
      .sort((a, b) => a.templateStep.order - b.templateStep.order)
      .map((step) => enrichProcessStep(state, step)),
  };
}

function enrichFile(state: DemoState, file: DemoFile) {
  const uploadedBy = getUserFromState(state, file.uploadedById);
  return {
    id: file.id,
    stepId: file.stepId,
    originalName: file.originalName,
    mimeType: file.mimeType,
    sizeBytes: file.sizeBytes,
    version: file.version,
    uploadedAt: file.uploadedAt,
    uploadedById: file.uploadedById,
    uploadedBy: uploadedBy
      ? {
          id: uploadedBy.id,
          fullName: uploadedBy.fullName,
          email: uploadedBy.email,
        }
      : null,
  };
}

function buildProcessFromTemplate(
  state: DemoState,
  input: {
    processTypeId: number;
    templateId: number;
    title: string;
    comment?: string;
    year?: number;
    month?: number;
    dueAt?: string;
    responsibleUserId?: number | null;
  },
) {
  const template = state.templates.find((item) => item.id === input.templateId);
  if (!template) {
    createApiError('La plantilla seleccionada no existe.', 404);
  }

  const processType = state.processTypes.find(
    (item) => item.id === input.processTypeId,
  );
  if (!processType) {
    createApiError('El tipo de proceso seleccionado no existe.', 404);
  }

  const createdAt = nowIso();
  const processId = nextId(state, 'process');
  const steps: DemoProcessStep[] = template.steps
    .sort((a, b) => a.order - b.order)
    .map((stepTemplate) => ({
      id: nextId(state, 'processStep'),
      title: stepTemplate.name,
      estado: 'PENDIENTE',
      comment: null,
      processInstanceId: processId,
      templateStepId: stepTemplate.id,
      dueAt: input.dueAt ?? null,
      completedAt: null,
      createdAt,
      updatedAt: createdAt,
      assignedToId: input.responsibleUserId ?? null,
      templateStep: {
        id: stepTemplate.id,
        name: stepTemplate.name,
        description: stepTemplate.description,
        order: stepTemplate.order,
        isMandatory: stepTemplate.isMandatory,
      },
    }));

  const process: DemoProcess = {
    id: processId,
    title: input.title,
    estado: 'PENDIENTE',
    processTypeId: input.processTypeId,
    templateId: input.templateId,
    responsibleUserId: input.responsibleUserId ?? null,
    year: input.year ?? new Date().getFullYear(),
    month: input.month ?? new Date().getMonth() + 1,
    comment: input.comment ?? null,
    dueAt: input.dueAt ?? null,
    completedAt: null,
    createdAt,
    updatedAt: createdAt,
    steps,
  };

  recalculateProcessState(process);
  state.processes.unshift(process);
  return process;
}

function buildArchiveTextForProcess(state: DemoState, process: DemoProcess) {
  const processView = enrichProcess(state, process);
  const stepLines = processView.steps.map((step) => {
    const files = state.files.filter((file) => file.stepId === step.id);
    const fileList = files.length
      ? files.map((file) => `    - ${file.originalName}`).join('\n')
      : '    - Sin archivos';
    return [
      `  * ${step.title} (${step.estado})`,
      `    Responsable: ${step.assignedTo?.fullName ?? 'Sin asignar'}`,
      `    Archivos:`,
      fileList,
    ].join('\n');
  });

  return [
    `Expediente demo: ${processView.title}`,
    `Estado: ${processView.estado}`,
    `Tipo: ${processView.processType?.name ?? 'Sin tipo'}`,
    `Responsable: ${processView.responsibleUser?.fullName ?? 'Sin asignar'}`,
    `Periodo: ${processView.year ?? '-'} / ${processView.month ?? '-'}`,
    '',
    'Pasos',
    ...stepLines,
  ].join('\n');
}

function getFolderSummary(state: DemoState, type: DemoFolderType, id: number) {
  switch (type) {
    case 'category': {
      const category = state.categories.find((item) => item.id === id);
      if (!category) {
        createApiError('Categoria no encontrada.', 404);
      }
      const types = state.processTypes.filter(
        (processType) => processType.categoryId === category.id,
      );
      return {
        fileName: `categoria_${category.name.replace(/\s+/g, '_')}.zip`,
        body: [
          `Carpeta demo: ${category.name}`,
          '',
          'Tipos de proceso',
          ...types.map((processType) => `- ${processType.name}`),
        ].join('\n'),
      };
    }
    case 'processType': {
      const processType = state.processTypes.find((item) => item.id === id);
      if (!processType) {
        createApiError('Tipo de proceso no encontrado.', 404);
      }
      const processes = state.processes.filter(
        (process) => process.processTypeId === processType.id,
      );
      return {
        fileName: `tipo_${processType.name.replace(/\s+/g, '_')}.zip`,
        body: [
          `Carpeta demo: ${processType.name}`,
          '',
          'Procesos',
          ...processes.map((process) => `- ${process.title}`),
        ].join('\n'),
      };
    }
    case 'process': {
      const process = state.processes.find((item) => item.id === id);
      if (!process) {
        createApiError('Proceso no encontrado.', 404);
      }
      return {
        fileName: `proceso_${process.title.replace(/\s+/g, '_')}.zip`,
        body: buildArchiveTextForProcess(state, process),
      };
    }
    case 'step': {
      const process = state.processes.find((item) =>
        item.steps.some((step) => step.id === id),
      );
      const step = process?.steps.find((item) => item.id === id);
      if (!step) {
        createApiError('Paso no encontrado.', 404);
      }
      const files = state.files.filter((file) => file.stepId === step.id);
      return {
        fileName: `paso_${step.title.replace(/\s+/g, '_')}.zip`,
        body: [
          `Paso demo: ${step.title}`,
          `Proceso: ${process?.title ?? 'Sin proceso'}`,
          '',
          'Archivos',
          ...(files.length
            ? files.map((file) => `- ${file.originalName}`)
            : ['- Sin archivos']),
        ].join('\n'),
      };
    }
    default:
      createApiError('Tipo de carpeta no soportado.', 400);
  }
}

export function getDemoAccounts() {
  return [
    {
      label: 'Administrador',
      email: 'admin.demo@tuempresa.com',
      password: 'demo123',
    },
    {
      label: 'Gestor',
      email: 'gestor.demo@tuempresa.com',
      password: 'demo123',
    },
    {
      label: 'Lector',
      email: 'lector.demo@tuempresa.com',
      password: 'demo123',
    },
  ];
}

export function loginDemoUser(email: string, password: string) {
  const state = getState();
  const user = state.users.find(
    (item) => item.email.toLowerCase() === email.trim().toLowerCase(),
  );

  if (!user || user.password !== password) {
    createApiError('Credenciales invalidas.', 401);
  }

  if (!user.isActive) {
    createApiError('El usuario esta inactivo.', 403);
  }

  addAuditLog(state, {
    action: 'LOGIN',
    entityType: 'SESSION',
    entityId: null,
    description: `Inicio de sesion de ${user.fullName}`,
    details: { email: user.email },
    userId: user.id,
  });
  persistState(state);

  return {
    access_token: `${DEMO_TOKEN_PREFIX}${user.id}`,
    user: sanitizeUser(user),
  };
}

export function getDemoUserFromToken(token: string | null) {
  const userId = getUserIdFromToken(token);
  if (!userId) {
    createApiError('Sesion demo expirada.', 401);
  }

  const state = getState();
  const user = state.users.find((item) => item.id === userId);
  if (!user) {
    createApiError('Usuario no encontrado.', 404);
  }

  if (!user.isActive) {
    createApiError('El usuario esta inactivo.', 403);
  }

  return sanitizeUser(user);
}

export function registerDemoUser(input: {
  email: string;
  password: string;
  fullName: string;
  role?: UserRoleEnum;
}) {
  return mutateState((state) => {
    const normalizedEmail = input.email.trim().toLowerCase();
    if (state.users.some((user) => user.email.toLowerCase() === normalizedEmail)) {
      createApiError('Este email ya esta registrado.', 409);
    }

    const createdAt = nowIso();
    const newUser: DemoUser = {
      id: nextId(state, 'user'),
      email: normalizedEmail,
      fullName: input.fullName.trim(),
      password: input.password,
      role: input.role ?? UserRoleEnum.LECTOR,
      isActive: true,
      createdAt,
      updatedAt: createdAt,
    };

    state.users.unshift(newUser);
    addAuditLog(state, {
      action: 'CREATE',
      entityType: 'USER',
      entityId: newUser.id,
      description: `Se registro el usuario ${newUser.fullName}`,
      details: { email: newUser.email, role: newUser.role },
      userId: newUser.id,
    });

    return sanitizeUser(newUser);
  });
}

export function getDemoUsers() {
  return readState((state) =>
    [...state.users]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((user) => sanitizeUser(user)),
  );
}

export function createDemoUser(input: {
  email: string;
  fullName: string;
  password?: string;
  role: UserRoleEnum;
}) {
  return mutateState((state) => {
    const normalizedEmail = input.email.trim().toLowerCase();
    if (state.users.some((user) => user.email.toLowerCase() === normalizedEmail)) {
      createApiError('Ya existe un usuario con ese email.', 409);
    }

    const createdAt = nowIso();
    const newUser: DemoUser = {
      id: nextId(state, 'user'),
      email: normalizedEmail,
      fullName: input.fullName.trim(),
      password: input.password || 'demo123',
      role: input.role,
      isActive: true,
      createdAt,
      updatedAt: createdAt,
    };

    state.users.unshift(newUser);
    addAuditLog(state, {
      action: 'CREATE',
      entityType: 'USER',
      entityId: newUser.id,
      description: `Se creo el usuario ${newUser.fullName}`,
      details: { role: newUser.role },
    });

    return sanitizeUser(newUser);
  });
}

export function updateDemoUser(
  id: number,
  input: {
    email?: string;
    fullName?: string;
    password?: string;
    role?: UserRoleEnum;
    isActive?: boolean;
  },
) {
  return mutateState((state) => {
    const user = state.users.find((item) => item.id === id);
    if (!user) {
      createApiError('Usuario no encontrado.', 404);
    }

    if (input.email) {
      const normalizedEmail = input.email.trim().toLowerCase();
      const emailInUse = state.users.some(
        (candidate) =>
          candidate.id !== id && candidate.email.toLowerCase() === normalizedEmail,
      );
      if (emailInUse) {
        createApiError('Este email ya esta en uso por otro usuario.', 409);
      }
      user.email = normalizedEmail;
    }

    if (input.fullName !== undefined) {
      user.fullName = input.fullName.trim();
    }
    if (input.password) {
      user.password = input.password;
    }
    if (input.role) {
      user.role = input.role;
    }
    if (typeof input.isActive === 'boolean') {
      user.isActive = input.isActive;
    }
    user.updatedAt = nowIso();

    addAuditLog(state, {
      action: 'UPDATE',
      entityType: 'USER',
      entityId: user.id,
      description: `Se actualizo el usuario ${user.fullName}`,
      details: input,
    });

    return sanitizeUser(user);
  });
}

export function changeDemoUserRole(id: number, role: UserRoleEnum) {
  return mutateState((state) => {
    const user = state.users.find((item) => item.id === id);
    if (!user) {
      createApiError('Usuario no encontrado.', 404);
    }

    user.role = role;
    user.updatedAt = nowIso();
    addAuditLog(state, {
      action: 'UPDATE',
      entityType: 'USER',
      entityId: user.id,
      description: `Se actualizo el rol de ${user.fullName}`,
      details: { role },
    });

    return sanitizeUser(user);
  });
}

export function deleteDemoUser(id: number) {
  mutateState((state) => {
    const userIndex = state.users.findIndex((item) => item.id === id);
    if (userIndex === -1) {
      createApiError('Usuario no encontrado.', 404);
    }

    const [deletedUser] = state.users.splice(userIndex, 1);
    addAuditLog(state, {
      action: 'DELETE',
      entityType: 'USER',
      entityId: deletedUser.id,
      description: `Se elimino el usuario ${deletedUser.fullName}`,
    });
  });
}

export function getDemoCategories() {
  return readState((state) =>
    state.categories
      .map((category) => enrichCategory(state, category))
      .sort((a, b) => a.name.localeCompare(b.name)),
  );
}

export function createDemoCategory(input: { name: string; description?: string }) {
  return mutateState((state) => {
    const createdAt = nowIso();
    const category: DemoCategory = {
      id: nextId(state, 'category'),
      name: input.name.trim(),
      description: input.description?.trim() || null,
      isActive: true,
      createdAt,
      updatedAt: createdAt,
    };

    state.categories.push(category);
    addAuditLog(state, {
      action: 'CREATE',
      entityType: 'PROCESS_CATEGORY',
      entityId: category.id,
      description: `Se creo la categoria ${category.name}`,
    });

    return enrichCategory(state, category);
  });
}

export function updateDemoCategory(
  id: number,
  input: { name?: string; description?: string; isActive?: boolean },
) {
  return mutateState((state) => {
    const category = state.categories.find((item) => item.id === id);
    if (!category) {
      createApiError('Categoria no encontrada.', 404);
    }

    if (input.name !== undefined) {
      category.name = input.name.trim();
    }
    if (input.description !== undefined) {
      category.description = input.description?.trim() || null;
    }
    if (typeof input.isActive === 'boolean') {
      category.isActive = input.isActive;
    }
    category.updatedAt = nowIso();

    addAuditLog(state, {
      action: 'UPDATE',
      entityType: 'PROCESS_CATEGORY',
      entityId: category.id,
      description: `Se actualizo la categoria ${category.name}`,
      details: input,
    });

    return enrichCategory(state, category);
  });
}

export function deleteDemoCategory(id: number) {
  mutateState((state) => {
    const category = state.categories.find((item) => item.id === id);
    if (!category) {
      createApiError('Categoria no encontrada.', 404);
    }

    const hasTypes = state.processTypes.some(
      (processType) => processType.categoryId === id,
    );
    if (hasTypes) {
      createApiError(
        'No se puede eliminar una categoria que tiene tipos de proceso asociados.',
        409,
      );
    }

    state.categories = state.categories.filter((item) => item.id !== id);
    addAuditLog(state, {
      action: 'DELETE',
      entityType: 'PROCESS_CATEGORY',
      entityId: id,
      description: `Se elimino la categoria ${category.name}`,
    });
  });
}

export function getDemoProcessTypes() {
  return readState((state) =>
    state.processTypes
      .map((processType) => enrichProcessType(state, processType))
      .sort((a, b) => a.name.localeCompare(b.name)),
  );
}

export function createDemoProcessType(input: {
  name: string;
  description: string;
  categoryId: number;
  isActive: boolean;
}) {
  return mutateState((state) => {
    const category = state.categories.find((item) => item.id === input.categoryId);
    if (!category) {
      createApiError('La categoria seleccionada no existe.', 404);
    }

    const createdAt = nowIso();
    const processType: DemoProcessType = {
      id: nextId(state, 'processType'),
      name: input.name.trim(),
      description: input.description.trim(),
      categoryId: input.categoryId,
      isActive: input.isActive,
      createdAt,
      updatedAt: createdAt,
    };

    state.processTypes.unshift(processType);
    addAuditLog(state, {
      action: 'CREATE',
      entityType: 'PROCESS_TYPE',
      entityId: processType.id,
      description: `Se creo el tipo de proceso ${processType.name}`,
      details: { categoryId: processType.categoryId },
    });

    return enrichProcessType(state, processType);
  });
}

export function updateDemoProcessType(
  id: number,
  input: {
    name?: string;
    description?: string;
    categoryId?: number;
    isActive?: boolean;
  },
) {
  return mutateState((state) => {
    const processType = state.processTypes.find((item) => item.id === id);
    if (!processType) {
      createApiError('Tipo de proceso no encontrado.', 404);
    }

    if (input.categoryId !== undefined) {
      const category = state.categories.find((item) => item.id === input.categoryId);
      if (!category) {
        createApiError('La categoria seleccionada no existe.', 404);
      }
      processType.categoryId = input.categoryId;
    }
    if (input.name !== undefined) {
      processType.name = input.name.trim();
    }
    if (input.description !== undefined) {
      processType.description = input.description.trim();
    }
    if (typeof input.isActive === 'boolean') {
      processType.isActive = input.isActive;
    }
    processType.updatedAt = nowIso();

    addAuditLog(state, {
      action: 'UPDATE',
      entityType: 'PROCESS_TYPE',
      entityId: processType.id,
      description: `Se actualizo el tipo de proceso ${processType.name}`,
      details: input,
    });

    return enrichProcessType(state, processType);
  });
}

export function deleteDemoProcessType(id: number) {
  mutateState((state) => {
    const processType = state.processTypes.find((item) => item.id === id);
    if (!processType) {
      createApiError('Tipo de proceso no encontrado.', 404);
    }

    const hasTemplates = state.templates.some(
      (template) => template.processTypeId === id,
    );
    if (hasTemplates) {
      createApiError(
        'No se puede eliminar un tipo de proceso con plantillas asociadas.',
        409,
      );
    }

    state.processTypes = state.processTypes.filter((item) => item.id !== id);
    addAuditLog(state, {
      action: 'DELETE',
      entityType: 'PROCESS_TYPE',
      entityId: id,
      description: `Se elimino el tipo de proceso ${processType.name}`,
    });
  });
}

export function getDemoTemplates() {
  return readState((state) =>
    state.templates
      .map((template) => enrichTemplate(state, template))
      .sort((a, b) => a.name.localeCompare(b.name)),
  );
}

export function getDemoTemplate(id: number) {
  return readState((state) => {
    const template = state.templates.find((item) => item.id === id);
    if (!template) {
      createApiError('Plantilla no encontrada.', 404);
    }

    return enrichTemplate(state, template);
  });
}

export function createDemoTemplate(input: {
  name: string;
  description: string;
  processTypeId: number;
  isActive?: boolean;
  isLocked?: boolean;
  steps?: Array<{
    order: number;
    name: string;
    description?: string;
    responsibleRole?: string;
    dueDaysFromStart?: number;
    isMandatory?: boolean;
  }>;
}) {
  return mutateState((state) => {
    const processType = state.processTypes.find(
      (item) => item.id === input.processTypeId,
    );
    if (!processType) {
      createApiError('El tipo de proceso seleccionado no existe.', 404);
    }

    const createdAt = nowIso();
    const templateId = nextId(state, 'template');
    const steps = (input.steps ?? []).map((step, index) => ({
      id: nextId(state, 'templateStep'),
      templateId,
      order: step.order ?? index + 1,
      name: step.name.trim(),
      description: step.description?.trim() || null,
      responsibleRole: step.responsibleRole,
      dueDaysFromStart: step.dueDaysFromStart,
      isMandatory: step.isMandatory ?? true,
      createdAt,
      updatedAt: createdAt,
    }));

    const template: DemoTemplate = {
      id: templateId,
      name: input.name.trim(),
      description: input.description.trim(),
      processTypeId: input.processTypeId,
      isActive: input.isActive ?? true,
      isLocked: input.isLocked ?? false,
      createdAt,
      updatedAt: createdAt,
      steps,
    };

    state.templates.unshift(template);
    addAuditLog(state, {
      action: 'CREATE',
      entityType: 'PROCESS_TEMPLATE',
      entityId: template.id,
      description: `Se creo la plantilla ${template.name}`,
      details: { processTypeId: template.processTypeId, steps: steps.length },
    });

    return enrichTemplate(state, template);
  });
}

export function updateDemoTemplate(
  id: number,
  input: {
    name?: string;
    description?: string;
    processTypeId?: number;
    isActive?: boolean;
    isLocked?: boolean;
    steps?: Array<{
      order: number;
      name: string;
      description?: string;
      responsibleRole?: string;
      dueDaysFromStart?: number;
      isMandatory?: boolean;
    }>;
  },
) {
  return mutateState((state) => {
    const template = state.templates.find((item) => item.id === id);
    if (!template) {
      createApiError('Plantilla no encontrada.', 404);
    }

    if (input.processTypeId !== undefined) {
      const processType = state.processTypes.find(
        (item) => item.id === input.processTypeId,
      );
      if (!processType) {
        createApiError('El tipo de proceso seleccionado no existe.', 404);
      }
      template.processTypeId = input.processTypeId;
    }
    if (input.name !== undefined) {
      template.name = input.name.trim();
    }
    if (input.description !== undefined) {
      template.description = input.description.trim();
    }
    if (typeof input.isActive === 'boolean') {
      template.isActive = input.isActive;
    }
    if (typeof input.isLocked === 'boolean') {
      template.isLocked = input.isLocked;
    }
    if (input.steps) {
      const updatedAt = nowIso();
      template.steps = input.steps.map((step, index) => ({
        id: nextId(state, 'templateStep'),
        templateId: template.id,
        order: step.order ?? index + 1,
        name: step.name.trim(),
        description: step.description?.trim() || null,
        responsibleRole: step.responsibleRole,
        dueDaysFromStart: step.dueDaysFromStart,
        isMandatory: step.isMandatory ?? true,
        createdAt: updatedAt,
        updatedAt,
      }));
    }
    template.updatedAt = nowIso();

    addAuditLog(state, {
      action: 'UPDATE',
      entityType: 'PROCESS_TEMPLATE',
      entityId: template.id,
      description: `Se actualizo la plantilla ${template.name}`,
      details: { steps: template.steps.length },
    });

    return enrichTemplate(state, template);
  });
}

export function deleteDemoTemplate(id: number) {
  mutateState((state) => {
    const template = state.templates.find((item) => item.id === id);
    if (!template) {
      createApiError('Plantilla no encontrada.', 404);
    }

    const hasProcesses = state.processes.some((process) => process.templateId === id);
    if (hasProcesses) {
      createApiError(
        'No se puede eliminar una plantilla con procesos asociados.',
        409,
      );
    }

    state.templates = state.templates.filter((item) => item.id !== id);
    addAuditLog(state, {
      action: 'DELETE',
      entityType: 'PROCESS_TEMPLATE',
      entityId: id,
      description: `Se elimino la plantilla ${template.name}`,
    });
  });
}

export function getDemoProcesses(search?: string) {
  return readState((state) => {
    let processes = [...state.processes];

    if (search?.trim()) {
      const term = search.trim().toLowerCase();
      processes = processes.filter(
        (process) =>
          process.title.toLowerCase().includes(term) ||
          process.steps.some((step) => step.title.toLowerCase().includes(term)),
      );
    }

    return processes
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((process) => enrichProcess(state, process));
  });
}

export function createDemoProcess(input: {
  processTypeId: number;
  templateId: number;
  title: string;
  comment?: string;
  year?: number;
  month?: number;
  dueAt?: string;
  responsibleUserId?: number;
}) {
  return mutateState((state) => {
    const process = buildProcessFromTemplate(state, {
      ...input,
      responsibleUserId: input.responsibleUserId ?? getCurrentUserId(),
    });

    addAuditLog(state, {
      action: 'CREATE',
      entityType: 'PROCESS_INSTANCE',
      entityId: process.id,
      description: `Se creo el proceso ${process.title}`,
      details: {
        templateId: process.templateId,
        processTypeId: process.processTypeId,
      },
    });

    return enrichProcess(state, process);
  });
}

export function importDemoProcess(
  file: File,
  processTypeId: number,
  templateId: number,
  title?: string,
  year?: number,
) {
  return mutateState((state) => {
    const process = buildProcessFromTemplate(state, {
      processTypeId,
      templateId,
      title: title?.trim() || `Importado - ${file.name.replace(/\.zip$/i, '')}`,
      year,
      month: new Date().getMonth() + 1,
      responsibleUserId: getCurrentUserId(),
    });

    const firstStep = process.steps[0];
    if (firstStep) {
      const importedFile = createFileRecord({
        id: nextId(state, 'file'),
        stepId: firstStep.id,
        originalName: file.name,
        mimeType: 'application/zip',
        sizeBytes: file.size,
        version: 1,
        uploadedAt: nowIso(),
        uploadedById: getCurrentUserId(),
        body:
          'Archivo ZIP importado en modo demo.\n\n' +
          'La importacion crea el expediente y un archivo demostrativo en el primer paso.',
      });

      state.files.unshift(importedFile);
      firstStep.estado = 'COMPLETADO';
      firstStep.completedAt = nowIso();
      firstStep.comment = `Contenido importado desde ${file.name}`;
      firstStep.updatedAt = nowIso();
      recalculateProcessState(process);
    }

    addAuditLog(state, {
      action: 'CREATE',
      entityType: 'PROCESS_INSTANCE',
      entityId: process.id,
      description: `Se importo el expediente ${process.title}`,
      details: { fileName: file.name, templateId },
    });

    return {
      process: enrichProcess(state, process),
      stats: {
        filesImported: firstStep ? 1 : 0,
        filesSkipped: 0,
        stepsCreated: process.steps.length,
      },
    };
  });
}

export function deleteDemoProcess(id: number) {
  mutateState((state) => {
    const process = state.processes.find((item) => item.id === id);
    if (!process) {
      createApiError('Proceso no encontrado.', 404);
    }

    const stepIds = process.steps.map((step) => step.id);
    state.files = state.files.filter((file) => !stepIds.includes(file.stepId));
    state.processes = state.processes.filter((item) => item.id !== id);

    addAuditLog(state, {
      action: 'DELETE',
      entityType: 'PROCESS_INSTANCE',
      entityId: id,
      description: `Se elimino el proceso ${process.title}`,
    });
  });
}

export function addDemoStepToProcess(processId: number, stepName: string) {
  return mutateState((state) => {
    const process = state.processes.find((item) => item.id === processId);
    if (!process) {
      createApiError('Proceso no encontrado.', 404);
    }

    const createdAt = nowIso();
    const templateStepId = nextId(state, 'templateStep');
    const newStep: DemoProcessStep = {
      id: nextId(state, 'processStep'),
      title: stepName.trim(),
      estado: 'PENDIENTE',
      comment: null,
      processInstanceId: processId,
      templateStepId,
      dueAt: process.dueAt,
      completedAt: null,
      createdAt,
      updatedAt: createdAt,
      assignedToId: process.responsibleUserId,
      templateStep: {
        id: templateStepId,
        name: stepName.trim(),
        description: null,
        order: process.steps.length + 1,
        isMandatory: true,
      },
    };

    process.steps.push(newStep);
    process.updatedAt = createdAt;
    recalculateProcessState(process);

    addAuditLog(state, {
      action: 'CREATE',
      entityType: 'STEP_INSTANCE',
      entityId: newStep.id,
      description: `Se agrego el paso ${newStep.title} al proceso ${process.title}`,
      details: { processId },
    });

    return {
      templateStep: { ...newStep.templateStep },
      stepInstance: enrichProcessStep(state, newStep),
      message: 'Paso agregado correctamente.',
    };
  });
}

export function assignDemoStep(stepId: number, assignedToId: number) {
  return mutateState((state) => {
    const user = state.users.find((item) => item.id === assignedToId);
    if (!user) {
      createApiError('Usuario no encontrado.', 404);
    }

    const process = state.processes.find((item) =>
      item.steps.some((step) => step.id === stepId),
    );
    const step = process?.steps.find((item) => item.id === stepId);
    if (!step) {
      createApiError('Paso no encontrado.', 404);
    }

    step.assignedToId = assignedToId;
    step.updatedAt = nowIso();

    addAuditLog(state, {
      action: 'ASSIGN',
      entityType: 'STEP_INSTANCE',
      entityId: step.id,
      description: `Se asigno el paso ${step.title} a ${user.fullName}`,
      details: { processId: process?.id, assignedToId },
    });

    return enrichProcessStep(state, step);
  });
}

export function unassignDemoStep(stepId: number) {
  return mutateState((state) => {
    const process = state.processes.find((item) =>
      item.steps.some((step) => step.id === stepId),
    );
    const step = process?.steps.find((item) => item.id === stepId);
    if (!step) {
      createApiError('Paso no encontrado.', 404);
    }

    step.assignedToId = null;
    step.updatedAt = nowIso();

    addAuditLog(state, {
      action: 'UNASSIGN',
      entityType: 'STEP_INSTANCE',
      entityId: step.id,
      description: `Se removio la asignacion del paso ${step.title}`,
      details: { processId: process?.id },
    });

    return enrichProcessStep(state, step);
  });
}

export function updateDemoProcessResponsible(
  processId: number,
  responsibleUserId: number | null,
) {
  return mutateState((state) => {
    const process = state.processes.find((item) => item.id === processId);
    if (!process) {
      createApiError('Proceso no encontrado.', 404);
    }

    if (responsibleUserId !== null) {
      const user = state.users.find((item) => item.id === responsibleUserId);
      if (!user) {
        createApiError('Usuario no encontrado.', 404);
      }
    }

    process.responsibleUserId = responsibleUserId;
    process.updatedAt = nowIso();

    addAuditLog(state, {
      action: responsibleUserId === null ? 'UNASSIGN' : 'ASSIGN',
      entityType: 'PROCESS_INSTANCE',
      entityId: process.id,
      description:
        responsibleUserId === null
          ? `Se removio el responsable del proceso ${process.title}`
          : `Se actualizo el responsable del proceso ${process.title}`,
      details: { responsibleUserId },
    });

    return enrichProcess(state, process);
  });
}

export function buildDemoProcessExport(id: number) {
  return readState((state) => {
    const process = state.processes.find((item) => item.id === id);
    if (!process) {
      createApiError('Proceso no encontrado.', 404);
    }

    return {
      fileName: `${process.title.replace(/[<>:"/\\|?*]/g, '_').replace(/\s+/g, '_')}.zip`,
      blob: new Blob([buildArchiveTextForProcess(state, process)], {
        type: 'application/zip',
      }),
    };
  });
}

export function buildDemoBulkExport(ids: number[]) {
  return readState((state) => {
    const selected = state.processes.filter((process) => ids.includes(process.id));
    if (selected.length === 0) {
      createApiError('Seleccione al menos un proceso.', 400);
    }

    const body = selected
      .map((process) => buildArchiveTextForProcess(state, process))
      .join('\n\n------------------------------\n\n');

    return new Blob([body], { type: 'application/zip' });
  });
}

export function getDemoStepFiles(stepId: number) {
  return readState((state) =>
    state.files
      .filter((file) => file.stepId === stepId)
      .sort((a, b) => b.version - a.version)
      .map((file) => enrichFile(state, file)),
  );
}

export async function uploadDemoStepFile(stepId: number, file: File) {
  return mutateState((state) => {
    const process = state.processes.find((item) =>
      item.steps.some((step) => step.id === stepId),
    );
    const step = process?.steps.find((item) => item.id === stepId);
    if (!step) {
      createApiError('Paso no encontrado.', 404);
    }

    const currentVersion =
      state.files
        .filter((existing) => existing.stepId === stepId)
        .reduce((maxVersion, existing) => Math.max(maxVersion, existing.version), 0) +
      1;

    const createdFile = createFileRecord({
      id: nextId(state, 'file'),
      stepId,
      originalName: file.name,
      mimeType: file.type || 'application/octet-stream',
      sizeBytes: file.size,
      version: currentVersion,
      uploadedAt: nowIso(),
      uploadedById: getCurrentUserId(),
      body:
        `Archivo cargado en modo demo: ${file.name}\n\n` +
        'El frontend conserva la metadata y una vista simulada para la demostracion.',
    });

    state.files.unshift(createdFile);
    step.estado = 'COMPLETADO';
    step.completedAt = createdFile.uploadedAt;
    step.comment = `Ultimo archivo cargado: ${file.name}`;
    step.updatedAt = createdFile.uploadedAt;
    recalculateProcessState(process);

    addAuditLog(state, {
      action: 'UPLOAD',
      entityType: 'FILE',
      entityId: createdFile.id,
      description: `Se subio el archivo ${file.name}`,
      details: { processId: process.id, stepId },
    });

    return enrichFile(state, createdFile);
  });
}

export function downloadDemoStepFile(stepId: number, fileId: number) {
  return mutateState((state) => {
    const file = state.files.find(
      (item) => item.id === fileId && item.stepId === stepId,
    );
    if (!file) {
      createApiError('Archivo no encontrado.', 404);
    }

    addAuditLog(state, {
      action: 'DOWNLOAD',
      entityType: 'FILE',
      entityId: file.id,
      description: `Se descargo el archivo ${file.originalName}`,
      details: { stepId },
    });

    return new Blob([file.downloadText], {
      type: file.mimeType || 'application/octet-stream',
    });
  });
}

export function deleteDemoStepFile(stepId: number, fileId: number) {
  mutateState((state) => {
    const file = state.files.find(
      (item) => item.id === fileId && item.stepId === stepId,
    );
    if (!file) {
      createApiError('Archivo no encontrado.', 404);
    }

    const process = state.processes.find((item) =>
      item.steps.some((step) => step.id === stepId),
    );
    const step = process?.steps.find((item) => item.id === stepId);
    if (!step) {
      createApiError('Paso no encontrado.', 404);
    }

    state.files = state.files.filter((item) => item.id !== fileId);
    const remainingFiles = state.files.filter((item) => item.stepId === stepId);
    if (remainingFiles.length === 0) {
      step.estado = 'PENDIENTE';
      step.completedAt = null;
      step.comment = null;
      step.updatedAt = nowIso();
      recalculateProcessState(process);
    }

    addAuditLog(state, {
      action: 'DELETE',
      entityType: 'FILE',
      entityId: file.id,
      description: `Se elimino el archivo ${file.originalName}`,
      details: { processId: process.id, stepId },
    });
  });
}

export function getDemoFileViewUrl(stepId: number, fileId: number) {
  return readState((state) => {
    const file = state.files.find(
      (item) => item.id === fileId && item.stepId === stepId,
    );
    if (!file) {
      createApiError('Archivo no encontrado.', 404);
    }

    return `data:text/html;charset=utf-8,${encodeURIComponent(file.previewHtml)}`;
  });
}

export function getDemoFolderDownload(type: DemoFolderType, id: number) {
  return readState((state) => {
    const summary = getFolderSummary(state, type, id);
    return {
      fileName: summary.fileName,
      blob: new Blob([summary.body], { type: 'application/zip' }),
    };
  });
}

export function countDemoFolderFiles(type: DemoFolderType, id: number) {
  return readState((state) => {
    switch (type) {
      case 'category': {
        const processTypeIds = state.processTypes
          .filter((processType) => processType.categoryId === id)
          .map((processType) => processType.id);
        const processIds = state.processes
          .filter((process) => processTypeIds.includes(process.processTypeId))
          .map((process) => process.id);
        const stepIds = state.processes
          .filter((process) => processIds.includes(process.id))
          .flatMap((process) => process.steps.map((step) => step.id));
        return state.files.filter((file) => stepIds.includes(file.stepId)).length;
      }
      case 'processType': {
        const processIds = state.processes
          .filter((process) => process.processTypeId === id)
          .map((process) => process.id);
        const stepIds = state.processes
          .filter((process) => processIds.includes(process.id))
          .flatMap((process) => process.steps.map((step) => step.id));
        return state.files.filter((file) => stepIds.includes(file.stepId)).length;
      }
      case 'process': {
        const process = state.processes.find((item) => item.id === id);
        if (!process) {
          return 0;
        }
        const stepIds = process.steps.map((step) => step.id);
        return state.files.filter((file) => stepIds.includes(file.stepId)).length;
      }
      case 'step':
        return state.files.filter((file) => file.stepId === id).length;
      default:
        return 0;
    }
  });
}

export function getDemoAuditLogs(filter: {
  action?: string;
  entityType?: string;
  userId?: number;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}) {
  return readState((state) => {
    let logs = [...state.auditLogs];

    if (filter.action) {
      logs = logs.filter((log) => log.action === filter.action);
    }
    if (filter.entityType) {
      logs = logs.filter((log) => log.entityType === filter.entityType);
    }
    if (filter.userId) {
      logs = logs.filter((log) => log.userId === filter.userId);
    }
    if (filter.startDate) {
      const start = new Date(`${filter.startDate}T00:00:00`).toISOString();
      logs = logs.filter((log) => log.createdAt >= start);
    }
    if (filter.endDate) {
      const end = new Date(`${filter.endDate}T23:59:59`).toISOString();
      logs = logs.filter((log) => log.createdAt <= end);
    }

    logs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const total = logs.length;
    const offset = filter.offset ?? 0;
    const limit = filter.limit ?? 20;
    const paginated = logs.slice(offset, offset + limit);

    return {
      data: paginated.map((log) => {
        const user = getUserFromState(state, log.userId);
        return {
          ...log,
          user: user ? sanitizeUser(user) : null,
        };
      }),
      total,
      limit,
      offset,
    };
  });
}

export function getDemoAuditLogById(id: number) {
  return readState((state) => {
    const log = state.auditLogs.find((item) => item.id === id);
    if (!log) {
      createApiError('Registro de auditoria no encontrado.', 404);
    }

    const user = getUserFromState(state, log.userId);
    return {
      ...log,
      user: user ? sanitizeUser(user) : null,
    };
  });
}

export function getDemoAuditLogStats() {
  return readState((state) => {
    const totalLogs = state.auditLogs.length;
    const actionCounts = new Map<string, number>();
    const entityCounts = new Map<string, number>();

    state.auditLogs.forEach((log) => {
      actionCounts.set(log.action, (actionCounts.get(log.action) ?? 0) + 1);
      entityCounts.set(
        log.entityType,
        (entityCounts.get(log.entityType) ?? 0) + 1,
      );
    });

    return {
      totalLogs,
      byAction: [...actionCounts.entries()].map(([action, count]) => ({
        action,
        count,
      })),
      byEntityType: [...entityCounts.entries()].map(([entityType, count]) => ({
        entityType,
        count,
      })),
      recentActivity: state.auditLogs.slice(0, 5).map((log) => {
        const user = getUserFromState(state, log.userId);
        return {
          ...log,
          user: user ? sanitizeUser(user) : null,
        };
      }),
    };
  });
}

export function getDemoActionTypes() {
  return readState((state) =>
    [...new Set(state.auditLogs.map((log) => log.action))].sort(),
  );
}

export function getDemoEntityTypes() {
  return readState((state) =>
    [...new Set(state.auditLogs.map((log) => log.entityType))].sort(),
  );
}
