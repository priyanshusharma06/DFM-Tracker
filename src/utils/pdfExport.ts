import { PDFDocument, rgb, StandardFonts, PDFName, PDFArray, PDFHexString } from 'pdf-lib';
import { DFMProject, DrawingRevision, BalloonItem } from '../types/dfm';

const DFM_PAYLOAD_MARKER_START = '###DFM_METADATA_START###';
const DFM_PAYLOAD_MARKER_END = '###DFM_METADATA_END###';

/**
 * Encodes DFM project balloons into a compact base64 JSON string.
 * Strips out heavy base64 image snips to keep document metadata lightweight and durable.
 */
export function encodeDfmPayload(revision: DrawingRevision, project: DFMProject): string {
  const lightweightBalloons = revision.balloons.map((b) => {
    const { drawingSnipUrl, ...rest } = b;
    return {
      ...rest,
      sheetNumber: Number(b.sheetNumber) || 1,
    };
  });

  const payload = {
    appVersion: '2.5.0',
    exportedAt: new Date().toISOString(),
    partNumber: project.partNumber,
    partName: project.partName,
    revCode: revision.revCode,
    iteration: revision.iteration || 1,
    balloons: lightweightBalloons,
  };
  const jsonStr = JSON.stringify(payload);
  // Safe utf8 base64
  return btoa(unescape(encodeURIComponent(jsonStr)));
}

/**
 * Decodes DFM payload from PDF file if present
 */
export async function extractDfmFromPdf(file: File): Promise<{
  partNumber?: string;
  partName?: string;
  revCode?: string;
  iteration?: number;
  balloons: BalloonItem[];
  totalPages?: number;
} | null> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    let encodedStr = '';
    let loadedDoc: PDFDocument | null = null;

    // 1. Try reading via pdf-lib document catalog & metadata
    try {
      loadedDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

      // Check native custom catalog key
      try {
        const catPayload = loadedDoc.catalog.get(PDFName.of('DFM_PAYLOAD')) as any;
        if (catPayload) {
          if (typeof catPayload.decodeText === 'function') {
            encodedStr = catPayload.decodeText();
          } else if (typeof catPayload.asString === 'function') {
            encodedStr = catPayload.asString();
          }
        }
      } catch (eCat) {
        console.warn('Catalog check notice:', eCat);
      }

      // Check subject
      if (!encodedStr) {
        const subject = loadedDoc.getSubject();
        if (subject && subject.includes(DFM_PAYLOAD_MARKER_START)) {
          const startIdx = subject.indexOf(DFM_PAYLOAD_MARKER_START) + DFM_PAYLOAD_MARKER_START.length;
          const endIdx = subject.indexOf(DFM_PAYLOAD_MARKER_END, startIdx);
          if (endIdx > startIdx) {
            encodedStr = subject.substring(startIdx, endIdx);
          }
        }
      }

      // Check keywords
      if (!encodedStr) {
        const keywords = loadedDoc.getKeywords();
        if (keywords) {
          for (const kw of Array.isArray(keywords) ? keywords : [keywords]) {
            if (kw && kw.includes(DFM_PAYLOAD_MARKER_START)) {
              const startIdx = kw.indexOf(DFM_PAYLOAD_MARKER_START) + DFM_PAYLOAD_MARKER_START.length;
              const endIdx = kw.indexOf(DFM_PAYLOAD_MARKER_END, startIdx);
              if (endIdx > startIdx) {
                encodedStr = kw.substring(startIdx, endIdx);
                break;
              }
            }
          }
        }
      }
    } catch (e) {
      console.warn('Metadata inspection notice:', e);
    }

    // 2. Binary stream scanning fallback (handles modified / re-saved Acrobat PDFs)
    if (!encodedStr) {
      const decoder = new TextDecoder('latin1');
      const text = decoder.decode(arrayBuffer);
      const startIdx = text.indexOf(DFM_PAYLOAD_MARKER_START);
      if (startIdx !== -1) {
        const afterStart = startIdx + DFM_PAYLOAD_MARKER_START.length;
        const endIdx = text.indexOf(DFM_PAYLOAD_MARKER_END, afterStart);
        if (endIdx !== -1) {
          encodedStr = text.substring(afterStart, endIdx).trim();
        }
      }
    }

    if (encodedStr) {
      let jsonStr = '';
      try {
        jsonStr = decodeURIComponent(escape(atob(encodedStr)));
      } catch {
        jsonStr = atob(encodedStr);
      }

      const parsed = JSON.parse(jsonStr);
      if (parsed && Array.isArray(parsed.balloons)) {
        const normalizedBalloons = parsed.balloons.map((b: any) => ({
          ...b,
          sheetNumber: Number(b.sheetNumber) || 1,
        }));
        return {
          partNumber: parsed.partNumber,
          partName: parsed.partName,
          revCode: parsed.revCode,
          iteration: parsed.iteration,
          balloons: normalizedBalloons,
          totalPages: loadedDoc ? loadedDoc.getPageCount() : undefined,
        };
      }
    }

    // 3. Fallback: inspect Adobe Acrobat Comments / Annots per page
    if (loadedDoc) {
      const pageCount = loadedDoc.getPageCount();
      const extractedAnnots: BalloonItem[] = [];

      for (let pIdx = 0; pIdx < pageCount; pIdx++) {
        const pg = loadedDoc.getPage(pIdx);
        const pageNum = pIdx + 1;
        const annots = pg.node.get(PDFName.of('Annots')) as any;
        if (annots && typeof annots.asArray === 'function') {
          const arr = annots.asArray();
          for (let aIdx = 0; aIdx < arr.length; aIdx++) {
            const aRef = arr[aIdx];
            const aDict = loadedDoc.context.lookup(aRef) as any;
            if (!aDict) continue;
            const contents = aDict.get(PDFName.of('Contents'))?.asString?.() || '';
            const rect = aDict.get(PDFName.of('Rect'))?.asArray?.();
            let x = 30 + ((aIdx % 3) * 20);
            let y = 30 + (Math.floor(aIdx / 3) * 20);
            if (rect && rect.length >= 4) {
              const rx = rect[0].asNumber?.() || 0;
              const ry = rect[1].asNumber?.() || 0;
              const { width, height } = pg.getSize();
              const margin = 20;
              const dwgW = width - margin * 2;
              const dwgH = height - (margin + 35) - margin;
              x = Math.max(2, Math.min(98, ((rx - margin) / dwgW) * 100));
              y = Math.max(2, Math.min(98, 100 - ((ry - (margin + 35)) / dwgH) * 100));
            }
            const bNum = extractedAnnots.length + 1;
            extractedAnnots.push({
              id: `b-pdf-page-${pageNum}-${bNum}-${Date.now()}`,
              balloonNumber: bNum,
              customLabel: `#${bNum}`,
              x: Math.round(x * 10) / 10,
              y: Math.round(y * 10) / 10,
              sheetNumber: pageNum,
              viewName: `Sheet ${pageNum}`,
              featureName: `Feature #${bNum}`,
              dimensionType: 'LINEAR',
              dimensionNature: 'STANDARD',
              nominalValue: '',
              upperTol: '',
              lowerTol: '',
              unit: 'mm',
              criticalCharacteristic: false,
              isRelevant: true,
              isVisible: true,
              status: 'UNCHANGED',
              issueDescription: contents,
              markupType: 'CIRCLE',
              markupCoordinates: {
                minX: Math.max(0.5, x - 3),
                minY: Math.max(0.5, y - 3),
                width: 6,
                height: 6,
              },
              originRevisionId: 'pdf-import',
              originRevisionName: 'Imported PDF',
              feedbackList: contents ? [{
                id: `fb-annot-${pageNum}-${bNum}`,
                role: 'AO',
                authorName: 'Acrobat Reviewer',
                comment: contents,
                timestamp: new Date().toISOString(),
                revisionId: 'pdf-import',
              }] : [],
              revisionHistory: [],
            });
          }
        }
      }

      if (extractedAnnots.length > 0) {
        return {
          balloons: extractedAnnots,
          totalPages: pageCount,
        };
      }
    }
  } catch (err) {
    console.warn('Notice: PDF does not contain embedded DFM metadata payload:', err);
  }
  return null;
}

/**
 * Helper to rasterize an SVG or Image URL to high resolution canvas data
 */
async function rasterizeToCanvas(
  drawingUrl: string, 
  targetWidth: number = 2200, 
  targetHeight: number = 1500
): Promise<Uint8Array | null> {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      let src = drawingUrl;
      if (drawingUrl.startsWith('<svg')) {
        src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(drawingUrl)))}`;
      }

      img.onload = () => {
        try {
          const natW = img.naturalWidth || img.width || 2200;
          const natH = img.naturalHeight || img.height || 1500;
          const maxDim = 2400;
          const scale = Math.min(1, maxDim / Math.max(natW, natH));
          const actualW = Math.max(100, Math.round(natW * scale));
          const actualH = Math.max(100, Math.round(natH * scale));

          const offCanvas = document.createElement('canvas');
          offCanvas.width = actualW;
          offCanvas.height = actualH;
          const ctx = offCanvas.getContext('2d');
          if (!ctx) return resolve(null);

          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, actualW, actualH);
          ctx.drawImage(img, 0, 0, actualW, actualH);

          const pngDataUrl = offCanvas.toDataURL('image/png');
          const base64 = pngDataUrl.split(',')[1];
          const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
          resolve(bytes);
        } catch {
          resolve(null);
        }
      };

      img.onerror = () => resolve(null);
      img.src = src;
    } catch {
      resolve(null);
    }
  });
}

/**
 * Exports drawing print as an Adobe Acrobat compatible PDF with:
 * 1. Embedded vector / raster CAD drawing
 * 2. Visual pen circles, highlighters, leader lines, and numbered balloon tags
 * 3. Real Adobe Acrobat PDF Comment Annotations (/Annots) that display in Adobe Reader's Comments panel!
 * 4. Embedded DFM metadata payload for restoring exact visuals when re-imported into Loop 2!
 */
export async function exportDfmDrawingPdf(
  project: DFMProject,
  revision: DrawingRevision,
  options?: {
    onProgress?: (msg: string) => void;
  }
): Promise<string> {
  options?.onProgress?.('Initializing Adobe Acrobat PDF engine...');

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Landscape A3 engineering sheet (1190 x 842 pt)
  const pageWidth = 1190;
  const pageHeight = 842;

  // Determine pages to render
  const drawingPages = (revision.drawingPages && revision.drawingPages.length > 0)
    ? revision.drawingPages
    : [revision.drawingUrl];

  const totalPages = drawingPages.length;

  for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
    const pageNum = pageIdx + 1;
    options?.onProgress?.(`Processing CAD Sheet ${pageNum} of ${totalPages}...`);

    const page = pdfDoc.addPage([pageWidth, pageHeight]);

    // Filter balloons belonging to this sheet
    const sheetBalloons = revision.balloons.filter((b) => {
      const bSheet = b.sheetNumber || 1;
      return bSheet === pageNum;
    });

    // Embed sheet background
    const pageUrl = drawingPages[pageIdx];
    let embeddedImage: any = null;

    if (pageUrl) {
      if (pageUrl.startsWith('data:image/png')) {
        const base64Data = pageUrl.split(',')[1];
        const bytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
        embeddedImage = await pdfDoc.embedPng(bytes);
      } else if (pageUrl.startsWith('data:image/jpeg') || pageUrl.startsWith('data:image/jpg')) {
        const base64Data = pageUrl.split(',')[1];
        const bytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
        embeddedImage = await pdfDoc.embedJpg(bytes);
      } else {
        const pngBytes = await rasterizeToCanvas(pageUrl, 2200, 1500);
        if (pngBytes) {
          embeddedImage = await pdfDoc.embedPng(pngBytes);
        }
      }
    }

    // Sheet White background
    page.drawRectangle({
      x: 0,
      y: 0,
      width: pageWidth,
      height: pageHeight,
      color: rgb(1, 1, 1),
    });

    // Margins
    const margin = 20;
    const dwgX = margin;
    const dwgY = margin + 35;
    const dwgW = pageWidth - margin * 2;
    const dwgH = pageHeight - dwgY - margin;

    if (embeddedImage) {
      page.drawImage(embeddedImage, {
        x: dwgX,
        y: dwgY,
        width: dwgW,
        height: dwgH,
      });
    }

    // Outer engineering drawing border
    page.drawRectangle({
      x: dwgX,
      y: dwgY,
      width: dwgW,
      height: dwgH,
      borderColor: rgb(0.15, 0.15, 0.15),
      borderWidth: 1.5,
    });

    // Top banner
    page.drawRectangle({
      x: dwgX,
      y: pageHeight - margin - 24,
      width: dwgW,
      height: 24,
      color: rgb(0.08, 0.08, 0.08),
    });

    page.drawText(`STRYKER DFM REVIEW • PART: ${project.partNumber} (${project.partName}) • ${revision.revCode} • SHEET ${pageNum}/${totalPages}`, {
      x: dwgX + 12,
      y: pageHeight - margin - 17,
      size: 10,
      font,
      color: rgb(1, 0.82, 0), // Stryker Yellow
    });

    page.drawText(`Exported for Adobe Acrobat PDF Review: ${new Date().toLocaleDateString()}`, {
      x: dwgX + dwgW - 250,
      y: pageHeight - margin - 17,
      size: 9,
      font: regularFont,
      color: rgb(0.85, 0.85, 0.85),
    });

    // Array for Adobe Acrobat PDF Comment Annotations
    const annotationsArray = pdfDoc.context.obj([]) as PDFArray;

    for (const b of sheetBalloons) {
      const featPdfX = dwgX + (b.x / 100) * dwgW;
      const featPdfY = dwgY + ((100 - b.y) / 100) * dwgH;

      let targetPdfX = featPdfX;
      let targetPdfY = featPdfY;
      if (b.leaderTargetX !== undefined && b.leaderTargetY !== undefined) {
        targetPdfX = dwgX + (b.leaderTargetX / 100) * dwgW;
        targetPdfY = dwgY + ((100 - b.leaderTargetY) / 100) * dwgH;
      }

      const isAddressed = b.status === 'ADDRESSED';
      const isAttention = b.status === 'ATTENTION';

      const colorRgb = isAddressed 
        ? rgb(0.06, 0.73, 0.51) // Emerald Green
        : isAttention 
        ? rgb(0.88, 0.11, 0.28) // Red
        : rgb(1, 0.82, 0);       // Stryker Yellow

      // 1. Draw Visual Markups (Adobe Highlight or Pen Circle)
      if (b.markupCoordinates) {
        const boxX = dwgX + (b.markupCoordinates.minX / 100) * dwgW;
        const boxW = (b.markupCoordinates.width / 100) * dwgW;
        const boxH = (b.markupCoordinates.height / 100) * dwgH;
        const boxY = dwgY + ((100 - (b.markupCoordinates.minY + b.markupCoordinates.height)) / 100) * dwgH;

        if (b.markupType === 'HIGHLIGHT') {
          page.drawRectangle({
            x: boxX,
            y: boxY,
            width: boxW,
            height: boxH,
            color: colorRgb,
            opacity: 0.45,
            borderColor: colorRgb,
            borderWidth: 1,
          });
        } else {
          // Pen Circle - Transparent fill per user requirement so CAD background remains 100% visible
          page.drawEllipse({
            x: boxX + boxW / 2,
            y: boxY + boxH / 2,
            xScale: Math.max(boxW / 2, 8),
            yScale: Math.max(boxH / 2, 8),
            borderColor: colorRgb,
            borderWidth: 2,
          });
        }
      }

      // 2. Leader Line
      page.drawLine({
        start: { x: featPdfX, y: featPdfY },
        end: { x: targetPdfX, y: targetPdfY },
        thickness: 1.2,
        color: rgb(0, 0, 0),
      });

      page.drawCircle({
        x: targetPdfX,
        y: targetPdfY,
        size: 2.5,
        color: colorRgb,
      });

      // 3. Numbered Balloon Circle
      page.drawCircle({
        x: featPdfX,
        y: featPdfY,
        size: 11,
        color: colorRgb,
        borderColor: rgb(0, 0, 0),
        borderWidth: 1.5,
      });

      // Balloon Number
      const numStr = String(b.balloonNumber);
      const textWidth = font.widthOfTextAtSize(numStr, 8);
      page.drawText(numStr, {
        x: featPdfX - textWidth / 2,
        y: featPdfY - 3,
        size: 8,
        font,
        color: isAddressed || isAttention ? rgb(1, 1, 1) : rgb(0, 0, 0),
      });

      // 4. Create Real Adobe Acrobat PDF Comment Annotation (/Annots)
      const authorText = getPrimaryAuthor(b);
      const subjectText = `Feature #${b.balloonNumber}: ${b.featureName || 'DFM Characteristic'}`;
      const commentContent = formatAcrobatComment(b);

      const annotDict = pdfDoc.context.obj({
        Type: PDFName.of('Annot'),
        Subtype: PDFName.of('Text'), // Sticky Note / Comment in Adobe Acrobat
        Rect: [featPdfX - 12, featPdfY - 12, featPdfX + 12, featPdfY + 12],
        Contents: PDFHexString.fromText(commentContent),
        T: PDFHexString.fromText(authorText),
        Subj: PDFHexString.fromText(subjectText),
        C: isAddressed ? [0.06, 0.73, 0.51] : isAttention ? [0.88, 0.11, 0.28] : [1, 0.82, 0],
        Name: PDFName.of('Comment'),
        F: 4, // Printable flag
        Open: false,
      });

      const annotRef = pdfDoc.context.register(annotDict);
      annotationsArray.push(annotRef);
    }

    // Attach comments to PDF Page
    page.node.set(PDFName.of('Annots'), annotationsArray);
  }

  // 5. Embed Full DFM Metadata Payload into document catalog & properties
  options?.onProgress?.('Embedding DFM audit trail payload...');
  const encodedPayload = encodeDfmPayload(revision, project);
  const metadataString = `${DFM_PAYLOAD_MARKER_START}${encodedPayload}${DFM_PAYLOAD_MARKER_END}`;

  try {
    pdfDoc.catalog.set(PDFName.of('DFM_PAYLOAD'), PDFHexString.fromText(encodedPayload));
  } catch (eCat) {
    console.warn('Could not set catalog DFM_PAYLOAD:', eCat);
  }

  pdfDoc.setTitle(`Drawing Review - ${project.partNumber} ${revision.revCode}`);
  pdfDoc.setAuthor('Stryker Advanced Operations (AO)');
  pdfDoc.setSubject(`${DFM_PAYLOAD_MARKER_START}${encodedPayload}${DFM_PAYLOAD_MARKER_END}`);
  pdfDoc.setKeywords(['Drawing_Review', project.partNumber, revision.revCode, metadataString]);

  options?.onProgress?.('Saving Adobe Acrobat PDF...');
  const pdfBytes = await pdfDoc.save({ useObjectStreams: false });

  // Trigger download with required naming format: drawing_review_DrawingNumber_Revision_Iteration.pdf
  const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
  const cleanDrawingNum = (project.partNumber || 'Drawing').replace(/[^a-zA-Z0-9_-]/g, '_');
  const cleanRev = (revision.revCode || 'Rev_0.1').replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_.-]/g, '_');
  const iterPart = revision.iteration ? `_Iter${revision.iteration}` : '';
  const filename = `drawing_review_${cleanDrawingNum}_${cleanRev}${iterPart}.pdf`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return filename;
}

/**
 * Formats rich multi-line comment for Adobe Acrobat Comment Panel
 */
function formatAcrobatComment(b: BalloonItem): string {
  const lines: string[] = [];

  lines.push(`FEATURE #${b.balloonNumber}: ${b.featureName || 'Characteristic Callout'}`);
  lines.push(`STATUS: ${b.status} (${b.status === 'ADDRESSED' ? 'Verified / Closed' : b.status === 'ATTENTION' ? 'Needs Attention' : 'Open / Unchanged'})`);

  if (b.nominalValue || b.upperTol || b.lowerTol) {
    const tol = b.upperTol && b.lowerTol ? `(${b.upperTol}/${b.lowerTol})` : b.upperTol || b.lowerTol || '';
    lines.push(`SPECIFICATION: ${b.nominalValue || ''} ${tol} ${b.unit || 'mm'}`.trim());
  }

  lines.push('----------------------------------------');

  // Manufacturing Findings & Concerns
  if (b.issueDescription) {
    lines.push(`[Manufacturing Finding]:\n${b.issueDescription}`);
  }
  if (b.proposedChange) {
    lines.push(`[Proposed Relaxation]:\n${b.proposedChange}`);
  }

  // Multi-stakeholder threads (AO, Inspection, Supplier)
  if (b.feedbackList && b.feedbackList.length > 0) {
    lines.push('\n[Multi-Stakeholder Feedback]:');
    for (const f of b.feedbackList) {
      lines.push(`- [${f.role} - ${f.authorName}]: ${f.comment}${f.proposedChange ? ` (Proposed: ${f.proposedChange})` : ''}`);
    }
  }

  // Design Decision
  if (b.rdResponse?.status) {
    lines.push(`\n[Design Engineering Concurrence]: ${b.rdResponse.status}`);
    if (b.rdResponse.comment) {
      lines.push(`Design Comment: ${b.rdResponse.comment}`);
    }
  }

  // AO Verification
  if (b.aoVerification?.status) {
    lines.push(`\n[Manufacturing Review & Verification]: ${b.aoVerification.status}`);
    if (b.aoVerification.comment) {
      lines.push(`Verification Note: ${b.aoVerification.comment}`);
    }
  }

  return lines.join('\n');
}

function getPrimaryAuthor(b: BalloonItem): string {
  if (b.feedbackList && b.feedbackList.length > 0) {
    return b.feedbackList[0].authorName || 'Manufacturing Specialist';
  }
  return 'AO Manufacturing Specialist';
}
