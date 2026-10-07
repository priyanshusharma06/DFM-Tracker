import React, { useState, useRef, useEffect } from 'react';
import { 
  FileUp, 
  RefreshCw, 
  SearchCheck, 
  FileSpreadsheet, 
  Layers, 
  ArrowRight, 
  Clock, 
  Play, 
  Download, 
  Building2,
  CheckCircle2,
  PenTool,
  Highlighter,
  Check
} from 'lucide-react';
import { SAMPLE_DRAWING_REV_A_SVG, SAMPLE_DRAWING_REV_B_SVG } from '../utils/sampleDrawings';
import { createSampleExcelFile } from '../utils/excelParser';
import { convertPdfToImage, convertPdfToAllPages } from '../utils/pdfRenderer';
import { extractDfmFromPdf } from '../utils/pdfExport';
import { extractDrawingInfoFromFileName } from '../utils/drawingUtils';
import { BalloonItem } from '../types/dfm';

interface StartScreenProps {
  onStartFlow1: (
    drawingUrl: string, 
    drawingType: 'svg' | 'image', 
    fileName: string, 
    partNumber?: string,
    drawingPages?: string[],
    partName?: string
  ) => void;
  onStartFlow2: (
    excelFile?: File,
    newDrawingUrl?: string,
    newDrawingType?: 'svg' | 'image',
    newDrawingName?: string,
    oldDrawingUrl?: string,
    oldDrawingName?: string,
    extractedOldBalloons?: BalloonItem[],
    newDrawingPages?: string[],
    oldDrawingPages?: string[],
    customPartNumber?: string,
    customPartName?: string
  ) => void;
  onStartFlow3: (
    excelFile?: File,
    drawingUrl?: string,
    drawingType?: 'svg' | 'image',
    drawingName?: string,
    extractedBalloons?: BalloonItem[],
    drawingPages?: string[],
    detectedPartNumber?: string,
    detectedRevCode?: string,
    detectedPartName?: string
  ) => void;
  onQuickLoadDemo: () => void;
  onShowToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning', title?: string) => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({
  onStartFlow1,
  onStartFlow2,
  onStartFlow3,
  onQuickLoadDemo,
  onShowToast,
}) => {
  const [selectedFlow, setSelectedFlow] = useState<'NONE' | 'FLOW_1' | 'FLOW_2' | 'FLOW_3'>('NONE');

  // FLOW 1 State (New Drawing Initiation)
  const [f1DrawingUrl, setF1DrawingUrl] = useState<string>('');
  const [f1DrawingType, setF1DrawingType] = useState<'svg' | 'image'>('svg');
  const [f1FileName, setF1FileName] = useState<string>('');
  const [f1PartNumber, setF1PartNumber] = useState<string>('');
  const [f1PartName, setF1PartName] = useState<string>('');
  const [f1Pages, setF1Pages] = useState<string[]>([]);
  const [f1IsAnalyzing, setF1IsAnalyzing] = useState(false);
  const [f1PdfStatus, setF1PdfStatus] = useState<string>('');
  const [f1IsDragging, setF1IsDragging] = useState(false);

  // FLOW 2 State (Revision Loop Tracking - Old Drawing, New Drawing, Prior Excel all OPTIONAL)
  const [f2OldDrawingUrl, setF2OldDrawingUrl] = useState<string>('');
  const [f2OldDrawingType, setF2OldDrawingType] = useState<'svg' | 'image'>('svg');
  const [f2OldDrawingName, setF2OldDrawingName] = useState<string>('');
  const [f2OldPages, setF2OldPages] = useState<string[]>([]);
  const [f2OldExtractedBalloons, setF2OldExtractedBalloons] = useState<BalloonItem[] | null>(null);

  const [f2NewDrawingUrl, setF2NewDrawingUrl] = useState<string>('');
  const [f2NewDrawingType, setF2NewDrawingType] = useState<'svg' | 'image'>('svg');
  const [f2NewDrawingName, setF2NewDrawingName] = useState<string>('');
  const [f2NewPages, setF2NewPages] = useState<string[]>([]);
  const [f2PartNumber, setF2PartNumber] = useState<string>('AO-4820-D');
  const [f2PartName, setF2PartName] = useState<string>('Precision Housing Assembly');

  const [f2ExcelFile, setF2ExcelFile] = useState<File | null>(null);
  const [f2IsAnalyzing, setF2IsAnalyzing] = useState(false);
  const [f2PdfStatus, setF2PdfStatus] = useState<string>('');
  const [f2OldDwgIsDragging, setF2OldDwgIsDragging] = useState(false);
  const [f2NewDwgIsDragging, setF2NewDwgIsDragging] = useState(false);
  const [f2ExcelIsDragging, setF2ExcelIsDragging] = useState(false);

  // FLOW 3 State (In-Progress Review & Resume - Drawing is MANDATORY, Excel is OPTIONAL)
  const [f3DrawingUrl, setF3DrawingUrl] = useState<string>('');
  const [f3DrawingType, setF3DrawingType] = useState<'svg' | 'image'>('svg');
  const [f3DrawingName, setF3DrawingName] = useState<string>('');
  const [f3Pages, setF3Pages] = useState<string[]>([]);
  const [f3ExtractedBalloons, setF3ExtractedBalloons] = useState<BalloonItem[] | null>(null);
  const [f3DetectedPartNumber, setF3DetectedPartNumber] = useState<string>('');
  const [f3PartName, setF3PartName] = useState<string>('');
  const [f3DetectedRevCode, setF3DetectedRevCode] = useState<string>('');
  const [f3ExcelFile, setF3ExcelFile] = useState<File | null>(null);
  const [f3IsAnalyzing, setF3IsAnalyzing] = useState(false);
  const [f3PdfStatus, setF3PdfStatus] = useState<string>('');
  const [f3DwgIsDragging, setF3DwgIsDragging] = useState(false);
  const [f3ExcelIsDragging, setF3ExcelIsDragging] = useState(false);

  const fileInputRef1 = useRef<HTMLInputElement>(null);
  const fileInputRef2Excel = useRef<HTMLInputElement>(null);
  const fileInputRef2NewDwg = useRef<HTMLInputElement>(null);
  const fileInputRef2OldDwg = useRef<HTMLInputElement>(null);
  const fileInputRef3Excel = useRef<HTMLInputElement>(null);
  const fileInputRef3Dwg = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to configuration panel when selected
  useEffect(() => {
    if (selectedFlow !== 'NONE' && panelRef.current) {
      panelRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedFlow]);

  // Helper: Sanitize Part Number from filename
  const extractPartNumberFromFileName = (fileName: string) => {
    const base = fileName.replace(/\.[^/.]+$/, '');
    const clean = base.replace(/[_]/g, '-').toUpperCase();
    return clean.slice(0, 24);
  };

  // Helper: Read drawing file (SVG, PDF, or raster image)
  const processDrawingFile = async (
    file: File, 
    callback: (url: string, type: 'svg' | 'image', name: string, pages?: string[]) => void,
    setStatus: (status: string) => void,
    onSuccess?: (name: string, totalPages?: number) => void
  ): Promise<{ url: string; type: 'svg' | 'image'; name: string; pages: string[]; totalPages: number }> => {
    return new Promise(async (resolve) => {
      if (file.name.endsWith('.svg') || file.type === 'image/svg+xml') {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          callback(result, 'svg', file.name, [result]);
          onSuccess?.(file.name, 1);
          onShowToast(`Loaded SVG drawing: ${file.name}`, 'success');
          resolve({ url: result, type: 'svg', name: file.name, pages: [result], totalPages: 1 });
        };
        reader.readAsText(file);
      } else if (file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf') {
        try {
          setStatus('Rendering vector PDF into high-resolution engineering canvas...');
          const result = await convertPdfToAllPages(file, (curr, tot) => {
            setStatus(`Rendering CAD sheet ${curr} of ${tot}...`);
          });
          const firstPage = result.pages[0] || '';
          callback(firstPage, 'image', file.name, result.pages);
          onSuccess?.(file.name, result.totalPages);
          onShowToast(
            `Rendered vector PDF: ${file.name} (${result.totalPages} ${result.totalPages === 1 ? 'sheet' : 'sheets'})`,
            'success'
          );
          resolve({ url: firstPage, type: 'image', name: file.name, pages: result.pages, totalPages: result.totalPages });
        } catch (err: any) {
          console.warn('PDF multi-page conversion fallback:', err);
          try {
            const pngUrl = await convertPdfToImage(file);
            callback(pngUrl, 'image', file.name, [pngUrl]);
            onSuccess?.(file.name, 1);
            onShowToast(`Rendered PDF drawing: ${file.name}`, 'success');
            resolve({ url: pngUrl, type: 'image', name: file.name, pages: [pngUrl], totalPages: 1 });
          } catch {
            const reader = new FileReader();
            reader.onload = (e) => {
              const dataUrl = e.target?.result as string;
              callback(dataUrl, 'image', file.name, [dataUrl]);
              onSuccess?.(file.name, 1);
              resolve({ url: dataUrl, type: 'image', name: file.name, pages: [dataUrl], totalPages: 1 });
            };
            reader.readAsDataURL(file);
          }
        } finally {
          setStatus('');
        }
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          callback(dataUrl, 'image', file.name, [dataUrl]);
          onSuccess?.(file.name, 1);
          onShowToast(`Loaded drawing image: ${file.name}`, 'success');
          resolve({ url: dataUrl, type: 'image', name: file.name, pages: [dataUrl], totalPages: 1 });
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onShowToast(`Downloaded template: ${filename}`, 'info');
  };

  const handleDownloadStandardTemplate = () => {
    const sampleFile = createSampleExcelFile();
    triggerDownload(sampleFile, 'AS9102_DFM_Tracker_Template.xlsx');
  };

  // Populate Flow 2 with reference dataset
  const handleAutoFillFlow2 = () => {
    const sampleFile = createSampleExcelFile();
    setF2ExcelFile(sampleFile);
    setF2OldDrawingUrl(SAMPLE_DRAWING_REV_A_SVG);
    setF2OldDrawingType('svg');
    setF2OldDrawingName('4938-5-004 (4)_Rev0.1_CAD.svg');
    setF2OldPages([SAMPLE_DRAWING_REV_A_SVG]);
    setF2NewDrawingUrl(SAMPLE_DRAWING_REV_B_SVG);
    setF2NewDrawingType('svg');
    setF2NewDrawingName('4938-5-004 (4)_Rev0.2_CAD.svg');
    setF2NewPages([SAMPLE_DRAWING_REV_B_SVG]);
    setF2PartNumber('4938-5-004 (4)');
    setF2PartName('Precision Housing Assembly');
    onShowToast('Loaded Rev 0.1 Old Drawing + Rev 0.2 New Drawing dataset into Flow 2', 'success');
  };

  // Populate Flow 3 with reference dataset
  const handleAutoFillFlow3 = () => {
    const sampleFile = createSampleExcelFile();
    setF3ExcelFile(sampleFile);
    setF3DrawingUrl(SAMPLE_DRAWING_REV_A_SVG);
    setF3DrawingType('svg');
    setF3DrawingName('4938-5-004 (4)_Rev0.1_CAD.svg');
    setF3Pages([SAMPLE_DRAWING_REV_A_SVG]);
    setF3DetectedPartNumber('4938-5-004 (4)');
    setF3PartName('Precision Housing Assembly');
    setF3DetectedRevCode('Rev 0.1');
    onShowToast('Loaded Rev 0.1 active review dataset into Flow 3', 'success');
  };

  // Process Baseline / Old Drawing for Flow 2 (Supports PDF extraction & multi-page sheets)
  const handleProcessF2OldDrawing = async (file: File) => {
    setF2PdfStatus('Inspecting PDF metadata & sheets...');
    const fileInfo = extractDrawingInfoFromFileName(file.name);
    setF2PartNumber(fileInfo.partNumber);
    setF2PartName(fileInfo.partName);

    if (file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf') {
      try {
        const extracted = await extractDfmFromPdf(file);
        if (extracted && extracted.balloons && extracted.balloons.length > 0) {
          setF2OldExtractedBalloons(extracted.balloons);
          if (extracted.partNumber) setF2PartNumber(extracted.partNumber);
          onShowToast(
            `App-Exported PDF Recognized: Restored ${extracted.balloons.length} characteristics & comments across sheets!`,
            'success',
            'PDF Metadata Restored'
          );
        } else {
          setF2OldExtractedBalloons(null);
        }
      } catch {
        setF2OldExtractedBalloons(null);
      }
    } else {
      setF2OldExtractedBalloons(null);
    }

    const processed = await processDrawingFile(file, (url, type, name, pages) => {
      setF2OldDrawingUrl(url);
      setF2OldDrawingType(type);
      setF2OldDrawingName(name);
      if (pages && pages.length > 0) setF2OldPages(pages);
    }, setF2PdfStatus);

    if (processed && processed.pages && processed.pages.length > 0) {
      setF2OldPages(processed.pages);
      setF2OldDrawingUrl(processed.url);
      setF2OldDrawingName(processed.name);
      setF2OldDrawingType(processed.type);
    }
  };

  // Process Drawing for Flow 3 (Inspects for in-progress PDF metadata to resume work)
  const handleProcessF3Drawing = async (file: File) => {
    setF3PdfStatus('Reading in-progress PDF & markups...');
    const fileInfo = extractDrawingInfoFromFileName(file.name);
    setF3DetectedPartNumber(fileInfo.partNumber);
    setF3PartName(fileInfo.partName);

    if (file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf') {
      try {
        const extracted = await extractDfmFromPdf(file);
        if (extracted && extracted.balloons && extracted.balloons.length > 0) {
          setF3ExtractedBalloons(extracted.balloons);
          if (extracted.partNumber) setF3DetectedPartNumber(extracted.partNumber);
          if (extracted.revCode) setF3DetectedRevCode(extracted.revCode);
          onShowToast(
            `In-Progress PDF Recognized! Restored ${extracted.balloons.length} editable characteristics & markings across sheets.`,
            'success',
            'Work Restored'
          );
        } else {
          setF3ExtractedBalloons(null);
        }
      } catch {
        setF3ExtractedBalloons(null);
      }
    } else {
      setF3ExtractedBalloons(null);
    }

    const processed = await processDrawingFile(file, (url, type, name, pages) => {
      setF3DrawingUrl(url);
      setF3DrawingType(type);
      setF3DrawingName(name);
      if (pages && pages.length > 0) setF3Pages(pages);
    }, setF3PdfStatus);

    if (processed && processed.pages && processed.pages.length > 0) {
      setF3Pages(processed.pages);
      setF3DrawingUrl(processed.url);
      setF3DrawingName(processed.name);
      setF3DrawingType(processed.type);
    }
  };

  // Launch Flow 1 (New Drawing Initiation)
  const handleLaunchFlow1 = () => {
    if (!f1DrawingUrl) {
      onShowToast('Please provide an engineering drawing (PDF, SVG, or Image).', 'warning');
      return;
    }
    setF1IsAnalyzing(true);
    setTimeout(() => {
      setF1IsAnalyzing(false);
      onStartFlow1(
        f1DrawingUrl, 
        f1DrawingType, 
        f1FileName || 'Drawing.dwg', 
        f1PartNumber || '4938-5-004 (4)', 
        f1Pages,
        f1PartName || 'Precision Housing Assembly'
      );
    }, 300);
  };

  // Launch Flow 2 (Revision Loop Tracking - all 3 inputs are OPTIONAL)
  const handleLaunchFlow2 = () => {
    setF2IsAnalyzing(true);
    setTimeout(() => {
      setF2IsAnalyzing(false);
      onStartFlow2(
        f2ExcelFile || undefined,
        f2NewDrawingUrl || SAMPLE_DRAWING_REV_B_SVG,
        f2NewDrawingType || 'svg',
        f2NewDrawingName || 'Drawing_Rev_B.svg',
        f2OldDrawingUrl || SAMPLE_DRAWING_REV_A_SVG,
        f2OldDrawingName || 'Drawing_Rev_A.svg',
        f2OldExtractedBalloons || undefined,
        f2NewPages.length > 0 ? f2NewPages : undefined,
        f2OldPages.length > 0 ? f2OldPages : undefined,
        f2PartNumber || '4938-5-004 (4)',
        f2PartName || 'Precision Housing Assembly'
      );
    }, 300);
  };

  // Launch Flow 3 (User Request 3: Only drawing is mandatory, Excel is optional; resumes where things were left)
  const handleLaunchFlow3 = () => {
    if (!f3DrawingUrl) {
      onShowToast('Please provide a drawing print (PDF or CAD image) to resume or review.', 'warning');
      return;
    }
    setF3IsAnalyzing(true);
    setTimeout(() => {
      setF3IsAnalyzing(false);
      onStartFlow3(
        f3ExcelFile || undefined,
        f3DrawingUrl,
        f3DrawingType,
        f3DrawingName || 'Drawing.dwg',
        f3ExtractedBalloons || undefined,
        f3Pages.length > 0 ? f3Pages : [f3DrawingUrl],
        f3DetectedPartNumber || '4938-5-004 (4)',
        f3DetectedRevCode || 'Rev 0.1',
        f3PartName || 'Precision Housing Assembly'
      );
    }, 300);
  };

  return (
    <div className="min-h-full w-full bg-[#f8f9fa] text-neutral-900 flex flex-col justify-between p-4 sm:p-8 pb-16">
      
      {/* Top Header with Stryker Yellow Accents */}
      <div className="max-w-6xl mx-auto w-full pt-2 text-center space-y-3">
        {/* Brand Pill Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-slate-900 text-amber-400 font-bold text-xs uppercase tracking-wider rounded-lg border border-slate-800 shadow-xs">
          <Building2 className="w-3.5 h-3.5 text-amber-400" />
          <span>Stryker Advanced Operations (AO) &bull; Manufacturing DFM &amp; Drawing Revision Platform</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
          Drawing review Tool
        </h1>

        <p className="text-sm text-neutral-600 max-w-2xl mx-auto leading-relaxed font-medium">
          Engineering review process: take a print, circle features with a pen or highlight callouts, log manufacturing findings &amp; concerns, and perform side-by-side revision verification.
        </p>

        {/* Quick Demo Launch */}
        <div className="pt-1 flex justify-center gap-3">
          <button
            onClick={onQuickLoadDemo}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-950 hover:bg-slate-800 text-amber-400 font-bold text-xs rounded-xl border border-slate-800 shadow-md transition-all cursor-pointer hover:scale-[1.02]"
            title="Load sample drawing and start review"
          >
            <Play className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>Load Quick Demo Project (Housing Assembly)</span>
          </button>
        </div>
      </div>

      {/* 3 Core Workflow Selection Cards */}
      <div className="max-w-6xl mx-auto w-full py-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* OPTION 1: NEW DRAWING (INITIATION) */}
          <div
            onClick={() => setSelectedFlow('FLOW_1')}
            className={`p-6 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
              selectedFlow === 'FLOW_1'
                ? 'bg-white border-amber-500 ring-4 ring-amber-500/20 shadow-xl'
                : 'bg-white border-neutral-200 hover:border-slate-800 shadow-xs hover:shadow-md'
            }`}
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-slate-950 text-amber-400 border border-slate-800 flex items-center justify-center shadow-xs">
                <FileUp className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-950 bg-amber-400 px-2 py-0.5 rounded border border-amber-500 shadow-xs">
                  Flow 1
                </span>
                <h2 className="text-lg font-black text-slate-900 mt-2">New Drawing Initiation</h2>
                <p className="text-xs text-neutral-600 mt-2 leading-relaxed">
                  Take a new engineering print (PDF, CAD image, or SVG). Circle features with a pen or highlight them, log manufacturing findings &amp; concerns, and export multi-tab Excel tracker.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-neutral-200 flex items-center justify-between text-xs font-bold text-slate-900">
              <span>{selectedFlow === 'FLOW_1' ? 'Configuring Flow 1' : 'Select Flow 1'}</span>
              <ArrowRight className="w-4 h-4 text-amber-500" />
            </div>
          </div>

          {/* OPTION 2: REVISION LOOP TRACKING & COMPARISON */}
          <div
            onClick={() => setSelectedFlow('FLOW_2')}
            className={`p-6 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
              selectedFlow === 'FLOW_2'
                ? 'bg-white border-amber-500 ring-4 ring-amber-500/20 shadow-xl'
                : 'bg-white border-neutral-200 hover:border-slate-800 shadow-xs hover:shadow-md'
            }`}
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-slate-950 text-amber-400 border border-slate-800 flex items-center justify-center shadow-xs">
                <RefreshCw className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-950 bg-amber-400 px-2 py-0.5 rounded border border-amber-500 shadow-xs">
                  Flow 2
                </span>
                <h2 className="text-lg font-black text-slate-900 mt-2">Revision Loop Tracking</h2>
                <p className="text-xs text-neutral-600 mt-2 leading-relaxed">
                  Open previous print and new R&amp;D drawing side-by-side. Visually compare changes, mark up issues on the new drawing only, and save comments in a new Excel tab.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-neutral-200 flex items-center justify-between text-xs font-bold text-slate-900">
              <span>{selectedFlow === 'FLOW_2' ? 'Configuring Flow 2' : 'Select Flow 2'}</span>
              <ArrowRight className="w-4 h-4 text-amber-500" />
            </div>
          </div>

          {/* OPTION 3: ACTIVE REVIEW SESSION */}
          <div
            onClick={() => setSelectedFlow('FLOW_3')}
            className={`p-6 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
              selectedFlow === 'FLOW_3'
                ? 'bg-white border-amber-500 ring-4 ring-amber-500/20 shadow-xl'
                : 'bg-white border-neutral-200 hover:border-slate-800 shadow-xs hover:shadow-md'
            }`}
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-slate-950 text-amber-400 border border-slate-800 flex items-center justify-center shadow-xs">
                <SearchCheck className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-950 bg-amber-400 px-2 py-0.5 rounded border border-amber-500 shadow-xs">
                  Flow 3
                </span>
                <h2 className="text-lg font-black text-slate-900 mt-2">Active Review Session</h2>
                <p className="text-xs text-neutral-600 mt-2 leading-relaxed">
                  Import an active DFM Excel tracker and drawing sheet to resume review, update design concurrence verdicts, or verify sign-offs.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-neutral-200 flex items-center justify-between text-xs font-bold text-slate-900">
              <span>{selectedFlow === 'FLOW_3' ? 'Configuring Flow 3' : 'Select Flow 3'}</span>
              <ArrowRight className="w-4 h-4 text-amber-500" />
            </div>
          </div>

        </div>

        {/* FLOW 1 CONFIGURATION PANEL */}
        {selectedFlow === 'FLOW_1' && (
          <div ref={panelRef} className="mt-6 bg-white border-2 border-slate-900 rounded-2xl p-6 shadow-xl animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-4 border-b-2 border-neutral-100">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-slate-950 text-amber-400 flex items-center justify-center">
                    <FileUp className="w-4 h-4 text-amber-400" />
                  </div>
                  <span>Flow 1: New Drawing Initiation Setup</span>
                </h3>
                <p className="text-xs text-neutral-600 mt-0.5 font-medium">
                  Load an engineering print to begin characteristic circling, highlighting, and logging manufacturing findings.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setF1DrawingUrl(SAMPLE_DRAWING_REV_A_SVG);
                    setF1DrawingType('svg');
                    setF1FileName('AO-4820-D_Rev0.1_Concept.dwg');
                    setF1PartNumber('AO-4820-D');
                    onShowToast('Loaded sample CAD drawing for Flow 1', 'success');
                  }}
                  className="px-3 py-1.5 text-xs bg-amber-400 hover:bg-amber-300 text-slate-950 border border-amber-500 rounded-lg font-bold flex items-center gap-1 cursor-pointer shadow-xs"
                >
                  <span>Load Sample CAD Print</span>
                </button>
                <button
                  onClick={() => setSelectedFlow('NONE')}
                  className="text-xs text-neutral-600 hover:text-black font-bold px-3 py-1.5 rounded-lg border border-neutral-300 hover:bg-neutral-100 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-5 text-xs">
              
              {/* Left Column: Review Workflow Steps */}
              <div className="lg:col-span-5 space-y-4">
                <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-3">
                  <span className="font-extrabold text-black block text-xs">
                    Review Workflow:
                  </span>
                  <div className="space-y-3 text-[11px] text-neutral-700">
                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-rose-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        <PenTool className="w-3 h-3 text-white" />
                      </div>
                      <div>
                        <strong className="text-black">Circle with Pen:</strong> Draw a freehand circle around any dimension or feature with an issue to immediately open comment section.
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5 border border-amber-500">
                        <Highlighter className="w-3 h-3 text-slate-950" />
                      </div>
                      <div>
                        <strong className="text-black">Highlight:</strong> Drag across callouts or notes to highlight features directly on print.
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-slate-900 text-amber-400 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        3
                      </div>
                      <div>
                        <strong className="text-black">3-Stage Concurrence:</strong> 1. Manufacturing Finding &rarr; 2. Design Concurrence &rarr; 3. Manufacturing Verification.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Prominent, Obvious Drag-and-Drop Dropzone */}
              <div className="lg:col-span-7 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-slate-900 font-black text-sm block">
                      Drawing Print File (PDF / SVG / CAD Image) <strong className="text-rose-600">*</strong>
                    </label>
                    <span className="text-[11px] font-bold text-slate-500">Vector PDF or high-res image</span>
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef1}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) processDrawingFile(f, (url, type, name, pages) => {
                        setF1DrawingUrl(url);
                        setF1DrawingType(type);
                        setF1FileName(name);
                        if (pages && pages.length > 0) setF1Pages(pages);
                      }, setF1PdfStatus, (name) => {
                        const cleanNum = extractPartNumberFromFileName(name);
                        setF1PartNumber(cleanNum);
                      });
                    }}
                    accept=".pdf,.svg,.png,.jpg,.jpeg,.webp"
                    className="hidden"
                  />
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setF1IsDragging(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setF1IsDragging(false);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setF1IsDragging(false);
                      const f = e.dataTransfer.files?.[0];
                      if (f) processDrawingFile(f, (url, type, name, pages) => {
                        setF1DrawingUrl(url);
                        setF1DrawingType(type);
                        setF1FileName(name);
                        if (pages && pages.length > 0) setF1Pages(pages);
                      }, setF1PdfStatus, (name) => {
                        const cleanNum = extractPartNumberFromFileName(name);
                        setF1PartNumber(cleanNum);
                      });
                    }}
                    onClick={() => fileInputRef1.current?.click()}
                    className={`border-3 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[220px] shadow-sm hover:shadow-md ${
                      f1IsDragging 
                        ? 'border-amber-500 bg-amber-50/60 scale-[0.99] ring-4 ring-amber-400/20' 
                        : f1DrawingUrl 
                        ? 'border-emerald-500 bg-emerald-50/40' 
                        : 'border-slate-300 hover:border-slate-900 bg-neutral-50/60 hover:bg-neutral-50'
                    }`}
                  >
                    {f1DrawingUrl ? (
                      <div className="space-y-3">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto border-2 border-emerald-300 shadow-sm">
                          <CheckCircle2 className="w-8 h-8" />
                        </div>
                        <span className="font-black text-neutral-900 block text-base">
                          {f1FileName || 'Engineering Drawing Print Loaded'}
                        </span>
                        <span className="text-xs text-emerald-800 font-bold block">
                          Drawing ready &bull; Click or drop a new file to replace
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="w-14 h-14 rounded-2xl bg-slate-950 text-amber-400 border border-slate-800 flex items-center justify-center mx-auto shadow-md">
                          <FileUp className="w-7 h-7 text-amber-400" />
                        </div>
                        <span className="font-black text-slate-950 block text-base sm:text-lg">
                          Drop CAD Print here, or browse files
                        </span>
                        <span className="text-xs text-neutral-600 block max-w-md font-medium">
                          Accepts Vector PDF (single or multi-sheet), SVG, or high-res CAD raster images
                        </span>
                      </div>
                    )}
                    {f1PdfStatus && (
                      <span className="text-xs text-slate-950 font-bold mt-3 flex items-center justify-center gap-1.5 animate-pulse bg-amber-400 px-3.5 py-1.5 rounded-full border border-amber-500">
                        <Clock className="w-3.5 h-3.5 animate-spin text-slate-950" />
                        {f1PdfStatus}
                      </span>
                    )}
                  </div>
                </div>

                {/* Drawing Number & Title Editable Inputs */}
                <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                      <FileSpreadsheet className="w-4 h-4 text-amber-500" />
                      <span>Drawing Details (From Title Block):</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">Editable &bull; Propagated across all loops</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Drawing Number (Part #) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={f1PartNumber}
                        onChange={(e) => setF1PartNumber(e.target.value)}
                        placeholder="e.g. 4938-5-004 (4)"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 font-mono font-bold text-xs focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Drawing Title (Part Name) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={f1PartName}
                        onChange={(e) => setF1PartName(e.target.value)}
                        placeholder="e.g. Precision Housing Assembly"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 font-bold text-xs focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Bottom Action Button */}
            <div className="pt-6 border-t-2 border-neutral-100 mt-5">
              <button
                onClick={handleLaunchFlow1}
                disabled={f1IsAnalyzing}
                className="w-full py-4 rounded-xl font-black text-base flex items-center justify-center gap-2 shadow-xl transition-all cursor-pointer bg-slate-950 hover:bg-slate-800 text-amber-400 hover:text-amber-300 border border-slate-900 hover:scale-[1.005]"
              >
                {f1IsAnalyzing ? (
                  <>
                    <Clock className="w-4 h-4 animate-spin text-amber-400" />
                    <span>Loading Drawing Print into Workspace...</span>
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-4 h-4 text-amber-400" />
                    <span>Initiate the review</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* FLOW 2 CONFIGURATION PANEL (Old Drawing, New Drawing, Prior Excel all OPTIONAL) */}
        {selectedFlow === 'FLOW_2' && (
          <div ref={panelRef} className="mt-6 bg-white border-2 border-slate-900 rounded-2xl p-6 shadow-xl animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-4 border-b-2 border-neutral-100">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-slate-950 text-amber-400 flex items-center justify-center">
                    <RefreshCw className="w-4 h-4 text-amber-400" />
                  </div>
                  <span>Flow 2: Revision Loop Tracking &amp; Side-by-Side Comparison</span>
                </h3>
                <p className="text-xs text-neutral-600 mt-0.5 font-medium">
                  Compare previous print and updated R&amp;D drawing side-by-side. All inputs below are optional &mdash; launch immediately to inspect changes!
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAutoFillFlow2}
                  className="px-3 py-1.5 text-xs bg-amber-400 hover:bg-amber-300 text-slate-950 border border-amber-500 rounded-lg font-bold flex items-center gap-1 cursor-pointer shadow-xs"
                >
                  <span>Load Sample Datasets</span>
                </button>
                <button
                  onClick={() => setSelectedFlow('NONE')}
                  className="text-xs text-neutral-600 hover:text-black font-bold px-3 py-1.5 rounded-lg border border-neutral-300 hover:bg-neutral-100 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-5 text-xs">
              
              {/* Option a: Old / Baseline Drawing Revision (Flow 1 style dropzone per User Request) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-black block text-xs">
                    a. Baseline / Old Drawing
                  </span>
                  <span className="text-[10px] bg-neutral-200 text-neutral-700 px-1.5 py-0.5 rounded font-bold">
                    Optional
                  </span>
                </div>
                <p className="text-[11px] text-neutral-600">
                  Previous drawing revision to open on the left side-by-side for visual comparison. Supports multi-sheet PDFs.
                </p>

                <input
                  type="file"
                  ref={fileInputRef2OldDwg}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleProcessF2OldDrawing(f);
                  }}
                  accept=".pdf,.svg,.png,.jpg,.jpeg,.webp"
                  className="hidden"
                />

                <div
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setF2OldDwgIsDragging(true); }}
                  onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setF2OldDwgIsDragging(false); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setF2OldDwgIsDragging(false);
                    const f = e.dataTransfer.files?.[0];
                    if (f) handleProcessF2OldDrawing(f);
                  }}
                  onClick={() => fileInputRef2OldDwg.current?.click()}
                  className={`border-3 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[175px] shadow-xs hover:shadow-md ${
                    f2OldDwgIsDragging 
                      ? 'border-amber-500 bg-amber-50/60 scale-[0.99] ring-4 ring-amber-400/20' 
                      : f2OldDrawingUrl 
                      ? 'border-emerald-500 bg-emerald-50/40' 
                      : 'border-slate-300 hover:border-slate-900 bg-neutral-50/60 hover:bg-neutral-50'
                  }`}
                >
                  {f2OldDrawingUrl ? (
                    <div className="space-y-2">
                      <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto border-2 border-emerald-300 shadow-xs">
                        <CheckCircle2 className="w-7 h-7" />
                      </div>
                      <span className="font-black text-neutral-900 block text-xs">
                        {f2OldDrawingName || 'Baseline Drawing Loaded'}
                      </span>
                      {f2OldPages.length > 1 && (
                        <span className="text-[10px] text-neutral-500 font-bold block">{f2OldPages.length} sheets loaded</span>
                      )}
                      {f2OldExtractedBalloons && f2OldExtractedBalloons.length > 0 && (
                        <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full font-bold inline-block">
                          Restored {f2OldExtractedBalloons.length} markups
                        </span>
                      )}
                      <span className="text-[11px] text-emerald-800 font-bold block">
                        Drawing ready &bull; Click or drop a new file to replace
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="w-12 h-12 rounded-xl bg-slate-950 text-amber-400 border border-slate-800 flex items-center justify-center mx-auto shadow-sm">
                        <FileUp className="w-6 h-6 text-amber-400" />
                      </div>
                      <span className="font-black text-slate-950 block text-sm">
                        Drop Baseline Drawing here, or browse files
                      </span>
                      <span className="text-[11px] text-neutral-600 block max-w-xs font-medium">
                        Accepts Vector PDF (single or multi-sheet), SVG, or high-res CAD images
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Option b: New Drawing Revision (OPTIONAL) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-black block text-xs">
                    b. New Drawing Revision
                  </span>
                  <span className="text-[10px] bg-neutral-200 text-neutral-700 px-1.5 py-0.5 rounded font-bold">
                    Optional
                  </span>
                </div>
                <p className="text-[11px] text-neutral-600">
                  Updated drawing received from R&amp;D. Will open in focus on the right for review, clean canvas for new marking &amp; comments.
                </p>

                <input
                  type="file"
                  ref={fileInputRef2NewDwg}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) processDrawingFile(f, (url, type, name, pages) => {
                      setF2NewDrawingUrl(url);
                      setF2NewDrawingType(type);
                      setF2NewDrawingName(name);
                      if (pages && pages.length > 0) setF2NewPages(pages);
                    }, setF2PdfStatus);
                  }}
                  accept=".pdf,.svg,.png,.jpg,.jpeg,.webp"
                  className="hidden"
                />

                <div
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setF2NewDwgIsDragging(true); }}
                  onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setF2NewDwgIsDragging(false); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setF2NewDwgIsDragging(false);
                    const f = e.dataTransfer.files?.[0];
                    if (f) processDrawingFile(f, (url, type, name, pages) => {
                      setF2NewDrawingUrl(url);
                      setF2NewDrawingType(type);
                      setF2NewDrawingName(name);
                      if (pages && pages.length > 0) setF2NewPages(pages);
                    }, setF2PdfStatus);
                  }}
                  onClick={() => fileInputRef2NewDwg.current?.click()}
                  className={`border-3 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[175px] shadow-xs hover:shadow-md ${
                    f2NewDwgIsDragging 
                      ? 'border-amber-500 bg-amber-50/60 scale-[0.99] ring-4 ring-amber-400/20' 
                      : f2NewDrawingUrl 
                      ? 'border-emerald-500 bg-emerald-50/40' 
                      : 'border-slate-300 hover:border-slate-900 bg-neutral-50/60 hover:bg-neutral-50'
                  }`}
                >
                  {f2NewDrawingUrl ? (
                    <div className="space-y-2">
                      <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto border-2 border-emerald-300 shadow-xs">
                        <CheckCircle2 className="w-7 h-7" />
                      </div>
                      <span className="font-black text-neutral-900 block text-xs">
                        {f2NewDrawingName || 'New Drawing Loaded'}
                      </span>
                      {f2NewPages.length > 1 && (
                        <span className="text-[10px] text-neutral-500 font-bold block">{f2NewPages.length} sheets loaded</span>
                      )}
                      <span className="text-[11px] text-emerald-800 font-bold block">
                        Drawing ready &bull; Click or drop a new file to replace
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="w-12 h-12 rounded-xl bg-slate-950 text-amber-400 border border-slate-800 flex items-center justify-center mx-auto shadow-sm">
                        <FileUp className="w-6 h-6 text-amber-400" />
                      </div>
                      <span className="font-black text-slate-950 block text-sm">
                        Drop New Drawing here, or browse files
                      </span>
                      <span className="text-[11px] text-neutral-600 block max-w-xs font-medium">
                        Accepts Vector PDF (single or multi-sheet), SVG, or high-res CAD images
                      </span>
                    </div>
                  )}
                  {f2PdfStatus && (
                    <span className="text-[11px] text-black font-bold flex items-center justify-center gap-1 animate-pulse mt-2">
                      <Clock className="w-3 h-3 animate-spin text-black" />
                      {f2PdfStatus}
                    </span>
                  )}
                </div>
              </div>

              {/* Option c: Prior DFM Excel Tracker */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-black block text-xs">
                    c. Prior DFM Excel Tracker
                  </span>
                  <span className="text-[10px] bg-neutral-200 text-neutral-700 px-1.5 py-0.5 rounded font-bold">
                    Optional
                  </span>
                </div>
                <p className="text-[11px] text-neutral-600">
                  If provided, new comments will be saved in the exact same Excel in a new tab to keep revision history. If omitted, a fresh tracker is created.
                </p>

                <input
                  type="file"
                  ref={fileInputRef2Excel}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setF2ExcelFile(f);
                      onShowToast(`Loaded Excel file: ${f.name}`, 'success');
                    }
                  }}
                  accept=".xlsx,.xls"
                  className="hidden"
                />

                <div
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setF2ExcelIsDragging(true); }}
                  onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setF2ExcelIsDragging(false); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setF2ExcelIsDragging(false);
                    const f = e.dataTransfer.files?.[0];
                    if (f) {
                      setF2ExcelFile(f);
                      onShowToast(`Loaded Excel file: ${f.name}`, 'success');
                    }
                  }}
                  onClick={() => fileInputRef2Excel.current?.click()}
                  className={`border-3 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[175px] shadow-xs hover:shadow-md ${
                    f2ExcelIsDragging 
                      ? 'border-amber-500 bg-amber-50/60 scale-[0.99] ring-4 ring-amber-400/20' 
                      : f2ExcelFile 
                      ? 'border-emerald-500 bg-emerald-50/40' 
                      : 'border-slate-300 hover:border-slate-900 bg-neutral-50/60 hover:bg-neutral-50'
                  }`}
                >
                  {f2ExcelFile ? (
                    <div className="space-y-2">
                      <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto border-2 border-emerald-300 shadow-xs">
                        <FileSpreadsheet className="w-7 h-7 text-emerald-700" />
                      </div>
                      <span className="font-black text-neutral-900 block text-xs truncate max-w-[200px] mx-auto">
                        {f2ExcelFile.name}
                      </span>
                      <span className="text-[10px] text-emerald-700 font-black block">
                        ✓ Ready &bull; Revision history preserved
                      </span>
                      <span className="text-[11px] text-emerald-800 font-bold block">
                        Click or drop a new file to replace
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="w-12 h-12 rounded-xl bg-slate-950 text-amber-400 border border-slate-800 flex items-center justify-center mx-auto shadow-sm">
                        <FileSpreadsheet className="w-6 h-6 text-amber-400" />
                      </div>
                      <span className="font-black text-slate-950 block text-sm">
                        Drop Prior Excel Tracker here, or browse files
                      </span>
                      <span className="text-[11px] text-neutral-600 block max-w-xs font-medium">
                        Accepts standard AS9102 / DFM .xlsx or .xls files
                      </span>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Drawing Number & Title Editable Inputs for Flow 2 */}
            <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-amber-500" />
                  <span>Drawing Details (From Title Block):</span>
                </span>
                <span className="text-[10px] text-slate-500 font-medium">Editable &bull; Propagated across all loops &amp; comparison</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Drawing Number (Part #) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={f2PartNumber}
                    onChange={(e) => setF2PartNumber(e.target.value)}
                    placeholder="e.g. 4938-5-004 (4)"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 font-mono font-bold text-xs focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Drawing Title (Part Name) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={f2PartName}
                    onChange={(e) => setF2PartName(e.target.value)}
                    placeholder="e.g. Precision Housing Assembly"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 font-bold text-xs focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Launch Action */}
            <div className="mt-5 pt-4 border-t-2 border-neutral-100 flex justify-end">
              <button
                onClick={handleLaunchFlow2}
                disabled={f2IsAnalyzing}
                className="px-6 py-3.5 bg-slate-950 hover:bg-slate-800 text-amber-400 hover:text-amber-300 rounded-xl font-bold flex items-center gap-2 shadow-lg border border-slate-900 transition-all cursor-pointer text-xs"
              >
                {f2IsAnalyzing ? (
                  <>
                    <Clock className="w-4 h-4 animate-spin text-amber-400" />
                    <span>Loading Side-by-Side Drawing Comparison...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 text-amber-400" />
                    <span>Initiate Side-by-Side Visual Analysis</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* FLOW 3 CONFIGURATION PANEL (User Request 3: Drawing is MANDATORY, Excel is OPTIONAL, Resumes in-progress PDF) */}
        {selectedFlow === 'FLOW_3' && (
          <div ref={panelRef} className="mt-6 bg-white border-2 border-slate-900 rounded-2xl p-6 shadow-xl animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-4 border-b-2 border-neutral-100">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-slate-950 text-amber-400 flex items-center justify-center">
                    <SearchCheck className="w-4 h-4 text-amber-400" />
                  </div>
                  <span>Flow 3: Resume Review Session / In-Progress Drawing</span>
                </h3>
                <p className="text-xs text-neutral-600 mt-0.5 font-medium">
                  Upload your previously worked/in-progress drawing PDF to resume exactly where you left off. All previous markings, findings &amp; comments remain fully editable!
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAutoFillFlow3}
                  className="px-3 py-1.5 text-xs bg-amber-400 hover:bg-amber-300 text-slate-950 border border-amber-500 rounded-lg font-bold flex items-center gap-1 cursor-pointer shadow-xs"
                >
                  <span>Load Sample Review</span>
                </button>
                <button
                  onClick={() => setSelectedFlow('NONE')}
                  className="text-xs text-neutral-600 hover:text-black font-bold px-3 py-1.5 rounded-lg border border-neutral-300 hover:bg-neutral-100 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-5 text-xs">
              
              {/* Option 1: Drawing Sheet / In-Progress PDF Print (Flow 1 style dropzone per User Request) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-black block text-xs">
                    1. In-Progress Drawing Print (PDF / Image) <strong className="text-rose-600">*</strong>
                  </span>
                </div>
                <p className="text-[11px] text-neutral-600">
                  Upload your previously exported drawing PDF. All marked circles, highlighters, findings, and tolerances are restored in 100% editable format!
                </p>

                <input
                  type="file"
                  ref={fileInputRef3Dwg}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleProcessF3Drawing(f);
                  }}
                  accept=".pdf,.svg,.png,.jpg,.jpeg,.webp"
                  className="hidden"
                />

                <div
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setF3DwgIsDragging(true); }}
                  onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setF3DwgIsDragging(false); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setF3DwgIsDragging(false);
                    const f = e.dataTransfer.files?.[0];
                    if (f) handleProcessF3Drawing(f);
                  }}
                  onClick={() => fileInputRef3Dwg.current?.click()}
                  className={`border-3 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[175px] shadow-xs hover:shadow-md ${
                    f3DwgIsDragging 
                      ? 'border-amber-500 bg-amber-50/60 scale-[0.99] ring-4 ring-amber-400/20' 
                      : f3DrawingUrl 
                      ? 'border-emerald-500 bg-emerald-50/40' 
                      : 'border-slate-300 hover:border-slate-900 bg-neutral-50/60 hover:bg-neutral-50'
                  }`}
                >
                  {f3DrawingUrl ? (
                    <div className="space-y-2">
                      <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto border-2 border-emerald-300 shadow-xs">
                        <CheckCircle2 className="w-7 h-7" />
                      </div>
                      <span className="font-black text-neutral-900 block text-xs">
                        {f3DrawingName || 'In-Progress Drawing Loaded'}
                      </span>
                      {f3Pages.length > 1 && (
                        <span className="text-[10px] text-neutral-500 font-bold block">{f3Pages.length} sheets loaded</span>
                      )}
                      {f3ExtractedBalloons && f3ExtractedBalloons.length > 0 && (
                        <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full font-bold inline-block">
                          Restored {f3ExtractedBalloons.length} previous characteristics &amp; comments
                        </span>
                      )}
                      <span className="text-[11px] text-emerald-800 font-bold block">
                        Drawing ready &bull; Click or drop a new file to replace
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="w-12 h-12 rounded-xl bg-slate-950 text-amber-400 border border-slate-800 flex items-center justify-center mx-auto shadow-sm">
                        <FileUp className="w-6 h-6 text-amber-400" />
                      </div>
                      <span className="font-black text-slate-950 block text-sm">
                        Drop In-Progress Drawing here, or browse files
                      </span>
                      <span className="text-[11px] text-neutral-600 block max-w-xs font-medium">
                        Accepts Vector PDF (single or multi-sheet), SVG, or high-res CAD images
                      </span>
                    </div>
                  )}
                  {f3PdfStatus && (
                    <span className="text-[11px] text-black font-bold flex items-center justify-center gap-1 animate-pulse mt-2">
                      <Clock className="w-3 h-3 animate-spin text-black" />
                      {f3PdfStatus}
                    </span>
                  )}
                </div>
              </div>

              {/* Option 2: Excel Tracker Sheet (OPTIONAL per User Request 3.1) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-black block text-xs">
                    2. Excel Tracker Sheet
                  </span>
                  <span className="text-[10px] bg-neutral-200 text-neutral-700 px-1.5 py-0.5 rounded font-bold">
                    Optional
                  </span>
                </div>
                <p className="text-[11px] text-neutral-600">
                  Optional prior DFM Excel tracker. If omitted, your session will resume directly using the PDF markings and comments.
                </p>

                <input
                  type="file"
                  ref={fileInputRef3Excel}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setF3ExcelFile(f);
                      onShowToast(`Loaded Excel file: ${f.name}`, 'success');
                    }
                  }}
                  accept=".xlsx,.xls"
                  className="hidden"
                />

                <div
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setF3ExcelIsDragging(true); }}
                  onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setF3ExcelIsDragging(false); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setF3ExcelIsDragging(false);
                    const f = e.dataTransfer.files?.[0];
                    if (f) {
                      setF3ExcelFile(f);
                      onShowToast(`Loaded Excel file: ${f.name}`, 'success');
                    }
                  }}
                  onClick={() => fileInputRef3Excel.current?.click()}
                  className={`border-3 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[175px] shadow-xs hover:shadow-md ${
                    f3ExcelIsDragging 
                      ? 'border-amber-500 bg-amber-50/60 scale-[0.99] ring-4 ring-amber-400/20' 
                      : f3ExcelFile 
                      ? 'border-emerald-500 bg-emerald-50/40' 
                      : 'border-slate-300 hover:border-slate-900 bg-neutral-50/60 hover:bg-neutral-50'
                  }`}
                >
                  {f3ExcelFile ? (
                    <div className="space-y-2">
                      <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto border-2 border-emerald-300 shadow-xs">
                        <FileSpreadsheet className="w-7 h-7 text-emerald-700" />
                      </div>
                      <span className="font-black text-black truncate text-xs max-w-[200px] mx-auto block">
                        {f3ExcelFile.name}
                      </span>
                      <span className="text-[10px] text-emerald-700 font-black block">
                        ✓ Ready &bull; Comments will be synchronized
                      </span>
                      <span className="text-[11px] text-emerald-800 font-bold block">
                        Click or drop a new file to replace
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="w-12 h-12 rounded-xl bg-slate-950 text-amber-400 border border-slate-800 flex items-center justify-center mx-auto shadow-sm">
                        <FileSpreadsheet className="w-6 h-6 text-amber-400" />
                      </div>
                      <span className="font-black text-slate-950 block text-sm">
                        Drop Excel Tracker here, or browse files
                      </span>
                      <span className="text-[11px] text-neutral-600 block max-w-xs font-medium">
                        Accepts standard AS9102 / DFM .xlsx or .xls files
                      </span>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Drawing Number & Title & Rev Editable Inputs for Flow 3 */}
            <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-amber-500" />
                  <span>Drawing Details (From Title Block):</span>
                </span>
                <span className="text-[10px] text-slate-500 font-medium">Editable &bull; Propagated across all loops &amp; review</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Drawing Number (Part #) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={f3DetectedPartNumber}
                    onChange={(e) => setF3DetectedPartNumber(e.target.value)}
                    placeholder="e.g. 4938-5-004 (4)"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 font-mono font-bold text-xs focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Drawing Title (Part Name) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={f3PartName}
                    onChange={(e) => setF3PartName(e.target.value)}
                    placeholder="e.g. Precision Housing Assembly"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 font-bold text-xs focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Revision Code
                  </label>
                  <input
                    type="text"
                    value={f3DetectedRevCode}
                    onChange={(e) => setF3DetectedRevCode(e.target.value)}
                    placeholder="e.g. Rev 0.1 or Rev AC"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 font-mono text-xs focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t-2 border-neutral-100 flex justify-end">
              <button
                onClick={handleLaunchFlow3}
                disabled={f3IsAnalyzing || !f3DrawingUrl}
                className="px-6 py-3 bg-slate-950 hover:bg-slate-800 disabled:opacity-50 text-amber-400 hover:text-amber-300 rounded-xl font-bold flex items-center gap-2 shadow-lg border border-slate-900 transition-all cursor-pointer text-xs"
              >
                {f3IsAnalyzing ? (
                  <>
                    <Clock className="w-4 h-4 animate-spin text-amber-400" />
                    <span>Resuming Review Session...</span>
                  </>
                ) : (
                  <>
                    <SearchCheck className="w-4 h-4 text-amber-400" />
                    <span>Resume Work &amp; Launch Review Session</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Clean Bottom Bar with Stryker Yellow Highlights */}
      <div className="max-w-6xl mx-auto w-full pt-4 border-t-2 border-neutral-200 flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-600 font-medium">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 border border-amber-600" />
          <span>Local Engine &bull; Vector CAD &amp; Multi-Page PDF Canvas &bull; AS9102 Revision Audit Trail</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadStandardTemplate}
            className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-neutral-100 text-black border-2 border-neutral-300 flex items-center gap-1.5 transition-colors font-bold cursor-pointer shadow-xs"
            title="Download AS9102 / DFM standard Excel tracker template"
          >
            <Download className="w-3.5 h-3.5 text-black" />
            <span>Download AS9102 Template (.xlsx)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
