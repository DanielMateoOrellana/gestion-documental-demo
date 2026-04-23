import {
    countDemoFolderFiles,
    getDemoFolderDownload,
    simulateRequest,
} from '../demo/demoStore';

export type FolderType = 'category' | 'processType' | 'process' | 'step';

export async function downloadFolder(type: FolderType, id: number): Promise<void> {
    const response = await simulateRequest(() => getDemoFolderDownload(type, id));
    const filename = response.fileName || 'descarga.zip';

    const blob = response.blob;
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
}

export async function countFolderFiles(type: FolderType, id: number): Promise<number> {
    return simulateRequest(() => countDemoFolderFiles(type, id));
}
