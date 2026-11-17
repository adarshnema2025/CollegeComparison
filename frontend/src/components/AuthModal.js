"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import {
  X,
  Scale,
  Sparkles,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  GraduationCap,
  Building2,
  Compass,
  MapPin,
} from "lucide-react";

export default function AuthModal() {
  const {
    authModalOpen,
    closeAuthModal,
    authModalTab,
    setAuthModalTab,
    authModalReason,
    setCurrentUser,
    loginUser,
    registerUser,
    loginDemoUser,
    isLoadingAuth,
    showToast,
  } = useApp();

  // Login Form States
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Sign Up Form States
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [showSignupPassword, setShowSignupPassword] = useState(false);

  // Sign Up Selectable Chips
  const [selectedDegree, setSelectedDegree] = useState("B.Tech CSE");
  const [selectedEducation, setSelectedEducation] = useState("Class 12 Appearing");
  const [selectedCity, setSelectedCity] = useState("Delhi NCR");

  // Sign Up Error State
  const [signupError, setSignupError] = useState("");

  if (!authModalOpen) return null;

  // Handle Login Submission
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError("");

    if (!loginIdentifier.trim()) {
      setLoginError("Please enter your registered email address.");
      return;
    }
    if (!loginPassword) {
      setLoginError("Please enter your password.");
      return;
    }

    const res = await loginUser(loginIdentifier.trim(), loginPassword);
    if (res?.isAdmin) {
      window.location.replace("/admin");
      return;
    }
    if (!res?.success) {
      setLoginError(res?.error || "Invalid credentials. Please verify your email and password.");
    }
  };

  // Handle Sign Up Submission with Live Backend Registration
  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setSignupError("");

    if (!signupName.trim()) {
      setSignupError("Please enter your full name.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(signupEmail.trim())) {
      setSignupError("Please enter a valid email address (e.g., student@domain.com).");
      return;
    }
    if (signupPassword.length < 6) {
      setSignupError("Password must be at least 6 characters long.");
      return;
    }
    if (!selectedDegree) {
      setSignupError("Please select your target degree.");
      return;
    }
    if (!selectedEducation) {
      setSignupError("Please select your current education level.");
      return;
    }
    if (!selectedCity) {
      setSignupError("Please select your preferred study city.");
      return;
    }

    const res = await registerUser({
      name: signupName.trim(),
      email: signupEmail.trim(),
      password: signupPassword,
      mobile: "9876543210",
      targetDegree: selectedDegree,
      educationLevel: selectedEducation,
      preferredCity: selectedCity,
    });

    if (!res.success) {
      setSignupError(res.error || "Unable to register account with backend.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-fade-in">
      <div
        className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col md:flex-row max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ========================================================= */}
        {/* LEFT ILLUSTRATION PANEL (DESKTOP ONLY) */}
        {/* ========================================================= */}
        <div className="hidden md:flex md:w-5/12 bg-gradient-to-br from-[#0B1120] via-[#0F172A] to-[#1E1B4B] p-8 text-white flex-col justify-between relative overflow-hidden border-r border-slate-800">
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute -top-10 -left-10 w-48 h-48 bg-indigo-600/20 blur-3xl rounded-full pointer-events-none"></div>
          <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-emerald-600/20 blur-3xl rounded-full pointer-events-none"></div>

          {/* Top Brand Identity */}
          <div className="relative z-10 space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
                <Scale className="w-5 h-5 text-white" />
              </div>
              <span className="font-extrabold text-white text-lg tracking-tight">
                College<span className="text-indigo-400">Comparison</span>
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium">
              India&apos;s clean head-to-head college & cutoff platform.
            </p>
          </div>

          {/* Middle: Clean Minimalist Graphic Illustration */}
          <div className="relative z-10 my-6 space-y-4">
            {/* Visual Glass Card Illustration */}
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 space-y-3 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  NIRF #1 vs #2
                </span>
                <span className="text-[10px] text-indigo-300 font-bold">Live Compare</span>
              </div>

              {/* Graphic Comparison Row Preview */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded-lg bg-slate-900/60 border border-white/10">
                  <p className="font-bold text-white text-[11px]">IIT Bombay</p>
                  <p className="text-emerald-400 font-extrabold text-[10px]">₹21.8 LPA Median</p>
                </div>
                <div className="p-2 rounded-lg bg-slate-900/60 border border-white/10">
                  <p className="font-bold text-white text-[11px]">IIT Delhi</p>
                  <p className="text-emerald-400 font-extrabold text-[10px]">₹21.0 LPA Median</p>
                </div>
              </div>
            </div>

            {/* Value Highlights */}
            <ul className="space-y-2.5 text-xs text-slate-300 pt-1">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Verified 2024 JoSAA & JAC Delhi closing cutoffs</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Real median packages, zero inflated ad claims</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Independent 1-on-1 mentorship with ex-IITians</span>
              </li>
            </ul>
          </div>

          {/* Bottom Trust Badge */}
          <div className="relative z-10 pt-4 border-t border-slate-800 flex items-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>100% Privacy • No sponsored college referrals</span>
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT FORM PANEL (LOGIN / SIGN UP WITH ONBOARDING) */}
        {/* ========================================================= */}
        <div className="w-full md:w-7/12 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto">
          {/* Header Bar: Tab Switch + Close Button */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            {/* Tab Pill Switcher */}
            <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setAuthModalTab("login");
                  setLoginError("");
                  setSignupError("");
                }}
                className={`px-4 py-1.5 rounded-lg transition-all cursor-pointer ${
                  authModalTab === "login"
                    ? "bg-white text-indigo-600 shadow-xs font-extrabold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthModalTab("signup");
                  setLoginError("");
                  setSignupError("");
                }}
                className={`px-4 py-1.5 rounded-lg transition-all cursor-pointer ${
                  authModalTab === "signup"
                    ? "bg-white text-indigo-600 shadow-xs font-extrabold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={closeAuthModal}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* FORM CONTENT CONTAINER */}
          <div className="py-4">
            {/* Context Banner if opened from Compare Action */}
            {authModalReason === "compare" && (
              <div className="mb-4 p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200/90 text-xs text-indigo-950 flex items-start gap-3 shadow-xs animate-fade-in">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                  <Scale className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-extrabold text-indigo-900 text-xs sm:text-sm">
                    Sign In to Compare Colleges
                  </p>
                  <p className="text-slate-600 mt-0.5 text-[11px] leading-relaxed">
                    Log in or create a free student account to compare your selected colleges side-by-side with verified 2024 cutoffs, median placement packages, and fee matrices.
                  </p>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------- */}
            {/* TAB 1: LOG IN */}
            {/* ------------------------------------------------------- */}
            {authModalTab === "login" && (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
                    Welcome back, Student
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Sign in to resume comparisons, view consultation bookings, and update choices.
                  </p>
                </div>

                {/* Quick Demo Account Options */}
                <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-slate-900 leading-tight">Need a test account?</p>
                      <p className="text-[11px] text-slate-600">Pre-fill credentials for demo testing</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setLoginIdentifier("aarav.sharma@gmail.com");
                        setLoginPassword("password123");
                        setLoginError("");
                      }}
                      className="px-2.5 py-1.5 rounded-lg border border-indigo-300 bg-white hover:bg-indigo-50 text-indigo-700 text-xs font-bold shadow-2xs transition-all cursor-pointer shrink-0"
                    >
                      Pre-fill Demo
                    </button>
                    <button
                      type="button"
                      onClick={loginDemoUser}
                      className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-2xs transition-all cursor-pointer shrink-0"
                    >
                      1-Click Login
                    </button>
                  </div>
                </div>

                {/* Error Banner */}
                {loginError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2 animate-fade-in">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}

                {/* Email / Mobile Input */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Email or Mobile Number
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      placeholder="student@example.com or 9876543210"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-xs sm:text-sm font-semibold outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">Password</label>
                    <button
                      type="button"
                      onClick={loginDemoUser}
                      className="text-[11px] font-semibold text-indigo-600 hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type={showLoginPassword ? "text" : "password"}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-xs sm:text-sm font-semibold outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Action Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoadingAuth}
                    className="w-full py-3 rounded-xl bg-slate-900 hover:bg-indigo-600 disabled:opacity-70 text-white font-extrabold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>{isLoadingAuth ? "Connecting to Backend..." : "Sign In to Student Portal"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}

            {/* ------------------------------------------------------- */}
            {/* TAB 2: SIGN UP WITH ONBOARDING CHIPS */}
            {/* ------------------------------------------------------- */}
            {authModalTab === "signup" && (
              <form onSubmit={handleSignupSubmit} className="space-y-4">
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
                    Create Your Account
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Select your admission targets to get personalized cutoff matches.
                  </p>
                </div>

                {/* Error Banner */}
                {signupError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2 animate-fade-in">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{signupError}</span>
                  </div>
                )}

                {/* Step 1: Basic Credentials */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      placeholder="e.g., Aarav Sharma"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-xs font-semibold outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      placeholder="student@example.com"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-xs font-semibold outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Password (Min 6 characters)
                  </label>
                  <div className="relative">
                    <input
                      type={showSignupPassword ? "text" : "password"}
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 pr-10 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-xs font-semibold outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignupPassword(!showSignupPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showSignupPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Step 2: Onboarding Selectable Chips */}
                {/* 1. Target Degree Chips */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
                      1. Target Degree
                    </label>
                    <span className="text-[10px] text-indigo-600 font-bold">Pick one</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      "B.Tech CSE",
                      "B.Tech AI/DS",
                      "B.Tech ECE",
                      "B.Tech Mech",
                      "MBA / PGDM",
                      "Dual Degree",
                    ].map((deg) => (
                      <button
                        key={deg}
                        type="button"
                        onClick={() => setSelectedDegree(deg)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          selectedDegree === deg
                            ? "bg-indigo-600 text-white shadow-xs"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                        }`}
                      >
                        {deg}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Education Level Chips */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
                      2. Education Level
                    </label>
                    <span className="text-[10px] text-indigo-600 font-bold">Pick one</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      "Class 12 Appearing",
                      "Class 12 Passed (Dropper)",
                      "UG Final Year",
                      "Working Professional",
                    ].map((edu) => (
                      <button
                        key={edu}
                        type="button"
                        onClick={() => setSelectedEducation(edu)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          selectedEducation === edu
                            ? "bg-indigo-600 text-white shadow-xs"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                        }`}
                      >
                        {edu}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Preferred City Chips */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
                      3. Preferred City / Region
                    </label>
                    <span className="text-[10px] text-indigo-600 font-bold">Pick one</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      "Delhi NCR",
                      "Mumbai",
                      "Pune",
                      "Bengaluru",
                      "Hyderabad",
                      "All India",
                    ].map((city) => (
                      <button
                        key={city}
                        type="button"
                        onClick={() => setSelectedCity(city)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          selectedCity === city
                            ? "bg-indigo-600 text-white shadow-xs"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                        }`}
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit Action Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoadingAuth}
                    className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-70 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>{isLoadingAuth ? "Creating Account..." : "Complete Registration & Launch Hub"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Modal Footer Trust Note */}
          <div className="pt-3 border-t border-slate-100 text-center">
            <p className="text-[11px] text-slate-400">
              By continuing, you agree to CollegeComparison&apos;s Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
