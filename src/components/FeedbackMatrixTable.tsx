import React, { useState } from 'react';
import { 
  DrawingRevision, 
  BalloonItem, 
  StakeholderRole, 
  DFMStatus,
  DimensionNature,
  STAKEHOLDER_CONFIGS,
  DFMProject 
} from '../types/dfm';
import { 
  Search, 
  Filter, 
  Download, 
  Check, 
  AlertTriangle, 
  FileSpreadsheet, 
  ChevronRight,
  Eye,
  EyeOff,
  History
} from 'lucide-react';
import { exportDfmTrackerExcel } from '../utils/excelParser';

interface FeedbackMatrixTableProps {
  project: DFMProject;
  activeRevision: DrawingRevision;
  onSelectBalloon: (balloon: BalloonItem) => void;
  onNavigateToDrawing: (balloonId: string) => void;
  onUpdateBalloonStatus: (balloonId: string, newStatus: DFMStatus) => void;
  onToggleRelevance: (balloonId: string, isRelevant: boolean) => void;
  currentRole: StakeholderRole;
  onShowToast?: (message: string, type?: 'success' | 'error' | 'info' | 'warning', title?: string) => void;
}

export const FeedbackMatrixTable: React.FC<FeedbackMatrixTableProps> = ({
  project,
  activeRevision,
  onSelectBalloon,
  onNavigateToDrawing,
  onUpdateBalloonStatus,
  onToggleRelevance,
  currentRole,
  onShowToast,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ADDRESSED' | 'UNCHANGED' | 'ATTENTION'>('ALL');
  const [hideNonRelevant, setHideNonRelevant] = useState(false);

  // Filtered list
  const filteredBalloons = activeRevision.balloons.filter((b) => {
    if (hideNonRelevant && !b.isRelevant) return false;
    if (statusFilter !== 'ALL' && b.status !== statusFilter) return false;

    if (searchTerm) {
      const match =
        b.featureName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.nominalValue.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(b.balloonNumber).includes(searchTerm) ||
        b.feedbackList.some((f) => f.comment.toLowerCase().includes(searchTerm.toLowerCase()));
      if (!match) return false;
    }

    return true;
  });

  const totalCount = activeRevision.balloons.length;
  const addressedCount = activeRevision.balloons.filter((b) => b.status === 'ADDRESSED').length;
  const unchangedCount = activeRevision.balloons.filter((b) => b.status === 'UNCHANGED').length;
  const attentionCount = activeRevision.balloons.filter((b) => b.status === 'ATTENTION').length;

  const handleExport = async () => {
    try {
      const fn = await exportDfmTrackerExcel(project, activeRevision);
      if (onShowToast) {
        onShowToast(`Exported: ${fn} (with continuous revision & iteration audit trail)`, 'success', 'Excel Export Ready');
      }
    } catch (err: any) {
      onShowToast?.(`Export error: ${err.message || err}`, 'error');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 text-slate-900 overflow-hidden">
      
      {/* Top Status & Summary Bar */}
      <div className="p-4 border-b border-slate-200 bg-white grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Total Tracked Features</div>
          <div className="text-2xl font-black text-slate-900 mt-0.5">{totalCount}</div>
        </div>

        <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200 shadow-xs">
          <div className="text-[11px] text-emerald-800 font-semibold flex items-center gap-1 uppercase tracking-wider">
            <Check className="w-3.5 h-3.5 stroke-[3] text-emerald-600" />
            <span>Addressed (Green ✓)</span>
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-0.5">
            {addressedCount} <span className="text-xs font-semibold text-emerald-600">({Math.round((addressedCount / (totalCount || 1)) * 100)}%)</span>
          </div>
        </div>

        <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200 shadow-xs">
          <div className="text-[11px] text-amber-800 font-semibold uppercase tracking-wider">Unchanged (Yellow)</div>
          <div className="text-2xl font-black text-amber-600 mt-0.5">{unchangedCount}</div>
        </div>

        <div className="bg-rose-50/70 p-3 rounded-xl border border-rose-200 shadow-xs">
          <div className="text-[11px] text-rose-800 font-semibold flex items-center gap-1 uppercase tracking-wider">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>Attention (Red ⚠️)</span>
          </div>
          <div className="text-2xl font-black text-rose-600 mt-0.5">{attentionCount}</div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="p-3 border-b border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3 text-xs">
        
        {/* Search */}
        <div className="flex items-center gap-2 flex-1 min-w-[240px] max-w-md bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-300">
          <Search className="w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search balloon #, feature, tolerance, or comments..."
            className="w-full bg-transparent text-slate-900 placeholder-slate-400 focus:outline-none text-xs font-medium"
          />
        </div>

        {/* Toggles & Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Toggle Non-Relevant features */}
          <button
            onClick={() => setHideNonRelevant(!hideNonRelevant)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
              hideNonRelevant
                ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
                : 'bg-slate-100 text-slate-700 border-slate-300 hover:text-slate-900 font-medium'
            }`}
          >
            {hideNonRelevant ? <EyeOff className="w-3.5 h-3.5 text-amber-700" /> : <Eye className="w-3.5 h-3.5 text-slate-500" />}
            <span>Hide Non-Relevant (REF/Basic)</span>
          </button>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                statusFilter === 'ALL' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('ADDRESSED')}
              className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                statusFilter === 'ADDRESSED' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              Addressed (✓)
            </button>
            <button
              onClick={() => setStatusFilter('UNCHANGED')}
              className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                statusFilter === 'UNCHANGED' ? 'bg-amber-400 text-slate-950 shadow-xs' : 'text-slate-600 hover:text-amber-700'
              }`}
            >
              Unchanged
            </button>
            <button
              onClick={() => setStatusFilter('ATTENTION')}
              className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                statusFilter === 'ATTENTION' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:text-rose-700'
              }`}
            >
              Attention (⚠️)
            </button>
          </div>

          {/* Export to Excel */}
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg transition-colors font-bold shadow-xs cursor-pointer ml-1"
            title="Export DFM Tracker with drawing revision and iteration in filename"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
            <span>Export to Excel (Iter {activeRevision.iteration || 1})</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="flex-1 overflow-auto bg-slate-50">
        <table className="w-full border-collapse text-left text-xs min-w-[1250px]">
          <thead className="bg-slate-100 sticky top-0 z-10 border-b border-slate-300 shadow-xs">
            <tr className="text-slate-700 font-bold">
              <th className="py-2.5 px-3 w-16">#</th>
              <th className="py-2.5 px-3 w-48">Feature Callout</th>
              <th className="py-2.5 px-3 w-28">Classification</th>
              <th className="py-2.5 px-3 w-36">Nominal &amp; Tol</th>
              <th className="py-2.5 px-3 w-44">Status (Click to Toggle)</th>
              <th className="py-2.5 px-3 w-60 bg-slate-200/80 border-x border-slate-300 text-slate-800">
                Previous Rev Comments (Excel)
              </th>
              <th className="py-2.5 px-3 w-60 bg-amber-100/70 text-amber-900 border-r border-slate-300">
                🛠️ AO Feedback
              </th>
              <th className="py-2.5 px-3 w-60 bg-purple-100/70 text-purple-900 border-r border-slate-300">
                🔍 Inspection Feedback
              </th>
              <th className="py-2.5 px-3 w-60 bg-blue-100/70 text-blue-900 border-r border-slate-300">
                📐 R&amp;D Decision
              </th>
              <th className="py-2.5 px-3 w-60 bg-emerald-100/70 text-emerald-900 border-r border-slate-300">
                🏭 Supplier Feedback
              </th>
              <th className="py-2.5 px-3 w-24 text-center">Locate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {filteredBalloons.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-12 text-center text-slate-500 font-medium">
                  No features match the current search or filters.
                </td>
              </tr>
            ) : (
              filteredBalloons.map((b) => {
                const prevFb = b.feedbackList
                  .filter((f) => f.isPreviousRevisionComment)
                  .map((f) => `[${f.role}]: ${f.comment}`)
                  .join(' | ');

                const aoFb = b.feedbackList
                  .filter((f) => !f.isPreviousRevisionComment && f.role === 'AO')
                  .map((f) => f.comment)
                  .join(' | ');

                const inspFb = b.feedbackList
                  .filter((f) => !f.isPreviousRevisionComment && f.role === 'INSPECTION')
                  .map((f) => f.comment)
                  .join(' | ');

                const rdFb = b.feedbackList
                  .filter((f) => !f.isPreviousRevisionComment && f.role === 'RD')
                  .map((f) => f.comment)
                  .join(' | ');

                const supFb = b.feedbackList
                  .filter((f) => !f.isPreviousRevisionComment && f.role === 'SUPPLIER')
                  .map((f) => f.comment)
                  .join(' | ');

                return (
                  <tr
                    key={b.id}
                    onClick={() => onSelectBalloon(b)}
                    className="hover:bg-slate-50 transition-colors cursor-pointer group"
                  >
                    {/* Balloon Number */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-6 h-6 rounded-full font-bold flex items-center justify-center text-[11px] shadow-xs ${
                          b.status === 'ADDRESSED'
                            ? 'bg-emerald-600 text-white'
                            : b.status === 'ATTENTION'
                            ? 'bg-rose-600 text-white'
                            : 'bg-amber-400 text-slate-950 font-black border border-amber-500'
                        }`}>
                          {b.balloonNumber}
                        </span>
                        {b.criticalCharacteristic && (
                          <span className="text-[9px] font-bold px-1 rounded bg-rose-100 text-rose-800 border border-rose-300">
                            CC
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Feature Callout */}
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{b.featureName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{b.dimensionType}</div>
                    </td>

                    {/* Classification */}
                    <td className="py-3 px-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                        b.dimensionNature === 'REFERENCE'
                          ? 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                          : b.dimensionNature === 'BASIC'
                          ? 'bg-cyan-50 text-cyan-800 border border-cyan-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {b.dimensionNature}
                      </span>
                    </td>

                    {/* Nominal & Tolerances */}
                    <td className="py-3 px-3 font-mono">
                      <div className="text-emerald-800 font-black text-xs">
                        {b.nominalValue} {b.unit}
                      </div>
                      <div className="text-[11px] text-slate-600 font-medium">
                        {b.upperTol || b.lowerTol ? (
                          <span>+{b.upperTol} / {b.lowerTol}</span>
                        ) : (
                          <span className="italic text-[10px] text-slate-400">Nominal</span>
                        )}
                      </div>
                    </td>

                    {/* Quick Status Toggle */}
                    <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onUpdateBalloonStatus(b.id, 'ADDRESSED')}
                          className={`px-2 py-1 rounded text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                            b.status === 'ADDRESSED'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 border border-slate-200'
                          }`}
                          title="Mark Addressed (Green ✓)"
                        >
                          <Check className="w-3 h-3 stroke-[3]" />
                          <span>Addressed</span>
                        </button>

                        <button
                          onClick={() => onUpdateBalloonStatus(b.id, 'UNCHANGED')}
                          className={`px-2 py-1 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                            b.status === 'UNCHANGED'
                              ? 'bg-amber-400 text-slate-950 shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:text-amber-800 hover:bg-amber-50 border border-slate-200'
                          }`}
                          title="Mark Unchanged (Yellow, no symbol)"
                        >
                          <span>Unchanged</span>
                        </button>

                        <button
                          onClick={() => onUpdateBalloonStatus(b.id, 'ATTENTION')}
                          className={`px-1.5 py-1 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                            b.status === 'ATTENTION'
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:text-rose-700 hover:bg-rose-50 border border-slate-200'
                          }`}
                          title="Mark Needs Attention (Red ⚠️)"
                        >
                          <AlertTriangle className="w-3 h-3" />
                        </button>
                      </div>
                    </td>

                    {/* Previous Rev Comments from Excel */}
                    <td className="py-3 px-3 bg-slate-50/70 border-x border-slate-200">
                      <p className="text-slate-700 text-[11px] line-clamp-2 leading-relaxed font-medium" title={prevFb}>
                        {prevFb || <span className="text-slate-400 italic">None</span>}
                      </p>
                    </td>

                    {/* AO Feedback */}
                    <td className="py-3 px-3 bg-amber-50/30 border-r border-slate-200">
                      <p className="text-slate-800 text-[11px] line-clamp-2 leading-relaxed font-medium" title={aoFb}>
                        {aoFb || <span className="text-slate-400 italic">Pending</span>}
                      </p>
                    </td>

                    {/* Inspection Feedback */}
                    <td className="py-3 px-3 bg-purple-50/30 border-r border-slate-200">
                      <p className="text-slate-800 text-[11px] line-clamp-2 leading-relaxed font-medium" title={inspFb}>
                        {inspFb || <span className="text-slate-400 italic">Pending</span>}
                      </p>
                    </td>

                    {/* R&D Decision */}
                    <td className="py-3 px-3 bg-blue-50/30 border-r border-slate-200">
                      <p className="text-slate-800 text-[11px] line-clamp-2 leading-relaxed font-medium" title={rdFb}>
                        {rdFb || <span className="text-slate-400 italic">Pending</span>}
                      </p>
                    </td>

                    {/* Supplier Feedback */}
                    <td className="py-3 px-3 bg-emerald-50/30 border-r border-slate-200">
                      <p className="text-slate-800 text-[11px] line-clamp-2 leading-relaxed font-medium" title={supFb}>
                        {supFb || <span className="text-slate-400 italic">Pending</span>}
                      </p>
                    </td>

                    {/* Locate on Drawing */}
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigateToDrawing(b.id);
                        }}
                        className="px-2.5 py-1 text-slate-700 hover:text-slate-950 hover:bg-slate-200 rounded text-[11px] font-bold flex items-center justify-center gap-1 transition-colors mx-auto cursor-pointer"
                      >
                        <span>Locate</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
