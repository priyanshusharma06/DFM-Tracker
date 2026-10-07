import React, { useState, useEffect } from 'react';
import { 
  DFMProject, 
  DrawingRevision, 
  BalloonItem, 
  StakeholderRole,
  DFMStatus,
  DimensionNature,
  DrawingCheckmark
} from './types/dfm';
import { INITIAL_DFM_PROJECT } from './utils/sampleData';
import { parseDfmExcel } from './utils/excelParser';
import { StartScreen } from './components/StartScreen';
import { Header } from './components/Header';
import { DrawingViewer } from './components/DrawingViewer';
import { FeedbackMatrixTable } from './components/FeedbackMatrixTable';
import { RevisionTraceabilityView } from './components/RevisionTraceabilityView';
import { RevisionDiffViewer } from './components/RevisionDiffViewer';
import { BalloonDetailModal } from './components/BalloonDetailModal';
import { NewRevisionModal } from './components/NewRevisionModal';
import { DFMReportModal } from './components/DFMReportModal';
import { UploadOldDrawingModal } from './components/UploadOldDrawingModal';
import { 
  STRYKER_SHEET_1_BALLOONS, 
  STRYKER_SHEET_2_BALLOONS, 
  STRYKER_SHEET_3_BALLOONS 
} from './data/strykerMbdData';
import { 
  STRYKER_SHEET_1_SVG, 
  STRYKER_SHEET_2_SVG, 
  STRYKER_SHEET_3_SVG 
} from './data/strykerDrawingSheets';
import { SAMPLE_DRAWING_REV_A_SVG, SAMPLE_DRAWING_REV_B_SVG } from './utils/sampleDrawings';
import { ToastContainer, ToastMessage } from './components/Toast';
import { extractDrawingInfoFromFileName } from './utils/drawingUtils';

const STORAGE_KEY = 'dfm_loop_tracker_project_v2';

export default function App() {
  // Screen state: 'START_SCREEN' or 'WORKSPACE'
  const [currentView, setCurrentView] = useState<'START_SCREEN' | 'WORKSPACE'>('START_SCREEN');

  // In-app non-blocking toast notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (
    message: string, 
    type: 'success' | 'error' | 'info' | 'warning' = 'info', 
    title?: string
  ) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { id, message, type, title }]);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Project state
  const [project, setProject] = useState<DFMProject>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.id && parsed.revisions && parsed.revisions.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load project from localStorage:', e);
    }
    return INITIAL_DFM_PROJECT;
  });

  // Current active revision
  const activeRevision = 
    project.revisions.find((r) => r.id === project.activeRevisionId) || 
    project.revisions[project.revisions.length - 1];

  // User stakeholder role (defaults to AO)
  const [currentRole, setCurrentRole] = useState<StakeholderRole>('AO');

  // Active view tab
  const [activeTab, setActiveTab] = useState<'drawing' | 'matrix' | 'traceability' | 'diff'>('drawing');

  // Multi-sheet drawing state
  const [activeSheetNumber, setActiveSheetNumber] = useState<number>(1);
  const [totalSheets, setTotalSheets] = useState<number>(1);

  // Selected balloon for inspector
  const [selectedBalloonId, setSelectedBalloonId] = useState<string | undefined>(undefined);
  const selectedBalloon = 
    activeRevision.balloons.find((b) => b.id === selectedBalloonId) ||
    project.revisions.flatMap((r) => r.balloons).find((b) => b.id === selectedBalloonId);

  // Modals state
  const [showNewRevisionModal, setShowNewRevisionModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showUploadOldModal, setShowUploadOldModal] = useState(false);

  // Handle setting baseline drawing for side-by-side comparison from Loop 1 or Diff Viewer
  const handleConfirmOldDrawing = (
    oldUrl: string,
    oldType: 'svg' | 'image',
    oldName: string,
    extractedBalloons?: BalloonItem[],
    drawingPages?: string[]
  ) => {
    setShowUploadOldModal(false);
    const baselineBalloons = (extractedBalloons && extractedBalloons.length > 0
      ? extractedBalloons
      : []).map((b) => ({
        ...b,
        sheetNumber: Number(b.sheetNumber) || 1,
      }));

    const calculatedTotalSheets = Math.max(
      drawingPages && drawingPages.length > 0 ? drawingPages.length : 1,
      baselineBalloons.length > 0 ? Math.max(...baselineBalloons.map((b) => Number(b.sheetNumber) || 1)) : 1
    );

    setProject((prev) => {
      const existingRev = prev.revisions[0];
      const revAId = `rev-base-${Date.now()}`;
      const revBId = existingRev?.id || `rev-new-${Date.now()}`;

      const revA: DrawingRevision = {
        id: revAId,
        revCode: 'Rev Baseline',
        title: `Baseline Drawing (${oldName})`,
        description: 'Previous drawing uploaded for side-by-side visual comparison',
        date: 'Baseline',
        author: 'Design Engineering',
        drawingUrl: oldUrl,
        drawingType: oldType,
        drawingFileName: oldName,
        drawingPages: drawingPages && drawingPages.length > 0 ? drawingPages : [oldUrl],
        totalSheets: calculatedTotalSheets,
        balloons: baselineBalloons,
        iteration: 1,
      };

      const revB: DrawingRevision = {
        ...existingRev,
        id: revBId,
        revCode: existingRev?.revCode || 'Rev 0.1',
        iteration: Math.max(existingRev?.iteration || 1, 2),
      };

      return {
        ...prev,
        comparisonDrawingUrl: oldUrl,
        comparisonDrawingTitle: oldName,
        comparisonDrawingPages: drawingPages && drawingPages.length > 0 ? drawingPages : [oldUrl],
        comparisonTotalSheets: calculatedTotalSheets,
        activeRevisionId: revBId,
        revisions: [revA, revB],
      };
    });

    setActiveTab('diff');
    showToast(
      extractedBalloons && extractedBalloons.length > 0
        ? `Loaded baseline print with ${extractedBalloons.length} restored markups & comments for side-by-side comparison!`
        : `Loaded baseline print "${oldName}" for side-by-side comparison!`,
      'success',
      'Side-by-Side Comparison'
    );
  };

  // Persist project changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
    } catch (e) {
      console.error('Failed to persist project:', e);
    }
  }, [project]);

  // Synchronize multi-sheet count from active revision
  useEffect(() => {
    if (activeRevision.totalSheets && activeRevision.totalSheets > 0) {
      setTotalSheets(activeRevision.totalSheets);
    } else if (activeRevision.drawingPages && activeRevision.drawingPages.length > 0) {
      setTotalSheets(activeRevision.drawingPages.length);
    }
  }, [activeRevision.id, activeRevision.totalSheets, activeRevision.drawingPages]);

  // ==========================================
  // FLOW 1: NEW DRAWING (INITIATION) HANDLER
  // ==========================================
  const handleStartFlow1 = async (
    drawingUrl: string, 
    drawingType: 'svg' | 'image', 
    fileName: string, 
    partNumber?: string,
    drawingPages?: string[],
    partName?: string
  ) => {
    const revId = `rev-01-${Date.now()}`;
    const today = new Date().toISOString().split('T')[0];
    const pages = drawingPages && drawingPages.length > 0 ? drawingPages : [drawingUrl];
    const numSheets = pages.length;

    setTotalSheets(numSheets);
    setActiveSheetNumber(1);

    const extracted = extractDrawingInfoFromFileName(fileName);
    const effectivePartNumber = (partNumber && partNumber.trim()) || extracted.partNumber || '4938-5-004 (4)';
    const effectivePartName = (partName && partName.trim()) || extracted.partName || 'Precision Housing Assembly';

    const newProject: DFMProject = {
      id: `proj-${Date.now()}`,
      partNumber: effectivePartNumber,
      partName: effectivePartName,
      projectLead: 'Priyanshu Sharma (AO)',
      department: 'Advanced Operations (AO)',
      description: `DFM Activity Initiation for ${fileName}.`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      activeRevisionId: revId,
      currentFlow: 'INITIATION',
      revisions: [
        {
          id: revId,
          revCode: 'Rev 0.1',
          title: `${effectivePartNumber} Rev 0.1 - ${effectivePartName}`,
          description: `Engineering drawing loaded for multi-stakeholder DFM review: ${fileName}`,
          date: today,
          author: 'Priyanshu Sharma (AO)',
          drawingUrl: pages[0],
          drawingType,
          drawingFileName: fileName,
          drawingPages: pages,
          totalSheets: numSheets,
          iteration: 1,
          balloons: [],
        }
      ]
    };

    setProject(newProject);
    setSelectedBalloonId(undefined);
    setActiveTab('drawing');
    setCurrentView('WORKSPACE');
    showToast(`Loaded "${fileName}". Select "Circle with Pen" or "Highlight" on the print to review features.`, 'success', 'Print Loaded');
  };

  // MBDVidia Recognition Demo Loader for Stryker 4938-5-004
  const handleStartMbdStryker = () => {
    const revId = 'rev-stryker-ac';
    const strykerProject: DFMProject = {
      id: 'proj-stryker-4938-5-004',
      partNumber: '4938-5-004',
      partName: 'HLRF Drill Bit',
      projectLead: 'Priyanshu Sharma (AO)',
      department: 'Advanced Operations (AO) & Inspection',
      description: 'MBDVidia Model-Based Definition Drawing Feature Recognition & DFM Review',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      activeRevisionId: revId,
      currentFlow: 'INITIATION',
      revisions: [
        {
          id: revId,
          revCode: 'Rev AC',
          title: 'Design Released - MBD Characteristics',
          description: 'Recognized 82 inspection and DFM characteristics from Stryker 4938-5-004 Sheets 1-3.',
          date: 'Feb 06, 2024',
          author: 'RobersonN (Windchill)',
          drawingUrl: STRYKER_SHEET_1_SVG,
          drawingType: 'svg',
          drawingFileName: '4938-5-004_HLRF_Drill_Bit_RevAC.pdf',
          balloons: STRYKER_SHEET_1_BALLOONS,
          iteration: 1,
        }
      ]
    };

    setProject(strykerProject);
    setActiveSheetNumber(1);
    setTotalSheets(3);
    setSelectedBalloonId(undefined);
    setActiveTab('drawing');
    setCurrentView('WORKSPACE');
    showToast(
      'Loaded Stryker 4938-5-004 with 82 MBDVidia recognized characteristics across 3 drawing sheets!',
      'success',
      'MBDVidia Model Loaded'
    );
  };

  // Handle Multi-Sheet CAD Switching
  const handleSelectSheet = (sheetNum: number) => {
    setActiveSheetNumber(sheetNum);

    // 1. If drawing has multi-page images (e.g. from vector PDF or multi-page CAD upload)
    if (activeRevision.drawingPages && activeRevision.drawingPages.length >= sheetNum) {
      const pageUrl = activeRevision.drawingPages[sheetNum - 1];
      setProject((prev) => ({
        ...prev,
        revisions: prev.revisions.map((rev) =>
          rev.id === activeRevision.id
            ? {
                ...rev,
                drawingUrl: pageUrl,
                drawingType: 'image',
              }
            : rev
        ),
      }));
      showToast(`Viewing Sheet ${sheetNum} of ${totalSheets}`, 'info', 'Sheet Changed');
      return;
    }

    // 2. Stryker benchmark reference demo dataset (only for the explicit benchmark demo project)
    const isStrykerBenchmarkDemo = project.id === 'proj-stryker-4938-5-004';
    if (isStrykerBenchmarkDemo) {
      let nextSvg = STRYKER_SHEET_1_SVG;
      let nextBalloons = STRYKER_SHEET_1_BALLOONS;
      if (sheetNum === 2) {
        nextSvg = STRYKER_SHEET_2_SVG;
        nextBalloons = STRYKER_SHEET_2_BALLOONS;
      } else if (sheetNum === 3) {
        nextSvg = STRYKER_SHEET_3_SVG;
        nextBalloons = STRYKER_SHEET_3_BALLOONS;
      }

      setProject((prev) => ({
        ...prev,
        revisions: prev.revisions.map((rev) =>
          rev.id === activeRevision.id
            ? {
                ...rev,
                drawingUrl: nextSvg,
                balloons: nextBalloons,
              }
            : rev
        ),
      }));
      showToast(`Viewing Sheet ${sheetNum} of 3 (${nextBalloons.length} characteristics)`, 'info', 'Sheet Changed');
    }
  };

  // ==========================================
  // FLOW 2: REVISION LOOP TRACKING & SIDE-BY-SIDE HANDLER
  // ==========================================
  const handleStartFlow2 = async (
    excelFile?: File,
    newDrawingUrl?: string,
    newDrawingType: 'svg' | 'image' = 'svg',
    newDrawingName: string = 'Drawing_Rev_B.svg',
    oldDrawingUrl?: string,
    oldDrawingName: string = 'Drawing_Rev_A.svg',
    extractedOldBalloons?: BalloonItem[],
    newDrawingPages?: string[],
    oldDrawingPages?: string[],
    customPartNumber?: string,
    customPartName?: string
  ) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const revAId = `rev-01-${Date.now()}`;
      const revBId = `rev-02-${Date.now()}`;

      const finalNewDrawingUrl = newDrawingUrl || SAMPLE_DRAWING_REV_B_SVG;
      const finalOldDrawingUrl = oldDrawingUrl || SAMPLE_DRAWING_REV_A_SVG;

      const extractedInfo = extractDrawingInfoFromFileName(newDrawingName || oldDrawingName);
      let carriedBalloons: BalloonItem[] = [];
      let partNumber = (customPartNumber && customPartNumber.trim()) || extractedInfo.partNumber || '4938-5-004 (4)';
      let partName = (customPartName && customPartName.trim()) || extractedInfo.partName || 'Precision Housing Assembly';
      let sourceExcelName = excelFile?.name;

      if (extractedOldBalloons && extractedOldBalloons.length > 0) {
        carriedBalloons = extractedOldBalloons.map((b) => ({
          ...b,
          sheetNumber: Number(b.sheetNumber) || 1,
        }));
        if (excelFile) {
          try {
            const parsed = await parseDfmExcel(excelFile);
            if (parsed.partNumber) partNumber = parsed.partNumber;
            carriedBalloons = carriedBalloons.map((cb) => {
              const matched = parsed.balloons.find(
                (pb) => pb.balloonNumber === cb.balloonNumber || pb.customLabel === cb.customLabel
              );
              if (matched) {
                return {
                  ...cb,
                  nominalValue: matched.nominalValue || cb.nominalValue,
                  upperTol: matched.upperTol || cb.upperTol,
                  lowerTol: matched.lowerTol || cb.lowerTol,
                  featureName: matched.featureName || cb.featureName,
                  status: matched.status || cb.status,
                  feedbackList: [...cb.feedbackList, ...(matched.feedbackList || [])],
                };
              }
              return cb;
            });
          } catch {}
        }
      } else if (excelFile) {
        const parsed = await parseDfmExcel(excelFile);
        if (parsed.partNumber) partNumber = parsed.partNumber;
        carriedBalloons = parsed.balloons.map((pb, idx) => ({
          id: `b-${pb.balloonNumber || idx + 1}-${Date.now()}`,
          balloonNumber: pb.balloonNumber || idx + 1,
          customLabel: pb.customLabel || `#${pb.balloonNumber || idx + 1}`,
          x: pb.x ?? (20 + (idx % 4) * 20),
          y: pb.y ?? (20 + Math.floor(idx / 4) * 20),
          leaderTargetX: pb.leaderTargetX ?? (18 + (idx % 4) * 20),
          leaderTargetY: pb.leaderTargetY ?? (18 + Math.floor(idx / 4) * 20),
          viewName: pb.viewName || 'Main View',
          featureName: pb.featureName || `Feature #${idx + 1}`,
          dimensionType: pb.dimensionType || 'LINEAR',
          dimensionNature: pb.dimensionNature || 'STANDARD',
          nominalValue: pb.nominalValue || '',
          upperTol: pb.upperTol || '',
          lowerTol: pb.lowerTol || '',
          unit: pb.unit || 'mm',
          criticalCharacteristic: pb.criticalCharacteristic || false,
          isRelevant: pb.isRelevant ?? true,
          isVisible: pb.isRelevant ?? true,
          status: pb.status || 'UNCHANGED',
          sheetNumber: Number(pb.sheetNumber) || 1,
          markupType: pb.markupType || 'CIRCLE',
          markupCoordinates: pb.markupCoordinates,
          feedbackList: pb.feedbackList || [],
          originRevisionId: revAId,
          originRevisionName: 'Rev 0.1',
          revisionHistory: [
            {
              revisionId: revAId,
              revisionName: 'Rev 0.1',
              date: today,
              nominalValue: pb.nominalValue || '',
              upperTol: pb.upperTol || '',
              lowerTol: pb.lowerTol || '',
              status: pb.status || 'UNCHANGED',
              summaryOfAction: `Imported from ${excelFile.name} into Rev 0.2`,
              verifiedInThisRev: pb.status === 'ADDRESSED',
            }
          ]
        }));
      } else {
        // Default baseline carried characteristics for comparison
        carriedBalloons = [
          {
            id: `b-1-${Date.now()}`,
            balloonNumber: 1,
            customLabel: '#1',
            x: 28.0,
            y: 28.0,
            leaderTargetX: 23.0,
            leaderTargetY: 26.0,
            viewName: 'Main CAD View',
            featureName: 'Bore Diameter Ø25.0 H7',
            dimensionType: 'LINEAR',
            dimensionNature: 'STANDARD',
            nominalValue: '25.0',
            upperTol: '+0.02',
            lowerTol: '-0.02',
            unit: 'mm',
            criticalCharacteristic: true,
            isRelevant: true,
            isVisible: true,
            status: 'ATTENTION',
            issueDescription: 'Tight tolerance ±0.02 requires high precision reaming.',
            proposedChange: 'Request relax tolerance to ±0.05mm in Rev 0.2.',
            originRevisionId: revAId,
            originRevisionName: 'Rev 0.1',
            feedbackList: [
              {
                id: 'fb-ao-init',
                role: 'AO',
                authorName: 'AO Manufacturing Lead',
                comment: 'Tight tolerance ±0.02 requires high precision reaming.',
                timestamp: today,
                revisionId: revAId,
              }
            ],
            revisionHistory: [],
          },
          {
            id: `b-2-${Date.now()}`,
            balloonNumber: 2,
            customLabel: '#2',
            x: 52.0,
            y: 35.0,
            leaderTargetX: 47.0,
            leaderTargetY: 32.0,
            viewName: 'Main CAD View',
            featureName: 'Wall Thickness 12.5mm',
            dimensionType: 'LINEAR',
            dimensionNature: 'STANDARD',
            nominalValue: '12.5',
            upperTol: '+0.1',
            lowerTol: '-0.1',
            unit: 'mm',
            criticalCharacteristic: false,
            isRelevant: true,
            isVisible: true,
            status: 'UNCHANGED',
            issueDescription: 'Wall thickness clamp clearance verification.',
            originRevisionId: revAId,
            originRevisionName: 'Rev 0.1',
            feedbackList: [
              {
                id: 'fb-ao-wall',
                role: 'AO',
                authorName: 'AO Tooling Specialist',
                comment: 'Wall thickness clamp clearance verification.',
                timestamp: today,
                revisionId: revAId,
              }
            ],
            revisionHistory: [],
          },
        ];
      }

      const revATotalSheetsCalculated = Math.max(
        oldDrawingPages && oldDrawingPages.length > 0 ? oldDrawingPages.length : 1,
        carriedBalloons.length > 0 ? Math.max(...carriedBalloons.map((b) => Number(b.sheetNumber) || 1)) : 1
      );

      const revA: DrawingRevision = {
        id: revAId,
        revCode: 'Rev 0.1',
        title: `${partNumber} Rev 0.1 Baseline Drawing`,
        description: 'Previous drawing revision for visual comparison',
        date: 'Baseline',
        author: 'Design Engineering',
        drawingUrl: finalOldDrawingUrl,
        drawingType: finalOldDrawingUrl.startsWith('<svg') ? 'svg' : 'image',
        drawingFileName: oldDrawingName,
        drawingPages: oldDrawingPages && oldDrawingPages.length > 0 ? oldDrawingPages : [finalOldDrawingUrl],
        totalSheets: revATotalSheetsCalculated,
        iteration: 1,
        balloons: carriedBalloons,
      };

      // User Request 2.3: We don't need to show comparable marking on the new drawing when opened for comparison.
      // Keep new drawing clean for new marking wherever needed!
      const revB: DrawingRevision = {
        id: revBId,
        revCode: 'Rev 0.2',
        title: `${partNumber} Rev 0.2 (R&D Update)`,
        description: 'Updated drawing print received from R&D with relaxed tolerances.',
        date: today,
        author: 'R&D Engineering',
        drawingUrl: finalNewDrawingUrl,
        drawingType: newDrawingType,
        drawingFileName: newDrawingName,
        drawingPages: newDrawingPages && newDrawingPages.length > 0 ? newDrawingPages : (oldDrawingPages && oldDrawingPages.length > 0 ? oldDrawingPages : [finalNewDrawingUrl]),
        totalSheets: newDrawingPages && newDrawingPages.length > 0 ? newDrawingPages.length : revATotalSheetsCalculated,
        iteration: 2,
        sourceExcelName,
        balloons: [], // Clean canvas ready for newly marked features!
      };

      const newProject: DFMProject = {
        id: `proj-${Date.now()}`,
        partNumber,
        partName,
        projectLead: 'Priyanshu Sharma (AO)',
        department: 'Advanced Operations (AO)',
        description: `Revision loop analysis comparing Rev 0.1 vs Rev 0.2.`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        activeRevisionId: revBId,
        currentFlow: 'DFM_UPDATE',
        comparisonDrawingUrl: finalOldDrawingUrl,
        comparisonDrawingTitle: oldDrawingName || 'Previous Revision Drawing',
        comparisonDrawingPages: oldDrawingPages && oldDrawingPages.length > 0 ? oldDrawingPages : [finalOldDrawingUrl],
        comparisonTotalSheets: revATotalSheetsCalculated,
        revisions: [revA, revB],
      };

      setProject(newProject);
      setSelectedBalloonId(undefined);
      setActiveSheetNumber(1);
      setTotalSheets(revATotalSheetsCalculated);
      setActiveTab('diff'); // Open both drawings side-by-side immediately!
      setCurrentView('WORKSPACE');
      showToast(
        'Side-by-side comparison loaded! Previous print on left; new drawing on right is clean and ready for markup.',
        'success',
        'Side-by-Side Analysis Ready'
      );
    } catch (err: any) {
      showToast(`Error initializing revision tracking: ${err.message || err}`, 'error', 'Setup Error');
    }
  };

  // ==========================================
  // FLOW 3: ACTIVE REVIEW SESSION & IN-PROGRESS RESUME (User Request 3)
  // ==========================================
  const handleStartFlow3 = async (
    excelFile?: File,
    drawingUrl?: string,
    drawingType: 'svg' | 'image' = 'image',
    drawingName: string = 'Drawing.dwg',
    extractedBalloons?: BalloonItem[],
    drawingPages?: string[],
    detectedPartNumber?: string,
    detectedRevCode?: string,
    detectedPartName?: string
  ) => {
    try {
      const finalDrawingUrl = drawingUrl || SAMPLE_DRAWING_REV_A_SVG;
      const isSvg = finalDrawingUrl.trim().startsWith('<svg');
      const finalDrawingType: 'svg' | 'image' = isSvg ? 'svg' : drawingType;
      const revId = `rev-review-${Date.now()}`;
      const today = new Date().toISOString().split('T')[0];

      const extractedInfo = extractDrawingInfoFromFileName(drawingName);
      let balloons: BalloonItem[] = [];
      let partNumber = (detectedPartNumber && detectedPartNumber.trim()) || extractedInfo.partNumber || '4938-5-004 (4)';
      let partName = (detectedPartName && detectedPartName.trim()) || extractedInfo.partName || 'Precision Housing Assembly';
      let revCode = detectedRevCode || 'Rev 0.1';
      let iteration = 1;
      let sourceExcelName = excelFile?.name;

      // 1. If previously exported PDF has embedded DFM markings, restore them!
      if (extractedBalloons && extractedBalloons.length > 0) {
        balloons = extractedBalloons.map((b) => ({
          ...b,
          sheetNumber: Number(b.sheetNumber) || 1,
        }));
        if (detectedPartNumber) partNumber = detectedPartNumber;
        if (detectedRevCode) revCode = detectedRevCode;

        // Merge Excel comments if both were uploaded
        if (excelFile) {
          try {
            const parsed = await parseDfmExcel(excelFile);
            if (parsed.partNumber) partNumber = parsed.partNumber;
            if (parsed.revCode) revCode = parsed.revCode;
            if (parsed.iteration) iteration = parsed.iteration;
            balloons = balloons.map((cb) => {
              const matched = parsed.balloons.find(
                (pb) => pb.balloonNumber === cb.balloonNumber || pb.customLabel === cb.customLabel
              );
              if (matched) {
                return {
                  ...cb,
                  nominalValue: matched.nominalValue || cb.nominalValue,
                  upperTol: matched.upperTol || cb.upperTol,
                  lowerTol: matched.lowerTol || cb.lowerTol,
                  featureName: matched.featureName || cb.featureName,
                  status: matched.status || cb.status,
                  feedbackList: [...cb.feedbackList, ...(matched.feedbackList || [])],
                };
              }
              return cb;
            });
          } catch {}
        }
      } else if (excelFile) {
        const parsed = await parseDfmExcel(excelFile);
        if (parsed.partNumber) partNumber = parsed.partNumber;
        if (parsed.revCode) revCode = parsed.revCode;
        if (parsed.iteration) iteration = parsed.iteration;

        balloons = parsed.balloons.map((pb, idx) => ({
            id: `b-${pb.balloonNumber || idx + 1}-${Date.now()}`,
            balloonNumber: pb.balloonNumber || idx + 1,
            customLabel: pb.customLabel || `B-${String(pb.balloonNumber || idx + 1).padStart(2, '0')}`,
            x: pb.x ?? (18 + ((idx % 4) * 20)),
            y: pb.y ?? (18 + (Math.floor((idx % 16) / 4) * 18)),
            leaderTargetX: pb.leaderTargetX ?? (14 + ((idx % 4) * 20)),
            leaderTargetY: pb.leaderTargetY ?? (14 + (Math.floor((idx % 16) / 4) * 18)),
            viewName: pb.viewName || 'Main View',
            featureName: pb.featureName || `Feature #${idx + 1}`,
            dimensionType: pb.dimensionType || 'LINEAR',
            dimensionNature: pb.dimensionNature || 'STANDARD',
            nominalValue: pb.nominalValue || '',
            upperTol: pb.upperTol || '',
            lowerTol: pb.lowerTol || '',
            unit: pb.unit || 'mm',
            criticalCharacteristic: pb.criticalCharacteristic || false,
            isRelevant: pb.isRelevant ?? true,
            isVisible: pb.isRelevant ?? true,
            status: pb.status || 'UNCHANGED',
            sheetNumber: pb.sheetNumber || 1,
            markupType: pb.markupType || 'CIRCLE',
            markupCoordinates: pb.markupCoordinates,
            feedbackList: pb.feedbackList || [],
            originRevisionId: revId,
            originRevisionName: revCode,
            revisionHistory: []
          }));
        }

      const numSheets = Math.max(
        (drawingPages && drawingPages.length > 0) ? drawingPages.length : 1,
        balloons.length > 0 ? Math.max(...balloons.map((b) => Number(b.sheetNumber) || 1)) : 1
      );
      setActiveSheetNumber(1);
      setTotalSheets(numSheets);

      const newProject: DFMProject = {
        id: `proj-${Date.now()}`,
        partNumber,
        partName,
        projectLead: 'Priyanshu Sharma (AO)',
        department: 'Advanced Operations (AO)',
        description: `Active review session resuming previous work on ${partNumber} (${revCode}).`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        activeRevisionId: revId,
        currentFlow: 'REVIEW',
        revisions: [
          {
            id: revId,
            revCode,
            title: `${partNumber} ${revCode} (In-Progress Review)`,
            description: `Resumed session with ${balloons.length} editable characteristics and comments.`,
            date: today,
            author: 'Advanced Operations (AO)',
            drawingUrl: finalDrawingUrl,
            drawingType: finalDrawingType,
            drawingFileName: drawingName,
            drawingPages: drawingPages && drawingPages.length > 0 ? drawingPages : [finalDrawingUrl],
            totalSheets: numSheets,
            iteration,
            sourceExcelName,
            balloons,
          }
        ]
      };

      setProject(newProject);
      setSelectedBalloonId(undefined);
      setActiveTab('drawing');
      setCurrentView('WORKSPACE');
      showToast(
        `Session resumed successfully! Restored ${balloons.length} editable characteristics & markings on ${drawingName}.`,
        'success',
        'Work Resumed'
      );
    } catch (err: any) {
      showToast(`Error resuming session: ${err.message || err}`, 'error', 'Resume Error');
    }
  };

  // Quick Load Demo
  const handleQuickLoadDemo = () => {
    setProject(INITIAL_DFM_PROJECT);
    setSelectedBalloonId(undefined);
    setActiveTab('drawing');
    setCurrentView('WORKSPACE');
  };

  // Workspace Actions
  const handleSelectRevision = (revisionId: string) => {
    const targetRev = project.revisions.find((r) => r.id === revisionId);
    if (targetRev) {
      const sheets = Math.max(
        targetRev.drawingPages?.length || 1,
        targetRev.totalSheets || 1,
        targetRev.balloons.length > 0 ? Math.max(...targetRev.balloons.map((b) => Number(b.sheetNumber) || 1)) : 1
      );
      setTotalSheets(sheets);
      setActiveSheetNumber(1);
    }
    setProject((prev) => ({
      ...prev,
      activeRevisionId: revisionId,
      updatedAt: new Date().toISOString(),
    }));
    setSelectedBalloonId(undefined);
  };

  // Keep totalSheets synchronized with active revision
  useEffect(() => {
    if (activeRevision) {
      const sheets = Math.max(
        activeRevision.drawingPages?.length || 1,
        activeRevision.totalSheets || 1,
        activeRevision.balloons?.length ? Math.max(...activeRevision.balloons.map((b) => Number(b.sheetNumber) || 1)) : 1
      );
      setTotalSheets(sheets);
    }
  }, [activeRevision?.id, activeRevision?.drawingPages?.length, activeRevision?.totalSheets, activeRevision?.balloons?.length]);

  const handleUpdateBalloonStatus = (balloonId: string, newStatus: DFMStatus) => {
    setProject((prev) => {
      const updatedRevisions = prev.revisions.map((rev) => {
        if (rev.id === activeRevision.id) {
          return {
            ...rev,
            balloons: rev.balloons.map((b) => (b.id === balloonId ? { ...b, status: newStatus } : b)),
          };
        }
        return rev;
      });
      return { ...prev, revisions: updatedRevisions, updatedAt: new Date().toISOString() };
    });
  };

  const handleToggleRelevance = (balloonId: string, isRelevant: boolean) => {
    setProject((prev) => {
      const updatedRevisions = prev.revisions.map((rev) => {
        if (rev.id === activeRevision.id) {
          return {
            ...rev,
            balloons: rev.balloons.map((b) => (b.id === balloonId ? { ...b, isRelevant, isVisible: isRelevant } : b)),
          };
        }
        return rev;
      });
      return { ...prev, revisions: updatedRevisions, updatedAt: new Date().toISOString() };
    });
  };

  const handleAddBalloon = (newBalloonPartial: Partial<BalloonItem>) => {
    const targetRevId = newBalloonPartial.originRevisionId || activeRevision.id;
    const targetRev = project.revisions.find((r) => r.id === targetRevId) || activeRevision;
    const newId = newBalloonPartial.id || `b-${Date.now()}`;
    const nextNum = newBalloonPartial.balloonNumber || (targetRev.balloons.length > 0
      ? Math.max(...targetRev.balloons.map((b) => b.balloonNumber)) + 1
      : 1);

    const nextBalloon: BalloonItem = {
      id: newId,
      balloonNumber: nextNum,
      customLabel: newBalloonPartial.customLabel || `#${nextNum}`,
      x: newBalloonPartial.x ?? 50,
      y: newBalloonPartial.y ?? 50,
      leaderTargetX: newBalloonPartial.leaderTargetX,
      leaderTargetY: newBalloonPartial.leaderTargetY,
      viewName: newBalloonPartial.viewName || `Zone [${Math.round(newBalloonPartial.x ?? 50)}%, ${Math.round(newBalloonPartial.y ?? 50)}%]`,
      featureName: newBalloonPartial.featureName || '',
      dimensionType: newBalloonPartial.dimensionType || 'LINEAR',
      dimensionNature: newBalloonPartial.dimensionNature || 'STANDARD',
      nominalValue: newBalloonPartial.nominalValue || '',
      upperTol: newBalloonPartial.upperTol || '',
      lowerTol: newBalloonPartial.lowerTol || '',
      unit: newBalloonPartial.unit || 'mm',
      criticalCharacteristic: newBalloonPartial.criticalCharacteristic || false,
      isRelevant: newBalloonPartial.isRelevant ?? true,
      isVisible: newBalloonPartial.isVisible ?? true,
      status: newBalloonPartial.status || 'UNCHANGED',
      sheetNumber: newBalloonPartial.sheetNumber ?? activeSheetNumber,
      originRevisionId: targetRev.id,
      originRevisionName: targetRev.revCode,
      feedbackList: newBalloonPartial.feedbackList || [],
      revisionHistory: newBalloonPartial.revisionHistory || [],
      markupType: newBalloonPartial.markupType,
      markupCoordinates: newBalloonPartial.markupCoordinates,
      drawingSnipUrl: newBalloonPartial.drawingSnipUrl,
      issueDescription: newBalloonPartial.issueDescription || '',
      proposedChange: newBalloonPartial.proposedChange || '',
    };

    setProject((prev) => {
      const updatedRevisions = prev.revisions.map((rev) => {
        if (rev.id === targetRevId) {
          return {
            ...rev,
            balloons: [...rev.balloons, nextBalloon],
          };
        }
        return rev;
      });
      return { ...prev, revisions: updatedRevisions, updatedAt: new Date().toISOString() };
    });

    if (activeTab !== 'diff') {
      setSelectedBalloonId(newId);
    }
  };

  const handleUpdateBalloon = (updatedBalloon: BalloonItem) => {
    setProject((prev) => {
      const updatedRevisions = prev.revisions.map((rev) => {
        const hasBalloon = rev.balloons.some((b) => b.id === updatedBalloon.id);
        if (hasBalloon) {
          return {
            ...rev,
            balloons: rev.balloons.map((b) => (b.id === updatedBalloon.id ? updatedBalloon : b)),
          };
        }
        return rev;
      });
      return { ...prev, revisions: updatedRevisions, updatedAt: new Date().toISOString() };
    });
  };

  const handleUpdateBalloonPosition = (
    id: string, 
    x: number, 
    y: number, 
    targetX?: number, 
    targetY?: number
  ) => {
    setProject((prev) => {
      const updatedRevisions = prev.revisions.map((rev) => {
        if (rev.id === activeRevision.id) {
          return {
            ...rev,
            balloons: rev.balloons.map((b) => {
              if (b.id === id) {
                return {
                  ...b,
                  x,
                  y,
                  leaderTargetX: targetX !== undefined ? targetX : b.leaderTargetX,
                  leaderTargetY: targetY !== undefined ? targetY : b.leaderTargetY,
                };
              }
              return b;
            }),
          };
        }
        return rev;
      });
      return { ...prev, revisions: updatedRevisions };
    });
  };

  const handleDeleteBalloon = (balloonId: string) => {
    setProject((prev) => {
      const updatedRevisions = prev.revisions.map((rev) => {
        if (rev.id === activeRevision.id) {
          return {
            ...rev,
            balloons: rev.balloons.filter((b) => b.id !== balloonId),
          };
        }
        return rev;
      });
      return { ...prev, revisions: updatedRevisions, updatedAt: new Date().toISOString() };
    });
    setSelectedBalloonId(undefined);
  };

  const handleAddCheckmark = (checkmark: DrawingCheckmark) => {
    setProject((prev) => {
      const updatedRevisions = prev.revisions.map((rev) => {
        if (rev.id === activeRevision.id) {
          const existing = rev.checkmarks || [];
          return {
            ...rev,
            checkmarks: [...existing, checkmark],
          };
        }
        return rev;
      });
      return { ...prev, revisions: updatedRevisions, updatedAt: new Date().toISOString() };
    });
  };

  const handleRemoveCheckmark = (checkmarkId: string) => {
    setProject((prev) => {
      const updatedRevisions = prev.revisions.map((rev) => {
        if (rev.id === activeRevision.id) {
          return {
            ...rev,
            checkmarks: (rev.checkmarks || []).filter((c) => c.id !== checkmarkId),
          };
        }
        return rev;
      });
      return { ...prev, revisions: updatedRevisions, updatedAt: new Date().toISOString() };
    });
  };

  const handleCreateRevision = (newRevision: DrawingRevision) => {
    setProject((prev) => ({
      ...prev,
      revisions: [...prev.revisions, newRevision],
      activeRevisionId: newRevision.id,
      updatedAt: new Date().toISOString(),
    }));
    setActiveTab('drawing');
  };

  const handleNavigateToDrawing = (balloonId: string) => {
    setSelectedBalloonId(balloonId);
    setActiveTab('drawing');
  };

  const handleUpdateProjectDetails = (updates: {
    partNumber?: string;
    partName?: string;
    revCode?: string;
    projectLead?: string;
  }) => {
    setProject((prev) => {
      const updatedPartNumber = updates.partNumber !== undefined && updates.partNumber.trim() ? updates.partNumber.trim() : prev.partNumber;
      const updatedPartName = updates.partName !== undefined && updates.partName.trim() ? updates.partName.trim() : prev.partName;
      const updatedLead = updates.projectLead !== undefined && updates.projectLead.trim() ? updates.projectLead.trim() : prev.projectLead;
      
      const updatedRevisions = prev.revisions.map((rev) => {
        if (rev.id === prev.activeRevisionId) {
          const newRevCode = updates.revCode !== undefined && updates.revCode.trim() ? updates.revCode.trim() : rev.revCode;
          return {
            ...rev,
            revCode: newRevCode,
            title: `${updatedPartNumber} ${newRevCode} - ${updatedPartName}`,
          };
        }
        return rev;
      });

      return {
        ...prev,
        partNumber: updatedPartNumber,
        partName: updatedPartName,
        projectLead: updatedLead,
        revisions: updatedRevisions,
        updatedAt: new Date().toISOString(),
      };
    });
    showToast('Updated drawing title & drawing number across project!', 'success', 'Drawing Details Updated');
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-white font-sans text-black overflow-hidden">
      
      {/* 1. START SCREEN (FLOW 1, FLOW 2, FLOW 3) */}
      {currentView === 'START_SCREEN' ? (
        <div className="flex-1 w-full h-full overflow-y-auto overflow-x-hidden">
          <StartScreen
            onStartFlow1={handleStartFlow1}
            onStartFlow2={handleStartFlow2}
            onStartFlow3={handleStartFlow3}
            onQuickLoadDemo={handleQuickLoadDemo}
            onShowToast={showToast}
          />
        </div>
      ) : (
        /* 2. WORKSPACE REVIEW & MARKUP ENGINE */
        <>
          <Header
            project={project}
            activeRevision={activeRevision}
            currentRole={currentRole}
            onRoleChange={setCurrentRole}
            onSelectRevision={handleSelectRevision}
            onOpenNewRevisionModal={() => setShowNewRevisionModal(true)}
            onOpenReportModal={() => setShowReportModal(true)}
            onReturnToHome={() => setCurrentView('START_SCREEN')}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onShowToast={showToast}
            onTriggerUploadOldDrawing={() => setShowUploadOldModal(true)}
            onUpdateProjectDetails={handleUpdateProjectDetails}
          />

          <main className="flex-1 flex flex-col overflow-hidden relative">
            {activeTab === 'drawing' && (
              <DrawingViewer
                revision={activeRevision}
                selectedBalloonId={selectedBalloonId}
                onSelectBalloon={(b) => setSelectedBalloonId(b.id)}
                onAddBalloon={handleAddBalloon}
                onUpdateBalloonPosition={handleUpdateBalloonPosition}
                onToggleBalloonRelevance={(id, rel) => handleToggleRelevance(id, rel)}
                onAddCheckmark={handleAddCheckmark}
                onRemoveCheckmark={handleRemoveCheckmark}
                currentRole={currentRole}
                activeSheetNumber={activeSheetNumber}
                totalSheets={totalSheets}
                onSelectSheet={handleSelectSheet}
              />
            )}

            {activeTab === 'matrix' && (
              <FeedbackMatrixTable
                project={project}
                activeRevision={activeRevision}
                onSelectBalloon={(b) => setSelectedBalloonId(b.id)}
                onNavigateToDrawing={handleNavigateToDrawing}
                onUpdateBalloonStatus={handleUpdateBalloonStatus}
                onToggleRelevance={handleToggleRelevance}
                currentRole={currentRole}
                onShowToast={showToast}
              />
            )}

            {activeTab === 'traceability' && (
              <RevisionTraceabilityView
                project={project}
                onSelectBalloon={(b) => {
                  if (b.originRevisionId !== activeRevision.id) {
                    handleSelectRevision(b.originRevisionId);
                  }
                  setSelectedBalloonId(b.id);
                }}
                onSelectRevision={handleSelectRevision}
              />
            )}

            {activeTab === 'diff' && (
              <RevisionDiffViewer
                project={project}
                activeRevisionId={activeRevision.id}
                onUpdateBalloon={handleUpdateBalloon}
                onUpdateBalloonPosition={handleUpdateBalloonPosition}
                onCreateRevision={handleCreateRevision}
                onSelectRevision={handleSelectRevision}
                onShowToast={showToast}
                onSelectBalloon={(b) => setSelectedBalloonId(b.id)}
                onAddBalloon={handleAddBalloon}
                onAddCheckmark={handleAddCheckmark}
                onRemoveCheckmark={handleRemoveCheckmark}
                onTriggerUploadOldDrawing={() => setShowUploadOldModal(true)}
              />
            )}
          </main>

          {/* Balloon Inspector / Feedback Drawer */}
          {selectedBalloon && (
            <BalloonDetailModal
              balloon={selectedBalloon}
              otherBalloons={activeRevision.balloons}
              currentRole={currentRole}
              activeRevisionId={activeRevision.id}
              activeRevisionCode={activeRevision.revCode}
              onClose={() => setSelectedBalloonId(undefined)}
              onUpdateBalloon={handleUpdateBalloon}
              onUpdateBalloonPosition={handleUpdateBalloonPosition}
              onDeleteBalloon={handleDeleteBalloon}
            />
          )}

          {/* New Revision Modal */}
          {showNewRevisionModal && (
            <NewRevisionModal
              project={project}
              activeRevision={activeRevision}
              onClose={() => setShowNewRevisionModal(false)}
              onCreateRevision={handleCreateRevision}
            />
          )}

          {/* Sign-off Report Modal */}
          {showReportModal && (
            <DFMReportModal
              project={project}
              activeRevision={activeRevision}
              onClose={() => setShowReportModal(false)}
            />
          )}

          {/* Upload Prior Drawing for Side-by-Side Comparison Modal */}
          {showUploadOldModal && (
            <UploadOldDrawingModal
              currentDrawingFileName={activeRevision.drawingFileName}
              onClose={() => setShowUploadOldModal(false)}
              onConfirmOldDrawing={handleConfirmOldDrawing}
              onShowToast={showToast}
            />
          )}
        </>
      )}

      {/* Global In-App Toast Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
