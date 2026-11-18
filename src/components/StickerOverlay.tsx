'use client';

import React, { useState } from 'react';

interface StickerItem {
  id: string;
  src: string;
  fallbackEmoji: string;
  label: string;
  className: string;
}

const STICKERS: StickerItem[] = [
  {
    id: 'top-left',
    src: '/stickers/star-pillow-sticker.png',
    fallbackEmoji: '💋',
    label: 'made by a girl',
    className: '-top-5 -left-4 -rotate-12',
  },
  {
    id: 'top-right',
    src: '/stickers/star-pillow-sticker.png',
    fallbackEmoji: '👠',
    label: 'xoxo',
    className: 'top-24 -right-5 rotate-12',
  },
  {
    id: 'bottom-left',
    src: '/stickers/dinosaur-sticker.png',
    fallbackEmoji: '💻✨',
    label: 'columnist',
    className: '-bottom-5 left-6 -rotate-6',
  },
];

export default function StickerOverlay() {
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  return (
    <>
      {STICKERS.map((sticker) => (
        <div
          key={sticker.id}
          className={`pointer-events-none select-none absolute z-30 ${sticker.className}`}
        >
          {!failedImages[sticker.id] ? (
            <img
              src={sticker.src}
              alt={sticker.label}
              className="w-20 h-20 object-contain drop-shadow-[2px_3px_2px_rgba(0,0,0,0.25)]"
              onError={() =>
                setFailedImages((prev) => ({ ...prev, [sticker.id]: true }))
              }
            />
          ) : (
            /* Cute Y2K Scrapbook Placeholder until you add your PNGs to public/stickers/ */
            <div className="bg-white border-2 border-[#c97da3] rounded-full px-3 py-1.5 shadow-[2px_2px_0px_#c97da3] flex items-center gap-1.5 text-xs font-bold text-[#9e225c]">
              <span className="text-base">{sticker.fallbackEmoji}</span>
              <span className="font-mono tracking-tight">{sticker.label}</span>
            </div>
          )}
        </div>
      ))}
    </>
  );
}