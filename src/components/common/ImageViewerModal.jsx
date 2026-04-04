import React, { useState, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { X, ZoomIn, ZoomOut, RotateCw, Download, ChevronLeft, ChevronRight, Loader2, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

const useRadioImages = (examenId) =>
  useQuery({
    queryKey: ['radio-images', examenId],
    queryFn: async () => {
      if (!examenId) return [];
      const { data: images, error } = await supabase
        .from('images_radiologiques')
        .select('id, url_stockage, type_image, description')
        .eq('examen_id', examenId);
      if (error) throw error;
      if (!images?.length) return [];
      const withUrls = await Promise.all(
        images.map(async (img) => {
          const { data: signed } = await supabase.storage
            .from('images_radiologiques')
            .createSignedUrl(img.url_stockage, 3600);
          return { ...img, signedUrl: signed?.signedUrl || null };
        })
      );
      return withUrls;
    },
    enabled: !!examenId,
    staleTime: 1000 * 60 * 50,
  });

const ThumbnailStrip = ({ images, activeIndex, onSelect }) => (
  <div className="flex gap-2 overflow-x-auto p-3 bg-slate-950/80 flex-shrink-0">
    {images.map((img, i) => (
      <button
        key={img.id}
        onClick={() => onSelect(i)}
        className={cn(
          'h-16 w-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all',
          i === activeIndex
            ? 'border-blue-400 shadow-lg scale-105'
            : 'border-slate-700 opacity-60 hover:opacity-100 hover:border-slate-500'
        )}
      >
        {img.signedUrl ? (
          <img src={img.signedUrl} alt={`Img ${i + 1}`} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-slate-800 flex items-center justify-center">
            <ImageIcon className="h-4 w-4 text-slate-500" />
          </div>
        )}
      </button>
    ))}
  </div>
);

export const ImageViewerModal = ({ examenId, onClose, initialIndex = 0 }) => {
  const { t } = useLanguage();
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const { data: images = [], isLoading } = useRadioImages(examenId);
  const currentImage = images[activeIndex];

  const handlePrev = useCallback(() => {
    setActiveIndex(i => (i > 0 ? i - 1 : images.length - 1));
    setZoom(1); setRotation(0);
  }, [images.length]);

  const handleNext = useCallback(() => {
    setActiveIndex(i => (i < images.length - 1 ? i + 1 : 0));
    setZoom(1); setRotation(0);
  }, [images.length]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'Escape') onClose();
      if (e.key === '+') setZoom(z => Math.min(4, z + 0.25));
      if (e.key === '-') setZoom(z => Math.max(0.25, z - 0.25));
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handlePrev, handleNext, onClose]);

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex flex-col pointer-events-none">
        <div className="pointer-events-auto flex flex-col h-full max-w-6xl mx-auto w-full">
          {/* Top Bar */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-950/95 border-b border-slate-800 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <ImageIcon className="h-4 w-4 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">{currentImage?.type_image || t('radiological_image')}</p>
                <p className="text-xs text-slate-400 font-medium">
                  {activeIndex + 1} / {images.length}{currentImage?.description && ` — ${currentImage.description}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setZoom(z => Math.max(0.25, z - 0.25))} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"><ZoomOut className="h-4 w-4" /></button>
              <span className="text-xs font-bold text-slate-300 min-w-[44px] text-center bg-slate-800 px-2 py-2 rounded-lg">{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom(z => Math.min(4, z + 0.25))} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"><ZoomIn className="h-4 w-4" /></button>
              <button onClick={() => setRotation(r => r + 90)} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors ml-1"><RotateCw className="h-4 w-4" /></button>
              {currentImage?.signedUrl && (
                <a href={currentImage.signedUrl} download className="p-2 rounded-lg bg-blue-900/40 hover:bg-blue-900/60 text-blue-400 transition-colors ml-1"><Download className="h-4 w-4" /></a>
              )}
              <button onClick={onClose} className="p-2 rounded-lg bg-red-900/40 hover:bg-red-900 text-red-400 hover:text-white transition-colors ml-2"><X className="h-4 w-4" /></button>
            </div>
          </div>

          {/* Image Area */}
          <div className="flex-1 flex items-center justify-center bg-slate-950 overflow-hidden relative">
            {isLoading ? (
              <div className="text-center text-slate-500">
                <Loader2 className="h-10 w-10 animate-spin mx-auto mb-3 text-blue-500/60" />
                <p className="text-sm font-bold">{t('loading_images')}</p>
              </div>
            ) : images.length === 0 ? (
              <div className="text-center text-slate-500 p-12">
                <ImageIcon className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <p className="text-base font-bold">{t('no_images_available')}</p>
                <p className="text-sm mt-1 opacity-60">{t('image_viewer_hint')}</p>
              </div>
            ) : currentImage?.signedUrl ? (
              <img
                src={currentImage.signedUrl}
                alt={currentImage.description || t('radiological_image')}
                className="max-h-full max-w-full object-contain transition-transform duration-200 select-none"
                style={{ transform: `scale(${zoom}) rotate(${rotation}deg)` }}
                draggable={false}
              />
            ) : (
              <div className="text-center text-slate-600">
                <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p className="text-sm font-bold">{t('url_not_available')}</p>
              </div>
            )}

            {images.length > 1 && (
              <>
                <button onClick={handlePrev} className="absolute left-4 p-3 rounded-full bg-slate-800/80 hover:bg-slate-700 text-white transition-all"><ChevronLeft className="h-5 w-5" /></button>
                <button onClick={handleNext} className="absolute right-4 p-3 rounded-full bg-slate-800/80 hover:bg-slate-700 text-white transition-all"><ChevronRight className="h-5 w-5" /></button>
              </>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 0 && (
            <ThumbnailStrip images={images} activeIndex={activeIndex} onSelect={(i) => { setActiveIndex(i); setZoom(1); setRotation(0); }} />
          )}
        </div>
      </div>
    </>
  );
};
