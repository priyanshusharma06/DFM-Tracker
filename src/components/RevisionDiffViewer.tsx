import React, { useState, useRef, useEffect, MouseEvent } from 'react';
import { DFMProject, DrawingRevision, BalloonItem, DFMStatus, DrawingCheckmark } from '../types/dfm';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Layers, 
  ArrowRight, 
  Check, 
  AlertTriangle, 
  FileSpreadsheet, 
  Eye, 
  PenTool, 
  Highlighter, 
  Hand, 
  Download, 
  Upload, 
  Split, 
  FileUp,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  X,
  ExternalLink,
  SlidersHorizontal
} from 'lucide-react';
import { exportDfmTrackerExcel } from '../utils/excelParser';
import { exportDfmDrawingPdf } from '../utils/pdfExport';

interface RevisionDiffViewerProps {
  project: DFMProject;
  activeRevisionId: string;
  onUpdateBalloon?: (balloon: BalloonItem) => void;
  onUpdateBalloonPosition?: (id: string, x: number, y: number, targetX?: number, targetY?: number) => void;
  onCreateRevision?: (newRevision: DrawingRevision) => void;
  onSelectRevision?: (revisionId: string) => void;
  onShowToast?: (message: string, type?: 'success' | 'error' | 'info' | 'warning', title?: string) => void;
  onSelectBalloon?: (balloon: BalloonItem) => void;
  onAddBalloon?: (balloon: BalloonItem) => void;
  onAddCheckmark?: (checkmark: DrawingCheckmark) => void;
  onRemoveCheckmark?: (id: string) => void;
  onTriggerUploadOldDrawing?: () => void;
}

// Generate smooth SVG path from pen points
function pointsToSvgPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) {
    const p = points[0];
    return `M ${p.x} ${p.y} l 0.1 0.1`;
  }
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const midX = (prev.x + curr.x) / 2;
    const midY = (prev.y + curr.y) / 2;
    d += ` Q ${prev.x} ${prev.y}, ${midX} ${midY}`;
  }
  d += ` L ${points[points.length - 1].x} ${points[points.length - 1].y}`;
  return d;
}

// Generate organic hand-drawn loop
function makeHandDrawnLoop(cx: number, cy: number, rx: number, ry: number): string {
  const p1 = { x: cx - rx * 0.98, y: cy + ry * 0.05 };
  const p2 = { x: cx - rx * 0.7, y: cy - ry * 0.95 };
  const p3 = { x: cx + rx * 0.65, y: cy - ry * 1.02 };
  const p4 = { x: cx + rx * 1.02, y: cy - ry * 0.1 };
  const p5 = { x: cx + rx * 0.75, y: cy + ry * 0.98 };
  const p6 = { x: cx - rx * 0.6, y: cy + ry * 1.02 };
  const pEnd = { x: cx - rx * 1.05, y: cy - ry * 0.15 };

  return `M ${p1.x} ${p1.y} C ${p1.x} ${cy - ry * 0.7}, ${p2.x} ${p2.y}, ${cx} ${cy - ry} C ${p3.x} ${p3.y}, ${p4.x} ${cy - ry * 0.5}, ${p4.x} ${cy} C ${p4.x} ${cy + ry * 0.7}, ${p5.x} ${p5.y}, ${cx} ${cy + ry} C ${p6.x} ${p6.y}, ${cx - rx * 0.9} ${cy + ry * 0.8}, ${pEnd.x} ${pEnd.y}`;
}

export const RevisionDiffViewer: React.FC<RevisionDiffViewerProps> = ({
  project,
  activeRevisionId,
  onUpdateBalloon,
  onUpdateBalloonPosition,
  onCreateRevision,
  onSelectRevision,
  onShowToast,
  onSelectBalloon,
  onAddBalloon,
  onAddCheckmark,
  onRemoveCheckmark,
  onTriggerUploadOldDrawing,
}) => {
  // Select revisions for comparison
  const [revAId, setRevAId] = useState<string>(() => {
    if (project.comparisonDrawingUrl) return 'uploaded-old-dwg';
    return project.revisions[0]?.id || '';
  });

  const [revBId, setRevBId] = useState<string>(() => {
    if (project.revisions.length > 1) {
      return project.revisions[project.revisions.length - 1].id;
    }
    return project.revisions[0]?.id || '';
  });

  useEffect(() => {
    if (project.revisions.length > 1) {
      setRevAId(project.revisions[0].id);
      setRevBId(project.revisions[project.revisions.length - 1].id);
    } else if (project.comparisonDrawingUrl) {
      setRevAId('uploaded-old-dwg');
      setRevBId(project.revisions[0]?.id || '');
    } else if (project.revisions[0]) {
      setRevAId(project.revisions[0].id);
      setRevBId(project.revisions[0].id);
    }
  }, [project.id, project.revisions.length, project.comparisonDrawingUrl]);

  // Zoom & Pan state
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });

  // Horizontal Resizing State (User Request 4)
  const [splitRatio, setSplitRatio] = useState<number>(50); // Left percentage: 20 to 80
  const [isDraggingSplitter, setIsDraggingSplitter] = useState<boolean>(false);
  const splitContainerRef = useRef<HTMLDivElement>(null);

  // Independent multi-page sheet state (User Request 7)
  const [revASheetNumber, setRevASheetNumber] = useState<number>(1);
  const [revBSheetNumber, setRevBSheetNumber] = useState<number>(1);

  // Brief comment pop-up state (User Request 3: Brief information comment section (1, 2, 3) can pop up)
  const [activeCommentPopup, setActiveCommentPopup] = useState<BalloonItem | null>(null);

  // Active highlighted feature for spotlight comparison
  const [focusedFeatureId, setFocusedFeatureId] = useState<string | null>(null);

  // Natural Process Markup Tools on the NEW drawing (Rev B) ONLY
  const [revBToolMode, setRevBToolMode] = useState<'PAN' | 'CIRCLE' | 'HIGHLIGHT' | 'GREEN_TICK'>('PAN');

  // Long left click drag-and-drop state (User Request 2.2)
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const dragStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const isDraggingBalloonRef = useRef<boolean>(false);
  const draggedBalloonIdRef = useRef<string | null>(null);
  const justDroppedRef = useRef<boolean>(false);
  const [draggedBalloonId, setDraggedBalloonId] = useState<string | null>(null);

  useEffect(() => {
    const handleGlobalPointerUp = () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      if (isDraggingBalloonRef.current) {
        isDraggingBalloonRef.current = false;
        draggedBalloonIdRef.current = null;
        setDraggedBalloonId(null);
        dragStartPosRef.current = null;
      }
    };
    window.addEventListener('pointerup', handleGlobalPointerUp);
    return () => window.removeEventListener('pointerup', handleGlobalPointerUp);
  }, []);

  // Exact aspect-ratio canvas dimensions to prevent letterboxing coordinate drift
  const [canvasDimA, setCanvasDimA] = useState<{ width: number; height: number }>({ width: 900, height: 600 });
  const [canvasDimB, setCanvasDimB] = useState<{ width: number; height: number }>({ width: 900, height: 600 });

  // Floating hover specification tooltip
  const [hoveredDiffBalloon, setHoveredDiffBalloon] = useState<BalloonItem | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const revBContainerRef = useRef<HTMLDivElement>(null);
  const revBDrawingCanvasRef = useRef<HTMLDivElement>(null);
  const activeRevBPenPathRef = useRef<SVGPathElement>(null);
  const isDrawingPenRef = useRef(false);
  const revBPenPointsRef = useRef<{ x: number; y: number }[]>([]);
  const lastRevBPointerPosRef = useRef<{ clientX: number; clientY: number } | null>(null);
  const cachedRevBSvgImgRef = useRef<HTMLImageElement | null>(null);
  const svgRevBDimensionsRef = useRef<{ width: number; height: number }>({ width: 1200, height: 800 });
  const revBDrawingRectRef = useRef<DOMRect | null>(null);

  // Adobe PDF Highlight Direct DOM refs for Rev B
  const isHighlightingRef = useRef(false);
  const revBHighlightStartRef = useRef<{ x: number; y: number } | null>(null);
  const activeRevBHighlightDivRef = useRef<HTMLDivElement>(null);

  // Handle horizontal resizing drag
  const handleSplitterMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingSplitter(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: globalThis.MouseEvent) => {
      if (!isDraggingSplitter || !splitContainerRef.current) return;
      const rect = splitContainerRef.current.getBoundingClientRect();
      const newRatio = ((e.clientX - rect.left) / rect.width) * 100;
      setSplitRatio(Math.min(Math.max(Math.round(newRatio * 10) / 10, 18), 82));
    };

    const handleMouseUp = () => {
      setIsDraggingSplitter(false);
    };

    if (isDraggingSplitter) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingSplitter]);

  const handleExportPdf = async () => {
    try {
      setIsExportingPdf(true);
      const targetRev = revB || project.revisions[0];
      const filename = await exportDfmDrawingPdf(project, targetRev);
      onShowToast?.(`Exported "${filename}" with comments ready for PDF review!`, 'success', 'PDF Export Ready');
    } catch (err: any) {
      onShowToast?.(`PDF export failed: ${err.message || err}`, 'error', 'Export Error');
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Find Base Revision A (Old Drawing)
  let revA: DrawingRevision | undefined;
  if (revAId === 'uploaded-old-dwg' && project.comparisonDrawingUrl) {
    revA = {
      id: 'uploaded-old-dwg',
      title: project.comparisonDrawingTitle || 'Uploaded Baseline Drawing',
      revCode: 'Rev Baseline',
      description: 'Previous drawing uploaded for visual comparison',
      date: 'Baseline',
      author: 'Design Engineering',
      drawingUrl: project.comparisonDrawingUrl,
      drawingType: project.comparisonDrawingUrl.startsWith('<svg') ? 'svg' : 'image',
      drawingFileName: project.comparisonDrawingTitle || 'Baseline_Print.pdf',
      drawingPages: project.comparisonDrawingPages || project.revisions[0]?.drawingPages || [project.comparisonDrawingUrl],
      totalSheets: project.comparisonTotalSheets || project.revisions[0]?.totalSheets || (project.comparisonDrawingPages?.length || 1),
      balloons: project.revisions[0]?.balloons || [],
      iteration: 1,
    };
  } else {
    revA = project.revisions.find((r) => r.id === revAId) || project.revisions[0];
  }

  // Find Compare Revision B (New Drawing in Focus)
  const revB = project.revisions.find((r) => r.id === revBId) || (project.revisions.length > 1 ? project.revisions[1] : project.revisions[0]);

  // Independent multi-page sheet count for each revision
  const revATotalSheets = Math.max(
    revA?.drawingPages?.length || 1,
    revA?.totalSheets || 1,
    ...(revA?.balloons || []).map((b) => Number(b.sheetNumber) || 1)
  );
  const revBTotalSheets = Math.max(
    revB?.drawingPages?.length || 1,
    revB?.totalSheets || 1,
    ...(revB?.balloons || []).map((b) => Number(b.sheetNumber) || 1)
  );

  // Active page drawing URL for Rev A
  const revACurrentDrawingUrl = (revA?.drawingPages && revA.drawingPages.length >= revASheetNumber && revA.drawingPages[revASheetNumber - 1])
    ? revA.drawingPages[revASheetNumber - 1]
    : revA?.drawingUrl;

  // Active page drawing URL for Rev B
  const revBCurrentDrawingUrl = (revB?.drawingPages && revB.drawingPages.length >= revBSheetNumber && revB.drawingPages[revBSheetNumber - 1])
    ? revB.drawingPages[revBSheetNumber - 1]
    : revB?.drawingUrl;

  // Filter balloons by active sheet for Rev A and Rev B (User Request 3: multi-sheet isolation)
  const revABalloonsForSheet = (revA?.balloons || []).filter((b) => 
    (b.sheetNumber || 1) === revASheetNumber
  );

  const revBBalloonsForSheet = (revB?.balloons || []).filter((b) => 
    (b.sheetNumber || 1) === revBSheetNumber
  );

  const handleZoom = (delta: number) => {
    revBDrawingRectRef.current = null;
    setScale((prev) => Math.min(Math.max(prev + delta, 0.4), 3.5));
  };

  const handleResetZoom = () => {
    revBDrawingRectRef.current = null;
    setScale(1);
    setPan({ x: 0, y: 0 });
  };

  // Crop marked area from Rev B (Supports both raster images and SVGs with exact aspect-ratio fit)
  const cropMarkedArea = (
    minX: number,
    minY: number,
    width: number,
    height: number
  ): string => {
    try {
      const offCanvas = document.createElement('canvas');
      const imgEl = revBDrawingCanvasRef.current?.querySelector('img') as HTMLImageElement | null;
      const cw = 900;
      const ch = 600;

      if (imgEl && imgEl.naturalWidth > 0 && imgEl.complete) {
        const natW = imgEl.naturalWidth;
        const natH = imgEl.naturalHeight;
        const scaleFit = Math.min(cw / natW, ch / natH);
        const renderW = natW * scaleFit;
        const renderH = natH * scaleFit;
        const offsetX = (cw - renderW) / 2;
        const offsetY = (ch - renderH) / 2;

        const boxPxLeft = (minX / 100) * cw;
        const boxPxTop = (minY / 100) * ch;
        const boxPxWidth = (width / 100) * cw;
        const boxPxHeight = (height / 100) * ch;

        const padX = boxPxWidth * 0.16;
        const padY = boxPxHeight * 0.16;
        const paddedLeft = Math.max(0, boxPxLeft - padX);
        const paddedTop = Math.max(0, boxPxTop - padY);
        const paddedWidth = Math.min(cw - paddedLeft, boxPxWidth + padX * 2);
        const paddedHeight = Math.min(ch - paddedTop, boxPxHeight + padY * 2);

        const relX = paddedLeft - offsetX;
        const relY = paddedTop - offsetY;
        const srcX = Math.max(0, Math.min(natW - 1, relX / scaleFit));
        const srcY = Math.max(0, Math.min(natH - 1, relY / scaleFit));
        const srcW = Math.max(1, Math.min(natW - srcX, paddedWidth / scaleFit));
        const srcH = Math.max(1, Math.min(natH - srcY, paddedHeight / scaleFit));

        offCanvas.width = Math.max(Math.floor(srcW), 80);
        offCanvas.height = Math.max(Math.floor(srcH), 50);
        const ctx = offCanvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, offCanvas.width, offCanvas.height);
          ctx.drawImage(imgEl, srcX, srcY, srcW, srcH, 0, 0, offCanvas.width, offCanvas.height);
          return offCanvas.toDataURL('image/png');
        }
      } else if (revBCurrentDrawingUrl) {
        const svgImg = cachedRevBSvgImgRef.current;
        const { width: natW, height: natH } = svgRevBDimensionsRef.current;

        const scaleFit = Math.min(cw / natW, ch / natH);
        const renderW = natW * scaleFit;
        const renderH = natH * scaleFit;
        const offsetX = (cw - renderW) / 2;
        const offsetY = (ch - renderH) / 2;

        const boxPxLeft = (minX / 100) * cw;
        const boxPxTop = (minY / 100) * ch;
        const boxPxWidth = (width / 100) * cw;
        const boxPxHeight = (height / 100) * ch;

        const padX = boxPxWidth * 0.16;
        const padY = boxPxHeight * 0.16;
        const paddedLeft = Math.max(0, boxPxLeft - padX);
        const paddedTop = Math.max(0, boxPxTop - padY);
        const paddedWidth = Math.min(cw - paddedLeft, boxPxWidth + padX * 2);
        const paddedHeight = Math.min(ch - paddedTop, boxPxHeight + padY * 2);

        const relX = paddedLeft - offsetX;
        const relY = paddedTop - offsetY;
        const srcX = Math.max(0, Math.min(natW - 1, relX / scaleFit));
        const srcY = Math.max(0, Math.min(natH - 1, relY / scaleFit));
        const srcW = Math.max(1, Math.min(natW - srcX, paddedWidth / scaleFit));
        const srcH = Math.max(1, Math.min(natH - srcY, paddedHeight / scaleFit));

        offCanvas.width = Math.max(Math.floor(srcW * 1.4), 120);
        offCanvas.height = Math.max(Math.floor(srcH * 1.4), 80);
        const ctx = offCanvas.getContext('2d');
        if (ctx && svgImg && svgImg.complete && svgImg.naturalWidth > 0) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, offCanvas.width, offCanvas.height);
          ctx.drawImage(svgImg, srcX, srcY, srcW, srcH, 0, 0, offCanvas.width, offCanvas.height);
          return offCanvas.toDataURL('image/png');
        }
      }
    } catch (e) {
      console.warn('Preview crop generation skipped', e);
    }
    return '';
  };

  // Finalize markup on Rev B and IMMEDIATELY open comment window
  const handleFinalizeRevBMarkup = (
    type: 'CIRCLE' | 'HIGHLIGHT',
    minX: number,
    minY: number,
    width: number,
    height: number,
    pathD?: string
  ) => {
    const cropBase64 = cropMarkedArea(minX, minY, width, height);
    const centerX = Math.round((minX + width / 2) * 10) / 10;
    const centerY = Math.round((minY + height / 2) * 10) / 10;

    const existingBalloons = revB?.balloons || [];
    const nextNum = (existingBalloons.length > 0 
      ? Math.max(...existingBalloons.map((b) => b.balloonNumber)) 
      : 0) + 1;

    const balloonX = Math.min(Math.round(minX + width + 3), 96);
    const balloonY = Math.min(Math.max(Math.round(minY + height / 2), 4), 96);

    const newBalloon: BalloonItem = {
      id: `dfm-revB-${Date.now()}-${nextNum}`,
      balloonNumber: nextNum,
      customLabel: `#${nextNum}`,
      x: balloonX,
      y: balloonY,
      leaderTargetX: centerX,
      leaderTargetY: centerY,
      viewName: `Zone [${Math.round(minX)}%, ${Math.round(minY)}%]`,
      featureName: '', // empty by default
      dimensionType: 'LINEAR',
      dimensionNature: 'STANDARD',
      nominalValue: '', // empty by default
      upperTol: '', // empty by default
      lowerTol: '', // empty by default
      unit: 'mm',
      criticalCharacteristic: false,
      isRelevant: true,
      isVisible: true,
      status: 'UNCHANGED',
      sheetNumber: revBSheetNumber,
      markupType: type,
      markupCoordinates: {
        minX,
        minY,
        width,
        height,
        pathD,
      },
      drawingSnipUrl: cropBase64 || undefined,
      issueDescription: '',
      proposedChange: '',
      feedbackList: [],
      originRevisionId: revB?.id || activeRevisionId,
      originRevisionName: revB?.revCode || 'New Rev',
      revisionHistory: [],
    };

    if (onAddBalloon) {
      onAddBalloon(newBalloon);
    }
    // Open clean brief comment popup for immediate feedback entry without disrupting viewport
    setActiveCommentPopup(newBalloon);

    if (onShowToast) {
      onShowToast(`Marked Feature #${nextNum} on ${revB?.revCode}. Comment section open!`, 'info', 'New Markup on Revised Print');
    }
  };

  // Sub-pixel coordinates relative to Rev B Drawing Canvas with cached rect support (0ms latency)
  const getRevBCoordinates = (e: React.PointerEvent<HTMLDivElement> | PointerEvent | MouseEvent) => {
    const rect = revBDrawingRectRef.current || revBDrawingCanvasRef.current?.getBoundingClientRect();
    if (!rect || rect.width <= 0 || rect.height <= 0) return null;
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const isInside = clickX >= -4 && clickX <= rect.width + 4 && clickY >= -4 && clickY <= rect.height + 4;
    const pctX = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
    const pctY = Math.max(0, Math.min(100, (clickY / rect.height) * 100));
    return { pctX, pctY, clientX: e.clientX, clientY: e.clientY, isInside };
  };

  // Rev B Drawing Viewport Pointer Handlers (Direct DOM path, 120 FPS zero-lag)
  const handleRevBPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (revBToolMode === 'PAN' || e.button === 1 || e.altKey) {
      setIsPanning(true);
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      return;
    }

    if (e.button !== 0) return;
    if (!revBDrawingCanvasRef.current) return;

    // Cache bounding rect once on pointer down so subsequent pointer moves have 0ms layout delay!
    revBDrawingRectRef.current = revBDrawingCanvasRef.current.getBoundingClientRect();
    const coords = getRevBCoordinates(e);
    if (!coords || !coords.isInside) return;
    const { pctX, pctY, clientX, clientY } = coords;

    // If user clicks on or near an existing balloon badge or markup region, reliably select and open its comments
    const hitBalloon = revBBalloonsForSheet.find((b) => {
      const distBadge = Math.hypot(pctX - b.x, pctY - b.y);
      if (distBadge <= 3.8) return true;
      if (b.markupCoordinates) {
        const mc = b.markupCoordinates;
        if (
          pctX >= mc.minX - 0.5 &&
          pctX <= mc.minX + mc.width + 0.5 &&
          pctY >= mc.minY - 0.5 &&
          pctY <= mc.minY + mc.height + 0.5
        ) {
          return true;
        }
      }
      return false;
    });

    if (hitBalloon) {
      setActiveCommentPopup(hitBalloon);
      if (onSelectBalloon) onSelectBalloon(hitBalloon);
      return;
    }

    // Green Pen Checkmark pointer tool
    if (revBToolMode === 'GREEN_TICK') {
      if (onAddCheckmark) {
        const newCheck: DrawingCheckmark = {
          id: `chk-revB-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          x: Math.round(pctX * 10) / 10,
          y: Math.round(pctY * 10) / 10,
          sheetNumber: revBSheetNumber,
          timestamp: new Date().toLocaleTimeString(),
        };
        onAddCheckmark(newCheck);
      }
      revBDrawingRectRef.current = null;
      return;
    }

    if (revBToolMode === 'CIRCLE') {
      isDrawingPenRef.current = true;
      revBPenPointsRef.current = [{ x: pctX, y: pctY }];
      lastRevBPointerPosRef.current = { clientX, clientY };
      if (activeRevBPenPathRef.current) {
        activeRevBPenPathRef.current.setAttribute('d', `M ${pctX} ${pctY}`);
      }
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      return;
    }

    if (revBToolMode === 'HIGHLIGHT') {
      isHighlightingRef.current = true;
      revBHighlightStartRef.current = { x: pctX, y: pctY };
      if (activeRevBHighlightDivRef.current) {
        activeRevBHighlightDivRef.current.style.display = 'block';
        activeRevBHighlightDivRef.current.style.left = `${pctX}%`;
        activeRevBHighlightDivRef.current.style.top = `${pctY}%`;
        activeRevBHighlightDivRef.current.style.width = '0%';
        activeRevBHighlightDivRef.current.style.height = '0%';
      }
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }
  };

  const handleRevBPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isPanning) {
      setPan({
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y,
      });
      return;
    }

    // Natural Pen Circle drawing - ZERO-LAG DIRECT DOM UPDATE AT 120 FPS
    if (isDrawingPenRef.current) {
      const coords = getRevBCoordinates(e);
      if (!coords) return;
      const { pctX, pctY, clientX, clientY } = coords;
      const lastPos = lastRevBPointerPosRef.current;
      const screenDist = lastPos ? Math.hypot(clientX - lastPos.clientX, clientY - lastPos.clientY) : 999;
      if (screenDist >= 2.0) {
        revBPenPointsRef.current.push({ x: pctX, y: pctY });
        lastRevBPointerPosRef.current = { clientX, clientY };
        if (activeRevBPenPathRef.current) {
          activeRevBPenPathRef.current.setAttribute('d', pointsToSvgPath(revBPenPointsRef.current));
        }
      }
      return;
    }

    // Adobe PDF Highlighter dragging - Direct DOM update
    if (isHighlightingRef.current && revBHighlightStartRef.current) {
      const coords = getRevBCoordinates(e);
      if (!coords) return;
      const { pctX, pctY } = coords;
      const startX = revBHighlightStartRef.current.x;
      const startY = revBHighlightStartRef.current.y;
      const left = Math.min(startX, pctX);
      const top = Math.min(startY, pctY);
      const width = Math.abs(pctX - startX);
      const height = Math.abs(pctY - startY);
      if (activeRevBHighlightDivRef.current) {
        activeRevBHighlightDivRef.current.style.left = `${left}%`;
        activeRevBHighlightDivRef.current.style.top = `${top}%`;
        activeRevBHighlightDivRef.current.style.width = `${width}%`;
        activeRevBHighlightDivRef.current.style.height = `${height}%`;
      }
      return;
    }
  };

  const handleRevBPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}

    setIsPanning(false);

    if (isDrawingPenRef.current) {
      isDrawingPenRef.current = false;
      const points = [...revBPenPointsRef.current];
      const coords = getRevBCoordinates(e);
      if (coords && points.length > 0) {
        const last = points[points.length - 1];
        if (Math.hypot(coords.pctX - last.x, coords.pctY - last.y) > 0.05) {
          points.push({ x: coords.pctX, y: coords.pctY });
        }
      }

      if (activeRevBPenPathRef.current) {
        activeRevBPenPathRef.current.setAttribute('d', '');
      }

      if (points.length > 0) {
        const xs = points.map((p) => p.x);
        const ys = points.map((p) => p.y);
        let minX = Math.min(...xs);
        let maxX = Math.max(...xs);
        let minY = Math.min(...ys);
        let maxY = Math.max(...ys);
        let width = maxX - minX;
        let height = maxY - minY;

        let finalPath = '';
        if (width < 1.5 && height < 1.5) {
          const cx = (minX + maxX) / 2;
          const cy = (minY + maxY) / 2;
          minX = Math.max(cx - 3.5, 0.5);
          minY = Math.max(cy - 3.5, 0.5);
          width = 7.0;
          height = 7.0;
          finalPath = makeHandDrawnLoop(cx, cy, 3.5, 3.5);
        } else {
          const closed = [...points, points[0]];
          finalPath = pointsToSvgPath(closed);
        }

        handleFinalizeRevBMarkup('CIRCLE', minX, minY, width, height, finalPath);
      }
      revBPenPointsRef.current = [];
      lastRevBPointerPosRef.current = null;
      revBDrawingRectRef.current = null;
      // User Request 2: Continue staying with Pen Circle tool!
      return;
    }

    if (isHighlightingRef.current && revBHighlightStartRef.current) {
      isHighlightingRef.current = false;
      const coords = getRevBCoordinates(e);
      const currentX = coords ? coords.pctX : revBHighlightStartRef.current.x;
      const currentY = coords ? coords.pctY : revBHighlightStartRef.current.y;
      const startX = revBHighlightStartRef.current.x;
      const startY = revBHighlightStartRef.current.y;
      const minX = Math.min(startX, currentX);
      const maxX = Math.max(startX, currentX);
      const minY = Math.min(startY, currentY);
      const maxY = Math.max(startY, currentY);
      const width = maxX - minX;
      const height = maxY - minY;

      if (activeRevBHighlightDivRef.current) {
        activeRevBHighlightDivRef.current.style.display = 'none';
        activeRevBHighlightDivRef.current.style.width = '0%';
        activeRevBHighlightDivRef.current.style.height = '0%';
      }

      if (width > 0.6 && height > 0.6) {
        handleFinalizeRevBMarkup('HIGHLIGHT', minX, minY, width, height);
      }
      revBHighlightStartRef.current = null;
      revBDrawingRectRef.current = null;
      // User Request 2: Continue staying with Highlight tool!
      return;
    }

    revBDrawingRectRef.current = null;
  };

  // Focus both viewports on feature coordinates
  const handleFocusFeature = (b: BalloonItem) => {
    setFocusedFeatureId(b.id);
    const targetX = b.x ?? 50;
    const targetY = b.y ?? 50;
    const offsetX = (50 - targetX) * 8;
    const offsetY = (50 - targetY) * 6;
    setPan({ x: offsetX, y: offsetY });
    setScale(1.4);
  };

  // Color helpers (Elevated high contrast theme)
  const getStatusColors = (status: DFMStatus) => {
    switch (status) {
      case 'ADDRESSED':
        return {
          stroke: '#059669', // Emerald
          fillCircle: 'transparent', // User Request 4: Transparent fill so background CAD info is never blocked!
          fillHighlight: 'rgba(5, 150, 105, 0.28)',
          badgeBg: 'bg-emerald-600',
          badgeText: 'text-white font-bold',
          symbol: 'CHECK',
        };
      case 'ATTENTION':
        return {
          stroke: '#dc2626', // Crimson
          fillCircle: 'transparent', // Transparent fill so background CAD info is never blocked!
          fillHighlight: 'rgba(220, 38, 38, 0.28)',
          badgeBg: 'bg-rose-600',
          badgeText: 'text-white font-bold',
          symbol: 'CAUTION',
        };
      case 'UNCHANGED':
      default:
        return {
          stroke: '#d97706', // High-contrast rich amber (4.5+:1 against white paper!)
          fillCircle: 'transparent', // Transparent fill so background CAD info is never blocked!
          fillHighlight: 'rgba(217, 119, 6, 0.28)',
          badgeBg: 'bg-amber-400',
          badgeText: 'text-slate-950 font-black',
          symbol: 'NONE',
        };
    }
  };

  const handleExportExcel = () => {
    const activeRev = revB || project.revisions[project.revisions.length - 1];
    const fn = exportDfmTrackerExcel(project, activeRev);
    if (onShowToast) {
      onShowToast(`Exported multi-tab Excel tracker with continuous audit trail: ${fn}`, 'success', 'Excel Export Ready');
    }
  };

  const renderDrawingContent = (
    url?: string, 
    type?: 'svg' | 'image', 
    title?: string,
    onImageLoad?: (e: React.SyntheticEvent<HTMLImageElement>) => void
  ) => {
    if (!url) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center p-8 text-neutral-400 text-xs">
          <Layers className="w-10 h-10 text-neutral-300 mb-2" />
          <span>No drawing print loaded</span>
        </div>
      );
    }

    if (type === 'image' || !url.startsWith('<svg')) {
      return (
        <img
          key={`dwg-page-${url.slice(0, 80)}`}
          src={url}
          alt={title || 'Drawing Print'}
          onLoad={onImageLoad}
          className="w-full h-full object-fill pointer-events-none"
        />
      );
    }

    return (
      <div
        className="w-full h-full bg-white overflow-hidden pointer-events-none"
        dangerouslySetInnerHTML={{ __html: url }}
      />
    );
  };

  // Distinct list of all features for comment chips (User Request 3: comment section (1, 2, 3))
  const allFeaturesMap = new Map<number, BalloonItem>();
  for (const b of (revB?.balloons || [])) {
    allFeaturesMap.set(b.balloonNumber, b);
  }
  for (const b of (revA?.balloons || [])) {
    if (!allFeaturesMap.has(b.balloonNumber)) {
      allFeaturesMap.set(b.balloonNumber, b);
    }
  }
  const allFeatures = Array.from(allFeaturesMap.values()).sort((a, b) => a.balloonNumber - b.balloonNumber);

  const addressedCount = allFeatures.filter((b) => b.status === 'ADDRESSED').length;
  const attentionCount = allFeatures.filter((b) => b.status === 'ATTENTION').length;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f4f5f7] text-neutral-900 overflow-hidden select-none">
      
      {/* DUAL VIEWPORT HORIZONTAL RESIZABLE CANVAS AREA (Full Height & Width) */}
      <div 
        ref={splitContainerRef}
        className="flex-1 overflow-hidden p-2 flex flex-row relative select-none"
      >
        {/* LEFT DRAWING: PREVIOUS PRINT (REV A) */}
        <div 
          style={{ width: `${splitRatio}%` }}
          className="flex flex-col bg-white rounded-xl border-2 border-rose-300 overflow-hidden shadow-md relative transition-all duration-75"
        >
          {/* Header with Independent Multi-Sheet Navigation (User Request 7) */}
          <div className="px-3 py-2 bg-rose-50 border-b border-rose-200 flex items-center justify-between text-xs flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span className="font-extrabold text-rose-900">
                Old Drawing: {revA?.revCode}
              </span>
              <span className="text-neutral-500 text-[11px] truncate max-w-[120px]">
                ({revA?.drawingFileName || 'Base Print'})
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Sheet 1 of X independent selector for Old Drawing */}
              {revATotalSheets > 1 && (
                <div className="flex items-center gap-1 bg-white border border-rose-300 rounded-md px-1.5 py-0.5 text-xs font-bold text-rose-900 shadow-xs">
                  <button
                    disabled={revASheetNumber <= 1}
                    onClick={() => setRevASheetNumber((s) => Math.max(1, s - 1))}
                    className="p-0.5 hover:bg-rose-100 rounded disabled:opacity-30 cursor-pointer"
                    title="Previous Sheet on Old Drawing"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-mono text-[11px] px-1">
                    Sheet {revASheetNumber} of {revATotalSheets}
                  </span>
                  <button
                    disabled={revASheetNumber >= revATotalSheets}
                    onClick={() => setRevASheetNumber((s) => Math.min(revATotalSheets, s + 1))}
                    className="p-0.5 hover:bg-rose-100 rounded disabled:opacity-30 cursor-pointer"
                    title="Next Sheet on Old Drawing"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => onTriggerUploadOldDrawing?.()}
                className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-white hover:bg-rose-100 text-rose-800 border border-rose-300 transition-colors shadow-xs cursor-pointer"
                title="Upload or change the baseline drawing to compare"
              >
                <FileUp className="w-3 h-3 text-rose-600" />
                <span className="hidden sm:inline">Upload Prior Print</span>
              </button>
            </div>
          </div>

          {/* Viewport Canvas for Old Drawing */}
          <div 
            className="flex-1 overflow-hidden p-2 flex items-center justify-center bg-neutral-100 relative cursor-grab"
            onMouseDown={(e) => {
              if (e.button === 0) {
                setIsPanning(true);
                setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
              }
            }}
            onMouseMove={(e) => {
              if (isPanning) {
                setPan({ x: e.clientX - startPan.x, y: e.clientY - startPan.y });
              }
            }}
            onMouseUp={() => setIsPanning(false)}
          >
            <div
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
                transformOrigin: 'center center',
                transition: isPanning ? 'none' : 'transform 0.05s ease-out',
                width: `${canvasDimA.width}px`,
                height: `${canvasDimA.height}px`,
              }}
              className="relative bg-white shadow-lg border border-neutral-300 rounded-sm select-none overflow-hidden"
            >
              {renderDrawingContent(revACurrentDrawingUrl, revA?.drawingType, revA?.title, (e) => {
                const img = e.currentTarget;
                if (img.naturalWidth > 0 && img.naturalHeight > 0) {
                  const ratio = img.naturalWidth / img.naturalHeight;
                  setCanvasDimA({ width: 900, height: Math.round(900 / ratio) });
                }
              })}

              {/* Overlaid Pen Circles & Markups on Old Drawing (Rev A) */}
              <svg 
                className="absolute inset-0 w-full h-full pointer-events-none z-10"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                {revABalloonsForSheet.map((b) => {
                  if (b.markupType !== 'CIRCLE' || !b.markupCoordinates) return null;
                  const isFocused = b.id === focusedFeatureId || activeCommentPopup?.id === b.id;
                  const pathD = b.markupCoordinates.pathD || makeHandDrawnLoop(
                    b.markupCoordinates.minX + b.markupCoordinates.width / 2,
                    b.markupCoordinates.minY + b.markupCoordinates.height / 2,
                    b.markupCoordinates.width / 2,
                    b.markupCoordinates.height / 2
                  );
                  return (
                    <path
                      key={`revA-circle-${b.id}`}
                      d={pathD}
                      fill={isFocused ? 'rgba(225, 29, 72, 0.08)' : 'transparent'}
                      stroke="#e11d48"
                      strokeWidth={isFocused ? '0.7' : '0.4'}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="cursor-pointer pointer-events-auto"
                      onMouseEnter={() => setHoveredDiffBalloon(b)}
                      onMouseLeave={() => setHoveredDiffBalloon(null)}
                      onClick={() => {
                        handleFocusFeature(b);
                        setActiveCommentPopup(b);
                      }}
                    />
                  );
                })}
              </svg>

              {/* Highlighters on Old Drawing (Rev A) */}
              {revABalloonsForSheet.map((b) => {
                if (b.markupType !== 'HIGHLIGHT' || !b.markupCoordinates) return null;
                const isFocused = b.id === focusedFeatureId || activeCommentPopup?.id === b.id;
                return (
                  <div
                    key={`revA-hl-${b.id}`}
                    style={{
                      left: `${b.markupCoordinates.minX}%`,
                      top: `${b.markupCoordinates.minY}%`,
                      width: `${b.markupCoordinates.width}%`,
                      height: `${b.markupCoordinates.height}%`,
                      backgroundColor: 'rgba(225, 29, 72, 0.28)',
                      mixBlendMode: 'multiply',
                    }}
                    onMouseEnter={() => setHoveredDiffBalloon(b)}
                    onMouseLeave={() => setHoveredDiffBalloon(null)}
                    onClick={() => {
                      handleFocusFeature(b);
                      setActiveCommentPopup(b);
                    }}
                    className={`absolute z-15 cursor-pointer rounded-xs transition-all border-y border-rose-500 ${isFocused ? 'ring-2 ring-black shadow-md' : 'hover:opacity-90'}`}
                    title={`Baseline Feature #${b.balloonNumber}: Click to inspect`}
                  />
                );
              })}

              {/* Balloon Tags on Old Drawing */}
              {revABalloonsForSheet.map((b) => {
                const isFocused = b.id === focusedFeatureId || activeCommentPopup?.id === b.id;
                return (
                  <div
                    key={`revA-b-${b.id}`}
                    style={{ left: `${b.x}%`, top: `${b.y}%` }}
                    onClick={() => {
                      handleFocusFeature(b);
                      setActiveCommentPopup(b);
                    }}
                    onMouseEnter={() => setHoveredDiffBalloon(b)}
                    onMouseLeave={() => setHoveredDiffBalloon(null)}
                    className="absolute -translate-x-1/2 -translate-y-1/2 z-25 cursor-pointer"
                  >
                    {/* Floating Specification Tooltip right directly above the balloon on hover */}
                    {hoveredDiffBalloon?.id === b.id && (() => {
                      const latestFeedback = b.feedbackList && b.feedbackList.length > 0
                        ? b.feedbackList[b.feedbackList.length - 1]
                        : null;
                      const author = latestFeedback?.role === 'AO' ? 'AO / Mfg' : latestFeedback?.role || 'AO / Mfg';
                      const comment = b.issueDescription || latestFeedback?.comment || (b.featureName ? `Review finding: ${b.featureName}` : `Characteristic #${b.balloonNumber}`);
                      const status = b.status === 'ADDRESSED' ? 'ADDRESSED' : b.status === 'ATTENTION' ? 'ATTENTION' : 'UNCHANGED';

                      return (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none whitespace-normal min-w-[220px] max-w-[340px] bg-slate-950/95 backdrop-blur-md text-white p-3 rounded-xl border border-slate-700 shadow-2xl animate-in fade-in zoom-in-95 duration-100">
                          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-[6px] border-transparent border-t-slate-950" />
                          <div className="flex items-center justify-between gap-1.5 border-b border-slate-800 pb-1 mb-1.5">
                            <span className="font-black text-[11px] text-amber-400">Old Drawing &bull; Feature #{b.balloonNumber}</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                              b.status === 'ADDRESSED' ? 'bg-emerald-600 text-white' : b.status === 'ATTENTION' ? 'bg-rose-600 text-white' : 'bg-amber-400 text-slate-950'
                            }`}>
                              ({status})
                            </span>
                          </div>
                          <div className="text-xs font-semibold text-slate-100 leading-snug">
                            {comment}
                          </div>
                          <div className="text-[11px] font-bold text-slate-400 mt-2 pt-1 border-t border-slate-800 flex items-center justify-between gap-2">
                            <span className="text-amber-400 font-bold">[{author}]</span>
                            {latestFeedback?.proposedChange && (
                              <span className="text-slate-300 font-medium text-[10px] truncate">
                                {latestFeedback.proposedChange}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    <div className={`w-6 h-6 rounded-full font-bold text-[10px] flex items-center justify-center shadow-md border-2 border-white ${
                      isFocused ? 'bg-rose-700 ring-4 ring-rose-400 scale-125' : 'bg-rose-600 text-white'
                    }`}>
                      {b.balloonNumber}
                    </div>
                  </div>
                );
              })}

              {/* Overlay Prompt on Rev A if old drawing is not yet provided */}
              {revA?.drawingUrl === revB?.drawingUrl && !project.comparisonDrawingUrl && (
                <div className="absolute inset-0 bg-neutral-900/60 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center z-30 pointer-events-auto">
                  <div className="bg-white p-5 rounded-2xl shadow-2xl border-2 border-rose-400 max-w-sm flex flex-col items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                      <Split className="w-5 h-5 text-rose-600" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-black text-sm">Upload Prior Print</h3>
                      <p className="text-[11px] text-neutral-500 mt-1">
                        Upload previous/baseline drawing to compare changes side-by-side.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onTriggerUploadOldDrawing?.()}
                      className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-amber-300 rounded-xl font-bold text-xs shadow-md border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-amber-400" />
                      <span>Upload Prior Drawing (PDF / Image)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* DRAGGABLE HORIZONTAL SPLITTER BAR (User Request 4) */}
        <div
          onMouseDown={handleSplitterMouseDown}
          className="w-4 shrink-0 relative flex items-center justify-center cursor-col-resize select-none group z-30 -mx-1"
          title="Drag horizontally to resize Old Drawing and New Drawing panels"
        >
          <div className={`w-1.5 h-20 rounded-full transition-all flex items-center justify-center ${
            isDraggingSplitter ? 'bg-amber-500 scale-x-125' : 'bg-slate-300 group-hover:bg-amber-400'
          }`}>
            <div className="w-0.5 h-6 bg-slate-600 rounded-full" />
          </div>
        </div>

        {/* RIGHT DRAWING: NEW PRINT (REV B) - IN FOCUS FOR REVIEW & COMMENT */}
        <div 
          style={{ width: `${100 - splitRatio}%` }}
          className="flex flex-col bg-white rounded-xl border-2 border-emerald-500 overflow-hidden shadow-xl relative transition-all duration-75" 
          ref={revBContainerRef}
        >
          {/* Header with Independent Multi-Sheet Navigation (User Request 7) & Markup Tools */}
          <div className="px-3 py-2 bg-emerald-50 border-b border-emerald-300 flex items-center justify-between text-xs flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-extrabold text-emerald-950">
                New Drawing: {revB?.revCode}
              </span>
              <span className="text-neutral-500 text-[11px] truncate max-w-[120px]">
                ({revB?.drawingFileName || 'Updated CAD Print'})
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Sheet 1 of X independent selector for New Drawing */}
              {revBTotalSheets > 1 && (
                <div className="flex items-center gap-1 bg-white border border-emerald-300 rounded-md px-1.5 py-0.5 text-xs font-bold text-emerald-900 shadow-xs">
                  <button
                    disabled={revBSheetNumber <= 1}
                    onClick={() => setRevBSheetNumber((s) => Math.max(1, s - 1))}
                    className="p-0.5 hover:bg-emerald-100 rounded disabled:opacity-30 cursor-pointer"
                    title="Previous Sheet on New Drawing"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-mono text-[11px] px-1">
                    Sheet {revBSheetNumber} of {revBTotalSheets}
                  </span>
                  <button
                    disabled={revBSheetNumber >= revBTotalSheets}
                    onClick={() => setRevBSheetNumber((s) => Math.min(revBTotalSheets, s + 1))}
                    className="p-0.5 hover:bg-emerald-100 rounded disabled:opacity-30 cursor-pointer"
                    title="Next Sheet on New Drawing"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Natural Process Markup Toolbar on Rev B */}
              <div className="flex items-center gap-1 bg-slate-900 text-slate-100 p-1 rounded-lg border border-slate-700 shadow-sm text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setRevBToolMode('CIRCLE');
                  }}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer transition-all ${
                    revBToolMode === 'CIRCLE'
                      ? 'bg-rose-600 text-white shadow-sm ring-1 ring-white'
                      : 'text-slate-200 hover:text-white hover:bg-slate-800'
                  }`}
                  title="Circle with Pen: Draw a circle around any feature on the new drawing to open comments"
                >
                  <PenTool className="w-3 h-3 text-rose-300" />
                  <span>Pen Circle</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRevBToolMode('HIGHLIGHT');
                  }}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer transition-all ${
                    revBToolMode === 'HIGHLIGHT'
                      ? 'bg-amber-400 text-slate-950 shadow-sm ring-1 ring-amber-300'
                      : 'text-slate-200 hover:text-white hover:bg-slate-800'
                  }`}
                  title="Highlight: Highlight features on new drawing"
                >
                  <Highlighter className="w-3 h-3 text-amber-400" />
                  <span>Highlight</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRevBToolMode('GREEN_TICK')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer transition-all ${
                    revBToolMode === 'GREEN_TICK'
                      ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-300'
                      : 'text-slate-200 hover:text-white hover:bg-slate-800'
                  }`}
                  title="Green Pen Check: Drop a green checkmark (✓) to verify feature. Click to erase."
                >
                  <Check className="w-3 h-3 text-emerald-300 stroke-[3.5]" />
                  <span>Green Pen (✓)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRevBToolMode('PAN')}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium cursor-pointer transition-all ${
                    revBToolMode === 'PAN'
                      ? 'bg-slate-700 text-white font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                  title="Pan & Inspect"
                >
                  <Hand className="w-3 h-3" />
                  <span>Pan</span>
                </button>
              </div>

              {/* Horizontal Width Split Presets */}
              <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-lg border border-emerald-300 text-[11px] font-bold text-slate-700 shadow-xs">
                <span className="text-[10px] text-slate-400 uppercase font-mono">Width:</span>
                <button
                  onClick={() => setSplitRatio(35)}
                  className={`px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                    Math.abs(splitRatio - 35) < 3 ? 'bg-slate-900 text-amber-300 font-bold' : 'hover:bg-slate-100 text-slate-700'
                  }`}
                  title="Give more width to New Drawing (35% Old / 65% New)"
                >
                  35/65
                </button>
                <button
                  onClick={() => setSplitRatio(50)}
                  className={`px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                    Math.abs(splitRatio - 50) < 3 ? 'bg-slate-900 text-amber-300 font-bold' : 'hover:bg-slate-100 text-slate-700'
                  }`}
                  title="Even Split (50% Old / 50% New)"
                >
                  50/50
                </button>
                <button
                  onClick={() => setSplitRatio(65)}
                  className={`px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                    Math.abs(splitRatio - 65) < 3 ? 'bg-slate-900 text-amber-300 font-bold' : 'hover:bg-slate-100 text-slate-700'
                  }`}
                  title="Give more width to Old Drawing (65% Old / 35% New)"
                >
                  65/35
                </button>
              </div>

              {/* Zoom Controls */}
              <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-emerald-300 text-xs shadow-xs">
                <button
                  onClick={() => handleZoom(-0.2)}
                  className="p-1 text-neutral-600 hover:text-black cursor-pointer"
                  title="Zoom out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] text-neutral-800 font-mono font-bold px-1 min-w-[32px] text-center">
                  {Math.round(scale * 100)}%
                </span>
                <button
                  onClick={() => handleZoom(0.2)}
                  className="p-1 text-neutral-600 hover:text-black cursor-pointer"
                  title="Zoom in"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleResetZoom}
                  className="p-1 text-neutral-600 hover:text-black cursor-pointer"
                  title="Reset Zoom"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Viewport Canvas for Rev B */}
          <div 
            className={`flex-1 overflow-hidden p-2 flex items-center justify-center bg-slate-100 relative touch-none ${
              revBToolMode === 'CIRCLE' || revBToolMode === 'HIGHLIGHT' ? 'cursor-crosshair' : isPanning ? 'cursor-grabbing' : 'cursor-grab'
            }`}
            onPointerDown={handleRevBPointerDown}
            onPointerMove={handleRevBPointerMove}
            onPointerUp={handleRevBPointerUp}
          >
            <div
              ref={revBDrawingCanvasRef}
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
                transformOrigin: 'center center',
                transition: 'none',
                width: `${canvasDimB.width}px`,
                height: `${canvasDimB.height}px`,
              }}
              className="relative bg-white shadow-xl border border-slate-300 rounded-sm select-none overflow-hidden"
            >
              {renderDrawingContent(revBCurrentDrawingUrl, revB?.drawingType, revB?.title, (e) => {
                const img = e.currentTarget;
                if (img.naturalWidth > 0 && img.naturalHeight > 0) {
                  const ratio = img.naturalWidth / img.naturalHeight;
                  setCanvasDimB({ width: 900, height: Math.round(900 / ratio) });
                }
              })}

              {/* 1. Real-time Pen Circle on Rev B (Direct DOM path with 0ms lag, crisp non-scaling stroke) */}
              <svg 
                className="absolute inset-0 w-full h-full pointer-events-none z-30"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                <path
                  ref={activeRevBPenPathRef}
                  fill="transparent"
                  stroke="#dc2626"
                  strokeWidth="2.5"
                  vectorEffect="non-scaling-stroke"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              {/* 2. Real-time Adobe PDF Highlight on Rev B (Direct DOM update) */}
              <div
                ref={activeRevBHighlightDivRef}
                style={{
                  display: 'none',
                  mixBlendMode: 'multiply',
                }}
                className="absolute z-30 pointer-events-none bg-amber-400/50 border-y-2 border-amber-600 rounded-xs shadow-xs"
              />

              {/* 3. SVG Overlay for Rev B Pen Circles */}
              <svg 
                className="absolute inset-0 w-full h-full pointer-events-none z-10"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                {revBBalloonsForSheet.map((b) => {
                  if (b.markupType !== 'CIRCLE' || !b.markupCoordinates) return null;
                  const isFocused = b.id === focusedFeatureId || activeCommentPopup?.id === b.id;
                  const colors = getStatusColors(b.status);
                  const pathD = b.markupCoordinates.pathD || makeHandDrawnLoop(
                    b.markupCoordinates.minX + b.markupCoordinates.width / 2,
                    b.markupCoordinates.minY + b.markupCoordinates.height / 2,
                    b.markupCoordinates.width / 2,
                    b.markupCoordinates.height / 2
                  );
                  return (
                    <path
                      key={`revB-circle-${b.id}`}
                      d={pathD}
                      fill={colors.fillCircle}
                      stroke={colors.stroke}
                      strokeWidth={isFocused ? '3' : '2'}
                      vectorEffect="non-scaling-stroke"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="cursor-pointer pointer-events-auto transition-all"
                      onMouseEnter={() => setHoveredDiffBalloon(b)}
                      onMouseLeave={() => setHoveredDiffBalloon(null)}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveCommentPopup(b);
                        if (onSelectBalloon) onSelectBalloon(b);
                      }}
                    />
                  );
                })}
              </svg>

              {/* 4. Highlighters on Rev B */}
              {revBBalloonsForSheet.map((b) => {
                if (b.markupType !== 'HIGHLIGHT' || !b.markupCoordinates) return null;
                const isFocused = b.id === focusedFeatureId || activeCommentPopup?.id === b.id;
                const colors = getStatusColors(b.status);

                return (
                  <div
                    key={`revB-hl-${b.id}`}
                    style={{
                      left: `${b.markupCoordinates.minX}%`,
                      top: `${b.markupCoordinates.minY}%`,
                      width: `${b.markupCoordinates.width}%`,
                      height: `${b.markupCoordinates.height}%`,
                      backgroundColor: colors.fillHighlight,
                      mixBlendMode: 'multiply',
                    }}
                    onMouseEnter={() => setHoveredDiffBalloon(b)}
                    onMouseLeave={() => setHoveredDiffBalloon(null)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveCommentPopup(b);
                      if (onSelectBalloon) onSelectBalloon(b);
                    }}
                    className={`absolute z-15 cursor-pointer rounded-xs transition-all border-y ${
                      b.status === 'ADDRESSED'
                        ? 'border-emerald-500'
                        : b.status === 'ATTENTION'
                        ? 'border-rose-500'
                        : 'border-amber-400'
                    } ${isFocused ? 'ring-2 ring-black shadow-md' : 'hover:opacity-90'}`}
                    title={`Feature #${b.balloonNumber}: Click to open comments`}
                  />
                );
              })}

              {/* 5. Balloon badges on Rev B */}
              {revBBalloonsForSheet.map((b) => {
                const isFocused = b.id === focusedFeatureId || activeCommentPopup?.id === b.id;
                const colors = getStatusColors(b.status);

                return (
                  <div
                    key={`revB-badge-${b.id}`}
                    style={{ left: `${b.x}%`, top: `${b.y}%` }}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      if (e.button !== 0) return; // Only primary left click
                      const balloonId = b.id;
                      dragStartPosRef.current = { x: e.clientX, y: e.clientY };
                      isDraggingBalloonRef.current = false;
                      draggedBalloonIdRef.current = balloonId;
                      try {
                        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                      } catch {}
                    }}
                    onPointerMove={(e) => {
                      if (!dragStartPosRef.current || draggedBalloonIdRef.current !== b.id) return;
                      const dist = Math.hypot(e.clientX - dragStartPosRef.current.x, e.clientY - dragStartPosRef.current.y);
                      
                      if (!isDraggingBalloonRef.current && dist > 3) {
                        isDraggingBalloonRef.current = true;
                        setDraggedBalloonId(b.id);
                      }

                      if (isDraggingBalloonRef.current) {
                        e.stopPropagation();
                        const coords = getRevBCoordinates(e);
                        if (coords) {
                          const clampedX = Math.min(Math.max(Math.round(coords.pctX * 10) / 10, 1), 99);
                          const clampedY = Math.min(Math.max(Math.round(coords.pctY * 10) / 10, 1), 99);
                          const targetX = b.leaderTargetX !== undefined ? b.leaderTargetX : b.x;
                          const targetY = b.leaderTargetY !== undefined ? b.leaderTargetY : b.y;
                          if (onUpdateBalloonPosition) {
                            onUpdateBalloonPosition(b.id, clampedX, clampedY, targetX, targetY);
                          } else if (onUpdateBalloon) {
                            onUpdateBalloon({ ...b, x: clampedX, y: clampedY, leaderTargetX: targetX, leaderTargetY: targetY });
                          }
                        }
                      }
                    }}
                    onPointerUp={(e) => {
                      e.stopPropagation();
                      try {
                        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
                      } catch {}

                      if (isDraggingBalloonRef.current && draggedBalloonIdRef.current === b.id) {
                        isDraggingBalloonRef.current = false;
                        draggedBalloonIdRef.current = null;
                        setDraggedBalloonId(null);
                        dragStartPosRef.current = null;

                        const coords = getRevBCoordinates(e);
                        if (coords) {
                          const clampedX = Math.min(Math.max(Math.round(coords.pctX * 10) / 10, 1), 99);
                          const clampedY = Math.min(Math.max(Math.round(coords.pctY * 10) / 10, 1), 99);
                          const targetX = b.leaderTargetX !== undefined ? b.leaderTargetX : b.x;
                          const targetY = b.leaderTargetY !== undefined ? b.leaderTargetY : b.y;
                          if (onUpdateBalloonPosition) {
                            onUpdateBalloonPosition(b.id, clampedX, clampedY, targetX, targetY);
                          } else if (onUpdateBalloon) {
                            onUpdateBalloon({ ...b, x: clampedX, y: clampedY, leaderTargetX: targetX, leaderTargetY: targetY });
                          }
                        }

                        justDroppedRef.current = true;
                        setTimeout(() => { justDroppedRef.current = false; }, 120);
                        return;
                      }

                      isDraggingBalloonRef.current = false;
                      draggedBalloonIdRef.current = null;
                      setDraggedBalloonId(null);
                      dragStartPosRef.current = null;
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (justDroppedRef.current) return;
                      setActiveCommentPopup(b);
                      if (onSelectBalloon) onSelectBalloon(b);
                    }}
                    onMouseEnter={() => setHoveredDiffBalloon(b)}
                    onMouseLeave={() => setHoveredDiffBalloon(null)}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 z-25 cursor-pointer ${
                      draggedBalloonId === b.id
                        ? 'ring-4 ring-amber-400 scale-125 z-40 animate-pulse cursor-grabbing'
                        : ''
                    }`}
                  >
                    {/* Floating Specification Tooltip right directly above the balloon on hover */}
                    {hoveredDiffBalloon?.id === b.id && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none whitespace-normal min-w-[200px] max-w-[300px] bg-slate-900/95 backdrop-blur-md text-white p-2.5 rounded-xl border border-slate-700 shadow-2xl animate-in fade-in zoom-in-95 duration-100">
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-[5px] border-transparent border-t-slate-700" />
                        <div className="flex items-center justify-between gap-1 border-b border-slate-800 pb-1 mb-1">
                          <span className="font-bold text-[10px] text-amber-400">Feature #{b.balloonNumber} (New Print)</span>
                          <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded ${
                            b.status === 'ADDRESSED' ? 'bg-emerald-600 text-white' : b.status === 'ATTENTION' ? 'bg-rose-600 text-white' : 'bg-amber-400 text-slate-950 font-bold'
                          }`}>
                            {b.status === 'ADDRESSED' ? 'Addressed ✓' : b.status === 'ATTENTION' ? 'Attention ⚠️' : 'Unchanged'}
                          </span>
                        </div>
                        <div className="text-[11px] font-black text-white font-mono flex items-baseline gap-1">
                          {b.dimensionType === 'DIAMETER' && <span className="text-amber-400">Ø</span>}
                          {b.dimensionType === 'RADIUS' && <span className="text-amber-400">R</span>}
                          <span>{b.nominalValue || (b.featureName ? '' : 'Dim Callout')}</span>
                          {(b.upperTol || b.lowerTol) && (
                            <span className="text-[9px] text-slate-300 font-mono">+{b.upperTol || '0'}/-{b.lowerTol || '0'}</span>
                          )}
                          <span className="text-[9px] text-slate-400 font-sans font-bold">{b.unit || 'mm'}</span>
                          {b.criticalCharacteristic && <span className="text-[8px] px-1 rounded bg-rose-600 text-white font-sans font-bold">CC</span>}
                        </div>
                        {b.featureName && <div className="text-[10px] font-semibold text-slate-200 mt-0.5 truncate">{b.featureName}</div>}
                        {b.issueDescription && (
                          <div className="text-[9px] text-slate-300 bg-slate-800/90 p-1.5 rounded border border-slate-700 mt-1 line-clamp-2">
                            <strong className="text-amber-400">Finding: </strong>{b.issueDescription}
                          </div>
                        )}
                      </div>
                    )}

                    <div className={`w-6 h-6 rounded-full font-bold text-[10px] flex items-center justify-center shadow-md border-2 border-white transition-transform ${
                      colors.badgeBg
                    } ${colors.badgeText} ${isFocused ? 'ring-4 ring-amber-400 scale-125 z-30 shadow-[0_0_12px_rgba(245,158,11,0.5)]' : 'hover:scale-110'}`}>
                      {b.balloonNumber}
                    </div>
                    {colors.symbol === 'CHECK' && (
                      <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-700 text-white flex items-center justify-center shadow">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}
                    {colors.symbol === 'CAUTION' && (
                      <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-rose-700 text-white flex items-center justify-center shadow animate-bounce">
                        <AlertTriangle className="w-2.5 h-2.5 stroke-[2.5]" />
                      </div>
                    )}
                  </div>
                );
              })}

              {/* 6. Green Pen Feature Verification Ticks on Rev B */}
              {(revB?.checkmarks || [])
                .filter((chk) => (chk.sheetNumber || 1) === revBSheetNumber)
                .map((chk) => (
                  <div
                    key={chk.id}
                    data-interactive-balloon="true"
                    style={{ left: `${chk.x}%`, top: `${chk.y}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 z-25 group cursor-pointer"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveCheckmark?.(chk.id);
                    }}
                    title="Feature checked off with green review pen (✓). Click to erase."
                  >
                    <div className="relative flex items-center justify-center">
                      <div className="w-6 h-6 rounded-full bg-transparent border-2 border-emerald-600 flex items-center justify-center transition-transform group-hover:scale-125 group-hover:border-rose-600">
                        <Check className="w-4 h-4 text-emerald-600 stroke-[3.5] group-hover:hidden" />
                        <X className="w-3.5 h-3.5 text-rose-600 stroke-[3] hidden group-hover:block" />
                      </div>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-1.5 py-0.5 bg-slate-900 text-white text-[9px] font-bold rounded shadow-md pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-30">
                        Click to erase (✓)
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* 4. BRIEF INFORMATION POP-UP MODAL/CARD (User Request 3: Brief information comment section (1, 2, 3) can pop up) */}
        {activeCommentPopup && (
          <div className="absolute bottom-5 right-5 z-40 max-w-sm w-full bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border-2 border-slate-700 p-4 text-xs animate-in fade-in slide-in-from-bottom-4 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-slate-900 text-amber-300 font-black text-xs flex items-center justify-center shadow-sm">
                  {activeCommentPopup.balloonNumber}
                </span>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-xs truncate max-w-[200px]">
                    {activeCommentPopup.featureName || `Feature #${activeCommentPopup.balloonNumber}`}
                  </h4>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {activeCommentPopup.nominalValue ? (
                      <span>Spec: {activeCommentPopup.nominalValue} {activeCommentPopup.unit || 'mm'}</span>
                    ) : 'Characteristic Callout'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                  activeCommentPopup.status === 'ADDRESSED'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : activeCommentPopup.status === 'ATTENTION'
                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                    : 'bg-amber-100 text-amber-900 border border-amber-300'
                }`}>
                  {activeCommentPopup.status}
                </span>
                <button
                  type="button"
                  onClick={() => setActiveCommentPopup(null)}
                  className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-900 rounded-lg cursor-pointer"
                  title="Close popup"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Findings & Relaxation Info */}
            <div className="space-y-2 mb-3">
              {activeCommentPopup.issueDescription ? (
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="font-bold text-[10px] text-slate-700 uppercase tracking-wide mb-0.5">Manufacturing Finding:</div>
                  <div className="text-slate-900 leading-snug">{activeCommentPopup.issueDescription}</div>
                </div>
              ) : (
                <div className="text-slate-400 italic text-[11px]">No finding recorded yet for this feature.</div>
              )}

              {activeCommentPopup.proposedChange && (
                <div className="p-2 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="font-bold text-[10px] text-amber-800 uppercase tracking-wide mb-0.5">Proposed Relaxation:</div>
                  <div className="text-amber-950 leading-snug">{activeCommentPopup.proposedChange}</div>
                </div>
              )}

              {/* Multi-Stakeholder Feedback Preview */}
              {activeCommentPopup.feedbackList && activeCommentPopup.feedbackList.length > 0 && (
                <div className="p-2 bg-blue-50/70 rounded-lg border border-blue-200">
                  <div className="font-bold text-[10px] text-blue-800 uppercase tracking-wide mb-1">Feedback Threads ({activeCommentPopup.feedbackList.length}):</div>
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {activeCommentPopup.feedbackList.map((f, i) => (
                      <div key={i} className="text-[11px] text-slate-800">
                        <strong className="text-blue-900">[{f.role} &bull; {f.authorName}]: </strong>
                        <span>{f.comment}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => handleFocusFeature(activeCommentPopup)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs cursor-pointer transition-colors"
              >
                Center &amp; Zoom
              </button>

              {onSelectBalloon && (
                <button
                  type="button"
                  onClick={() => {
                    onSelectBalloon(activeCommentPopup);
                    setActiveCommentPopup(null);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold text-xs cursor-pointer transition-colors shadow-sm flex items-center gap-1.5 border border-slate-700"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                  <span>Open Full Comment Drawer</span>
                </button>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
