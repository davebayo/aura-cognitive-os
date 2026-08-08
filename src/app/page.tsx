"use client";

import Image from "next/image";
import { CloudSun, AlertCircle, Sparkles, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "@/firebase";
import { useAuth } from "@/utils/userContext";
import Link from "next/link";
import OnboardingModal from "@/components/OnboardingModal";
import CognitiveLoader from "@/components/CognitiveLoader";
import WeatherWidget from "@/components/WeatherWidget";
import { useWeather } from "@/hooks/useWeather";

interface CurrentOutfit {
  top: string | null;
  bottom: string | null;
  shoes: string | null;
  reasoning?: string;
  missingPieces?: string[];
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
  const { weatherData } = useWeather();
  const [buttonText, setButtonText] = useState("Accept Outfit");

  // Strict UI State Waterfall Variables
  const [isFetchingWardrobe, setIsFetchingWardrobe] = useState(true);
  const [hasCompleteOutfit, setHasCompleteOutfit] = useState(false);

  // Cognitive Stylist Edge Case States
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEmpty, setIsEmpty] = useState(false);
  const [currentOutfit, setCurrentOutfit] = useState<CurrentOutfit | null>(
    null,
  );

  // New Contextual Styling States
  const [occasion, setOccasion] = useState("Casual");
  const [isCustomInputOpen, setIsCustomInputOpen] = useState(false);
  const [customContext, setCustomContext] = useState("");
  const [wardrobe, setWardrobe] = useState<
    { type: string; url: string; userId?: string }[]
  >([]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);

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
    if (isLoading) return;
    setIsLoading(true);
    setError(null);
    setIsEmpty(false);
    setCurrentOutfit(null);

    try {
      const weatherContextString = weatherData
        ? `${weatherData.temp}°C, ${weatherData.condition} weather in ${weatherData.location}`
        : "warm and sunny weather";

      const userRequestPayload = customContext.trim()
        ? `${occasion} - ${customContext.trim()}`
        : occasion;

      const res = await fetch("/api/stylist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userRequest: userRequestPayload,
          weatherContext: weatherContextString,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to style outfit.");
      }

      const data = await res.json();
      const retrievedItems = data.retrievedItems;

      let outfitResult = data ? data.finalOutfit || data : null;
      if (typeof outfitResult === "string") {
        try {
          outfitResult = JSON.parse(outfitResult);
        } catch (err) {
          console.error("Failed to parse finalOutfit JSON:", err);
        }
      }

      if (outfitResult?.error) {
        if (
          outfitResult.error.toLowerCase().includes("no items") ||
          (Array.isArray(retrievedItems) && retrievedItems.length === 0)
        ) {
          setIsEmpty(true);
          return;
        }
        throw new Error(outfitResult.error);
      }

      if (Array.isArray(retrievedItems) && retrievedItems.length === 0) {
        setIsEmpty(true);
        return;
      }

      const topUrl = extractUrl(outfitResult?.top);
      const bottomUrl = extractUrl(outfitResult?.bottom);
      const shoesUrl = extractUrl(outfitResult?.shoes);

      if (!topUrl && !bottomUrl && !shoesUrl) {
        setIsEmpty(true);
        return;
      }

      setCurrentOutfit({
        top: topUrl,
        bottom: bottomUrl,
        shoes: shoesUrl,
        reasoning: outfitResult?.reasoning || "",
        missingPieces: outfitResult?.missing_pieces || [],
      });
      setShowNotesModal(true);
    } catch (err: any) {
      console.error("Error curating outfit:", err);
      setError(
        err?.message ||
          "An unexpected error occurred while curating your look. Please try again.",
      );
      setCurrentOutfit(null);
    } finally {
      setIsLoading(false);
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

    // State 3: Skeleton Loader while curating
    if (isLoading) {
      return <CognitiveLoader />;
    }

    // State 4: Styled Error Banner
    if (error) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm my-8 p-6 rounded-3xl bg-red-500/10 border border-red-500/20 backdrop-blur-md text-center space-y-4 shadow-lg"
        >
          <div className="flex items-center justify-center space-x-2 text-red-600 dark:text-red-400">
            <AlertCircle size={20} />
            <span className="font-semibold text-sm tracking-wide">
              Stylist Connection Issue
            </span>
          </div>
          <p className="text-xs text-red-700/80 dark:text-red-300/80 leading-relaxed">
            {error}
          </p>
          <button
            onClick={() => {
              setError(null);
              handleStyleMyLook();
            }}
            className="px-6 py-2.5 rounded-full bg-red-600/20 hover:bg-red-600/30 text-red-800 dark:text-red-200 text-xs font-medium uppercase tracking-widest transition-colors flex items-center justify-center space-x-2 mx-auto"
          >
            <RefreshCw size={14} />
            <span>Try Again</span>
          </button>
        </motion.div>
      );
    }

    // State 5: Inventory Missing Card
    if (isEmpty) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm my-8 p-8 rounded-3xl bg-white/20 dark:bg-black/20 backdrop-blur-xl border border-black/10 dark:border-white/10 text-center space-y-6 shadow-xl"
        >
          <div className="w-12 h-12 rounded-full bg-[#FFD1C8]/30 dark:bg-[#FFD1C8]/20 flex items-center justify-center mx-auto text-[#1A1A18] dark:text-white">
            <Sparkles size={22} className="text-[#FFD1C8]" />
          </div>
          <div className="space-y-2">
            <h3 className="font-serif text-2xl font-light tracking-wide text-black/90 dark:text-white/90">
              Inventory Missing
            </h3>
            <p className="font-[family-name:var(--font-cormorant)] text-sm italic text-black/60 dark:text-white/60 leading-relaxed">
              No matching clothing items were found in your inventory for "
              {occasion}". Please upload more items to your digital wardrobe or
              tweak your occasion choice.
            </p>
          </div>
          <div className="flex flex-col space-y-3 pt-2">
            <Link
              href="/upload"
              className="w-full py-3.5 rounded-full bg-[#FFD1C8] text-[#1A1A18] font-bold tracking-widest uppercase text-xs shadow-md hover:shadow-lg transition-all"
            >
              Upload Clothing Items
            </Link>
            <button
              onClick={() => {
                setIsEmpty(false);
                setError(null);
                setCurrentOutfit(null);
              }}
              className="w-full py-2.5 rounded-full border border-black/20 dark:border-white/20 text-black/70 dark:text-white/70 text-xs uppercase tracking-widest hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              Tweak Query / Go Back
            </button>
          </div>
        </motion.div>
      );
    }

    // State 6: Mood Board (Before styling triggers)
    if (
      hasCompleteOutfit &&
      !isLoading &&
      !error &&
      !isEmpty &&
      !currentOutfit
    ) {
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

          {/* Toggle & Expandable Input Container */}
          <div className="flex flex-col items-center w-full max-w-sm">
            <button
              type="button"
              onClick={() => setIsCustomInputOpen((prev) => !prev)}
              className="text-xs font-medium text-gray-400 dark:text-gray-500 tracking-[0.15em] cursor-pointer hover:text-gray-800 dark:hover:text-gray-200 transition-colors pb-4 uppercase"
            >
              {isCustomInputOpen
                ? "- HIDE SPECIFIC DETAILS"
                : "+ ADD SPECIFIC DETAILS"}
            </button>

            <AnimatePresence>
              {isCustomInputOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="w-full overflow-hidden"
                >
                  <input
                    type="text"
                    value={customContext}
                    onChange={(e) => setCustomContext(e.target.value)}
                    placeholder="e.g., Pitch meeting in heavy AC..."
                    className="w-full max-w-sm bg-transparent border-0 border-b border-gray-300 dark:border-gray-700 focus:border-gray-800 dark:focus:border-gray-200 focus:ring-0 text-center text-sm pb-2 text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-colors mx-auto block mb-6 outline-none"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              type="button"
              onClick={handleStyleMyLook}
              disabled={isLoading}
              whileTap={{ scale: 0.95 }}
              initial="default"
              whileHover="hover"
              className="relative w-full max-w-xs py-4 rounded-full bg-[#FFD1C8] text-[#1A1A18] font-bold tracking-widest uppercase text-xs shadow-[0_0_35px_8px_rgba(255,209,200,0.35)] transition-shadow duration-500 hover:shadow-[0_0_50px_12px_rgba(224,195,252,0.6)] overflow-hidden"
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
              <span className="relative z-10 block">
                {isLoading ? "Orchestrating..." : "Style My Look"}
              </span>
            </motion.button>
          </div>
        </motion.div>
      );
    }

    // State 7: Success Pipeline (Floating Clothes Reveal)
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
                setIsEmpty(false);
                setError(null);
                setIsLoading(false);
              }}
              className="px-6 py-2 rounded-full text-xs uppercase tracking-widest border border-black/10 dark:border-white/10 text-black/50 dark:text-white/50 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              Start Over
            </button>
          </div>
        </motion.div>
      );
    }

    // State 8: Safety Catch
    return (
      <div className="flex-1 flex flex-col items-center justify-center w-full my-12 px-6 text-center space-y-6">
        <p className="font-[family-name:var(--font-cormorant)] text-2xl italic text-black/50 dark:text-white/50 tracking-wide">
          Something went wrong generating that look.
        </p>
        <button
          onClick={() => {
            setCurrentOutfit(null);
            setIsEmpty(false);
            setError(null);
            setIsLoading(false);
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
            <div className="flex items-center justify-center pt-1">
              <WeatherWidget />
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

      {/* Daily Pick Results Modal */}
      <AnimatePresence>
        {showNotesModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md p-8 bg-[#f5f4ef] rounded-3xl shadow-2xl flex flex-col items-center text-center space-y-6 text-[#1A1A18]"
            >
              {/* Header */}
              <div className="flex flex-col items-center justify-center mb-6">
                <div className="flex items-center justify-center">
                  {/* Filled Sparkles SVG */}
                  <svg className="w-8 h-8 mr-3 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Large Bottom-Right Sparkle */}
                    <path d="M16 22C16 17 19.5 13.5 24 13.5C19.5 13.5 16 10 16 5C16 10 12.5 13.5 8 13.5C12.5 13.5 16 17 16 22Z" fill="#FBC4C4"/>
                    {/* Small Top-Left Sparkle */}
                    <path d="M6 10.5C6 8.5 7.5 7 9.5 7C7.5 7 6 5.5 6 3.5C6 5.5 4.5 7 2.5 7C4.5 7 6 8.5 6 10.5Z" fill="#FBC4C4"/>
                  </svg>
                  
                  <h2 
                    className="text-4xl tracking-widest text-gray-900 uppercase"
                    style={{ fontFamily: 'var(--font-cormorant), serif' }}
                  >
                    Daily Pick
                  </h2>
                </div>
                
                <p className="mt-2 text-[10px] font-semibold tracking-[0.3em] text-gray-400 uppercase">
                  Your Personal Stylist Agent
                </p>
              </div>

              {/* Aura's Notes Container */}
              {currentOutfit?.reasoning && (
                <div className="w-full p-5 rounded-2xl bg-black/[0.04] border border-black/5 text-center space-y-2">
                  <p className="text-[9px] tracking-[0.2em] uppercase font-semibold text-black/50">
                    AURA'S NOTES
                  </p>
                  <p className="font-[family-name:var(--font-cormorant)] text-sm italic text-black/80 leading-relaxed">
                    "{currentOutfit.reasoning}"
                  </p>
                  {currentOutfit.missingPieces &&
                    currentOutfit.missingPieces.length > 0 && (
                      <div className="pt-2 border-t border-black/5">
                        <p className="text-[9px] tracking-wider uppercase text-amber-700 font-medium">
                          Missing Climate Pieces:{" "}
                          <span className="normal-case italic opacity-90">
                            {currentOutfit.missingPieces.join(", ")}
                          </span>
                        </p>
                      </div>
                    )}
                </div>
              )}

              {/* Clothing Grid */}
              <div className="grid grid-cols-3 gap-3 w-full">
                {[
                  { label: "Top", src: currentOutfit?.top },
                  { label: "Bottom", src: currentOutfit?.bottom },
                  { label: "Shoes", src: currentOutfit?.shoes },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-2xl p-3 shadow-sm border border-black/5 flex flex-col items-center justify-center aspect-square overflow-hidden relative group"
                  >
                    {item.src ? (
                      <Image
                        src={item.src}
                        alt={item.label}
                        width={100}
                        height={100}
                        className="object-contain h-full w-auto max-h-20"
                      />
                    ) : (
                      <span className="text-[10px] uppercase tracking-wider text-black/30">
                        {item.label}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="w-full flex flex-col space-y-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentOutfit(null);
                    setIsEmpty(false);
                    setError(null);
                    setIsLoading(false);
                    setShowNotesModal(false);
                  }}
                  className="w-full py-3.5 rounded-full bg-[#FFD1C8] text-[#1A1A18] font-bold tracking-widest uppercase text-xs shadow-sm hover:brightness-95 transition-all"
                >
                  STYLE ANOTHER LOOK
                </button>
                <button
                  type="button"
                  onClick={() => setShowNotesModal(false)}
                  className="w-full py-3.5 rounded-full bg-white border border-black/20 text-black/80 font-bold tracking-widest uppercase text-xs hover:bg-gray-50 transition-all"
                >
                  CLOSE
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
