// frontend/src/components/UploadDocumentModal.tsx
import { useState, type ChangeEvent, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { File, Upload, X, CheckCircle, FileWarning, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { uploadStepFile } from '../api/stepFiles';
import { Progress } from './ui/progress';
import { cn } from './ui/utils';

interface UploadDocumentModalProps {
  stepId: number;
  open: boolean;
  onClose: () => void;
  onUploaded?: () => void;
}

type UploadStatus = 'idle' | 'validating' | 'uploading' | 'success' | 'error';

const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.zip', '.png', '.jpg', '.jpeg'];
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export function UploadDocumentModal({
  stepId,
  open,
  onClose,
  onUploaded,
}: UploadDocumentModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const validateFile = useCallback((file: File): string | null => {
    if (file.size > MAX_FILE_SIZE_BYTES) return `El archivo excede ${MAX_FILE_SIZE_MB} MB`;
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(extension)) return `Tipo de archivo no permitido`;
    if (file.size === 0) return 'El archivo está vacío';
    return null;
  }, []);

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const processFile = (file: File) => {
    setFileError(null);
    setUploadStatus('validating');
    const error = validateFile(file);
    if (error) {
      setFileError(error);
      setUploadStatus('error');
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
    setUploadStatus('idle');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    try {
      setUploadStatus('uploading');
      setUploadProgress(0);
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => (prev >= 90 ? prev : prev + 10));
      }, 100);

      await uploadStepFile(stepId, selectedFile);

      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadStatus('success');
      toast.success('Archivo subido exitosamente');

      setTimeout(() => {
        onUploaded?.();
        handleClose();
      }, 1000);
    } catch (error: any) {
      console.error(error);
      setUploadStatus('error');
      setFileError(error.response?.data?.message || 'Error al subir el archivo');
      toast.error('Error al subir el archivo');
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setUploadStatus('idle');
    setUploadProgress(0);
    setFileError(null);
    setIsDragOver(false);
    onClose();
  };

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedFile(null);
    setFileError(null);
    setUploadStatus('idle');
  };

  const isUploading = uploadStatus === 'uploading';
  const isSuccess = uploadStatus === 'success';

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md w-[95vw] max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Cargar Documento</DialogTitle>
          <DialogDescription>
            Sube el archivo correspondiente a este paso.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Zona de Carga */}
          <div
            className={cn(
              "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition-all cursor-pointer min-h-[160px]",
              isDragOver && "border-primary bg-primary/5",
              fileError && "border-destructive bg-destructive/5",
              isSuccess && "border-green-500 bg-green-50",
              !isDragOver && !fileError && !isSuccess && "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30",
              selectedFile && !fileError && !isSuccess && "border-primary bg-primary/5"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              id="file-upload"
              type="file"
              className="hidden"
              onChange={handleFileSelect}
              accept={ALLOWED_EXTENSIONS.join(',')}
              disabled={isUploading || isSuccess}
            />

            <label
              htmlFor="file-upload"
              className={cn(
                "cursor-pointer w-full flex flex-col items-center justify-center gap-3",
                (isUploading || isSuccess) && "cursor-default"
              )}
            >
              {isSuccess ? (
                <>
                  <div className="rounded-full bg-green-100 p-3">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="text-sm font-medium text-green-600">¡Archivo subido!</div>
                </>
              ) : selectedFile ? (
                <>
                  <div className="rounded-full bg-primary/10 p-3">
                    <File className="h-6 w-6 text-primary" />
                  </div>
                  <div className="w-full max-w-[280px] text-center">
                    <p className="text-sm font-medium truncate" title={selectedFile.name}>
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                  {!isUploading && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={handleRemoveFile}
                    >
                      <X className="w-3 h-3 mr-1" /> Quitar archivo
                    </Button>
                  )}
                </>
              ) : fileError ? (
                <>
                  <div className="rounded-full bg-destructive/10 p-3">
                    <FileWarning className="h-6 w-6 text-destructive" />
                  </div>
                  <div className="text-sm font-medium text-destructive">{fileError}</div>
                  <p className="text-xs text-muted-foreground">Haz clic para seleccionar otro</p>
                </>
              ) : (
                <>
                  <div className="rounded-full bg-muted p-3">
                    <Upload className={cn(
                      "h-6 w-6 transition-colors",
                      isDragOver ? "text-primary" : "text-muted-foreground"
                    )} />
                  </div>
                  <div>
                    <span className="font-medium text-primary text-sm">Clic para seleccionar</span>
                    <span className="text-sm text-muted-foreground"> o arrastra aquí</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    PDF, Word, Excel, ZIP o imágenes (máx. {MAX_FILE_SIZE_MB}MB)
                  </p>
                </>
              )}
            </label>
          </div>

          {/* Progress Bar */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Subiendo archivo...
                </span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose} disabled={isUploading}>
            {isSuccess ? 'Cerrar' : 'Cancelar'}
          </Button>
          {!isSuccess && (
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading || !!fileError}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Subir Archivo
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}