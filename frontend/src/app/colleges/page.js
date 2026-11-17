"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { COLLEGES } from "@/data/colleges";
import { collegesApi } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import {
  Search,
  Filter,
  SlidersHorizontal,
  MapPin,
  Trophy,
  IndianRupee,
  GraduationCap,
  Sparkles,
  Plus,
  Check,
  LayoutGrid,
  List,
  Calendar,
  X,
  ArrowRight,
  TrendingUp,
  ChevronDown,
  RotateCcw,
  BookOpen,
  Laptop,
  Building,
  CheckSquare,
  Square,
  ChevronLeft,
  ChevronRight,
  Scale,
  Trash2,
} from "lucide-react";

// Cascading Filter Data Options
const DEGREE_BRANCH_MAP = {
  All: {
    branches: ["All Branches"],
    specializations: {
      "All Branches": ["All Specializations"],
    },
  },
  "B.Tech / B.E.": {
    branches: [
      "All Branches",
      "Computer Science & Engineering",
      "Electrical & Electronics",
      "Mechanical Engineering",
      "Data Science & AI",
    ],
    specializations: {
      "All Branches": ["All Specializations"],
      "Computer Science & Engineering": [
        "All Specializations",
        "Artificial Intelligence & ML",
        "Data Science & Big Data",
        "Cyber Security & Networks",
        "Software Engineering & Cloud",
      ],
      "Electrical & Electronics": [
        "All Specializations",
        "VLSI Design & Embedded Systems",
        "Robotics & Control",
        "Power Systems & Green Tech",
      ],
      "Mechanical Engineering": [
        "All Specializations",
        "Automotive & Electric Vehicles",
        "Robotics & Automation",
        "Thermal & Aerodynamics",
      ],
      "Data Science & AI": [
        "All Specializations",
        "Deep Learning & NLP",
        "Computer Vision",
        "Generative AI Systems",
      ],
    },
  },
  "MBA / Management": {
    branches: [
      "All Branches",
      "General Management (PGP/MBA)",
      "Online MBA",
      "Food & Agribusiness (PGP-FABM)",
    ],
    specializations: {
      "All Branches": ["All Specializations"],
      "General Management (PGP/MBA)": [
        "All Specializations",
        "Finance & Quantitative Analysis",
        "Marketing & Brand Strategy",
        "Consulting & Business Analytics",
      ],
      "Online MBA": [
        "All Specializations",
        "Business Management",
        "Digital Marketing",
        "Financial Management",
      ],
      "Food & Agribusiness (PGP-FABM)": [
        "All Specializations",
        "Commodity Trading",
        "Agri-Supply Chain",
      ],
    },
  },
  "Dual Degree (5-Yr)": {
    branches: [
      "All Branches",
      "Computer Science + MS by Research",
      "Economics + B.E.",
    ],
    specializations: {
      "All Branches": ["All Specializations"],
      "Computer Science + MS by Research": [
        "All Specializations",
        "Theoretical Computer Science",
        "Natural Language Processing",
      ],
      "Economics + B.E.": [
        "All Specializations",
        "Quantitative Economics",
        "FinTech & Capital Markets",
      ],
    },
  },
};

const STATE_CITY_MAP = {
  All: ["All Cities"],
  Delhi: ["All Cities", "New Delhi"],
  Maharashtra: ["All Cities", "Mumbai", "Pune"],
  "Tamil Nadu": ["All Cities", "Chennai", "Vellore", "Tiruchirappalli"],
  Telangana: ["All Cities", "Hyderabad"],
  Rajasthan: ["All Cities", "Pilani"],
  Gujarat: ["All Cities", "Ahmedabad"],
};

function CollegesDirectoryContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const { addToCompare, removeFromCompare, isInCompare, compareList, clearCompare, triggerCompare } = useApp();

  // Primary Search
  const [search, setSearch] = useState(initialQuery);

  // 1. Cascading Degree -> Branch -> Specialization
  const [selectedDegree, setSelectedDegree] = useState("All");
  const [selectedBranch, setSelectedBranch] = useState("All Branches");
  const [selectedSpecialization, setSelectedSpecialization] = useState("All Specializations");

  // 2. Mode Toggle (All / Offline / Online)
  const [selectedMode, setSelectedMode] = useState("All"); // "All" | "Offline" | "Online"

  // 3. Dual-Handle Fee Range (in Lakhs: ₹0L - ₹30L)
  const [feeMin, setFeeMin] = useState(0);
  const [feeMax, setFeeMax] = useState(30);

  // 4. State & City Cascading
  const [selectedState, setSelectedState] = useState("All");
  const [selectedCity, setSelectedCity] = useState("All Cities");

  // Top Bar Controls
  const [sortBy, setSortBy] = useState("nirf"); // "nirf", "feeLow", "feeHigh", "salaryHigh", "rating"
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "list"
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Pagination (6 items per page)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Skeleton Loading Simulator for snappy interaction feel
  const [isLoading, setIsLoading] = useState(false);

  // Handle cascading reset on Degree change
  const handleDegreeChange = (degree) => {
    setSelectedDegree(degree);
    setSelectedBranch("All Branches");
    setSelectedSpecialization("All Specializations");
    setCurrentPage(1);
    triggerSkeleton();
  };

  // Handle cascading reset on Branch change
  const handleBranchChange = (branch) => {
    setSelectedBranch(branch);
    setSelectedSpecialization("All Specializations");
    setCurrentPage(1);
    triggerSkeleton();
  };

  // Handle cascading reset on State change
  const handleStateChange = (state) => {
    setSelectedState(state);
    setSelectedCity("All Cities");
    setCurrentPage(1);
    triggerSkeleton();
  };

  // Quick reset for all filters
  const resetFilters = () => {
    setSearch("");
    setSelectedDegree("All");
    setSelectedBranch("All Branches");
    setSelectedSpecialization("All Specializations");
    setSelectedMode("All");
    setFeeMin(0);
    setFeeMax(30);
    setSelectedState("All");
    setSelectedCity("All Cities");
    setSortBy("nirf");
    setCurrentPage(1);
    triggerSkeleton();
  };

  const triggerSkeleton = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 260);
  };

  // Available options derived dynamically
  const availableBranches = useMemo(() => {
    const config = DEGREE_BRANCH_MAP[selectedDegree] || DEGREE_BRANCH_MAP["All"];
    return config.branches || ["All Branches"];
  }, [selectedDegree]);

  const availableSpecializations = useMemo(() => {
    const config = DEGREE_BRANCH_MAP[selectedDegree] || DEGREE_BRANCH_MAP["All"];
    const specs = config.specializations[selectedBranch] || ["All Specializations"];
    return specs;
  }, [selectedDegree, selectedBranch]);

  const availableCities = useMemo(() => {
    return STATE_CITY_MAP[selectedState] || ["All Cities"];
  }, [selectedState]);

  // Main Filter Logic
  const filteredColleges = useMemo(() => {
    return COLLEGES.filter((col) => {
      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matches =
          col.name.toLowerCase().includes(q) ||
          col.shortName.toLowerCase().includes(q) ||
          col.city.toLowerCase().includes(q) ||
          col.state.toLowerCase().includes(q) ||
          col.tagline.toLowerCase().includes(q) ||
          col.programs.some((p) => p.name.toLowerCase().includes(q));
        if (!matches) return false;
      }

      // Mode (Online vs Offline)
      const isOnline = col.id === "online-mba-nmims" || (col.ownership && col.ownership.includes("Online"));
      if (selectedMode === "Online" && !isOnline) return false;
      if (selectedMode === "Offline" && isOnline) return false;

      // Degree Filter
      if (selectedDegree !== "All") {
        if (selectedDegree === "B.Tech / B.E.") {
          const hasBTech = col.programs.some(
            (p) => p.degree.includes("B.Tech") || p.degree.includes("B.E.")
          );
          if (!hasBTech) return false;
        } else if (selectedDegree === "MBA / Management") {
          const hasMBA = col.stream === "Management" || col.programs.some((p) => p.degree.includes("MBA"));
          if (!hasMBA) return false;
        } else if (selectedDegree === "Dual Degree (5-Yr)") {
          const hasDual = col.programs.some((p) => p.degree.includes("Dual") || p.duration === "5 Years");
          if (!hasDual) return false;
        }
      }

      // Branch Filter
      if (selectedBranch !== "All Branches") {
        const hasBranch = col.programs.some((p) => {
          if (selectedBranch === "Computer Science & Engineering") {
            return p.name.toLowerCase().includes("computer") || p.name.toLowerCase().includes("software");
          }
          if (selectedBranch === "Electrical & Electronics") {
            return p.name.toLowerCase().includes("electrical") || p.name.toLowerCase().includes("electronic");
          }
          if (selectedBranch === "Mechanical Engineering") {
            return p.name.toLowerCase().includes("mechanical") || p.name.toLowerCase().includes("aerospace");
          }
          if (selectedBranch === "Data Science & AI") {
            return p.name.toLowerCase().includes("data science") || p.name.toLowerCase().includes("artificial");
          }
          if (selectedBranch === "General Management (PGP/MBA)") {
            return p.degree.includes("MBA") || p.name.includes("Management");
          }
          if (selectedBranch === "Online MBA") {
            return col.id === "online-mba-nmims";
          }
          return p.name.toLowerCase().includes(selectedBranch.toLowerCase());
        });
        if (!hasBranch) return false;
      }

      // Fee Range (Dual Slider)
      const collegeFee = col.stats.totalDegreeFeeNum;
      if (collegeFee < feeMin || collegeFee > feeMax) {
        return false;
      }

      // State Filter
      if (selectedState !== "All") {
        if (!col.state.toLowerCase().includes(selectedState.toLowerCase())) {
          return false;
        }
      }

      // City Filter
      if (selectedCity !== "All Cities") {
        if (!col.city.toLowerCase().includes(selectedCity.toLowerCase())) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === "nirf") return a.nirfRank - b.nirfRank;
      if (sortBy === "feeLow") return a.stats.totalDegreeFeeNum - b.stats.totalDegreeFeeNum;
      if (sortBy === "feeHigh") return b.stats.totalDegreeFeeNum - a.stats.totalDegreeFeeNum;
      if (sortBy === "salaryHigh") return b.stats.medianSalaryNum - a.stats.medianSalaryNum;
      if (sortBy === "rating") return b.rating - a.rating;
      return 0;
    });
  }, [
    search,
    selectedMode,
    selectedDegree,
    selectedBranch,
    feeMin,
    feeMax,
    selectedState,
    selectedCity,
    sortBy,
  ]);

  // Paginated Slices
  const totalPages = Math.ceil(filteredColleges.length / itemsPerPage) || 1;
  const paginatedColleges = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredColleges.slice(start, start + itemsPerPage);
  }, [filteredColleges, currentPage, itemsPerPage]);

  // Live Backend State
  const [backendColleges, setBackendColleges] = useState(null);
  const [backendTotal, setBackendTotal] = useState(null);
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [isBackendLoading, setIsBackendLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadBackendData() {
      setIsBackendLoading(true);
      try {
        const params = {
          q: search.trim() || undefined,
          mode: selectedMode !== "All" ? selectedMode.toLowerCase() : undefined,
          degree: selectedDegree !== "All" ? selectedDegree : undefined,
          branch: selectedBranch !== "All Branches" ? selectedBranch : undefined,
          state: selectedState !== "All" ? selectedState : undefined,
          city: selectedCity !== "All Cities" ? selectedCity : undefined,
          minFees: feeMin > 0 ? feeMin : undefined,
          maxFees: feeMax < 30 ? feeMax : undefined,
          sort: sortBy,
          page: currentPage,
          limit: itemsPerPage,
        };
        const res = await collegesApi.list(params);
        if (isMounted && res && Array.isArray(res.data)) {
          setBackendColleges(res.data);
          setBackendTotal(res.pagination?.total ?? res.data.length);
          setIsBackendConnected(true);
        }
      } catch (err) {
        if (isMounted) {
          setIsBackendConnected(false);
          // Fallback gracefully to client-side filtered data
          setBackendColleges(null);
          setBackendTotal(null);
        }
      } finally {
        if (isMounted) {
          setIsBackendLoading(false);
        }
      }
    }

    const timer = setTimeout(loadBackendData, 200);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [
    search,
    selectedMode,
    selectedDegree,
    selectedBranch,
    selectedState,
    selectedCity,
    feeMin,
    feeMax,
    sortBy,
    currentPage,
  ]);

  const displayedColleges = backendColleges !== null ? backendColleges : paginatedColleges;
  const displayedTotal = backendTotal !== null ? backendTotal : filteredColleges.length;
  const finalTotalPages = backendTotal !== null ? Math.ceil(backendTotal / itemsPerPage) || 1 : totalPages;

  const activeFilterCount =
    (selectedDegree !== "All" ? 1 : 0) +
    (selectedBranch !== "All Branches" ? 1 : 0) +
    (selectedSpecialization !== "All Specializations" ? 1 : 0) +
    (selectedMode !== "All" ? 1 : 0) +
    (feeMin > 0 || feeMax < 30 ? 1 : 0) +
    (selectedState !== "All" ? 1 : 0) +
    (selectedCity !== "All Cities" ? 1 : 0);

  // Toggle compare checkbox
  const handleToggleCompare = (college) => {
    if (isInCompare(college.id)) {
      removeFromCompare(college.id);
    } else {
      addToCompare(college);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-32">
      {/* Top Header / Trust Bar */}
      <div className="bg-slate-900 text-white py-8 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-indigo-300 text-xs font-semibold mb-2">
              <Trophy className="w-3.5 h-3.5 text-indigo-400" />
              <span>Certified 2024 NIRF College Discovery & Matrix</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Faceted College Directory
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Filter by degree level, branch specializations, campus mode, and dual-handle fee thresholds.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                const targetUrl =
                  compareList.length >= 2
                    ? `/compare?c1=${encodeURIComponent(
                        compareList[0]?.slug || compareList[0]?.id
                      )}&c2=${encodeURIComponent(
                        compareList[1]?.slug || compareList[1]?.id
                      )}`
                    : "/compare";
                triggerCompare(targetUrl);
              }}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Scale className="w-4 h-4" />
              <span>Compare Arena {compareList.length > 0 && `(${compareList.length})`}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* TOP BAR: Search Input + Result Count + Sort Dropdown + Grid/List Toggle */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
          {/* Search Input */}
          <div className="relative w-full md:w-96 flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
                triggerSkeleton();
              }}
              placeholder="Search colleges, courses, cities..."
              className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-xs sm:text-sm font-semibold outline-none transition-all placeholder:text-slate-400"
            />
            {search && (
              <button
                onClick={() => {
                  setSearch("");
                  setCurrentPage(1);
                  triggerSkeleton();
                }}
                className="absolute right-3 text-slate-400 hover:text-slate-600 p-1"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Results Count & Actions */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            {/* Mobile Filter Button */}
            <button
              onClick={() => setMobileFilterOpen(true)}
              className="md:hidden flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 bg-slate-50 shadow-xs cursor-pointer"
            >
              <Filter className="w-3.5 h-3.5 text-indigo-600" />
              <span>Filters {activeFilterCount > 0 && `(${activeFilterCount})`}</span>
            </button>

            {/* Results Count & Live Status */}
            <div className="flex items-center gap-2 hidden sm:flex">
              <span className="text-xs font-bold text-slate-600">
                Showing <span className="text-slate-900">{displayedTotal}</span> colleges
              </span>
              {isBackendConnected && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Live API
                </span>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500 font-semibold hidden lg:inline">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  triggerSkeleton();
                }}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white outline-none cursor-pointer focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="nirf">NIRF Rank (Ascending)</option>
                <option value="feeLow">Fees: Low to High</option>
                <option value="feeHigh">Fees: High to Low</option>
                <option value="salaryHigh">Median CTC: High to Low</option>
                <option value="rating">Highest Student Rating</option>
              </select>
            </div>

            {/* Grid / List Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  viewMode === "grid" ? "bg-white text-indigo-600 shadow-xs font-bold" : "text-slate-500"
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  viewMode === "list" ? "bg-white text-indigo-600 shadow-xs font-bold" : "text-slate-500"
                }`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* LAYOUT: SIDEBAR FILTERS (Left) + MAIN COLLEGE AREA (Right) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
          {/* DESKTOP LEFT SIDEBAR FILTERS */}
          <aside className="hidden md:block md:col-span-1 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-6 sticky top-20">
            {/* Sidebar Title & Clear All Link */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                  Filters
                </h3>
              </div>
              {activeFilterCount > 0 ? (
                <button
                  onClick={resetFilters}
                  className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Clear all</span>
                </button>
              ) : (
                <span className="text-[11px] text-slate-400 font-medium">Default</span>
              )}
            </div>

            {/* 1. Cascading Degree -> Branch -> Specialization */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
                  Degree
                </label>
                <span className="text-[10px] text-indigo-600 font-bold">Step 1</span>
              </div>
              <select
                value={selectedDegree}
                onChange={(e) => handleDegreeChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-slate-50 focus:bg-white focus:border-indigo-600 outline-none cursor-pointer"
              >
                <option value="All">All Degrees</option>
                <option value="B.Tech / B.E.">B.Tech / B.E.</option>
                <option value="MBA / Management">MBA / Management</option>
                <option value="Dual Degree (5-Yr)">Dual Degree (5-Yr)</option>
              </select>

              {/* Branch Select */}
              <div className="pt-1">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
                    Branch / Stream
                  </label>
                  <span className="text-[10px] text-indigo-600 font-bold">Step 2</span>
                </div>
                <select
                  value={selectedBranch}
                  onChange={(e) => handleBranchChange(e.target.value)}
                  disabled={selectedDegree === "All"}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-slate-50 focus:bg-white focus:border-indigo-600 outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {availableBranches.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
                {selectedDegree === "All" && (
                  <p className="text-[10px] text-slate-400 mt-0.5">Select a degree first</p>
                )}
              </div>

              {/* Specialization Select */}
              <div className="pt-1">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
                    Specialization
                  </label>
                  <span className="text-[10px] text-indigo-600 font-bold">Step 3</span>
                </div>
                <select
                  value={selectedSpecialization}
                  onChange={(e) => {
                    setSelectedSpecialization(e.target.value);
                    setCurrentPage(1);
                    triggerSkeleton();
                  }}
                  disabled={selectedBranch === "All Branches"}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-slate-50 focus:bg-white focus:border-indigo-600 outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {availableSpecializations.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 2. Mode Toggle (Online / Offline / All) */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
                Learning Mode
              </label>
              <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
                {[
                  { id: "All", label: "All" },
                  { id: "Offline", label: "Offline" },
                  { id: "Online", label: "Online" },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => {
                      setSelectedMode(mode.id);
                      setCurrentPage(1);
                      triggerSkeleton();
                    }}
                    className={`py-1.5 rounded-lg transition-all cursor-pointer text-center text-xs ${
                      selectedMode === mode.id
                        ? "bg-white text-indigo-600 shadow-xs font-extrabold"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Fee Range Dual-Handle Slider (₹ min - max) */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
                  Fee Range (Total Degree)
                </label>
                <span className="text-xs font-extrabold text-indigo-600">
                  ₹{feeMin}L - ₹{feeMax}L
                </span>
              </div>

              {/* Dual Range Controls */}
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-[10px] text-slate-500 font-semibold mb-1">
                    <span>Min: ₹{feeMin} Lakhs</span>
                    <span>Max: ₹{feeMax} Lakhs</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    step="1"
                    value={feeMin}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (val <= feeMax) {
                        setFeeMin(val);
                        setCurrentPage(1);
                      }
                    }}
                    className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                  />
                  <input
                    type="range"
                    min="5"
                    max="30"
                    step="1"
                    value={feeMax}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (val >= feeMin) {
                        setFeeMax(val);
                        setCurrentPage(1);
                      }
                    }}
                    className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg mt-1"
                  />
                </div>
              </div>
            </div>

            {/* 4. State and City Dropdowns */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                  State
                </label>
                <select
                  value={selectedState}
                  onChange={(e) => handleStateChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-slate-50 focus:bg-white focus:border-indigo-600 outline-none cursor-pointer"
                >
                  <option value="All">All States</option>
                  <option value="Delhi">Delhi</option>
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Tamil Nadu">Tamil Nadu</option>
                  <option value="Telangana">Telangana</option>
                  <option value="Rajasthan">Rajasthan</option>
                  <option value="Gujarat">Gujarat</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                  City
                </label>
                <select
                  value={selectedCity}
                  onChange={(e) => {
                    setSelectedCity(e.target.value);
                    setCurrentPage(1);
                    triggerSkeleton();
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-slate-50 focus:bg-white focus:border-indigo-600 outline-none cursor-pointer"
                >
                  {availableCities.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </aside>

          {/* MAIN RESULTS AREA (Right 3 cols) */}
          <main className="md:col-span-3 space-y-5">
            {/* Active Filter Tags Row */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="font-semibold text-slate-500 mr-1">Active filters:</span>
                {selectedDegree !== "All" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                    {selectedDegree}
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-indigo-900"
                      onClick={() => handleDegreeChange("All")}
                    />
                  </span>
                )}
                {selectedBranch !== "All Branches" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                    {selectedBranch}
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-indigo-900"
                      onClick={() => handleBranchChange("All Branches")}
                    />
                  </span>
                )}
                {selectedMode !== "All" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                    Mode: {selectedMode}
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-indigo-900"
                      onClick={() => setSelectedMode("All")}
                    />
                  </span>
                )}
                {(feeMin > 0 || feeMax < 30) && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                    ₹{feeMin}L - ₹{feeMax}L
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-indigo-900"
                      onClick={() => {
                        setFeeMin(0);
                        setFeeMax(30);
                      }}
                    />
                  </span>
                )}
                {selectedState !== "All" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                    {selectedState}
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-indigo-900"
                      onClick={() => handleStateChange("All")}
                    />
                  </span>
                )}
                <button
                  onClick={resetFilters}
                  className="text-xs text-red-600 font-bold hover:underline ml-1 cursor-pointer"
                >
                  Clear all
                </button>
              </div>
            )}

            {/* SKELETON LOADING STATE */}
            {isLoading ? (
              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-5"
                    : "space-y-4"
                }
              >
                {[1, 2, 3, 4].map((n) => (
                  <div
                    key={n}
                    className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 animate-pulse"
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-16 h-5 bg-slate-200 rounded-full"></div>
                      <div className="w-24 h-4 bg-slate-100 rounded"></div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-slate-200 rounded-xl"></div>
                      <div className="space-y-2 flex-1">
                        <div className="w-3/4 h-5 bg-slate-200 rounded"></div>
                        <div className="w-1/2 h-3.5 bg-slate-100 rounded"></div>
                      </div>
                    </div>
                    <div className="h-16 bg-slate-100 rounded-xl"></div>
                    <div className="flex gap-2">
                      <div className="flex-1 h-9 bg-slate-200 rounded-xl"></div>
                      <div className="w-20 h-9 bg-slate-100 rounded-xl"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : displayedTotal === 0 ? (
              /* EMPTY STATE */
              <div className="bg-white p-12 text-center rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mx-auto">
                  <Search className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  No colleges match your active filters
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                  We couldn&apos;t find any institution matching your specific combination of degree, branch, fee range (₹{feeMin}L-₹{feeMax}L), and location.
                </p>
                <div className="pt-2 flex items-center justify-center gap-3">
                  <button
                    onClick={resetFilters}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
                  >
                    Reset All Filters
                  </button>
                  <button
                    onClick={() => {
                      setFeeMin(0);
                      setFeeMax(30);
                    }}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                  >
                    Expand Fee Range
                  </button>
                </div>
              </div>
            ) : viewMode === "grid" ? (
              /* MAIN AREA: GRID CARDS */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-5">
                {displayedColleges.map((college) => {
                  const isChecked = isInCompare(college.id);
                  const startingFee = college.stats?.btechFeesPerYear || "₹1.4 Lakhs/yr";
                  return (
                    <div
                      key={college.id}
                      className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all flex flex-col justify-between overflow-hidden group"
                    >
                      <div className="p-5 space-y-3">
                        {/* Top: NIRF Badge & Location */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-slate-900 text-white shadow-xs">
                            NIRF #{college.nirfRank}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {college.city}, {college.state}
                          </span>
                        </div>

                        {/* Logo, Name & Ownership */}
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-12 h-12 rounded-xl flex items-center justify-center font-extrabold text-sm shrink-0 shadow-xs ${college.avatarBg}`}
                          >
                            {college.code || college.logoText}
                          </div>
                          <div className="min-w-0 flex-1">
                            <Link
                              href={`/colleges/${college.slug}`}
                              className="text-base font-extrabold text-slate-900 hover:text-indigo-600 transition-colors line-clamp-1 leading-snug"
                            >
                              {college.shortName}
                            </Link>
                            <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                              {college.name}
                            </p>
                          </div>
                        </div>

                        {/* Fee Tag & Number of Programs */}
                        <div className="grid grid-cols-2 gap-2 my-3 p-3 bg-slate-50 rounded-xl text-xs">
                          <div>
                            <span className="text-[10px] text-slate-600 uppercase font-bold tracking-wider">
                              Fee Tag
                            </span>
                            <p className="text-xs sm:text-sm font-extrabold text-slate-900 mt-0.5">
                              Starting from {startingFee}
                            </p>
                            <span className="text-[10px] text-slate-600">
                              Total: {college.stats.totalDegreeFee}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-600 uppercase font-bold tracking-wider">
                              Programs & Salary
                            </span>
                            <p className="text-xs sm:text-sm font-extrabold text-emerald-600 mt-0.5">
                              {college.stats.medianSalary} Median
                            </p>
                            <span className="text-[10px] text-indigo-700 font-semibold">
                              {college.programs.length} Programs Available
                            </span>
                          </div>
                        </div>

                        {/* Exam Pill & Stream */}
                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                          <span>Exam: {college.entranceExams.join(", ")}</span>
                          <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                            {college.stream}
                          </span>
                        </div>
                      </div>

                      {/* Card Action Footer: "Add to Compare" Checkbox Button + Details link */}
                      <div className="p-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-3">
                        {/* Checkbox button */}
                        <button
                          type="button"
                          onClick={() => handleToggleCompare(college)}
                          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                            isChecked
                              ? "bg-indigo-600 text-white shadow-xs"
                              : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-300"
                          }`}
                        >
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-white" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400" />
                          )}
                          <span>{isChecked ? "In Compare Tray" : "Add to Compare"}</span>
                        </button>

                        <Link
                          href={`/colleges/${college.slug}`}
                          className="py-2 px-3.5 rounded-xl text-xs font-bold text-indigo-600 hover:text-white hover:bg-indigo-600 border border-indigo-200 transition-colors text-center shrink-0"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* MAIN AREA: LIST VIEW */
              <div className="space-y-3">
                {displayedColleges.map((college) => {
                  const isChecked = isInCompare(college.id);
                  const startingFee = college.stats?.btechFeesPerYear || "₹1.4 Lakhs/yr";
                  return (
                    <div
                      key={college.id}
                      className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:border-indigo-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-start sm:items-center gap-3.5">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center font-extrabold text-sm shrink-0 shadow-xs ${college.avatarBg}`}
                        >
                          {college.code || college.logoText}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-900 text-white">
                              NIRF #{college.nirfRank}
                            </span>
                            <span className="text-xs text-slate-500">
                              {college.city}, {college.state}
                            </span>
                            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                              {college.programs?.length || 0} Programs
                            </span>
                          </div>
                          <Link
                            href={`/colleges/${college.slug}`}
                            className="text-base font-extrabold text-slate-900 hover:text-indigo-600 transition-colors leading-snug block mt-0.5"
                          >
                            {college.shortName}
                          </Link>
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                            {college.name} • Exam: {(college.entranceExams || []).join(", ")}
                          </p>
                        </div>
                      </div>

                      {/* Fee Tag + Checkbox Button */}
                      <div className="flex items-center gap-4 self-end sm:self-auto shrink-0">
                        <div className="text-right">
                          <p className="text-xs font-bold text-slate-500 uppercase">Starting from</p>
                          <p className="text-sm font-extrabold text-slate-900">{startingFee}</p>
                          <p className="text-[11px] text-emerald-600 font-bold">{college.stats?.medianSalary} Median</p>
                        </div>

                        {/* Checkbox button */}
                        <button
                          type="button"
                          onClick={() => handleToggleCompare(college)}
                          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                            isChecked
                              ? "bg-indigo-600 text-white"
                              : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-300"
                          }`}
                        >
                          {isChecked ? (
                            <CheckSquare className="w-3.5 h-3.5" />
                          ) : (
                            <Square className="w-3.5 h-3.5 text-slate-400" />
                          )}
                          <span>{isChecked ? "Selected" : "Compare"}</span>
                        </button>

                        <Link
                          href={`/colleges/${college.slug}`}
                          className="p-2 rounded-xl text-indigo-600 hover:bg-indigo-50 border border-indigo-200"
                          title="View Detail"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* PAGINATION STRIP */}
            {displayedTotal > itemsPerPage && (
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200">
                <p className="text-xs text-slate-500">
                  Page <span className="font-bold text-slate-800">{currentPage}</span> of{" "}
                  <span className="font-bold text-slate-800">{finalTotalPages}</span> ({displayedTotal} Total Colleges)
                </p>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      if (currentPage > 1) {
                        setCurrentPage((p) => p - 1);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }
                    }}
                    disabled={currentPage === 1}
                    className="p-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </button>

                  {Array.from({ length: finalTotalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => {
                        setCurrentPage(page);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        currentPage === page
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-200"
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    onClick={() => {
                      if (currentPage < finalTotalPages) {
                        setCurrentPage((p) => p + 1);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }
                    }}
                    disabled={currentPage === finalTotalPages}
                    className="p-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* MOBILE BOTTOM SHEET FOR FILTERS */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/70 backdrop-blur-xs animate-fade-in md:hidden">
          <div
            className="w-full bg-white rounded-t-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet Handle & Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-extrabold text-slate-900">
                  Filters ({activeFilterCount} active)
                </h3>
              </div>
              <div className="flex items-center gap-3">
                {activeFilterCount > 0 && (
                  <button
                    onClick={resetFilters}
                    className="text-xs font-bold text-red-600 cursor-pointer"
                  >
                    Clear All
                  </button>
                )}
                <button
                  onClick={() => setMobileFilterOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Filters Body */}
            <div className="p-5 overflow-y-auto space-y-5 flex-1">
              {/* Degree */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Degree</label>
                <select
                  value={selectedDegree}
                  onChange={(e) => handleDegreeChange(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800"
                >
                  <option value="All">All Degrees</option>
                  <option value="B.Tech / B.E.">B.Tech / B.E.</option>
                  <option value="MBA / Management">MBA / Management</option>
                  <option value="Dual Degree (5-Yr)">Dual Degree (5-Yr)</option>
                </select>
              </div>

              {/* Branch */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Branch</label>
                <select
                  value={selectedBranch}
                  onChange={(e) => handleBranchChange(e.target.value)}
                  disabled={selectedDegree === "All"}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 disabled:opacity-50"
                >
                  {availableBranches.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mode Toggle */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Learning Mode</label>
                <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1 rounded-xl">
                  {["All", "Offline", "Online"].map((m) => (
                    <button
                      key={m}
                      onClick={() => setSelectedMode(m)}
                      className={`py-2 rounded-lg text-xs font-bold ${
                        selectedMode === m ? "bg-white text-indigo-600 shadow" : "text-slate-600"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fee Range */}
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>Fee Range:</span>
                  <span className="text-indigo-600">₹{feeMin}L - ₹{feeMax}L</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30"
                  value={feeMax}
                  onChange={(e) => setFeeMax(Number(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>

              {/* State & City */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">State</label>
                  <select
                    value={selectedState}
                    onChange={(e) => handleStateChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800"
                  >
                    <option value="All">All States</option>
                    <option value="Delhi">Delhi</option>
                    <option value="Maharashtra">Maharashtra</option>
                    <option value="Tamil Nadu">Tamil Nadu</option>
                    <option value="Telangana">Telangana</option>
                    <option value="Rajasthan">Rajasthan</option>
                    <option value="Gujarat">Gujarat</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800"
                  >
                    {availableCities.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Bottom Apply Bar */}
            <div className="p-4 bg-slate-50 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                className="w-full py-3 rounded-xl bg-indigo-600 text-white font-extrabold text-sm shadow cursor-pointer text-center"
              >
                Apply Filters ({filteredColleges.length} Colleges Found)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING BOTTOM BAR LISTING SELECTED COLLEGES WITH "COMPARE (X)" BUTTON */}
      {compareList.length > 0 && (
        <aside
          aria-label="Selected Colleges Compare Bar"
          className="fixed bottom-4 inset-x-4 max-w-4xl mx-auto z-40 animate-slide-up"
        >
          <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700 text-white p-3.5 sm:p-4 rounded-2xl shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Left: Selected Thumbnails & Count */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="flex items-center -space-x-2 shrink-0">
                {compareList.map((col) => (
                  <div
                    key={col.id}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs border-2 border-slate-900 shadow-sm ${col.avatarBg}`}
                    title={col.shortName}
                  >
                    {col.code || col.logoText}
                  </div>
                ))}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-extrabold text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>{compareList.length}/2 Colleges Selected for Head-to-Head</span>
                </p>
                <p className="text-[11px] text-slate-400 truncate">
                  {compareList.map((c) => c.shortName).join(", ")}
                </p>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
              <button
                onClick={clearCompare}
                className="px-3 py-2 text-xs font-semibold text-slate-400 hover:text-red-400 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const targetUrl =
                    compareList.length >= 2
                      ? `/compare?c1=${encodeURIComponent(
                          compareList[0]?.slug || compareList[0]?.id
                        )}&c2=${encodeURIComponent(
                          compareList[1]?.slug || compareList[1]?.id
                        )}`
                      : "/compare";
                  triggerCompare(targetUrl);
                }}
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Scale className="w-4 h-4" />
                <span>Compare ({compareList.length}/2)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}

export default function CollegesDirectoryPage() {
  return (
    <Suspense
      fallback={
        <div className="p-16 text-center text-slate-400 space-y-3">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-bold text-slate-600">Loading College Directory...</p>
        </div>
      }
    >
      <CollegesDirectoryContent />
    </Suspense>
  );
}
