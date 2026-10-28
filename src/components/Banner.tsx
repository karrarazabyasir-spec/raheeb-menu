"use client";

import React from "react";
import { Sparkles, Tag } from "lucide-react";

interface BannerProps {
  message?: string;
  active?: boolean;
}

export function Banner({ message, active = true }: BannerProps) {
  if (!active || !message) return null;

  return (
    <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-red-950 font-bold px-4 py-2.5 shadow-sm border-b border-amber-600/30">
      <div className="max-w-6xl mx-auto flex items-center justify-center gap-2 text-xs sm:text-sm text-center">
        <Sparkles className="w-4 h-4 text-red-900 shrink-0 animate-pulse" />
        <span className="tracking-wide">{message}</span>
        <Tag className="w-3.5 h-3.5 text-red-900 shrink-0 hidden sm:inline" />
      </div>
    </div>
  );
}
