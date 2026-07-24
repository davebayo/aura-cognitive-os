"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/utils/userContext";

interface OnboardingModalProps {
  onClose: () => void;
}

export default function OnboardingModal({ onClose }: OnboardingModalProps) {
  const { updateUserProfile } = useAuth();
  const [wardrobeStyle, setWardrobeStyle] = useState<string>("unisex");
  const [aesthetic, setAesthetic] = useState<string>("minimalist");

  const styleOptions = [
    { label: "Menswear", value: "menswear" },
    { label: "Womenswear", value: "womenswear" },
    { label: "Unisex", value: "unisex" }
  ];

  const aestheticOptions = [
    { label: "Streetwear", value: "streetwear" },
    { label: "Classic", value: "classic" },
    { label: "Vintage", value: "vintage" },
    { label: "Minimalist", value: "minimalist" }
  ];

  const handleSave = async () => {
    try {
      await updateUserProfile(wardrobeStyle, aesthetic);
      if (typeof window !== "undefined") {
        localStorage.setItem("onboarding_completed", "true");
      }
      onClose();
    } catch (error) {
      console.error("Failed to save style profile:", error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 15, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, y: 15, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 220 }}
        className="bg-[#F6F4EB] dark:bg-[#1A1A18] rounded-[2.5rem] border border-black/5 dark:border-white/10 p-8 w-full max-w-md shadow-2xl relative"
      >
        <div className="text-center flex flex-col items-center">
          <h2 className="font-[family-name:var(--font-playfair)] text-3xl font-light tracking-wide text-[#1A1A18] dark:text-[#F6F4EB]">
            Welcome to Aura
          </h2>
          <span className="text-[9px] tracking-[0.3em] text-black/40 dark:text-white/40 uppercase block mt-2 mb-8">
            Define Your Vibe
          </span>
        </div>

        {/* Question 1 */}
        <div className="mb-6">
          <p className="text-[10px] tracking-[0.2em] uppercase font-semibold text-black/50 dark:text-white/50 mb-3.5">
            1. What is your primary wardrobe style?
          </p>
          <div className="flex flex-wrap gap-2.5">
            {styleOptions.map((opt) => {
              const active = wardrobeStyle === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setWardrobeStyle(opt.value)}
                  type="button"
                  className={`px-5 py-2.5 rounded-full text-[10px] uppercase font-medium tracking-widest transition-all duration-300 border ${
                    active
                      ? "bg-[#1A1A18] text-[#F6F4EB] border-transparent dark:bg-[#F6F4EB] dark:text-[#1A1A18] shadow-sm scale-105"
                      : "bg-transparent text-black/50 border-black/10 dark:text-white/50 dark:border-white/10 hover:border-black/30 dark:hover:border-white/30"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Question 2 */}
        <div className="mb-8">
          <p className="text-[10px] tracking-[0.2em] uppercase font-semibold text-black/50 dark:text-white/50 mb-3.5">
            2. What is your preferred aesthetic?
          </p>
          <div className="flex flex-wrap gap-2.5">
            {aestheticOptions.map((opt) => {
              const active = aesthetic === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setAesthetic(opt.value)}
                  type="button"
                  className={`px-5 py-2.5 rounded-full text-[10px] uppercase font-medium tracking-widest transition-all duration-300 border ${
                    active
                      ? "bg-[#1A1A18] text-[#F6F4EB] border-transparent dark:bg-[#F6F4EB] dark:text-[#1A1A18] shadow-sm scale-105"
                      : "bg-transparent text-black/50 border-black/10 dark:text-white/50 dark:border-white/10 hover:border-black/30 dark:hover:border-white/30"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          type="button"
          className="w-full py-4 rounded-full bg-[#FFD1C8] text-[#1A1A18] font-bold tracking-widest uppercase text-xs hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_4px_14px_rgba(255,209,200,0.4)]"
        >
          Save Preferences
        </button>
      </motion.div>
    </motion.div>
  );
}
