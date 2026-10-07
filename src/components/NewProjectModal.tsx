import React, { useState, useRef } from 'react';
import { DFMProject } from '../types/dfm';
import { SAMPLE_DRAWING_REV_A_SVG } from '../utils/sampleDrawings';
import { convertPdfToImage } from '../utils/pdfRenderer';
import { X, FolderPlus, Upload, FileText, Clock } from 'lucide-react';

interface NewProjectModalProps {
  onClose: () => void;
  onCreateProject: (project: DFMProject) => void;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  onClose,
  onCreateProject,
}) => {
  const [partNumber, setPartNumber] = useState('AO-9200-A');
  const [partName, setPartName] = useState('Hydraulic Manifold Block');
  const [projectLead, setProjectLead] = useState('Priyanshu Sharma');
  const [department, setDepartment] = useState('Advanced Operations (AO)');
  const [description, setDescription] = useState('Early concept DFM review and tolerance stack-up analysis.');
  
  const [drawingUrl, setDrawingUrl] = useState(SAMPLE_DRAWING_REV_A_SVG);
  const [drawingType, setDrawingType] = useState<'svg' | 'image'>('svg');
  const [fileName, setFileName] = useState('Initial_Concept.dwg');
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

    const today = new Date().toISOString().split('T')[0];
    const initialRevId = `rev-01-${Date.now()}`;

    const newProject: DFMProject = {
      id: `proj-${Date.now()}`,
      partNumber: partNumber.trim(),
      partName: partName.trim(),
      projectLead: projectLead.trim(),
      department: department.trim(),
      description: description.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      activeRevisionId: initialRevId,
      revisions: [
        {
          id: initialRevId,
          revCode: 'Rev 0.1',
          title: 'Initial Concept DFM Loop',
          description: 'Initial concept drawing drop for AO manufacturability and inspection review.',
          date: today,
          author: projectLead,
          drawingUrl,
          drawingType,
          drawingFileName: fileName,
          iteration: 1,
          balloons: [],
        },
      ],
    };

    onCreateProject(newProject);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-blue-600/30 text-blue-400 border border-blue-500/40">
              <FolderPlus className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Create New DFM Project</h2>
              <p className="text-xs text-slate-400">Initialize a new part for multi-revision DFM loop tracking</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Part Number</label>
              <input
                type="text"
                value={partNumber}
                onChange={(e) => setPartNumber(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono font-bold"
                placeholder="e.g. AO-4820-D"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">Lead Engineer</label>
              <input
                type="text"
                value={projectLead}
                onChange={(e) => setProjectLead(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
                placeholder="e.g. John Doe (AO)"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1">Part / Assembly Name</label>
            <input
              type="text"
              value={partName}
              onChange={(e) => setPartName(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
              placeholder="e.g. Precision Actuator Housing"
            />
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1">Division / Department</label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
            />
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1">Project Brief</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white resize-none"
            />
          </div>

          {/* Initial Drawing Upload */}
          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <span className="font-semibold text-slate-200 block">Initial Engineering Drawing (Rev 0.1)</span>
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
                isDragging ? 'border-blue-500 bg-blue-950/40' : 'border-transparent'
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
                <span>Upload Drawing Image/SVG/PDF</span>
              </button>
              <span className="text-slate-400 truncate max-w-[200px]">
                {fileName ? `✓ ${fileName}` : 'Default template'}
              </span>
              {isPdfRendering && (
                <span className="text-blue-400 flex items-center gap-1 text-[11px] animate-pulse">
                  <Clock className="w-3.5 h-3.5 animate-spin" />
                  Rendering PDF...
                </span>
              )}
            </div>
          </div>

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
              Start DFM Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
