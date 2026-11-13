"use client";

import React, { useEffect } from "react";

interface ThemeSyncProps {
  primaryColor?: string;
}

export function ThemeSync({ primaryColor }: ThemeSyncProps) {
  const color = primaryColor || "#780000";

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.style.setProperty("--raheeb-primary", color);
      document.documentElement.style.setProperty(
        "--raheeb-primary-hover",
        `color-mix(in srgb, ${color} 85%, black)`
      );
      document.documentElement.style.setProperty(
        "--raheeb-primary-light",
        `color-mix(in srgb, ${color} 10%, white)`
      );
    }
  }, [color]);

  return (
    <style id="dynamic-raheeb-theme">{`
      :root {
        --raheeb-primary: ${color} !important;
        --raheeb-primary-hover: color-mix(in srgb, ${color} 85%, black) !important;
        --raheeb-primary-light: color-mix(in srgb, ${color} 10%, white) !important;
      }
      .bg-\\[\\#780000\\],
      .bg-raheeb-primary {
        background-color: var(--raheeb-primary) !important;
      }
      .hover\\:bg-\\[\\#5c0000\\]:hover,
      .hover\\:bg-\\[\\#600000\\]:hover,
      .hover\\:bg-red-950:hover,
      .hover\\:bg-raheeb-primary-hover:hover {
        background-color: var(--raheeb-primary-hover) !important;
      }
      .text-\\[\\#780000\\],
      .text-raheeb-primary {
        color: var(--raheeb-primary) !important;
      }
      .border-\\[\\#780000\\],
      .border-raheeb-primary {
        border-color: var(--raheeb-primary) !important;
      }
      .focus\\:ring-\\[\\#780000\\]:focus {
        --tw-ring-color: var(--raheeb-primary) !important;
      }
      .focus-within\\:border-\\[\\#780000\\]:focus-within {
        border-color: var(--raheeb-primary) !important;
      }
    `}</style>
  );
}
