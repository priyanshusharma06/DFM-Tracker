import React, { useState, useRef, useEffect } from 'react';
import { 
  DFMProject, 
  DrawingRevision, 
  StakeholderRole, 
  STAKEHOLDER_CONFIGS 
} from '../types/dfm';
import { 
  FileSpreadsheet, 
  Download, 
  Upload, 
  PlusCircle, 
  Printer, 
  GitCompare, 
  RotateCcw,
  Layers,
  Wrench,
  ScanEye,
  Compass,
  Factory,
  CheckCircle2,
  Home,
  Check,
  AlertTriangle,
  Crosshair,
  TableProperties,
  Split,
  FileDown,
  Pencil,
  X
} from 'lucide-react';
import { exportDfmTrackerExcel } from '../utils/excelParser';
import { exportDfmDrawingPdf } from '../utils/pdfExport';
import { exportProjectToJson } from '../utils/exportUtils';

interface HeaderProps {
  project: DFMProject;
  activeRevision: DrawingRevision;
  currentRole: StakeholderRole;
  onRoleChange: (role: StakeholderRole) => void;
  onSelectRevision: (revisionId: string) => void;
  onOpenNewRevisionModal: () => void;
  onOpenReportModal: () => void;
  onReturnToHome: () => void;
  activeTab: 'drawing' | 'matrix' | 'traceability' | 'diff';
  onTabChange: (tab: 'drawing' | 'matrix' | 'traceability' | 'diff') => void;
  onShowToast?: (message: string, type?: 'success' | 'error' | 'info' | 'warning', title?: string) => void;
  onTriggerUploadOldDrawing?: () => void;
  onUpdateProjectDetails?: (updates: {
    partNumber?: string;
    partName?: string;
    revCode?: string;
    projectLead?: string;
  }) => void;
}

export const Header: React.FC<HeaderProps> = ({
  project,
  activeRevision,
  currentRole,
  onRoleChange,
  onSelectRevision,
  onOpenNewRevisionModal,
  onOpenReportModal,
  onReturnToHome,
  activeTab,
  onTabChange,
  onShowToast,
  onTriggerUploadOldDrawing,
  onUpdateProjectDetails,
}) => {
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [showNewRevConfirm, setShowNewRevConfirm] = useState(false);
  const [showEditDetailsModal, setShowEditDetailsModal] = useState(false);
  const [editPartNumber, setEditPartNumber] = useState(project.partNumber);
  const [editPartName, setEditPartName] = useState(project.partName);
  const [editRevCode, setEditRevCode] = useState(activeRevision.revCode);
  const [editLead, setEditLead] = useState(project.projectLead);

  // Sync edit state when project changes
  useEffect(() => {
    setEditPartNumber(project.partNumber);
    setEditPartName(project.partName);
    setEditRevCode(activeRevision.revCode);
    setEditLead(project.projectLead);
  }, [project.partNumber, project.partName, activeRevision.revCode, project.projectLead]);

  const getRoleIcon = (role: StakeholderRole) => {
    switch (role) {
      case 'AO':
        return <Wrench className="w-3.5 h-3.5" />;
      case 'INSPECTION':
        return <ScanEye className="w-3.5 h-3.5" />;
      case 'RD':
        return <Compass className="w-3.5 h-3.5" />;
      case 'SUPPLIER':
        return <Factory className="w-3.5 h-3.5" />;
    }
  };

  const totalBalloons = activeRevision.balloons.length;
  const addressedCount = activeRevision.balloons.filter((b) => b.status === 'ADDRESSED').length;
  const unchangedCount = activeRevision.balloons.filter((b) => b.status === 'UNCHANGED').length;
  const attentionCount = activeRevision.balloons.filter((b) => b.status === 'ATTENTION').length;

  const handleExportExcel = async () => {
    try {
      const fn = await exportDfmTrackerExcel(project, activeRevision);
      if (onShowToast) {
        onShowToast(`Exported tracker: ${fn}`, 'success', 'Excel Export Ready');
      }
    } catch (err: any) {
      onShowToast?.(`Excel export error: ${err.message || err}`, 'error');
    }
  };

  const handleExportPdf = async () => {
    try {
      setIsExportingPdf(true);
      const filename = await exportDfmDrawingPdf(project, activeRevision);
      onShowToast?.(`Exported "${filename}" with comments ready for PDF review!`, 'success', 'PDF Export Ready');
    } catch (err: any) {
      onShowToast?.(`PDF export failed: ${err.message || err}`, 'error', 'Export Error');
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <header className="bg-white border-b-2 border-slate-200 select-none shadow-xs">
      {/* Top Bar */}
      <div className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100">
        
        {/* Project & Home Navigation */}
        <div className="flex items-center gap-3">
          <button
            onClick={onReturnToHome}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-300 text-xs font-bold transition-colors cursor-pointer shadow-xs"
            title="Return to Main Starting Screen (Flow 1, Flow 2, Flow 3)"
          >
            <Home className="w-3.5 h-3.5 text-slate-700" />
            <span>Home</span>
          </button>

          <div>
            <div className="flex items-center gap-2">
              <div 
                onClick={() => setShowEditDetailsModal(true)}
                className="group flex items-center gap-1.5 cursor-pointer rounded-lg px-2 py-0.5 -mx-2 hover:bg-slate-100 transition-colors"
                title="Click to edit Drawing Number & Title across all loops"
              >
                <h1 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <span className="group-hover:text-amber-600 transition-colors">{project.partNumber}</span>
                  <span className="text-slate-300 font-normal">|</span>
                  <span className="text-slate-700 font-semibold text-xs sm:text-sm group-hover:text-slate-950 transition-colors">{project.partName}</span>
                </h1>
                <span className="opacity-60 group-hover:opacity-100 p-1 text-slate-400 group-hover:text-amber-600 transition-opacity">
                  <Pencil className="w-3.5 h-3.5" />
                </span>
              </div>

              <button
                type="button"
                onClick={() => setShowEditDetailsModal(true)}
                className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 transition-colors cursor-pointer shadow-2xs"
                title="Edit Drawing Number & Title across all loops"
              >
                <Pencil className="w-3 h-3 text-amber-800" />
                <span>Edit Drawing Info</span>
              </button>
              
              {/* Revision Switcher Pills directly in header */}
              {project.revisions.length > 1 ? (
                <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                  {project.revisions.map((rev) => {
                    const isActive = rev.id === activeRevision.id;
                    return (
                      <button
                        key={rev.id}
                        onClick={() => onSelectRevision(rev.id)}
                        className={`px-2.5 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                          isActive
                            ? 'bg-slate-900 text-amber-300 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                        }`}
                        title={`${rev.title} (Iteration ${rev.iteration || 1})`}
                      >
                        {rev.revCode}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 border border-amber-500 font-mono font-black shadow-xs">
                  {activeRevision.revCode} (Iter {activeRevision.iteration || 1})
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
              <span>Lead: <strong className="text-slate-800">{project.projectLead}</strong></span>
              <span>•</span>
              <span className="flex items-center gap-1 text-emerald-800 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                <Check className="w-3 h-3 stroke-[3] text-emerald-600" />
                {addressedCount} Addressed
              </span>
              <span>•</span>
              <span className="text-amber-900 font-bold bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                {unchangedCount} Unchanged
              </span>
              {attentionCount > 0 && (
                <>
                  <span>•</span>
                  <span className="text-rose-900 font-extrabold bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200 flex items-center gap-0.5">
                    <AlertTriangle className="w-3 h-3 text-rose-600" />
                    {attentionCount} Attention
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* View Switcher Tabs (Unified directly into header) */}
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1 border border-slate-200">
          <button
            onClick={() => onTabChange('drawing')}
            className={`px-3 py-1.5 rounded-md text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'drawing'
                ? 'bg-slate-900 text-white font-bold shadow-xs'
                : 'text-slate-700 hover:text-slate-950 font-semibold'
            }`}
          >
            <Crosshair className={`w-3.5 h-3.5 ${activeTab === 'drawing' ? 'text-amber-400' : 'text-slate-500'}`} />
            <span>Drawing &amp; Markup</span>
          </button>

          <button
            onClick={() => onTabChange('matrix')}
            className={`px-3 py-1.5 rounded-md text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'matrix'
                ? 'bg-slate-900 text-white font-bold shadow-xs'
                : 'text-slate-700 hover:text-slate-950 font-semibold'
            }`}
          >
            <FileSpreadsheet className={`w-3.5 h-3.5 ${activeTab === 'matrix' ? 'text-emerald-400' : 'text-emerald-600'}`} />
            <span>Feedback Matrix</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${activeTab === 'matrix' ? 'bg-amber-400 text-slate-950' : 'bg-slate-200 text-slate-800'}`}>
              {totalBalloons}
            </span>
          </button>

          <button
            onClick={() => onTabChange('traceability')}
            className={`px-3 py-1.5 rounded-md text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'traceability'
                ? 'bg-slate-900 text-white font-bold shadow-xs'
                : 'text-slate-700 hover:text-slate-950 font-semibold'
            }`}
          >
            <GitCompare className={`w-3.5 h-3.5 ${activeTab === 'traceability' ? 'text-amber-400' : 'text-amber-600'}`} />
            <span>Continuous Traceability</span>
          </button>

          <button
            onClick={() => {
              if (project.revisions.length <= 1 && !project.comparisonDrawingUrl) {
                if (onTriggerUploadOldDrawing) {
                  onTriggerUploadOldDrawing();
                } else {
                  onTabChange('diff');
                }
              } else {
                onTabChange('diff');
              }
            }}
            className={`px-3 py-1.5 rounded-md text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'diff'
                ? 'bg-slate-900 text-white font-bold shadow-xs'
                : 'text-slate-700 hover:text-slate-950 font-semibold'
            }`}
            title="Side-by-Side Drawing Comparison"
          >
            <Split className={`w-3.5 h-3.5 ${activeTab === 'diff' ? 'text-rose-400' : 'text-rose-600'}`} />
            <span>Side-by-Side Compare</span>
          </button>
        </div>

        {/* Action Buttons (Export PDF, Excel, Report, New Revision) */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* New Revision Loop Button with Mistake Prevention Mechanism */}
          <button
            onClick={() => setShowNewRevConfirm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-amber-300 rounded-lg transition-colors border border-slate-700 shadow-xs cursor-pointer"
            title="Create next revision loop"
          >
            <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>New Revision</span>
          </button>

          {/* Export to Adobe Acrobat PDF with interactive comment annotations */}
          <button
            onClick={handleExportPdf}
            disabled={isExportingPdf}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-rose-700 hover:bg-rose-600 disabled:opacity-50 text-white rounded-lg transition-colors border border-rose-800 shadow-xs cursor-pointer"
            title="Export drawing as PDF where each comment appears in the Adobe Acrobat Comments panel"
          >
            <Download className="w-3.5 h-3.5 text-white" />
            <span>{isExportingPdf ? 'Exporting PDF...' : 'Export Adobe PDF'}</span>
          </button>

          {/* Export to Excel with Revision & Iteration in filename */}
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg transition-colors border border-emerald-800 shadow-xs cursor-pointer"
            title="Export Excel tracker with embedded snips"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
            <span>Export Excel</span>
          </button>

          {/* Print Report */}
          <button
            onClick={onOpenReportModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition-colors border border-slate-300 cursor-pointer shadow-xs"
            title="Print formal DFM executive sign-off summary"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Report</span>
          </button>
        </div>
      </div>

      {/* Edit Drawing Details Modal (Available under ALL loops) */}
      {showEditDetailsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150 text-slate-900">
            {/* Modal Header */}
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Edit Drawing Identification</h3>
                  <p className="text-[11px] text-slate-400">Updates title &amp; number across all loops and exports</p>
                </div>
              </div>
              <button
                onClick={() => setShowEditDetailsModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onUpdateProjectDetails?.({
                  partNumber: editPartNumber,
                  partName: editPartName,
                  revCode: editRevCode,
                  projectLead: editLead,
                });
                setShowEditDetailsModal(false);
              }}
              className="p-5 space-y-4 text-xs"
            >
              {/* Quick Preset Buttons if detected */}
              {(editPartNumber.includes('(4)') || editPartNumber.includes('4938-5-004')) && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 space-y-1.5">
                  <span className="text-[11px] font-bold text-amber-900 block">Quick Auto-Fix Presets:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {editPartNumber.includes('(4)') && (
                      <button
                        type="button"
                        onClick={() => {
                          const cleaned = editPartNumber.replace(/\s*\(\d+\)/g, '').trim();
                          setEditPartNumber(cleaned);
                        }}
                        className="px-2 py-1 rounded bg-amber-200 hover:bg-amber-300 text-amber-950 font-bold text-[10px] cursor-pointer transition-colors"
                      >
                        Clean &apos;(4)&apos; Copy Counter
                      </button>
                    )}
                    {editPartNumber.includes('4938-5-004') && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditPartNumber('4938-5-004');
                          setEditPartName('HLRF Drill Bit');
                          setEditRevCode('Rev AC');
                        }}
                        className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold text-[10px] cursor-pointer transition-colors"
                      >
                        Set Stryker 4938-5-004 (HLRF Drill Bit / Rev AC)
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Drawing Number */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Drawing Number (Part Number) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={editPartNumber}
                  onChange={(e) => setEditPartNumber(e.target.value)}
                  placeholder="e.g. 4938-5-004 or AO-4820-D"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 text-slate-900 font-mono font-bold text-xs focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none"
                  required
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">Shown in header, PDF export title, and Excel tracker</span>
              </div>

              {/* Drawing Title */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Drawing Title (Part Name) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={editPartName}
                  onChange={(e) => setEditPartName(e.target.value)}
                  placeholder="e.g. HLRF Drill Bit"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 text-slate-900 font-semibold text-xs focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none"
                  required
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">Drawing title from print title block</span>
              </div>

              {/* Revision Code & Lead */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Revision Code</label>
                  <input
                    type="text"
                    value={editRevCode}
                    onChange={(e) => setEditRevCode(e.target.value)}
                    placeholder="e.g. Rev 0.1 or Rev AC"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 text-slate-900 font-mono text-xs focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Project Lead</label>
                  <input
                    type="text"
                    value={editLead}
                    onChange={(e) => setEditLead(e.target.value)}
                    placeholder="e.g. Priyanshu Sharma (AO)"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 text-slate-900 text-xs focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditDetailsModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold text-xs transition-colors shadow-xs cursor-pointer"
                >
                  Save &amp; Update Everywhere
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
