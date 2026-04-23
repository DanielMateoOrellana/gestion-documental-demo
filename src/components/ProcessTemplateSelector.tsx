import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { FileText, CheckCircle, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

import type { ProcessType } from '../api/processTypes';
import { fetchProcessTypes } from '../api/processTypes';
import type { ProcessTemplate } from '../api/processTemplates';
import { fetchProcessTemplates } from '../api/processTemplates';

interface ProcessTemplateSelectorProps {
  open: boolean;
  onClose: () => void;
  onCreateProcess: (processTypeId: number, templateId: number) => void;
}

export function ProcessTemplateSelector({
  open,
  onClose,
  onCreateProcess,
}: ProcessTemplateSelectorProps) {
  const [processTypes, setProcessTypes] = useState<ProcessType[]>([]);
  const [templates, setTemplates] = useState<ProcessTemplate[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    const load = async () => {
      try {
        setLoading(true);
        const [types, templatesFromApi] = await Promise.all([
          fetchProcessTypes(),
          fetchProcessTemplates(),
        ]);
        setProcessTypes(types.filter((t) => t.isActive));
        setTemplates(templatesFromApi);
      } catch (error) {
        console.error(error);
        toast.error('Error al cargar tipos de proceso o plantillas');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [open]);

  const getTemplatesForType = (typeId: number): ProcessTemplate[] => {
    return templates.filter((t) => t.processTypeId === typeId && t.isActive);
  };

  const selectedType = selectedTypeId
    ? processTypes.find((pt) => pt.id === selectedTypeId)
    : null;

  const availableTemplates = selectedTypeId ? getTemplatesForType(selectedTypeId) : [];

  const selectedTemplate = selectedTemplateId
    ? availableTemplates.find((t) => t.id === selectedTemplateId)
    : availableTemplates[0];

  const handleTypeSelect = (typeId: number) => {
    setSelectedTypeId(typeId);
    const t = getTemplatesForType(typeId);
    setSelectedTemplateId(t.length > 0 ? t[0].id : null);
  };

  const handleCreateProcess = () => {
    if (!selectedTypeId || !selectedTemplate) {
      toast.error('Por favor seleccione un tipo de proceso y una plantilla');
      return;
    }

    onCreateProcess(selectedTypeId, selectedTemplate.id);
  };

  const handleClose = () => {
    setSelectedTypeId(null);
    setSelectedTemplateId(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Proceso</DialogTitle>
          <DialogDescription>
            Seleccione el tipo de proceso y la plantilla que desea utilizar
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step 1: Select Process Type */}
          <div>
            <h3 className="mb-3">Paso 1: Seleccione el Tipo de Proceso</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {processTypes.map((type) => {
                const relatedTemplates = getTemplatesForType(type.id);
                const isSelected = selectedTypeId === type.id;

                return (
                  <Card
                    key={type.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${isSelected ? 'ring-2 ring-primary' : ''
                      }`}
                    onClick={() => handleTypeSelect(type.id)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base">{type.name}</CardTitle>
                          <CardDescription className="mt-1">
                            {type.description}
                          </CardDescription>
                        </div>
                        {isSelected && (
                          <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 ml-2" />
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <Badge variant="outline">
                          {relatedTemplates.length}{' '}
                          {relatedTemplates.length === 1 ? 'plantilla' : 'plantillas'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {loading && processTypes.length === 0 && (
                <p className="text-sm text-muted-foreground">Cargando tipos...</p>
              )}
            </div>
          </div>

          {/* Step 2: Select Template (if multiple available) */}
          {selectedType && availableTemplates.length > 0 && (
            <div>
              <h3 className="mb-3">Paso 2: Seleccione la Plantilla</h3>
              {availableTemplates.length > 1 ? (
                <Select
                  value={
                    selectedTemplateId?.toString() || availableTemplates[0]?.id.toString()
                  }
                  onValueChange={(value: string) => setSelectedTemplateId(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id.toString()}>
                        {template.name || template.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      {selectedTemplate?.name || selectedTemplate?.description}
                    </CardTitle>
                    {selectedTemplate?.description && (
                      <CardDescription>{selectedTemplate.description}</CardDescription>
                    )}
                  </CardHeader>
                </Card>
              )}
            </div>
          )}

          {selectedType && availableTemplates.length === 0 && !loading && (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4" />
              <p>No hay plantillas activas disponibles para este tipo de proceso</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleCreateProcess}
            disabled={!selectedTypeId || !selectedTemplate || loading}
          >
            Crear Proceso
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
