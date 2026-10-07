import React, { useState, useRef, useEffect, MouseEvent } from 'react';
import { 
  BalloonItem, 
  DrawingRevision, 
  StakeholderRole, 
  DFMStatus,
  DrawingCheckmark
} from '../types/dfm';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Hand, 
  Check, 
  AlertTriangle, 
  Info, 
  Filter, 
  Layers, 
  PenTool, 
  Highlighter, 
  CheckCircle2, 
  X,
  Move,
  Sparkles,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import { findNonOverlappingPosition, resolveAllOverlaps } from '../utils/drawingUtils';

interface DrawingViewerProps {
  revision: DrawingRevision;
  selectedBalloonId?: string;
  onSelectBalloon: (balloon: BalloonItem) => void;
  onAddBalloon: (newBalloon: Partial<BalloonItem>) => void;
  onUpdateBalloonPosition: (id: string, x: number, y: number, targetX?: number, targetY?: number) => void;
  onToggleBalloonRelevance: (id: string, isRelevant: boolean) => void;
  onAddCheckmark?: (checkmark: DrawingCheckmark) => void;
  onRemoveCheckmark?: (id: string) => void;
  currentRole: StakeholderRole;
  activeSheetNumber?: number;
  totalSheets?: number;
  onSelectSheet?: (sheetNum: number) => void;
}

export type DFMToolMode = 'PAN' | 'CIRCLE_ISSUE' | 'HIGHLIGHT_CONCERN' | 'GREEN_TICK';

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

export const DrawingViewer: React.FC<DrawingViewerProps> = ({
  revision,
  selectedBalloonId,
  onSelectBalloon,
  onAddBalloon,
  onUpdateBalloonPosition,
  onToggleBalloonRelevance,
  onAddCheckmark,
  onRemoveCheckmark,
  currentRole,
  activeSheetNumber = 1,
  totalSheets = 1,
  onSelectSheet,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const drawingRef = useRef<HTMLDivElement>(null);
  const activePenPathRef = useRef<SVGPathElement>(null);
  const isDrawingPenRef = useRef(false);
  const penPointsRef = useRef<{ x: number; y: number }[]>([]);
  const lastPointerPosRef = useRef<{ clientX: number; clientY: number } | null>(null);
  const cachedSvgImgRef = useRef<HTMLImageElement | null>(null);
  const svgDimensionsRef = useRef<{ width: number; height: number }>({ width: 1200, height: 800 });
  const drawingRectRef = useRef<DOMRect | null>(null);

  // Dynamic canvas dimensions to match exact drawing aspect ratio (User Request 4.2: precise overlay in review)
  const [canvasDimensions, setCanvasDimensions] = useState<{ width: number; height: number }>({ width: 1100, height: 730 });

  // Adobe PDF Highlight Direct DOM refs
  const isHighlightingRef = useRef(false);
  const highlightStartRef = useRef<{ x: number; y: number } | null>(null);
  const activeHighlightDivRef = useRef<HTMLDivElement>(null);

  // Pre-rasterize SVG for synchronous, pixel-perfect snips on circling/highlighting
  useEffect(() => {
    if (revision.drawingType === 'svg' && revision.drawingUrl) {
      try {
        let svgStr = revision.drawingUrl;
        const vbMatch = svgStr.match(/viewBox=["']\s*([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s*["']/i);
        const vbW = vbMatch ? parseFloat(vbMatch[3]) : 1200;
        const vbH = vbMatch ? parseFloat(vbMatch[4]) : 800;
        svgDimensionsRef.current = { width: vbW, height: vbH };

        if (vbW > 0 && vbH > 0) {
          const ratio = vbW / vbH;
          const targetW = 1100;
          const targetH = Math.round(targetW / ratio);
          setCanvasDimensions({ width: targetW, height: targetH });
        }

        if (!svgStr.includes('viewBox')) {
          svgStr = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vbW} ${vbH}" width="${vbW}" height="${vbH}">${svgStr}</svg>`;
        } else {
          // Replace or set explicit pixel width and height matching viewBox so off-screen canvas drawImage works perfectly
          svgStr = svgStr.replace(/<svg\b([^>]*)>/i, (_match, attrs) => {
            let res = attrs
              .replace(/\bwidth=["'][^"']*["']/gi, '')
              .replace(/\bheight=["'][^"']*["']/gi, '');
            return `<svg ${res} width="${vbW}" height="${vbH}">`;
          });
        }
        const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => {
          cachedSvgImgRef.current = img;
        };
        img.src = url;
      } catch (e) {
        console.warn('SVG pre-render notice:', e);
      }
    }
  }, [revision.drawingUrl, revision.drawingType]);

  // Pan & Zoom state
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });

  // Tool Mode: Live DFM Practice (Circle with Pen, Adobe-style Highlight, Pan, Drop Tag)
  const [toolMode, setToolMode] = useState<DFMToolMode>('PAN');

  const [imageError, setImageError] = useState(false);

  // Reset image error state whenever drawingUrl or activeSheetNumber changes
  useEffect(() => {
    setImageError(false);
  }, [revision.drawingUrl, activeSheetNumber]);

  // Toggles for visibility / relevance filtering
  const [hideNonRelevant, setHideNonRelevant] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ADDRESSED' | 'UNCHANGED' | 'ATTENTION'>('ALL');

  const [draggingLeaderId, setDraggingLeaderId] = useState<string | null>(null);
  const [hoveredBalloon, setHoveredBalloon] = useState<BalloonItem | null>(null);

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

  const handleZoom = (delta: number) => {
    drawingRectRef.current = null;
    setScale((prev) => Math.min(Math.max(prev + delta, 0.4), 4.5));
  };

  const handleResetZoom = () => {
    drawingRectRef.current = null;
    setScale(1);
    setPan({ x: 0, y: 0 });
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    drawingRectRef.current = null;
    const zoomFactor = e.deltaY < 0 ? 0.15 : -0.15;
    setScale((prev) => Math.min(Math.max(prev + zoomFactor, 0.4), 4.5));
  };

  // Immediate Crop of Marked Area (Pixel-perfect calculation accounting for aspect ratio & zoom)
  const cropMarkedArea = (
    minX: number,
    minY: number,
    width: number,
    height: number
  ): string => {
    try {
      if (!drawingRef.current) return '';
      const offCanvas = document.createElement('canvas');
      const imgEl = drawingRef.current.querySelector('img') as HTMLImageElement | null;

      const cw = 1100;
      const ch = 730;

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

        // Add comfortable 16% margin padding around marked box so callout text/tolerances are never cut off
        const padX = boxPxWidth * 0.16;
        const padY = boxPxHeight * 0.16;
        const paddedLeft = Math.max(0, boxPxLeft - padX);
        const paddedTop = Math.max(0, boxPxTop - padY);
        const paddedWidth = Math.min(cw - paddedLeft, boxPxWidth + padX * 2);
        const paddedHeight = Math.min(ch - paddedTop, boxPxHeight + padY * 2);

        // Image relative coordinates inside natural source
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
      } else if (revision.drawingUrl) {
        // High quality vector/SVG snip with exact aspect ratio projection
        const svgImg = cachedSvgImgRef.current;
        const { width: natW, height: natH } = svgDimensionsRef.current;

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
      console.warn('Markup crop preview generation skipped', e);
    }
    return '';
  };

  // Create Markup and IMMEDIATELY open comment section drawer
  const finalizeMarkup = (
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

    const existingNums = new Set(revision.balloons.map((b) => b.balloonNumber));
    let nextNum = 1;
    while (existingNums.has(nextNum)) {
      nextNum++;
    }

    const preferredX = Math.min(Math.round(minX + width + 3), 96);
    const preferredY = Math.min(Math.max(Math.round(minY + height / 2), 4), 96);

    const sheetBalloons = revision.balloons.filter((b) => (b.sheetNumber || 1) === activeSheetNumber);
    const nonColliding = findNonOverlappingPosition(preferredX, preferredY, sheetBalloons, 4.8);
    const balloonX = nonColliding.x;
    const balloonY = nonColliding.y;

    const newBalloonData: BalloonItem = {
      id: `dfm-${Date.now()}-${nextNum}`,
      balloonNumber: nextNum,
      customLabel: `#${nextNum}`,
      x: balloonX,
      y: balloonY,
      leaderTargetX: centerX,
      leaderTargetY: centerY,
      viewName: `Zone [${Math.round(minX)}%, ${Math.round(minY)}%]`,
      featureName: '', // Empty by default
      dimensionType: 'LINEAR',
      dimensionNature: 'STANDARD',
      nominalValue: '', // Empty by default
      upperTol: '', // Empty by default
      lowerTol: '', // Empty by default
      unit: 'mm',
      criticalCharacteristic: false,
      isRelevant: true,
      isVisible: true,
      status: 'UNCHANGED',
      sheetNumber: activeSheetNumber,
      markupType: type,
      markupCoordinates: {
        minX,
        minY,
        width,
        height,
        pathD,
      },
      drawingSnipUrl: cropBase64 || undefined,
      issueDescription: '', // Empty by default
      proposedChange: '', // Empty by default
      feedbackList: [],
      originRevisionId: revision.id,
      originRevisionName: revision.revCode,
      revisionHistory: [],
    };

    // Immediately add and open comment section drawer!
    onAddBalloon(newBalloonData);
    onSelectBalloon(newBalloonData);
    // User Request 2: circle / highlighter shouldn't go to default post every selection.
    // Continue to stay with the same feature!
  };

  // Sub-pixel coordinate calculation relative to drawing with cached rect support (0ms overhead)
  const getCoordinatesFromEvent = (e: React.PointerEvent<HTMLDivElement> | PointerEvent | MouseEvent) => {
    const rect = drawingRectRef.current || drawingRef.current?.getBoundingClientRect();
    if (!rect || rect.width <= 0 || rect.height <= 0) return null;
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const isInside = clickX >= -4 && clickX <= rect.width + 4 && clickY >= -4 && clickY <= rect.height + 4;
    const pctX = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
    const pctY = Math.max(0, Math.min(100, (clickY / rect.height) * 100));
    return { pctX, pctY, clientX: e.clientX, clientY: e.clientY, isInside };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drawingRef.current) return;

    // If clicking on an existing interactive balloon, circle, highlight or checkmark, do not intercept or pan!
    const target = e.target as HTMLElement | SVGElement | null;
    if (target && target.closest('[data-interactive-balloon]')) {
      return;
    }

    if (e.button === 1 || toolMode === 'PAN' || e.altKey) {
      setIsPanning(true);
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      return;
    }

    if (e.button !== 0) return;

    // Cache bounding rect once on pointer down so subsequent pointer moves have 0ms layout delay!
    drawingRectRef.current = drawingRef.current.getBoundingClientRect();
    const coords = getCoordinatesFromEvent(e);
    if (!coords || !coords.isInside) return;
    const { pctX, pctY, clientX, clientY } = coords;

    // If user clicks on or near an existing balloon badge or markup region, reliably select and reopen that balloon
    const hitBalloon = visibleBalloons.find((b) => {
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
      onSelectBalloon(hitBalloon);
      return;
    }

    // 1. Natural Pen Tool: Circle features with pen - Direct DOM Path Setup (0ms latency)
    if (toolMode === 'CIRCLE_ISSUE') {
      isDrawingPenRef.current = true;
      penPointsRef.current = [{ x: pctX, y: pctY }];
      lastPointerPosRef.current = { clientX, clientY };
      if (activePenPathRef.current) {
        activePenPathRef.current.setAttribute('d', `M ${pctX} ${pctY}`);
      }
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      return;
    }

    // 2. Adobe PDF Highlighter Tool - Direct DOM setup
    if (toolMode === 'HIGHLIGHT_CONCERN') {
      isHighlightingRef.current = true;
      highlightStartRef.current = { x: pctX, y: pctY };
      if (activeHighlightDivRef.current) {
        activeHighlightDivRef.current.style.display = 'block';
        activeHighlightDivRef.current.style.left = `${pctX}%`;
        activeHighlightDivRef.current.style.top = `${pctY}%`;
        activeHighlightDivRef.current.style.width = '0%';
        activeHighlightDivRef.current.style.height = '0%';
      }
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      return;
    }

    // 3. Green Pen Check / Pointer Tool
    // User General Requirement: Change concept of Drop Tag to a pointer which when dropped doesn't create a balloon and pops noting, it just drop a small green tick, just need then additional very small feature to remove that tick if incase placed by mistake.
    if (toolMode === 'GREEN_TICK') {
      if (onAddCheckmark) {
        const newCheck: DrawingCheckmark = {
          id: `chk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          x: Math.round(pctX * 10) / 10,
          y: Math.round(pctY * 10) / 10,
          sheetNumber: activeSheetNumber,
          timestamp: new Date().toLocaleTimeString(),
        };
        onAddCheckmark(newCheck);
      }
      drawingRectRef.current = null;
      return;
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isPanning) {
      setPan({
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y,
      });
      return;
    }

    // Natural Pen Circle drawing - ZERO-LAG DIRECT DOM UPDATE AT 120 FPS
    if (isDrawingPenRef.current) {
      const coords = getCoordinatesFromEvent(e);
      if (!coords) return;
      const { pctX, pctY, clientX, clientY } = coords;
      const lastPos = lastPointerPosRef.current;
      const screenDist = lastPos ? Math.hypot(clientX - lastPos.clientX, clientY - lastPos.clientY) : 999;
      // High responsiveness: sample every 2 screen pixels
      if (screenDist >= 2.0) {
        penPointsRef.current.push({ x: pctX, y: pctY });
        lastPointerPosRef.current = { clientX, clientY };
        if (activePenPathRef.current) {
          activePenPathRef.current.setAttribute('d', pointsToSvgPath(penPointsRef.current));
        }
      }
      return;
    }

    // Adobe PDF Highlighter dragging - Direct DOM update
    if (isHighlightingRef.current && highlightStartRef.current) {
      const coords = getCoordinatesFromEvent(e);
      if (!coords) return;
      const { pctX, pctY } = coords;
      const startX = highlightStartRef.current.x;
      const startY = highlightStartRef.current.y;
      const left = Math.min(startX, pctX);
      const top = Math.min(startY, pctY);
      const width = Math.abs(pctX - startX);
      const height = Math.abs(pctY - startY);
      if (activeHighlightDivRef.current) {
        activeHighlightDivRef.current.style.left = `${left}%`;
        activeHighlightDivRef.current.style.top = `${top}%`;
        activeHighlightDivRef.current.style.width = `${width}%`;
        activeHighlightDivRef.current.style.height = `${height}%`;
      }
      return;
    }

    // Dragging leader pointer
    if (draggingLeaderId) {
      const coords = getCoordinatesFromEvent(e);
      if (!coords) return;
      const { pctX, pctY } = coords;
      const clampedX = Math.min(Math.max(Math.round(pctX * 10) / 10, 1), 99);
      const clampedY = Math.min(Math.max(Math.round(pctY * 10) / 10, 1), 99);

      const balloon = revision.balloons.find((b) => b.id === draggingLeaderId);
      if (balloon) {
        onUpdateBalloonPosition(
          draggingLeaderId, 
          balloon.x, 
          balloon.y, 
          clampedX, 
          clampedY
        );
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}

    setIsPanning(false);
    setDraggingLeaderId(null);

    // 1. Finish Pen Circle
    if (isDrawingPenRef.current) {
      isDrawingPenRef.current = false;
      const points = [...penPointsRef.current];
      const coords = getCoordinatesFromEvent(e);
      if (coords && points.length > 0) {
        const last = points[points.length - 1];
        if (Math.hypot(coords.pctX - last.x, coords.pctY - last.y) > 0.05) {
          points.push({ x: coords.pctX, y: coords.pctY });
        }
      }

      if (activePenPathRef.current) {
        activePenPathRef.current.setAttribute('d', '');
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
          // Quick click/tap: generate comfortable natural loop around the point
          const cx = (minX + maxX) / 2;
          const cy = (minY + maxY) / 2;
          minX = Math.max(cx - 3.5, 0.5);
          minY = Math.max(cy - 3.5, 0.5);
          width = 7.0;
          height = 7.0;
          finalPath = makeHandDrawnLoop(cx, cy, 3.5, 3.5);
        } else {
          // Close the drawn points back to start with natural hand-drawn loop
          const closedPoints = [...points, points[0]];
          finalPath = pointsToSvgPath(closedPoints);
        }

        finalizeMarkup('CIRCLE', minX, minY, width, height, finalPath);
      }
      penPointsRef.current = [];
      lastPointerPosRef.current = null;
      drawingRectRef.current = null;
      setToolMode('PAN');
      return;
    }

    // 2. Finish Adobe PDF Highlighter
    if (isHighlightingRef.current && highlightStartRef.current) {
      isHighlightingRef.current = false;
      const coords = getCoordinatesFromEvent(e);
      const currentX = coords ? coords.pctX : highlightStartRef.current.x;
      const currentY = coords ? coords.pctY : highlightStartRef.current.y;
      const startX = highlightStartRef.current.x;
      const startY = highlightStartRef.current.y;
      const minX = Math.min(startX, currentX);
      const maxX = Math.max(startX, currentX);
      const minY = Math.min(startY, currentY);
      const maxY = Math.max(startY, currentY);
      const width = maxX - minX;
      const height = maxY - minY;

      if (activeHighlightDivRef.current) {
        activeHighlightDivRef.current.style.display = 'none';
        activeHighlightDivRef.current.style.width = '0%';
        activeHighlightDivRef.current.style.height = '0%';
      }

      if (width > 0.6 && height > 0.6) {
        finalizeMarkup('HIGHLIGHT', minX, minY, width, height);
      }
      highlightStartRef.current = null;
      drawingRectRef.current = null;
      setToolMode('PAN');
      return;
    }

    drawingRectRef.current = null;
  };
  /**
   * High-Contrast Color Theme for Engineering Drawings:
   * - ADDRESSED: Emerald Green (✓)
   * - ATTENTION: Vivid Crimson Red (⚠️)
   * - UNCHANGED: High-contrast rich amber gold (4.5+:1 contrast against white paper)
   */
  const getStatusColors = (status: DFMStatus) => {
    switch (status) {
      case 'ADDRESSED':
        return {
          stroke: '#059669', // Emerald green
          fillCircle: 'transparent', // User Request 4: Transparent so background information can be seen!
          fillHighlight: 'rgba(5, 150, 105, 0.28)',
          badgeBg: 'bg-emerald-600',
          badgeText: 'text-white font-bold',
          badgeBorder: 'border-emerald-700',
          symbol: 'CHECK',
        };
      case 'ATTENTION':
        return {
          stroke: '#dc2626', // Vivid crimson
          fillCircle: 'transparent', // Transparent so background information can be seen!
          fillHighlight: 'rgba(220, 38, 38, 0.28)',
          badgeBg: 'bg-rose-600',
          badgeText: 'text-white font-bold',
          badgeBorder: 'border-rose-700',
          symbol: 'CAUTION',
        };
      case 'UNCHANGED':
      default:
        return {
          stroke: '#d97706', // High-contrast rich amber (4.5+:1 against white paper!)
          fillCircle: 'transparent', // Transparent so background information can be seen!
          fillHighlight: 'rgba(217, 119, 6, 0.28)',
          badgeBg: 'bg-amber-400',
          badgeText: 'text-slate-950 font-black',
          badgeBorder: 'border-amber-600',
          symbol: 'NONE',
        };
    }
  };

  // Active page drawing URL for current sheet
  const currentDrawingUrl = (revision.drawingPages && revision.drawingPages.length >= activeSheetNumber && revision.drawingPages[activeSheetNumber - 1])
    ? revision.drawingPages[activeSheetNumber - 1]
    : revision.drawingUrl;

  // Auto-arrange and resolve overlapping balloons on current sheet using physics repulsion
  const handleAutoAvoidOverlaps = () => {
    const sheetBalloons = revision.balloons.filter(
      (b) => (b.sheetNumber || 1) === activeSheetNumber
    );
    if (sheetBalloons.length < 2) return;

    const resolved = resolveAllOverlaps(sheetBalloons, 5.5);
    resolved.forEach((b) => {
      const orig = sheetBalloons.find((o) => o.id === b.id);
      if (
        orig &&
        (orig.x !== b.x ||
          orig.y !== b.y ||
          orig.leaderTargetX !== b.leaderTargetX ||
          orig.leaderTargetY !== b.leaderTargetY)
      ) {
        onUpdateBalloonPosition(b.id, b.x, b.y, b.leaderTargetX, b.leaderTargetY);
      }
    });
  };

  // Keyboard Arrow Nudge to reposition selected balloon and prevent overlap / interference
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedBalloonId) return;
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const selBalloon = revision.balloons.find((b) => b.id === selectedBalloonId);
        if (!selBalloon) return;

        const step = e.shiftKey ? 2.0 : 0.5;
        let dx = 0;
        let dy = 0;
        if (e.key === 'ArrowUp') dy = -step;
        if (e.key === 'ArrowDown') dy = step;
        if (e.key === 'ArrowLeft') dx = -step;
        if (e.key === 'ArrowRight') dx = step;

        const newX = Math.min(Math.max(Math.round((selBalloon.x + dx) * 10) / 10, 1), 99);
        const newY = Math.min(Math.max(Math.round((selBalloon.y + dy) * 10) / 10, 1), 99);
        const targetX = selBalloon.leaderTargetX ?? selBalloon.x;
        const targetY = selBalloon.leaderTargetY ?? selBalloon.y;

        onUpdateBalloonPosition(selBalloon.id, newX, newY, targetX, targetY);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedBalloonId, revision.balloons, onUpdateBalloonPosition]);

  // Filter balloons according to active sheet number, relevance toggle and status filter
  const visibleBalloons = revision.balloons.filter((b) => {
    const bSheet = b.sheetNumber || 1;
    if (bSheet !== activeSheetNumber) return false;
    if (hideNonRelevant && !b.isRelevant) return false;
    if (statusFilter !== 'ALL' && b.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-200/80 relative overflow-hidden select-none">
      
      {/* Top Floating CAD Precision Toolbar */}
      <div className="absolute top-3 left-4 right-4 z-20 flex items-center justify-between pointer-events-none gap-2 flex-wrap">
        
        {/* Natural Process Markup Tool Mode Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-900/95 text-slate-100 backdrop-blur-md p-1.5 rounded-xl shadow-2xl border border-slate-700 pointer-events-auto">
          {/* Pen Circle Tool */}
          <button
            onClick={() => {
              setToolMode('CIRCLE_ISSUE');
              if (activeHighlightDivRef.current) activeHighlightDivRef.current.style.display = 'none';
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
              toolMode === 'CIRCLE_ISSUE'
                ? 'bg-rose-600 text-white font-black shadow-sm ring-2 ring-rose-400/50'
                : 'text-slate-200 hover:text-white hover:bg-slate-800 font-bold'
            }`}
            title="Circle with Pen: Draw a circle around any feature on the print with a pen to open comments"
          >
            <PenTool className="w-3.5 h-3.5 text-rose-300" />
            <span>Circle with Pen</span>
          </button>

          {/* Highlighter Tool */}
          <button
            onClick={() => {
              setToolMode('HIGHLIGHT_CONCERN');
              if (activeHighlightDivRef.current) activeHighlightDivRef.current.style.display = 'none';
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
              toolMode === 'HIGHLIGHT_CONCERN'
                ? 'bg-amber-400 text-slate-950 font-black shadow-sm ring-2 ring-amber-300/50'
                : 'text-slate-200 hover:text-white hover:bg-slate-800 font-bold'
            }`}
            title="Highlight: Highlight any dimension or callout on the print"
          >
            <Highlighter className="w-3.5 h-3.5 text-amber-400" />
            <span>Highlight</span>
          </button>

          {/* Pan / Inspect Tool */}
          <button
            onClick={() => {
              setToolMode('PAN');
              if (activeHighlightDivRef.current) activeHighlightDivRef.current.style.display = 'none';
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
              toolMode === 'PAN'
                ? 'bg-slate-700 text-white font-bold shadow-sm ring-2 ring-slate-400/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800 font-medium'
            }`}
            title="Pan & Inspect Tool: Pan around drawing canvas"
          >
            <Hand className="w-3.5 h-3.5" />
            <span>Pan / Inspect</span>
          </button>

          {/* Green Pen Check / Pointer Tool (User General Requirement) */}
          <button
            onClick={() => {
              setToolMode('GREEN_TICK');
              if (activeHighlightDivRef.current) activeHighlightDivRef.current.style.display = 'none';
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
              toolMode === 'GREEN_TICK'
                ? 'bg-emerald-600 text-white font-black shadow-sm ring-2 ring-emerald-400/50'
                : 'text-slate-200 hover:text-white hover:bg-slate-800 font-bold'
            }`}
            title="Green Pen Check: Drop a small green tick (✓) against features to verify they have been reviewed. Click on a tick to erase it."
          >
            <Check className="w-3.5 h-3.5 text-emerald-300 stroke-[3.5]" />
            <span>Green Pen (✓)</span>
          </button>
        </div>

        {/* Multi-Sheet Switcher Toolbar */}
        {totalSheets > 1 && onSelectSheet && (
          <div className="flex items-center gap-1 bg-slate-900/95 text-slate-100 backdrop-blur-md p-1.5 rounded-xl shadow-2xl border border-slate-700 pointer-events-auto text-xs">
            <span className="text-slate-300 font-bold px-2 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              Sheet:
            </span>
            {Array.from({ length: totalSheets }, (_, i) => i + 1).map((sheetNum) => (
              <button
                key={sheetNum}
                onClick={() => onSelectSheet(sheetNum)}
                className={`px-2.5 py-1 rounded-lg font-black transition-all cursor-pointer ${
                  activeSheetNumber === sheetNum
                    ? 'bg-amber-400 text-slate-950 shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                Sheet {sheetNum} of {totalSheets}
              </button>
            ))}
          </div>
        )}

        {/* Zoom & View Controls */}
        <div className="flex items-center gap-1.5 bg-slate-900/95 text-slate-100 backdrop-blur-md p-1.5 rounded-xl shadow-2xl border border-slate-700 pointer-events-auto text-xs">
          <button
            onClick={() => handleZoom(-0.2)}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          
          <span className="text-[11px] font-mono text-slate-100 px-1.5 font-bold min-w-[45px] text-center">
            {Math.round(scale * 100)}%
          </span>

          <button
            onClick={() => handleZoom(0.2)}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <button
            onClick={handleResetZoom}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Reset Zoom & Pan"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-slate-700 mx-0.5" />

          {/* Auto-Avoid Overlaps & Interference */}
          <button
            onClick={handleAutoAvoidOverlaps}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer text-amber-300 hover:text-white hover:bg-slate-800"
            title="Auto-Arrange & Avoid Overlaps: Automatically staggers balloons that touch or interfere with each other on this sheet"
          >
            <Move className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">Avoid Overlaps</span>
          </button>

          <div className="h-4 w-px bg-slate-700 mx-0.5" />

          {/* Toggle Non-Relevant Characteristics */}
          <button
            onClick={() => setHideNonRelevant(!hideNonRelevant)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              hideNonRelevant
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="Filter out non-relevant (Reference & Basic) dimensions"
          >
            <Filter className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Hide REF/Basic</span>
          </button>
        </div>
      </div>

      {/* Main Drawing Canvas Viewport */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
        className={`flex-1 w-full h-full flex items-center justify-center relative overflow-hidden touch-none ${
          toolMode === 'CIRCLE_ISSUE' || toolMode === 'HIGHLIGHT_CONCERN' || toolMode === 'GREEN_TICK' ? 'cursor-crosshair' : isPanning ? 'cursor-grabbing' : 'cursor-grab'
        }`}
      >
        <div
          ref={drawingRef}
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            transformOrigin: 'center center',
            transition: 'none',
            width: `${canvasDimensions.width}px`,
            height: `${canvasDimensions.height}px`,
          }}
          className="relative bg-white shadow-xl rounded-md border border-slate-300 select-none overflow-hidden"
        >
          {/* Drawing Content */}
          {revision.drawingType === 'svg' ? (
            <div
              className="w-full h-full pointer-events-none"
              dangerouslySetInnerHTML={{ __html: currentDrawingUrl }}
            />
          ) : imageError || !currentDrawingUrl ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-300 p-8 text-center pointer-events-none">
              <Layers className="w-12 h-12 text-amber-400 mb-3" />
              <span className="font-bold text-white text-sm">CAD Sheet {activeSheetNumber} of {totalSheets}</span>
              <span className="text-xs text-slate-400 mt-1 max-w-sm">
                {revision.drawingFileName || 'Engineering Drawing Sheet'}
              </span>
            </div>
          ) : (
            <img
              key={`cad-sheet-${activeSheetNumber}-${revision.id}-${currentDrawingUrl.slice(0, 40)}`}
              src={currentDrawingUrl}
              alt={`${revision.title} - Sheet ${activeSheetNumber}`}
              onError={() => setImageError(true)}
              onLoad={(e) => {
                const img = e.currentTarget;
                if (img.naturalWidth > 0 && img.naturalHeight > 0) {
                  const ratio = img.naturalWidth / img.naturalHeight;
                  const targetW = 1100;
                  const targetH = Math.round(targetW / ratio);
                  setCanvasDimensions({ width: targetW, height: targetH });
                }
              }}
              className="w-full h-full object-fill pointer-events-none"
            />
          )}

          {/* 1. Real-Time Natural Pen Circle SVG Layer (Direct DOM path with 0ms lag, crisp non-scaling stroke) */}
          <svg 
            className="absolute inset-0 w-full h-full pointer-events-none z-30"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <path
              ref={activePenPathRef}
              fill="transparent"
              stroke="#dc2626"
              strokeWidth="2.5"
              vectorEffect="non-scaling-stroke"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          {/* 2. Real-Time Adobe PDF-Style Highlighter Band (Direct DOM update) */}
          <div
            ref={activeHighlightDivRef}
            style={{
              display: 'none',
              mixBlendMode: 'multiply',
            }}
            className="absolute z-30 pointer-events-none bg-amber-400/50 border-y-2 border-amber-600 rounded-xs shadow-xs"
          />

          {/* 3. SVG Layer for Pen Circles and Leader Lines */}
          <svg 
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {/* Leader Lines */}
            {visibleBalloons.map((b) => {
              if (b.leaderTargetX === undefined || b.leaderTargetY === undefined) return null;
              const isSelected = b.id === selectedBalloonId;
              const colors = getStatusColors(b.status);

              return (
                <g key={`leader-${b.id}`}>
                  <line
                    x1={`${b.x}`}
                    y1={`${b.y}`}
                    x2={`${b.leaderTargetX}`}
                    y2={`${b.leaderTargetY}`}
                    stroke={isSelected ? '#000000' : colors.stroke}
                    strokeWidth={isSelected ? '2' : '1.5'}
                    vectorEffect="non-scaling-stroke"
                    strokeDasharray={isSelected ? 'none' : '4 3'}
                    opacity={b.isRelevant ? 0.95 : 0.4}
                  />
                  <circle
                    cx={`${b.leaderTargetX}`}
                    cy={`${b.leaderTargetY}`}
                    r={isSelected ? '0.6' : '0.45'}
                    fill={isSelected ? '#000000' : colors.stroke}
                  />
                </g>
              );
            })}

            {/* Saved Pen Circles (Natural hand-drawn stroke on the print) */}
            {visibleBalloons.map((b) => {
              if (b.markupType !== 'CIRCLE' || !b.markupCoordinates) return null;
              const isSelected = b.id === selectedBalloonId;
              const colors = getStatusColors(b.status);
              const pathD = b.markupCoordinates.pathD || makeHandDrawnLoop(
                b.markupCoordinates.minX + b.markupCoordinates.width / 2,
                b.markupCoordinates.minY + b.markupCoordinates.height / 2,
                b.markupCoordinates.width / 2,
                b.markupCoordinates.height / 2
              );

              return (
                <path
                  key={`pen-circle-${b.id}`}
                  data-interactive-balloon="true"
                  d={pathD}
                  fill={colors.fillCircle}
                  stroke={colors.stroke}
                  strokeWidth={isSelected ? '3' : '2'}
                  vectorEffect="non-scaling-stroke"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="cursor-pointer pointer-events-auto transition-all hover:opacity-90"
                  onMouseEnter={() => setHoveredBalloon(b)}
                  onMouseLeave={() => setHoveredBalloon(null)}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                  }}
                  onPointerUp={(e) => {
                    e.stopPropagation();
                    onSelectBalloon(b);
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectBalloon(b);
                  }}
                />
              );
            })}
          </svg>

          {/* 4. Saved Adobe PDF Highlighters (mix-blend-mode: multiply) */}
          {visibleBalloons.map((b) => {
            if (b.markupType !== 'HIGHLIGHT' || !b.markupCoordinates) return null;
            const isSelected = b.id === selectedBalloonId;
            const colors = getStatusColors(b.status);

            return (
              <div
                key={`highlight-${b.id}`}
                data-interactive-balloon="true"
                style={{
                  left: `${b.markupCoordinates.minX}%`,
                  top: `${b.markupCoordinates.minY}%`,
                  width: `${b.markupCoordinates.width}%`,
                  height: `${b.markupCoordinates.height}%`,
                  backgroundColor: colors.fillHighlight,
                  mixBlendMode: 'multiply',
                }}
                onMouseEnter={() => setHoveredBalloon(b)}
                onMouseLeave={() => setHoveredBalloon(null)}
                onPointerDown={(e) => {
                  e.stopPropagation();
                }}
                onPointerUp={(e) => {
                  e.stopPropagation();
                  onSelectBalloon(b);
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectBalloon(b);
                }}
                className={`absolute z-15 cursor-pointer rounded-xs transition-all border-y ${
                  b.status === 'ADDRESSED'
                    ? 'border-emerald-500'
                    : b.status === 'ATTENTION'
                    ? 'border-rose-500'
                    : 'border-amber-400'
                } ${isSelected ? 'ring-2 ring-black shadow-md' : 'hover:opacity-90'}`}
                title={`Feature #${b.balloonNumber}: Click to inspect and comment`}
              />
            );
          })}

          {/* 5. Draggable Leader Target Handle & Balloon Badge */}
          {visibleBalloons.map((b) => {
            const isSelected = b.id === selectedBalloonId;
            const colors = getStatusColors(b.status);

            return (
              <React.Fragment key={`balloon-ctrl-${b.id}`}>
                {/* Draggable Leader target handle */}
                {isSelected && b.leaderTargetX !== undefined && b.leaderTargetY !== undefined && (
                  <div
                    data-interactive-balloon="true"
                    style={{
                      left: `${b.leaderTargetX}%`,
                      top: `${b.leaderTargetY}%`,
                    }}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      setDraggingLeaderId(b.id);
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setDraggingLeaderId(b.id);
                    }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-md z-30 cursor-crosshair hover:scale-125 transition-transform"
                    title="Drag leader line pointer"
                  />
                )}

                {/* Balloon Badge with Smooth Drag & Drop Repositioning (Avoid Overlap / Interference) */}
                <div
                  data-interactive-balloon="true"
                  style={{
                    left: `${b.x}%`,
                    top: `${b.y}%`,
                  }}
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
                      const coords = getCoordinatesFromEvent(e);
                      if (coords) {
                        const clampedX = Math.min(Math.max(Math.round(coords.pctX * 10) / 10, 1), 99);
                        const clampedY = Math.min(Math.max(Math.round(coords.pctY * 10) / 10, 1), 99);
                        const targetX = b.leaderTargetX !== undefined ? b.leaderTargetX : b.x;
                        const targetY = b.leaderTargetY !== undefined ? b.leaderTargetY : b.y;
                        onUpdateBalloonPosition(b.id, clampedX, clampedY, targetX, targetY);
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

                      const coords = getCoordinatesFromEvent(e);
                      if (coords) {
                        const clampedX = Math.min(Math.max(Math.round(coords.pctX * 10) / 10, 1), 99);
                        const clampedY = Math.min(Math.max(Math.round(coords.pctY * 10) / 10, 1), 99);
                        const targetX = b.leaderTargetX !== undefined ? b.leaderTargetX : b.x;
                        const targetY = b.leaderTargetY !== undefined ? b.leaderTargetY : b.y;
                        onUpdateBalloonPosition(b.id, clampedX, clampedY, targetX, targetY);
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
                    // Simple short click selects for review & comments:
                    onSelectBalloon(b);
                  }}
                  onMouseEnter={() => setHoveredBalloon(b)}
                  onMouseLeave={() => setHoveredBalloon(null)}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-grab active:cursor-grabbing group transition-transform ${
                    draggedBalloonId === b.id
                      ? 'scale-125 z-40 ring-4 ring-amber-400 ring-offset-2 ring-offset-slate-900 shadow-2xl animate-pulse cursor-grabbing'
                      : isSelected
                      ? 'scale-125 z-30 ring-2 ring-amber-400'
                      : 'hover:scale-110'
                  } ${!b.isRelevant ? 'opacity-40' : ''}`}
                  title={`Balloon #${b.balloonNumber}: Drag to reposition anywhere on print to avoid overlap, or click to open inspector`}
                >
                  <div className="relative flex items-center">
                    {/* Floating Specification Tooltip right directly above the balloon on hover */}
                    {hoveredBalloon?.id === b.id && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-50 pointer-events-none whitespace-normal min-w-[200px] max-w-[320px] bg-slate-900/95 backdrop-blur-md text-white p-2.5 rounded-xl border border-slate-700 shadow-[0_8px_25px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in-95 duration-150">
                        {/* Tooltip downward caret arrow */}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-[6px] border-transparent border-t-slate-700" />
                        
                        <div className="flex items-center justify-between gap-1.5 border-b border-slate-800 pb-1 mb-1">
                          <span className="font-black text-[11px] text-amber-400">
                            Feature #{b.balloonNumber}
                          </span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            b.status === 'ADDRESSED'
                              ? 'bg-emerald-600 text-white'
                              : b.status === 'ATTENTION'
                              ? 'bg-rose-600 text-white'
                              : 'bg-amber-400 text-slate-950'
                          }`}>
                            {b.status === 'ADDRESSED' ? 'Addressed (✓)' : b.status === 'ATTENTION' ? 'Attention (⚠️)' : 'Unchanged'}
                          </span>
                        </div>

                        {/* Primary Specification Callout Value */}
                        <div className="text-xs font-black text-white font-mono flex items-baseline gap-1 flex-wrap">
                          {b.dimensionType === 'DIAMETER' && <span className="text-amber-400">Ø</span>}
                          {b.dimensionType === 'RADIUS' && <span className="text-amber-400">R</span>}
                          <span>{b.nominalValue || (b.featureName ? '' : 'Unspecified Dim')}</span>
                          {(b.upperTol || b.lowerTol) && (
                            <span className="text-[10px] text-slate-300 font-mono">
                              +{b.upperTol || '0'}/-{b.lowerTol || '0'}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 font-sans font-bold">{b.unit || 'mm'}</span>
                          
                          {b.dimensionNature === 'BASIC' && (
                            <span className="text-[9px] font-bold px-1 rounded border border-slate-500 text-slate-300 font-sans">[BASIC]</span>
                          )}
                          {b.dimensionNature === 'REFERENCE' && (
                            <span className="text-[9px] font-bold text-slate-400 font-sans">(REF)</span>
                          )}
                          {b.criticalCharacteristic && (
                            <span className="text-[9px] font-bold px-1 rounded bg-rose-600 text-white font-sans">CC/SC</span>
                          )}
                        </div>

                        {b.featureName && (
                          <div className="text-[11px] font-semibold text-slate-200 mt-0.5 truncate">
                            {b.featureName}
                          </div>
                        )}

                        {b.issueDescription && (
                          <div className="text-[10px] text-slate-300 bg-slate-800/90 p-1.5 rounded border border-slate-700 mt-1 line-clamp-2">
                            <strong className="text-amber-400">Finding: </strong>
                            {b.issueDescription}
                          </div>
                        )}
                      </div>
                    )}

                    {/* The Balloon Circle */}
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shadow-lg border-2 transition-all ${
                        colors.badgeBg
                      } ${colors.badgeBorder} ${colors.badgeText} ${
                        isSelected
                          ? 'ring-4 ring-amber-400 ring-offset-2 ring-offset-white scale-125 z-30 shadow-[0_0_16px_rgba(245,158,11,0.6)]'
                          : 'shadow-black/20'
                      }`}
                    >
                      <span>{b.balloonNumber}</span>
                    </div>

                    {/* Beside Symbol per requirement */}
                    {colors.symbol === 'CHECK' && (
                      <div className="absolute -top-1.5 -right-2.5 w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md border border-white">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}

                    {colors.symbol === 'CAUTION' && (
                      <div className="absolute -top-1.5 -right-2.5 w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-md border border-white animate-bounce">
                        <AlertTriangle className="w-2.5 h-2.5 stroke-[2.5]" />
                      </div>
                    )}
                  </div>
                </div>
              </React.Fragment>
            );
          })}

          {/* 6. Green Pen Feature Verification Ticks (User General Requirement) */}
          {(revision.checkmarks || [])
            .filter((chk) => (chk.sheetNumber || 1) === activeSheetNumber)
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
                title="Feature checked off with green review pen (✓). Click to erase/remove."
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

      {/* Floating Selected Balloon Reposition & Alignment Control Pill */}
      {(() => {
        const selectedBalloon = revision.balloons.find((b) => b.id === selectedBalloonId);
        if (!selectedBalloon) return null;

        return (
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 text-white backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-150">
            <div className="flex items-center gap-1.5 border-r border-slate-700 pr-3">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="font-bold text-xs text-amber-400 font-mono">
                #{selectedBalloon.balloonNumber}
              </span>
              <span className="text-[11px] text-slate-300 font-medium">Reposition</span>
            </div>

            {/* Micro Nudge Arrows */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  const targetX = selectedBalloon.leaderTargetX !== undefined ? selectedBalloon.leaderTargetX : selectedBalloon.x;
                  const targetY = selectedBalloon.leaderTargetY !== undefined ? selectedBalloon.leaderTargetY : selectedBalloon.y;
                  onUpdateBalloonPosition(selectedBalloon.id, Math.max(1, selectedBalloon.x - 1), selectedBalloon.y, targetX, targetY);
                }}
                className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white cursor-pointer transition-colors shadow-2xs"
                title="Nudge Left (or use ← key)"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  const targetX = selectedBalloon.leaderTargetX !== undefined ? selectedBalloon.leaderTargetX : selectedBalloon.x;
                  const targetY = selectedBalloon.leaderTargetY !== undefined ? selectedBalloon.leaderTargetY : selectedBalloon.y;
                  onUpdateBalloonPosition(selectedBalloon.id, selectedBalloon.x, Math.max(1, selectedBalloon.y - 1), targetX, targetY);
                }}
                className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white cursor-pointer transition-colors shadow-2xs"
                title="Nudge Up (or use ↑ key)"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  const targetX = selectedBalloon.leaderTargetX !== undefined ? selectedBalloon.leaderTargetX : selectedBalloon.x;
                  const targetY = selectedBalloon.leaderTargetY !== undefined ? selectedBalloon.leaderTargetY : selectedBalloon.y;
                  onUpdateBalloonPosition(selectedBalloon.id, selectedBalloon.x, Math.min(99, selectedBalloon.y + 1), targetX, targetY);
                }}
                className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white cursor-pointer transition-colors shadow-2xs"
                title="Nudge Down (or use ↓ key)"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  const targetX = selectedBalloon.leaderTargetX !== undefined ? selectedBalloon.leaderTargetX : selectedBalloon.x;
                  const targetY = selectedBalloon.leaderTargetY !== undefined ? selectedBalloon.leaderTargetY : selectedBalloon.y;
                  onUpdateBalloonPosition(selectedBalloon.id, Math.min(99, selectedBalloon.x + 1), selectedBalloon.y, targetX, targetY);
                }}
                className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white cursor-pointer transition-colors shadow-2xs"
                title="Nudge Right (or use → key)"
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="h-4 w-px bg-slate-700" />

            {/* Quick Auto-Clear Overlap for This Balloon */}
            <button
              type="button"
              onClick={() => {
                const sheetBalloons = revision.balloons.filter((b) => (b.sheetNumber || 1) === activeSheetNumber);
                const nonOverlapping = findNonOverlappingPosition(
                  selectedBalloon.x,
                  selectedBalloon.y,
                  sheetBalloons,
                  5.2,
                  selectedBalloon.id
                );
                const targetX = selectedBalloon.leaderTargetX !== undefined ? selectedBalloon.leaderTargetX : selectedBalloon.x;
                const targetY = selectedBalloon.leaderTargetY !== undefined ? selectedBalloon.leaderTargetY : selectedBalloon.y;
                onUpdateBalloonPosition(selectedBalloon.id, nonOverlapping.x, nonOverlapping.y, targetX, targetY);
              }}
              className="px-2.5 py-1 rounded-md bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
              title="Shift this balloon away from neighboring callouts"
            >
              <Sparkles className="w-3 h-3 text-slate-950" />
              <span>Clear Overlap</span>
            </button>
          </div>
        );
      })()}

      {/* Hover Info Tooltip */}
      {hoveredBalloon && (
        <div className="absolute bottom-4 left-4 z-30 bg-slate-900/95 backdrop-blur-md text-white p-3 rounded-xl border border-slate-700 shadow-2xl max-w-sm pointer-events-none transition-all">
          <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5 mb-1.5">
            <span className="font-black text-xs text-amber-400">
              Feature #{hoveredBalloon.balloonNumber}
            </span>
            <div className="flex items-center gap-1.5">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                hoveredBalloon.status === 'ADDRESSED'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                  : hoveredBalloon.status === 'ATTENTION'
                  ? 'bg-rose-950 text-rose-300 border border-rose-700'
                  : 'bg-amber-950 text-amber-300 border border-amber-600'
              }`}>
                {hoveredBalloon.status === 'ADDRESSED' ? 'Addressed (✓)' : hoveredBalloon.status === 'ATTENTION' ? 'Attention (⚠️)' : 'Unchanged'}
              </span>
            </div>
          </div>

          <div className="text-xs font-bold text-white mb-0.5">
            {hoveredBalloon.featureName || 'Marked Drawing Feature'}
          </div>

          {hoveredBalloon.issueDescription ? (
            <div className="text-[11px] text-slate-300 bg-slate-800 p-2 rounded-lg border border-slate-700 line-clamp-2">
              <strong className="text-amber-400">Finding: </strong>
              {hoveredBalloon.issueDescription}
            </div>
          ) : (
            <div className="text-[11px] text-slate-400 italic">Click to open comment input section.</div>
          )}
        </div>
      )}
    </div>
  );
};
