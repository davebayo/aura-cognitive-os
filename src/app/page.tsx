"use client";

import Image from "next/image";
import { CloudSun } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "@/firebase";
import { useAuth } from "@/utils/userContext";
import Link from "next/link";
import OnboardingModal from "@/components/OnboardingModal";

interface CurrentOutfit {
  top: string | null;
  bottom: string | null;
  shoes: string | null;
  reasoning?: string;
}

// Deep extractor to find the string URL regardless of what JSON shape Gemini returns
const extractUrl = (obj: any): string | null => {
  if (!obj) return null;
  if (typeof obj === "string") return obj;
  if (Array.isArray(obj) && obj.length > 0) return extractUrl(obj[0]);
  if (obj.url && typeof obj.url === "string") return obj.url;
  if (obj.src && typeof obj.src === "string") return obj.src;
  if (obj.link && typeof obj.link === "string") return obj.link;
  if (obj.cloudinary_url && typeof obj.cloudinary_url === "string")
    return obj.cloudinary_url;
  return null;
};

export default function DailyPick() {
  const { currentUser, userProfile } = useAuth();
  const [buttonText, setButtonText] = useState("Accept Outfit");

  // Strict UI State Waterfall Variables
  const [isFetchingWardrobe, setIsFetchingWardrobe] = useState(true);
  const [hasCompleteOutfit, setHasCompleteOutfit] = useState(false);
  const [isCurating, setIsCurating] = useState(false);
  const [currentOutfit, setCurrentOutfit] = useState<CurrentOutfit | null>(
    null,
  );

  // New Contextual Styling States
  const [occasion, setOccasion] = useState("Casual");
  const [wardrobe, setWardrobe] = useState<
    { type: string; url: string; userId?: string }[]
  >([]);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const completed = localStorage.getItem("onboarding_completed");
      if (!completed) {
        setShowOnboarding(true);
      }
    }
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const fetchWardrobe = async () => {
      try {
        setIsFetchingWardrobe(true);
        const q = query(
          collection(db, "wardrobe_inventory"),
          where("userId", "==", currentUser.uid),
        );
        const querySnapshot = await getDocs(q);

        const newWardrobe: { type: string; url: string; userId?: string }[] =
          [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.topUrl)
            newWardrobe.push({
              type: "Top",
              url: data.topUrl,
              userId: data.userId,
            });
          if (data.bottomUrl)
            newWardrobe.push({
              type: "Bottom",
              url: data.bottomUrl,
              userId: data.userId,
            });
          if (data.shoesUrl)
            newWardrobe.push({
              type: "Shoes",
              url: data.shoesUrl,
              userId: data.userId,
            });

          if (data.category && data.imageUrl) {
            const cat = data.category.toLowerCase();
            if (cat === "top" || cat === "tops")
              newWardrobe.push({
                type: "Top",
                url: data.imageUrl,
                userId: data.userId,
              });
            if (cat === "bottom" || cat === "bottoms")
              newWardrobe.push({
                type: "Bottom",
                url: data.imageUrl,
                userId: data.userId,
              });
            if (cat === "shoes" || cat === "shoe")
              newWardrobe.push({
                type: "Shoes",
                url: data.imageUrl,
                userId: data.userId,
              });
          }
        });

        const hasTop = newWardrobe.some((item) => item.type === "Top");
        const hasBottom = newWardrobe.some((item) => item.type === "Bottom");
        const hasShoes = newWardrobe.some((item) => item.type === "Shoes");

        // Drop out of fetching state
        setIsFetchingWardrobe(false);

        if (!hasTop || !hasBottom || !hasShoes) {
          setHasCompleteOutfit(false);
          return;
        }

        setWardrobe(newWardrobe);
        setHasCompleteOutfit(true); // Wait here organically
      } catch (error) {
        console.error("Error fetching items: ", error);
        setIsFetchingWardrobe(false);
      }
    };

    fetchWardrobe();
  }, [currentUser]);

  const handleStyleMyLook = async () => {
    if (isCurating) return;
    setIsCurating(true);
    setCurrentOutfit(null);

    try {
      const res = await fetch("/api/stylist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userRequest: occasion,
          weatherContext: "warm and sunny",
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to style outfit.");
      }

      const data = await res.json();
      let outfitResult = data ? data.finalOutfit || data : null;
      if (typeof outfitResult === "string") {
        try {
          outfitResult = JSON.parse(outfitResult);
        } catch (err) {
          console.error("Failed to parse finalOutfit JSON:", err);
        }
      }

      const topUrl = extractUrl(outfitResult?.top);
      const bottomUrl = extractUrl(outfitResult?.bottom);
      const shoesUrl = extractUrl(outfitResult?.shoes);

      setCurrentOutfit({
        top: topUrl,
        bottom: bottomUrl,
        shoes: shoesUrl,
        reasoning: outfitResult?.reasoning || "",
      });
    } catch (err) {
      console.error("Error curating outfit:", err);
      setCurrentOutfit(null);
    } finally {
      setIsCurating(false);
    }
  };

  const handleAcceptOutfit = async () => {
    if (
      !currentOutfit ||
      (!currentOutfit.top && !currentOutfit.bottom && !currentOutfit.shoes)
    )
      return;
    try {
      setButtonText("Saving...");
      await addDoc(collection(db, "outfit_history"), {
        top: currentOutfit.top,
        bottom: currentOutfit.bottom,
        shoes: currentOutfit.shoes,
        reasoning: currentOutfit.reasoning || "",
        userId: currentUser?.uid || "unauthenticated",
        dateSaved: new Date().toISOString(),
      });
      setButtonText("Saved!");
      setTimeout(() => setButtonText("Accept Outfit"), 2000);
    } catch (e) {
      console.error(e);
      setButtonText("Error");
      setTimeout(() => setButtonText("Accept Outfit"), 2000);
    }
  };

  const outfitStyles = [
    { classes: "z-10 relative", rotate: 0 },
    { classes: "z-20 -mt-16 ml-12 md:-mt-20 md:ml-16 relative", rotate: 2 },
    { classes: "z-30 -mt-16 -ml-8 md:-mt-20 md:-ml-12 relative", rotate: -1.5 },
  ];

  // Absolute Waterfall Conditional Rendering Map
  const renderContent = () => {
    // State 1: Initial Data Load
    if (isFetchingWardrobe) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center w-full my-12 animate-pulse px-6 text-center">
          <p className="font-[family-name:var(--font-cormorant)] text-xl italic text-black/50 dark:text-white/50 tracking-wide">
            Accessing your wardrobe...
          </p>
        </div>
      );
    }

    // State 2: Incomplete Closet
    if (!hasCompleteOutfit) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="flex-1 flex flex-col items-center justify-center w-full space-y-8 my-20 text-center px-4"
        >
          <p className="font-[family-name:var(--font-cormorant)] text-2xl italic text-black/50 dark:text-white/50 leading-relaxed">
            Upload more items to generate
            <br />
            your first outfit.
          </p>
          <Link
            href="/upload"
            className="px-12 py-4 rounded-full border border-black/20 dark:border-white/20 text-black/80 dark:text-white/80 text-xs uppercase font-medium tracking-widest hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            Go to Upload
          </Link>
        </motion.div>
      );
    }

    // State 3: Mood Board (Before styling triggers)
    if (hasCompleteOutfit && !isCurating && !currentOutfit) {
      const occasions = ["Casual", "Office", "Night Out", "Gym"];
      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex-1 flex flex-col items-center justify-center w-full my-8 px-6 text-center space-y-10"
        >
          <p className="font-[family-name:var(--font-cormorant)] text-3xl italic text-black/70 dark:text-white/70 tracking-wide">
            Where are we heading today?
          </p>

          <div className="flex flex-wrap justify-center gap-4 max-w-sm">
            {occasions.map((occ) => (
              <button
                key={occ}
                type="button"
                onClick={() => setOccasion(occ)}
                className={`px-6 py-3 rounded-full text-xs font-medium tracking-widest uppercase transition-all duration-300 border ${occasion === occ ? "bg-[#1A1A18] text-white border-transparent dark:bg-white dark:text-black shadow-lg scale-105" : "bg-transparent text-black/60 border-black/20 hover:border-black/50 dark:text-white/60 dark:border-white/20 dark:hover:border-white/50"}`}
              >
                {occ}
              </button>
            ))}
          </div>

          <motion.button
            type="button"
            onClick={handleStyleMyLook} // Or whatever your onClick is!
            whileTap={{ scale: 0.95 }}
            initial="default"
            whileHover="hover"
            className="relative w-full max-w-xs mt-6 py-4 rounded-full bg-[#FFD1C8] text-[#1A1A18] font-bold tracking-widest uppercase text-xs shadow-[0_0_35px_8px_rgba(255,209,200,0.35)] transition-shadow duration-500 hover:shadow-[0_0_50px_12px_rgba(224,195,252,0.6)] overflow-hidden"
          >
            {/* The Iridescent Gradient Layer (Hidden by default) */}
            <motion.div
              variants={{
                default: { opacity: 0, backgroundPosition: "0% 50%" },
                hover: { opacity: 1, backgroundPosition: "100% 50%" },
              }}
              transition={{
                opacity: { duration: 0.4, ease: "easeInOut" },
                backgroundPosition: {
                  duration: 3,
                  ease: "linear",
                  repeat: Infinity,
                  repeatType: "mirror",
                },
              }}
              style={{
                backgroundImage:
                  "linear-gradient(90deg, #FFD1C8, #E0C3FC, #C2E9FB, #FFD1C8, #FDF0BA, #E0C3FC)",
                backgroundSize: "300% 100%",
              }}
              className="absolute inset-0 pointer-events-none"
            />

            {/* The Button Text */}
            <span className="relative z-10 block">Style My Look</span>
          </motion.button>
        </motion.div>
      );
    }

    // State 4: AI Curating
    if (isCurating) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center w-full my-16 px-6 text-center space-y-6">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#FFD1C8] animate-spin duration-3000" />
            <div className="absolute inset-2 rounded-full bg-[#FFD1C8]/20 animate-ping" />
          </div>
          <p className="font-[family-name:var(--font-cormorant)] text-xl italic text-black/60 dark:text-white/60 tracking-wide animate-pulse">
            Your personal AI stylist is curating a look...
          </p>
          <span className="text-[9px] tracking-widest text-black/40 dark:text-white/40 uppercase">
            Selecting items from your closet
          </span>
        </div>
      );
    }

    // State 5: Success Pipeline (Floating Clothes Reveal)
    if (
      currentOutfit &&
      (currentOutfit.top || currentOutfit.bottom || currentOutfit.shoes)
    ) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="w-full flex-1 flex flex-col items-center justify-between"
        >
          <div className="flex flex-col items-center justify-center w-full py-4 px-8 mt-4">
            {[currentOutfit.top, currentOutfit.bottom, currentOutfit.shoes].map(
              (src, index) => {
                if (typeof src !== "string" || !src.trim()) return null;
                return (
                  <motion.div
                    key={index}
                    className={`will-change-transform ${outfitStyles[index].classes}`}
                    initial={{ rotate: outfitStyles[index].rotate }}
                    animate={{
                      y: ["-6px", "6px", "-6px"],
                      rotate: outfitStyles[index].rotate,
                    }}
                    transition={{
                      y: {
                        repeat: Infinity,
                        duration: 5,
                        ease: "easeInOut",
                        delay: index * 0.7,
                      },
                    }}
                  >
                    <Image
                      src={src}
                      alt="Outfit Item"
                      width={260}
                      height={260}
                      className="object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-700 ease-out h-48 w-auto md:h-64"
                    />
                  </motion.div>
                );
              },
            )}
          </div>

          {currentOutfit.reasoning && (
            <div className="mt-4 max-w-sm px-6 py-4 rounded-2xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 text-center">
              <p className="text-[9px] tracking-[0.2em] uppercase text-black/40 dark:text-white/40 mb-1 font-semibold">
                Aura's Notes
              </p>
              <p className="font-[family-name:var(--font-cormorant)] text-sm italic text-black/80 dark:text-white/80 leading-relaxed">
                "{currentOutfit.reasoning}"
              </p>
            </div>
          )}

          <div className="w-full mt-8 mb-8 flex flex-col items-center space-y-4 px-4 max-w-sm">
            <motion.button
              onClick={handleAcceptOutfit}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              className="w-full py-4 rounded-full bg-[#FFD1C8] text-[#1A1A18] font-bold tracking-widest uppercase text-xs transition-shadow duration-300 shadow-[0_0_35px_rgba(255,209,200,0.5)] hover:shadow-[0_0_50px_rgba(255,209,200,0.8)]"
            >
              {buttonText}
            </motion.button>
            <button
              onClick={() => {
                setCurrentOutfit(null);
                setIsCurating(false);
              }}
              className="px-6 py-2 rounded-full text-xs uppercase tracking-widest border border-black/10 dark:border-white/10 text-black/50 dark:text-white/50 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              Start Over
            </button>
          </div>
        </motion.div>
      );
    }

    // State 6: Safety Catch (if AI resolution failed or returned empty JSON)
    return (
      <div className="flex-1 flex flex-col items-center justify-center w-full my-12 px-6 text-center space-y-6">
        <p className="font-[family-name:var(--font-cormorant)] text-2xl italic text-black/50 dark:text-white/50 tracking-wide">
          Something went wrong generating that look.
        </p>
        <button
          onClick={() => {
            setCurrentOutfit(null);
            setIsCurating(false);
          }}
          className="px-8 py-3 rounded-full text-xs uppercase tracking-widest border border-black/20 dark:border-white/20 text-black/80 dark:text-white/80 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  };

  return (
    <>
      <AnimatePresence>
        {showOnboarding && (
          <OnboardingModal onClose={() => setShowOnboarding(false)} />
        )}
      </AnimatePresence>
      <main className="min-h-screen py-8 px-4 flex flex-col items-center max-w-lg mx-auto">
        {/* Header */}
        <div className="w-full px-6 pt-10 mb-8 text-center">
          <div className="flex flex-col items-center justify-center border-b border-black/10 dark:border-white/10 pb-6 space-y-3">
            <h1 className="font-serif text-4xl font-light tracking-[0.25em] text-gray-900 dark:text-white antialiased">
              DAILY PICK
            </h1>
            <div className="flex items-center space-x-2 text-xs uppercase tracking-wider opacity-60">
              <CloudSun size={14} />
              <span>22°C</span>
            </div>
          </div>

          <div className="flex flex-col items-center mt-6 mb-2">
            <p className="text-[10px] tracking-[0.3em] text-black/60 dark:text-white/60 uppercase">
              YOUR CLOSET • YOUR MOOD • YOUR DAY
            </p>
          </div>
        </div>

        {/* Dynamic Content Mount */}
        {renderContent()}

        {/* Footer Subtext */}
        <p className="font-[family-name:var(--font-cormorant)] text-xs italic text-black/40 dark:text-white/40 text-center pb-6 mt-auto px-4">
          Never choose an outfit again. AI that styles you from the clothes you
          already own.
        </p>
      </main>
    </>
  );
}
