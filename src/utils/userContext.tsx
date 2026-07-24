"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/firebase";

interface UserProfile {
  stylePreference: string;
  aesthetic: string;
}

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  userProfile: UserProfile | null;
  updateUserProfile: (stylePreference: string, aesthetic: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  loading: true,
  userProfile: null,
  updateUserProfile: async () => {}
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserProfile({
              stylePreference: data.stylePreference || "unisex",
              aesthetic: data.aesthetic || "minimalist"
            });
          } else {
            setUserProfile(null);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const updateUserProfile = async (stylePreference: string, aesthetic: string) => {
    if (!currentUser) return;
    try {
      await setDoc(doc(db, "users", currentUser.uid), {
        stylePreference,
        aesthetic
      }, { merge: true });
      
      setUserProfile({ stylePreference, aesthetic });
    } catch (error) {
      console.error("Error updating user profile:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, loading, userProfile, updateUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
