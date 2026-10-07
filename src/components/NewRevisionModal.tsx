import React, { useState, useRef } from 'react';
import { DrawingRevision, DFMProject, BalloonItem, DFMStatus, RevisionTraceRecord } from '../types/dfm';
import { convertPdfToImage } from '../utils/pdfRenderer';
import { 
  X, 
  Layers, 
  Upload, 
  CheckCircle2, 
  Copy, 
  PlusCircle, 
  AlertCircle,
  Clock 
} from 'lucide-react';

interface NewRevisionModalProps {
  project: DFMProject;
  activeRevision: DrawingRevision;
  onClose: () => void;
  onCreateRevision: (newRevision: DrawingRevision) => void;
}

export const NewRevisionModal: React.FC<NewRevisionModalProps> = ({
  project,
  activeRevision,
  onClose,
  onCreateRevision,
}) => {
  const nextRevNumber = project.revisions.length + 1;
  const [revCode, setRevCode] = useState(`Rev 0.${nextRevNumber}`);
  const [title, setTitle] = useState(`DFM Loop ${nextRevNumber} Review`);
  const [description, setDescription] = useState(
    'Subsequent drawing update incorporating tooling feedback, tolerance adjustments, and supplier concurrence.'
  );
  const [ecnNumber, setEcnNumber] = useState(`ECN-2026-${String(100 + nextRevNumber)}`);
  const [carryForwardOpenBalloons, setCarryForwardOpenBalloons] = useState(true);
  const [drawingUrl, setDrawingUrl] = useState(activeRevision.drawingUrl);
  const [drawingType, setDrawingType] = useState<'svg' | 'image'>(activeRevision.drawingType);
  const [fileName, setFileName] = useState('');
  const [isPdfRendering, setIsPdfRendering] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    setFileName(file.name);

    if (file.name.endsWith('.svg') || file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = (event) => {
        setDrawingUrl(event.target?.result as string);
        setDrawingType('svg');
      };
      reader.readAsText(file);
    } else if (file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf') {
      try {
        setIsPdfRendering(true);
        const pngUrl = await convertPdfToImage(file);
        setDrawingUrl(pngUrl);
        setDrawingType('image');
      } catch (err: any) {
        console.warn('PDF conversion fallback:', err);
        const reader = new FileReader();
        reader.onload = (event) => {
          setDrawingUrl(event.target?.result as string);
          setDrawingType('image');
        };
        reader.readAsDataURL(file);
      } finally {
        setIsPdfRendering(false);
      }
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        setDrawingUrl(event.target?.result as string);
        setDrawingType('image');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newRevId = `rev-0${nextRevNumber}-${Date.now()}`;
    const today = new Date().toISOString().split('T')[0];

    // Determine carried forward balloons
    let balloonsForNewRev: BalloonItem[] = [];

    if (carryForwardOpenBalloons) {
      balloonsForNewRev = activeRevision.balloons.map((b) => {
        const isAddressed = b.status === 'ADDRESSED';
        const newTraceStatus: DFMStatus = isAddressed ? 'ADDRESSED' : 'UNCHANGED';
        const newHistory: RevisionTraceRecord[] = [
          ...b.revisionHistory,
          {
            revisionId: newRevId,
            revisionName: revCode,
            date: today,
            nominalValue: b.nominalValue,
            upperTol: b.upperTol,
            lowerTol: b.lowerTol,
            status: newTraceStatus,
            summaryOfAction: isAddressed 
              ? `Carried forward as addressed in ${revCode}.`
              : `Carried forward from ${activeRevision.revCode} pending resolution.`,
            verifiedInThisRev: isAddressed,
          }
        ];

        return {
          ...b,
          id: `b-${b.balloonNumber}-${Date.now()}`,
          status: newTraceStatus,
          revisionHistory: newHistory,
        };
      });
    }

    const newRevision: DrawingRevision = {
      id: newRevId,
      revCode,
      title,
      description,
      date: today,
      author: project.projectLead,
      drawingUrl,
      drawingType,
      drawingFileName: fileName || `${project.partNumber}_${revCode}.dwg`,
      ecnNumber,
      iteration: (activeRevision.iteration || 1) + 1,
      sourceExcelName: activeRevision.sourceExcelName,
      balloons: balloonsForNewRev,
    };

    onCreateRevision(newRevision);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-indigo-600/30 text-indigo-400 border border-indigo-500/40">
              <PlusCircle className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Create New DFM Revision Loop</h2>
              <p className="text-xs text-slate-400">Step up revision and trace changes from {activeRevision.revCode}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs flex-1 overflow-y-auto">
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">New Revision Code</label>
              <input
                type="text"
                value={revCode}
                onChange={(e) => setRevCode(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-bold"
                placeholder="e.g. Rev 0.3 or Rev B"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">ECN / Change Notice #</label>
              <input
                type="text"
                value={ecnNumber}
                onChange={(e) => setEcnNumber(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono"
                placeholder="e.g. ECN-2026-095"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1">DFM Loop Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
              placeholder="e.g. Pre-Production Tooling Release"
            />
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1">Scope / Description of Changes</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white resize-none"
              placeholder="Summary of what changed in this drawing release..."
            />
          </div>

          {/* Drawing Upload */}
          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200">Drawing Sheet for New Revision</span>
              <span className="text-[11px] text-slate-400">SVG, PNG, JPG, or PDF export</span>
            </div>

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
              className={`flex items-center gap-2 p-2 rounded-lg border transition-colors ${
                isDragging ? 'border-indigo-500 bg-indigo-950/40' : 'border-transparent'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".pdf,.svg,.png,.jpg,.jpeg,.webp"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 font-medium transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload New Drawing File</span>
              </button>
              <span className="text-slate-400 truncate max-w-[200px]">
                {fileName ? `✓ ${fileName}` : 'Using current drawing as template'}
              </span>
              {isPdfRendering && (
                <span className="text-indigo-400 flex items-center gap-1 text-[11px] animate-pulse">
                  <Clock className="w-3.5 h-3.5 animate-spin" />
                  Rendering PDF...
                </span>
              )}
            </div>
          </div>

          {/* Traceability Carry-Forward Option */}
          <div className="bg-indigo-950/20 p-3.5 rounded-xl border border-indigo-900/40 space-y-2">
            <div className="flex items-start gap-2.5">
              <input
                type="checkbox"
                id="carry-forward"
                checked={carryForwardOpenBalloons}
                onChange={(e) => setCarryForwardOpenBalloons(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700 mt-0.5 cursor-pointer"
              />
              <div>
                <label htmlFor="carry-forward" className="font-semibold text-indigo-300 block cursor-pointer">
                  Auto Carry-Forward DFM Balloons &amp; Feedback Traceability
                </label>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                  Automatically migrates all {activeRevision.balloons.length} balloons and their complete comment history from {activeRevision.revCode} into {revCode}. Eliminates manual copy-pasting across Excel sheets!
                </p>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-colors shadow-lg shadow-blue-600/20"
            >
              Launch {revCode} DFM Loop
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
