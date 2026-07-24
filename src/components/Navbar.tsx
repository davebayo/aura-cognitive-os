"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Shirt, PlusCircle, History } from "lucide-react";
import Image from "next/image";

export default function Navbar() {
  const pathname = usePathname();

  if (pathname === "/login") return null;

  const navItems = [
    { href: "/", label: "Daily Pick", icon: null },
    { href: "/closet", label: "My Closet", icon: Shirt },
    { href: "/upload", label: "Add Items", icon: PlusCircle },
    { href: "/history", label: "History", icon: History },
  ];

  return (
    <motion.nav
      initial={{ y: 30, x: "-50%", opacity: 0 }}
      animate={{ y: 0, x: "-50%", opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="fixed bottom-6 left-1/2 z-50 w-[92%] max-w-md bg-[#F6F4EB]/80 dark:bg-[#1A1A18]/85 backdrop-blur-lg border border-black/5 dark:border-white/10 rounded-full p-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.4)] flex items-center justify-between"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`relative flex-1 py-2.5 px-3 flex items-center justify-center gap-2 rounded-full transition-colors duration-300 group ${
              isActive
                ? "text-black dark:text-white"
                : "text-black/40 dark:text-white/40 hover:text-black/70 dark:hover:text-white/70"
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="active-nav-pill"
                className="absolute inset-0 bg-black/[0.05] dark:bg-white/[0.08] rounded-full -z-10"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            {Icon ? (
              <Icon
                size={15}
                strokeWidth={isActive ? 2 : 1.5}
                className={`transition-transform duration-300 group-hover:scale-110 ${
                  isActive ? "scale-105" : ""
                }`}
              />
            ) : (
              <div className="relative w-4 h-4 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                <Image
                  src="/assets/aura-logo.png"
                  alt="Aura Logo"
                  width={16}
                  height={16}
                  className={`object-contain transition-all duration-300 ${
                    isActive ? "opacity-100" : "opacity-45 group-hover:opacity-75"
                  }`}
                />
              </div>
            )}
            <span className="text-[9px] md:text-[10px] font-medium tracking-widest uppercase select-none">
              {item.label}
            </span>
          </Link>
        );
      })}
    </motion.nav>
  );
}
