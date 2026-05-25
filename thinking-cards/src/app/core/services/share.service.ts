import { Injectable } from '@angular/core';

export type ShareResult = 'shared' | 'copied' | 'downloaded' | 'failed';

@Injectable({ providedIn: 'root' })
export class ShareService {
  async share(text: string): Promise<ShareResult> {
    if (navigator.share) {
      try {
        await navigator.share({ text });
        return 'shared';
      } catch (e) {
        if (e instanceof Error && e.name === 'AbortError') return 'failed';
      }
    }

    try {
      await navigator.clipboard.writeText(text);
      return 'copied';
    } catch {
      return 'failed';
    }
  }

  async shareImage(blob: Blob, fallbackText: string): Promise<ShareResult> {
    const file = new File([blob], 'thinking-card.png', { type: 'image/png' });

    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file] });
        return 'shared';
      } catch (e) {
        if (e instanceof Error && e.name === 'AbortError') return 'failed';
      }
    }

    this.downloadBlob(blob, 'thinking-card.png');
    return 'downloaded';
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
