"use client";

import React, { useEffect, useRef } from "react";
import animationData from "@/assets/preloader.json";

interface LottiePreloaderProps {
  text?: string;
  size?: number;
  fullScreen?: boolean;
}

export function LottiePreloader({
  text = "جاري التحميل...",
  size = 180,
  fullScreen = false,
}: LottiePreloaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let anim: any = null;
    let isMounted = true;

    import("lottie-web").then((lottieModule) => {
      if (!isMounted || !containerRef.current) return;
      const lottie = (lottieModule as any).default || lottieModule;
      anim = lottie.loadAnimation({
        container: containerRef.current,
        renderer: "svg",
        loop: true,
        autoplay: true,
        animationData: animationData,
      });
    });

    return () => {
      isMounted = false;
      if (anim && typeof anim.destroy === "function") {
        anim.destroy();
      }
    };
  }, []);

  const content = (
    <div className="flex flex-col items-center justify-center gap-2 select-none">
      <div
        ref={containerRef}
        style={{ width: `${size}px`, height: `${size}px` }}
        className="flex items-center justify-center drop-shadow-sm"
      />
      {text && (
        <p className="text-xs font-black text-stone-700 tracking-wide">
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 bg-[#fdfbf9]/95 backdrop-blur-sm flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
}
