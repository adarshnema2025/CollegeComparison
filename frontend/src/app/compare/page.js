"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { COLLEGES } from "@/data/colleges";
import { useApp } from "@/context/AppContext";
import { compareApi, collegesApi, getToken } from "@/lib/api";
import {
  Scale,
  ArrowLeftRight,
  Trophy,
  IndianRupee,
  Calendar,
  Sparkles,
  Building2,
  CheckCircle2,
  Bookmark,
  Share2,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  ExternalLink,
  GraduationCap,
  Users,
  Clock,
  Layers,
  Award,
  Zap,
  X,
  Search,
  Lock,
} from "lucide-react";

function CompareArenaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const c1Param = searchParams.get("c1");
  const c2Param = searchParams.get("c2");

  const {
    openCounsellingModal,
    showToast,
    currentUser,
    compareList,
    setCompareList,
    fetchUserData,
    authInitialized,
    isLoadingAuth,
    openAuthModal,
    loginDemoUser,
  } = useApp();

  // If user visits compare without authentication, prompt login modal
  useEffect(() => {
    if (authInitialized && !currentUser) {
      openAuthModal("login", "compare");
    }
  }, [authInitialized, currentUser, openAuthModal]);

  // Selected College IDs
  const [colAId, setColAId] = useState(() => {
    if (c1Param && COLLEGES.some((c) => c.id === c1Param || c.slug === c1Param)) return c1Param;
    if (compareList && compareList[0]) return compareList[0].slug || compareList[0].id;
    return "iit-bombay";
  });

  const [colBId, setColBId] = useState(() => {
    if (c2Param && COLLEGES.some((c) => c.id === c2Param || c.slug === c2Param)) return c2Param;
    if (compareList && compareList[1]) return compareList[1].slug || compareList[1].id;
    return "iit-delhi";
  });

  // Change College Modal State
  const [changeCollegeModalTarget, setChangeCollegeModalTarget] = useState(null); // 'A' | 'B' | null
  const [modalSearch, setModalSearch] = useState("");

  // Sync with URL query parameters or compareList changes
  useEffect(() => {
    if (c1Param && COLLEGES.some((c) => c.id === c1Param || c.slug === c1Param)) {
      setColAId(c1Param);
    } else if (compareList && compareList[0]) {
      setColAId(compareList[0].slug || compareList[0].id);
    }
  }, [c1Param, compareList]);

  useEffect(() => {
    if (c2Param && COLLEGES.some((c) => c.id === c2Param || c.slug === c2Param)) {
      setColBId(c2Param);
    } else if (compareList && compareList[1]) {
      setColBId(compareList[1].slug || compareList[1].id);
    }
  }, [c2Param, compareList]);

  const collegeA = COLLEGES.find((c) => c.id === colAId || c.slug === colAId) || COLLEGES[0];
  const collegeB = COLLEGES.find((c) => c.id === colBId || c.slug === colBId) || COLLEGES[1];

  // Auto-match student's Target Degree if available, otherwise default to index 0
  const getIndexForTarget = (college) => {
    if (!college?.programs?.length) return 0;
    if (currentUser?.targetDegree) {
      const target = currentUser.targetDegree.toLowerCase();
      const idx = college.programs.findIndex((p) => {
        const name = (p.name || p.displayName || "").toLowerCase();
        return name.includes(target) || target.includes(name);
      });
      if (idx !== -1) return idx;
    }
    return 0;
  };

  // Selected Programs for each college
  const [progAIndex, setProgAIndex] = useState(() => getIndexForTarget(collegeA));
  const [progBIndex, setProgBIndex] = useState(() => getIndexForTarget(collegeB));

  // Saved Comparison State
  const [isSaved, setIsSaved] = useState(false);

  // Active hover tooltip for bar chart
  const [activeChartMetric, setActiveChartMetric] = useState(null);

  const programA = collegeA.programs[progAIndex] || collegeA.programs[0];
  const programB = collegeB.programs[progBIndex] || collegeB.programs[0];

  // Swap Colleges A & B
  const handleSwap = () => {
    const tempCol = colAId;
    setColAId(colBId);
    setColBId(tempCol);

    const tempProg = progAIndex;
    setProgAIndex(progBIndex);
    setProgBIndex(tempProg);

    if (setCompareList) {
      setCompareList([collegeB, collegeA]);
    }
    router.replace(`/compare?c1=${encodeURIComponent(colBId)}&c2=${encodeURIComponent(tempCol)}`, { scroll: false });
  };

  // Change College A
  const handleSelectCollegeA = (id) => {
    setColAId(id);
    const col = COLLEGES.find((c) => c.id === id || c.slug === id);
    if (col) {
      setProgAIndex(getIndexForTarget(col));
      if (setCompareList) {
        setCompareList([col, collegeB]);
      }
      router.replace(
        `/compare?c1=${encodeURIComponent(col.slug || col.id)}&c2=${encodeURIComponent(collegeB.slug || collegeB.id)}`,
        { scroll: false }
      );
    }
  };

  // Change College B
  const handleSelectCollegeB = (id) => {
    setColBId(id);
    const col = COLLEGES.find((c) => c.id === id || c.slug === id);
    if (col) {
      setProgBIndex(getIndexForTarget(col));
      if (setCompareList) {
        setCompareList([collegeA, col]);
      }
      router.replace(
        `/compare?c1=${encodeURIComponent(collegeA.slug || collegeA.id)}&c2=${encodeURIComponent(col.slug || col.id)}`,
        { scroll: false }
      );
    }
  };

  // Automatically save comparisons for logged-in users
  useEffect(() => {
    let isCancelled = false;

    const autoSave = async () => {
      const token = getToken();
      if (!token) return;

      try {
        const [progsARes, progsBRes] = await Promise.allSettled([
          collegesApi.getPrograms(collegeA.slug || collegeA.id),
          collegesApi.getPrograms(collegeB.slug || collegeB.id),
        ]);

        const progsA = progsARes.status === "fulfilled" && Array.isArray(progsARes.value) ? progsARes.value : [];
        const progsB = progsBRes.status === "fulfilled" && Array.isArray(progsBRes.value) ? progsBRes.value : [];

        let matchedA = null;
        let matchedB = null;

        for (const pa of progsA) {
          const match = progsB.find((pb) => pb.degree === pa.degree && pb.branch === pa.branch);
          if (match) {
            matchedA = pa;
            matchedB = match;
            break;
          }
        }

        const idA = matchedA?.id || progsA[0]?.id || 1;
        const idB = matchedB?.id || progsB[0]?.id || (idA === 1 ? 2 : 1);

        if (idA && idB && idA !== idB && !isCancelled) {
          await compareApi.create({ programAId: idA, programBId: idB });
          if (!isCancelled) {
            setIsSaved(true);
            if (fetchUserData) fetchUserData();
          }
        }
      } catch (err) {
        console.warn("[AutoSave] Comparison notice:", err.message);
      }
    };

    const timer = setTimeout(autoSave, 600);
    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [colAId, colBId, progAIndex, progBIndex, collegeA, collegeB]);

  // Helper to extract numerical value from salary strings like "₹34.2 LPA"
  const parseNum = (val) => {
    if (typeof val === "number") return val;
    if (!val) return 0;
    const match = val.match(/[\d.]+/);
    return match ? parseFloat(match[0]) : 0;
  };

  // Program fee helpers
  const feeANum = collegeA.stats.totalDegreeFeeNum;
  const feeBNum = collegeB.stats.totalDegreeFeeNum;

  const avgCtcANum = parseNum(programA.avgCTC);
  const avgCtcBNum = parseNum(programB.avgCTC);

  const highestCtcANum = parseNum(collegeA.stats.highestDomestic);
  const highestCtcBNum = parseNum(collegeB.stats.highestDomestic);

  const campusAcresA = parseNum(collegeA.campusSize);
  const campusAcresB = parseNum(collegeB.campusSize);

  // Row evaluations: returns 'A' | 'B' | 'TIE'
  const evaluations = {
    nirf: collegeA.nirfRank < collegeB.nirfRank ? "A" : collegeB.nirfRank < collegeA.nirfRank ? "B" : "TIE",
    fees: feeANum < feeBNum ? "A" : feeBNum < feeANum ? "B" : "TIE",
    duration: programA.duration === programB.duration ? "TIE" : "TIE",
    seats: programA.seats > programB.seats ? "A" : programB.seats > programA.seats ? "B" : "TIE",
    avgCTC: avgCtcANum > avgCtcBNum ? "A" : avgCtcBNum > avgCtcANum ? "B" : "TIE",
    highestCTC: highestCtcANum > highestCtcBNum ? "A" : highestCtcBNum > highestCtcANum ? "B" : "TIE",
    infrastructure: campusAcresA > campusAcresB ? "A" : campusAcresB > campusAcresA ? "B" : "TIE",
  };

  // Smart Rival Suggestions: other colleges filtered out
  const smartRivals = useMemo(() => {
    return COLLEGES.filter((c) => c.id !== collegeA.id && c.id !== collegeB.id).map((c) => {
      let badge = "Similar Domain";
      if (c.nirfRank <= 10 && (collegeA.nirfRank <= 10 || collegeB.nirfRank <= 10)) {
        badge = "Exact Match";
      } else if (c.programs.some((p) => p.name.includes("Computer Science"))) {
        badge = "Same Branch";
      }
      return {
        ...c,
        matchBadge: badge,
      };
    }).slice(0, 4);
  }, [collegeA, collegeB]);

  // Handle Save Comparison with Live Backend Sync
  const handleSaveComparison = async () => {
    setIsSaved(true);
    if (getToken()) {
      try {
        const idA = Number(programA?.id) || 1;
        const idB = Number(programB?.id) || 2;
        await compareApi.create({
          programAId: idA,
          programBId: idB === idA ? idB + 1 : idB,
        });
      } catch (err) {
        console.warn("Backend save comparison notice:", err.message);
      }
    }
    showToast(`Saved ${collegeA.shortName} vs ${collegeB.shortName} to Student Hub!`, "success");
  };

  // Handle Share Comparison Link
  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      showToast("Comparison link copied to clipboard!", "info");
    }
  };

  // Bar Chart Data (Recharts-style grouped bars)
  const chartMetrics = [
    {
      label: "Median CTC",
      valA: collegeA.stats.medianSalaryNum,
      valB: collegeB.stats.medianSalaryNum,
      unit: "LPA",
    },
    {
      label: "Overall Avg CTC",
      valA: parseNum(collegeA.stats.avgSalary),
      valB: parseNum(collegeB.stats.avgSalary),
      unit: "LPA",
    },
    {
      label: "Selected Branch Avg",
      valA: avgCtcANum,
      valB: avgCtcBNum,
      unit: "LPA",
    },
    {
      label: "Peak Domestic CTC",
      valA: highestCtcANum,
      valB: highestCtcBNum,
      unit: "LPA",
    },
  ];

  const maxSalaryScale = Math.max(
    ...chartMetrics.flatMap((m) => [m.valA, m.valB]),
    70
  );

  // 1. Session verification placeholder
  if (!authInitialized || isLoadingAuth) {
    return (
      <div className="bg-slate-50 min-h-screen flex items-center justify-center py-24 px-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-bold text-slate-700">Verifying student session...</p>
          <p className="text-xs text-slate-500">Preparing head-to-head comparison arena</p>
        </div>
      </div>
    );
  }

  // 2. Authentication Gate: Must be logged in / signed up to view & compare colleges
  if (authInitialized && !currentUser) {
    return (
      <div className="bg-slate-50 min-h-screen pb-32 animate-fade-in">
        {/* Top Header Showing Colleges Selected */}
        <div className="bg-slate-900 text-white py-12 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
          <div className="max-w-4xl mx-auto text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-800/90 border border-slate-700 text-indigo-300 text-xs font-semibold shadow-inner">
              <Lock className="w-3.5 h-3.5 text-indigo-400" />
              <span>Head-to-Head Comparison Arena Locked</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              {collegeA.shortName} <span className="text-indigo-400 font-medium">vs</span> {collegeB.shortName}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
              You selected these two colleges for comparison. Sign in or create an account to unlock verified 2024 cutoff matrices, median placement records, and fee analysis.
            </p>
          </div>
        </div>

        {/* Lock Screen Card */}
        <div className="max-w-xl mx-auto px-4 -mt-8 relative z-20">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto shadow-inner">
              <Scale className="w-8 h-8 text-indigo-600" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Authentication Required
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                To prevent automated scraping and ensure genuine student counseling, comparing two colleges side-by-side requires an account.
              </p>
            </div>

            {/* Selected Colleges Pills */}
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-left">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${collegeA.avatarBg}`}>
                  {collegeA.code || collegeA.logoText}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">{collegeA.shortName}</p>
                  <p className="text-[10px] text-slate-500 font-semibold truncate">NIRF #{collegeA.nirfRank} • {collegeA.city}</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${collegeB.avatarBg}`}>
                  {collegeB.code || collegeB.logoText}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">{collegeB.shortName}</p>
                  <p className="text-[10px] text-slate-500 font-semibold truncate">NIRF #{collegeB.nirfRank} • {collegeB.city}</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={() => openAuthModal("login", "compare")}
                className="w-full py-3.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>Log In / Sign Up to View Comparison</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => loginDemoUser()}
                className="w-full py-3 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border border-slate-200"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Quick Test: Continue as Aarav Sharma (Demo)</span>
              </button>

              <Link
                href="/colleges"
                className="block text-xs font-semibold text-slate-500 hover:text-slate-800 pt-2 transition-colors"
              >
                ← Back to Colleges Directory
              </Link>
            </div>
          </div>
        </div>

        {/* Blurred Teaser Matrix Silhouette */}
        <div className="max-w-4xl mx-auto px-4 mt-8 opacity-40 blur-[2px] pointer-events-none select-none space-y-4">
          <div className="h-28 bg-white rounded-2xl border border-slate-200"></div>
          <div className="h-64 bg-white rounded-2xl border border-slate-200"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen pb-36">
      {/* 1. STICKY TOP HEADER WITH COLLEGE A & COLLEGE B */}
      <div className="sticky top-16 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="grid grid-cols-1 md:grid-cols-11 gap-3 items-center">
            {/* College A Header (5 cols) */}
            <div className="md:col-span-5 flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs shrink-0 shadow-xs ${collegeA.avatarBg}`}
                >
                  {collegeA.code || collegeA.logoText}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-slate-900 text-white">
                      #{collegeA.nirfRank}
                    </span>
                    <span className="text-xs sm:text-sm font-extrabold text-slate-900 truncate block">
                      {collegeA.shortName}
                    </span>
                  </div>
                  {/* Program Selector */}
                  <div className="relative mt-0.5">
                    <select
                      value={progAIndex}
                      onChange={(e) => setProgAIndex(Number(e.target.value))}
                      className="text-[11px] font-bold text-indigo-700 bg-transparent pr-4 outline-none cursor-pointer truncate max-w-[220px]"
                    >
                      {collegeA.programs.map((p, idx) => (
                        <option key={idx} value={idx}>
                          {p.name} ({p.degree})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Change College A Trigger Button & Dropdown */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setModalSearch("");
                    setChangeCollegeModalTarget("A");
                  }}
                  className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                  title="Open College Picker for College A"
                >
                  <span>Change</span>
                  <ChevronDown className="w-3 h-3" />
                </button>
                <select
                  value={collegeA.id}
                  onChange={(e) => handleSelectCollegeA(e.target.value)}
                  className="hidden sm:block px-2 py-1 rounded-lg border border-slate-300 text-[11px] font-bold text-slate-700 bg-white hover:bg-slate-50 outline-none cursor-pointer"
                  title="Quick Select College A"
                >
                  {COLLEGES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.shortName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Swap Button (1 col) */}
            <div className="md:col-span-1 flex justify-center">
              <button
                type="button"
                onClick={handleSwap}
                title="Swap College A and B"
                className="w-9 h-9 rounded-full border border-slate-300 hover:border-indigo-500 bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 flex items-center justify-center shadow-xs transition-all cursor-pointer group"
              >
                <ArrowLeftRight className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </button>
            </div>

            {/* College B Header (5 cols) */}
            <div className="md:col-span-5 flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs shrink-0 shadow-xs ${collegeB.avatarBg}`}
                >
                  {collegeB.code || collegeB.logoText}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-slate-900 text-white">
                      #{collegeB.nirfRank}
                    </span>
                    <span className="text-xs sm:text-sm font-extrabold text-slate-900 truncate block">
                      {collegeB.shortName}
                    </span>
                  </div>
                  {/* Program Selector */}
                  <div className="relative mt-0.5">
                    <select
                      value={progBIndex}
                      onChange={(e) => setProgBIndex(Number(e.target.value))}
                      className="text-[11px] font-bold text-indigo-700 bg-transparent pr-4 outline-none cursor-pointer truncate max-w-[220px]"
                    >
                      {collegeB.programs.map((p, idx) => (
                        <option key={idx} value={idx}>
                          {p.name} ({p.degree})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Change College B Trigger Button & Dropdown */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setModalSearch("");
                    setChangeCollegeModalTarget("B");
                  }}
                  className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                  title="Open College Picker for College B"
                >
                  <span>Change</span>
                  <ChevronDown className="w-3 h-3" />
                </button>
                <select
                  value={collegeB.id}
                  onChange={(e) => handleSelectCollegeB(e.target.value)}
                  className="hidden sm:block px-2 py-1 rounded-lg border border-slate-300 text-[11px] font-bold text-slate-700 bg-white hover:bg-slate-50 outline-none cursor-pointer"
                  title="Quick Select College B"
                >
                  {COLLEGES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.shortName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* 2. "SMART RIVAL PICKER" PANEL */}
        <section className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
              <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                Smart Rival Picker
              </h2>
              <span className="text-[11px] text-slate-500 font-medium">
                Suggested alternatives based on NIRF tier & branch overlap
              </span>
            </div>
            <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-full">
              Click to swap into Arena
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {smartRivals.map((rival) => {
              const badgeColors = {
                "Exact Match": "bg-emerald-50 text-emerald-700 border-emerald-200",
                "Similar Domain": "bg-blue-50 text-blue-700 border-blue-200",
                "Same Branch": "bg-purple-50 text-purple-700 border-purple-200",
              }[rival.matchBadge];

              return (
                <div
                  key={rival.id}
                  className="p-3 rounded-xl border border-slate-200 hover:border-indigo-300 bg-slate-50/60 hover:bg-white transition-all flex flex-col justify-between space-y-2 group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${badgeColors}`}>
                      {rival.matchBadge}
                    </span>
                    <span className="text-[11px] font-extrabold text-slate-700">
                      NIRF #{rival.nirfRank}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xs font-extrabold text-slate-900 leading-snug group-hover:text-indigo-600 transition-colors">
                      {rival.shortName}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {rival.city} • {rival.stats.medianSalary} Median
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => handleSelectCollegeA(rival.id)}
                      className="py-1 px-2 rounded-lg bg-white hover:bg-indigo-50 border border-slate-200 text-slate-700 hover:text-indigo-600 text-[10px] font-bold transition-all cursor-pointer"
                    >
                      Swap as A
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectCollegeB(rival.id)}
                      className="py-1 px-2 rounded-lg bg-white hover:bg-indigo-50 border border-slate-200 text-slate-700 hover:text-indigo-600 text-[10px] font-bold transition-all cursor-pointer"
                    >
                      Swap as B
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 3. COMPARISON MATRIX (With Emerald "Better" Tag & Sticky Label on Mobile) */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-extrabold tracking-tight">
                Head-to-Head Metric Matrix
              </h3>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>Better Value Highlighted</span>
              </span>
            </div>
          </div>

          {/* Matrix Table with Horizontal Swipe & Sticky Label Column for Mobile */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 uppercase tracking-wider text-[11px] font-bold">
                  {/* Sticky Metric Label Column */}
                  <th className="py-3 px-4 sticky left-0 bg-slate-50 z-20 min-w-[140px] sm:min-w-[180px] border-r border-slate-200 shadow-xs">
                    Evaluation Metric
                  </th>
                  <th className="py-3 px-4 min-w-[220px]">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                      <span>{collegeA.shortName}</span>
                    </div>
                  </th>
                  <th className="py-3 px-4 min-w-[220px]">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-900"></span>
                      <span>{collegeB.shortName}</span>
                    </div>
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {/* ROW 1: NIRF RANKING */}
                <tr className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900 sticky left-0 bg-white z-10 border-r border-slate-200">
                    NIRF Ranking
                  </td>

                  {/* Col A */}
                  <td
                    className={`py-3.5 px-4 transition-colors ${
                      evaluations.nirf === "A"
                        ? "bg-emerald-50/70 border-l-2 border-emerald-500"
                        : "bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm text-slate-900">
                        Rank #{collegeA.nirfRank}
                      </span>
                      {evaluations.nirf === "A" && (
                        <span className="bg-emerald-600 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded shadow-xs">
                          Better
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400">Score: {collegeA.nirfScore} / 100</span>
                  </td>

                  {/* Col B */}
                  <td
                    className={`py-3.5 px-4 transition-colors ${
                      evaluations.nirf === "B"
                        ? "bg-emerald-50/70 border-l-2 border-emerald-500"
                        : "bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm text-slate-900">
                        Rank #{collegeB.nirfRank}
                      </span>
                      {evaluations.nirf === "B" && (
                        <span className="bg-emerald-600 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded shadow-xs">
                          Better
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400">Score: {collegeB.nirfScore} / 100</span>
                  </td>
                </tr>

                {/* ROW 2: TOTAL FEES */}
                <tr className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900 sticky left-0 bg-white z-10 border-r border-slate-200">
                    Total Degree Fees
                  </td>

                  {/* Col A */}
                  <td
                    className={`py-3.5 px-4 transition-colors ${
                      evaluations.fees === "A"
                        ? "bg-emerald-50/70 border-l-2 border-emerald-500"
                        : "bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm text-slate-900">
                        {collegeA.stats.totalDegreeFee}
                      </span>
                      {evaluations.fees === "A" && (
                        <span className="bg-emerald-600 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded shadow-xs">
                          Better
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400">~{collegeA.stats.btechFeesPerYear} / yr</span>
                  </td>

                  {/* Col B */}
                  <td
                    className={`py-3.5 px-4 transition-colors ${
                      evaluations.fees === "B"
                        ? "bg-emerald-50/70 border-l-2 border-emerald-500"
                        : "bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm text-slate-900">
                        {collegeB.stats.totalDegreeFee}
                      </span>
                      {evaluations.fees === "B" && (
                        <span className="bg-emerald-600 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded shadow-xs">
                          Better
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400">~{collegeB.stats.btechFeesPerYear} / yr</span>
                  </td>
                </tr>

                {/* ROW 3: DURATION */}
                <tr className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900 sticky left-0 bg-white z-10 border-r border-slate-200">
                    Program Duration
                  </td>

                  <td className="py-3.5 px-4 bg-white">
                    <span className="font-bold text-slate-800">{programA.duration}</span>
                    <span className="text-[10px] text-slate-400 block">{programA.degree}</span>
                  </td>

                  <td className="py-3.5 px-4 bg-white">
                    <span className="font-bold text-slate-800">{programB.duration}</span>
                    <span className="text-[10px] text-slate-400 block">{programB.degree}</span>
                  </td>
                </tr>

                {/* ROW 4: SEAT INTAKE */}
                <tr className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900 sticky left-0 bg-white z-10 border-r border-slate-200">
                    Seat Intake
                  </td>

                  <td
                    className={`py-3.5 px-4 transition-colors ${
                      evaluations.seats === "A"
                        ? "bg-emerald-50/70 border-l-2 border-emerald-500"
                        : "bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-900">{programA.seats} Seats</span>
                      {evaluations.seats === "A" && (
                        <span className="bg-emerald-600 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded shadow-xs">
                          Higher
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400">Closing Rank: {programA.closingRank2024}</span>
                  </td>

                  <td
                    className={`py-3.5 px-4 transition-colors ${
                      evaluations.seats === "B"
                        ? "bg-emerald-50/70 border-l-2 border-emerald-500"
                        : "bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-900">{programB.seats} Seats</span>
                      {evaluations.seats === "B" && (
                        <span className="bg-emerald-600 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded shadow-xs">
                          Higher
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400">Closing Rank: {programB.closingRank2024}</span>
                  </td>
                </tr>

                {/* ROW 5: AVERAGE CTC */}
                <tr className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900 sticky left-0 bg-white z-10 border-r border-slate-200">
                    Average CTC (Branch)
                  </td>

                  <td
                    className={`py-3.5 px-4 transition-colors ${
                      evaluations.avgCTC === "A"
                        ? "bg-emerald-50/70 border-l-2 border-emerald-500"
                        : "bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm text-indigo-700">
                        {programA.avgCTC}
                      </span>
                      {evaluations.avgCTC === "A" && (
                        <span className="bg-emerald-600 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded shadow-xs">
                          Better
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400">Median: {programA.medianCTC}</span>
                  </td>

                  <td
                    className={`py-3.5 px-4 transition-colors ${
                      evaluations.avgCTC === "B"
                        ? "bg-emerald-50/70 border-l-2 border-emerald-500"
                        : "bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm text-indigo-700">
                        {programB.avgCTC}
                      </span>
                      {evaluations.avgCTC === "B" && (
                        <span className="bg-emerald-600 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded shadow-xs">
                          Better
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400">Median: {programB.medianCTC}</span>
                  </td>
                </tr>

                {/* ROW 6: HIGHEST CTC */}
                <tr className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900 sticky left-0 bg-white z-10 border-r border-slate-200">
                    Highest Domestic CTC
                  </td>

                  <td
                    className={`py-3.5 px-4 transition-colors ${
                      evaluations.highestCTC === "A"
                        ? "bg-emerald-50/70 border-l-2 border-emerald-500"
                        : "bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm text-emerald-700">
                        {collegeA.stats.highestDomestic}
                      </span>
                      {evaluations.highestCTC === "A" && (
                        <span className="bg-emerald-600 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded shadow-xs">
                          Better
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400">Intl: {collegeA.stats.highestInternational}</span>
                  </td>

                  <td
                    className={`py-3.5 px-4 transition-colors ${
                      evaluations.highestCTC === "B"
                        ? "bg-emerald-50/70 border-l-2 border-emerald-500"
                        : "bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm text-emerald-700">
                        {collegeB.stats.highestDomestic}
                      </span>
                      {evaluations.highestCTC === "B" && (
                        <span className="bg-emerald-600 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded shadow-xs">
                          Better
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400">Intl: {collegeB.stats.highestInternational}</span>
                  </td>
                </tr>

                {/* ROW 7: INFRASTRUCTURE */}
                <tr className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900 sticky left-0 bg-white z-10 border-r border-slate-200">
                    Infrastructure & Campus
                  </td>

                  <td
                    className={`py-3.5 px-4 transition-colors ${
                      evaluations.infrastructure === "A"
                        ? "bg-emerald-50/70 border-l-2 border-emerald-500"
                        : "bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-900">
                        {collegeA.campusSize} Campus
                      </span>
                      {evaluations.infrastructure === "A" && (
                        <span className="bg-emerald-600 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded shadow-xs">
                          Larger
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                      {collegeA.campusHighlights[0]}
                    </p>
                  </td>

                  <td
                    className={`py-3.5 px-4 transition-colors ${
                      evaluations.infrastructure === "B"
                        ? "bg-emerald-50/70 border-l-2 border-emerald-500"
                        : "bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-900">
                        {collegeB.campusSize} Campus
                      </span>
                      {evaluations.infrastructure === "B" && (
                        <span className="bg-emerald-600 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded shadow-xs">
                          Larger
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                      {collegeB.campusHighlights[0]}
                    </p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 4. RECHARTS-STYLE GROUPED BAR CHART: PLACEMENT PACKAGES */}
        <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-indigo-600" />
                <span>Placement Package Distribution (LPA Comparison)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Side-by-side grouped package metrics between {collegeA.shortName} and {collegeB.shortName}.
              </p>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-5 text-xs font-bold">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-indigo-600"></span>
                <span>{collegeA.shortName}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-slate-900"></span>
                <span>{collegeB.shortName}</span>
              </span>
            </div>
          </div>

          {/* Grouped Bar Chart Area */}
          <div className="pt-2">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {chartMetrics.map((metric, idx) => {
                const percentA = Math.round((metric.valA / maxSalaryScale) * 100);
                const percentB = Math.round((metric.valB / maxSalaryScale) * 100);
                const winner = metric.valA > metric.valB ? "A" : metric.valB > metric.valA ? "B" : "TIE";

                return (
                  <div
                    key={idx}
                    onMouseEnter={() => setActiveChartMetric(metric.label)}
                    onMouseLeave={() => setActiveChartMetric(null)}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-indigo-200 transition-all flex flex-col justify-between space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
                        {metric.label}
                      </span>
                      {winner !== "TIE" && (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                          {winner === "A" ? collegeA.code : collegeB.code} +
                        </span>
                      )}
                    </div>

                    {/* Side-by-side vertical bar pair */}
                    <div className="h-36 flex items-end justify-center gap-3 pt-2 pb-1 border-b border-slate-200">
                      {/* Bar A */}
                      <div className="flex flex-col items-center gap-1 w-8">
                        <span className="text-[10px] font-extrabold text-indigo-700">
                          ₹{metric.valA}L
                        </span>
                        <div
                          className="w-full bg-indigo-600 rounded-t-lg transition-all duration-500 hover:brightness-110"
                          style={{ height: `${percentA}%` }}
                        ></div>
                      </div>

                      {/* Bar B */}
                      <div className="flex flex-col items-center gap-1 w-8">
                        <span className="text-[10px] font-extrabold text-slate-800">
                          ₹{metric.valB}L
                        </span>
                        <div
                          className="w-full bg-slate-900 rounded-t-lg transition-all duration-500 hover:brightness-110"
                          style={{ height: `${percentB}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                      <span>{collegeA.code || "Col A"}</span>
                      <span>{collegeB.code || "Col B"}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      {/* 5. FLOATING BOTTOM CTA: "Book Free Counselling for These Colleges" + "Save Comparison" */}
      <aside
        aria-label="Comparison Actions"
        className="fixed bottom-4 inset-x-4 max-w-4xl mx-auto z-40 animate-slide-up"
      >
        <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700 text-white p-3.5 sm:p-4 rounded-2xl shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Comparison summary */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400 font-bold shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-extrabold text-white">
                {collegeA.shortName} vs {collegeB.shortName}
              </p>
              <p className="text-[11px] text-slate-400">
                NIRF #{collegeA.nirfRank} vs #{collegeB.nirfRank} • Comparing {programA.name}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
            {/* Save Comparison Button */}
            <button
              type="button"
              onClick={handleSaveComparison}
              className={`px-3.5 py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                isSaved
                  ? "bg-emerald-950/80 border-emerald-500 text-emerald-300"
                  : "border-slate-700 hover:border-slate-500 bg-slate-800 text-slate-300 hover:text-white"
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isSaved ? "fill-emerald-400 text-emerald-400" : ""}`} />
              <span>{isSaved ? "Saved" : "Save Comparison"}</span>
            </button>

            {/* Share Link */}
            <button
              type="button"
              onClick={handleShare}
              className="p-2.5 rounded-xl border border-slate-700 hover:border-slate-500 bg-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer"
              title="Copy share link"
            >
              <Share2 className="w-4 h-4" />
            </button>

            {/* Primary Counselling Button */}
            <button
              type="button"
              onClick={() =>
                openCounsellingModal({
                  shortName: `${collegeA.shortName} vs ${collegeB.shortName}`,
                })
              }
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs sm:text-sm shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              <span>Book Free Counselling for These Colleges</span>
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}

export default function CompareArenaPage() {
  return (
    <Suspense
      fallback={
        <div className="p-16 text-center text-slate-400 space-y-3">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-bold text-slate-600">Loading Comparison Arena...</p>
        </div>
      }
    >
      <CompareArenaContent />
    </Suspense>
  );
}

