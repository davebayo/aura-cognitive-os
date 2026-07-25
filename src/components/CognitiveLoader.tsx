"use client";

import { motion } from "framer-motion";

export default function CognitiveLoader() {
  return (
    <div className="w-full flex-1 flex flex-col items-center justify-center my-8 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative w-full max-w-sm rounded-3xl p-8 bg-white/30 dark:bg-black/30 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-[0_8px_32px_0_rgba(224,195,252,0.25)] flex flex-col items-center space-y-6 overflow-hidden"
      >
        {/* Ambient Glowing Background Effect */}
        <motion.div
          animate={{
            opacity: [0.3, 0.6, 0.3],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -inset-10 bg-gradient-to-tr from-[#E0C3FC]/30 via-[#FFD1C8]/40 to-[#E0C3FC]/30 blur-3xl pointer-events-none"
        />

        {/* Header Skeleton Placeholder */}
        <motion.div
          animate={{
            opacity: [0.5, 0.85, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="relative z-10 h-7 w-3/4 rounded-full bg-gradient-to-r from-[#E0C3FC]/60 via-[#FFD1C8]/70 to-[#E0C3FC]/60 shadow-sm"
        />

        {/* Main Outfit Card Skeleton Placeholder */}
        <motion.div
          animate={{
            opacity: [0.6, 0.9, 0.6],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.2,
          }}
          className="relative z-10 h-60 w-full rounded-2xl bg-gradient-to-br from-[#E0C3FC]/40 via-[#FFD1C8]/50 to-[#E0C3FC]/30 border border-white/30 dark:border-white/10 shadow-inner flex items-center justify-center overflow-hidden"
        >
          {/* Subtle animated shimmer line across the card */}
          <motion.div
            animate={{
              x: ["-100%", "200%"],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
          />
        </motion.div>

        {/* Text Lines Skeleton Placeholders */}
        <div className="relative z-10 w-full space-y-3 flex flex-col items-center">
          <motion.div
            animate={{
              opacity: [0.4, 0.8, 0.4],
            }}
            transition={{
              duration: 2.2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.3,
            }}
            className="h-3.5 w-5/6 rounded-full bg-gradient-to-r from-[#E0C3FC]/50 to-[#FFD1C8]/50"
          />
          <motion.div
            animate={{
              opacity: [0.4, 0.7, 0.4],
            }}
            transition={{
              duration: 2.4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5,
            }}
            className="h-3 w-2/3 rounded-full bg-gradient-to-r from-[#FFD1C8]/50 to-[#E0C3FC]/50"
          />
        </div>

        {/* Pulsating Status Text */}
        <motion.p
          animate={{
            opacity: [0.5, 1, 0.5],
            scale: [0.98, 1.01, 0.98],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="relative z-10 font-[family-name:var(--font-cormorant)] text-lg italic text-black/75 dark:text-white/80 tracking-wide text-center pt-2"
        >
          Aura is orchestrating your look...
        </motion.p>
      </motion.div>
    </div>
  );
}
