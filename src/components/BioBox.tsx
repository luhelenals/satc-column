'use client';

import React, { useState } from 'react';

export default function BioBox() {
  const [imgError, setImgError] = useState(false);

  return (
    <aside className="y2k-window mb-6 relative">
      <div className="y2k-titlebar">
        <span>★ about the columnist // welcome.exe</span>
        <div className="flex gap-1">
          <span className="w-3 h-3 bg-white border border-[#a85b82] inline-block text-[9px] leading-none text-center">
            _
          </span>
          <span className="w-3 h-3 bg-white border border-[#a85b82] inline-block text-[9px] leading-none text-center">
            ×
          </span>
        </div>
      </div>

      <div className="p-4 flex flex-col sm:flex-row gap-4 items-center sm:items-start bg-gradient-to-b from-white to-[#fff7fb]">
        {/* Photo Frame */}
        <div className="shrink-0">
          <div className="p-1.5 bg-white border-2 border-dashed border-[#d68fb0] shadow-sm">
            {!imgError ? (
              <img
                src="/avatar.jpg"
                alt="Columnist profile"
                className="w-28 h-28 object-cover border border-[#c97da3]"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="w-28 h-28 bg-[#ffe3f0] border border-[#c97da3] flex flex-col items-center justify-center text-center p-2 text-[11px] text-[#9e225c]">
                <span className="text-2xl mb-1">📸</span>
                <span>Add public/avatar.jpg</span>
              </div>
            )}
          </div>
          <div className="mt-1.5 text-center text-[10px] font-mono text-[#9e225c] bg-[#ffe6f2] border border-[#e3a8c5] py-0.5">
            status: typing... 🍸
          </div>
        </div>

        {/* Bio Text */}
        <div className="flex-1 text-center sm:text-left">
          <h2 className="font-serif text-xl font-bold text-[#9e225c] mb-1">
            Couldn&apos;t help but wonder...
          </h2>
          <p className="text-[13px] leading-relaxed text-[#33222b] mb-3">
            Welcome to my digital corner of the internet. Every week, I sit down
            with a drink and write candid columns about{' '}
            <strong>girly subjects, modern romance, politics, LGBT life,</strong>{' '}
            and <strong>tech</strong>. Think late-night diary entries meets
            2000s web nostalgia.
          </p>

          {/* Topic Tags (Inspired by early YouTube / Neocities tags) */}
          <div className="flex flex-wrap justify-center sm:justify-start gap-1.5 text-[11px]">
            {['#girly-talk', '#politics', '#lgbt', '#tech', '#dating', '#city-life'].map(
              (tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 bg-[#fff0f7] border border-[#d68fb0] text-[#8a1c50] font-mono"
                >
                  {tag}
                </span>
              )
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}