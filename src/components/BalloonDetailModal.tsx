import React, { useState, useRef } from 'react';
import { 
  BalloonItem, 
  StakeholderRole, 
  DFMStatus, 
  DimensionType,
  DimensionNature,
  FeedbackComment
} from '../types/dfm';
import { 
  X, 
  Check, 
  AlertTriangle, 
  Wrench, 
  ScanEye, 
  Compass, 
  Factory, 
  Trash2, 
  FileCheck, 
  Crop,
  CheckCircle2,
  XCircle,
  MessageSquare,
  ShieldCheck,
  UserCheck,
  Move,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Tag
} from 'lucide-react';

interface BalloonDetailModalProps {
  balloon: BalloonItem;
  otherBalloons?: BalloonItem[];
  currentRole: StakeholderRole;
  activeRevisionId: string;
  activeRevisionCode: string;
  onClose: () => void;
  onUpdateBalloon: (updated: BalloonItem) => void;
  onUpdateBalloonPosition?: (id: string, x: number, y: number, targetX?: number, targetY?: number) => void;
  onDeleteBalloon: (balloonId: string) => void;
}

interface StakeholderFindingData {
  authorName: string;
  issue: string;
  proposedChange: string;
}

export const BalloonDetailModal: React.FC<BalloonDetailModalProps> = ({
  balloon,
  otherBalloons = [],
  currentRole,
  activeRevisionId,
  activeRevisionCode,
  onClose,
  onUpdateBalloon,
  onUpdateBalloonPosition,
  onDeleteBalloon,
}) => {
  // Balloon Number and Position state for repositioning & interference prevention
  const [balloonNumber, setBalloonNumber] = useState<number>(balloon.balloonNumber);
  const [customLabel, setCustomLabel] = useState<string>(balloon.customLabel || `#${balloon.balloonNumber}`);
  const [posX, setPosX] = useState<number>(balloon.x);
  const [posY, setPosY] = useState<number>(balloon.y);
  const [targetX, setTargetX] = useState<number | undefined>(balloon.leaderTargetX);
  const [targetY, setTargetY] = useState<number | undefined>(balloon.leaderTargetY);

  const handleNudge = (dx: number, dy: number) => {
    const newX = Math.min(Math.max(Math.round((posX + dx) * 10) / 10, 1), 99);
    const newY = Math.min(Math.max(Math.round((posY + dy) * 10) / 10, 1), 99);
    setPosX(newX);
    setPosY(newY);
    onUpdateBalloonPosition?.(balloon.id, newX, newY, targetX, targetY);
  };

  const handleAutoAvoidOverlap = () => {
    if (!otherBalloons || otherBalloons.length === 0) return;
    const sameSheet = otherBalloons.filter(
      (b) => b.id !== balloon.id && (b.sheetNumber || 1) === (balloon.sheetNumber || 1)
    );
    const colliding = sameSheet.find((b) => Math.hypot(b.x - posX, b.y - posY) < 5.0);
    if (colliding) {
      let newY = Math.min(colliding.y + 5.5, 97);
      let newX = posX;
      if (newY >= 96) {
        newY = Math.max(colliding.y - 5.5, 3);
        newX = Math.min(posX + 4.5, 97);
      }
      setPosX(newX);
      setPosY(newY);
      onUpdateBalloonPosition?.(balloon.id, newX, newY, targetX, targetY);
    }
  };
  // Active tab inside Multi-Stakeholder Findings
  const [activeStakeholderTab, setActiveStakeholderTab] = useState<'AO' | 'INSPECTION' | 'SUPPLIER'>(() => {
    if (currentRole === 'INSPECTION') return 'INSPECTION';
    if (currentRole === 'SUPPLIER') return 'SUPPLIER';
    return 'AO';
  });

  // Helper to extract stakeholder specific data
  const getInitialStakeholderData = (role: 'AO' | 'INSPECTION' | 'SUPPLIER'): StakeholderFindingData => {
    const existing = balloon.feedbackList?.find((f) => f.role === role);
    const defaultAuthor = 
      role === 'AO' ? 'AO Manufacturing Specialist' :
      role === 'INSPECTION' ? 'Quality Metrology Lead' : 'Supplier Machinist';

    if (existing) {
      return {
        authorName: existing.authorName || defaultAuthor,
        issue: existing.comment || '',
        proposedChange: existing.proposedChange || '',
      };
    }

    if (role === 'AO' && balloon.issueDescription) {
      return {
        authorName: defaultAuthor,
        issue: balloon.issueDescription || '',
        proposedChange: balloon.proposedChange || '',
      };
    }

    return {
      authorName: defaultAuthor,
      issue: '',
      proposedChange: '',
    };
  };

  // State maintains individual data for AO, Inspection, and Supplier separately
  const [stakeholderData, setStakeholderData] = useState<Record<'AO' | 'INSPECTION' | 'SUPPLIER', StakeholderFindingData>>({
    AO: getInitialStakeholderData('AO'),
    INSPECTION: getInitialStakeholderData('INSPECTION'),
    SUPPLIER: getInitialStakeholderData('SUPPLIER'),
  });

  const updateCurrentStakeholderField = (
    role: 'AO' | 'INSPECTION' | 'SUPPLIER', 
    field: keyof StakeholderFindingData, 
    value: string
  ) => {
    setStakeholderData((prev) => ({
      ...prev,
      [role]: {
        ...prev[role],
        [field]: value,
      },
    }));
  };

  // 2. Design Concurrence & Decision
  const [designDecision, setDesignDecision] = useState<'ACCEPTED' | 'REJECTED' | 'PROPOSED_ALTERNATIVE' | undefined>(
    balloon.rdResponse?.status
  );
  const [designComment, setDesignComment] = useState(balloon.rdResponse?.comment || '');

  // 3. Manufacturing Review & Verification
  const [mfgVerdict, setMfgVerdict] = useState<'VERIFIED_ACCEPTED' | 'STILL_OPEN' | undefined>(
    balloon.aoVerification?.status === 'VERIFIED_ACCEPTED' ? 'VERIFIED_ACCEPTED' :
    balloon.aoVerification?.status === 'STILL_OPEN' ? 'STILL_OPEN' : undefined
  );
  const [mfgVerificationNote, setMfgVerificationNote] = useState(balloon.aoVerification?.comment || '');

  // Snapshot initial comment state to detect updates on existing comments
  const initialCommentsRef = useRef({
    AO_issue: getInitialStakeholderData('AO').issue,
    AO_proposed: getInitialStakeholderData('AO').proposedChange,
    INSP_issue: getInitialStakeholderData('INSPECTION').issue,
    INSP_proposed: getInitialStakeholderData('INSPECTION').proposedChange,
    SUPP_issue: getInitialStakeholderData('SUPPLIER').issue,
    SUPP_proposed: getInitialStakeholderData('SUPPLIER').proposedChange,
    designDecision: balloon.rdResponse?.status,
    designComment: balloon.rdResponse?.comment || '',
    mfgVerdict: balloon.aoVerification?.status,
    mfgVerificationNote: balloon.aoVerification?.comment || '',
  });

  const [showConfirmChangeModal, setShowConfirmChangeModal] = useState(false);

  // Check if an existing comment was already present initially
  const hasExistingCommentInitially = Boolean(
    initialCommentsRef.current.AO_issue.trim() ||
    initialCommentsRef.current.AO_proposed.trim() ||
    initialCommentsRef.current.INSP_issue.trim() ||
    initialCommentsRef.current.INSP_proposed.trim() ||
    initialCommentsRef.current.SUPP_issue.trim() ||
    initialCommentsRef.current.SUPP_proposed.trim() ||
    initialCommentsRef.current.designComment.trim() ||
    initialCommentsRef.current.mfgVerificationNote.trim() ||
    balloon.issueDescription?.trim()
  );

  // Check if user has altered any existing comment content
  const hasCommentBeenAltered = Boolean(
    stakeholderData.AO.issue !== initialCommentsRef.current.AO_issue ||
    stakeholderData.AO.proposedChange !== initialCommentsRef.current.AO_proposed ||
    stakeholderData.INSPECTION.issue !== initialCommentsRef.current.INSP_issue ||
    stakeholderData.INSPECTION.proposedChange !== initialCommentsRef.current.INSP_proposed ||
    stakeholderData.SUPPLIER.issue !== initialCommentsRef.current.SUPP_issue ||
    stakeholderData.SUPPLIER.proposedChange !== initialCommentsRef.current.SUPP_proposed ||
    designComment !== initialCommentsRef.current.designComment ||
    designDecision !== initialCommentsRef.current.designDecision ||
    mfgVerificationNote !== initialCommentsRef.current.mfgVerificationNote ||
    mfgVerdict !== initialCommentsRef.current.mfgVerdict
  );

  // Feature specification details (placed at the bottom, marked empty by default per requirement 2)
  const [featureName, setFeatureName] = useState(balloon.featureName || '');
  const [dimensionType, setDimensionType] = useState<DimensionType>(balloon.dimensionType || 'LINEAR');
  const [dimensionNature, setDimensionNature] = useState<DimensionNature>(balloon.dimensionNature || 'STANDARD');
  const [nominalValue, setNominalValue] = useState(balloon.nominalValue || '');
  const [upperTol, setUpperTol] = useState(balloon.upperTol || '');
  const [lowerTol, setLowerTol] = useState(balloon.lowerTol || '');
  const [unit, setUnit] = useState(balloon.unit || 'mm');
  const [isRelevant, setIsRelevant] = useState(balloon.isRelevant ?? true);
  const [viewName, setViewName] = useState(balloon.viewName || '');
  const [criticalCharacteristic, setCriticalCharacteristic] = useState(balloon.criticalCharacteristic || false);

  // Derive dynamic DFM status:
  // Default is UNCHANGED (Stryker Yellow).
  // If section 3 is VERIFIED_ACCEPTED -> ADDRESSED (Green ✓)
  // If section 2 is REJECTED or section 3 is STILL_OPEN -> ATTENTION (Red ⚠️)
  // If section 2 is ACCEPTED -> ADDRESSED (Green ✓)
  const computeStatus = (): DFMStatus => {
    if (mfgVerdict === 'VERIFIED_ACCEPTED') {
      return 'ADDRESSED';
    }
    if (designDecision === 'REJECTED' || mfgVerdict === 'STILL_OPEN') {
      return 'ATTENTION';
    }
    if (designDecision === 'ACCEPTED' && !mfgVerdict) {
      return 'ADDRESSED';
    }
    return balloon.status || 'UNCHANGED';
  };

  const computedStatus = computeStatus();

  // Handle single overall save changes execution
  const executeSaveAll = () => {
    const finalStatus = computeStatus();

    // Preserve non-manufacturing feedback (e.g. RD or previous revision comments)
    const otherFeedback = (balloon.feedbackList || []).filter(
      (f) => f.role !== 'AO' && f.role !== 'INSPECTION' && f.role !== 'SUPPLIER'
    );

    // Build updated feedback list with INDIVIDUAL comments for AO, Inspection, Supplier
    const updatedFeedbackList: FeedbackComment[] = [...otherFeedback];

    (['AO', 'INSPECTION', 'SUPPLIER'] as const).forEach((role) => {
      const data = stakeholderData[role];
      if (data.issue.trim().length > 0 || data.proposedChange.trim().length > 0) {
        updatedFeedbackList.push({
          id: `fb-${role.toLowerCase()}-${balloon.id}-${Date.now()}`,
          role: role as StakeholderRole,
          authorName: data.authorName,
          comment: data.issue.trim(),
          proposedChange: data.proposedChange.trim() || undefined,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          revisionId: activeRevisionId,
        });
      }
    });

    // Primary issue description (AO priority, or whichever has content)
    const primaryFinding = 
      stakeholderData.AO.issue.trim() ||
      stakeholderData.INSPECTION.issue.trim() ||
      stakeholderData.SUPPLIER.issue.trim() ||
      balloon.issueDescription;

    const primaryProposedChange =
      stakeholderData.AO.proposedChange.trim() ||
      stakeholderData.INSPECTION.proposedChange.trim() ||
      stakeholderData.SUPPLIER.proposedChange.trim() ||
      balloon.proposedChange;

    const updatedBalloon: BalloonItem = {
      ...balloon,
      balloonNumber,
      customLabel: customLabel.trim() || `#${balloonNumber}`,
      x: Math.round(posX * 10) / 10,
      y: Math.round(posY * 10) / 10,
      leaderTargetX: targetX !== undefined ? Math.round(targetX * 10) / 10 : undefined,
      leaderTargetY: targetY !== undefined ? Math.round(targetY * 10) / 10 : undefined,
      featureName: featureName.trim() || `Feature #${balloonNumber}`,
      dimensionType,
      dimensionNature,
      nominalValue: nominalValue.trim(),
      upperTol: upperTol.trim(),
      lowerTol: lowerTol.trim(),
      unit,
      isRelevant,
      isVisible: isRelevant,
      viewName,
      status: finalStatus,
      criticalCharacteristic,
      issueDescription: primaryFinding,
      proposedChange: primaryProposedChange,
      feedbackList: updatedFeedbackList,
      rdResponse: designDecision ? {
        status: designDecision,
        comment: designComment.trim(),
        date: new Date().toISOString(),
        author: 'Design Engineering',
      } : balloon.rdResponse,
      aoVerification: mfgVerdict ? {
        status: mfgVerdict,
        comment: mfgVerificationNote.trim(),
        verifiedInRevCode: activeRevisionCode,
      } : balloon.aoVerification,
    };

    onUpdateBalloon(updatedBalloon);
    onClose();
  };

  // User click on Save Changes: if modifying an existing comment, prompt to confirm (User Request 2.4)
  const handleSaveAll = () => {
    if (hasExistingCommentInitially && hasCommentBeenAltered) {
      setShowConfirmChangeModal(true);
    } else {
      executeSaveAll();
    }
  };

  const hasComment = (role: 'AO' | 'INSPECTION' | 'SUPPLIER') => {
    return stakeholderData[role].issue.trim().length > 0;
  };

  return (
    <div className="fixed top-0 right-0 bottom-0 w-full sm:w-[480px] md:w-[520px] lg:w-[560px] xl:w-[600px] z-50 bg-white border-l-4 border-slate-800 shadow-[-12px_0_35px_rgba(0,0,0,0.22)] flex flex-col text-slate-900 h-full overflow-hidden animate-in slide-in-from-right duration-200">
      
      {/* Window Header */}
      <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950 text-white select-none">
        <div className="flex items-center gap-3">
          {/* Status Color Badge: Amber (Default), Green (Accepted), Red (Attention) */}
          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-sm shadow-md border-2 transition-colors ${
            computedStatus === 'ADDRESSED'
              ? 'bg-emerald-500 border-emerald-200 text-white'
              : computedStatus === 'ATTENTION'
              ? 'bg-rose-600 border-rose-200 text-white'
              : 'bg-amber-400 border-amber-600 text-slate-950 font-black'
          }`}>
            <span>{balloon.balloonNumber}</span>
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-bold text-white tracking-tight">
                {balloon.customLabel || `Feature #${balloon.balloonNumber}`} {featureName ? `- ${featureName}` : ''}
              </h2>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                computedStatus === 'ADDRESSED'
                  ? 'bg-emerald-600 text-white'
                  : computedStatus === 'ATTENTION'
                  ? 'bg-rose-600 text-white'
                  : 'bg-amber-400 text-slate-950 font-bold'
              }`}>
                {computedStatus === 'ADDRESSED' ? 'Addressed (✓)' : computedStatus === 'ATTENTION' ? 'Attention (⚠️)' : 'Open / Unchanged'}
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
              <span>Markup: <strong className="text-slate-200">{balloon.markupType === 'HIGHLIGHT' ? 'Highlighter' : 'Pen Circle'}</strong></span>
              <span>•</span>
              <span>Rev: <strong className="text-amber-400">{activeRevisionCode}</strong></span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              if (confirm(`Delete markup for Feature #${balloon.balloonNumber}?`)) {
                onDeleteBalloon(balloon.id);
              }
            }}
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Delete this markup"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Close Drawer (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Window Body (Single scrollable column) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        
        {/* BALLOON NUMBER & REPOSITIONING SECTION (Avoid Overlap / Interference) */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-300 shadow-xs space-y-3 text-xs">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <span className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
              <Move className="w-4 h-4 text-amber-600" />
              <span>Balloon Number &amp; Canvas Placement</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              Pos: [{Math.round(posX)}%, {Math.round(posY)}%]
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-700 block mb-1 text-[11px] font-bold">
                Balloon Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={balloonNumber}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10) || 1;
                  setBalloonNumber(val);
                  if (!customLabel || customLabel === `#${balloon.balloonNumber}`) {
                    setCustomLabel(`#${val}`);
                  }
                }}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-slate-50 text-slate-900 font-bold font-mono text-xs focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none"
              />
            </div>

            <div>
              <label className="text-slate-700 block mb-1 text-[11px] font-bold">
                Custom Tag / Callout
              </label>
              <input
                type="text"
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                placeholder={`#${balloonNumber}`}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-slate-50 text-slate-900 font-bold text-xs focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none"
              />
            </div>
          </div>

          {/* Reposition & Overlap Interference Avoidance */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-700">Reposition to Avoid Overlap / Interference:</span>
              <button
                type="button"
                onClick={handleAutoAvoidOverlap}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold text-[10px] border border-amber-300 transition-colors cursor-pointer shadow-xs"
                title="Automatically shift this balloon if it touches any other balloon on this sheet"
              >
                <Sparkles className="w-3 h-3 text-amber-600" />
                <span>Auto-Avoid Overlap</span>
              </button>
            </div>

            {/* Micro-Nudge D-Pad */}
            <div className="flex items-center justify-between gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-500 leading-tight">
                Click arrows to nudge &plusmn;2%, or drag balloon directly on drawing canvas.
              </span>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => handleNudge(-2, 0)}
                  className="p-1 rounded bg-white hover:bg-slate-200 border border-slate-300 text-slate-700 font-bold cursor-pointer transition-colors shadow-2xs"
                  title="Nudge Left"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => handleNudge(0, -2)}
                    className="p-1 rounded bg-white hover:bg-slate-200 border border-slate-300 text-slate-700 font-bold cursor-pointer transition-colors shadow-2xs"
                    title="Nudge Up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNudge(0, 2)}
                    className="p-1 rounded bg-white hover:bg-slate-200 border border-slate-300 text-slate-700 font-bold cursor-pointer transition-colors shadow-2xs"
                    title="Nudge Down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => handleNudge(2, 0)}
                  className="p-1 rounded bg-white hover:bg-slate-200 border border-slate-300 text-slate-700 font-bold cursor-pointer transition-colors shadow-2xs"
                  title="Nudge Right"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Circled Drawing Feature Snip (if captured) */}
        {balloon.drawingSnipUrl && (
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Crop className="w-3.5 h-3.5 text-amber-500" />
                <span>Marked Drawing Feature Snip</span>
              </span>
              <span className="text-[10px] text-slate-600 font-mono px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 font-bold">
                {balloon.markupType === 'HIGHLIGHT' ? 'Adobe-Style Highlight 🖍️' : 'Pen Circle 🖊️'}
              </span>
            </div>
            <div className="w-full h-36 bg-slate-100 rounded-lg border border-slate-300 overflow-hidden flex items-center justify-center p-2 relative shadow-inner">
              <img 
                src={balloon.drawingSnipUrl} 
                alt="Feature Drawing Snip" 
                className="max-h-full max-w-full object-contain drop-shadow"
              />
            </div>
          </div>
        )}

        {/* SECTION 1: MANUFACTURING FINDING & CONCERN (Multi-Stakeholder Feedback: AO, Inspection, Supplier) */}
        <div className="bg-white p-3.5 rounded-xl border-2 border-amber-300 shadow-xs space-y-3 text-xs">
          <div className="flex items-center justify-between border-b border-amber-100 pb-2">
            <span className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
              <Wrench className="w-4 h-4 text-amber-600" />
              <span>1. Manufacturing Finding &amp; Multi-Stakeholder Feedback</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 font-bold">
              Stakeholder Inputs
            </span>
          </div>

          {/* Stakeholder Perspective Tabs: AO, Inspection, Supplier */}
          <div>
            <label className="text-slate-700 block mb-1 text-[11px] font-bold">Select Stakeholder to View &amp; Edit Comment:</label>
            <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setActiveStakeholderTab('AO')}
                className={`py-2 px-2 rounded-md font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer relative ${
                  activeStakeholderTab === 'AO'
                    ? 'bg-slate-900 text-amber-300 shadow-xs border border-slate-700'
                    : 'text-slate-600 hover:text-slate-950 hover:bg-slate-200'
                }`}
              >
                <Wrench className="w-3.5 h-3.5 text-amber-400" />
                <span>AO / Mfg</span>
                {hasComment('AO') && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 border border-white"></span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveStakeholderTab('INSPECTION')}
                className={`py-2 px-2 rounded-md font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer relative ${
                  activeStakeholderTab === 'INSPECTION'
                    ? 'bg-slate-900 text-amber-300 shadow-xs border border-slate-700'
                    : 'text-slate-600 hover:text-slate-950 hover:bg-slate-200'
                }`}
              >
                <ScanEye className="w-3.5 h-3.5 text-blue-400" />
                <span>Inspection</span>
                {hasComment('INSPECTION') && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 border border-white"></span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveStakeholderTab('SUPPLIER')}
                className={`py-2 px-2 rounded-md font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer relative ${
                  activeStakeholderTab === 'SUPPLIER'
                    ? 'bg-slate-900 text-amber-300 shadow-xs border border-slate-700'
                    : 'text-slate-600 hover:text-slate-950 hover:bg-slate-200'
                }`}
              >
                <Factory className="w-3.5 h-3.5 text-amber-400" />
                <span>Supplier</span>
                {hasComment('SUPPLIER') && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 border border-white"></span>
                )}
              </button>
            </div>
          </div>

          {/* Active Stakeholder Input Fields */}
          <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-[11px] text-amber-950 flex items-center gap-1">
                {activeStakeholderTab === 'AO' && <Wrench className="w-3.5 h-3.5 text-amber-600" />}
                {activeStakeholderTab === 'INSPECTION' && <ScanEye className="w-3.5 h-3.5 text-blue-600" />}
                {activeStakeholderTab === 'SUPPLIER' && <Factory className="w-3.5 h-3.5 text-orange-600" />}
                <span>
                  {activeStakeholderTab === 'AO' ? 'AO Manufacturing Concern' :
                   activeStakeholderTab === 'INSPECTION' ? 'Quality & Metrology Inspection Concern' :
                   'Voice of a Process'}
                </span>
              </span>
              <span className="text-[10px] text-neutral-500 font-mono">
                Saved individually per stakeholder
              </span>
            </div>

            <div>
              <label className="text-slate-700 block mb-1 text-[11px] font-bold">Reviewer Name</label>
              <input
                type="text"
                value={stakeholderData[activeStakeholderTab].authorName}
                onChange={(e) => updateCurrentStakeholderField(activeStakeholderTab, 'authorName', e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-slate-700 block mb-1 text-[11px] font-bold">
                {activeStakeholderTab === 'AO' ? 'Manufacturing Finding / Concern:' :
                 activeStakeholderTab === 'INSPECTION' ? 'Inspection / Metrology Finding:' :
                 'Supplier Machining / Tooling Finding:'}
              </label>
              <textarea
                value={stakeholderData[activeStakeholderTab].issue}
                onChange={(e) => updateCurrentStakeholderField(activeStakeholderTab, 'issue', e.target.value)}
                placeholder={
                  activeStakeholderTab === 'AO' 
                    ? "e.g. Wall thickness 0.8mm is too thin for clamping pressure, risk of chatter or part distortion..."
                    : activeStakeholderTab === 'INSPECTION'
                    ? "e.g. Deep internal bore makes CMM stylus accessibility difficult, optical inspection unable to reach..."
                    : "e.g. Custom tooling required for internal groove radius, leads to 4-week tooling lead time..."
                }
                rows={3}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-none"
                autoFocus
              />
            </div>

            <div>
              <label className="text-slate-700 block mb-1 text-[11px] font-bold">Proposed Change / Relaxation</label>
              <input
                type="text"
                value={stakeholderData[activeStakeholderTab].proposedChange}
                onChange={(e) => updateCurrentStakeholderField(activeStakeholderTab, 'proposedChange', e.target.value)}
                placeholder="e.g. Request open tolerance to ±0.05mm, or add 0.5mm undercut radius"
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
          </div>

          {/* Quick status summary of other stakeholders */}
          <div className="text-[11px] text-neutral-500 pt-1 flex items-center justify-between border-t border-amber-100">
            <span>Summary:</span>
            <div className="flex items-center gap-2">
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${hasComment('AO') ? 'bg-amber-100 text-amber-900' : 'bg-neutral-100 text-neutral-400'}`}>
                AO: {hasComment('AO') ? 'Commented ✓' : 'Empty'}
              </span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${hasComment('INSPECTION') ? 'bg-blue-100 text-blue-900' : 'bg-neutral-100 text-neutral-400'}`}>
                Inspection: {hasComment('INSPECTION') ? 'Commented ✓' : 'Empty'}
              </span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${hasComment('SUPPLIER') ? 'bg-orange-100 text-orange-900' : 'bg-neutral-100 text-neutral-400'}`}>
                Supplier: {hasComment('SUPPLIER') ? 'Commented ✓' : 'Empty'}
              </span>
            </div>
          </div>
        </div>

        {/* SECTION 2: DESIGN CONCURRENCE & DECISION */}
        <div className="bg-white p-3.5 rounded-xl border-2 border-blue-300 shadow-sm space-y-3 text-xs">
          <div className="flex items-center justify-between border-b border-blue-100 pb-2">
            <span className="font-extrabold text-black text-xs flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-blue-600" />
              <span>2. Design Concurrence &amp; Decision</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-300 font-bold">
              R&amp;D Concurrence
            </span>
          </div>

          <div>
            <label className="text-neutral-700 block mb-1.5 text-[11px] font-bold">Design Decision on Proposed Change:</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDesignDecision('ACCEPTED')}
                className={`p-2 rounded-lg border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  designDecision === 'ACCEPTED'
                    ? 'bg-emerald-100 border-emerald-500 text-emerald-900 font-black ring-2 ring-emerald-500/40'
                    : 'bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-emerald-50'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="text-[11px]">Accept</span>
              </button>

              <button
                type="button"
                onClick={() => setDesignDecision('REJECTED')}
                className={`p-2 rounded-lg border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  designDecision === 'REJECTED'
                    ? 'bg-rose-100 border-rose-500 text-rose-900 font-black ring-2 ring-rose-500/40'
                    : 'bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-rose-50'
                }`}
              >
                <XCircle className="w-4 h-4 text-rose-600" />
                <span className="text-[11px]">Reject</span>
              </button>

              <button
                type="button"
                onClick={() => setDesignDecision('PROPOSED_ALTERNATIVE')}
                className={`p-2 rounded-lg border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  designDecision === 'PROPOSED_ALTERNATIVE'
                    ? 'bg-blue-100 border-blue-500 text-blue-900 font-black ring-2 ring-blue-500/40'
                    : 'bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-blue-50'
                }`}
              >
                <MessageSquare className="w-4 h-4 text-blue-600" />
                <span className="text-[11px]">Alternative</span>
              </button>
            </div>
          </div>

          <div>
            <label className="text-neutral-700 block mb-1 text-[11px] font-bold">Design Engineering Comment &amp; Rationale</label>
            <textarea
              value={designComment}
              onChange={(e) => setDesignComment(e.target.value)}
              placeholder="Design feedback, engineering rationale, or proposed drawing change details..."
              rows={2}
              className="w-full bg-neutral-50 border border-neutral-300 rounded-lg p-2 text-black text-xs focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none resize-none"
            />
          </div>
        </div>

        {/* SECTION 3: MANUFACTURING REVIEW & VERIFICATION */}
        <div className="bg-white p-3.5 rounded-xl border-2 border-emerald-300 shadow-sm space-y-3 text-xs">
          <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
            <span className="font-extrabold text-black text-xs flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>3. Manufacturing Review &amp; Verification</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold">
              Sign-off
            </span>
          </div>

          <div>
            <label className="text-neutral-700 block mb-1.5 text-[11px] font-bold">Manufacturing Verification Status:</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMfgVerdict('VERIFIED_ACCEPTED')}
                className={`p-2 rounded-lg border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  mfgVerdict === 'VERIFIED_ACCEPTED'
                    ? 'bg-emerald-600 text-white font-bold shadow-sm'
                    : 'bg-neutral-50 border-neutral-300 text-neutral-700 hover:bg-emerald-50'
                }`}
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span className="text-xs">Accepted &amp; Verified (✓)</span>
              </button>

              <button
                type="button"
                onClick={() => setMfgVerdict('STILL_OPEN')}
                className={`p-2 rounded-lg border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  mfgVerdict === 'STILL_OPEN'
                    ? 'bg-rose-600 text-white font-bold shadow-sm'
                    : 'bg-neutral-50 border-neutral-300 text-neutral-700 hover:bg-rose-50'
                }`}
              >
                <AlertTriangle className="w-4 h-4" />
                <span className="text-xs">Still Open / Attention (⚠️)</span>
              </button>
            </div>
          </div>

          <div>
            <label className="text-neutral-700 block mb-1 text-[11px] font-bold">Manufacturing Verification Note</label>
            <input
              type="text"
              value={mfgVerificationNote}
              onChange={(e) => setMfgVerificationNote(e.target.value)}
              placeholder="e.g. Verified update in Rev B print side-by-side comparison"
              className="w-full bg-neutral-50 border border-neutral-300 rounded-lg p-2 text-black text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
          </div>
        </div>

        {/* SECTION: FEATURE SPECIFICATION DETAILS (AT THE BOTTOM, ALL MARKED EMPTY BY DEFAULT) */}
        <div className="bg-white p-3.5 rounded-xl border border-neutral-200 shadow-sm space-y-2.5 text-xs">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-1.5">
            <span className="font-bold text-black flex items-center gap-1.5">
              <FileCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>Feature Specification Details (Optional)</span>
            </span>
          </div>

          <div>
            <label className="text-neutral-600 block mb-1 text-[11px] font-medium">Feature Callout Description</label>
            <input
              type="text"
              value={featureName}
              onChange={(e) => setFeatureName(e.target.value)}
              className="w-full bg-neutral-50 border border-neutral-300 rounded-lg p-2 text-black font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="e.g. Central Bore Diameter Ø64"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-neutral-600 block mb-1 text-[11px] font-medium">Classification</label>
              <select
                value={dimensionNature}
                onChange={(e) => {
                  const nat = e.target.value as DimensionNature;
                  setDimensionNature(nat);
                  if (nat === 'REFERENCE' || nat === 'BASIC') {
                    setIsRelevant(false);
                  } else {
                    setIsRelevant(true);
                  }
                }}
                className="w-full bg-neutral-50 border border-neutral-300 rounded-lg p-1.5 text-black font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="STANDARD">Standard Dimension</option>
                <option value="REFERENCE">Reference (REF)</option>
                <option value="BASIC">Basic Dimension [BOX]</option>
                <option value="NOTE">Drawing Note</option>
              </select>
            </div>

            <div>
              <label className="text-neutral-600 block mb-1 text-[11px] font-medium">Dimension Type</label>
              <select
                value={dimensionType}
                onChange={(e) => setDimensionType(e.target.value as DimensionType)}
                className="w-full bg-neutral-50 border border-neutral-300 rounded-lg p-1.5 text-black font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="LINEAR">Linear</option>
                <option value="DIAMETER">Diameter (Ø)</option>
                <option value="RADIUS">Radius (R)</option>
                <option value="ANGULAR">Angular (°)</option>
                <option value="GDT">GD&amp;T</option>
                <option value="SURFACE_FINISH">Surface Finish</option>
                <option value="THREAD">Thread</option>
                <option value="NOTE">Note</option>
                <option value="MARKING">Marking</option>
              </select>
            </div>
          </div>

          {/* Nominal & Tolerances (Empty by default) */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-neutral-600 block mb-1 text-[11px] font-medium">Nominal</label>
              <input
                type="text"
                value={nominalValue}
                onChange={(e) => setNominalValue(e.target.value)}
                placeholder="e.g. 25.0"
                className="w-full bg-neutral-50 border border-neutral-300 rounded-lg p-1.5 text-black font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-neutral-600 block mb-1 text-[11px] font-medium">Upper Tol (+)</label>
              <input
                type="text"
                value={upperTol}
                onChange={(e) => setUpperTol(e.target.value)}
                placeholder="+0.05"
                className="w-full bg-neutral-50 border border-neutral-300 rounded-lg p-1.5 text-neutral-800 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-neutral-600 block mb-1 text-[11px] font-medium">Lower Tol (-)</label>
              <input
                type="text"
                value={lowerTol}
                onChange={(e) => setLowerTol(e.target.value)}
                placeholder="-0.05"
                className="w-full bg-neutral-50 border border-neutral-300 rounded-lg p-1.5 text-neutral-800 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Unit & View Name */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-neutral-600 block mb-1 text-[11px] font-medium">Unit</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-300 rounded-lg p-1.5 text-black font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="mm">mm</option>
                <option value="inch">inch</option>
                <option value="deg">deg (°)</option>
                <option value="Ra (µm)">Ra (µm)</option>
              </select>
            </div>
            <div>
              <label className="text-neutral-600 block mb-1 text-[11px] font-medium">Drawing View / Zone</label>
              <input
                type="text"
                value={viewName}
                onChange={(e) => setViewName(e.target.value)}
                placeholder="e.g. Zone B-3 / Detail C"
                className="w-full bg-neutral-50 border border-neutral-300 rounded-lg p-1.5 text-neutral-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Critical Characteristic & Relevance Toggle */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => setCriticalCharacteristic(!criticalCharacteristic)}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer border flex items-center justify-center gap-1.5 ${
                criticalCharacteristic
                  ? 'bg-rose-100 border-rose-400 text-rose-800'
                  : 'bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              <AlertTriangle className={`w-3.5 h-3.5 ${criticalCharacteristic ? 'text-rose-600' : 'text-neutral-400'}`} />
              <span>{criticalCharacteristic ? 'Critical Characteristic [CC/SC]' : 'Standard Characteristic'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsRelevant(!isRelevant)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                isRelevant
                  ? 'bg-slate-900 border-slate-900 text-amber-400'
                  : 'bg-neutral-100 border-neutral-200 text-neutral-500'
              }`}
            >
              {isRelevant ? 'In DFM' : 'Ignored'}
            </button>
          </div>
        </div>

      </div>

      {/* SINGLE OVERALL SUBMIT / SAVE CHANGES OPTION */}
      <div className="p-4 bg-white border-t border-slate-200 shadow-lg">
        <button
          type="button"
          onClick={handleSaveAll}
          className="w-full py-3 bg-slate-950 hover:bg-slate-800 text-amber-400 hover:text-amber-300 font-bold rounded-xl border border-slate-900 transition-all cursor-pointer text-sm shadow-md flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 text-amber-400" />
          <span>Save Changes &amp; Close</span>
        </button>
      </div>

      {/* Confirmation Dialog when updating existing saved comment (User Request 2.4) */}
      {showConfirmChangeModal && (
        <div className="fixed inset-0 z-60 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border-2 border-slate-900 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 border border-amber-300 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Confirm Comment Update</h3>
                <p className="text-xs text-slate-500 font-medium">Feature #{balloon.balloonNumber} &bull; {balloon.featureName || 'Drawing Characteristic'}</p>
              </div>
            </div>

            <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 text-xs text-neutral-800 space-y-2">
              <p className="font-medium leading-relaxed">
                You are about to modify a previously saved comment for <strong className="text-black font-bold">Feature #{balloon.balloonNumber}</strong>.
              </p>
              <p className="text-[11px] text-neutral-600 leading-normal">
                Updating will overwrite the previous feedback record. Do you want to proceed and save these updates?
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmChangeModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-slate-950 rounded-xl border border-neutral-300 hover:bg-neutral-100 cursor-pointer transition-colors"
              >
                Cancel &amp; Keep Editing
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowConfirmChangeModal(false);
                  executeSaveAll();
                }}
                className="px-4 py-2 text-xs font-bold bg-slate-950 hover:bg-slate-800 text-amber-400 hover:text-amber-300 rounded-xl border border-slate-900 shadow-md cursor-pointer transition-colors flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Confirm &amp; Update Comment</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
