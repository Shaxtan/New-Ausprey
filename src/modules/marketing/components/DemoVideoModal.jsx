import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import demoVideoSrc from '@/assets/Untitled design.mp4';

/**
 * DemoVideoModal — plays the product-demo video from src/assets in an
 * overlay, matching the visual language of LoginModal / DemoRequestModal
 * (dark backdrop, centered card, Escape-to-close, click-outside-to-close).
 *
 * NOTE: the source file is literally named "Untitled design.mp4" with a
 * space in it — this still works fine with Vite's asset import (spaces
 * get URL-encoded automatically), but if you ever hit an import error,
 * the simplest fix is renaming the file to something like
 * "product-demo.mp4" and updating the import path below to match.
 */
export default function DemoVideoModal({ open, onClose }) {
  const videoRef = useRef(null);

  // Escape key + body scroll lock — same convention as the other modals
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    if (open) {
      window.addEventListener('keydown', onKey);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  // Play from the start whenever the modal opens; pause when it closes
  // so it doesn't keep running silently in the background.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (open) {
      video.currentTime = 0;
      video.play().catch(() => {
        // Autoplay can be blocked by the browser in some cases — the
        // visible <video controls> lets the person press play manually.
      });
    } else {
      video.pause();
    }
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Video card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={{    opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 w-full max-w-5xl"
          >
            <button
              onClick={onClose}
              className="absolute -top-11 right-0 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            >
              <X size={18} />
            </button>

            <div className="overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl">
              <video
                ref={videoRef}
                src={demoVideoSrc}
                controls
                playsInline
                className="block aspect-video w-full"
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}