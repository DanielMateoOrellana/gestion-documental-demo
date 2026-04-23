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
import { Plus, Trash2, Lock } from 'lucide-react';
import { toast } from 'sonner';

import { fetchProcessTypes, type ProcessType } from '../api/processTypes';
import {
  createProcessTemplate,
  type CreateProcessTemplateInput,
  type CreateTemplateStepInput,
} from '../api/processTemplates';

interface CreateTemplateModalProps {
  open: boolean;
  onClose: () => void;
}

interface TemplateStep {
  id: string;
  title: string;
  description: string;
  required: boolean;
  ord: number;
}

export function CreateTemplateModal({ open, onClose }: CreateTemplateModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [processTypeId, setProcessTypeId] = useState('');
  const [steps, setSteps] = useState<TemplateStep[]>([
    { id: '1', title: '', description: '', required: true, ord: 1 },
  ]);
  const [isLocked, setIsLocked] = useState(false);

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

  const handleAddStep = () => {
    const newStep: TemplateStep = {
      id: Date.now().toString(),
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

  const handleCreate = async () => {
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

    const payload: CreateProcessTemplateInput = {
      name: templateName,
      description: templateDescription,
      processTypeId: parseInt(processTypeId, 10),
      isActive: true,
      isLocked: isLocked,
      steps: stepsPayload,
    };

    try {
      const created = await createProcessTemplate(payload);
      console.info('Plantilla creada en demo:', created);
      toast.success(
        `Plantilla "${created.name}" creada exitosamente con ${created.steps?.length ?? steps.length
        } pasos`,
      );
      handleClose();
    } catch (error) {
      console.error(error);
      toast.error('Error al crear la plantilla');
    }
  };

  const handleClose = () => {
    setCurrentStep(1);
    setTemplateName('');
    setTemplateDescription('');
    setProcessTypeId('');
    setIsLocked(false);
    setSteps([{ id: '1', title: '', description: '', required: true, ord: 1 }]);
    onClose();
  };

  const selectedProcessType = processTypes.find(
    (pt) => pt.id.toString() === processTypeId,
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {currentStep === 1
              ? 'Nueva Plantilla - Información General'
              : 'Nueva Plantilla - Configurar Pasos'}
          </DialogTitle>
        </DialogHeader>

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
                  placeholder="Ej: Revisión de Contratos"
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
                          <div className="text-xs text-muted-foreground">
                            {type.description}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Checkbox de bloqueo */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isLocked"
                  checked={isLocked}
                  onCheckedChange={(checked: boolean) => setIsLocked(Boolean(checked))}
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
                    Configure los pasos que tendrá esta plantilla
                  </p>
                </div>
                <Button onClick={handleAddStep} size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  Agregar paso
                </Button>
              </div>

              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {steps.map((step, index) => (
                  <Card key={step.id}>
                    <CardContent className="pt-4">
                      <div className="flex gap-3">
                        {/* Control de orden */}
                        <div className="flex flex-col gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMoveStep(index, 'up')}
                            disabled={index === 0}
                          >
                            ▲
                          </Button>
                          <div className="flex items-center justify-center text-sm text-muted-foreground">
                            {step.ord}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMoveStep(index, 'down')}
                            disabled={index === steps.length - 1}
                          >
                            ▼
                          </Button>
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
                              onCheckedChange={(checked: boolean) =>
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

                        {/* Botón eliminar */}
                        <div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveStep(step.id)}
                            disabled={steps.length === 1}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
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
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <div className="flex gap-2">
              {currentStep === 2 && (
                <Button variant="outline" onClick={handleAddStep}>
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Paso
                </Button>
              )}
              {currentStep === 2 && (
                <Button variant="outline" onClick={handleBack}>
                  Atrás
                </Button>
              )}
              {currentStep === 1 ? (
                <Button onClick={handleNext}>Siguiente</Button>
              ) : (
                <Button onClick={handleCreate}>Crear plantilla</Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
