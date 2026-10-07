import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore - Vite worker URL import
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';

// Configure worker source using local Vite asset URL
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
  } catch (e) {
    console.warn('PDF.js worker initialization notice:', e);
  }
}

export interface PdfRenderResult {
  dataUrl: string;
  totalPages: number;
  currentPage: number;
}

export interface MultiPagePdfResult {
  pages: string[]; // array of base64 PNG data URLs for every page
  totalPages: number;
}

export { extractDfmFromPdf } from './pdfExport';

/**
 * Converts a specific page of a PDF file to a high-resolution PNG data URL.
 * Renders at 2x scale to keep technical CAD lines and GD&T symbols razor sharp.
 */
export async function convertPdfToImage(file: File, pageNumber: number = 1): Promise<string> {
  const result = await renderPdfPage(file, pageNumber);
  return result.dataUrl;
}

/**
 * Converts ALL pages of a multi-page PDF into an array of crisp PNG images.
 */
export async function convertPdfToAllPages(
  file: File, 
  onProgress?: (current: number, total: number) => void
): Promise<MultiPagePdfResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
      cMapPacked: true,
    });

    const pdfDoc = await loadingTask.promise;
    const totalPages = pdfDoc.numPages;
    const pages: string[] = [];

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      onProgress?.(pageNum, totalPages);
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: 2.2 });
      const canvas = document.createElement('canvas');
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      const ctx = canvas.getContext('2d');

      if (ctx) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // @ts-ignore - canvas parameter for pdfjs-dist RenderParameters
        await page.render({ canvasContext: ctx, viewport, canvas }).promise;
        pages.push(canvas.toDataURL('image/png'));
      }
    }

    return {
      pages,
      totalPages,
    };
  } catch (err: any) {
    console.error('Multi-page PDF rendering error:', err);
    throw new Error(`Failed to render multi-page PDF: ${err.message || 'Error processing document'}`);
  }
}

export async function renderPdfPage(file: File, pageNumber: number = 1): Promise<PdfRenderResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
      cMapPacked: true,
    });

    const pdfDoc = await loadingTask.promise;
    const totalPages = pdfDoc.numPages;
    const targetPage = Math.min(Math.max(pageNumber, 1), totalPages);
    const page = await pdfDoc.getPage(targetPage);
    
    // Scale 2.2 gives crisp high DPI suitable for drawing inspection and GD&T
    const viewport = page.getViewport({ scale: 2.2 });

    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Canvas 2D context not available');
    }

    // Fill white background for engineering drawing
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const renderContext = {
      canvasContext: ctx,
      viewport: viewport,
      canvas: canvas,
    };

    await page.render(renderContext).promise;
    return {
      dataUrl: canvas.toDataURL('image/png'),
      totalPages,
      currentPage: targetPage,
    };
  } catch (err: any) {
    console.error('PDF rendering error:', err);
    throw new Error(`Failed to render PDF: ${err.message || 'Corrupt or unreadable PDF document'}`);
  }
}
