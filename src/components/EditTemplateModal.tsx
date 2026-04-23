import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';
import { Plus, Trash2, AlertTriangle, Loader2, Lock } from 'lucide-react';
import { toast } from 'sonner';

import { fetchProcessTypes, type ProcessType } from '../api/processTypes';
import {
    updateProcessTemplate,
    fetchProcessTemplate,
    deleteProcessTemplate,
    type UpdateProcessTemplateInput,
    type CreateTemplateStepInput,
} from '../api/processTemplates';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from './ui/alert-dialog';

interface EditTemplateModalProps {
    open: boolean;
    onClose: () => void;
    templateId: number | null;
    onTemplateUpdated: () => void;
    onTemplateDeleted?: () => void;
}

interface TemplateStep {
    id: string; // Temporally string to handle new steps easily, will map to number if existing or ignored if new
    originalId?: number; // ID real del paso si existe
    title: string;
    description: string;
    required: boolean;
    ord: number;
}

export function EditTemplateModal({ open, onClose, templateId, onTemplateUpdated, onTemplateDeleted }: EditTemplateModalProps) {
    const [currentStep, setCurrentStep] = useState(1);
    const [templateName, setTemplateName] = useState('');
    const [templateDescription, setTemplateDescription] = useState('');
    const [processTypeId, setProcessTypeId] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [isLocked, setIsLocked] = useState(false);
    const [steps, setSteps] = useState<TemplateStep[]>([]);
    const [loading, setLoading] = useState(false);

    // Delete state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const [processTypes, setProcessTypes] = useState<ProcessType[]>([]);
    const [loadingTypes, setLoadingTypes] = useState(false);

    useEffect(() => {
        const loadTypes = async () => {
            try {
                setLoadingTypes(true);
                const data = await fetchProcessTypes();
                setProcessTypes(data);
            } catch (error) {
                console.error(error);
                toast.error('Error al cargar tipos de proceso');
            } finally {
                setLoadingTypes(false);
            }
        };

        if (open) {
            loadTypes();
        }
    }, [open]);

    useEffect(() => {
        const loadTemplate = async () => {
            if (!templateId) return;
            try {
                setLoading(true);
                const tpl = await fetchProcessTemplate(templateId);
                setTemplateName(tpl.name);
                setTemplateDescription(tpl.description || '');
                setProcessTypeId(tpl.processTypeId.toString());
                setIsActive(tpl.isActive);
                setIsLocked(tpl.isLocked ?? false);

                if (tpl.steps && tpl.steps.length > 0) {
                    const mappedSteps: TemplateStep[] = tpl.steps.map(s => ({
                        id: s.id.toString(),
                        originalId: s.id,
                        title: s.name,
                        description: s.description || '',
                        required: s.isMandatory,
                        ord: s.order
                    })).sort((a, b) => a.ord - b.ord);
                    setSteps(mappedSteps);
                } else {
                    setSteps([{ id: 'new-1', title: '', description: '', required: true, ord: 1 }]);
                }

            } catch (error) {
                console.error(error);
                toast.error('Error al cargar la plantilla');
                onClose();
            } finally {
                setLoading(false);
            }
        };

        if (open && templateId) {
            loadTemplate();
            setCurrentStep(1);
        }
    }, [open, templateId]);

    const handleAddStep = () => {
        const newStep: TemplateStep = {
            id: `new-${Date.now()}`,
            title: '',
            description: '',
            required: true,
            ord: steps.length + 1,
        };
        setSteps([...steps, newStep]);
    };

    const handleRemoveStep = (id: string) => {
        if (steps.length === 1) {
            toast.error('Debe haber al menos un paso');
            return;
        }
        const filtered = steps.filter((s) => s.id !== id);
        const reordered = filtered.map((step, index) => ({
            ...step,
            ord: index + 1,
        }));
        setSteps(reordered);
    };

    const handleUpdateStep = (id: string, field: keyof TemplateStep, value: any) => {
        setSteps(
            steps.map((step) => (step.id === id ? { ...step, [field]: value } : step)),
        );
    };

    const handleMoveStep = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === steps.length - 1) return;

        const newSteps = [...steps];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        [newSteps[index], newSteps[targetIndex]] = [
            newSteps[targetIndex],
            newSteps[index],
        ];

        const reordered = newSteps.map((step, idx) => ({
            ...step,
            ord: idx + 1,
        }));
        setSteps(reordered);
    };

    const handleNext = () => {
        if (currentStep === 1) {
            if (!templateName.trim()) {
                toast.error('Ingrese un nombre para la plantilla');
                return;
            }
            if (!processTypeId) {
                toast.error('Seleccione un tipo de proceso');
                return;
            }
            setCurrentStep(2);
        }
    };

    const handleBack = () => {
        setCurrentStep(1);
    };

    const handleUpdate = async () => {
        if (!templateId) return;

        const invalidSteps = steps.filter((s) => !s.title.trim());
        if (invalidSteps.length > 0) {
            toast.error('Todos los pasos deben tener un nombre');
            return;
        }

        if (!templateName.trim()) {
            toast.error('Ingrese un nombre para la plantilla');
            return;
        }

        if (!processTypeId) {
            toast.error('Seleccione un tipo de proceso');
            return;
        }

        const stepsPayload: CreateTemplateStepInput[] = steps.map((step) => ({
            order: step.ord,
            name: step.title,
            description: step.description,
            isMandatory: step.required ?? true,
        }));

        // El store demo reemplaza los pasos cuando se envian en la actualizacion.

        const payload: UpdateProcessTemplateInput = {
            name: templateName,
            description: templateDescription,
            processTypeId: parseInt(processTypeId, 10),
            isActive: isActive,
            isLocked: isLocked,
            steps: stepsPayload, // Sending steps to replace/update them. Backend must support this.
        };

        try {
            await updateProcessTemplate(templateId, payload);
            toast.success('Plantilla actualizada exitosamente');
            onTemplateUpdated();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error('Error al actualizar la plantilla');
        }
    };

    const handleDelete = async () => {
        if (!templateId) return;

        try {
            setDeleting(true);
            await deleteProcessTemplate(templateId);
            toast.success(`Plantilla "${templateName}" eliminada`);
            onTemplateDeleted?.();
            onClose();
        } catch (e: any) {
            console.error('Error eliminando plantilla:', e);
            const message = e.response?.data?.message || 'Error al eliminar la plantilla';
            toast.error(message);
        } finally {
            setDeleting(false);
            setDeleteDialogOpen(false);
        }
    };

    const selectedProcessType = processTypes.find(
        (pt) => pt.id.toString() === processTypeId,
    );

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {currentStep === 1
                            ? 'Editar Plantilla - Información General'
                            : 'Editar Plantilla - Configurar Pasos'}
                    </DialogTitle>
                </DialogHeader>

                {loading ? (
                    <div className="py-8 text-center text-muted-foreground">Cargando información...</div>
                ) : (
                    <div className="space-y-6">
                        {/* Indicador de pasos */}
                        <div className="flex items-center justify-center gap-2">
                            <div
                                className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep === 1
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted'
                                    }`}
                            >
                                1
                            </div>
                            <div className="w-12 h-0.5 bg-muted" />
                            <div
                                className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep === 2
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted'
                                    }`}
                            >
                                2
                            </div>
                        </div>

                        {/* Paso 1: Información general */}
                        {currentStep === 1 && (
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="templateName">Nombre de la plantilla *</Label>
                                    <Input
                                        id="templateName"
                                        placeholder="Ej: Evaluación Docente Semestral"
                                        value={templateName}
                                        onChange={(e) => setTemplateName(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="templateDescription">Descripción</Label>
                                    <Textarea
                                        id="templateDescription"
                                        placeholder="Describe el propósito de esta plantilla..."
                                        value={templateDescription}
                                        onChange={(e) => setTemplateDescription(e.target.value)}
                                        rows={3}
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="processType">Tipo de proceso *</Label>
                                    <Select value={processTypeId} onValueChange={setProcessTypeId}>
                                        <SelectTrigger id="processType">
                                            <SelectValue
                                                placeholder={
                                                    loadingTypes
                                                        ? 'Cargando tipos...'
                                                        : 'Seleccione un tipo de proceso'
                                                }
                                            />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {processTypes.map((type) => (
                                                <SelectItem key={type.id} value={type.id.toString()}>
                                                    <div>
                                                        <div>{type.name}</div>
                                                        {/* Remove description if not needed to match style */}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="isActive"
                                        checked={isActive}
                                        onCheckedChange={(c: boolean | "indeterminate") => setIsActive(!!c)}
                                    />
                                    <Label htmlFor="isActive">Plantilla Activa</Label>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="isLocked"
                                        checked={isLocked}
                                        onCheckedChange={(c: boolean | "indeterminate") => setIsLocked(!!c)}
                                    />
                                    <Label htmlFor="isLocked" className="cursor-pointer flex items-center gap-2">
                                        <Lock className="w-4 h-4" />
                                        Bloquear plantilla (solo admins pueden editar)
                                    </Label>
                                </div>

                                {/* Vista previa */}
                                {templateName && processTypeId && (
                                    <Card className="bg-secondary/50">
                                        <CardHeader>
                                            <CardTitle className="text-sm">Vista previa</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-2">
                                            <div>
                                                <span className="text-xs text-muted-foreground">
                                                    Nombre:
                                                </span>
                                                <p>{templateName}</p>
                                            </div>
                                            {templateDescription && (
                                                <div>
                                                    <span className="text-xs text-muted-foreground">
                                                        Descripción:
                                                    </span>
                                                    <p className="text-sm">{templateDescription}</p>
                                                </div>
                                            )}
                                            <div>
                                                <span className="text-xs text-muted-foreground">
                                                    Tipo:
                                                </span>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge>{selectedProcessType?.name}</Badge>
                                                    <Badge variant={isActive ? 'default' : 'secondary'}>{isActive ? 'Activa' : 'Inactiva'}</Badge>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        )}

                        {/* Paso 2: Configurar pasos */}
                        {currentStep === 2 && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-medium">Pasos de la plantilla</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Edite, agregue o elimine los pasos de la plantilla.
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {steps.map((step, index) => (
                                        <Card key={step.id}>
                                            <CardContent className="pt-4">
                                                <div className="flex gap-3">
                                                    {/* Control de orden (Visualización solamente) */}
                                                    <div className="flex flex-col items-center justify-center gap-1 w-8">
                                                        <div className="flex items-center justify-center text-sm font-bold text-muted-foreground bg-muted rounded-full w-6 h-6">
                                                            {step.ord}
                                                        </div>
                                                    </div>

                                                    {/* Contenido del paso */}
                                                    <div className="flex-1 space-y-3">
                                                        <div>
                                                            <Label>Nombre del paso *</Label>
                                                            <Input
                                                                placeholder="Ej: Carga de evidencias"
                                                                value={step.title}
                                                                onChange={(e) =>
                                                                    handleUpdateStep(
                                                                        step.id,
                                                                        'title',
                                                                        e.target.value,
                                                                    )
                                                                }
                                                            />
                                                        </div>

                                                        <div>
                                                            <Label>Descripción</Label>
                                                            <Textarea
                                                                placeholder="Describe qué debe hacerse en este paso..."
                                                                value={step.description}
                                                                onChange={(e) =>
                                                                    handleUpdateStep(
                                                                        step.id,
                                                                        'description',
                                                                        e.target.value,
                                                                    )
                                                                }
                                                                rows={2}
                                                            />
                                                        </div>

                                                        <div className="flex items-center gap-2">
                                                            <Checkbox
                                                                id={`required-${step.id}`}
                                                                checked={step.required}
                                                                onCheckedChange={(checked: boolean | "indeterminate") =>
                                                                    handleUpdateStep(
                                                                        step.id,
                                                                        'required',
                                                                        Boolean(checked),
                                                                    )
                                                                }
                                                            />
                                                            <Label
                                                                htmlFor={`required-${step.id}`}
                                                                className="cursor-pointer"
                                                            >
                                                                Paso requerido
                                                            </Label>
                                                        </div>
                                                    </div>

                                                    {/* Botón eliminar eliminado */}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>

                                {/* Resumen */}
                                <Card className="bg-secondary/50">
                                    <CardContent className="pt-4">
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <span className="text-muted-foreground">
                                                    Total de pasos:
                                                </span>
                                                <span className="ml-2 font-medium">{steps.length}</span>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground">
                                                    Pasos requeridos:
                                                </span>
                                                <span className="ml-2 font-medium">
                                                    {steps.filter((s) => s.required).length}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground">
                                                    Pasos opcionales:
                                                </span>
                                                <span className="ml-2 font-medium">
                                                    {steps.filter((s) => !s.required).length}
                                                </span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {/* Botones de acción */}
                        <div className="flex justify-between pt-4 border-t">
                            <Button
                                variant="destructive"
                                onClick={() => setDeleteDialogOpen(true)}
                                disabled={deleting}
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Eliminar
                            </Button>
                            <div className="flex gap-2">
                                {currentStep === 2 && (
                                    <Button variant="outline" onClick={handleAddStep}>
                                        <Plus className="w-4 h-4 mr-2" />
                                        Agregar Paso
                                    </Button>
                                )}
                                <Button variant="outline" onClick={onClose}>
                                    Cancelar
                                </Button>
                                {currentStep === 2 && (
                                    <Button variant="outline" onClick={handleBack}>
                                        Atrás
                                    </Button>
                                )}
                                {currentStep === 1 ? (
                                    <Button onClick={handleNext}>Siguiente</Button>
                                ) : (
                                    <Button onClick={handleUpdate}>Guardar Cambios</Button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </DialogContent>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-destructive" />
                            Confirmar eliminación
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Estás seguro de que deseas eliminar la plantilla{' '}
                            <strong>"{templateName}"</strong>?
                            <br />
                            <br />
                            Esta acción no se puede deshacer. Si la plantilla tiene procesos
                            asociados, primero deberás eliminarlos.
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
        </Dialog>
    );
}
