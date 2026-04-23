// frontend/src/components/ProcessDetailSimple.tsx
import { useEffect, useState, useCallback } from "react";
import type { User } from "../types";

import {
  fetchProcessInstances,
  downloadProcessZip,
  deleteProcessInstance,
  addStepToProcess,
  type ProcessInstance as ApiProcessInstance,
} from "../api/processInstances";

import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Separator } from "./ui/separator";
import { Input } from "./ui/input";
import {
  ArrowLeft,
  Upload,
  CheckCircle,
  Clock,
  FileText,
  Calendar,
  User as UserIcon,
  Download,
  X,
  Archive,
  Loader2,
  Trash2,
  AlertTriangle,
  Plus,
  Eye,
  UserPlus,
} from "lucide-react";
import { UploadDocumentModal } from "./UploadDocumentModal";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./ui/breadcrumb";
import { toast } from "sonner";
import {
  listStepFiles,
  downloadStepFile,
  deleteStepFile,
  getFileViewUrl,
  type StepFileSummary,
} from "../api/stepFiles";
import { FileViewerModal } from "./FileViewerModal";
import { AssignResponsibleModal } from "./AssignmentModals";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";

interface ProcessDetailSimpleProps {
  processId: number;
  currentUser: User;
  onBack: () => void;
}

// Paso tal como viene del adaptador demo, más archivos
type ApiStep = {
  id: number;
  title: string;
  estado: "PENDIENTE" | "COMPLETADO" | string;
  comment: string | null;
  processInstanceId: number;
  templateStepId: number;
  dueAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  files?: StepFileSummary[];
  templateStep?: {
    id: number;
    name: string;
    description: string | null;
    order: number;
    isMandatory: boolean;
  } | null;
};

// Las etiquetas vienen incluidas en process.tags

export function ProcessDetailSimple({
  processId,
  currentUser,
  onBack,
}: ProcessDetailSimpleProps) {
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedStepId, setSelectedStepId] = useState<number | null>(null);

  const [process, setProcess] = useState<ApiProcessInstance | null>(null);
  const [steps, setSteps] = useState<ApiStep[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Add Step state
  const [addStepName, setAddStepName] = useState('');
  const [addStepOpen, setAddStepOpen] = useState(false);
  const [addingStep, setAddingStep] = useState(false);

  // PDF Viewer state
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [pdfViewerUrl, setPdfViewerUrl] = useState('');
  const [pdfViewerFileName, setPdfViewerFileName] = useState('');
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Assignment modals state
  const [assignResponsibleOpen, setAssignResponsibleOpen] = useState(false);

  const handleAddStep = async () => {
    if (!addStepName.trim() || !process) return;

    try {
      setAddingStep(true);
      await addStepToProcess(process.id, addStepName.trim());
      toast.success(`Paso "${addStepName}" agregado exitosamente`);
      setAddStepName('');
      setAddStepOpen(false);
      // Recargar el proceso para ver el nuevo paso
      await load();
    } catch (err: any) {
      console.error('Error agregando paso:', err);
      const message = err.response?.data?.message || 'Error al agregar el paso';
      toast.error(message);
    } finally {
      setAddingStep(false);
    }
  };

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const instances = await fetchProcessInstances();
      const found = instances.find((p) => p.id === processId) ?? null;
      setProcess(found || null);

      if (found && Array.isArray(found.steps)) {
        const stepsFromApi = found.steps as ApiStep[];

        // Para cada paso, traemos sus archivos desde /steps/:id/files
        const stepsWithFiles = await Promise.all(
          stepsFromApi.map(async (step) => {
            try {
              const files = await listStepFiles(step.id);
              return { ...step, files };
            } catch (e) {
              console.error(
                `[ProcessDetailSimple] Error cargando archivos del paso ${step.id}`,
                e
              );
              return { ...step, files: [] as StepFileSummary[] };
            }
          })
        );

        setSteps(stepsWithFiles);
      } else {
        setSteps([]);
      }
    } catch (e) {
      console.error("[ProcessDetailSimple] Error cargando proceso", e);
      setError("No se pudo cargar el proceso");
    } finally {
      setLoading(false);
    }
  }, [processId]);

  useEffect(() => {
    load();
  }, [load]);

  const getSimplifiedState = (estado?: string | null) => {
    if (estado === "COMPLETADO") {
      return { label: "Completado", color: "bg-green-100 text-green-800" };
    }
    return { label: "Pendiente", color: "bg-yellow-100 text-yellow-800" };
  };

  const getStepState = (estado: string) => {
    if (estado === "COMPLETADO") {
      return {
        label: "Completado",
        color: "bg-green-100 text-green-800",
        icon: <CheckCircle className="w-5 h-5 text-green-600" />,
      };
    }
    return {
      label: "Pendiente",
      color: "bg-yellow-100 text-yellow-800",
      icon: <Clock className="w-5 h-5 text-yellow-600" />,
    };
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const handleUploadFile = (stepId: number) => {
    setSelectedStepId(stepId);
    setUploadModalOpen(true);
  };

  const handleRemoveFile = async (fileId: number, fileName: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar el archivo "${fileName}"?`)) return;

    // Si no tenemos stepId, no podemos llamar a la API correctamente (la API pide /steps/:stepId/files/:fileId)
    // Buscamos el step al que pertenece este archivo
    // En tu estado "steps", cada step tiene "files". Busquemos ahí.
    const stepFound = steps.find(s => s.files?.some(f => f.id === fileId));
    if (!stepFound) {
      toast.error("No se encontró el paso del archivo");
      return;
    }

    try {
      await deleteStepFile(stepFound.id, fileId);
      toast.success(`Archivo ${fileName} eliminado`);
      load(); // Recargar datos para actualizar estado del paso/proceso
    } catch (e) {
      console.error(e);
      toast.error("Error al eliminar el archivo");
    }
  };

  const handleDownloadFile = async (stepId: number, file: StepFileSummary) => {
    try {
      const blob = await downloadStepFile(stepId, file.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.originalName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error("[ProcessDetailSimple] Error descargando archivo", e);
      toast.error("No se pudo descargar el archivo");
    }
  };

  const handlePreviewFile = async (stepId: number, file: StepFileSummary) => {
    // Verificar si es PDF
    const isPdf = file.originalName.toLowerCase().endsWith('.pdf') ||
      file.mimeType === 'application/pdf';

    if (!isPdf) {
      toast.error("Solo se pueden previsualizar archivos PDF. Use el botón de descarga para otros formatos.");
      return;
    }

    try {
      setLoadingPreview(true);
      const url = getFileViewUrl(stepId, file.id);
      setPdfViewerUrl(url);
      setPdfViewerFileName(file.originalName);
      setPdfViewerOpen(true);
    } catch (e) {
      console.error("[ProcessDetailSimple] Error obteniendo URL de vista", e);
      toast.error("No se pudo cargar la previsualización del archivo");
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleMarkComplete = () => {
    toast.success("Proceso marcado como completado");
  };

  const handleExportZip = async () => {
    if (!process) return;
    try {
      setExporting(true);
      const blob = await downloadProcessZip(process.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const fileName = (process.title || `Expediente_${process.id}`)
        .replace(/[<>:"/\\|?*]/g, '_')
        .replace(/\s+/g, '_');
      a.download = `${fileName}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Expediente descargado exitosamente");
    } catch (e) {
      console.error("[ProcessDetailSimple] Error exportando expediente", e);
      toast.error("No se pudo descargar el expediente");
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    if (!process) return;

    try {
      setDeleting(true);
      await deleteProcessInstance(process.id);
      toast.success(`Proceso "${process.title || `#${process.id}`}" eliminado`);
      onBack(); // Volver a la lista
    } catch (e: any) {
      console.error("[ProcessDetailSimple] Error eliminando proceso", e);
      const message = e.response?.data?.message || "Error al eliminar el proceso";
      toast.error(message);
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Cargando proceso...</p>
      </div>
    );
  }

  if (error || !process) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {error || "Proceso no encontrado"}
          </p>
          <Button onClick={onBack} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </div>
      </div>
    );
  }

  // Responsable - usar el nombre enriquecido si está disponible
  const responsibleName =
    process.responsibleUser?.fullName ||
    (process.responsibleUserId != null
      ? `Usuario #${process.responsibleUserId}`
      : "Sin asignar");

  const createdAtRaw = process.createdAt;
  const state = getSimplifiedState(process.estado);

  // Progreso: solo considerar pasos obligatorios
  const mandatorySteps = steps.filter((s) => s.templateStep?.isMandatory !== false);
  const completedMandatorySteps = mandatorySteps.filter((s) => s.estado === "COMPLETADO").length;
  const progressPercent =
    mandatorySteps.length > 0 ? Math.round((completedMandatorySteps * 100) / mandatorySteps.length) : 100;
  const allMandatoryComplete = mandatorySteps.length === 0 || completedMandatorySteps === mandatorySteps.length;

  // Para mostrar stats totales
  const totalCompletedSteps = steps.filter((s) => s.estado === "COMPLETADO").length;

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink onClick={onBack} className="cursor-pointer">
              Procesos
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>
              {process.title ||
                process.processType?.name ||
                `Proceso #${process.id}`}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1>
            {process.title ||
              process.processType?.name ||
              `Proceso #${process.id}`}
          </h1>
          <p className="text-muted-foreground">
            {process.processType?.name || "Tipo desconocido"} - {process.year}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="destructive"
            onClick={() => setDeleteDialogOpen(true)}
            disabled={deleting}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Eliminar
          </Button>
          <Button variant="outline" onClick={handleExportZip} disabled={exporting}>
            {exporting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Archive className="w-4 h-4 mr-2" />
            )}
            {exporting ? "Exportando..." : "Exportar Expediente"}
          </Button>
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </div>
      </div>

      {/* Process Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Información del Proceso</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Estado</div>
              <Badge className={state.color}>{state.label}</Badge>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Responsable</div>
              <div className="flex items-center gap-2 mt-1">
                <UserIcon className="w-4 h-4" />
                <span>{responsibleName}</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => setAssignResponsibleOpen(true)}
                >
                  <UserPlus className="w-3 h-3 mr-1" />
                  Delegar
                </Button>
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">
                Fecha de creación
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(createdAtRaw)}</span>
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Año/Mes</div>
              <div className="mt-1">
                {process.year} / {process.month}
              </div>
            </div>
          </div>

          {steps.length > 0 && (
            <>
              <Separator />
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">
                    Progreso
                  </span>
                  <span className="text-sm">{progressPercent}%</span>
                </div>
                <Progress value={progressPercent} className="h-2" />
              </div>
            </>
          )}

          {allMandatoryComplete && process.estado !== "COMPLETADO" && (
            <>
              <Separator />
              <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm">
                    Todos los pasos obligatorios han sido completados
                  </span>
                </div>
                <Button onClick={handleMarkComplete}>
                  Marcar como Completado
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Steps Card - usando los pasos reales del proceso demo */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Pasos del Proceso</CardTitle>
          {/* Botón para agregar paso - solo ADMIN y GESTOR */}
          {(currentUser.role === 'ADMINISTRADOR' || currentUser.role === 'GESTOR') && (
            <div className="flex items-center gap-2">
              {addStepOpen ? (
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Nombre del nuevo paso..."
                    value={addStepName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAddStepName(e.target.value)}
                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                      if (e.key === 'Enter') handleAddStep();
                      if (e.key === 'Escape') {
                        setAddStepOpen(false);
                        setAddStepName('');
                      }
                    }}
                    className="h-8 w-[200px]"
                    autoFocus
                    disabled={addingStep}
                  />
                  <Button
                    size="sm"
                    onClick={handleAddStep}
                    disabled={addingStep || !addStepName.trim()}
                  >
                    {addingStep ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Agregar'
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setAddStepOpen(false);
                      setAddStepName('');
                    }}
                    disabled={addingStep}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setAddStepOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Agregar Paso
                </Button>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {steps.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Este proceso aún no tiene pasos.
            </p>
          )}

          {steps.map((step, index) => {
            const stepState = getStepState(step.estado);
            const files = (step.files ?? []) as StepFileSummary[];

            return (
              <div key={step.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {stepState.icon}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span>
                          Paso {index + 1}: {step.title}
                        </span>
                        <Badge className={stepState.color}>
                          {stepState.label}
                        </Badge>
                      </div>
                      {step.comment && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Comentario: {step.comment}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Files Section */}
                {files.length > 0 && (
                  <div className="ml-8 space-y-2">
                    <div className="text-sm">Archivos cargados:</div>
                    {files.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded border"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <div className="text-sm">{file.originalName}</div>
                            <div className="text-xs text-muted-foreground">
                              v{file.version} ·{" "}
                              {(file.sizeBytes / 1024).toFixed(1)} KB ·{" "}
                              {formatDateTime(file.uploadedAt)}
                              {file.uploadedBy && (
                                <> · Subido por: <span className="font-medium">{file.uploadedBy.fullName}</span></>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {/* Preview PDF Button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePreviewFile(step.id, file)}
                            disabled={loadingPreview}
                            title={file.originalName.toLowerCase().endsWith('.pdf') ? 'Previsualizar PDF' : 'Solo PDFs'}
                          >
                            {loadingPreview ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Eye className="w-4 h-4 text-blue-500" />
                            )}
                          </Button>
                          {/* Download Button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadFile(step.id, file)}
                            title="Descargar archivo"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          {/* Delete Button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleRemoveFile(file.id, file.originalName)
                            }
                            title="Eliminar archivo"
                          >
                            <X className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="ml-8 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUploadFile(step.id)}
                  >
                    <Upload className="w-4 h-4 mr-1" />
                    Cargar archivo
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Upload Modal */}
      {selectedStepId && (
        <UploadDocumentModal
          open={uploadModalOpen}
          onClose={() => {
            setUploadModalOpen(false);
            setSelectedStepId(null);
          }}
          stepId={selectedStepId}
          onUploaded={load}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Confirmar eliminación
            </AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar el proceso{' '}
              <strong>"{process?.title || `#${process?.id}`}"</strong>?
              <br />
              <br />
              Esta acción eliminará permanentemente todos los archivos asociados
              y no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Eliminando...
                </>
              ) : (
                'Eliminar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de previsualización de PDF */}
      <FileViewerModal
        isOpen={pdfViewerOpen}
        onClose={() => setPdfViewerOpen(false)}
        fileUrl={pdfViewerUrl}
        fileName={pdfViewerFileName}
      />

      {/* Modal para delegar proceso */}
      <AssignResponsibleModal
        open={assignResponsibleOpen}
        onClose={() => setAssignResponsibleOpen(false)}
        processId={processId}
        processTitle={process.title || `Proceso #${process.id}`}
        currentResponsible={process.responsibleUser}
        onAssigned={() => load()}
      />
    </div>
  );
}
