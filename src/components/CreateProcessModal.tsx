// frontend/src/components/CreateProcessModal.tsx
import { useEffect, useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Checkbox } from "./ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Label } from "./ui/label";
import { User } from "../types";
import { toast } from "sonner";
import { FileText, CheckCircle, AlertTriangle, Calendar, UserPlus } from "lucide-react";
import { format } from "date-fns";

import type { ProcessType } from "../api/processTypes";
import { fetchProcessTypes } from "../api/processTypes";
import type { ProcessTemplate } from "../api/processTemplates";
import { fetchProcessTemplates } from "../api/processTemplates";
import {
  createProcessInstance,
  type CreateProcessInstanceInput,
  type ProcessInstance,
} from "../api/processInstances";
import { FormField } from "./ui/form-field";
import { LoadingSpinner } from "./ui/loading-spinner"; // Removed unused TableSkeleton
import { cn } from "./ui/utils";
import { fetchUsers, type User as ApiUser } from "../api/users";

interface CreateProcessModalProps {
  open: boolean;
  onClose: () => void;
  currentUser: User;
  onProcessCreated?: (instance: ProcessInstance) => void;
}

interface FormErrors {
  processType?: string;
  template?: string;
  title?: string;
  year?: string;
  month?: string;
}

export function CreateProcessModal({
  open,
  onClose,
  currentUser,
  onProcessCreated,
}: CreateProcessModalProps) {
  const [processTypes, setProcessTypes] = useState<ProcessType[]>([]);
  const [templates, setTemplates] = useState<ProcessTemplate[]>([]);

  const [selectedProcessTypeId, setSelectedProcessTypeId] = useState<string>("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [showObsoleteTemplates, setShowObsoleteTemplates] = useState(false);
  const [processTitle, setProcessTitle] = useState("");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [month, setMonth] = useState((new Date().getMonth() + 1).toString());
  const [dueAt, setDueAt] = useState<Date | undefined>(undefined);

  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Usuarios para asignar responsable
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [selectedResponsibleId, setSelectedResponsibleId] = useState<string>("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const [types, allTemplates, allUsers] = await Promise.all([
        fetchProcessTypes(),
        fetchProcessTemplates(),
        fetchUsers(),
      ]);
      setProcessTypes(types);
      setTemplates(allTemplates);
      setUsers(allUsers); // Mostrar todos los usuarios del sistema
    } catch (error) {
      console.error(error);
      setLoadError("No se pudieron cargar los datos.");
      toast.error("Error al cargar datos iniciales");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open, loadData]);

  const availableTemplates = templates.filter(
    (t) =>
      t.processTypeId.toString() === selectedProcessTypeId &&
      (showObsoleteTemplates ? true : t.isActive)
  );

  const selectedTemplate = templates.find(
    (t) => t.id.toString() === selectedTemplateId
  );

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!selectedProcessTypeId) errors.processType = "Seleccione un tipo";
    if (!selectedTemplateId) errors.template = "Seleccione una plantilla";
    if (!processTitle.trim()) {
      errors.title = "El título es requerido";
    } else if (processTitle.trim().length < 5) {
      errors.title = "Mínimo 5 caracteres";
    }

    setFormErrors(errors);
    setTouched({ processType: true, template: true, title: true });
    return Object.keys(errors).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm()) {
      toast.error("Complete los campos requeridos");
      return;
    }

    try {
      setSubmitting(true);

      const payload: CreateProcessInstanceInput = {
        processTypeId: Number(selectedProcessTypeId),
        templateId: Number(selectedTemplateId),
        title: processTitle.trim(),
        year: Number(year),
        month: Number(month),
        comment: undefined,
        dueAt: dueAt ? dueAt.toISOString() : undefined,
        responsibleUserId: selectedResponsibleId ? Number(selectedResponsibleId) : undefined,
      };

      const newInstance = await createProcessInstance(payload);

      toast.success("Proceso creado exitosamente", {
        icon: <CheckCircle className="w-4 h-4" />,
      });

      if (onProcessCreated) {
        onProcessCreated(newInstance);
      }

      handleReset();
      onClose();
    } catch (error: any) {
      console.error(error);
      const errorMessage = error.response?.data?.message || "Error al crear";
      toast.error("Error", { description: errorMessage });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setSelectedProcessTypeId("");
    setSelectedTemplateId("");
    setProcessTitle("");
    setYear(new Date().getFullYear().toString());
    setMonth((new Date().getMonth() + 1).toString());
    setDueAt(undefined);
    setShowObsoleteTemplates(false);
    setSelectedResponsibleId("");
    setFormErrors({});
    setTouched({});
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleBlur = (field: keyof FormErrors) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const currentYear = new Date().getFullYear();
  const years = [currentYear + 1, currentYear, currentYear - 1, currentYear - 2];

  const months = [
    { value: "1", label: "Enero" },
    { value: "2", label: "Febrero" },
    { value: "3", label: "Marzo" },
    { value: "4", label: "Abril" },
    { value: "5", label: "Mayo" },
    { value: "6", label: "Junio" },
    { value: "7", label: "Julio" },
    { value: "8", label: "Agosto" },
    { value: "9", label: "Septiembre" },
    { value: "10", label: "Octubre" },
    { value: "11", label: "Noviembre" },
    { value: "12", label: "Diciembre" },
  ];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      {/* CAMBIO 1: Reducir ancho máximo a 'sm:max-w-lg' (antes 4xl) */}
      <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Proceso</DialogTitle>
          <DialogDescription>
            Complete la información requerida.
          </DialogDescription>
        </DialogHeader>

        {loadError ? (
          <div className="flex flex-col items-center justify-center py-8">
            <AlertTriangle className="w-10 h-10 text-destructive mb-2" />
            <p className="text-sm text-destructive mb-4">{loadError}</p>
            <Button variant="outline" size="sm" onClick={() => { setLoadError(null); loadData(); }}>
              Reintentar
            </Button>
          </div>
        ) : (
          /* CAMBIO 2: Grid de 1 sola columna siempre (antes md:grid-cols-2) */
          <div className="grid grid-cols-1 gap-5">

            {/* Formulario */}
            <div className="space-y-4">
              <FormField
                label="Tipo de proceso"
                htmlFor="processType"
                required
                error={touched.processType ? formErrors.processType : undefined}
              >
                <Select
                  value={selectedProcessTypeId}
                  onValueChange={(value: string) => {
                    setSelectedProcessTypeId(value);
                    setSelectedTemplateId("");
                    setFormErrors(prev => ({ ...prev, processType: undefined }));
                  }}
                  disabled={loading}
                >
                  <SelectTrigger id="processType" className={cn(touched.processType && formErrors.processType && "border-destructive")}>
                    <SelectValue placeholder="Seleccione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {processTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id.toString()}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              {selectedProcessTypeId && (
                <>
                  <div className="flex items-center space-x-2 pb-1">
                    <Checkbox
                      id="showObsolete"
                      checked={showObsoleteTemplates}
                      onCheckedChange={(c: boolean) => setShowObsoleteTemplates(c)}
                    />
                    <Label htmlFor="showObsolete" className="text-xs cursor-pointer text-muted-foreground">
                      Mostrar plantillas inactivas
                    </Label>
                  </div>

                  <FormField
                    label="Plantilla"
                    htmlFor="template"
                    required
                    error={touched.template ? formErrors.template : undefined}
                  >
                    <Select
                      value={selectedTemplateId}
                      onValueChange={(value: string) => {
                        setSelectedTemplateId(value);
                        setFormErrors(prev => ({ ...prev, template: undefined }));
                      }}
                      disabled={loading || availableTemplates.length === 0}
                    >
                      <SelectTrigger id="template" className={cn(touched.template && formErrors.template && "border-destructive")}>
                        <SelectValue placeholder="Seleccione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTemplates.map((template) => (
                          <SelectItem key={template.id} value={template.id.toString()}>
                            <div className="flex items-center gap-2">
                              <span>{template.name}</span>
                              {!template.isActive && <Badge variant="secondary" className="text-[10px] h-4">Inactiva</Badge>}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>
                </>
              )}

              <FormField
                label="Título"
                htmlFor="title"
                required
                error={touched.title ? formErrors.title : undefined}
              >
                <Input
                  id="title"
                  value={processTitle}
                  onChange={(e) => setProcessTitle(e.target.value)}
                  onBlur={() => handleBlur('title')}
                  placeholder="Ej: Evaluación 2025"
                  className={cn(touched.title && formErrors.title && "border-destructive")}
                />
              </FormField>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Año" htmlFor="year" required>
                  <Select value={year} onValueChange={setYear}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {years.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField label="Mes" htmlFor="month" required>
                  <Select value={month} onValueChange={setMonth}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormField>
              </div>

              <FormField label="Fecha Límite" htmlFor="dueAt">
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={dueAt ? format(dueAt, "yyyy-MM-dd") : ""}
                    onChange={(e) => e.target.value ? setDueAt(new Date(e.target.value + "T12:00:00")) : setDueAt(undefined)}
                    className="pl-9"
                    min={format(new Date(), "yyyy-MM-dd")}
                  />
                </div>
              </FormField>

              {/* Selector de Responsable */}
              <FormField label="Responsable" htmlFor="responsible">
                <Select
                  value={selectedResponsibleId || "self"}
                  onValueChange={(val: string) => setSelectedResponsibleId(val === "self" ? "" : val)}
                >
                  <SelectTrigger id="responsible">
                    <SelectValue placeholder="Yo mismo (por defecto)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="self">Yo mismo ({currentUser.fullName})</SelectItem>
                    {users.filter(u => u.id !== currentUser.id).map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        <span className="flex items-center gap-2">
                          <UserPlus className="w-3 h-3" />
                          {user.fullName}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </div>

            {/* Vista Previa (Ahora abajo y opcional visualmente) */}
            {selectedTemplate && (
              <div className="pt-2 border-t">
                <Label className="text-xs text-muted-foreground mb-2 block">Resumen de Plantilla</Label>
                <div className="bg-slate-50 p-3 rounded-md border text-sm space-y-1">
                  <div className="font-medium">{selectedTemplate.name}</div>
                  <div className="text-xs text-muted-foreground">{selectedTemplate.description}</div>
                  <div className="flex gap-2 text-xs mt-2">
                    <Badge variant="outline" className="bg-white">{selectedTemplate.steps?.length || 0} pasos</Badge>
                    <Badge variant={selectedTemplate.isActive ? "default" : "secondary"} className="h-5">
                      {selectedTemplate.isActive ? "Activa" : "Inactiva"}
                    </Badge>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button onClick={handleCreate} disabled={submitting || loading || !!loadError}>
            {submitting && <LoadingSpinner size="sm" className="mr-2" />}
            Crear Proceso
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}