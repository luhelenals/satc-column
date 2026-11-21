'use client';

import React, { useEffect, useState } from 'react';
import { Disc3, RefreshCw, ExternalLink } from 'lucide-react';

interface TrackData {
  title: string;
  artist: string;
  albumArt: string | null;
  songUrl: string;
}

export default function SpotifyCdWidget() {
  const [track, setTrack] = useState<TrackData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRandomTopTrack = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/spotify', { cache: 'no-store' });
      const data = await res.json();
      if (data && data.title) {
        setTrack(data);
      }
    } catch {
      // Silencia falha de rede mantendo fallback visual
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRandomTopTrack();
  }, []);

  return (
    <section className="y2k-window">
      <div className="y2k-titlebar">
        <span>💿 on_repeat.mp3</span>
        <button
          type="button"
          onClick={fetchRandomTopTrack}
          disabled={loading}
          title="Sortear outra música do meu Top 10 da semana"
          className="text-[#4a1530] hover:opacity-75 cursor-pointer"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="p-3.5 bg-gradient-to-b from-white to-[#fff5fa] flex flex-col items-center text-center">
        {/* CD Animado Girando */}
        <div className="relative w-28 h-28 mb-3 flex items-center justify-center">
          <div
            className="w-full h-full rounded-full border-2 border-[#c97da3] shadow-md overflow-hidden relative animate-[spin_6s_linear_infinite]"
            style={{
              background:
                'conic-gradient(from 0deg, #ffd6e8, #ffffff, #c2e9fb, #ff9ec7, #ffffff, #ffd6e8)',
            }}
          >
            {track?.albumArt ? (
              <img
                src={track.albumArt}
                alt={track.title}
                className="w-full h-full object-cover opacity-90"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#9e225c]">
                <Disc3 className="w-10 h-10" />
              </div>
            )}

            {/* Reflexo holográfico por cima da capa */}
            <div
              className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-60"
              style={{
                background:
                  'conic-gradient(from 45deg, transparent, rgba(255,255,255,0.9), transparent, rgba(255,158,199,0.8), transparent)',
              }}
            />
          </div>

          {/* Anel plástico transparente e furo central do CD (fixos) */}
          <div className="absolute w-8 h-8 rounded-full bg-white/80 border border-[#c97da3] flex items-center justify-center pointer-events-none">
            <div className="w-3.5 h-3.5 rounded-full bg-[#fff5fa] border border-[#c97da3]" />
          </div>
        </div>

        {/* Informações da Música */}
        {loading && !track ? (
          <p className="text-[11px] font-mono text-[#8a1c50]">
            lendo faixa do CD... ⏳
          </p>
        ) : track ? (
          <div className="w-full">
            <div className="bg-[#ffe6f2] border border-[#e3a8c5] px-2 py-1 mb-1.5">
              <p
                className="font-bold text-xs text-[#4a1530] truncate"
                title={track.title}
              >
                {track.title}
              </p>
              <p
                className="text-[11px] font-mono text-[#8a1c50] truncate"
                title={track.artist}
              >
                {track.artist}
              </p>
            </div>

            <a
              href={track.songUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[10px] font-mono text-[#0033cc] hover:underline"
            >
              <span>ouvir no spotify</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        ) : (
          <p className="text-[11px] font-mono text-[#7a3556]">
            conecte o spotify no .env.local
          </p>
        )}
      </div>
    </section>
  );
}