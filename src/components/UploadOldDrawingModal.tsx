import React, { useState, useRef } from 'react';
import { 
  X, 
  FileUp, 
  Split, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  FileText, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { renderPdfPage, convertPdfToAllPages } from '../utils/pdfRenderer';
import { extractDfmFromPdf } from '../utils/pdfExport';
import { BalloonItem } from '../types/dfm';
import { SAMPLE_DRAWING_REV_A_SVG } from '../utils/sampleDrawings';

interface UploadOldDrawingModalProps {
  currentDrawingFileName?: string;
  onClose: () => void;
  onConfirmOldDrawing: (
    drawingUrl: string,
    drawingType: 'svg' | 'image',
    fileName: string,
    extractedBalloons?: BalloonItem[],
    drawingPages?: string[]
  ) => void;
  onShowToast?: (message: string, type?: 'success' | 'error' | 'info' | 'warning', title?: string) => void;
}

export const UploadOldDrawingModal: React.FC<UploadOldDrawingModalProps> = ({
  currentDrawingFileName,
  onClose,
  onConfirmOldDrawing,
  onShowToast,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [drawingUrl, setDrawingUrl] = useState<string>('');
  const [drawingType, setDrawingType] = useState<'svg' | 'image'>('svg');
  const [drawingPages, setDrawingPages] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [extractedBalloons, setExtractedBalloons] = useState<BalloonItem[] | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    try {
      setIsProcessing(true);
      setSelectedFile(file);
      setFileName(file.name);
      setExtractedBalloons(null);
      setDrawingPages([]);

      // Check if it's an app-exported PDF with embedded DFM characteristics & comments
      if (file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf') {
        setProcessingStatus('Inspecting PDF vector sheet & Adobe Acrobat comments...');
        
        try {
          const extracted = await extractDfmFromPdf(file);
          if (extracted && extracted.balloons && extracted.balloons.length > 0) {
            setExtractedBalloons(extracted.balloons);
            onShowToast?.(
              `Recognized App-Exported PDF! Restored ${extracted.balloons.length} marked characteristics, pen circles & comments.`,
              'success',
              'PDF Metadata Found'
            );
          }
        } catch (e) {
          console.warn('PDF DFM extraction notice:', e);
        }

        setProcessingStatus('Rendering crisp vector CAD canvas (multi-page)...');
        try {
          const multiResult = await convertPdfToAllPages(file, (curr, tot) => {
            setProcessingStatus(`Rendering sheet ${curr} of ${tot}...`);
          });
          const firstPage = multiResult.pages[0] || '';
          setDrawingUrl(firstPage);
          setDrawingType('image');
          setDrawingPages(multiResult.pages);
          if (multiResult.totalPages > 1) {
            onShowToast?.(`Loaded ${multiResult.totalPages} drawing sheets for baseline comparison.`, 'info');
          }
        } catch (renderErr) {
          console.warn('Multi-page fallback:', renderErr);
          const rendered = await renderPdfPage(file, 1);
          setDrawingUrl(rendered.dataUrl);
          setDrawingType('image');
          setDrawingPages([rendered.dataUrl]);
        }
      } else if (file.type.includes('svg') || file.name.endsWith('.svg')) {
        const text = await file.text();
        setDrawingUrl(text);
        setDrawingType('svg');
        setDrawingPages([text]);
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          const res = e.target?.result as string;
          setDrawingUrl(res);
          setDrawingType('image');
          setDrawingPages([res]);
        };
        reader.readAsDataURL(file);
      }
    } catch (err: any) {
      onShowToast?.(`Error reading drawing file: ${err.message || err}`, 'error', 'File Error');
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  const handleSelectSample = () => {
    onConfirmOldDrawing(
      SAMPLE_DRAWING_REV_A_SVG,
      'svg',
      'Sample_Housing_Rev_A.svg',
      [],
      [SAMPLE_DRAWING_REV_A_SVG]
    );
  };

  const handleConfirm = () => {
    if (!drawingUrl) {
      onShowToast?.('Please upload a prior drawing or select the sample baseline.', 'warning');
      return;
    }
    onConfirmOldDrawing(
      drawingUrl,
      drawingType,
      fileName || 'Baseline_Drawing.dwg',
      extractedBalloons || undefined,
      drawingPages.length > 0 ? drawingPages : [drawingUrl]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border-2 border-slate-900 w-full max-w-lg overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="px-5 py-4 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
              <Split className="w-4 h-4 text-slate-950" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white tracking-tight">
                Upload Prior Drawing for Side-by-Side Comparison
              </h2>
              <p className="text-[11px] text-neutral-400">
                Compare old baseline drawing (left) against current print (right)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs text-neutral-800 bg-[#f8f9fa]">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-900 text-[11px] leading-relaxed">
            <strong>Side-by-Side Comparison Workflow:</strong> To visually inspect changes between prints, upload the previous/baseline engineering drawing. The new drawing remains in focus for markup, while the old drawing opens alongside for comparison.
          </div>

          {/* Upload Dropzone */}
          <div
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
            onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file) processFile(file);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2.5 ${
              isDragging 
                ? 'border-slate-900 bg-amber-500/10 scale-[1.01]' 
                : drawingUrl 
                ? 'border-emerald-500 bg-emerald-50/60' 
                : 'border-neutral-300 bg-white hover:border-slate-900 hover:bg-neutral-50'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) processFile(file);
              }}
              accept=".pdf,.svg,.png,.jpg,.jpeg,.webp"
              className="hidden"
            />

            {isProcessing ? (
              <div className="py-3 flex flex-col items-center gap-2">
                <Clock className="w-7 h-7 text-amber-500 animate-spin" />
                <span className="font-bold text-black text-xs">{processingStatus || 'Processing drawing...'}</span>
              </div>
            ) : drawingUrl ? (
              <div className="flex flex-col items-center gap-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                <div className="font-bold text-black text-xs">{fileName}</div>
                
                {extractedBalloons && extractedBalloons.length > 0 ? (
                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-300 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>App-Exported PDF: {extractedBalloons.length} markups &amp; comments restored!</span>
                  </span>
                ) : (
                  <span className="text-[11px] text-neutral-500">Ready for side-by-side comparison</span>
                )}

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="mt-1 text-[11px] text-neutral-600 underline font-semibold"
                >
                  Change file
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-amber-100 text-slate-900 flex items-center justify-center">
                  <FileUp className="w-6 h-6 text-slate-900" />
                </div>
                <div>
                  <span className="font-extrabold text-black text-xs block">
                    Drop Prior Drawing (PDF, SVG, PNG, JPG)
                  </span>
                  <span className="text-[11px] text-neutral-500">
                    Supports PDFs exported from this app (restores exact visual markups!)
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Fallback: Sample Baseline Rev A */}
          <div className="pt-1 flex items-center justify-between border-t border-neutral-200">
            <span className="text-[11px] text-neutral-500 font-medium">Don't have prior print handy?</span>
            <button
              type="button"
              onClick={handleSelectSample}
              className="text-[11px] font-bold text-black hover:text-amber-600 flex items-center gap-1 cursor-pointer bg-neutral-200/70 hover:bg-neutral-200 px-2.5 py-1.5 rounded-lg border border-neutral-300"
            >
              <span>Load Sample Rev A Baseline</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-white border-t border-neutral-200 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-neutral-600 hover:text-black hover:bg-neutral-100 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!drawingUrl || isProcessing}
            className="px-5 py-2.5 bg-slate-950 hover:bg-slate-800 disabled:opacity-40 text-amber-400 hover:text-amber-300 font-bold text-xs rounded-xl shadow-md border border-slate-900 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Split className="w-4 h-4 text-amber-400" />
            <span>Open Side-by-Side Comparison</span>
          </button>
        </div>

      </div>
    </div>
  );
};
