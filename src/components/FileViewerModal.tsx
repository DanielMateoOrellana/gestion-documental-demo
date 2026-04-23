import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from './ui/dialog';
import { Loader2 } from 'lucide-react';

interface FileViewerModalProps {
    isOpen: boolean;
    onClose: () => void;
    fileUrl: string;
    fileName: string;
}

export function FileViewerModal({
    isOpen,
    onClose,
    fileUrl,
    fileName,
}: FileViewerModalProps) {
    const [loading, setLoading] = useState(true);

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            setLoading(true);
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent
                style={{
                    maxWidth: '95vw',
                    width: '95vw',
                    height: '90vh',
                    maxHeight: '90vh',
                    padding: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0,
                }}
                className="bg-white sm:max-w-none"
            >
                <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
                    <DialogTitle className="text-lg font-semibold truncate pr-10">
                        {fileName}
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                        Previsualización del archivo
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 relative w-full min-h-0 bg-slate-100 overflow-hidden">
                    {loading && (
                        <div className="absolute inset-0 flex items-center justify-center z-10 bg-white/90 backdrop-blur-sm">
                            <div className="flex flex-col items-center gap-3">
                                <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                                <span className="text-sm font-medium text-slate-600">
                                    Cargando documento...
                                </span>
                            </div>
                        </div>
                    )}

                    {fileUrl ? (
                        <iframe
                            src={fileUrl}
                            title={fileName}
                            className="w-full h-full border-none block"
                            onLoad={() => setLoading(false)}
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full text-red-500 font-medium">
                            No se pudo cargar el archivo
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}