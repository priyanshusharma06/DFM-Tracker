import React, { useState } from 'react';
import { BalloonItem, DFMStatus, DimensionNature, StakeholderRole, STAKEHOLDER_CONFIGS } from '../types/dfm';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Eye, 
  EyeOff, 
  Filter, 
  Search, 
  FileSpreadsheet, 
  Sparkles,
  Layers,
  ChevronRight,
  MessageSquare,
  ShieldAlert,
  SlidersHorizontal,
  Compass,
  Tag
} from 'lucide-react';

interface MbdFeatureTableProps {
  balloons: BalloonItem[];
  selectedBalloonId?: string;
  onSelectBalloon: (balloon: BalloonItem) => void;
  onUpdateStatus: (balloonId: string, status: DFMStatus) => void;
  onToggleRelevance: (balloonId: string, isRelevant: boolean) => void;
  onSwitchToDrawing: () => void;
  currentRole: StakeholderRole;
  drawingMetadata?: {
    partNumber: string;
    partName: string;
    revision: string;
    sheet?: string;
  };
}

export const MbdFeatureTable: React.FC<MbdFeatureTableProps> = ({
  balloons,
  selectedBalloonId,
  onSelectBalloon,
  onUpdateStatus,
  onToggleRelevance,
  onSwitchToDrawing,
  currentRole,
  drawingMetadata,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [natureFilter, setNatureFilter] = useState<'ALL' | 'STANDARD' | 'REFERENCE' | 'CRITICAL' | 'GDT'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ADDRESSED' | 'UNCHANGED' | 'ATTENTION'>('ALL');
  const [hideReference, setHideReference] = useState(false);

  // Filter calculations
  const filteredBalloons = balloons.filter((b) => {
    // Hide reference dimensions toggle per requirement
    if (hideReference && (b.dimensionNature === 'REFERENCE' || !b.isRelevant)) {
      return false;
    }

    if (natureFilter === 'REFERENCE' && b.dimensionNature !== 'REFERENCE') return false;
    if (natureFilter === 'CRITICAL' && !b.criticalCharacteristic) return false;
    if (natureFilter === 'GDT' && b.dimensionType !== 'GDT') return false;
    if (natureFilter === 'STANDARD' && b.dimensionNature !== 'STANDARD') return false;

    if (statusFilter !== 'ALL' && b.status !== statusFilter) return false;

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchNum = String(b.balloonNumber).includes(q);
      const matchName = b.featureName.toLowerCase().includes(q);
      const matchVal = (b.nominalValue || '').toLowerCase().includes(q);
      const matchView = (b.viewName || '').toLowerCase().includes(q);
      const matchType = b.dimensionType.toLowerCase().includes(q);
      return matchNum || matchName || matchVal || matchView || matchType;
    }

    return true;
  });

  const criticalCount = balloons.filter((b) => b.criticalCharacteristic).length;
  const refCount = balloons.filter((b) => b.dimensionNature === 'REFERENCE').length;
  const gdtCount = balloons.filter((b) => b.dimensionType === 'GDT').length;
  const addressedCount = balloons.filter((b) => b.status === 'ADDRESSED').length;
  const attentionCount = balloons.filter((b) => b.status === 'ATTENTION').length;

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden text-neutral-900">
      {/* Table Header Bar */}
      <div className="p-4 bg-white border-b-2 border-slate-900 space-y-3 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-950 text-amber-400 border border-slate-800 flex items-center justify-center font-bold shadow-sm">
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-900 tracking-tight">MBDVidia Model-Based Feature Characteristics</h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 border border-amber-500 text-[11px] font-bold">
                  {balloons.length} Characteristics Identified
                </span>
              </div>
              <p className="text-xs text-neutral-600">
                AS9102 / MBD inspection characteristics table with tolerance limits and multi-stakeholder DFM status.
              </p>
            </div>
          </div>

          {/* Quick Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setHideReference(!hideReference)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                hideReference
                  ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-sm'
                  : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border-neutral-300'
              }`}
              title="Toggle visibility of Reference (REF) & Basic non-relevant dimensions"
            >
              {hideReference ? <EyeOff className="w-3.5 h-3.5 text-slate-950" /> : <Eye className="w-3.5 h-3.5 text-neutral-600" />}
              <span>{hideReference ? 'Reference Dims Hidden (REF)' : 'Hide Reference Dims (REF)'}</span>
            </button>

            <button
              onClick={onSwitchToDrawing}
              className="px-3.5 py-1.5 bg-slate-950 hover:bg-slate-800 text-amber-400 hover:text-amber-300 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm border border-slate-900 transition-colors cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              <span>View On CAD Drawing</span>
            </button>
          </div>
        </div>

        {/* Filter Pills Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs">
          {/* Characteristic Categories */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setNatureFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg border font-bold transition-colors cursor-pointer ${
                natureFilter === 'ALL'
                  ? 'bg-slate-950 text-amber-400 border-slate-900 shadow-xs'
                  : 'bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-100'
              }`}
            >
              All ({balloons.length})
            </button>
            <button
              onClick={() => setNatureFilter('CRITICAL')}
              className={`px-2.5 py-1 rounded-lg border font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                natureFilter === 'CRITICAL'
                  ? 'bg-rose-600 border-rose-700 text-white shadow-xs'
                  : 'bg-white border-neutral-300 text-neutral-700 hover:bg-rose-50'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
              <span>Critical / CQA ({criticalCount})</span>
            </button>
            <button
              onClick={() => setNatureFilter('GDT')}
              className={`px-2.5 py-1 rounded-lg border font-bold transition-colors cursor-pointer ${
                natureFilter === 'GDT'
                  ? 'bg-purple-700 border-purple-800 text-white shadow-xs'
                  : 'bg-white border-neutral-300 text-neutral-700 hover:bg-purple-50'
              }`}
            >
              GD&amp;T Frames ({gdtCount})
            </button>
            <button
              onClick={() => setNatureFilter('REFERENCE')}
              className={`px-2.5 py-1 rounded-lg border font-bold transition-colors cursor-pointer ${
                natureFilter === 'REFERENCE'
                  ? 'bg-amber-500 border-amber-600 text-black shadow-xs'
                  : 'bg-white border-neutral-300 text-neutral-700 hover:bg-amber-50'
              }`}
            >
              Reference [REF] ({refCount})
            </button>
          </div>

          {/* Search Box & Status Filter */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search balloon #, feature, tolerance..."
                className="bg-white border border-neutral-300 rounded-lg pl-8 pr-3 py-1 text-xs text-black placeholder-neutral-400 focus:outline-none focus:border-black w-56 shadow-xs"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-white border border-neutral-300 rounded-lg px-2.5 py-1 text-xs text-black font-semibold focus:outline-none focus:border-black cursor-pointer shadow-xs"
            >
              <option value="ALL">Status: All</option>
              <option value="ADDRESSED">✓ Addressed ({addressedCount})</option>
              <option value="UNCHANGED">Unchanged ({balloons.length - addressedCount - attentionCount})</option>
              <option value="ATTENTION">⚠️ Attention ({attentionCount})</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Feature Data Grid */}
      <div className="flex-1 overflow-auto bg-white">
        <table className="w-full text-left text-xs text-neutral-800 border-collapse">
          <thead className="bg-[#f8f9fa] sticky top-0 z-10 border-b-2 border-neutral-300 font-extrabold text-black select-none">
            <tr>
              <th className="py-2.5 px-3 w-16 text-center">Balloon</th>
              <th className="py-2.5 px-3 w-32">CAD View / Zone</th>
              <th className="py-2.5 px-3">Feature Name &amp; Description</th>
              <th className="py-2.5 px-3 w-28">Type</th>
              <th className="py-2.5 px-3 w-28 text-right font-mono">Nominal</th>
              <th className="py-2.5 px-3 w-24 text-right font-mono text-emerald-700">Tol (+)</th>
              <th className="py-2.5 px-3 w-24 text-right font-mono text-rose-700">Tol (-)</th>
              <th className="py-2.5 px-3 w-16 text-center">Unit</th>
              <th className="py-2.5 px-3 w-28">Classification</th>
              <th className="py-2.5 px-3 w-28 text-center">Relevant?</th>
              <th className="py-2.5 px-3 w-36 text-center">DFM Status</th>
              <th className="py-2.5 px-3 w-24 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 font-normal">
            {filteredBalloons.length === 0 ? (
              <tr>
                <td colSpan={12} className="py-12 text-center text-neutral-400">
                  <div className="max-w-md mx-auto space-y-2">
                    <p className="font-bold text-neutral-600">No feature characteristics match your filters.</p>
                    <p className="text-[11px]">Try clearing your search query or toggling &quot;Reference Dims Hidden&quot; off.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredBalloons.map((b) => {
                const isSelected = b.id === selectedBalloonId;

                return (
                  <tr
                    key={b.id}
                    onClick={() => onSelectBalloon(b)}
                    className={`hover:bg-neutral-100 transition-colors cursor-pointer ${
                      isSelected ? 'bg-amber-100/60 ring-2 ring-amber-500' : ''
                    } ${!b.isRelevant ? 'opacity-50' : ''}`}
                  >
                    {/* Balloon Number with Status Visual */}
                    <td className="py-2.5 px-3 text-center">
                      <div className="inline-flex items-center justify-center">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-xs shadow-sm border ${
                            b.status === 'ADDRESSED'
                              ? 'bg-emerald-600 border-emerald-700 text-white'
                              : b.status === 'ATTENTION'
                              ? 'bg-rose-600 border-rose-700 text-white'
                              : 'bg-amber-400 border-amber-600 text-slate-950 font-bold'
                          }`}
                        >
                          {b.balloonNumber}
                        </div>
                      </div>
                    </td>

                    {/* CAD View / Zone */}
                    <td className="py-2.5 px-3 text-[11px] text-neutral-600 truncate max-w-[140px]" title={b.viewName}>
                      {b.viewName}
                    </td>

                    {/* Feature Name & Description */}
                    <td className="py-2.5 px-3 font-semibold text-neutral-900">
                      <div className="flex items-center gap-1.5">
                        {b.criticalCharacteristic && (
                          <span className="w-2 h-2 rounded-full bg-rose-600 shrink-0" title="Critical Characteristic / CQA" />
                        )}
                        <span className="truncate max-w-[280px]" title={b.featureName}>
                          {b.featureName}
                        </span>
                      </div>
                      {b.feedbackList.length > 0 && (
                        <div className="text-[10px] text-blue-700 font-bold flex items-center gap-1 mt-0.5">
                          <MessageSquare className="w-3 h-3" />
                          <span>{b.feedbackList.length} stakeholder comment(s)</span>
                        </div>
                      )}
                    </td>

                    {/* Dimension Type */}
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-neutral-100 text-neutral-800 border border-neutral-300 font-bold">
                        {b.dimensionType}
                      </span>
                    </td>

                    {/* Nominal Value */}
                    <td className="py-2.5 px-3 text-right font-mono font-black text-black">
                      {b.nominalValue || '—'}
                    </td>

                    {/* Upper Tol */}
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                      {b.upperTol || '—'}
                    </td>

                    {/* Lower Tol */}
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-700">
                      {b.lowerTol || '—'}
                    </td>

                    {/* Unit */}
                    <td className="py-2.5 px-3 text-center text-neutral-600 text-[11px] font-semibold">
                      {b.unit || 'mm'}
                    </td>

                    {/* Classification */}
                    <td className="py-2.5 px-3">
                      {b.dimensionNature === 'REFERENCE' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                          Reference [REF]
                        </span>
                      ) : b.criticalCharacteristic ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-900 border border-rose-300">
                          Critical / CQA
                        </span>
                      ) : b.dimensionNature === 'BASIC' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-300">
                          Basic Box [ ]
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] text-neutral-600 bg-neutral-100">
                          Standard
                        </span>
                      )}
                    </td>

                    {/* Relevant Toggle */}
                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleRelevance(b.id, !b.isRelevant);
                        }}
                        className={`p-1 rounded text-xs transition-colors cursor-pointer ${
                          b.isRelevant
                            ? 'text-black hover:bg-neutral-200'
                            : 'text-neutral-400 hover:bg-neutral-200'
                        }`}
                        title={b.isRelevant ? 'Mark Non-Relevant (e.g. Reference dimension)' : 'Mark Relevant for DFM'}
                      >
                        {b.isRelevant ? <Eye className="w-4 h-4 mx-auto text-black" /> : <EyeOff className="w-4 h-4 mx-auto text-neutral-400" />}
                      </button>
                    </td>

                    {/* DFM Status Toggle */}
                    <td className="py-2.5 px-3 text-center">
                      <div className="inline-flex rounded-lg border border-neutral-300 p-0.5 bg-neutral-100 shadow-xs" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => onUpdateStatus(b.id, 'ADDRESSED')}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                            b.status === 'ADDRESSED'
                              ? 'bg-emerald-600 text-white'
                              : 'text-neutral-600 hover:text-emerald-700'
                          }`}
                          title="Addressed / Implemented (✓)"
                        >
                          ✓
                        </button>
                        <button
                          type="button"
                          onClick={() => onUpdateStatus(b.id, 'UNCHANGED')}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                            b.status === 'UNCHANGED'
                              ? 'bg-amber-400 text-slate-950 font-bold'
                              : 'text-neutral-600 hover:text-black'
                          }`}
                          title="Unchanged / In Progress"
                        >
                          ●
                        </button>
                        <button
                          type="button"
                          onClick={() => onUpdateStatus(b.id, 'ATTENTION')}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                            b.status === 'ATTENTION'
                              ? 'bg-rose-600 text-white'
                              : 'text-neutral-600 hover:text-rose-700'
                          }`}
                          title="Critical / Attention Needed (⚠️)"
                        >
                          ⚠️
                        </button>
                      </div>
                    </td>

                    {/* Action */}
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectBalloon(b);
                          onSwitchToDrawing();
                        }}
                        className="px-2 py-1 bg-slate-950 hover:bg-slate-800 text-amber-400 hover:text-amber-300 rounded text-[11px] font-bold border border-slate-900 transition-colors inline-flex items-center gap-1 cursor-pointer shadow-xs"
                      >
                        <span>Jump</span>
                        <ChevronRight className="w-3 h-3 text-amber-400" />
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
