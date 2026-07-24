"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/firebase";
import { motion } from "framer-motion";
import { Mail, Lock } from "lucide-react";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isSignUp) {
        // Register user via Firebase Auth
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        
        // Immediately create corresponding document in 'users' Firestore
        await setDoc(doc(db, "users", cred.user.uid), {
          stylePreference: "unisex", // Default, will be updated by OnboardingModal
          aesthetic: "minimalist",
          email: cred.user.email,
          dateCreated: new Date().toISOString()
        });

        // Clear onboarding flag to force modal prompt on landing page
        if (typeof window !== "undefined") {
          localStorage.removeItem("onboarding_completed");
        }
      } else {
        // Login user
        await signInWithEmailAndPassword(auth, email, password);
      }
      
      router.push("/");
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/email-already-in-use") {
        setError("This email is already in use.");
      } else if (err.code === "auth/weak-password") {
        setError("Password should be at least 6 characters.");
      } else if (err.code === "auth/invalid-credential") {
        setError("Invalid email or password.");
      } else {
        setError("Authentication failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#F6F4EB] dark:bg-[#1A1A18] px-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md bg-[#FDFAF5] dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-[2.5rem] p-8 md:p-10 shadow-xl"
      >
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative w-16 h-16 mb-4 flex items-center justify-center">
            <Image
              src="/assets/aura-logo.png"
              alt="Aura Logo"
              width={64}
              height={64}
              priority
              className="object-contain"
            />
          </div>
          <h1 className="font-serif text-4xl font-light tracking-[0.25em] text-gray-900 antialiased uppercase">
            AURA
          </h1>
          <p className="text-[9px] tracking-[0.3em] text-black/40 dark:text-white/40 uppercase mt-2">
            {isSignUp ? "Create your wardrobe account" : "Sign in to your wardrobe"}
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs text-center font-medium tracking-wide"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email field */}
          <div className="flex flex-col space-y-2">
            <label className="text-[10px] tracking-[0.2em] uppercase font-semibold text-black/50 dark:text-white/50 pl-1">
              Email Address
            </label>
            <div className="relative flex items-center">
              <Mail size={14} className="absolute left-4 text-black/35 dark:text-white/35" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="style@aura.com"
                className="w-full pl-11 pr-4 py-3.5 rounded-full text-xs bg-white dark:bg-[#1A1A18] border border-black/5 dark:border-white/10 text-black dark:text-white placeholder-black/30 dark:placeholder-white/30 focus:outline-none focus:border-black/20 dark:focus:border-white/20 transition-all font-medium"
              />
            </div>
          </div>

          {/* Password field */}
          <div className="flex flex-col space-y-2">
            <label className="text-[10px] tracking-[0.2em] uppercase font-semibold text-black/50 dark:text-white/50 pl-1">
              Password
            </label>
            <div className="relative flex items-center">
              <Lock size={14} className="absolute left-4 text-black/35 dark:text-white/35" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3.5 rounded-full text-xs bg-white dark:bg-[#1A1A18] border border-black/5 dark:border-white/10 text-black dark:text-white placeholder-black/30 dark:placeholder-white/30 focus:outline-none focus:border-black/20 dark:focus:border-white/20 transition-all font-medium"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-full bg-[#FFD1C8] text-[#1A1A18] font-bold tracking-widest uppercase text-xs hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 shadow-[0_4px_14px_rgba(255,209,200,0.4)] mt-6"
          >
            {loading ? "Authenticating..." : isSignUp ? "Sign Up" : "Log In"}
          </button>
        </form>

        {/* Toggle link */}
        <div className="text-center mt-8">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
            }}
            className="text-[10px] uppercase font-semibold tracking-widest text-black/40 hover:text-black/80 dark:text-white/40 dark:hover:text-white/80 transition-colors"
          >
            {isSignUp ? "Already have an account? Log In" : "Don't have an account? Sign Up"}
          </button>
        </div>
      </motion.div>
    </main>
  );
}
