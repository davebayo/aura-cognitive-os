"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Trash2, SlidersHorizontal, Shirt } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { collection, getDocs, deleteDoc, doc, query, where } from "firebase/firestore";
import { db } from "@/firebase";
import { useAuth } from "@/utils/userContext";

interface ClosetItem {
  id: string;
  url: string;
  category: string;
  genderStyle: string;
}

export default function MyCloset() {
  const { currentUser } = useAuth();
  const [items, setItems] = useState<ClosetItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [genderFilter, setGenderFilter] = useState<string>("All");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const msg = sessionStorage.getItem("upload_success_toast");
    if (msg) {
      setToastMessage(msg);
      sessionStorage.removeItem("upload_success_toast");
      const timer = setTimeout(() => setToastMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const fetchCloset = async () => {
      try {
        const q = query(collection(db, "wardrobe_inventory"), where("userId", "==", currentUser.uid));
        const querySnapshot = await getDocs(q);
        
        // Sort documents by dateAdded desc in-memory to avoid requiring a composite index
        const sortedDocs = querySnapshot.docs.map(d => ({ id: d.id, data: d.data() }));
        sortedDocs.sort((a, b) => new Date(b.data.dateAdded || 0).getTime() - new Date(a.data.dateAdded || 0).getTime());

        const fetchedItems: ClosetItem[] = [];

        sortedDocs.forEach(({ id, data }) => {
          let category = data.category || "";
          let url = data.imageUrl || "";
          
          // Backwards compatibility normalization
          if (!category) {
            if (data.topUrl) { category = "Tops"; url = data.topUrl; }
            else if (data.bottomUrl) { category = "Bottoms"; url = data.bottomUrl; }
            else if (data.shoesUrl) { category = "Shoes"; url = data.shoesUrl; }
            else if (data.outerwearUrl) { category = "Outerwear"; url = data.outerwearUrl; }
            else if (data.accessoriesUrl) { category = "Accessories"; url = data.accessoriesUrl; }
            else if (data.headwearUrl) { category = "Headwear"; url = data.headwearUrl; }
          }

          if (url) {
            fetchedItems.push({
              id,
              url,
              category: category || "Tops",
              genderStyle: data.genderStyle || "Unisex"
            });
          }
        });

        setItems(fetchedItems);
      } catch (error) {
        console.error("Error fetching closet: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCloset();
  }, [currentUser]);

  const handleDelete = async (itemId: string) => {
    try {
      await deleteDoc(doc(db, "wardrobe_inventory", itemId));
      setItems((prev) => prev.filter((item) => item.id !== itemId));
    } catch (error) {
      console.error("Error deleting item: ", error);
    }
  };

  // Derive filtered items array dynamically
  const filteredItems = items.filter((item) => {
    const matchesGender = genderFilter === "All" || item.genderStyle.toLowerCase() === genderFilter.toLowerCase();
    const matchesCategory = categoryFilter === "All" || item.category.toLowerCase() === categoryFilter.toLowerCase();
    return matchesGender && matchesCategory;
  });

  const getEmptyStateMessage = () => {
    if (categoryFilter === "All" && genderFilter === "All") {
      return "Your closet is empty. Scan an item to add one!";
    }
    const catLabel = categoryFilter === "All" ? "items" : categoryFilter.toLowerCase();
    const genderLabel = genderFilter === "All" ? "any style" : genderFilter;
    return `No ${catLabel} found in ${genderLabel}. Scan an item to add one!`;
  };

  if (loading) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-[#F6F4EB] dark:bg-[#1A1A18] px-4">
        <p className="font-serif text-2xl italic text-black/50 dark:text-white/50 animate-pulse tracking-wide">
          Loading your collection...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F6F4EB] dark:bg-[#1A1A18] px-6 py-12 md:px-12 lg:px-24 transition-colors duration-300">
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
        <div className="text-center flex flex-col items-center space-y-3 mb-16 mt-4">
          <h1 className="font-serif text-5xl md:text-6xl font-light tracking-wide text-[#1A1A18] dark:text-[#F6F4EB]">
            My Closet
          </h1>
          <p className="text-[9px] tracking-[0.3em] text-black/40 dark:text-white/40 uppercase">
            YOUR CURATED COLLECTION
          </p>
        </div>

        {/* Filter Controls */}
        <div className="w-full flex flex-col items-center mb-16 space-y-5">
          {/* Gender Style Pills */}
          <div className="flex flex-wrap gap-2.5 justify-center">
            {["All", "Menswear", "Womenswear", "Unisex"].map((style) => {
              const isActive = genderFilter === style;
              return (
                <button
                  key={style}
                  onClick={() => setGenderFilter(style)}
                  className={`py-2 px-5 rounded-full text-[10px] tracking-widest uppercase font-bold border transition-all duration-300 ${
                    isActive
                      ? "bg-[#FFD1C8] border-[#FFD1C8] text-[#1A1A18] shadow-[0_4px_12px_rgba(255,209,200,0.3)] hover:scale-[1.02]"
                      : "bg-[#FDFAF5] dark:bg-white/5 border-black/5 dark:border-white/10 text-black/50 dark:text-white/50 hover:border-black/20 dark:hover:border-white/20 hover:scale-[1.02]"
                  }`}
                >
                  {style}
                </button>
              );
            })}
          </div>

          {/* Secondary Category Filter Dropdown */}
          <div className="w-full max-w-[200px] relative">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full pl-8 pr-10 py-3 rounded-full text-[9px] tracking-widest uppercase font-bold bg-[#FDFAF5] dark:bg-white/5 border border-black/5 dark:border-white/10 text-black/60 dark:text-white/60 focus:outline-none focus:border-black/20 dark:focus:border-white/20 transition-all appearance-none cursor-pointer text-center shadow-sm"
            >
              <option value="All">All Categories</option>
              <option value="Tops">Tops</option>
              <option value="Bottoms">Bottoms</option>
              <option value="Shoes">Shoes</option>
              <option value="Outerwear">Outerwear</option>
              <option value="Accessories">Accessories</option>
              <option value="Headwear">Headwear</option>
            </select>
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-black/40 dark:text-white/40">
              <SlidersHorizontal size={10} />
            </div>
            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-black/40 dark:text-white/40">
              <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20">
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Closet Grid */}
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-[#1A1A18]/5 dark:bg-white/5 flex items-center justify-center mb-6 text-black/45 dark:text-white/45 border border-black/5 dark:border-white/10">
              <Shirt size={28} strokeWidth={1.25} />
            </div>
            <p className="font-serif text-xl italic text-black/50 dark:text-white/50 leading-relaxed mb-8">
              {getEmptyStateMessage()}
            </p>
            <Link 
              href="/upload"
              className="px-10 py-3.5 rounded-full border border-black/10 dark:border-white/15 text-black/70 dark:text-white/70 text-[10px] uppercase font-bold tracking-widest hover:bg-black/5 dark:hover:bg-white/5 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Add Items
            </Link>
          </div>
        ) : (
          <div className="w-full">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
              <AnimatePresence mode="popLayout">
                {filteredItems.map((item, idx) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    key={item.id}
                    className="bg-[#FDFAF5] dark:bg-white/5 rounded-3xl aspect-square relative shadow-sm border border-black/5 dark:border-white/5 overflow-hidden group hover:shadow-md transition-shadow p-6"
                  >
                    <div className="relative w-full h-full">
                      <Image 
                        src={item.url} 
                        alt={`${item.category} item`} 
                        fill 
                        className="object-contain transition-transform duration-700 ease-out group-hover:scale-105" 
                      />
                    </div>
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center text-center p-4">
                      <span className="text-[10px] tracking-[0.2em] text-white/60 uppercase font-semibold mb-1.5">
                        {item.genderStyle}
                      </span>
                      <h4 className="font-serif text-xl md:text-2xl text-white font-light tracking-wide capitalize">
                        {item.category}
                      </h4>
                    </div>
                    {/* Delete Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleDelete(item.id);
                      }}
                      className="absolute top-3 right-3 z-10 p-2 rounded-xl bg-white/80 dark:bg-black/60 backdrop-blur-sm border border-black/5 dark:border-white/10 text-black/50 dark:text-white/50 hover:bg-white hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300 shadow-sm hover:shadow-md"
                      aria-label="Delete item"
                    >
                      <Trash2 size={14} strokeWidth={1.75} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50 bg-[#1A1A18] text-[#F6F4EB] dark:bg-[#F6F4EB] dark:text-[#1A1A18] px-6 py-4 rounded-2xl shadow-2xl flex items-center space-x-3 border border-white/10 dark:border-black/10"
          >
            <span className="text-xs font-bold tracking-widest uppercase">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
