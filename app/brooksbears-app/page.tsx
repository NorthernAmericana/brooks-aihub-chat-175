"use client";

import { ArrowLeft, Download, Check, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useRef, useCallback } from "react";

export default function BrooksBearsAppPage() {
  const router = useRouter();
  const [isInstalled, setIsInstalled] = useState(false);
  const [showDeletePrompt, setShowDeletePrompt] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Swipe gesture handling
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const isDragging = useRef<boolean>(false);
  const startX = useRef<number>(0);

  // Gallery images - using the BrooksBears icon for demonstration
  const galleryImages = [
    "/icons/brooksbears-appicon.png",
    "/icons/brooksbears-appicon.png",
    "/icons/brooksbears-appicon.png",
  ];

  const handleInstallClick = () => {
    if (!isInstalled) {
      // Install the app
      setIsInstalled(true);
    } else {
      // Show delete prompt
      setShowDeletePrompt(true);
    }
  };

  const handleDeleteConfirm = () => {
    setIsInstalled(false);
    setShowDeletePrompt(false);
  };

  const handleDeleteCancel = () => {
    setShowDeletePrompt(false);
  };

  const handleGoToApp = () => {
    router.push("/BrooksBears/");
  };

  // Touch swipe handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(() => {
    const swipeDistance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (Math.abs(swipeDistance) > minSwipeDistance) {
      if (swipeDistance > 0) {
        // Swipe left - go to previous session (for now, go back)
        router.back();
      } else {
        // Swipe right - go to homepage
        router.push("/");
      }
    }

    touchStartX.current = 0;
    touchEndX.current = 0;
  }, [router]);

  // Mouse drag handlers for desktop
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    startX.current = e.clientX;
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return;
    touchEndX.current = e.clientX;
  }, []);

  const handleMouseUp = useCallback(() => {
    if (!isDragging.current) return;
    
    const swipeDistance = startX.current - touchEndX.current;
    const minSwipeDistance = 100;

    if (Math.abs(swipeDistance) > minSwipeDistance) {
      if (swipeDistance > 0) {
        // Swipe left - go to previous session (for now, go back)
        router.back();
      } else {
        // Swipe right - go to homepage
        router.push("/");
      }
    }

    isDragging.current = false;
    startX.current = 0;
    touchEndX.current = 0;
  }, [router]);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % galleryImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? galleryImages.length - 1 : prev - 1
    );
  };

  return (
    <div
      ref={containerRef}
      className="app-page-overlay fixed inset-0 z-50 flex flex-col bg-gradient-to-br from-[#140d12] via-[#1a0f16] to-[#120c16] overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Header */}
      <div className="app-page-header sticky top-0 z-10 flex items-center gap-4 border-b border-white/10 bg-[#140d12]/95 px-4 py-3 backdrop-blur-sm">
        <button
          aria-label="Go back"
          className="flex h-10 w-10 items-center justify-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white"
          onClick={() => router.back()}
          type="button"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="font-pixel text-lg text-white">BrooksBears</h1>
      </div>

      {/* Content */}
      <div className="app-page-content flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {/* Hero Section with Device Frame */}
        <div className="hero-section flex flex-col items-center space-y-4">
          {/* Device Frame with Mascot */}
          <div className="device-frame relative w-full max-w-sm">
            <div className="aspect-[9/16] rounded-3xl border-4 border-white/20 bg-gradient-to-br from-white/10 to-white/5 p-6 backdrop-blur-sm overflow-hidden shadow-2xl">
              {/* Mascot/Icon */}
              <div className="flex items-center justify-center h-full">
                <div className="relative w-48 h-48">
                  <Image
                    src="/icons/brooksbears-appicon.png"
                    alt="BrooksBears Mascot"
                    width={192}
                    height={192}
                    className="object-contain drop-shadow-2xl"
                    priority
                  />
                </div>
              </div>
              
              {/* Tap to Speak UI Element */}
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-48">
                <div className="rounded-full bg-white/10 border border-white/20 backdrop-blur-md px-6 py-3 text-center">
                  <p className="text-white/90 text-sm font-medium">Tap to Speak</p>
                  <div className="flex justify-center gap-1 mt-2">
                    <div className="w-1 h-3 bg-white/60 rounded-full animate-pulse" />
                    <div className="w-1 h-4 bg-white/70 rounded-full animate-pulse delay-75" />
                    <div className="w-1 h-3 bg-white/60 rounded-full animate-pulse delay-150" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* App Title and Basic Info */}
          <div className="text-center space-y-2 max-w-md">
            <h2 className="text-2xl font-bold text-white">BrooksBears</h2>
            <p className="text-white/60 text-sm">Entertainment • 13+</p>
            <div className="flex items-center justify-center gap-4 text-sm text-white/50">
              <span className="flex items-center gap-1">⭐ 4.5</span>
              <span>10K+ downloads</span>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="description-section space-y-3 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-white">About</h3>
          <p className="text-white/70 leading-relaxed">
            AI teddy bear companion for ages 13 and up. BrooksBears provides a friendly, 
            interactive experience with Benjamin Bear, your personal AI companion. Chat, 
            play, and explore with this lovable virtual friend.
          </p>
        </div>

        {/* Routes Information */}
        <div className="routes-section space-y-3 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-white">Routes in Brooks AI HUB</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-white/70">
              <div className="w-2 h-2 rounded-full bg-blue-400" />
              <span className="text-sm font-mono">/BrooksBears/</span>
            </div>
            <p className="text-xs text-white/50 ml-4">
              Main chat interface with Benjamin Bear agent
            </p>
          </div>
        </div>

        {/* Image Gallery */}
        <div className="gallery-section space-y-3 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-white">Screenshots</h3>
          
          {/* Gallery Carousel */}
          <div className="relative">
            <div className="aspect-[16/9] rounded-xl overflow-hidden bg-white/5 border border-white/10">
              <Image
                src={galleryImages[currentImageIndex]}
                alt={`Screenshot ${currentImageIndex + 1}`}
                width={400}
                height={225}
                className="w-full h-full object-contain"
              />
            </div>
            
            {/* Navigation Buttons */}
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition hover:bg-black/70"
              aria-label="Previous image"
              type="button"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition hover:bg-black/70"
              aria-label="Next image"
              type="button"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            
            {/* Dots Indicator */}
            <div className="flex justify-center gap-2 mt-3">
              {galleryImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`h-2 w-2 rounded-full transition ${
                    index === currentImageIndex
                      ? "bg-white w-6"
                      : "bg-white/30"
                  }`}
                  aria-label={`Go to image ${index + 1}`}
                  type="button"
                />
              ))}
            </div>
          </div>
        </div>

        {/* Install/Action Buttons */}
        <div className="actions-section space-y-3">
          <button
            onClick={handleInstallClick}
            className={`w-full flex items-center justify-center gap-2 rounded-full py-4 text-base font-semibold transition ${
              isInstalled
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
            type="button"
          >
            {isInstalled ? (
              <>
                <Check className="h-5 w-5" />
                Installed
              </>
            ) : (
              <>
                <Download className="h-5 w-5" />
                Install
              </>
            )}
          </button>

          {/* Go to ATO App Button (appears after install) */}
          {isInstalled && (
            <button
              onClick={handleGoToApp}
              className="w-full flex items-center justify-center gap-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 py-4 text-base font-semibold text-white transition"
              type="button"
            >
              Go to ATO app
            </button>
          )}
        </div>

        {/* Swipe Hint */}
        <div className="swipe-hint text-center text-xs text-white/40 py-4">
          <p>Swipe right to return home • Swipe left to go back</p>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeletePrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="delete-prompt rounded-2xl border border-white/20 bg-[#1a0f16] p-6 max-w-sm w-full space-y-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-500/20 mx-auto">
              <Trash2 className="h-6 w-6 text-red-400" />
            </div>
            
            <h3 className="text-lg font-semibold text-white text-center">
              Delete BrooksBears?
            </h3>
            
            <p className="text-white/70 text-sm text-center">
              This will remove the ATO app while keeping your memories and conversations safe.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={handleDeleteCancel}
                className="flex-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 py-3 text-sm font-medium text-white transition"
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 rounded-full bg-red-600 hover:bg-red-700 py-3 text-sm font-medium text-white transition"
                type="button"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
