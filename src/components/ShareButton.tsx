'use client';

import React, { useState } from 'react';
import { Share2, Check } from 'lucide-react';

interface ShareButtonProps {
  path?: string; // Optional specific post path, e.g., "/post/my-slug"
  label?: string;
}

export default function ShareButton({ path, label = 'Share' }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = path
      ? `${window.location.origin}${path}`
      : window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: document.title,
          url,
        });
        return;
      } catch {
        // Fallback to clipboard copy if user cancels native share sheet
      }
    }

    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <button onClick={handleShare} className="y2k-btn" type="button">
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5 text-green-700" />
          <span>Link Copied!</span>
        </>
      ) : (
        <>
          <Share2 className="w-3.5 h-3.5" />
          <span>{label}</span>
        </>
      )}
    </button>
  );
}