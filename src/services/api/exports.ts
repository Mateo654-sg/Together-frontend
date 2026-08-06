import apiClient from '@/config/api';
import type { ExportHistory } from '@/types/api';

export type ExportFormat = 'pdf' | 'excel' | 'csv';

const MIME_TYPES: Record<ExportFormat, string> = {
  pdf: 'application/pdf',
  excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  csv: 'text/csv',
};

export const exportsApi = {
  async exportFinances(
    format: ExportFormat,
    params: { date_from?: string; date_to?: string } = {}
  ): Promise<{ filename: string; blob: Blob }> {
    const response = await apiClient.post<Blob>(`/exports/${format}`, params, {
      responseType: 'blob',
    });
    const blob = new Blob([response.data], { type: MIME_TYPES[format] });
    const disposition = response.headers['content-disposition'] ?? '';
    const match = /filename="?([^";]+)"?/.exec(disposition);
    const filename = match?.[1] ?? `finanzas.${format === 'excel' ? 'xlsx' : format}`;
    return { filename, blob };
  },
  async list(): Promise<ExportHistory> {
    const response = await apiClient.get<ExportHistory>('/exports');
    return response.data;
  },
};

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
