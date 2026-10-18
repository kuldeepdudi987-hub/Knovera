import React, { useRef, useState, useEffect } from 'react';
import { Edit2, Minus, Square, Circle, Eraser, Trash2, Download, Undo2 } from 'lucide-react';

const COLORS = [
  { name: 'Cyan Glow', value: '#00F2FE' },
  { name: 'Electric Purple', value: '#9d4edd' },
  { name: 'Golden Amber', value: '#fbbf24' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Pure White', value: '#ffffff' },
  { name: 'Coral Red', value: '#ef4444' }
];

export default function WhiteboardCanvas({ socket, sessionId }) {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const historyRef = useRef([]);

  const [tool, setTool] = useState('pen'); // 'pen' | 'line' | 'rect' | 'circle' | 'eraser'
  const [color, setColor] = useState('#00F2FE');
  const [lineWidth, setLineWidth] = useState(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [snapshot, setSnapshot] = useState(null);

  // Setup canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const parent = canvas.parentElement;
    canvas.width = parent.clientWidth * 2;
    canvas.height = (parent.clientHeight || 550) * 2;
    canvas.style.width = `${parent.clientWidth}px`;
    canvas.style.height = `${parent.clientHeight || 550}px`;

    const ctx = canvas.getContext('2d');
    ctx.scale(2, 2);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    contextRef.current = ctx;

    // Fill initial background
    ctx.fillStyle = '#0a0f1d';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Save initial state
    saveState();

    // Socket.io sync listeners
    if (socket) {
      socket.on('whiteboard_draw', (data) => {
        handleRemoteDraw(data);
      });

      socket.on('whiteboard_clear', () => {
        clearLocalCanvas(false);
      });
    }

    return () => {
      if (socket) {
        socket.off('whiteboard_draw');
        socket.off('whiteboard_clear');
      }
    };
  }, [socket]);

  // Update stroke styles
  useEffect(() => {
    if (contextRef.current) {
      contextRef.current.strokeStyle = tool === 'eraser' ? '#0a0f1d' : color;
      contextRef.current.lineWidth = tool === 'eraser' ? lineWidth * 3 : lineWidth;
    }
  }, [color, lineWidth, tool]);

  const saveState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (historyRef.current.length > 20) historyRef.current.shift();
    historyRef.current.push(canvas.toDataURL());
  };

  const handleUndo = () => {
    if (historyRef.current.length <= 1) return;
    historyRef.current.pop(); // remove current
    const prev = historyRef.current[historyRef.current.length - 1];
    const img = new Image();
    img.src = prev;
    img.onload = () => {
      const canvas = canvasRef.current;
      const ctx = contextRef.current;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width / 2, canvas.height / 2);
    };
  };

  const getCanvasCoords = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e) => {
    const { x, y } = getCanvasCoords(e);
    setIsDrawing(true);
    setStartPos({ x, y });

    const canvas = canvasRef.current;
    setSnapshot(canvas.toDataURL());

    if (tool === 'pen' || tool === 'eraser') {
      contextRef.current.beginPath();
      contextRef.current.moveTo(x, y);
    }
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const { x, y } = getCanvasCoords(e);
    const ctx = contextRef.current;

    if (tool === 'pen' || tool === 'eraser') {
      ctx.lineTo(x, y);
      ctx.stroke();

      // Broadcast draw segment
      if (socket) {
        socket.emit('whiteboard_draw', {
          sessionId,
          drawData: {
            tool,
            color: tool === 'eraser' ? '#0a0f1d' : color,
            lineWidth: tool === 'eraser' ? lineWidth * 3 : lineWidth,
            type: 'pen_line',
            x,
            y
          }
        });
      }
    } else if (snapshot) {
      // For shapes, restore snapshot to preview
      const img = new Image();
      img.src = snapshot;
      img.onload = () => {
        const canvas = canvasRef.current;
        ctx.clearRect(0, 0, canvas.width / 2, canvas.height / 2);
        ctx.drawImage(img, 0, 0, canvas.width / 2, canvas.height / 2);

        ctx.beginPath();
        if (tool === 'line') {
          ctx.moveTo(startPos.x, startPos.y);
          ctx.lineTo(x, y);
        } else if (tool === 'rect') {
          ctx.strokeRect(startPos.x, startPos.y, x - startPos.x, y - startPos.y);
        } else if (tool === 'circle') {
          const radius = Math.sqrt(Math.pow(x - startPos.x, 2) + Math.pow(y - startPos.y, 2));
          ctx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI);
        }
        ctx.stroke();
      };
    }
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    contextRef.current.closePath();
    saveState();
  };

  const clearLocalCanvas = (broadcast = true) => {
    const canvas = canvasRef.current;
    const ctx = contextRef.current;
    if (!canvas || !ctx) return;
    ctx.fillStyle = '#0a0f1d';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveState();

    if (broadcast && socket) {
      socket.emit('whiteboard_clear', { sessionId });
    }
  };

  const handleRemoteDraw = (data) => {
    const ctx = contextRef.current;
    if (!ctx) return;
    const prevColor = ctx.strokeStyle;
    const prevWidth = ctx.lineWidth;

    ctx.strokeStyle = data.color;
    ctx.lineWidth = data.lineWidth;

    if (data.type === 'pen_line') {
      ctx.lineTo(data.x, data.y);
      ctx.stroke();
    }

    ctx.strokeStyle = prevColor;
    ctx.lineWidth = prevWidth;
  };

  const handleExportPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `knovera-session-${sessionId}-whiteboard.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="flex flex-col h-full w-full bg-obsidian-950 rounded-xl overflow-hidden border border-slate-800 shadow-inner">
      {/* Whiteboard Toolbar */}
      <div className="flex flex-wrap items-center justify-between p-2.5 bg-obsidian-900 border-b border-slate-800 gap-2">
        {/* Tool buttons */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setTool('pen')}
            className={`p-1.5 rounded-md text-xs transition-colors ${
              tool === 'pen' ? 'bg-cyan-500 text-obsidian-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
            title="Pencil / Draw"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setTool('line')}
            className={`p-1.5 rounded-md text-xs transition-colors ${
              tool === 'line' ? 'bg-cyan-500 text-obsidian-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
            title="Straight Line"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={() => setTool('rect')}
            className={`p-1.5 rounded-md text-xs transition-colors ${
              tool === 'rect' ? 'bg-cyan-500 text-obsidian-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
            title="Rectangle"
          >
            <Square className="w-4 h-4" />
          </button>
          <button
            onClick={() => setTool('circle')}
            className={`p-1.5 rounded-md text-xs transition-colors ${
              tool === 'circle' ? 'bg-cyan-500 text-obsidian-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
            title="Circle"
          >
            <Circle className="w-4 h-4" />
          </button>
          <button
            onClick={() => setTool('eraser')}
            className={`p-1.5 rounded-md text-xs transition-colors ${
              tool === 'eraser' ? 'bg-amber-400 text-obsidian-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
            title="Eraser"
          >
            <Eraser className="w-4 h-4" />
          </button>
        </div>

        {/* Colors */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
          {COLORS.map((c) => (
            <button
              key={c.value}
              onClick={() => {
                setColor(c.value);
                if (tool === 'eraser') setTool('pen');
              }}
              style={{ backgroundColor: c.value }}
              className={`w-5 h-5 rounded-full transition-transform ${
                color === c.value && tool !== 'eraser' ? 'scale-125 ring-2 ring-white ring-offset-1 ring-offset-black' : 'opacity-80 hover:opacity-100'
              }`}
              title={c.name}
            />
          ))}
        </div>

        {/* Stroke thickness slider */}
        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
          <span>Width</span>
          <input
            type="range"
            min="1"
            max="12"
            value={lineWidth}
            onChange={(e) => setLineWidth(parseInt(e.target.value, 10))}
            className="w-16 h-1 bg-slate-700 rounded appearance-none cursor-pointer accent-cyan-400"
          />
        </div>

        {/* Actions: Undo, Clear, Export */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleUndo}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Undo"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => clearLocalCanvas(true)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/30 transition-colors"
            title="Clear Canvas"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleExportPng}
            className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-cyan-950/30 transition-colors"
            title="Download Canvas PNG"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="relative flex-1 w-full h-[520px] bg-obsidian-950 cursor-crosshair overflow-hidden">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="absolute inset-0 touch-none"
        />
      </div>
    </div>
  );
}
