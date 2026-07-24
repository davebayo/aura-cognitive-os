"use client";

import { useState, useRef } from "react";
import { X, Camera, Upload, FolderOpen, Heart, Sparkles, ArrowLeft } from "lucide-react";
import Image from "next/image";
import { collection, doc, setDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { useRouter } from "next/navigation";
import { useAuth } from "@/utils/userContext";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

// Type-safe interface representing a wardrobe inventory document
interface WardrobeItem {
  id?: string;
  imageUrl: string;
  category: "Tops" | "Bottoms" | "Shoes" | "Outerwear" | "Accessories" | "Headwear" | string;
  genderStyle: "Menswear" | "Womenswear" | "Unisex" | string;
  userId: string;
  dateAdded: string;
  topUrl?: string;
  bottomUrl?: string;
  shoesUrl?: string;
  outerwearUrl?: string;
  accessoriesUrl?: string;
  headwearUrl?: string;
}

interface UploadQueueItem {
  id: string;
  file: File;
  previewUrl: string;
  status: 'idle' | 'classifying' | 'ready' | 'uploading' | 'saved' | 'failed';
  category: string;
  genderStyle: string;
}

export default function UploadOutfit() {
  const router = useRouter();
  const { currentUser } = useAuth();
  
  const [queue, setQueueState] = useState<UploadQueueItem[]>([]);
  const queueRef = useRef<UploadQueueItem[]>([]);
  
  const setQueue = (val: UploadQueueItem[] | ((prev: UploadQueueItem[]) => UploadQueueItem[])) => {
    setQueueState(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      queueRef.current = next;
      return next;
    });
  };

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const isProcessingRef = useRef<boolean>(false);

  const processQueueSequentially = async () => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

    try {
      let isFirst = true;
      while (true) {
        // Find next item to classify in queueRef.current
        const nextItem = queueRef.current.find(item => item.status === 'classifying' || item.status === 'idle');
        if (!nextItem) break;

        if (!isFirst) {
          await delay(4000);
        }
        isFirst = false;

        // Double check if item still exists in queue
        if (!queueRef.current.some(item => item.id === nextItem.id)) {
          continue;
        }

        // Inner Try/Catch around each individual item classification
        try {
          const formData = new FormData();
          formData.append("file", nextItem.file);

          const response = await fetch("/api/classify", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) throw new Error(`Classification failed with status ${response.status}`);

          const data = await response.json();
          setQueue(prev => prev.map(item => item.id === nextItem.id ? { 
            ...item, 
            status: 'ready', 
            category: data.category || "Tops", 
            genderStyle: data.genderStyle || "Unisex" 
          } : item));
        } catch (err: any) {
          console.error("AI classification error for item:", nextItem.id, err);
          // Graceful Failure: update that specific item's status to 'failed' and continue processing others
          setQueue(prev => prev.map(item => 
            item.id === nextItem.id ? { ...item, status: 'failed' } : item
          ));
          continue;
        }
      }
    } finally {
      // Safe Unlock: located in an outer finally block
      isProcessingRef.current = false;
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      const newItems: UploadQueueItem[] = selectedFiles.map((file, index) => {
        const id = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}-${index}`;
        return {
          id,
          file,
          previewUrl: URL.createObjectURL(file),
          status: 'classifying',
          category: 'Tops',
          genderStyle: 'Unisex'
        };
      });

      setQueue(prev => [...prev, ...newItems]);

      // Process classification sequentially with a delay
      processQueueSequentially();

      // Reset the file input so that the same files can be selected again if removed
      if (e.target) e.target.value = "";
    }
  };

  const handleRemoveItem = (id: string) => {
    setQueue(prev => {
      const target = prev.find(item => item.id === id);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter(item => item.id !== id);
    });
  };

  const handleRetryClassify = async (id: string) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    const target = queueRef.current.find(item => item.id === id);
    if (!target) {
      isProcessingRef.current = false;
      return;
    }

    setQueue(prev => prev.map(item => item.id === id ? { ...item, status: 'classifying' } : item));

    try {
      const formData = new FormData();
      formData.append("file", target.file);

      const response = await fetch("/api/classify", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("API Rate Limit: Please wait 60 seconds before retrying");
      }

      const data = await response.json();
      setQueue(prev => prev.map(item => item.id === id ? { 
        ...item, 
        status: 'ready', 
        category: data.category || "Tops", 
        genderStyle: data.genderStyle || "Unisex" 
      } : item));
    } catch (err: any) {
      console.warn("API Rate Limit: Please wait 60 seconds before retrying");
      setToast("API Rate Limit: Please wait 60 seconds before retrying");
      setTimeout(() => setToast(null), 5000);
      setQueue(prev => prev.map(item => item.id === id ? { ...item, status: 'failed' } : item));
    } finally {
      isProcessingRef.current = false;
    }
  };

  const handleUpdateCategory = (id: string, newCategory: string) => {
    setQueue(prev => prev.map(item => item.id === id ? { 
      ...item, 
      category: newCategory,
      status: item.status === 'failed' || item.status === 'idle' ? 'ready' : item.status
    } : item));
  };

  const handleUpdateGenderStyle = (id: string, newGenderStyle: string) => {
    setQueue(prev => prev.map(item => item.id === id ? { 
      ...item, 
      genderStyle: newGenderStyle,
      status: item.status === 'failed' || item.status === 'idle' ? 'ready' : item.status
    } : item));
  };

  const uploadToCloudinary = async (file: File, id: string, category: string, genderStyle: string) => {
    try {
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const response = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
          image: base64Data,
          id,
          category,
          genderStyle
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData?.error || "Upload with background removal failed";
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      return data.secure_url;
    } catch (err: any) {
      console.error("Cloudinary secure upload error:", err);
      throw new Error("Background removal failed. The image might be too complex to mask. Please upload a clear photo with a distinct background.");
    }
  };

  const getCategoryKey = (cat: string) => {
    switch (cat.toLowerCase()) {
      case "tops": return "topUrl";
      case "bottoms": return "bottomUrl";
      case "shoes": return "shoesUrl";
      case "outerwear": return "outerwearUrl";
      case "accessories": return "accessoriesUrl";
      case "headwear": return "headwearUrl";
      default: return "imageUrl";
    }
  };

  const handleSaveAll = async () => {
    const readyItems = queue.filter(item => item.status === 'ready');
    if (readyItems.length === 0) return;

    setIsSaving(true);
    setError(null);

    // Transition all 'ready' items to 'uploading'
    setQueue(prev => prev.map(item => item.status === 'ready' ? { ...item, status: 'uploading' } : item));

    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
    let successCount = 0;

    for (let i = 0; i < readyItems.length; i++) {
      const item = readyItems[i];

      if (i > 0) {
        await delay(3000);
      }

      try {
        // Pre-generate Firestore document reference to get a unique ID
        const docRef = doc(collection(db, "wardrobe_inventory"));
        const uniqueId = docRef.id;

        // Upload to Cloudinary with background removal and Pinecone sync
        const url = await uploadToCloudinary(item.file, uniqueId, item.category, item.genderStyle);
        const categoryKey = getCategoryKey(item.category);

        const itemData: WardrobeItem = {
          imageUrl: url,
          category: item.category,
          genderStyle: item.genderStyle,
          userId: currentUser?.uid || "unauthenticated",
          dateAdded: new Date().toISOString(),
          [categoryKey]: url
        };

        await setDoc(docRef, itemData);
        
        // Revoke object URL
        URL.revokeObjectURL(item.previewUrl);

        // Remove successfully saved item from queue
        setQueue(prev => prev.filter(q => q.id !== item.id));
        successCount++;
      } catch (err: any) {
        console.error(`Error saving item ${item.id}:`, err);
        // Set status to failed and continue
        setQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'failed' } : q));
        continue;
      }
    }

    setIsSaving(false);

    if (successCount === readyItems.length) {
      sessionStorage.setItem("upload_success_toast", `${successCount} items successfully added to closet.`);
      router.push("/closet");
    } else {
      setError(`Successfully saved ${successCount} of ${readyItems.length} items. Please review the failed items in the grid.`);
    }
  };

  return (
    <main className="min-h-screen py-16 px-6 max-w-6xl mx-auto bg-[#F6F4EB] dark:bg-[#1A1A18] transition-colors duration-300 w-full flex flex-col">
      {/* Navigation */}
      <div className="w-full mb-4">
        <Link 
          href="/" 
          className="inline-flex items-center space-x-3 text-xs uppercase tracking-widest text-[#1A1A18]/50 dark:text-[#F6F4EB]/50 hover:text-[#1A1A18] dark:hover:text-[#F6F4EB] transition-colors"
        >
          <ArrowLeft size={16} strokeWidth={1.5} />
          <span>Back</span>
        </Link>
      </div>

      {/* Header */}
      <div className="w-full text-center flex flex-col items-center space-y-3 mb-12">
        <h1 className="font-serif text-5xl font-light tracking-wide text-[#1A1A18] dark:text-[#F6F4EB]">
          Batch Upload
        </h1>
        <p className="text-[9px] tracking-[0.3em] text-black/40 dark:text-white/40 uppercase">
          AI Vision Scan & Bulk Curate
        </p>
      </div>

      {error && (
        <div className="w-full mb-8 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs text-center font-medium tracking-wide">
          {error}
        </div>
      )}

      {/* Upload Actions Card */}
      <div className="w-full max-w-md mx-auto grid grid-cols-2 gap-4 mb-12">
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple
          className="hidden"
        />
        <input
          type="file"
          accept="image/*"
          capture="environment"
          ref={cameraInputRef}
          onChange={handleFileChange}
          className="hidden"
        />

        <button
          type="button"
          disabled={isSaving}
          onClick={() => cameraInputRef.current?.click()}
          className="flex flex-col items-center justify-center p-6 bg-[#FDFAF5] dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-[2rem] hover:scale-[1.02] active:scale-[0.98] transition-all group shadow-sm text-center disabled:opacity-50"
        >
          <div className="p-3 bg-black/5 dark:bg-white/5 rounded-full mb-3 text-black/60 dark:text-white/60 group-hover:text-[#FFD1C8] transition-colors">
            <Camera size={20} className="stroke-[1.5]" />
          </div>
          <p className="text-[10px] tracking-widest uppercase font-bold text-black/70 dark:text-white/70">
            Take Photo
          </p>
          <p className="text-[8px] text-black/40 dark:text-white/40 tracking-wider mt-1">
            Scan via camera
          </p>
        </button>

        <button
          type="button"
          disabled={isSaving}
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center justify-center p-6 bg-[#FDFAF5] dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-[2rem] hover:scale-[1.02] active:scale-[0.98] transition-all group shadow-sm text-center disabled:opacity-50"
        >
          <div className="p-3 bg-black/5 dark:bg-white/5 rounded-full mb-3 text-black/60 dark:text-white/60 group-hover:text-[#FFD1C8] transition-colors">
            <Upload size={20} className="stroke-[1.5]" />
          </div>
          <p className="text-[10px] tracking-widest uppercase font-bold text-black/70 dark:text-white/70">
            Upload Files
          </p>
          <p className="text-[8px] text-black/40 dark:text-white/40 tracking-wider mt-1">
            Choose library files
          </p>
        </button>
      </div>

      {/* Queue Grid UI */}
      {queue.length > 0 && (
        <div className="w-full space-y-8 flex-1">
          <div className="flex items-center justify-between border-b border-black/5 dark:border-white/10 pb-4">
            <h2 className="text-xs tracking-widest font-bold uppercase text-black/50 dark:text-white/50">
              Upload Queue ({queue.length} {queue.length === 1 ? 'item' : 'items'})
            </h2>
            <button
              onClick={() => {
                queue.forEach(item => URL.revokeObjectURL(item.previewUrl));
                setQueue([]);
              }}
              disabled={isSaving}
              className="text-[9px] font-bold tracking-widest uppercase text-red-500 hover:text-red-600 disabled:opacity-40 transition-colors"
            >
              Clear All
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            <AnimatePresence mode="popLayout">
              {queue.map((item) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -10 }}
                  transition={{ duration: 0.3 }}
                  key={item.id}
                  className={`bg-[#FDFAF5] dark:bg-white/5 border rounded-[2rem] p-4 shadow-sm relative group flex flex-col transition-all duration-300 ${
                    item.status === 'failed' ? 'border-red-500/30' : 'border-black/5 dark:border-white/10'
                  }`}
                >
                  {/* Image Preview Container */}
                  <div className="aspect-square w-full rounded-2xl overflow-hidden bg-black/5 dark:bg-white/5 mb-4 relative flex items-center justify-center">
                    <img
                      src={item.previewUrl}
                      alt="Preview"
                      className="object-contain w-full h-full p-2 transition-transform duration-500 group-hover:scale-105"
                    />

                    {/* Classifying Overlay */}
                    {item.status === 'classifying' && (
                      <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center space-y-2">
                        <div className="w-8 h-8 rounded-full border-2 border-t-[#FFD1C8] border-white/20 animate-spin"></div>
                        <span className="text-[9px] tracking-widest uppercase text-[#FFD1C8] font-bold animate-pulse">Analyzing...</span>
                      </div>
                    )}

                    {/* Uploading Overlay */}
                    {item.status === 'uploading' && (
                      <div className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-[2px] flex flex-col items-center justify-center space-y-2">
                        <div className="w-8 h-8 rounded-full border-2 border-t-[#FFD1C8] border-white/20 animate-spin"></div>
                        <span className="text-[9px] tracking-widest uppercase text-white font-bold animate-pulse">Saving...</span>
                      </div>
                    )}

                    {/* Saved Overlay */}
                    {item.status === 'saved' && (
                      <div className="absolute inset-0 bg-emerald-500/20 dark:bg-emerald-500/10 backdrop-blur-[1px] flex flex-col items-center justify-center">
                        <span className="text-[10px] tracking-widest uppercase bg-emerald-500 text-white font-bold px-3 py-1 rounded-full shadow-md">Saved</span>
                      </div>
                    )}

                    {/* Failed Overlay */}
                    {item.status === 'failed' && (
                      <div className="absolute inset-0 bg-black/75 backdrop-blur-[2px] flex flex-col items-center justify-center p-3 text-center space-y-3">
                        <span className="text-[9px] text-red-400 font-bold uppercase tracking-widest">Classification Failed</span>
                        <button
                          type="button"
                          disabled={isSaving}
                          onClick={() => handleRetryClassify(item.id)}
                          className="px-4 py-1.5 bg-[#FFD1C8] text-[#1A1A18] text-[8px] uppercase font-bold tracking-widest rounded-full hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                        >
                          Retry AI
                        </button>
                      </div>
                    )}

                    {/* Local Delete Button */}
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => handleRemoveItem(item.id)}
                      className="absolute top-2.5 right-2.5 bg-white/90 dark:bg-black/70 p-2 rounded-full shadow-sm hover:bg-red-500 hover:text-white transition-all text-red-500 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 disabled:opacity-50"
                    >
                      <X size={12} strokeWidth={2.5} />
                    </button>
                  </div>

                  {/* Taxonomy Inputs */}
                  <div className="space-y-3 flex-1 flex flex-col justify-end">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold tracking-widest uppercase text-black/40 dark:text-white/40 pl-0.5">Category</label>
                      <select
                        value={item.category}
                        onChange={(e) => handleUpdateCategory(item.id, e.target.value)}
                        disabled={item.status === 'classifying' || item.status === 'uploading' || item.status === 'saved' || isSaving}
                        className="w-full px-3 py-2.5 text-[11px] font-medium bg-white dark:bg-black/30 border border-black/5 dark:border-white/10 rounded-xl text-black dark:text-white focus:outline-none focus:border-black/20 dark:focus:border-white/20 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                      >
                        <option value="Tops">Tops</option>
                        <option value="Bottoms">Bottoms</option>
                        <option value="Shoes">Shoes</option>
                        <option value="Outerwear">Outerwear</option>
                        <option value="Accessories">Accessories</option>
                        <option value="Headwear">Headwear</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold tracking-widest uppercase text-black/40 dark:text-white/40 pl-0.5">Style</label>
                      <select
                        value={item.genderStyle}
                        onChange={(e) => handleUpdateGenderStyle(item.id, e.target.value)}
                        disabled={item.status === 'classifying' || item.status === 'uploading' || item.status === 'saved' || isSaving}
                        className="w-full px-3 py-2.5 text-[11px] font-medium bg-white dark:bg-black/30 border border-black/5 dark:border-white/10 rounded-xl text-black dark:text-white focus:outline-none focus:border-black/20 dark:focus:border-white/20 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                      >
                        <option value="Menswear">Menswear</option>
                        <option value="Womenswear">Womenswear</option>
                        <option value="Unisex">Unisex</option>
                      </select>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Master Confirm & Save Button */}
          <div className="w-full flex justify-center pt-8 pb-16">
            <button
              onClick={handleSaveAll}
              disabled={queue.filter(item => item.status === 'ready').length === 0 || isSaving}
              className="w-full max-w-md py-4 rounded-full bg-[#FFD1C8] text-[#1A1A18] font-bold tracking-widest uppercase text-xs hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-40 disabled:scale-100 shadow-[0_4px_14px_rgba(255,209,200,0.4)]"
            >
              {isSaving ? "Saving Closet Items..." : `Confirm & Save All (${queue.filter(item => item.status === 'ready').length} Ready)`}
            </button>
          </div>
        </div>
      )}

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50 bg-[#1A1A18] text-[#F6F4EB] dark:bg-[#F6F4EB] dark:text-[#1A1A18] px-6 py-4 rounded-2xl shadow-2xl flex items-center space-x-3 border border-white/10 dark:border-black/10"
          >
            <span className="text-xs font-bold tracking-widest uppercase">{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
