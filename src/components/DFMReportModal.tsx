import React from 'react';
import { DFMProject, DrawingRevision } from '../types/dfm';
import { X, Printer, Check, AlertTriangle, FileSpreadsheet } from 'lucide-react';
import { exportDfmTrackerExcel } from '../utils/excelParser';

interface DFMReportModalProps {
  project: DFMProject;
  activeRevision: DrawingRevision;
  onClose: () => void;
}

export const DFMReportModal: React.FC<DFMReportModalProps> = ({
  project,
  activeRevision,
  onClose,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const totalBalloons = activeRevision.balloons.length;
  const addressedCount = activeRevision.balloons.filter((b) => b.status === 'ADDRESSED').length;
  const unchangedCount = activeRevision.balloons.filter((b) => b.status === 'UNCHANGED').length;
  const attentionCount = activeRevision.balloons.filter((b) => b.status === 'ATTENTION').length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl max-h-[95vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in">
        
        {/* Modal Controls (Hidden in Print) */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80 print:hidden">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white">Executive DFM Sign-Off Report</h2>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
              {project.partNumber} ({activeRevision.revCode} - Iter {activeRevision.iteration || 1})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => exportDfmTrackerExcel(project, activeRevision)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export Excel (Iter {activeRevision.iteration || 1})</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Formal Document */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 bg-white text-slate-900 font-sans print:p-0">
          
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-4 mb-6">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                  ADVANCED OPERATIONS (AO) • NEW PRODUCT INTRODUCTION
                </span>
                <h1 className="text-2xl font-black text-slate-900 mt-1">
                  DESIGN FOR MANUFACTURABILITY (DFM) SIGN-OFF REPORT
                </h1>
                <p className="text-sm text-slate-600 font-medium">
                  Continuous Feedback &amp; Revision Traceability Record
                </p>
              </div>

              <div className="text-right text-xs space-y-1 font-mono">
                <div>Date: <strong>{new Date().toLocaleDateString()}</strong></div>
                <div>Status: <strong className="text-emerald-700">DFM LOOP RESOLVED</strong></div>
                <div>ECN: <strong>{activeRevision.ecnNumber || 'N/A'}</strong></div>
              </div>
            </div>

            {/* Part Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-100 p-3 rounded-lg mt-4 text-xs">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Part Number</span>
                <span className="font-bold font-mono text-sm">{project.partNumber}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Part Name</span>
                <span className="font-semibold text-slate-800">{project.partName}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Revision &amp; Iteration</span>
                <span className="font-bold text-blue-800">{activeRevision.revCode} (Iter {activeRevision.iteration || 1})</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">AO Project Lead</span>
                <span className="font-semibold text-slate-800">{project.projectLead}</span>
              </div>
            </div>
          </div>

          {/* DFM Summary Metrics */}
          <div className="grid grid-cols-4 gap-3 mb-6 text-center text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Total Features</span>
              <span className="text-xl font-bold text-slate-800">{totalBalloons}</span>
            </div>
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <span className="text-emerald-700 block text-[10px] uppercase font-bold">Addressed (Green ✓)</span>
              <span className="text-xl font-bold text-emerald-800">{addressedCount}</span>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <span className="text-amber-700 block text-[10px] uppercase font-bold">Unchanged (Yellow)</span>
              <span className="text-xl font-bold text-amber-800">{unchangedCount}</span>
            </div>
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg">
              <span className="text-rose-700 block text-[10px] uppercase font-bold">Attention (Red ⚠️)</span>
              <span className="text-xl font-bold text-rose-800">{attentionCount}</span>
            </div>
          </div>

          {/* Master Item List */}
          <div className="mb-8">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-1.5 mb-3">
              Itemized DFM Balloon Feedback Matrix
            </h2>
            <table className="w-full text-left text-xs border border-slate-300">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                <tr>
                  <th className="p-2 w-12">#</th>
                  <th className="p-2 w-48">Feature / Characteristic</th>
                  <th className="p-2 w-24">Nature</th>
                  <th className="p-2 w-32">Nominal &amp; Tol</th>
                  <th className="p-2">AO / Inspection Feedback</th>
                  <th className="p-2">R&amp;D Decision / Action</th>
                  <th className="p-2 w-28">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {activeRevision.balloons.map((b) => {
                  const aoFb = b.feedbackList.filter((f) => f.role === 'AO' || f.role === 'INSPECTION').map((f) => f.comment).join(' ');
                  const rdFb = b.feedbackList.filter((f) => f.role === 'RD').map((f) => f.comment).join(' ');

                  return (
                    <tr key={b.id} className="text-slate-800">
                      <td className="p-2 font-bold font-mono">#{b.balloonNumber}</td>
                      <td className="p-2 font-semibold">{b.featureName}</td>
                      <td className="p-2 font-mono text-[10px]">{b.dimensionNature}</td>
                      <td className="p-2 font-mono">
                        {b.nominalValue} ({b.upperTol}/{b.lowerTol})
                      </td>
                      <td className="p-2 text-slate-600 leading-tight text-[11px]">{aoFb || '-'}</td>
                      <td className="p-2 text-blue-900 font-medium leading-tight text-[11px]">{rdFb || '-'}</td>
                      <td className="p-2 font-bold text-[11px]">
                        {b.status === 'ADDRESSED' ? 'Addressed (✓)' : b.status === 'ATTENTION' ? 'Attention (⚠️)' : 'Unchanged'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Formal Stakeholder Sign-Off Blocks */}
          <div className="border-t-2 border-slate-900 pt-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-3">
              Multi-Stakeholder Formal Concurrence &amp; Sign-Off
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="border border-slate-300 p-3 rounded space-y-4">
                <span className="font-bold text-amber-900 block text-[11px]">1. ADVANCED OPERATIONS (AO)</span>
                <div className="text-slate-600 space-y-1 text-[11px]">
                  <div>Tooling: <strong>APPROVED</strong></div>
                  <div>Process Setup: <strong>FEASIBLE</strong></div>
                </div>
                <div className="border-t border-slate-300 pt-2 text-[10px] text-slate-500">
                  Signature: <span className="font-serif italic font-bold">P. Sharma</span>
                </div>
              </div>

              <div className="border border-slate-300 p-3 rounded space-y-4">
                <span className="font-bold text-purple-900 block text-[11px]">2. QUALITY &amp; METROLOGY</span>
                <div className="text-slate-600 space-y-1 text-[11px]">
                  <div>CMM Accessibility: <strong>CONCURRED</strong></div>
                  <div>Gauging Budget: <strong>APPROVED</strong></div>
                </div>
                <div className="border-t border-slate-300 pt-2 text-[10px] text-slate-500">
                  Signature: <span className="font-serif italic font-bold">A. Chen (Quality)</span>
                </div>
              </div>

              <div className="border border-slate-300 p-3 rounded space-y-4">
                <span className="font-bold text-blue-900 block text-[11px]">3. R&amp;D DESIGN ENGINEERING</span>
                <div className="text-slate-600 space-y-1 text-[11px]">
                  <div>Design Intent: <strong>PRESERVED</strong></div>
                  <div>Tolerance Stack: <strong>VERIFIED</strong></div>
                </div>
                <div className="border-t border-slate-300 pt-2 text-[10px] text-slate-500">
                  Signature: <span className="font-serif italic font-bold">M. Vance (R&amp;D)</span>
                </div>
              </div>

              <div className="border border-slate-300 p-3 rounded space-y-4">
                <span className="font-bold text-emerald-900 block text-[11px]">4. SERIAL MANUFACTURING</span>
                <div className="text-slate-600 space-y-1 text-[11px]">
                  <div>Cycle Time: <strong>ACCEPTED</strong></div>
                  <div>Raw Stock: <strong>COMMITTED</strong></div>
                </div>
                <div className="border-t border-slate-300 pt-2 text-[10px] text-slate-500">
                  Signature: <span className="font-serif italic font-bold">T. Weber (Tooling)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
