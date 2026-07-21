"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePreferences } from "@/components/theme/PreferencesProvider";
import { LandingCardWheel } from "@/components/marketing/LandingCardWheel";
import { SmartDukaLogo } from "@/components/common/SmartDukaLogo";
import { MiloAlert } from "@/components/ui/MiloAlert";

export default function MarketingHomePage() {
  const { preferences, setPreference } = usePreferences();
  const [mounted, setMounted] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setIsExpired(params.get("expired") === "true");
    }
  }, []);

  const isDark = mounted && (preferences.theme === "dark" || (preferences.theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches));

  const toggleTheme = () => {
    setPreference("theme", isDark ? "light" : "dark");
  };

  // Green color matching the logo (#30D158 in dark mode, or the logo green #2e7d32 in light mode)
  const greenColorClass = isDark 
    ? "bg-[#30D158] text-[#0a0e0c] hover:bg-[#2ebd59] shadow-[#30d158]/15" 
    : "bg-[#2e7d32] text-white hover:bg-[#1b5e20] shadow-[#2e7d32]/15";

  return (
    <main 
      id="main-content" 
      className={`h-dvh overflow-hidden relative flex flex-col justify-between transition-colors duration-300 ${
        isDark ? "bg-[#000000] text-slate-100" : "bg-[#f5f5f7] text-[#122116]"
      }`}
    >
      {/* Backdrop Grid Lines */}
      <div 
        aria-hidden 
        className="pointer-events-none absolute inset-0 transition-opacity" 
        style={{ 
          backgroundImage: isDark
            ? "linear-gradient(rgba(156, 163, 175, 0.14) 1px, transparent 1px), linear-gradient(90deg, rgba(156, 163, 175, 0.14) 1px, transparent 1px)"
            : "linear-gradient(rgba(18, 33, 22, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(18, 33, 22, 0.05) 1px, transparent 1px)", 
          backgroundSize: "74px 74px", 
          maskImage: "linear-gradient(to bottom, black, transparent 85%)" 
        }} 
      />

      {/* Navigation Header */}
      <header className="z-20 mx-auto w-full max-w-6xl px-4 py-4 sm:px-6 sm:py-6">
        <nav className="relative z-10 flex items-center justify-between gap-4">
          <SmartDukaLogo />
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Toggle Button */}
            <button 
              onClick={toggleTheme} 
              className={`p-2.5 rounded-full transition-all duration-200 ${
                isDark 
                  ? "bg-white/10 hover:bg-white/20 text-yellow-400" 
                  : "bg-black/5 hover:bg-black/10 text-gray-700"
              }`}
              aria-label="Toggle theme"
            >
              {isDark ? (
                // Sun icon for dark mode (click to light)
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0s-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0s-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm1.06-10.96c.39-.39.39-1.03 0-1.41s-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.01c.39-.39.39-1.03 0-1.41s-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z"/>
                </svg>
              ) : (
                // Moon icon for light mode (click to dark)
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            <Link 
              href="/sign-in" 
              className={`rounded-full px-2.5 py-2 text-sm font-semibold sm:px-5 transition ${
                isDark ? "text-slate-200 hover:text-white" : "text-[#122116] hover:text-[#122116]/80"
              }`}
            >
              Log in
            </Link>
            <Link 
              href="/sign-up" 
              className={`rounded-full px-3 py-2 text-sm font-bold transition-all duration-200 sm:px-4 ${
                isDark ? "bg-slate-100 text-[#0a0e0c] hover:bg-slate-200" : "bg-[#122116] text-white hover:bg-[#122116]/90"
              }`}
            >
              Sign up
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Content */}
      <div className={`relative z-10 mx-auto flex min-h-0 max-w-3xl flex-1 flex-col items-center pb-2 text-center px-4 sm:px-6 ${
        isExpired ? "justify-start pt-2 sm:justify-center sm:pt-10" : "justify-center pt-8 sm:pt-10"
      }`}>
        {isExpired && (
          <MiloAlert
            kind="warning"
            message="Your session expired. Sign in again to keep managing your duka."
            className="mb-4 w-full max-w-md sm:mb-6"
          />
        )}
        <p className={`text-xs font-bold uppercase tracking-[0.18em] transition-colors ${
          isDark ? "text-[#2e7d32]" : "text-[#2e7d32]"
        }`}>
          Play. Learn. Grow.
        </p>
        <h1 className={`font-black leading-[1.04] tracking-tight sm:text-6xl lg:text-7xl ${
          isExpired ? "mt-3 text-3xl sm:mt-4 sm:text-6xl" : "mt-4 text-4xl"
        }`}>
          A learning adventure<br />in every duka.
        </h1>
        <p className={`max-w-xl text-[13px] leading-5 transition-colors sm:mt-4 sm:text-base sm:leading-6 ${
          isExpired ? "mt-3" : "mt-4"
        } ${
          isDark ? "text-slate-300" : "text-[#122116]/75"
        }`}>
          Run your own shop, help friendly customers, and build everyday maths and reading skills through play.
        </p>
        <div className={`flex flex-col items-center gap-1.5 sm:gap-2 ${isExpired ? "mt-4 sm:mt-6" : "mt-6"}`}>
          <Link 
            href="/sign-up" 
            className={`inline-flex rounded-full px-5 py-2.5 font-bold transition-all duration-200 shadow-md sm:px-6 sm:py-3 ${greenColorClass}`}
          >
            Create my duka
          </Link>
          <p className={`text-xs transition-colors ${
            isDark ? "text-slate-500" : "text-[#122116]/50"
          }`}>
            Create an account first, then set up your duka.
          </p>
        </div>
      </div>

      {/* Card Wheel */}
      <LandingCardWheel />
    </main>
  );
}
