"use client";

import { useState, useEffect } from "react";

export interface WeatherData {
  temp: number;
  condition: string;
  location: string;
}

export function useWeather() {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setLoading(false);
      return;
    }

    const apiKey = process.env.NEXT_PUBLIC_WEATHER_API_KEY;

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;

          if (!apiKey) {
            setError("Weather API key missing");
            setLoading(false);
            return;
          }

          const res = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${apiKey}`
          );

          if (!res.ok) {
            throw new Error(`Weather fetch failed: ${res.statusText}`);
          }

          const data = await res.json();
          const temp = Math.round(data.main?.temp ?? 20);
          const condition = data.weather?.[0]?.main || "Clear";
          const location = data.name || "Local Area";

          setWeatherData({ temp, condition, location });
          setError(null);
        } catch (err: any) {
          console.error("Error fetching weather data:", err);
          setError(err.message || "Failed to fetch weather data");
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.warn("Geolocation error:", err.message);
        setError(err.message || "Geolocation access denied");
        setLoading(false);
      },
      { timeout: 10000, maximumAge: 600000 }
    );
  }, []);

  return { weatherData, error, loading };
}
