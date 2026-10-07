export type StakeholderRole = 'AO' | 'INSPECTION' | 'RD' | 'SUPPLIER';

export interface StakeholderInfo {
  role: StakeholderRole;
  label: string;
  fullName: string;
  badgeBg: string;
  badgeText: string;
  accentColor: string;
  iconName: string;
}

export const STAKEHOLDER_CONFIGS: Record<StakeholderRole, StakeholderInfo> = {
  AO: {
    role: 'AO',
    label: 'AO',
    fullName: 'Advanced Operations (Manufacturing / Tooling)',
    badgeBg: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
    badgeText: 'text-amber-800 dark:text-amber-300',
    accentColor: '#f59e0b',
    iconName: 'Wrench',
  },
  INSPECTION: {
    role: 'INSPECTION',
    label: 'Inspection',
    fullName: 'Inspection & Quality Metrology',
    badgeBg: 'bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800',
    badgeText: 'text-purple-800 dark:text-purple-300',
    accentColor: '#8b5cf6',
    iconName: 'ScanEye',
  },
  RD: {
    role: 'RD',
    label: 'R&D',
    fullName: 'R&D / Design Engineering',
    badgeBg: 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
    badgeText: 'text-blue-800 dark:text-blue-300',
    accentColor: '#3b82f6',
    iconName: 'Compass',
  },
  SUPPLIER: {
    role: 'SUPPLIER',
    label: 'Supplier',
    fullName: 'Supplier / External Toolmaker',
    badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    badgeText: 'text-emerald-800 dark:text-emerald-300',
    accentColor: '#10b981',
    iconName: 'Factory',
  },
};

/**
 * Balloon state per user requirement:
 * - ADDRESSED (Complete / Implemented): GREEN circle with tick (✓) symbol
 * - UNCHANGED (Open / In progress): YELLOW circle with NO symbol
 * - ATTENTION (Needs attention / Critical risk): RED circle with caution (⚠️) symbol
 */
export type DFMStatus = 'ADDRESSED' | 'UNCHANGED' | 'ATTENTION';

export type DimensionNature = 'STANDARD' | 'REFERENCE' | 'BASIC' | 'NOTE';

export type DimensionType = 
  | 'LINEAR'
  | 'DIAMETER'
  | 'RADIUS'
  | 'ANGULAR'
  | 'GDT'
  | 'SURFACE_FINISH'
  | 'THREAD'
  | 'CHAMFER'
  | 'MARKING'
  | 'TABLE'
  | 'NOTE';

export interface FeedbackComment {
  id: string;
  role: StakeholderRole;
  authorName: string;
  comment: string;
  proposedChange?: string;
  suggestedTolerance?: string;
  timestamp: string;
  revisionId: string;
  statusUpdate?: DFMStatus;
  isPreviousRevisionComment?: boolean; // True if loaded from previous excel
}

export interface RevisionTraceRecord {
  revisionId: string;
  revisionName: string;
  date: string;
  nominalValue: string;
  upperTol: string;
  lowerTol: string;
  status: DFMStatus;
  summaryOfAction: string;
  verifiedInThisRev: boolean;
}

export interface BalloonItem {
  id: string;
  balloonNumber: number;
  customLabel?: string;
  // Normalized coordinates (0 to 100 percentage of drawing width/height)
  x: number;
  y: number;
  leaderTargetX?: number;
  leaderTargetY?: number;
  
  viewName: string; // e.g. "Section A-A", "Top View", "Main Elevation"
  
  // Engineering feature details
  featureName: string; // e.g. "Main Bore Ø64 H7", "Corner Radius R2.5"
  dimensionType: DimensionType;
  dimensionNature: DimensionNature; // STANDARD, REFERENCE (REF), BASIC, NOTE
  nominalValue: string;
  upperTol: string;
  lowerTol: string;
  unit: string;
  criticalCharacteristic: boolean; // CC/SC key characteristic
  
  // Toggle for markup visibility / relevance (e.g. switch off Reference or Basic dimensions)
  isRelevant: boolean;
  isVisible: boolean;
  
  // 3-state DFM Status:
  // - ADDRESSED: Green with checkmark
  // - UNCHANGED: Yellow with no symbol
  // - ATTENTION: Red with caution symbol
  status: DFMStatus;
  
  // Sheet number for multi-page drawings (1-indexed)
  sheetNumber?: number;

  // Visual Markup representation (Pen Circle, Highlighter Box, or Tag)
  markupType?: 'CIRCLE' | 'HIGHLIGHT' | 'TAG';
  markupCoordinates?: {
    minX: number;
    minY: number;
    width: number;
    height: number;
    radius?: number;
    pathD?: string; // Natural hand-drawn SVG pen stroke path
  };
  drawingSnipUrl?: string; // Visual snip crop of the drawing at this feature

  // Live DFM Workflow Practice Fields
  issueDescription?: string; // AO DFM finding / tooling / manufacturing concern
  proposedChange?: string; // AO proposed relaxation / change request
  rdResponse?: {
    status: 'ACCEPTED' | 'REJECTED' | 'PROPOSED_ALTERNATIVE';
    comment: string;
    date?: string;
    author?: string;
  };
  aoVerification?: {
    status: 'VERIFIED_ACCEPTED' | 'STILL_OPEN' | 'NEEDS_ATTENTION';
    comment?: string;
    verifiedInRevCode?: string;
  };
  visualComparisonStatus?: 'FINE_AS_CHANGED' | 'DISCREPANCY' | 'PENDING';
  visualComparisonNotes?: string;
  
  // Feedback from different stakeholders
  feedbackList: FeedbackComment[];
  
  // Revision tracking
  originRevisionId: string;
  originRevisionName: string;
  revisionHistory: RevisionTraceRecord[];
}

export interface DrawingCheckmark {
  id: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  sheetNumber?: number;
  timestamp?: string;
}

export interface DrawingRevision {
  id: string;
  revCode: string; // e.g., "Rev 0.1", "Rev 0.2", "Rev A", "Rev B"
  title: string;
  description: string;
  date: string;
  author: string;
  drawingUrl: string; // SVG or data URL / image / rasterized PDF
  drawingType: 'svg' | 'image';
  drawingFileName?: string;
  drawingPages?: string[]; // All rendered pages for multi-page drawings/PDFs
  totalSheets?: number;
  balloons: BalloonItem[];
  checkmarks?: DrawingCheckmark[]; // Green pen tick marks for visual feature verification
  ecnNumber?: string;
  iteration: number; // Iteration count (e.g. 1, 2) to trace exports for same revision
  sourceExcelName?: string; // Tracks uploaded excel name for traceability
}

export interface DFMProject {
  id: string;
  partNumber: string;
  partName: string;
  projectLead: string;
  department: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  revisions: DrawingRevision[];
  activeRevisionId: string;
  currentFlow?: 'INITIATION' | 'DFM_UPDATE' | 'REVIEW' | 'WORKSPACE';
  comparisonDrawingUrl?: string; // Optional old drawing revision for Flow 2 visual comparison
  comparisonDrawingTitle?: string;
  comparisonDrawingPages?: string[];
  comparisonTotalSheets?: number;
  rawWorkbook?: any; // Preserved imported Excel workbook to save into exact same file with new tab
}
