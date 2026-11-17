"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { COLLEGES } from "@/data/colleges";
import { collegesApi } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import {
  Scale,
  MapPin,
  Trophy,
  IndianRupee,
  GraduationCap,
  Calendar,
  Sparkles,
  Building2,
  CheckCircle2,
  XCircle,
  Plus,
  Check,
  ArrowRight,
  ShieldCheck,
  Layers,
  Award,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Users,
  Clock,
  BookOpen,
  DollarSign,
  Briefcase,
  Share2,
} from "lucide-react";

export default function CollegeDetailClient({ college: initialCollege }) {
  const router = useRouter();
  const { addToCompare, removeFromCompare, isInCompare, openCounsellingModal, isWishlisted, toggleWishlist, triggerCompare, setCompareList } = useApp();

  const [liveData, setLiveData] = useState(null);
  const [isLiveConnected, setIsLiveConnected] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadLiveData() {
      try {
        const data = await collegesApi.getBySlug(initialCollege.slug || initialCollege.id);
        if (isMounted && data && (data.name || data.slug)) {
          setLiveData(data);
          setIsLiveConnected(true);
        }
      } catch (err) {
        // Keep initial college data
      }
    }
    loadLiveData();
    return () => {
      isMounted = false;
    };
  }, [initialCollege.slug, initialCollege.id]);

  const college = liveData
    ? {
        ...initialCollege,
        ...liveData,
        stats: { ...initialCollege.stats, ...liveData.stats },
        programs:
          liveData.programs && liveData.programs.length > 0
            ? liveData.programs
            : initialCollege.programs,
      }
    : initialCollege;

  // Active tab state: "overview" | "programs" | "placements" | "fees"
  const [activeTab, setActiveTab] = useState("overview");

  // Accordion state for programs: which program index is expanded
  const [expandedProgramIndex, setExpandedProgramIndex] = useState(0);

  const isAddedToCompare = isInCompare(college.id);
  const wishlisted = isWishlisted(college.id);

  // Fallback official website
  const collegeWebsite =
    college.website ||
    `https://${college.code ? college.code.toLowerCase() : "college"}.ac.in`;

  // Rival colleges for quick head-to-head comparison
  const rivals = COLLEGES.filter((c) => c.id !== college.id).slice(0, 3);

  // Extract numerical values for bar chart
  const parseLPA = (str) => {
    if (!str) return 0;
    const match = str.match(/[\d.]+/);
    return match ? parseFloat(match[0]) : 0;
  };

  const chartPrograms = college.programs.map((prog, index) => {
    const avgVal = parseLPA(prog.avgCTC);
    // Highest CTC for branch or fallback to college highest domestic
    const highestVal =
      index === 0
        ? parseLPA(college.stats.highestDomestic)
        : Math.round(avgVal * 1.5 * 10) / 10;
    return {
      name: prog.name,
      shortName:
        prog.name.length > 18 ? prog.name.split(" ")[0] + " " + (prog.name.split(" ")[1] || "") : prog.name,
      avgVal,
      highestVal,
    };
  });

  const maxChartValue = Math.max(
    ...chartPrograms.map((p) => Math.max(p.avgVal, p.highestVal)),
    50
  );

  const handleCompareThisProgram = (program) => {
    addToCompare(college);
    triggerCompare(`/compare?c1=${encodeURIComponent(college.id)}`);
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-32">
      {/* 1. COVER HEADER WITH BACKGROUND PHOTO OVERLAY */}
      <div className="relative bg-[#0B1120] text-white pt-10 pb-16 overflow-hidden border-b border-slate-800">
        {/* Ambient background photo banner with dark navy overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-15 filter blur-xs"
          style={{ backgroundImage: `url(${college.heroImage})` }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B1120] via-[#0B1120]/90 to-transparent"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb row */}
          <div className="flex items-center justify-between text-xs text-slate-400 mb-6">
            <div className="flex items-center gap-2">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <span>/</span>
              <Link href="/colleges" className="hover:text-white transition-colors">Colleges</Link>
              <span>/</span>
              <span className="text-indigo-400 font-semibold">{college.shortName}</span>
            </div>

            <button
              onClick={() => toggleWishlist(college.id)}
              className="text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>{wishlisted ? "★ Saved to Shortlist" : "☆ Save to Shortlist"}</span>
            </button>
          </div>

          {/* Main Cover Header Info */}
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            {/* College Logo / Code Emblem */}
            <div
              className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center font-black text-2xl sm:text-3xl shadow-2xl border border-white/20 shrink-0 ${college.avatarBg}`}
            >
              {college.code || college.logoText}
            </div>

            {/* Title, Badges & Metadata */}
            <div className="flex-1 space-y-3">
              {/* Badges Ribbon */}
              <div className="flex flex-wrap items-center gap-2">
                {/* NIRF Ranking Badge */}
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-white font-extrabold text-xs border border-slate-700 shadow-sm">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  <span>NIRF Rank #{college.nirfRank}</span>
                </span>

                {/* Verified Badge */}
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-400/30">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Verified Institute</span>
                </span>

                {isLiveConnected && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 font-bold text-xs border border-indigo-400/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
                    <span>Live Backend Sync</span>
                  </span>
                )}

                {/* Established Year */}
                <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 font-medium text-xs border border-slate-700">
                  Estd {college.establishedYear}
                </span>

                {/* Accreditation */}
                <span className="px-3 py-1 rounded-full bg-slate-800 text-indigo-300 font-medium text-xs border border-slate-700">
                  NAAC {college.naacGrade}
                </span>
              </div>

              {/* Full College Name */}
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
                {college.name}
              </h1>

              {/* Tagline */}
              <p className="text-slate-300 text-xs sm:text-sm max-w-3xl leading-relaxed">
                {college.tagline}
              </p>

              {/* Location & Official Website Link */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-1">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-indigo-400" />
                  <span>{college.location}</span>
                </span>

                <span className="text-slate-600">•</span>

                {/* Official Website Link */}
                <a
                  href={collegeWebsite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-indigo-300 hover:text-white font-semibold underline underline-offset-4 transition-colors"
                >
                  <span>Official Website ({college.code || college.shortName})</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. STICKY TAB NAVIGATION (Overview, Programs, Placements, Fees) */}
      <nav aria-label="College profile sections" className="sticky top-16 z-30 bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex overflow-x-auto gap-8 scrollbar-none">
          {[
            { id: "overview", label: "Overview", icon: Building2 },
            { id: "programs", label: "Programs & Specializations", icon: BookOpen },
            { id: "placements", label: "Placements & Salaries", icon: BarChart3 },
            { id: "fees", label: "Fees & Waivers", icon: DollarSign },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 text-xs sm:text-sm font-extrabold whitespace-nowrap transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-slate-500 hover:text-slate-900"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-indigo-600" : "text-slate-400"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* 3. MAIN CONTENT AREA & RIGHT SIDEBAR */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* LEFT 2 COLUMNS: TAB CONTENTS */}
          <div className="lg:col-span-2 space-y-6">
            {/* TAB 1: OVERVIEW */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* Key Metrics Quick Ribbon */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                      NIRF Ranking
                    </span>
                    <p className="text-xl font-extrabold text-slate-900 mt-0.5">
                      Rank #{college.nirfRank}
                    </p>
                    <span className="text-[11px] text-slate-400">{college.nirfCategory}</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                      Audited Median CTC
                    </span>
                    <p className="text-xl font-extrabold text-emerald-600 mt-0.5">
                      {college.stats.medianSalary}
                    </p>
                    <span className="text-[11px] text-emerald-700 font-semibold">{college.stats.placementPercent}% Placed</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                      Total 4-Yr Degree
                    </span>
                    <p className="text-xl font-extrabold text-slate-900 mt-0.5">
                      {college.stats.totalDegreeFee}
                    </p>
                    <span className="text-[11px] text-slate-400">~{college.stats.btechFeesPerYear}/yr</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                      ROI Rating
                    </span>
                    <p className="text-xl font-extrabold text-amber-500 mt-0.5">
                      {college.stats.roiRating}
                    </p>
                    <span className="text-[11px] text-slate-400">Value for Capital</span>
                  </div>
                </div>

                {/* Counsellor Admission Verdict */}
                <div className="p-6 rounded-2xl bg-indigo-50/80 border border-indigo-200 shadow-xs space-y-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-xs font-extrabold text-indigo-900 uppercase tracking-wider">
                      Counsellor Verdict & Strategic Summary
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                    {college.counsellorNotes}
                  </p>
                </div>

                {/* Pros & Cons Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Pros */}
                  <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                    <div className="flex items-center gap-2 text-emerald-700 font-extrabold text-xs uppercase tracking-wider">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Key Advantages</span>
                    </div>
                    <ul className="space-y-2">
                      {college.pros.map((pro, idx) => (
                        <li key={idx} className="text-xs text-slate-700 flex items-start gap-2">
                          <span className="text-emerald-500 font-bold">•</span>
                          <span>{pro}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Cons */}
                  <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                    <div className="flex items-center gap-2 text-amber-700 font-extrabold text-xs uppercase tracking-wider">
                      <XCircle className="w-4 h-4 text-amber-600" />
                      <span>Realistic Trade-Offs</span>
                    </div>
                    <ul className="space-y-2">
                      {college.cons.map((con, idx) => (
                        <li key={idx} className="text-xs text-slate-700 flex items-start gap-2">
                          <span className="text-amber-500 font-bold">•</span>
                          <span>{con}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Campus & Research Highlights */}
                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
                  <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                    Campus Infrastructure & Facilities
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {college.campusHighlights.map((hl, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 flex items-start gap-2.5 font-medium"
                      >
                        <Building2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                        <span>{hl}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: PROGRAMS (ACCORDION WITH "COMPARE THIS PROGRAM" BUTTON) */}
            {activeTab === "programs" && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">
                      Academic Programs & Branch Matrix ({college.programs.length} Available)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Expand any program row to review seat intake, closing cutoffs & package distributions.
                    </p>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Exam: {college.entranceExams.join(", ")}
                  </span>
                </div>

                {/* ACCORDION ROWS */}
                <div className="space-y-3">
                  {college.programs.map((program, idx) => {
                    const isExpanded = expandedProgramIndex === idx;
                    const programFee = college.stats.totalDegreeFee;
                    const highestPackage =
                      idx === 0
                        ? college.stats.highestDomestic
                        : `₹${(parseLPA(program.avgCTC) * 1.5).toFixed(1)} LPA`;

                    return (
                      <div
                        key={idx}
                        className={`rounded-2xl border transition-all overflow-hidden ${
                          isExpanded
                            ? "border-indigo-300 bg-white shadow-md ring-1 ring-indigo-200"
                            : "border-slate-200 bg-white hover:border-slate-300 shadow-xs"
                        }`}
                      >
                        {/* Accordion Header Row */}
                        <div
                          onClick={() => setExpandedProgramIndex(isExpanded ? -1 : idx)}
                          className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer"
                        >
                          {/* Program Identity */}
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-extrabold">
                                {program.degree}
                              </span>
                              <span className="text-xs text-slate-400 font-medium">
                                {program.duration}
                              </span>
                            </div>
                            <h4 className="text-sm sm:text-base font-extrabold text-slate-900 truncate">
                              {program.name}
                            </h4>
                          </div>

                          {/* Quick Stats: Fees, Intake, Avg vs Highest */}
                          <div className="flex flex-wrap items-center gap-4 text-xs">
                            <div className="text-left sm:text-right">
                              <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                                Total Fees
                              </span>
                              <span className="font-extrabold text-slate-800">{programFee}</span>
                            </div>

                            <div className="text-left sm:text-right">
                              <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                                Seat Intake
                              </span>
                              <span className="font-extrabold text-slate-800">{program.seats} Seats</span>
                            </div>

                            <div className="text-left sm:text-right">
                              <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                                Avg vs Highest
                              </span>
                              <span className="font-bold text-slate-900">
                                <span className="text-indigo-600">{program.avgCTC}</span>{" "}
                                <span className="text-slate-400 font-normal">/</span>{" "}
                                <span className="text-emerald-600 font-extrabold">{highestPackage}</span>
                              </span>
                            </div>

                            {/* Chevron Toggle */}
                            <div className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
                              {isExpanded ? (
                                <ChevronUp className="w-5 h-5 text-indigo-600" />
                              ) : (
                                <ChevronDown className="w-5 h-5" />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Accordion Expanded Details */}
                        {isExpanded && (
                          <div className="px-5 pb-5 pt-2 border-t border-slate-100 bg-slate-50/70 space-y-4 animate-fade-in">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
                              <div className="p-3 bg-white rounded-xl border border-slate-200">
                                <span className="text-[10px] text-slate-400 uppercase font-bold">
                                  2024 Closing Rank
                                </span>
                                <p className="text-base font-extrabold text-indigo-600 mt-0.5">
                                  {program.closingRank2024}
                                </p>
                                <span className="text-[10px] text-slate-500">General Category</span>
                              </div>

                              <div className="p-3 bg-white rounded-xl border border-slate-200">
                                <span className="text-[10px] text-slate-400 uppercase font-bold">
                                  2023 Closing Rank
                                </span>
                                <p className="text-base font-extrabold text-slate-700 mt-0.5">
                                  {program.closingRank2023}
                                </p>
                                <span className="text-[10px] text-slate-500">Previous Cycle</span>
                              </div>

                              <div className="p-3 bg-white rounded-xl border border-slate-200">
                                <span className="text-[10px] text-slate-400 uppercase font-bold">
                                  Branch Median CTC
                                </span>
                                <p className="text-base font-extrabold text-emerald-600 mt-0.5">
                                  {program.medianCTC}
                                </p>
                                <span className="text-[10px] text-slate-500">50th Percentile</span>
                              </div>

                              <div className="p-3 bg-white rounded-xl border border-slate-200">
                                <span className="text-[10px] text-slate-400 uppercase font-bold">
                                  Entrance Mode
                                </span>
                                <p className="text-xs font-bold text-slate-800 mt-1">
                                  {program.exam}
                                </p>
                              </div>
                            </div>

                            {/* "Compare This Program" Button */}
                            <div className="flex items-center justify-between pt-2">
                              <p className="text-xs text-slate-500">
                                Want to compare <span className="font-bold text-slate-800">{program.name}</span> against another college?
                              </p>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCompareThisProgram(program);
                                }}
                                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                              >
                                <Scale className="w-3.5 h-3.5" />
                                <span>Compare This Program</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 3: PLACEMENTS (WITH SMALL BAR CHART FOR AVERAGE VS HIGHEST CTC) */}
            {activeTab === "placements" && (
              <div className="space-y-6">
                {/* 4-Stat Box */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs text-center">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">
                      Median CTC
                    </span>
                    <p className="text-xl font-extrabold text-emerald-600 mt-1">
                      {college.stats.medianSalary}
                    </p>
                    <span className="text-[10px] text-slate-500">Audited 50th %ile</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs text-center">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">
                      Average CTC
                    </span>
                    <p className="text-xl font-extrabold text-slate-900 mt-1">
                      {college.stats.avgSalary}
                    </p>
                    <span className="text-[10px] text-slate-500">Across All Branches</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs text-center">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">
                      Highest Domestic
                    </span>
                    <p className="text-xl font-extrabold text-indigo-600 mt-1">
                      {college.stats.highestDomestic}
                    </p>
                    <span className="text-[10px] text-slate-500">Indian Tech / Quant</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs text-center">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">
                      International Peak
                    </span>
                    <p className="text-xl font-extrabold text-slate-900 mt-1">
                      {college.stats.highestInternational}
                    </p>
                    <span className="text-[10px] text-slate-500">US / Singapore / EU</span>
                  </div>
                </div>

                {/* 4. SMALL BAR CHART FOR AVERAGE VS HIGHEST CTC */}
                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-indigo-600" />
                        <span>Average vs Highest Package (LPA)</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Head-to-head comparison between realistic average CTC and peak domestic offer.
                      </p>
                    </div>

                    {/* Chart Legend */}
                    <div className="flex items-center gap-4 text-xs font-bold">
                      <span className="flex items-center gap-1.5 text-indigo-600">
                        <span className="w-3 h-3 rounded-sm bg-indigo-600"></span>
                        <span>Average CTC</span>
                      </span>
                      <span className="flex items-center gap-1.5 text-emerald-600">
                        <span className="w-3 h-3 rounded-sm bg-emerald-500"></span>
                        <span>Highest CTC</span>
                      </span>
                    </div>
                  </div>

                  {/* Visual Bar Chart */}
                  <div className="pt-2 space-y-4">
                    {chartPrograms.map((prog, idx) => {
                      const avgPercent = Math.round((prog.avgVal / maxChartValue) * 100);
                      const highestPercent = Math.round((prog.highestVal / maxChartValue) * 100);

                      return (
                        <div key={idx} className="space-y-1.5">
                          <div className="flex justify-between text-xs">
                            <span className="font-extrabold text-slate-800">{prog.name}</span>
                            <span className="text-slate-500 font-medium">
                              Avg: <b className="text-indigo-600">₹{prog.avgVal} LPA</b> • Peak:{" "}
                              <b className="text-emerald-600">₹{prog.highestVal} LPA</b>
                            </span>
                          </div>

                          {/* Bars container */}
                          <div className="space-y-1 bg-slate-50 p-2 rounded-xl">
                            {/* Average bar */}
                            <div className="flex items-center gap-2">
                              <span className="w-12 text-[10px] text-slate-400 font-semibold text-right">
                                Avg
                              </span>
                              <div className="flex-1 bg-slate-200 h-3 rounded-full overflow-hidden">
                                <div
                                  className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                                  style={{ width: `${avgPercent}%` }}
                                ></div>
                              </div>
                              <span className="w-14 text-[10px] font-extrabold text-indigo-700">
                                ₹{prog.avgVal}L
                              </span>
                            </div>

                            {/* Highest bar */}
                            <div className="flex items-center gap-2">
                              <span className="w-12 text-[10px] text-slate-400 font-semibold text-right">
                                Peak
                              </span>
                              <div className="flex-1 bg-slate-200 h-3 rounded-full overflow-hidden">
                                <div
                                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                                  style={{ width: `${highestPercent}%` }}
                                ></div>
                              </div>
                              <span className="w-14 text-[10px] font-extrabold text-emerald-700">
                                ₹{prog.highestVal}L
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Top Recruiter Logos / Badges */}
                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                  <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                    Top Verified Recruiter Partners
                  </h3>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {college.topRecruiters.map((recruiter, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-800 text-xs font-bold border border-slate-200"
                      >
                        {recruiter}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: FEES */}
            {activeTab === "fees" && (
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">
                      Fee Breakdown & Government Subsidies
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Estimated 4-Year B.Tech Total: {college.stats.totalDegreeFee}
                    </p>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Transparent Billing
                  </span>
                </div>

                <div className="space-y-3">
                  {college.feeBreakdown.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div>
                        <p className="font-extrabold text-slate-900 text-sm">{item.component}</p>
                        <p className="text-slate-500 text-xs mt-0.5">{item.notes}</p>
                      </div>
                      <span className="font-extrabold text-slate-900 text-sm shrink-0 sm:text-right">
                        {item.amount}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-950 space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    <span>Government Fee Waiver Guarantee</span>
                  </p>
                  <p className="text-slate-600 leading-relaxed">
                    Under Ministry of Education norms, 100% tuition fee waiver applies to SC/ST/PwD students and candidates with annual parental income below ₹1 Lakh across all centrally funded IITs & NITs.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* 5. RIGHT SIDEBAR: STICKY CARDS */}
          <aside className="space-y-5 sticky top-24">
            {/* Card 1: "Book Free Counselling" CTA */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-[#0F172A] to-[#1E1B4B] text-white shadow-xl space-y-4 border border-indigo-900">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[11px] font-bold">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>1-on-1 Guidance</span>
              </div>

              <div>
                <h3 className="text-lg font-extrabold leading-tight">
                  Interested in {college.shortName}?
                </h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Book a free 30-minute video session with senior ex-IIT/IIM mentors to verify your cutoff eligibility and JoSAA seat allocation chances.
                </p>
              </div>

              <button
                type="button"
                onClick={() => openCounsellingModal(college)}
                className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs sm:text-sm shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Calendar className="w-4 h-4" />
                <span>Book Free Counselling</span>
              </button>

              <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800">
                <span>Free 30-min Google Meet</span>
                <span>•</span>
                <span>Zero Commission</span>
              </div>
            </div>

            {/* Card 2: "Add to Compare" */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Scale className="w-4 h-4 text-indigo-600" />
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                    Comparison Arena
                  </h4>
                </div>
                {isAddedToCompare && (
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Active in Tray
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  if (isAddedToCompare) {
                    removeFromCompare(college.id);
                  } else {
                    addToCompare(college);
                  }
                }}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  isAddedToCompare
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-300"
                    : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs"
                }`}
              >
                {isAddedToCompare ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>In Compare Tray (Remove)</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Add to Compare</span>
                  </>
                )}
              </button>

              {/* Rival Face-off Links */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Compare with Rival Colleges:
                </span>
                {rivals.map((rival) => (
                  <button
                    key={rival.id}
                    type="button"
                    onClick={() => {
                      if (setCompareList) {
                        setCompareList([college, rival]);
                      }
                      triggerCompare(`/compare?c1=${encodeURIComponent(college.id)}&c2=${encodeURIComponent(rival.id)}`);
                    }}
                    className="w-full p-2 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 flex items-center justify-between text-xs font-bold text-slate-700 transition-colors group cursor-pointer"
                  >
                    <span>vs {rival.shortName}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>
            </div>

            {/* Card 3: Quick Facts Pill List */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs text-xs space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                College Quick Facts
              </span>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Campus Size:</span>
                <span className="font-bold text-slate-800">{college.campusSize}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Ownership:</span>
                <span className="font-bold text-slate-800 truncate max-w-[150px]">
                  {college.ownership}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Placement Record:</span>
                <span className="font-bold text-emerald-600">{college.stats.placementPercent}%</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
