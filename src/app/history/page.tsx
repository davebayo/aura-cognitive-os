"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Trash2, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { collection, getDocs, query, deleteDoc, doc, where } from "firebase/firestore";
import { db } from "@/firebase";
import { useAuth } from "@/utils/userContext";
import DailyPickModal, { OutfitDetail } from "@/components/DailyPickModal";

interface SavedOutfit {
  id: string;
  top: string | null;
  bottom: string | null;
  shoes: string | null;
  reasoning?: string;
  dateSaved: string;
}

export default function OutfitHistory() {
  const { currentUser } = useAuth();
  const [outfits, setOutfits] = useState<SavedOutfit[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOutfit, setSelectedOutfit] = useState<OutfitDetail | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    const fetchHistory = async () => {
      try {
        const q = query(collection(db, "outfit_history"), where("userId", "==", currentUser.uid));
        const querySnapshot = await getDocs(q);
        
        // Sort documents by dateSaved desc in-memory to avoid requiring a composite index
        const sortedDocs = querySnapshot.docs.map(d => ({ id: d.id, data: d.data() }));
        sortedDocs.sort((a, b) => new Date(b.data.dateSaved || 0).getTime() - new Date(a.data.dateSaved || 0).getTime());

        const fetched: SavedOutfit[] = [];
        
        sortedDocs.forEach(({ id, data }) => {
          fetched.push({
            id: id,
            top: data.top || null,
            bottom: data.bottom || null,
            shoes: data.shoes || null,
            reasoning: data.reasoning || "",
            dateSaved: data.dateSaved || new Date().toISOString()
          });
        });
        
        setOutfits(fetched);
      } catch (error) {
        console.error("Error fetching history: ", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchHistory();
  }, [currentUser]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      await deleteDoc(doc(db, "outfit_history", id));
      setOutfits(prev => prev.filter(outfit => outfit.id !== id));
    } catch (error) {
      console.error("Error deleting outfit history: ", error);
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric"
      }).toUpperCase();
    } catch {
      return "UNKNOWN DATE";
    }
  };

  const cardOutfitStyles = [
    { classes: "z-10 relative", rotate: 0 },
    { classes: "z-20 -mt-10 ml-8 relative", rotate: 2 },
    { classes: "z-30 -mt-10 -ml-6 relative", rotate: -1.5 },
  ];

  if (loading) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-[#F6F4EB] dark:bg-[#1A1A18] px-4">
        <p className="font-[family-name:var(--font-playfair)] text-2xl italic text-black/50 dark:text-white/50 animate-pulse">
          Loading your outfit history...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F6F4EB] dark:bg-[#1A1A18] px-6 py-12 md:px-12 lg:px-24">
      {/* Navigation */}
      <div className="w-full max-w-6xl mx-auto mb-12">
        <Link 
          href="/" 
          className="inline-flex items-center space-x-3 text-xs uppercase tracking-widest text-[#1A1A18]/50 dark:text-[#F6F4EB]/50 hover:text-[#1A1A18] dark:hover:text-[#F6F4EB] transition-colors"
        >
          <ArrowLeft size={16} strokeWidth={1.5} />
          <span>Back</span>
        </Link>
      </div>

      <div className="w-full max-w-6xl mx-auto flex flex-col items-center">
        {/* Header */}
        <div className="text-center flex flex-col items-center space-y-4 mb-20 mt-4">
          <h1 className="font-[family-name:var(--font-playfair)] text-5xl md:text-6xl font-semibold tracking-wide text-[#1A1A18] dark:text-[#F6F4EB]">
            Saved Looks
          </h1>
          <p className="text-[10px] tracking-[0.3em] text-black/60 dark:text-white/60 uppercase">
            YOUR STYLE HISTORY
          </p>
        </div>

        {outfits.length === 0 ? (
          <div className="flex flex-col items-center mt-12 space-y-10">
            <p className="font-[family-name:var(--font-playfair)] text-2xl italic text-black/50 dark:text-white/50 text-center px-4">
              You haven't saved any outfits yet.
            </p>
            <Link 
              href="/"
              className="px-12 py-4 rounded-full border border-[#1A1A18]/20 dark:border-[#F6F4EB]/20 text-[#1A1A18]/80 dark:text-[#F6F4EB]/80 text-xs uppercase font-medium tracking-widest hover:bg-[#1A1A18]/5 dark:hover:bg-[#F6F4EB]/5 transition-colors"
            >
              Get Styled
            </Link>
          </div>
        ) : (
          <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
            {outfits.map((outfit, index) => {
              const items = [outfit.top, outfit.bottom, outfit.shoes].filter(Boolean) as string[];
              return (
                <motion.div
                  key={outfit.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.05 }}
                  onClick={() => setSelectedOutfit({
                    top: outfit.top,
                    bottom: outfit.bottom,
                    shoes: outfit.shoes,
                    reasoning: outfit.reasoning,
                    dateSaved: outfit.dateSaved
                  })}
                  className="bg-[#FDFAF5] dark:bg-white/5 rounded-3xl p-6 border border-black/5 dark:border-white/5 flex flex-col items-center shadow-sm relative group hover:shadow-md transition-shadow cursor-pointer"
                >
                  {/* Delete Button */}
                  <button
                    onClick={(e) => handleDelete(outfit.id, e)}
                    className="absolute top-4 right-4 p-2 rounded-xl bg-white/80 dark:bg-black/60 backdrop-blur-sm border border-black/5 dark:border-white/10 text-black/50 dark:text-white/50 hover:bg-white hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300 shadow-sm hover:shadow-md z-40"
                    aria-label="Delete saved outfit"
                  >
                    <Trash2 size={14} strokeWidth={1.75} />
                  </button>

                  {/* Date Badge */}
                  <div className="flex items-center space-x-2 text-[9px] tracking-[0.2em] text-black/40 dark:text-white/40 font-semibold mb-6 uppercase">
                    <Calendar size={10} className="stroke-[2]" />
                    <span>{formatDate(outfit.dateSaved)}</span>
                  </div>

                  {/* Stacked Images representation */}
                  <div className="w-full flex-1 flex flex-col items-center justify-center min-h-[220px] overflow-visible py-4">
                    <div className="flex flex-col items-center relative w-full max-w-[200px]">
                      {items.map((src, idx) => (
                        <div
                          key={idx}
                          className={`${cardOutfitStyles[idx].classes}`}
                          style={{ transform: `rotate(${cardOutfitStyles[idx].rotate}deg)` }}
                        >
                          <Image
                            src={src}
                            alt="Outfit item"
                            width={100}
                            height={100}
                            className="object-contain drop-shadow-lg max-h-24 w-auto"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <DailyPickModal
        isOpen={!!selectedOutfit}
        onClose={() => setSelectedOutfit(null)}
        outfit={selectedOutfit}
      />
    </main>
  );
}
