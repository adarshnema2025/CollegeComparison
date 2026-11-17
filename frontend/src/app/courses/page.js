"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { coursesApi } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import {
  BookOpen,
  GraduationCap,
  Search,
  Building2,
  MapPin,
  IndianRupee,
  Briefcase,
  Trophy,
  Filter,
  ArrowRight,
  CheckSquare,
  Square,
  Sparkles,
  Layers,
  Calendar,
  ChevronRight,
  SlidersHorizontal,
  Clock,
  ExternalLink,
  Laptop,
} from "lucide-react";

// Fallback courses catalog if backend API is not yet loaded
const FALLBACK_CATALOG = [
  {
    degree: "B.Tech",
    branches: [
      {
        branch: "Computer Science & Engineering",
        courses: [{ id: 1, specialization: null }],
      },
      {
        branch: "Data Science & Artificial Intelligence",
        courses: [{ id: 13, specialization: null }],
      },
      {
        branch: "Electrical Engineering",
        courses: [{ id: 11, specialization: null }],
      },
      {
        branch: "Mechanical Engineering",
        courses: [{ id: 12, specialization: null }],
      },
    ],
  },
  {
    degree: "B.E. (Hons)",
    branches: [
      {
        branch: "Computer Science & Engineering",
        courses: [{ id: 16, specialization: null }],
      },
      {
        branch: "Electronics & Communication Engg",
        courses: [{ id: 17, specialization: null }],
      },
    ],
  },
  {
    degree: "MBA",
    branches: [
      {
        branch: "Post Graduate Program in Management (PGP / MBA)",
        courses: [{ id: 25, specialization: null }],
      },
    ],
  },
];

function CoursesExplorerContent() {
  const searchParams = useSearchParams();
  const initialCourseId = searchParams.get("id");

  const { addToCompare, removeFromCompare, isInCompare, openCounsellingModal, showToast } =
    useApp();

  // Catalog State
  const [catalog, setCatalog] = useState(FALLBACK_CATALOG);
  const [catalogLoading, setCatalogLoading] = useState(true);

  // Filter States for Courses Sidebar
  const [courseSearch, setCourseSearch] = useState("");
  const [selectedDegree, setSelectedDegree] = useState("All");

  // Selected Course
  const [selectedCourse, setSelectedCourse] = useState(null);

  // Colleges for Selected Course State
  const [colleges, setColleges] = useState([]);
  const [collegesLoading, setCollegesLoading] = useState(false);
  const [sortBy, setSortBy] = useState("ranking"); // "ranking" | "placement" | "fees_asc" | "fees_desc"
  const [modeFilter, setModeFilter] = useState("all"); // "all" | "offline" | "online"

  // 1. Fetch Course Catalog from live backend
  useEffect(() => {
    let isMounted = true;
    async function loadCatalog() {
      try {
        const data = await coursesApi.getCatalog(false);
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setCatalog(data);
        }
      } catch (err) {
        console.warn("Using fallback catalog:", err.message);
      } finally {
        if (isMounted) setCatalogLoading(false);
      }
    }
    loadCatalog();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Flatten all courses into a convenient list
  const allCourses = useMemo(() => {
    const list = [];
    catalog.forEach((degGroup) => {
      degGroup.branches.forEach((bGroup) => {
        bGroup.courses.forEach((c) => {
          list.push({
            id: c.id,
            degree: degGroup.degree,
            branch: bGroup.branch,
            specialization: c.specialization,
            displayName: c.specialization
              ? `${degGroup.degree} in ${bGroup.branch} (${c.specialization})`
              : `${degGroup.degree} in ${bGroup.branch}`,
          });
        });
      });
    });
    return list;
  }, [catalog]);

  // Set initial selected course once list is available
  useEffect(() => {
    if (allCourses.length > 0 && !selectedCourse) {
      if (initialCourseId) {
        const found = allCourses.find((c) => String(c.id) === String(initialCourseId));
        if (found) {
          setSelectedCourse(found);
          return;
        }
      }
      setSelectedCourse(allCourses[0]);
    }
  }, [allCourses, initialCourseId, selectedCourse]);

  // Available unique degree tabs
  const degreesList = useMemo(() => {
    const set = new Set(allCourses.map((c) => c.degree));
    return ["All", ...Array.from(set)];
  }, [allCourses]);

  // Filtered courses based on search & degree
  const filteredCourses = useMemo(() => {
    return allCourses.filter((c) => {
      if (selectedDegree !== "All" && c.degree !== selectedDegree) return false;
      if (courseSearch.trim()) {
        const q = courseSearch.toLowerCase();
        return (
          c.displayName.toLowerCase().includes(q) ||
          c.branch.toLowerCase().includes(q) ||
          (c.specialization && c.specialization.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [allCourses, selectedDegree, courseSearch]);

  // 3. Fetch colleges for the selected course using `/courses/:id/colleges`
  useEffect(() => {
    if (!selectedCourse?.id) return;

    let isMounted = true;
    async function fetchCollegesForCourse() {
      setCollegesLoading(true);
      try {
        const data = await coursesApi.getCollegesByCourse(selectedCourse.id, {
          sort: sortBy,
          mode: modeFilter !== "all" ? modeFilter : undefined,
          limit: 50,
        });
        if (isMounted) {
          setColleges(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.warn("Failed to fetch colleges for course:", err.message);
        if (isMounted) setColleges([]);
      } finally {
        if (isMounted) setCollegesLoading(false);
      }
    }

    fetchCollegesForCourse();
    return () => {
      isMounted = false;
    };
  }, [selectedCourse, sortBy, modeFilter]);

  const formatLakhs = (amount) => {
    if (!amount || isNaN(amount)) return "₹2.2 L";
    const lakhs = (Number(amount) / 100000).toFixed(1);
    return `₹${lakhs} Lakhs`;
  };

  const formatLPA = (amount) => {
    if (!amount || isNaN(amount)) return "₹20.0 LPA";
    const lpa = (Number(amount) / 100000).toFixed(1);
    return `₹${lpa} LPA`;
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-24">
      {/* 1. HERO HEADER */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white pt-12 pb-16 px-4 sm:px-6 lg:px-8 border-b border-slate-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#4f46e5_1px,transparent_1px)] [background-size:20px_20px] opacity-15"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold mb-3">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Reverse Course Lookup Engine</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
                Explore Colleges by Course
              </h1>
              <p className="text-slate-300 text-sm sm:text-base mt-2 max-w-2xl leading-relaxed">
                Pick your target degree & specialization to see every certified Indian institution
                offering it head-to-head — ranked by verified placements, actual fees, and NIRF scores.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/colleges"
                className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-white text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5"
              >
                <Building2 className="w-4 h-4 text-slate-400" />
                <span>Browse All Colleges</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN WORKSPACE: SIDEBAR CATALOG + DETAIL ARENA */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ======================================================== */}
          {/* LEFT: COURSES CATALOG COLUMN (4 COLS) */}
          {/* ======================================================== */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sticky top-20">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-600" />
                  <h2 className="font-extrabold text-slate-900 text-base">Course Catalog</h2>
                </div>
                <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                  {allCourses.length} Programs
                </span>
              </div>

              {/* Search Bar for Courses */}
              <div className="relative mb-3">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={courseSearch}
                  onChange={(e) => setCourseSearch(e.target.value)}
                  placeholder="Filter courses e.g. AI, CSE, MBA..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all bg-slate-50"
                />
              </div>

              {/* Degree Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none mb-3">
                {degreesList.map((deg) => (
                  <button
                    key={deg}
                    onClick={() => setSelectedDegree(deg)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      selectedDegree === deg
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                    }`}
                  >
                    {deg}
                  </button>
                ))}
              </div>

              {/* Scrollable Course List */}
              <div className="space-y-1.5 max-h-[60vh] overflow-y-auto pr-1">
                {filteredCourses.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs font-medium">
                    No courses match your filter
                  </div>
                ) : (
                  filteredCourses.map((c) => {
                    const isSelected = selectedCourse?.id === c.id;
                    return (
                      <button
                        key={c.id}
                        onClick={() => setSelectedCourse(c)}
                        className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between gap-3 group cursor-pointer ${
                          isSelected
                            ? "bg-indigo-50 border-2 border-indigo-600 text-indigo-950 shadow-xs"
                            : "hover:bg-slate-50 border border-slate-100 text-slate-700"
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider mb-1 ${
                              isSelected
                                ? "bg-indigo-600 text-white"
                                : "bg-slate-200 text-slate-700"
                            }`}
                          >
                            {c.degree}
                          </span>
                          <p className="text-xs font-extrabold text-slate-900 leading-snug line-clamp-2">
                            {c.branch}
                          </p>
                          {c.specialization && (
                            <p className="text-[11px] text-indigo-700 font-semibold mt-0.5">
                              Spec: {c.specialization}
                            </p>
                          )}
                        </div>
                        <ChevronRight
                          className={`w-4 h-4 shrink-0 transition-transform ${
                            isSelected
                              ? "text-indigo-600 translate-x-0.5"
                              : "text-slate-300 group-hover:text-slate-500"
                          }`}
                        />
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* RIGHT: COLLEGES OFFERING THIS COURSE (8 COLS) */}
          {/* ======================================================== */}
          <div className="lg:col-span-8 space-y-4">
            {/* Selected Course Header Banner */}
            {selectedCourse && (
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-indigo-100 text-indigo-700">
                      {selectedCourse.degree}
                    </span>
                    <span className="text-xs text-slate-500 font-bold">
                      Course ID: #{selectedCourse.id}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Live API `/courses/:id/colleges`
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {selectedCourse.displayName}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Showing institutions offering this specific branch curriculum.
                  </p>
                </div>

                {/* Quick compare this course button */}
                <button
                  onClick={() => {
                    if (colleges.length >= 2) {
                      addToCompare({
                        id: colleges[0].college.slug,
                        name: colleges[0].college.name,
                        shortName: colleges[0].college.name.split(" ")[0],
                      });
                      addToCompare({
                        id: colleges[1].college.slug,
                        name: colleges[1].college.name,
                        shortName: colleges[1].college.name.split(" ")[0],
                      });
                      showToast("Loaded top 2 colleges for this course into Compare Tray!", "success");
                    }
                  }}
                  disabled={colleges.length < 2}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-2 shrink-0 self-start sm:self-auto cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Compare Top 2 Rivals</span>
                </button>
              </div>
            )}

            {/* Filter & Sort Controls for Colleges */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-slate-500 font-bold">Mode:</span>
                <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                  {["all", "offline", "online"].map((m) => (
                    <button
                      key={m}
                      onClick={() => setModeFilter(m)}
                      className={`px-3 py-1 rounded-lg font-bold capitalize transition-all cursor-pointer ${
                        modeFilter === m
                          ? "bg-white text-indigo-600 shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort By Dropdown */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                <span className="text-slate-500 font-bold">Sort Colleges:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 font-bold text-slate-700 bg-white outline-none cursor-pointer focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="ranking">NIRF Ranking (Ascending)</option>
                  <option value="placement">Highest Placements (Avg LPA)</option>
                  <option value="fees_asc">Total Fees: Low to High</option>
                  <option value="fees_desc">Total Fees: High to Low</option>
                </select>
              </div>
            </div>

            {/* Colleges Offering This Course List */}
            {collegesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse space-y-3"
                  >
                    <div className="h-5 bg-slate-200 rounded w-1/3"></div>
                    <div className="h-4 bg-slate-100 rounded w-2/3"></div>
                    <div className="grid grid-cols-3 gap-3 pt-2">
                      <div className="h-8 bg-slate-100 rounded"></div>
                      <div className="h-8 bg-slate-100 rounded"></div>
                      <div className="h-8 bg-slate-100 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : colleges.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <GraduationCap className="w-7 h-7" />
                </div>
                <h3 className="text-base font-extrabold text-slate-900">
                  No colleges found for this filter
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  No institution currently offers this course with mode &quot;{modeFilter}&quot;.
                  Try switching mode to &quot;All&quot; or selecting another course.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {colleges.map((item, idx) => {
                  const col = item.college || {};
                  const isChecked = isInCompare(col.slug || col.id);

                  return (
                    <div
                      key={item.programId || idx}
                      className="bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 transition-all p-5 shadow-xs hover:shadow-md flex flex-col md:flex-row md:items-center justify-between gap-5 group"
                    >
                      {/* Left: College Info */}
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-900 text-white shadow-xs">
                            Rank #{idx + 1}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold capitalize bg-slate-100 text-slate-700">
                            {col.type || "Government"}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              item.mode === "online"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {item.mode || "offline"}
                          </span>
                        </div>

                        <Link
                          href={`/colleges/${col.slug}`}
                          className="text-base sm:text-lg font-black text-slate-900 hover:text-indigo-600 transition-colors block leading-tight"
                        >
                          {col.name}
                        </Link>

                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {col.city}, {col.state}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {item.durationYears || 4} Years
                          </span>
                        </div>
                      </div>

                      {/* Middle: Fees & Placements */}
                      <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl shrink-0 text-center min-w-[200px]">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-600 block">
                            Total Fees
                          </span>
                          <span className="text-xs sm:text-sm font-extrabold text-slate-900">
                            {formatLakhs(item.totalFees)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-600 block">
                            Avg Package
                          </span>
                          <span className="text-xs sm:text-sm font-extrabold text-emerald-600">
                            {formatLPA(item.placementAvg)}
                          </span>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                        {/* Compare Toggle Button */}
                        <button
                          type="button"
                          onClick={() => {
                            if (isChecked) {
                              removeFromCompare(col.slug || col.id);
                            } else {
                              addToCompare({
                                id: col.slug || col.id,
                                name: col.name,
                                shortName: col.name.split(" ")[0],
                              });
                            }
                          }}
                          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                            isChecked
                              ? "bg-indigo-600 text-white shadow-xs"
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

                        {/* View College Link */}
                        <Link
                          href={`/colleges/${col.slug}`}
                          className="p-2 rounded-xl border border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title="View College Profile"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CoursesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
            <span className="w-3 h-3 rounded-full bg-indigo-600 animate-ping"></span>
            Loading Courses Catalog...
          </div>
        </div>
      }
    >
      <CoursesExplorerContent />
    </Suspense>
  );
}
