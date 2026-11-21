'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Eraser, Trash2, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Doodle {
  id: string;
  image_url: string;
  author_name: string;
  created_at: string;
}

const COLORS = [
  '#2b1d26', // Preto/Vinho escuro
  '#ff4d94', // Rosa choque
  '#ff9ec7', // Rosa pastel
  '#9e225c', // Magenta
  '#0033cc', // Azul link 2000s
  '#33b5e5', // Azul céu
  '#2eb872', // Verde
  '#ffbb33', // Amarelo
];

export default function GuestbookCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawing, setHasDrawing] = useState(false); // Controla se há algo desenhado
  const [color, setColor] = useState(COLORS[0]);
  const [isEraser, setIsEraser] = useState(false);
  const [authorName, setAuthorName] = useState('');
  const [saving, setSaving] = useState(false);
  const [doodles, setDoodles] = useState<Doodle[]>([]);

  useEffect(() => {
    clearCanvas();
    fetchDoodles();
  }, []);

  const fetchDoodles = async () => {
    const { data } = await supabase
      .from('guestbook_doodles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (data) setDoodles(data);
  };

  // Verifica se existe pelo menos um pixel não-branco no canvas
  const checkCanvasHasContent = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return false;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    for (let i = 0; i < imageData.length; i += 4) {
      const r = imageData[i];
      const g = imageData[i + 1];
      const b = imageData[i + 2];
      if (r < 250 || g < 250 || b < 250) {
        return true;
      }
    }
    return false;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasDrawing(false); // Reseta para bloqueado ao limpar
  };

  const getCoordinates = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);

    // Garante que um simples ponto/clique também registre desenho
    if (!isEraser) {
      ctx.fillStyle = color;
      ctx.fillRect(x, y, 2, 2);
      setHasDrawing(true);
    }
  };

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = isEraser ? 14 : 3;
    ctx.strokeStyle = isEraser ? '#ffffff' : color;

    ctx.lineTo(x, y);
    ctx.stroke();

    if (!isEraser && !hasDrawing) {
      setHasDrawing(true);
    }
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    // Revalida caso o visitante tenha apagado tudo com a borracha
    setHasDrawing(checkCanvasHasContent());
  };

  const handleSaveDoodle = async () => {
    if (!hasDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    setSaving(true);
    try {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/png')
      );
      if (!blob) throw new Error('Falha ao gerar imagem.');

      const fileName = `doodle-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 7)}.png`;

      const { error: uploadError } = await supabase.storage
        .from('doodles')
        .upload(fileName, blob, { contentType: 'image/png' });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('doodles')
        .getPublicUrl(fileName);

      const { error: dbError } = await supabase
        .from('guestbook_doodles')
        .insert([
          {
            image_url: urlData.publicUrl,
            author_name: authorName.trim() || 'visitante',
          },
        ]);

      if (dbError) throw dbError;

      clearCanvas();
      setAuthorName('');
      await fetchDoodles();
    } catch (err: unknown) {
      alert(
        'Erro ao salvar desenho: ' +
          (err instanceof Error ? err.message : 'Erro desconhecido')
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <aside className="y2k-window">
      <div className="y2k-titlebar">
        <span>🎨 paint_guestbook.exe</span>
        <span className="text-[10px] font-mono">deixe um recado!</span>
      </div>

      <div className="p-3 bg-[#fff7fb] space-y-2.5">
        {/* Barra de Ferramentas */}
        <div className="flex flex-wrap items-center justify-between gap-1.5 bg-[#ffe3f0] p-1.5 border border-[#d68fb0]">
          <div className="flex flex-wrap gap-1">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  setColor(c);
                  setIsEraser(false);
                }}
                style={{ backgroundColor: c }}
                className={`w-4 h-4 border ${
                  !isEraser && color === c
                    ? 'border-white ring-2 ring-[#4a1530] scale-110'
                    : 'border-[#4a1530]/40'
                }`}
                title="Escolher cor"
              />
            ))}
          </div>

          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setIsEraser(!isEraser)}
              className={`y2k-btn !px-1.5 !py-0.5 text-[10px] ${
                isEraser ? '!bg-[#ff9ec7]' : ''
              }`}
              title="Borracha"
            >
              <Eraser className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={clearCanvas}
              className="y2k-btn !px-1.5 !py-0.5 text-[10px]"
              title="Limpar tela"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Área de Desenho */}
        <div className="border-2 border-inset border-[#c97da3] bg-white">
          <canvas
            ref={canvasRef}
            width={260}
            height={170}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="w-full h-auto block cursor-crosshair touch-none"
          />
        </div>

        {/* Assinatura e Botão Enviar (bloqueado se canvas vazio) */}
        <div className="flex gap-1.5">
          <input
            type="text"
            maxLength={22}
            placeholder="seu nome (opcional)"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            className="flex-1 min-w-0 border border-[#c97da3] bg-white px-2 py-1 text-[11px] font-mono focus:outline-none"
          />
          <button
            type="button"
            disabled={saving || !hasDrawing}
            onClick={handleSaveDoodle}
            title={!hasDrawing ? 'Desenhe algo antes de enviar!' : 'Enviar desenho'}
            className={`y2k-btn y2k-btn-pink !px-2.5 !py-1 text-[11px] shrink-0 ${
              !hasDrawing || saving ? 'opacity-45 !cursor-not-allowed' : ''
            }`}
          >
            <Send className="w-3 h-3" />
            <span>{saving ? '...' : 'Enviar'}</span>
          </button>
        </div>

        {/* Mural de Desenhos Salvos */}
        <div className="pt-2 border-t border-dashed border-[#d68fb0]">
          <div className="text-[11px] font-mono font-bold text-[#8a1c50] mb-2">
            ★ mural dos visitantes ({doodles.length})
          </div>

          <div className="max-h-[460px] overflow-y-auto space-y-2.5 pr-1">
            {doodles.length === 0 ? (
              <p className="text-[11px] text-center text-[#7a3556] py-3 font-mono">
                ninguém desenhou ainda... seja o primeiro! ✨
              </p>
            ) : (
              doodles.map((item) => (
                <div
                  key={item.id}
                  className="bg-white border border-[#d68fb0] p-1.5 shadow-[2px_2px_0px_rgba(201,125,163,0.25)]"
                >
                  <img
                    src={item.image_url}
                    alt={`Desenho de ${item.author_name}`}
                    className="w-full h-auto border border-[#f3d1e2] bg-white"
                  />
                  <div className="flex justify-between items-center mt-1 text-[10px] font-mono text-[#8a1c50]">
                    <span className="font-bold truncate max-w-[140px]">
                      by: {item.author_name}
                    </span>
                    <span>
                      {new Date(item.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}