
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Maximize, Minimize } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function FullscreenToggleButton() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isBrowserSupported, setIsBrowserSupported] = useState(false);

  useEffect(() => {
    // Check if Fullscreen API is supported when component mounts
    if (
      typeof document !== 'undefined' &&
      (document.documentElement.requestFullscreen ||
        (document.documentElement as any).mozRequestFullScreen ||
        (document.documentElement as any).webkitRequestFullscreen ||
        (document.documentElement as any).msRequestFullscreen)
    ) {
      setIsBrowserSupported(true);
    }

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    // Initial check in case fullscreen was entered via F11 before component mounted
    if (typeof document !== 'undefined') {
        handleFullscreenChange();
    }


    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (!isBrowserSupported) return;

    const element = document.documentElement;

    try {
      if (!document.fullscreenElement) {
        if (element.requestFullscreen) {
          await element.requestFullscreen();
        } else if ((element as any).mozRequestFullScreen) { // Firefox
          await (element as any).mozRequestFullScreen();
        } else if ((element as any).webkitRequestFullscreen) { // Chrome, Safari and Opera
          await (element as any).webkitRequestFullscreen();
        } else if ((element as any).msRequestFullscreen) { // IE/Edge
          await (element as any).msRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).mozCancelFullScreen) { // Firefox
          await (document as any).mozCancelFullScreen();
        } else if ((document as any).webkitExitFullscreen) { // Chrome, Safari and Opera
          await (document as any).webkitExitFullscreen();
        } else if ((document as any).msExitFullscreen) { // IE/Edge
          await (document as any).msExitFullscreen();
        }
      }
    } catch (error) {
      console.error("Fullscreen API error:", error);
      // Optionally, show a toast to the user that fullscreen failed
    }
  }, [isBrowserSupported]);

  if (!isBrowserSupported) {
    // Optionally, render nothing or a disabled button with a tooltip
    return null; 
  }

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? (
              <Minimize className="h-5 w-5" />
            ) : (
              <Maximize className="h-5 w-5" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>{isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen (F11)'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
