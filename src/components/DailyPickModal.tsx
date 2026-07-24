"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles } from "lucide-react";
import Image from "next/image";

export interface OutfitDetail {
  top: string | null;
  bottom: string | null;
  shoes: string | null;
  reasoning?: string;
  dateSaved?: string;
  error?: string;
}

interface DailyPickModalProps {
  isOpen: boolean;
  onClose: () => void;
  outfit?: OutfitDetail | null;
}

const isValidUrl = (url: any): url is string => {
  return (
    typeof url === "string" &&
    url.trim().length > 0 &&
    (url.startsWith("http://") || url.startsWith("https://"))
  );
};

const safeRenderText = (val: any): string => {
  if (val === null || val === undefined) return "";
  if (typeof val === "string") return val;
  return JSON.stringify(val);
};

export default function DailyPickModal({
  isOpen,
  onClose,
  outfit,
}: DailyPickModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 dark:bg-black/85 backdrop-blur-md z-[100] flex items-center justify-center p-4">
        {/* Modal Backdrop click handler */}
        <div className="absolute inset-0" onClick={onClose} />

        <motion.div
          initial={{ scale: 0.9, y: 15, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, y: 15, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 220 }}
          className="bg-[#F6F4EB] dark:bg-[#1A1A18] rounded-[2.5rem] border border-black/5 dark:border-white/10 p-8 w-full max-w-lg shadow-2xl relative z-10 max-h-[90vh] overflow-y-auto"
        >
          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-6 right-6 text-black/40 hover:text-black dark:text-white/40 dark:hover:text-white transition-colors p-1"
          >
            <X size={20} />
          </button>

          {/* Header */}
          <div className="text-center flex flex-col items-center mb-6">
            <h2 className="font-serif text-3xl font-light tracking-[0.2em] text-[#1A1A18] dark:text-[#F6F4EB] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#FFD1C8]" />
              AURA'S LOOK
            </h2>
            <span className="text-[9px] tracking-[0.3em] text-black/40 dark:text-white/40 uppercase block mt-1">
              Curated Outfit Details
            </span>
          </div>

          {/* Main Content */}
          <div className="space-y-6">
            {/* Reasoning / Notes */}
            <div className="bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 rounded-2xl p-5 text-center">
              <p className="text-[10px] tracking-[0.2em] uppercase text-black/40 dark:text-white/40 mb-2 font-semibold">
                Aura's Notes
              </p>
              <p className="font-[family-name:var(--font-cormorant)] text-base italic text-[#1A1A18] dark:text-[#F6F4EB] leading-relaxed">
                "{safeRenderText(outfit?.reasoning) || "A tailored ensemble handpicked from your wardrobe collection."}"
              </p>
            </div>

            {/* Side-by-side 3-card Layout */}
            <div className="grid grid-cols-3 gap-3 md:gap-4">
              {/* Top */}
              <div className="flex flex-col items-center bg-white/40 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl p-3">
                <span className="text-[8px] tracking-widest uppercase font-semibold text-black/40 dark:text-white/40 mb-2">
                  Top
                </span>
                {outfit?.top && isValidUrl(outfit.top) ? (
                  <div className="relative w-full aspect-square flex items-center justify-center">
                    <Image
                      src={outfit.top}
                      alt="Top"
                      width={120}
                      height={120}
                      className="object-contain max-h-full max-w-full drop-shadow-md rounded-lg"
                    />
                  </div>
                ) : (
                  <div className="w-full aspect-square bg-black/5 dark:bg-white/5 rounded-lg flex items-center justify-center text-[9px] text-black/40 dark:text-white/40 text-center p-2 font-medium">
                    No top
                  </div>
                )}
              </div>

              {/* Bottom */}
              <div className="flex flex-col items-center bg-[#FDFAF5] dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl p-3">
                <span className="text-[8px] tracking-widest uppercase font-semibold text-black/40 dark:text-white/40 mb-2">
                  Bottom
                </span>
                {outfit?.bottom && isValidUrl(outfit.bottom) ? (
                  <div className="relative w-full aspect-square flex items-center justify-center">
                    <Image
                      src={outfit.bottom}
                      alt="Bottom"
                      width={120}
                      height={120}
                      className="object-contain max-h-full max-w-full drop-shadow-md rounded-lg"
                    />
                  </div>
                ) : (
                  <div className="w-full aspect-square bg-black/5 dark:bg-white/5 rounded-lg flex items-center justify-center text-[9px] text-black/40 dark:text-white/40 text-center p-2 font-medium">
                    No bottom
                  </div>
                )}
              </div>

              {/* Shoes */}
              <div className="flex flex-col items-center bg-[#FDFAF5] dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl p-3">
                <span className="text-[8px] tracking-widest uppercase font-semibold text-black/40 dark:text-white/40 mb-2">
                  Shoes
                </span>
                {outfit?.shoes && isValidUrl(outfit.shoes) ? (
                  <div className="relative w-full aspect-square flex items-center justify-center">
                    <Image
                      src={outfit.shoes}
                      alt="Shoes"
                      width={120}
                      height={120}
                      className="object-contain max-h-full max-w-full drop-shadow-md rounded-lg"
                    />
                  </div>
                ) : (
                  <div className="w-full aspect-square bg-black/5 dark:bg-white/5 rounded-lg flex items-center justify-center text-[9px] text-black/40 dark:text-white/40 text-center p-2 font-medium">
                    No shoes
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3.5 rounded-full border border-black/10 dark:border-white/10 text-black/70 dark:text-white/70 text-xs font-semibold tracking-widest uppercase hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
