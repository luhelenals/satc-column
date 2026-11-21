'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Eraser, Trash2, Send, Lock, X } from 'lucide-react';
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
  const [hasDrawing, setHasDrawing] = useState(false);
  const [color, setColor] = useState(COLORS[0]);
  const [isEraser, setIsEraser] = useState(false);
  const [authorName, setAuthorName] = useState('');
  const [saving, setSaving] = useState(false);
  const [doodles, setDoodles] = useState<Doodle[]>([]);

  // Estados de Autenticação Admin e Modal de Exclusão
  const [isAdmin, setIsAdmin] = useState(false);
  const [pendingDeleteDoodle, setPendingDeleteDoodle] = useState<Doodle | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authenticating, setAuthenticating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    clearCanvas();
    fetchDoodles();

    // Verifica sessão atual do admin
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAdmin(!!session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAdmin(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchDoodles = async () => {
    const { data } = await supabase
      .from('guestbook_doodles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (data) setDoodles(data);
  };

  const checkCanvasHasContent = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return false;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    for (let i = 0; i < imageData.length; i += 4) {
      if (imageData[i] < 250 || imageData[i + 1] < 250 || imageData[i + 2] < 250) {
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
    setHasDrawing(false);
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

  // Executa a exclusão no banco e no Storage
  const executeDelete = async (doodle: Doodle) => {
    setDeletingId(doodle.id);
    try {
      const { error: dbError } = await supabase
        .from('guestbook_doodles')
        .delete()
        .eq('id', doodle.id);

      if (dbError) throw dbError;

      // Extrai o nome do arquivo da URL pública para apagar também do bucket
      const fileName = doodle.image_url.split('/doodles/')[1];
      if (fileName) {
        await supabase.storage.from('doodles').remove([fileName]);
      }

      setDoodles((prev) => prev.filter((item) => item.id !== doodle.id));
    } catch (err: unknown) {
      alert(
        'Erro ao apagar desenho: ' +
          (err instanceof Error ? err.message : 'Erro desconhecido')
      );
    } finally {
      setDeletingId(null);
    }
  };

  // Clique no botão de lixeira de um desenho
  const handleDeleteClick = (doodle: Doodle) => {
    if (isAdmin) {
      if (window.confirm(`Apagar o desenho de "${doodle.author_name}"?`)) {
        executeDelete(doodle);
      }
    } else {
      setPendingDeleteDoodle(doodle);
      setAuthError('');
      setShowAuthModal(true);
    }
  };

  // Login pelo pop-up e exclusão imediata após autenticar
  const handleModalLoginAndDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthenticating(true);
    setAuthError('');

    const { error } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword,
    });

    if (error) {
      setAuthError('Credenciais inválidas: ' + error.message);
      setAuthenticating(false);
      return;
    }

    setIsAdmin(true);
    setShowAuthModal(false);
    setAdminEmail('');
    setAdminPassword('');
    setAuthenticating(false);

    if (pendingDeleteDoodle) {
      const target = pendingDeleteDoodle;
      setPendingDeleteDoodle(null);
      await executeDelete(target);
    }
  };

  return (
    <>
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

          {/* Assinatura e Botão Enviar */}
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
                    className="bg-white border border-[#d68fb0] p-1.5 shadow-[2px_2px_0px_rgba(201,125,163,0.25)] group"
                  >
                    <img
                      src={item.image_url}
                      alt={`Desenho de ${item.author_name}`}
                      className="w-full h-auto border border-[#f3d1e2] bg-white"
                    />
                    <div className="flex justify-between items-center mt-1 text-[10px] font-mono text-[#8a1c50]">
                      <span className="font-bold truncate max-w-[125px]">
                        by: {item.author_name}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <span>
                          {new Date(item.created_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                          })}
                        </span>

                        <button
                          type="button"
                          disabled={deletingId === item.id}
                          onClick={() => handleDeleteClick(item)}
                          title={
                            isAdmin
                              ? 'Apagar desenho (Admin)'
                              : 'Apenas admin pode apagar'
                          }
                          className="text-[#9e225c]/60 hover:text-red-600 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Pop-up Modal de Autenticação Admin */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="y2k-window w-full max-w-xs animate-in fade-in zoom-in-95 duration-150">
            <div className="y2k-titlebar">
              <span className="flex items-center gap-1">
                <Lock className="w-3 h-3" /> admin_security.exe
              </span>
              <button
                type="button"
                onClick={() => {
                  setShowAuthModal(false);
                  setPendingDeleteDoodle(null);
                }}
                className="bg-white border border-[#a85b82] px-1 text-[10px] leading-tight cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </div>

            <form onSubmit={handleModalLoginAndDelete} className="p-4 space-y-3 bg-[#fff7fb]">
              <p className="text-[11px] text-[#5c233f] leading-snug">
                Apenas a administradora pode apagar desenhos do mural. Faça login
                para continuar:
              </p>

              {authError && (
                <div className="bg-red-100 border border-red-400 text-red-700 p-1.5 text-[11px]">
                  {authError}
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold mb-0.5">Email</label>
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full border border-[#c97da3] bg-white px-2 py-1 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold mb-0.5">Senha</label>
                <input
                  type="password"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full border border-[#c97da3] bg-white px-2 py-1 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowAuthModal(false);
                    setPendingDeleteDoodle(null);
                  }}
                  className="y2k-btn text-[11px]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={authenticating}
                  className="y2k-btn y2k-btn-pink text-[11px]"
                >
                  {authenticating ? 'Verificando...' : 'Entrar & Apagar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}