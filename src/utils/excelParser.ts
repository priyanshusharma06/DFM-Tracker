import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { 
  BalloonItem, 
  DFMStatus, 
  DimensionNature, 
  DimensionType, 
  FeedbackComment, 
  DFMProject, 
  DrawingRevision 
} from '../types/dfm';

export interface ParsedExcelData {
  partNumber: string;
  revCode: string;
  iteration: number;
  balloons: Partial<BalloonItem>[];
  sourceFileName: string;
}

/**
 * Normalizes status strings from various excel inputs into the 3 target DFM states:
 * - ADDRESSED (Complete / Implemented)
 * - UNCHANGED (Open / In progress)
 * - ATTENTION (Needs attention / Critical / Red)
 */
export function normalizeStatus(val: any): DFMStatus {
  if (!val) return 'UNCHANGED';
  const str = String(val).toUpperCase().trim();
  if (
    str.includes('ADDRESSED') || 
    str.includes('COMPLETE') || 
    str.includes('IMPLEMENTED') || 
    str.includes('CLOSED') ||
    str.includes('VERIFIED') ||
    str.includes('DONE') ||
    str === 'YES' ||
    str === 'OK' ||
    str === 'GREEN'
  ) {
    return 'ADDRESSED';
  }
  if (
    str.includes('ATTENTION') || 
    str.includes('ACTION') || 
    str.includes('CRITICAL') || 
    str.includes('ISSUE') || 
    str.includes('REJECT') ||
    str === 'RED'
  ) {
    return 'ATTENTION';
  }
  return 'UNCHANGED';
}

/**
 * Parses an uploaded DFM Excel tracker file (.xlsx or .xls)
 */
export async function parseDfmExcel(file: File): Promise<ParsedExcelData> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });

  // 1. Check if the workbook contains our lossless _DFM_METADATA_ sheet
  if (workbook.SheetNames.includes('_DFM_METADATA_')) {
    const metaSheet = workbook.Sheets['_DFM_METADATA_'];
    const metaRows: any[] = XLSX.utils.sheet_to_json(metaSheet, { header: 1, defval: '' });
    let metaPart = '';
    let metaRev = '';
    let metaIter = 1;
    let metaPayload: any[] = [];
    for (const r of metaRows) {
      if (r[0] === 'PART_NUMBER' && r[1]) metaPart = String(r[1]);
      if (r[0] === 'REV_CODE' && r[1]) metaRev = String(r[1]);
      if (r[0] === 'ITERATION' && r[1]) metaIter = parseInt(String(r[1]), 10) || 1;
      if (r[0] === 'PAYLOAD' && r[1]) {
        try {
          metaPayload = JSON.parse(String(r[1]));
        } catch {}
      }
    }
    if (metaPayload.length > 0) {
      return {
        partNumber: metaPart || 'AO-4820-D',
        revCode: metaRev || 'Rev 0.1',
        iteration: metaIter,
        balloons: metaPayload.map((b) => ({
          ...b,
          sheetNumber: Number(b.sheetNumber) || 1,
        })),
        sourceFileName: file.name,
      };
    }
  }

  // Pick first sheet or sheet containing 'Tracker' / 'DFM'
  const sheetName = 
    workbook.SheetNames.find((s) => s.toLowerCase().includes('tracker') || s.toLowerCase().includes('dfm')) || 
    workbook.SheetNames[0];

  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) {
    throw new Error('No valid worksheet found in the uploaded Excel workbook.');
  }

  const rows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
  if (rows.length < 2) {
    throw new Error('The uploaded Excel sheet contains no tabular data.');
  }

  // Find header row (row containing 'balloon' or '#' or 'feature')
  let headerRowIndex = 0;
  for (let r = 0; r < Math.min(rows.length, 10); r++) {
    const rowStr = rows[r].map((c: any) => String(c).toLowerCase()).join(' ');
    if (rowStr.includes('balloon') || rowStr.includes('feature') || rowStr.includes('nominal')) {
      headerRowIndex = r;
      break;
    }
  }

  const headers = rows[headerRowIndex].map((c: any) => String(c).trim().toLowerCase());

  // Map column indices
  const getCol = (keywords: string[]): number => {
    return headers.findIndex((h: string) => keywords.some((k) => h.includes(k)));
  };

  const colBalloon = getCol(['balloon', '#', 'item']);
  const colFeature = getCol(['feature', 'characteristic', 'description', 'name']);
  const colNominal = getCol(['nominal', 'dimension', 'value', 'size']);
  const colUpperTol = getCol(['upper', 'tol +', '+tol', 'plus tol', 'tol(+)']);
  const colLowerTol = getCol(['lower', 'tol -', '-tol', 'minus tol', 'tol(-)']);
  const colType = getCol(['type', 'dim type']);
  const colNature = getCol(['nature', 'basic', 'ref', 'classification']);
  const colRelevant = getCol(['relevant', 'apply', 'rel?']);
  const colStatus = getCol(['status', 'addressed', 'resolution', 'complete', 'state']);
  const colAO = getCol(['ao', 'advanced operation', 'manufacturing', 'tooling']);
  const colInsp = getCol(['inspection', 'quality', 'metrology', 'cmm']);
  const colRD = getCol(['r&d', 'rd', 'design', 'engineering', 'decision']);
  const colSupplier = getCol(['supplier', 'vendor', 'machinist']);
  const colSheet = getCol(['sheet', 'page', 'pg', 'cad sheet']);

  // Deduce Part Number and Revision from filename or content
  let partNumber = 'AO-4820-D';
  let revCode = 'Rev 0.1';
  let iteration = 1;

  // Extract from filename: e.g. DFM_Tracker_AO-4820-D_Rev0.1_Iter1.xlsx
  const fn = file.name;
  const iterMatch = fn.match(/iter[a-z_ -]*([0-9]+)/i) || fn.match(/v([0-9]+)/i);
  if (iterMatch && iterMatch[1]) {
    // When importing for Flow 2 / Review, we automatically bump iteration for the next export!
    iteration = parseInt(iterMatch[1], 10) + 1;
  } else {
    iteration = 2; // Default to iteration 2 for exported updates
  }

  const revMatch = fn.match(/rev[ _-]*([0-9.]+|[a-z])/i);
  if (revMatch && revMatch[0]) {
    revCode = revMatch[0].toUpperCase().replace(/[-_]/g, ' ');
  }

  const parsedBalloons: Partial<BalloonItem>[] = [];

  for (let r = headerRowIndex + 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.every((c: any) => c === '')) continue;

    const balloonRaw = colBalloon >= 0 ? String(row[colBalloon]).replace(/[^0-9]/g, '') : '';
    const bNumber = balloonRaw ? parseInt(balloonRaw, 10) : parsedBalloons.length + 1;
    if (isNaN(bNumber) || bNumber <= 0) continue;

    const feature = colFeature >= 0 ? String(row[colFeature]).trim() : `Feature #${bNumber}`;
    const nominal = colNominal >= 0 ? String(row[colNominal]).trim() : '10.0';
    const upperTol = colUpperTol >= 0 ? String(row[colUpperTol]).trim() : '';
    const lowerTol = colLowerTol >= 0 ? String(row[colLowerTol]).trim() : '';
    const rawStatus = colStatus >= 0 ? row[colStatus] : 'UNCHANGED';
    const normalizedStat = normalizeStatus(rawStatus);

    // Dimension Nature: Detect if Basic [XX] or Reference (XX)
    let nature: DimensionNature = 'STANDARD';
    if (colNature >= 0 && row[colNature]) {
      const natStr = String(row[colNature]).toUpperCase();
      if (natStr.includes('REF')) nature = 'REFERENCE';
      else if (natStr.includes('BASIC')) nature = 'BASIC';
    } else {
      if (nominal.startsWith('(') && nominal.endsWith(')')) nature = 'REFERENCE';
      if (nominal.startsWith('[') && nominal.endsWith(']')) nature = 'BASIC';
    }

    const isRelevant = colRelevant >= 0 
      ? !String(row[colRelevant]).toLowerCase().includes('no') 
      : nature === 'STANDARD';

    const feedbackList: FeedbackComment[] = [];

    // Extract AO feedback from previous excel
    if (colAO >= 0 && row[colAO] && String(row[colAO]).trim()) {
      feedbackList.push({
        id: `fb-prev-ao-${r}`,
        role: 'AO',
        authorName: 'AO (Previous Excel)',
        comment: String(row[colAO]).trim(),
        timestamp: new Date().toISOString(),
        revisionId: 'prev-rev',
        isPreviousRevisionComment: true,
      });
    }

    // Extract Inspection feedback
    if (colInsp >= 0 && row[colInsp] && String(row[colInsp]).trim()) {
      feedbackList.push({
        id: `fb-prev-insp-${r}`,
        role: 'INSPECTION',
        authorName: 'Inspection (Previous Excel)',
        comment: String(row[colInsp]).trim(),
        timestamp: new Date().toISOString(),
        revisionId: 'prev-rev',
        isPreviousRevisionComment: true,
      });
    }

    // Extract R&D decision
    if (colRD >= 0 && row[colRD] && String(row[colRD]).trim()) {
      feedbackList.push({
        id: `fb-prev-rd-${r}`,
        role: 'RD',
        authorName: 'R&D (Previous Excel)',
        comment: String(row[colRD]).trim(),
        timestamp: new Date().toISOString(),
        revisionId: 'prev-rev',
        isPreviousRevisionComment: true,
      });
    }

    // Extract Supplier input
    if (colSupplier >= 0 && row[colSupplier] && String(row[colSupplier]).trim()) {
      feedbackList.push({
        id: `fb-prev-sup-${r}`,
        role: 'SUPPLIER',
        authorName: 'Supplier (Previous Excel)',
        comment: String(row[colSupplier]).trim(),
        timestamp: new Date().toISOString(),
        revisionId: 'prev-rev',
        isPreviousRevisionComment: true,
      });
    }

    let sheetNumber = 1;
    if (colSheet >= 0 && row[colSheet] !== undefined && row[colSheet] !== '') {
      const valStr = String(row[colSheet]).trim();
      const match = valStr.match(/sheet\s*([0-9]+)/i) || 
                    valStr.match(/([0-9]+)\s*of/i) || 
                    valStr.match(/^([0-9]+)/) ||
                    valStr.match(/\b([0-9]+)\b/);
      if (match && match[1]) {
        const parsedS = parseInt(match[1], 10);
        if (!isNaN(parsedS) && parsedS > 0) {
          sheetNumber = parsedS;
        }
      }
    }

    parsedBalloons.push({
      balloonNumber: bNumber,
      sheetNumber,
      customLabel: `B-${String(bNumber).padStart(2, '0')}`,
      featureName: feature,
      nominalValue: nominal,
      upperTol,
      lowerTol,
      unit: 'mm',
      dimensionNature: nature,
      dimensionType: 'LINEAR',
      isRelevant,
      isVisible: isRelevant,
      status: normalizedStat,
      feedbackList,
    });
  }

  return {
    partNumber,
    revCode,
    iteration,
    balloons: parsedBalloons,
    sourceFileName: file.name,
  };
}

/**
 * Exports to Excel with the exact user required naming scheme:
 * DFM_Tracker_[Part]_[Revision]_Iter[Iteration].xlsx
 * to indicate this is version 2 of the exported file for the same revision.
 * Embedded with actual image snips and updated column definitions.
 */
export async function exportDfmTrackerExcel(
  project: DFMProject,
  activeRevision: DrawingRevision,
  customIteration?: number
): Promise<string> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Stryker Advanced Operations (AO)';
  wb.lastModifiedBy = 'Stryker DFM Specialist';
  wb.created = new Date();
  wb.modified = new Date();

  const iterNum = customIteration || activeRevision.iteration || 1;

  // Find previous revision if available
  const activeRevIndex = project.revisions.findIndex((r) => r.id === activeRevision.id);
  const previousRevision = activeRevIndex > 0 ? project.revisions[activeRevIndex - 1] : undefined;
  const prevRevCode = previousRevision ? previousRevision.revCode : 'Rev Prev';

  // ==========================================
  // TAB 1: CURRENT DRAWING FEATURES & DFM REVIEW
  // ==========================================
  const wsTracker = wb.addWorksheet(`${activeRevision.revCode} Review`, {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  // Target columns per user requirement:
  // REMOVED: Markup type, CAD Zone, Classification, Pending visual comparison
  // REPLACED: AO tooling concern -> All stakeholder thread and RENAMED to "Manufacturing Feedback"
  // RENAMED: AO proposed change -> "Manufacturing changes"
  // ADDED: Actual drawing snip image embedded!
  wsTracker.columns = [
    { header: 'Feature #', key: 'featureNumber', width: 14 },
    { header: 'CAD Sheet', key: 'cadSheet', width: 12 },
    { header: 'Drawing Snip', key: 'drawingSnip', width: 24 },
    { header: 'Engineering Feature', key: 'featureName', width: 32 },
    { header: 'Relevant for DFM?', key: 'isRelevant', width: 18 },
    { header: 'Nominal Value', key: 'nominalValue', width: 16 },
    { header: 'Upper Tol (+)', key: 'upperTol', width: 14 },
    { header: 'Lower Tol (-)', key: 'lowerTol', width: 14 },
    { header: 'Unit', key: 'unit', width: 10 },
    { header: 'Manufacturing Feedback', key: 'manufacturingFeedback', width: 48 },
    { header: 'Manufacturing changes', key: 'manufacturingChanges', width: 36 },
    { header: 'R&D Concurrence', key: 'rdConcurrence', width: 22 },
    { header: 'R&D Response & Rationale', key: 'rdResponse', width: 38 },
    { header: 'AO Review Verdict', key: 'aoVerdict', width: 24 },
    { header: 'AO Verification Notes', key: 'aoNotes', width: 32 },
    { header: 'DFM Status', key: 'status', width: 18 },
  ];

  // Style header row
  const headerRow = wsTracker.getRow(1);
  headerRow.height = 28;
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FF000000' }, size: 10 };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFD100' }, // Stryker Yellow
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF000000' } },
      left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      bottom: { style: 'medium', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FFCCCCCC' } },
    };
  });

  // Populate data rows
  activeRevision.balloons.forEach((b, idx) => {
    const rowIndex = idx + 2; // 1-based, row 1 is header

    // Combine all stakeholder feedback into Manufacturing Feedback
    const feedbackLines: string[] = [];
    if (b.issueDescription) {
      feedbackLines.push(`[Initial Finding]: ${b.issueDescription}`);
    }
    if (b.feedbackList && b.feedbackList.length > 0) {
      for (const f of b.feedbackList) {
        feedbackLines.push(`[${f.role} - ${f.authorName}]: ${f.comment}${f.proposedChange ? ` (Proposed: ${f.proposedChange})` : ''}`);
      }
    }
    const combinedFeedback = feedbackLines.join('\n') || b.issueDescription || 'Reviewed on print';

    const row = wsTracker.addRow({
      featureNumber: b.customLabel || `#${b.balloonNumber}`,
      cadSheet: `Sheet ${b.sheetNumber || 1}`,
      drawingSnip: b.drawingSnipUrl ? '' : 'No snip preview',
      featureName: b.featureName || `Feature #${b.balloonNumber}`,
      isRelevant: b.isRelevant ? 'YES' : 'NO (REF/Basic)',
      nominalValue: b.nominalValue || '',
      upperTol: b.upperTol || '',
      lowerTol: b.lowerTol || '',
      unit: b.unit || 'mm',
      manufacturingFeedback: combinedFeedback,
      manufacturingChanges: b.proposedChange || (b.feedbackList && b.feedbackList[0]?.proposedChange) || 'Concurrence requested',
      rdConcurrence: b.rdResponse?.status || (b.status === 'ADDRESSED' ? 'ACCEPTED' : 'Pending R&D Review'),
      rdResponse: b.rdResponse?.comment || 'Pending R&D Concurrence',
      aoVerdict: b.aoVerification?.status ? b.aoVerification.status.replace('_', ' ') : (b.status === 'ADDRESSED' ? 'VERIFIED ACCEPTED' : 'PENDING CLOSURE'),
      aoNotes: b.aoVerification?.comment || 'Reviewed by AO',
      status: b.status === 'ADDRESSED' ? 'ADDRESSED (✓)' : b.status === 'ATTENTION' ? 'ATTENTION (⚠️)' : 'UNCHANGED',
    });

    row.height = b.drawingSnipUrl ? 65 : 32;
    row.alignment = { vertical: 'middle', wrapText: true };

    // Embed actual snip image directly into Excel cell (User Request 1.2)
    if (b.drawingSnipUrl && b.drawingSnipUrl.startsWith('data:image')) {
      try {
        const base64Data = b.drawingSnipUrl.split(',')[1];
        const imageId = wb.addImage({
          base64: base64Data,
          extension: 'png',
        });
        wsTracker.addImage(imageId, {
          tl: { col: 2.05, row: rowIndex - 1 + 0.08 }, // Col 2 is "Drawing Snip"
          ext: { width: 110, height: 60 },
          editAs: 'oneCell',
        });
      } catch (e) {
        console.warn('Could not embed snip in Excel:', e);
      }
    }
  });

  // ==========================================
  // TAB 2: PREVIOUS DRAWING REVISION HISTORY
  // ==========================================
  const wsPrevHistory = wb.addWorksheet(`${prevRevCode} History`, {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  wsPrevHistory.columns = [
    { header: 'Original Feature #', key: 'featureNumber', width: 18 },
    { header: 'Previous Revision', key: 'prevRev', width: 18 },
    { header: 'Previous Drawing Print', key: 'drawingFileName', width: 28 },
    { header: 'Original Marked Feature', key: 'featureName', width: 32 },
    { header: 'Original Dimension', key: 'dimension', width: 24 },
    { header: 'Manufacturing Feedback', key: 'manufacturingFeedback', width: 44 },
    { header: 'Manufacturing changes', key: 'manufacturingChanges', width: 36 },
    { header: 'Previous R&D Response', key: 'rdResponse', width: 36 },
    { header: 'Previous Status', key: 'status', width: 18 },
    { header: 'Carried Forward To', key: 'carriedForward', width: 32 },
  ];

  const prevHeaderRow = wsPrevHistory.getRow(1);
  prevHeaderRow.height = 26;
  prevHeaderRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E293B' }, // Slate 800
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  });

  const prevItems = (previousRevision && previousRevision.balloons && previousRevision.balloons.length > 0)
    ? previousRevision.balloons
    : activeRevision.balloons;

  prevItems.forEach((pb) => {
    const feedbackLines: string[] = [];
    if (pb.issueDescription) feedbackLines.push(`[Finding]: ${pb.issueDescription}`);
    if (pb.feedbackList) {
      for (const f of pb.feedbackList) {
        feedbackLines.push(`[${f.role} - ${f.authorName}]: ${f.comment}`);
      }
    }
    const combined = feedbackLines.join('\n') || pb.issueDescription || 'Flagged during initial print review';

    const row = wsPrevHistory.addRow({
      featureNumber: pb.customLabel || `#${pb.balloonNumber}`,
      prevRev: previousRevision ? previousRevision.revCode : (pb.originRevisionName || 'Initial Print'),
      drawingFileName: previousRevision?.drawingFileName || activeRevision.sourceExcelName || activeRevision.drawingFileName || 'Base Print',
      featureName: pb.featureName || `Feature #${pb.balloonNumber}`,
      dimension: `${pb.nominalValue || ''} ${pb.upperTol || ''} ${pb.lowerTol || ''} ${pb.unit || 'mm'}`,
      manufacturingFeedback: combined,
      manufacturingChanges: pb.proposedChange || 'Tolerance / relaxation requested',
      rdResponse: pb.rdResponse?.comment || 'Recorded in discussion',
      status: pb.status === 'ADDRESSED' ? 'ADDRESSED (✓)' : pb.status === 'ATTENTION' ? 'ATTENTION (⚠️)' : 'UNCHANGED',
      carriedForward: `${activeRevision.revCode} (Iter ${iterNum})`,
    });
    row.height = 28;
    row.alignment = { vertical: 'middle', wrapText: true };
  });

  // ==========================================
  // TAB 3: SIDE-BY-SIDE REVISION COMPARISON MATRIX
  // ==========================================
  const wsComparison = wb.addWorksheet('Revision Comparison Matrix', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  wsComparison.columns = [
    { header: 'Feature #', key: 'featureNumber', width: 14 },
    { header: 'Engineering Feature', key: 'featureName', width: 32 },
    { header: `${prevRevCode} Previous Dimension`, key: 'prevDim', width: 28 },
    { header: `${activeRevision.revCode} New Dimension`, key: 'newDim', width: 28 },
    { header: 'Geometry / Tolerance Change', key: 'changeStatus', width: 26 },
    { header: 'R&D Concurrence Decision', key: 'rdConcurrence', width: 24 },
    { header: 'Manufacturing Feedback', key: 'manufacturingFeedback', width: 40 },
    { header: 'Final Status', key: 'status', width: 20 },
  ];

  const compHeaderRow = wsComparison.getRow(1);
  compHeaderRow.height = 26;
  compHeaderRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF065F46' }, // Emerald 800
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  });

  activeRevision.balloons.forEach((b) => {
    const prevB = previousRevision?.balloons.find(
      (pb) => pb.balloonNumber === b.balloonNumber || pb.customLabel === b.customLabel
    );

    const prevDim = prevB 
      ? `${prevB.nominalValue} (${prevB.upperTol || '+0'}/${prevB.lowerTol || '-0'})` 
      : `${b.nominalValue || '0'} (Original Print)`;
    const newDim = `${b.nominalValue || '0'} (${b.upperTol || '+0'}/${b.lowerTol || '-0'})`;
    const isChanged = prevDim !== newDim;

    const row = wsComparison.addRow({
      featureNumber: b.customLabel || `#${b.balloonNumber}`,
      featureName: b.featureName || `Feature #${b.balloonNumber}`,
      prevDim,
      newDim,
      changeStatus: isChanged ? 'MODIFIED IN NEW PRINT' : 'UNCHANGED GEOMETRY',
      rdConcurrence: b.rdResponse?.status || (b.status === 'ADDRESSED' ? 'ACCEPTED' : 'UNDER DISCUSSION'),
      manufacturingFeedback: b.issueDescription || (b.feedbackList && b.feedbackList[0]?.comment) || 'Visual inspection recorded',
      status: b.status === 'ADDRESSED' ? 'CLOSED (✓)' : b.status === 'ATTENTION' ? 'OPEN / ATTENTION (⚠️)' : 'IN PROGRESS',
    });
    row.height = 26;
    row.alignment = { vertical: 'middle', wrapText: true };
  });

  // ==========================================
  // TAB 4: TRACEABILITY & AUDIT SUMMARY SHEET
  // ==========================================
  const wsSummary = wb.addWorksheet('Iteration Traceability Audit');
  wsSummary.columns = [
    { header: 'Parameter', key: 'parameter', width: 32 },
    { header: 'Value', key: 'value', width: 48 },
  ];

  const sumHeaderRow = wsSummary.getRow(1);
  sumHeaderRow.height = 24;
  sumHeaderRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF111827' },
    };
  });

  const summaryData = [
    { parameter: 'Part Number', value: project.partNumber },
    { parameter: 'Part Name', value: project.partName },
    { parameter: 'Drawing Revision', value: activeRevision.revCode },
    { parameter: 'Export Iteration', value: `Iteration ${iterNum}` },
    { parameter: 'Drawing Print File', value: activeRevision.drawingFileName || 'Active CAD Drawing' },
    { parameter: 'Previous Revision', value: prevRevCode },
    { parameter: 'Source Previous Excel', value: activeRevision.sourceExcelName || 'Initiated in Web App' },
    { parameter: 'Export Timestamp', value: new Date().toLocaleString() },
    { parameter: 'Total Features Reviewed', value: String(activeRevision.balloons.length) },
    { parameter: 'Addressed / Completed (Green ✓)', value: String(activeRevision.balloons.filter((b) => b.status === 'ADDRESSED').length) },
    { parameter: 'Unchanged / Open (Yellow)', value: String(activeRevision.balloons.filter((b) => b.status === 'UNCHANGED').length) },
    { parameter: 'Needs Attention (Red ⚠️)', value: String(activeRevision.balloons.filter((b) => b.status === 'ATTENTION').length) },
  ];

  summaryData.forEach((item) => {
    const row = wsSummary.addRow(item);
    row.height = 22;
  });

  // ==========================================
  // TAB 5: EMBEDDED LOSSLESS METADATA (HIDDEN)
  // Ensures 100% fidelity of coordinates, markups, and sheets when re-opened in Flow 2 or Flow 3
  // ==========================================
  const wsMeta = wb.addWorksheet('_DFM_METADATA_', { state: 'veryHidden' });
  wsMeta.addRow(['METADATA_VERSION', '1.0']);
  wsMeta.addRow(['PART_NUMBER', project.partNumber]);
  wsMeta.addRow(['REV_CODE', activeRevision.revCode]);
  wsMeta.addRow(['ITERATION', String(iterNum)]);
  const lightweightBalloons = activeRevision.balloons.map((b) => {
    const { drawingSnipUrl, ...rest } = b;
    return {
      ...rest,
      sheetNumber: Number(b.sheetNumber) || 1,
    };
  });
  wsMeta.addRow(['PAYLOAD', JSON.stringify(lightweightBalloons)]);

  // Write Excel file buffer and trigger download
  const sanitizedPart = project.partNumber.replace(/[^a-zA-Z0-9_-]/g, '_');
  const sanitizedRev = activeRevision.revCode.replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `drawing_review_${sanitizedPart}_${sanitizedRev}_Iter${iterNum}.xlsx`;

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return fileName;
}

/**
 * Creates a ready-to-test Sample DFM Excel Tracker File (.xlsx) in memory.
 * Allows users to test Flow 2 and Flow 3 immediately without having pre-existing files on disk.
 */
export function createSampleExcelFile(): File {
  const sampleRows = [
    {
      'Balloon #': 'B-01',
      'Engineering Feature': 'Central Actuator Bore Diameter',
      'Classification': 'STANDARD',
      'Relevant for DFM?': 'YES',
      'Nominal Value': '64.0',
      'Upper Tol (+)': '+0.016',
      'Lower Tol (-)': '0',
      'Unit': 'mm',
      'DFM Status': 'ATTENTION',
      'Addressed?': 'ATTENTION (⚠️)',
      'Previous Revision Feedback (History)': 'None',
      'AO Feedback (Manufacturing / Tooling)': 'Tolerance H6 (+0.016/-0 mm) at 160mm bore depth is too tight for our 4-axis horizontal CNC boring bars. Relax to H7 (+0.030/-0 mm)?',
      'Inspection Feedback (Metrology / CMM)': 'Verifying with inside micrometer; air gage tooling required if H6 maintained.',
      'R&D Response (Design Intent / Concurrence)': 'Under R&D evaluation for seal blow-by limits.',
      'Supplier / Machinist Feedback': 'Standard boring bar gives Ra 1.2; H6 will cause 15% scrap rate.',
    },
    {
      'Balloon #': 'B-02',
      'Engineering Feature': 'Internal Pocket Corner Radius',
      'Classification': 'STANDARD',
      'Relevant for DFM?': 'YES',
      'Nominal Value': '0.50',
      'Upper Tol (+)': '+0.10',
      'Lower Tol (-)': '0',
      'Unit': 'mm',
      'DFM Status': 'ATTENTION',
      'Addressed?': 'ATTENTION (⚠️)',
      'Previous Revision Feedback (History)': 'None',
      'AO Feedback (Manufacturing / Tooling)': 'R0.5 corner at 45mm depth requires sinker EDM with graphite electrodes. Can we enlarge to R2.5 mm for direct end-milling?',
      'Inspection Feedback (Metrology / CMM)': 'Optical comparator radius check difficult at bottom of pocket.',
      'R&D Response (Design Intent / Concurrence)': 'Checking internal spring clearance.',
      'Supplier / Machinist Feedback': 'R2.5 saves $45/part and eliminates dedicated EDM fixture.',
    },
    {
      'Balloon #': 'B-03',
      'Engineering Feature': 'Cavity Web Wall Thickness',
      'Classification': 'STANDARD',
      'Relevant for DFM?': 'YES',
      'Nominal Value': '1.80',
      'Upper Tol (+)': '+0.15',
      'Lower Tol (-)': '-0.15',
      'Unit': 'mm',
      'DFM Status': 'UNCHANGED',
      'Addressed?': 'UNCHANGED',
      'Previous Revision Feedback (History)': 'None',
      'AO Feedback (Manufacturing / Tooling)': '1.8mm thin wall deflects and chatters under high-feed milling. Recommend 2.4mm minimum.',
      'Inspection Feedback (Metrology / CMM)': 'Ultrasonic wall thickness probe agrees with deflection risk.',
      'R&D Response (Design Intent / Concurrence)': 'Weight budget allows +12 grams if wall thickened to 2.4mm.',
      'Supplier / Machinist Feedback': 'Need to reduce depth of cut by 50% if 1.8mm kept.',
    },
    {
      'Balloon #': 'B-04',
      'Engineering Feature': 'Actuator Mounting Face Surface Finish',
      'Classification': 'STANDARD',
      'Relevant for DFM?': 'YES',
      'Nominal Value': '0.4',
      'Upper Tol (+)': '',
      'Lower Tol (-)': '',
      'Unit': 'µm Ra',
      'DFM Status': 'ATTENTION',
      'Addressed?': 'ATTENTION (⚠️)',
      'Previous Revision Feedback (History)': 'None',
      'AO Feedback (Manufacturing / Tooling)': 'Ra 0.4 requires surface grinding. Can face milling Ra 0.8 be accepted with silicone gasket?',
      'Inspection Feedback (Metrology / CMM)': 'Ra 0.8 is standard for our profilometer.',
      'R&D Response (Design Intent / Concurrence)': 'Gasket test shows seal at Ra 0.8.',
      'Supplier / Machinist Feedback': 'Face mill cycle is 30 seconds vs 8 minutes grinding.',
    },
    {
      'Balloon #': 'B-05',
      'Engineering Feature': 'O-Ring Sealing Gland Depth',
      'Classification': 'STANDARD',
      'Relevant for DFM?': 'YES',
      'Nominal Value': '3.20',
      'Upper Tol (+)': '+0.05',
      'Lower Tol (-)': '0',
      'Unit': 'mm',
      'DFM Status': 'UNCHANGED',
      'Addressed?': 'UNCHANGED',
      'Previous Revision Feedback (History)': 'None',
      'AO Feedback (Manufacturing / Tooling)': 'Custom grooving tool required for non-standard 3.20 gland. Use ISO 3601 standard 3.10 ±0.05?',
      'Inspection Feedback (Metrology / CMM)': 'Standard pin gages available for ISO 3601.',
      'R&D Response (Design Intent / Concurrence)': 'ISO standard gland approved.',
      'Supplier / Machinist Feedback': 'Off-the-shelf Sandvik insert available for ISO size.',
    },
    {
      'Balloon #': 'B-06',
      'Engineering Feature': 'Mounting Hole Pattern True Position',
      'Classification': 'STANDARD',
      'Relevant for DFM?': 'YES',
      'Nominal Value': '0.08',
      'Upper Tol (+)': 'M',
      'Lower Tol (-)': '',
      'Unit': 'mm',
      'DFM Status': 'ATTENTION',
      'Addressed?': 'ATTENTION (⚠️)',
      'Previous Revision Feedback (History)': 'None',
      'AO Feedback (Manufacturing / Tooling)': 'Positional tolerance 0.08 to Datum C is too tight without dedicated reamer. Relax to 0.15 MMC?',
      'Inspection Feedback (Metrology / CMM)': 'CMM probe tip calibration tight for 0.08 on 4x holes.',
      'R&D Response (Design Intent / Concurrence)': 'M6 clearance allows 0.15 MMC.',
      'Supplier / Machinist Feedback': 'Allows standard carbide drill without post-reaming.',
    },
    {
      'Balloon #': 'B-07',
      'Engineering Feature': 'Overall Housing Length (Reference)',
      'Classification': 'REFERENCE',
      'Relevant for DFM?': 'NO (REF/Basic)',
      'Nominal Value': '220.0',
      'Upper Tol (+)': 'REF',
      'Lower Tol (-)': '',
      'Unit': 'mm',
      'DFM Status': 'UNCHANGED',
      'Addressed?': 'UNCHANGED',
      'Previous Revision Feedback (History)': 'None',
      'AO Feedback (Manufacturing / Tooling)': 'Reference dimension - not relevant for DFM sign-off.',
      'Inspection Feedback (Metrology / CMM)': 'Not measured.',
      'R&D Response (Design Intent / Concurrence)': 'Reference for overall envelope only.',
      'Supplier / Machinist Feedback': 'Stock length.',
    }
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(sampleRows);
  XLSX.utils.book_append_sheet(wb, ws, 'Rev 0.1 DFM Review');

  const summaryRows = [
    { Parameter: 'Part Number', Value: 'AO-4820-D' },
    { Parameter: 'Part Name', Value: 'Precision Valve Actuator Housing' },
    { Parameter: 'Drawing Revision', Value: 'Rev 0.1' },
    { Parameter: 'Export Iteration', Value: 'Iteration 1' },
    { Parameter: 'Source Previous Excel', Value: 'Concept Initiation' },
    { Parameter: 'Export Timestamp', Value: new Date().toLocaleString() },
  ];
  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Iteration Traceability Audit');

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  return new File([blob], 'DFM_Tracker_AO-4820-D_Rev0.1_Iter1.xlsx', { type: blob.type });
}

