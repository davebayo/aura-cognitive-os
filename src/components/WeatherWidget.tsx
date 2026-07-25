"use client";

import { motion } from "framer-motion";
import { useWeather } from "@/hooks/useWeather";
import {
  Sun,
  CloudSun,
  CloudRain,
  Cloud,
  Snowflake,
  CloudLightning,
  MapPin,
} from "lucide-react";

export default function WeatherWidget() {
  const { weatherData, error, loading } = useWeather();

  const getWeatherIcon = (condition?: string) => {
    if (!condition) return <CloudSun size={14} className="text-amber-400" />;
    const cond = condition.toLowerCase();
    if (cond.includes("clear") || cond.includes("sun")) {
      return <Sun size={14} className="text-amber-400" />;
    }
    if (cond.includes("rain") || cond.includes("drizzle")) {
      return <CloudRain size={14} className="text-blue-400" />;
    }
    if (cond.includes("snow")) {
      return <Snowflake size={14} className="text-cyan-300" />;
    }
    if (cond.includes("thunder") || cond.includes("storm")) {
      return <CloudLightning size={14} className="text-purple-400" />;
    }
    if (cond.includes("cloud")) {
      return <Cloud size={14} className="text-slate-400" />;
    }
    return <CloudSun size={14} className="text-amber-400" />;
  };

  if (loading) {
    return (
      <motion.div
        whileHover={{ scale: 1.03, backgroundColor: "rgba(255, 255, 255, 0.18)" }}
        whileTap={{ scale: 0.95 }}
        className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white/10 dark:bg-black/20 backdrop-blur-md border border-white/20 dark:border-white/10 text-xs font-medium text-black/70 dark:text-white/70 shadow-sm cursor-pointer"
      >
        <CloudSun size={14} className="opacity-70" />
        <span className="tracking-wider uppercase text-[11px]">Loading weather...</span>
      </motion.div>
    );
  }

  if (error || !weatherData) {
    return (
      <motion.div
        whileHover={{ scale: 1.03, backgroundColor: "rgba(255, 255, 255, 0.18)" }}
        whileTap={{ scale: 0.95 }}
        className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white/10 dark:bg-black/20 backdrop-blur-md border border-white/20 dark:border-white/10 text-xs font-medium text-black/70 dark:text-white/70 shadow-sm cursor-pointer"
        title={error || "Weather data unavailable"}
      >
        <CloudSun size={14} className="text-amber-400" />
        <span className="tracking-wider uppercase text-[11px]">22°C • Sunny</span>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ scale: 1.04, backgroundColor: "rgba(255, 255, 255, 0.22)" }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white/10 dark:bg-black/20 backdrop-blur-md border border-white/20 dark:border-white/10 text-xs font-medium text-black/80 dark:text-white/80 shadow-sm cursor-pointer transition-colors"
    >
      {getWeatherIcon(weatherData.condition)}
      <span className="font-semibold">{weatherData.temp}°C</span>
      <span className="opacity-40">•</span>
      <span className="tracking-wide uppercase text-[10px] opacity-80">
        {weatherData.condition}
      </span>
      {weatherData.location && (
        <>
          <span className="opacity-40">•</span>
          <div className="flex items-center space-x-1 opacity-75 text-[10px] uppercase tracking-wider">
            <MapPin size={10} />
            <span>{weatherData.location}</span>
          </div>
        </>
      )}
    </motion.div>
  );
}
