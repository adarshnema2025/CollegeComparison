"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { COLLEGES, POPULAR_COMPARISONS } from "@/data/colleges";
import { useApp } from "@/context/AppContext";
import {
  Scale,
  Search,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Trophy,
  IndianRupee,
  GraduationCap,
  CheckCircle2,
  MapPin,
  Calendar,
  Building2,
  TrendingUp,
  ShieldCheck,
  Plus,
  Check,
  ArrowLeftRight,
  Compass,
  FileCheck,
  Users,
} from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const { addToCompare, isInCompare, openCounsellingModal, setCompareList, triggerCompare } = useApp();

  // Search state
  const [searchQuery, setSearchQuery] = useState("");

  // Quick Comparison Widget state
  const [programA, setProgramA] = useState("iit-bombay");
  const [programB, setProgramB] = useState("iit-delhi");

  // Carousel scroll ref
  const carouselRef = useRef(null);
  const [carouselCanScrollLeft, setCarouselCanScrollLeft] = useState(false);
  const [carouselCanScrollRight, setCarouselCanScrollRight] = useState(true);

  // Search form submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/colleges?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/colleges");
    }
  };

  // Quick filter chips click handler
  const handleChipClick = (query) => {
    router.push(`/colleges?q=${encodeURIComponent(query)}`);
  };

  // Quick Comparison swap
  const handleSwapComparison = () => {
    const temp = programA;
    setProgramA(programB);
    setProgramB(temp);
  };

  // Quick comparison submit
  const handleCompareSubmit = (e) => {
    e.preventDefault();
    const colObjA = COLLEGES.find((c) => c.id === programA || c.slug === programA);
    const colObjB = COLLEGES.find((c) => c.id === programB || c.slug === programB);
    if (colObjA && colObjB && setCompareList) {
      setCompareList([colObjA, colObjB]);
    }
    const targetUrl = `/compare?c1=${encodeURIComponent(programA)}&c2=${encodeURIComponent(programB)}`;
    triggerCompare(targetUrl);
  };

  // Carousel scroll handler
  const scrollCarousel = (direction) => {
    if (carouselRef.current) {
      const scrollAmount = 360;
      carouselRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
      setTimeout(updateCarouselScrollState, 300);
    }
  };

  const updateCarouselScrollState = () => {
    if (carouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
      setCarouselCanScrollLeft(scrollLeft > 10);
      setCarouselCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
    }
  };

  const colA = COLLEGES.find((c) => c.id === programA);
  const colB = COLLEGES.find((c) => c.id === programB);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* 1. DARK NAVY HERO SECTION */}
      <section className="relative bg-gradient-to-b from-[#0B1120] via-[#0F172A] to-[#0B1120] text-white pt-16 pb-28 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Subtle Ambient Radial Lighting */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[720px] h-[340px] bg-indigo-600/15 blur-[130px] rounded-full pointer-events-none"></div>

        <div className="relative max-w-5xl mx-auto text-center space-y-6">
          {/* Top Pill Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/80 text-xs font-semibold text-indigo-300 backdrop-blur-md shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>2024-2025 Admissions • Verified JoSAA, JAC Delhi & BITSAT Data</span>
          </div>

          {/* Large Hero Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.15]">
            Discover, Compare & Choose the{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-indigo-200 to-emerald-400">
              Right College
            </span>{" "}
            in India.
          </h1>

          {/* Subheading */}
          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-300 font-normal leading-relaxed">
            Real median placement packages, verified 2024 NIRF ranks, and authentic 4-year degree costs.
            No sponsored rankings, no deceptive brochures.
          </p>

          {/* Prominent Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="max-w-2xl mx-auto mt-6 bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/20 shadow-2xl flex flex-col sm:flex-row items-center gap-2"
          >
            <div className="relative flex-1 w-full flex items-center">
              <Search className="w-5 h-5 text-slate-400 absolute left-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search colleges, courses, cities..."
                className="w-full pl-12 pr-4 py-3.5 bg-white text-slate-900 placeholder:text-slate-500 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
              />
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm tracking-tight flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all shrink-0 cursor-pointer"
            >
              <span>Explore</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Filter Chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-3 text-xs">
            <span className="text-slate-400 font-semibold mr-1">Quick Filters:</span>
            {[
              { label: "Top B.Tech in Pune", query: "Pune" },
              { label: "Online MBA under ₹2 Lakhs", query: "Online MBA" },
              { label: "Best Colleges in Delhi", query: "Delhi" },
              { label: "Top IITs & NITs", query: "IIT" },
              { label: "Autonomous Institutes", query: "Autonomous" },
            ].map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={() => handleChipClick(chip.query)}
                className="px-3.5 py-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700/90 text-slate-200 hover:text-white border border-slate-700 hover:border-indigo-400 transition-all font-medium flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <span>{chip.label}</span>
                <ArrowRight className="w-3 h-3 text-slate-400" />
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 2. START A QUICK COMPARISON WIDGET (Overlapping Hero with crisp card style) */}
      <section className="relative px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full -mt-14 z-20">
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xl p-5 sm:p-7">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-100 gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/10 flex items-center justify-center text-indigo-600 font-bold">
                <Scale className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight leading-tight">
                  Start a Quick Comparison
                </h2>
                <p className="text-xs text-slate-500">
                  Select two programs to compare cutoffs, median packages & degree fees side-by-side.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>100% Unbiased NIRF Audit</span>
            </div>
          </div>

          {/* Form with Two Side-by-Side Dropdowns & Compare CTA */}
          <form onSubmit={handleCompareSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-9 gap-3 items-center">
              {/* Dropdown A (4 cols) */}
              <div className="md:col-span-4 space-y-1">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  Program / College A
                </label>
                <div className="relative">
                  <select
                    value={programA}
                    onChange={(e) => setProgramA(e.target.value)}
                    className="w-full px-3.5 py-3 rounded-xl border border-slate-300 bg-slate-50/70 hover:bg-white text-xs sm:text-sm font-bold text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none transition-all cursor-pointer truncate"
                  >
                    {COLLEGES.map((c) => (
                      <option key={`a-${c.id}`} value={c.id}>
                        {c.shortName} (NIRF #{c.nirfRank} • {c.stats.medianSalary})
                      </option>
                    ))}
                  </select>
                </div>
                {colA && (
                  <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500">
                    <span className="font-semibold text-slate-700">{colA.city}</span>
                    <span>•</span>
                    <span className="text-emerald-600 font-bold">{colA.stats.medianSalary} Median</span>
                    <span>•</span>
                    <span>{colA.stats.totalDegreeFee} Total</span>
                  </div>
                )}
              </div>

              {/* Swap Button (1 col) */}
              <div className="md:col-span-1 flex justify-center">
                <button
                  type="button"
                  onClick={handleSwapComparison}
                  title="Swap colleges"
                  className="w-10 h-10 rounded-full border border-slate-200 hover:border-indigo-500 bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 flex items-center justify-center transition-all shadow-xs cursor-pointer group"
                >
                  <ArrowLeftRight className="w-4 h-4 group-hover:scale-110 transition-transform" />
                </button>
              </div>

              {/* Dropdown B (4 cols) */}
              <div className="md:col-span-4 space-y-1">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  Program / College B
                </label>
                <div className="relative">
                  <select
                    value={programB}
                    onChange={(e) => setProgramB(e.target.value)}
                    className="w-full px-3.5 py-3 rounded-xl border border-slate-300 bg-slate-50/70 hover:bg-white text-xs sm:text-sm font-bold text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none transition-all cursor-pointer truncate"
                  >
                    {COLLEGES.map((c) => (
                      <option key={`b-${c.id}`} value={c.id}>
                        {c.shortName} (NIRF #{c.nirfRank} • {c.stats.medianSalary})
                      </option>
                    ))}
                  </select>
                </div>
                {colB && (
                  <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500">
                    <span className="font-semibold text-slate-700">{colB.city}</span>
                    <span>•</span>
                    <span className="text-emerald-600 font-bold">{colB.stats.medianSalary} Median</span>
                    <span>•</span>
                    <span>{colB.stats.totalDegreeFee} Total</span>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Action Row: Compare CTA + Quick pairs */}
            <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-slate-400 font-semibold">Popular Face-offs:</span>
                {[
                  { a: "iit-bombay", b: "iit-delhi", label: "IITB vs IITD" },
                  { a: "bits-pilani", b: "iiit-hyderabad", label: "BITS vs IIITH" },
                  { a: "dtu-delhi", b: "coep-pune", label: "DTU vs COEP" },
                ].map((pair) => (
                  <button
                    key={pair.label}
                    type="button"
                    onClick={() => {
                      setProgramA(pair.a);
                      setProgramB(pair.b);
                    }}
                    className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 text-[11px] font-bold transition-colors cursor-pointer"
                  >
                    {pair.label}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                <span>Compare Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* 3. CAROUSEL OF FEATURED TOP-RANKED COLLEGES */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Carousel Header with Navigation Controls */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
              <Trophy className="w-4 h-4" />
              <span>Certified Top Institutes</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Featured Top-Ranked Colleges
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Scroll through India&apos;s leading engineering & management institutions with verified metrics.
            </p>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => scrollCarousel("left")}
              disabled={!carouselCanScrollLeft}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                carouselCanScrollLeft
                  ? "border-slate-300 hover:border-slate-400 bg-white text-slate-700 shadow-xs"
                  : "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed opacity-60"
              }`}
              title="Previous colleges"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scrollCarousel("right")}
              disabled={!carouselCanScrollRight}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                carouselCanScrollRight
                  ? "border-slate-300 hover:border-slate-400 bg-white text-slate-700 shadow-xs"
                  : "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed opacity-60"
              }`}
              title="Next colleges"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
            <Link
              href="/colleges"
              className="ml-2 text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 px-3 py-2 rounded-xl border border-indigo-200 hover:bg-indigo-50 transition-colors"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Horizontal Carousel Track */}
        <div
          ref={carouselRef}
          onScroll={updateCarouselScrollState}
          className="flex gap-5 overflow-x-auto pb-4 scroll-smooth snap-x snap-mandatory scrollbar-none"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {COLLEGES.map((college) => {
            const inTray = isInCompare(college.id);
            return (
              <div
                key={college.id}
                className="w-[290px] sm:w-[320px] shrink-0 snap-start bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all flex flex-col justify-between overflow-hidden"
              >
                <div className="p-5 space-y-3">
                  {/* Top Row: NIRF Badge & Location */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-slate-900 text-white shadow-xs">
                      NIRF #{college.nirfRank}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1 truncate max-w-[170px]">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{college.city}</span>
                    </span>
                  </div>

                  {/* College Identity & Logo Badge */}
                  <div className="flex items-start gap-3 pt-1">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center font-extrabold text-xs shrink-0 shadow-xs ${college.avatarBg}`}
                    >
                      {college.code || college.logoText}
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/colleges/${college.slug}`}
                        className="text-base font-extrabold text-slate-900 hover:text-indigo-600 transition-colors leading-snug line-clamp-1"
                      >
                        {college.shortName}
                      </Link>
                      <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                        {college.ownership}
                      </p>
                    </div>
                  </div>

                  {/* Metrics Grid: Fee & Median CTC */}
                  <div className="grid grid-cols-2 gap-2 my-3 p-3 bg-slate-50 rounded-xl text-xs">
                    <div>
                      <span className="text-[10px] text-slate-600 uppercase font-bold tracking-wider">
                        Starting Fee
                      </span>
                      <p className="text-sm font-extrabold text-slate-900 mt-0.5">
                        {college.stats.btechFeesPerYear || college.stats.totalDegreeFee}
                      </p>
                      <span className="text-[10px] text-slate-600">per annum approx</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-600 uppercase font-bold tracking-wider">
                        Median CTC
                      </span>
                      <p className="text-sm font-extrabold text-emerald-600 mt-0.5">
                        {college.stats.medianSalary}
                      </p>
                      <span className="text-[10px] text-emerald-700 font-semibold">
                        {college.stats.placementPercent}% placed
                      </span>
                    </div>
                  </div>

                  {/* Entrance Exam Chip */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span>Exam:</span>
                    <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md truncate max-w-[180px]">
                      {college.entranceExams.join(", ")}
                    </span>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="p-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => addToCompare(college)}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      inTray
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-300"
                        : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 shadow-xs"
                    }`}
                  >
                    {inTray ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>In Compare</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add to Compare</span>
                      </>
                    )}
                  </button>

                  <Link
                    href={`/colleges/${college.slug}`}
                    className="py-2 px-3 rounded-xl text-xs font-bold text-indigo-600 hover:text-white hover:bg-indigo-600 border border-indigo-200 transition-colors text-center shrink-0"
                  >
                    Details
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. "HOW IT WORKS" 3-STEP STRIP (Minimalist, Versus & Apple style) */}
      <section className="py-16 bg-white border-y border-slate-200/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs uppercase font-extrabold text-indigo-600 tracking-wider">
              Decision Workflow
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 tracking-tight">
              How CollegeComparison Works
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2">
              Three transparent steps to cut through advertising noise and lock your best-fit seat.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* Step 1 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-xs space-y-3 relative group hover:border-indigo-300 transition-all">
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-xl bg-indigo-600/10 text-indigo-600 flex items-center justify-center font-extrabold text-sm">
                  <Compass className="w-5 h-5" />
                </div>
                <span className="text-2xl font-black text-slate-300 group-hover:text-indigo-400 transition-colors">
                  01
                </span>
              </div>
              <h3 className="text-base font-extrabold text-slate-900">
                1. Discover by True Metrics
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Filter 1,200+ certified colleges by NIRF rank, audited median packages (not single 1-crore outlier claims), and actual 4-year degree expenses.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-xs space-y-3 relative group hover:border-indigo-300 transition-all">
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-xl bg-emerald-600/10 text-emerald-600 flex items-center justify-center font-extrabold text-sm">
                  <Scale className="w-5 h-5" />
                </div>
                <span className="text-2xl font-black text-slate-300 group-hover:text-emerald-400 transition-colors">
                  02
                </span>
              </div>
              <h3 className="text-base font-extrabold text-slate-900">
                2. Head-to-Head Compare
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Place two to four programs side-by-side in our Arena. Compare Round-6 closing ranks, syllabus focus, hostel costs, and real alumni outcomes.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-xs space-y-3 relative group hover:border-indigo-300 transition-all">
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-xl bg-amber-600/10 text-amber-600 flex items-center justify-center font-extrabold text-sm">
                  <Users className="w-5 h-5" />
                </div>
                <span className="text-2xl font-black text-slate-300 group-hover:text-amber-400 transition-colors">
                  03
                </span>
              </div>
              <h3 className="text-base font-extrabold text-slate-900">
                3. Book 1-on-1 Mentorship
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Resolve choice-filling dilemmas (e.g. DTU CSE vs IIT Kharagpur Civil) with verified ex-IITian mentors who take zero college referral commissions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. COUNSELLING CTA BANNER */}
      <section className="py-16 bg-gradient-to-r from-[#0F172A] via-[#1E1B4B] to-[#0F172A] text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Zero-Commission Admission Strategy</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight max-w-3xl mx-auto leading-tight">
            Stuck with JoSAA / JAC Choice Filling or the Branch vs College Dilemma?
          </h2>

          <p className="max-w-2xl mx-auto text-slate-300 text-sm sm:text-base leading-relaxed">
            Talk 1-on-1 with independent senior mentors from IIT Madras, BITS Pilani, and IIM Calcutta.
            Get personalized priority order review based purely on your rank and ROI.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => openCounsellingModal()}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              <span>Book Free 1-on-1 Counselling</span>
            </button>
            <Link
              href="/colleges"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/20 transition-all text-center"
            >
              Browse Verified Colleges First
            </Link>
          </div>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Free 30-Minute Google Meet</span>
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>100% Unbiased & Private</span>
            </span>
            <span className="flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-amber-400" />
              <span>Ex-IIT/IIM Admissions Panel</span>
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
