import { useRef, useEffect, useState, useCallback } from 'react';
import { PenTool, Eraser, Save } from 'lucide-react';

export default function SignatureCanvas({ onSave, initialSignature }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const lastPoint = useRef(null);

  const getCanvasPoint = useCallback((e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }, []);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(canvas, 0, 0);

    const dpr = window.devicePixelRatio || 1;
    const width = container.clientWidth;
    const height = 200;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    // Restore content
    ctx.drawImage(tempCanvas, 0, 0, width, height);

    // Set drawing styles
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#1e293b';
  }, []);

  const loadSignature = useCallback((base64) => {
    if (!base64) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const img = new window.Image();
    img.onload = () => {
      const dpr = window.devicePixelRatio || 1;
      const dispW = canvas.width / dpr;
      const dispH = canvas.height / dpr;
      ctx.clearRect(0, 0, dispW, dispH);
      ctx.drawImage(img, 0, 0, dispW, dispH);
      setHasDrawn(true);
    };
    img.src = base64.startsWith('data:') ? base64 : `data:image/png;base64,${base64}`;
  }, []);

  useEffect(() => {
    resizeCanvas();
    if (initialSignature) {
      loadSignature(initialSignature);
    }
    const handleResize = () => resizeCanvas();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [resizeCanvas, initialSignature, loadSignature]);

  const startDrawing = useCallback((e) => {
    e.preventDefault();
    setIsDrawing(true);
    const point = getCanvasPoint(e);
    lastPoint.current = point;

    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
  }, [getCanvasPoint]);

  const draw = useCallback((e) => {
    if (!isDrawing) return;
    e.preventDefault();

    const ctx = canvasRef.current.getContext('2d');
    const point = getCanvasPoint(e);
    const prev = lastPoint.current;

    if (prev) {
      // Use quadratic curve for smooth lines
      const midX = (prev.x + point.x) / 2;
      const midY = (prev.y + point.y) / 2;
      ctx.quadraticCurveTo(prev.x, prev.y, midX, midY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(midX, midY);
    }

    lastPoint.current = point;
    setHasDrawn(true);
  }, [isDrawing, getCanvasPoint]);

  const stopDrawing = useCallback((e) => {
    if (e) e.preventDefault();
    if (isDrawing) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.stroke();
      ctx.closePath();
    }
    setIsDrawing(false);
    lastPoint.current = null;
  }, [isDrawing]);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    setHasDrawn(false);
  }, []);

  const saveSignature = useCallback(() => {
    const canvas = canvasRef.current;
    // Create a non-scaled canvas for export
    const exportCanvas = document.createElement('canvas');
    const dpr = window.devicePixelRatio || 1;
    exportCanvas.width = canvas.width / dpr;
    exportCanvas.height = canvas.height / dpr;
    const exportCtx = exportCanvas.getContext('2d');
    // White background
    exportCtx.fillStyle = '#ffffff';
    exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    exportCtx.drawImage(canvas, 0, 0, exportCanvas.width, exportCanvas.height);
    const dataURL = exportCanvas.toDataURL('image/png');
    if (onSave) onSave(dataURL);
  }, [onSave]);

  return (
    <div className="space-y-3">
      <div
        ref={containerRef}
        className="relative rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden cursor-crosshair"
      >
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="touch-none"
        />
        {!hasDrawn && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center text-slate-300 dark:text-slate-600">
              <PenTool size={28} className="mx-auto mb-2" />
              <p className="text-sm font-medium">Dibuje su firma aqui</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={clearCanvas}
          className="btn-secondary px-4 py-2 text-sm flex items-center gap-2"
        >
          <Eraser size={14} />
          Limpiar
        </button>
        <button
          type="button"
          onClick={saveSignature}
          disabled={!hasDrawn}
          className="btn-primary px-4 py-2 text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save size={14} />
          Guardar firma
        </button>
      </div>
    </div>
  );
}
