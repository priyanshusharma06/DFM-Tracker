import React, { useState } from 'react';
import { 
  DFMProject, 
  BalloonItem, 
  DrawingRevision, 
  DFMStatus 
} from '../types/dfm';
import { 
  GitBranch, 
  ArrowRight, 
  Check, 
  AlertTriangle, 
  Layers, 
  FileCheck, 
  ShieldCheck,
  EyeOff
} from 'lucide-react';

interface RevisionTraceabilityViewProps {
  project: DFMProject;
  onSelectBalloon: (balloon: BalloonItem) => void;
  onSelectRevision: (revId: string) => void;
}

export const RevisionTraceabilityView: React.FC<RevisionTraceabilityViewProps> = ({
  project,
  onSelectBalloon,
  onSelectRevision,
}) => {
  const [filterType, setFilterType] = useState<'ALL' | 'UNRESOLVED' | 'ADDRESSED'>('ALL');
  const [hideNonRelevant, setHideNonRelevant] = useState(false);

  // Build a consolidated map of all balloons across all revisions
  const balloonLineageMap = new Map<number, {
    balloonNumber: number;
    customLabel?: string;
    featureName: string;
    originRevision: string;
    dimensionNature: string;
    isRelevant: boolean;
    criticalCharacteristic: boolean;
    revisionsData: Record<string, {
      present: boolean;
      nominalValue: string;
      upperTol: string;
      lowerTol: string;
      status: DFMStatus;
      feedbackSummary: string;
      fullBalloon?: BalloonItem;
    }>;
    latestStatus: DFMStatus;
  }>();

  project.revisions.forEach((rev) => {
    rev.balloons.forEach((b) => {
      let entry = balloonLineageMap.get(b.balloonNumber);
      if (!entry) {
        entry = {
          balloonNumber: b.balloonNumber,
          customLabel: b.customLabel,
          featureName: b.featureName,
          originRevision: b.originRevisionName,
          dimensionNature: b.dimensionNature,
          isRelevant: b.isRelevant,
          criticalCharacteristic: b.criticalCharacteristic,
          revisionsData: {},
          latestStatus: b.status,
        };
        balloonLineageMap.set(b.balloonNumber, entry);
      }

      const feedbackComments = b.feedbackList
        .map((f) => `[${f.role}]: ${f.comment}`)
        .join(' | ');

      entry.revisionsData[rev.id] = {
        present: true,
        nominalValue: b.nominalValue,
        upperTol: b.upperTol,
        lowerTol: b.lowerTol,
        status: b.status,
        feedbackSummary: feedbackComments || 'No comments',
        fullBalloon: b,
      };

      entry.latestStatus = b.status;
    });
  });

  const lineageList = Array.from(balloonLineageMap.values()).sort((a, b) => a.balloonNumber - b.balloonNumber);

  const filteredLineage = lineageList.filter((item) => {
    if (hideNonRelevant && !item.isRelevant) return false;
    if (filterType === 'ADDRESSED') return item.latestStatus === 'ADDRESSED';
    if (filterType === 'UNRESOLVED') return item.latestStatus === 'UNCHANGED' || item.latestStatus === 'ATTENTION';
    return true;
  });

  const totalItems = lineageList.length;
  const addressedItems = lineageList.filter((item) => item.latestStatus === 'ADDRESSED').length;
  const resolutionRate = Math.round((addressedItems / (totalItems || 1)) * 100);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 overflow-y-auto p-4 sm:p-6 space-y-6">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 p-5 rounded-2xl border border-indigo-900/50 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-400">
              <GitBranch className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Revision-to-Revision DFM Traceability Matrix
              </h2>
              <p className="text-xs text-slate-400 mt-0.5 max-w-2xl leading-relaxed">
                Traces comments made on the very first drawing versus implementation across revisions. Verifies that addressed points turn green with a checkmark, unchanged points stay yellow, and attention items are red.
              </p>
            </div>
          </div>
        </div>

        {/* Resolution Progress Bar */}
        <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 min-w-[260px]">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              DFM Resolution Rate
            </span>
            <span className="font-bold text-emerald-400 font-mono">{resolutionRate}%</span>
          </div>
          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              style={{ width: `${resolutionRate}%` }}
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
            />
          </div>
          <div className="text-[11px] text-slate-400 mt-1.5 flex justify-between">
            <span>{addressedItems} of {totalItems} items addressed</span>
            <span className="text-slate-500">{totalItems - addressedItems} pending</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              filterType === 'ALL' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Tracked Features ({lineageList.length})
          </button>
          <button
            onClick={() => setFilterType('ADDRESSED')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1 ${
              filterType === 'ADDRESSED' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Check className="w-3 h-3 stroke-[3]" />
            <span>Addressed ({addressedItems})</span>
          </button>
          <button
            onClick={() => setFilterType('UNRESOLVED')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              filterType === 'UNRESOLVED' ? 'bg-amber-950 text-amber-300 border border-amber-800 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Unresolved / Open ({totalItems - addressedItems})
          </button>
        </div>

        <button
          onClick={() => setHideNonRelevant(!hideNonRelevant)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors ${
            hideNonRelevant ? 'bg-indigo-950 text-indigo-300 border-indigo-700 font-bold' : 'bg-slate-900 text-slate-400 border-slate-800'
          }`}
        >
          <EyeOff className="w-3.5 h-3.5" />
          <span>Hide REF / Basic Non-Relevant Features</span>
        </button>
      </div>

      {/* Traceability Lineage Cards */}
      <div className="space-y-4">
        {filteredLineage.map((item) => {
          const revA = project.revisions[0];
          const revB = project.revisions.length > 1 ? project.revisions[1] : null;

          const dataRevA = revA ? item.revisionsData[revA.id] : null;
          const dataRevB = revB ? item.revisionsData[revB.id] : null;

          const hasNominalChanged = 
            dataRevA && dataRevB && 
            (dataRevA.nominalValue !== dataRevB.nominalValue ||
             dataRevA.upperTol !== dataRevB.upperTol ||
             dataRevA.lowerTol !== dataRevB.lowerTol);

          const isAddressed = item.latestStatus === 'ADDRESSED';
          const isAttention = item.latestStatus === 'ATTENTION';

          return (
            <div
              key={item.balloonNumber}
              className={`p-4 rounded-xl border transition-all ${
                isAddressed
                  ? 'bg-slate-900/80 border-slate-800'
                  : isAttention
                  ? 'bg-slate-900 border-rose-900/50 shadow-md'
                  : 'bg-slate-900 border-amber-900/40'
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-full font-black text-xs flex items-center justify-center shadow-md border-2 ${
                    isAddressed
                      ? 'bg-emerald-500 border-emerald-200 text-white'
                      : isAttention
                      ? 'bg-rose-600 border-rose-200 text-white'
                      : 'bg-amber-400 border-amber-100 text-slate-950'
                  }`}>
                    {item.balloonNumber}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{item.featureName}</span>
                      <span className="text-xs text-slate-400 font-mono">[{item.dimensionNature}]</span>
                      {!item.isRelevant && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                          Non-relevant for tolerance
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Origin: <strong className="text-indigo-400">{item.originRevision}</strong>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${
                    isAddressed
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                      : isAttention
                      ? 'bg-rose-950 text-rose-300 border-rose-800'
                      : 'bg-amber-950 text-amber-300 border-amber-800'
                  }`}>
                    {isAddressed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    {isAttention && <AlertTriangle className="w-3.5 h-3.5" />}
                    <span>{isAddressed ? 'Addressed (✓)' : isAttention ? 'Attention (⚠️)' : 'Unchanged'}</span>
                  </div>

                  {dataRevB?.fullBalloon && (
                    <button
                      onClick={() => onSelectBalloon(dataRevB.fullBalloon!)}
                      className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors border border-slate-700"
                    >
                      Inspect / Edit
                    </button>
                  )}
                </div>
              </div>

              {/* Revision Comparison Columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3.5 text-xs">
                {/* Column 1: Initial Rev */}
                <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-slate-400 border-b border-slate-800/80 pb-1.5">
                    <span className="font-semibold text-slate-200">
                      Initial Drawing: <strong className="text-indigo-400">{revA.revCode}</strong>
                    </span>
                    <span className="font-mono text-[11px]">{revA.date}</span>
                  </div>

                  {dataRevA ? (
                    <>
                      <div className="text-slate-300 flex items-center justify-between font-mono bg-slate-900 p-2 rounded border border-slate-800">
                        <span>Original Dimension:</span>
                        <strong className="text-white">
                          {dataRevA.nominalValue} ({dataRevA.upperTol} / {dataRevA.lowerTol})
                        </strong>
                      </div>

                      <div className="text-[11px] text-slate-300 leading-relaxed bg-amber-950/20 p-2 rounded border border-amber-900/30">
                        <strong className="text-amber-400 block mb-0.5">Initial Comment on Concept Drawing:</strong>
                        <p>{dataRevA.feedbackSummary}</p>
                      </div>
                    </>
                  ) : (
                    <div className="text-slate-500 italic py-2">Not present in initial revision.</div>
                  )}
                </div>

                {/* Column 2: Subsequent Rev */}
                <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-slate-400 border-b border-slate-800/80 pb-1.5">
                    <span className="font-semibold text-slate-200">
                      Current Loop: <strong className="text-blue-400">{revB ? revB.revCode : 'Next Loop'}</strong>
                    </span>
                    {hasNominalChanged && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                        VALUE MODIFIED
                      </span>
                    )}
                  </div>

                  {dataRevB ? (
                    <>
                      <div className="text-slate-300 flex items-center justify-between font-mono bg-slate-900 p-2 rounded border border-slate-800">
                        <span>Current Dimension:</span>
                        <strong className="text-emerald-400">
                          {dataRevB.nominalValue} ({dataRevB.upperTol} / {dataRevB.lowerTol})
                        </strong>
                      </div>

                      <div className={`text-[11px] leading-relaxed p-2 rounded border ${
                        dataRevB.status === 'ADDRESSED'
                          ? 'bg-emerald-950/20 text-emerald-200 border-emerald-900/40'
                          : 'bg-slate-900 text-slate-300 border-slate-800'
                      }`}>
                        <strong className="text-emerald-400 block mb-0.5">Implementation Audit &amp; Status:</strong>
                        <p>{dataRevB.feedbackSummary}</p>
                      </div>
                    </>
                  ) : (
                    <div className="text-slate-500 italic py-2">
                      Carried forward or pending in upcoming loop.
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
