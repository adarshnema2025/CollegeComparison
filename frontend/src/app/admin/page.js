"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { adminApi, collegesApi, coursesApi } from "@/lib/api";
import {
  ShieldCheck,
  Building2,
  Users,
  Calendar,
  BookOpen,
  FileSpreadsheet,
  Plus,
  Trash2,
  Edit3,
  Star,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  LogOut,
  RefreshCw,
  Search,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  Clock,
  Layers,
  Upload,
  Download,
  ChevronDown,
} from "lucide-react";

const ADMIN_EMAIL = "admin@collegecomparison.com";

function AdminPortalContent() {
  const router = useRouter();
  const { currentUser, logoutUser, showToast, isLoadingAuth, authInitialized } = useApp();

  // Active Admin Tab
  const [activeTab, setActiveTab] = useState("colleges"); // "colleges" | "counsellors" | "import" | "counselling" | "courses" | "users"

  // Data States
  const [colleges, setColleges] = useState([]);
  const [counsellors, setCounsellors] = useState([]);
  const [users, setUsers] = useState([]);
  const [counsellingRequests, setCounsellingRequests] = useState([]);
  const [courses, setCourses] = useState([]);
  const [counsellingFilter, setCounsellingFilter] = useState("all");

  // CSV Export states
  const [counsellingExportRange, setCounsellingExportRange] = useState("all");
  const [usersExportRange, setUsersExportRange] = useState("all");
  const [isExportingCounselling, setIsExportingCounselling] = useState(false);
  const [isExportingUsers, setIsExportingUsers] = useState(false);
  const [headerExportOpen, setHeaderExportOpen] = useState(false);

  const handleDownloadExport = async (type, range) => {
    const isCounselling = type === "counselling";
    if (isCounselling) {
      setIsExportingCounselling(true);
    } else {
      setIsExportingUsers(true);
    }

    try {
      showToast(
        `Preparing ${isCounselling ? "Counselling Students" : "Registered Students"} CSV (${range})...`,
        "info"
      );
      const res = await adminApi.downloadExport(type, range);
      showToast(`Downloaded ${res.filename} successfully!`, "success");
    } catch (err) {
      showToast(err.message || "Failed to download CSV export", "warning");
    } finally {
      if (isCounselling) {
        setIsExportingCounselling(false);
      } else {
        setIsExportingUsers(false);
      }
    }
  };

  // Loading States
  const [loadingData, setLoadingData] = useState(false);

  // Search Filters
  const [collegeSearch, setCollegeSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [counsellorSearch, setCounsellorSearch] = useState("");
  const [counsellorSpecFilter, setCounsellorSpecFilter] = useState("all");
  const [counsellorActiveFilter, setCounsellorActiveFilter] = useState("all");
  const [counsellorSort, setCounsellorSort] = useState("newest");

  // Counsellor Modal
  const [isCounsellorModalOpen, setIsCounsellorModalOpen] = useState(false);
  const [editingCounsellor, setEditingCounsellor] = useState(null);
  const [counsellorFormData, setCounsellorFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    specialization: "engineering",
    isActive: true,
  });

  // Modals
  const [isCollegeModalOpen, setIsCollegeModalOpen] = useState(false);
  const [editingCollege, setEditingCollege] = useState(null);
  const [collegeFormData, setCollegeFormData] = useState({
    name: "",
    slug: "",
    category: "engineering",
    type: "government",
    city: "",
    state: "",
    ranking: 50,
    established_year: 1980,
    website: "",
    description: "",
  });

  const [isProgramModalOpen, setIsProgramModalOpen] = useState(false);
  const [targetCollegeForProgram, setTargetCollegeForProgram] = useState(null);
  const [programFormData, setProgramFormData] = useState({
    courseId: 1,
    displayName: "",
    mode: "offline",
    durationYears: 4,
    totalFees: 1000000,
    seats: 120,
    placementAvg: 2000000,
  });

  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [courseFormData, setCourseFormData] = useState({
    degree: "B.Tech",
    branch: "",
    specialization: "",
    domain: "Engineering",
  });

  // CSV Import State
  const [csvContent, setCsvContent] = useState(
    `name,degree,branch,city,state,ranking,total_fees,mode\nIndian Institute of Information Technology Lucknow,B.Tech,Computer Science & Engineering,Lucknow,Uttar Pradesh,75,950000,offline\nSymbiosis Institute of Business Management,MBA,General Management,Pune,Maharashtra,18,2200000,offline`
  );
  const [importResults, setImportResults] = useState(null);
  const [isImporting, setIsImporting] = useState(false);

  // Check if current user has admin access
  const isAdmin = useMemo(() => {
    if (currentUser?.role === "admin" || currentUser?.email === ADMIN_EMAIL) {
      return true;
    }
    if (typeof window !== "undefined") {
      try {
        const stored = JSON.parse(localStorage.getItem("cc_auth_user"));
        if (stored?.role === "admin" || stored?.email === ADMIN_EMAIL) {
          return true;
        }
      } catch (_) {}
    }
    return false;
  }, [currentUser]);

  // Load Admin Data when authenticated
  const loadAdminData = async () => {
    if (!isAdmin) return;
    setLoadingData(true);
    try {
      const [collegesRes, usersRes, counselRes, coursesRes, counsellorsRes] = await Promise.allSettled([
        collegesApi.list({ limit: 100 }),
        adminApi.getUsers(),
        adminApi.getCounselling(counsellingFilter !== "all" ? counsellingFilter : undefined),
        coursesApi.getCatalog(),
        adminApi.getCounsellors({
          sort: counsellorSort,
          specialization: counsellorSpecFilter !== "all" ? counsellorSpecFilter : undefined,
          isActive: counsellorActiveFilter !== "all" ? counsellorActiveFilter === "true" : undefined,
          q: counsellorSearch.trim() || undefined,
          limit: 100,
        }),
      ]);

      if (collegesRes.status === "fulfilled" && collegesRes.value?.data) {
        setColleges(collegesRes.value.data);
      }
      if (usersRes.status === "fulfilled" && usersRes.value?.data) {
        setUsers(usersRes.value.data);
      }
      if (counselRes.status === "fulfilled" && counselRes.value?.data) {
        setCounsellingRequests(counselRes.value.data);
      }
      if (coursesRes.status === "fulfilled" && Array.isArray(coursesRes.value)) {
        setCourses(coursesRes.value);
      }
      if (counsellorsRes.status === "fulfilled" && counsellorsRes.value?.data?.items) {
        setCounsellors(counsellorsRes.value.data.items);
      }
    } catch (err) {
      console.warn("Failed to load some admin data:", err);
    } finally {
      setLoadingData(false);
    }
  };

  // If not admin, redirect to Home (/) only AFTER auth check is fully initialized
  useEffect(() => {
    if (authInitialized && !isLoadingAuth && !isAdmin) {
      router.replace("/");
    }
  }, [authInitialized, isLoadingAuth, isAdmin, router]);

  useEffect(() => {
    if (isAdmin) {
      loadAdminData();
    }
  }, [
    isAdmin,
    counsellingFilter,
    counsellorSort,
    counsellorSpecFilter,
    counsellorActiveFilter,
    counsellorSearch,
  ]);

  // 1. College CRUD Handlers
  const handleOpenAddCollege = () => {
    setEditingCollege(null);
    setCollegeFormData({
      name: "",
      slug: "",
      category: "engineering",
      type: "government",
      city: "",
      state: "",
      ranking: 50,
      established_year: 1980,
      website: "",
      description: "",
    });
    setIsCollegeModalOpen(true);
  };

  const handleOpenEditCollege = (col) => {
    setEditingCollege(col);
    setCollegeFormData({
      name: col.name || "",
      slug: col.slug || "",
      category: col.category || "engineering",
      type: col.type || "government",
      city: col.city || "",
      state: col.state || "",
      ranking: col.ranking || col.nirfRank || 50,
      established_year: col.establishedYear || col.established_year || 1980,
      website: col.website || "",
      description: col.tagline || col.description || "",
    });
    setIsCollegeModalOpen(true);
  };

  const handleSaveCollege = async (e) => {
    e.preventDefault();
    try {
      if (editingCollege) {
        const id = editingCollege.backendId || editingCollege.id;
        await adminApi.updateCollege(id, collegeFormData);
        showToast(`Updated college ${collegeFormData.name}`, "success");
      } else {
        await adminApi.createCollege(collegeFormData);
        showToast(`Created college ${collegeFormData.name}`, "success");
      }
      setIsCollegeModalOpen(false);
      loadAdminData();
    } catch (err) {
      showToast(err.message || "Failed to save college", "error");
    }
  };

  const handleDeleteCollege = async (col) => {
    const id = col.backendId || col.id;
    if (confirm(`Are you sure you want to delete ${col.name}? This will cascade and delete its programs.`)) {
      try {
        await adminApi.deleteCollege(id);
        showToast(`Deleted ${col.name}`, "info");
        loadAdminData();
      } catch (err) {
        showToast(err.message || "Failed to delete college", "error");
      }
    }
  };

  const handleToggleFeatured = async (col) => {
    const id = col.backendId || col.id;
    const newFeatured = !col.is_featured;
    try {
      await adminApi.patchCollegeFeatured(id, { is_featured: newFeatured });
      showToast(`Updated featured status for ${col.name}`, "success");
      loadAdminData();
    } catch (err) {
      showToast(err.message || "Failed to update featured", "error");
    }
  };

  // 2. Program Add Handler
  const handleOpenAddProgram = (col) => {
    setTargetCollegeForProgram(col);
    setProgramFormData({
      courseId: 1,
      displayName: "",
      mode: "offline",
      durationYears: 4,
      totalFees: 1000000,
      seats: 120,
      placementAvg: 2000000,
    });
    setIsProgramModalOpen(true);
  };

  const handleSaveProgram = async (e) => {
    e.preventDefault();
    if (!targetCollegeForProgram) return;
    const collegeId = targetCollegeForProgram.backendId || targetCollegeForProgram.id;
    try {
      await adminApi.addProgram(collegeId, programFormData);
      showToast(`Program added to ${targetCollegeForProgram.name}`, "success");
      setIsProgramModalOpen(false);
      loadAdminData();
    } catch (err) {
      showToast(err.message || "Failed to add program", "error");
    }
  };

  // 3. Course Add Handler
  const handleSaveCourse = async (e) => {
    e.preventDefault();
    try {
      await adminApi.createCourse(courseFormData);
      showToast(`Added course: ${courseFormData.degree} in ${courseFormData.branch}`, "success");
      setIsCourseModalOpen(false);
      loadAdminData();
    } catch (err) {
      showToast(err.message || "Failed to add course", "error");
    }
  };

  // 4. Counselling Status Update
  const handleUpdateCounselling = async (reqId, status) => {
    try {
      await adminApi.patchCounsellingStatus(reqId, status);
      showToast(`Ticket status updated to ${status}`, "success");
      loadAdminData();
    } catch (err) {
      showToast(err.message || "Failed to update status", "error");
    }
  };

  // 5. Bulk CSV Import Handler
  const handleRunBulkImport = async () => {
    if (!csvContent.trim()) {
      showToast("Please provide CSV content to import", "warning");
      return;
    }
    setIsImporting(true);
    setImportResults(null);
    try {
      const res = await adminApi.importColleges({ csvData: csvContent });
      setImportResults(res);
      showToast(`Imported ${res.imported} colleges successfully!`, "success");
      loadAdminData();
    } catch (err) {
      showToast(err.message || "Bulk import failed", "error");
    } finally {
      setIsImporting(false);
    }
  };

  // 6. Counsellors Handlers
  const handleOpenAddCounsellor = () => {
    setEditingCounsellor(null);
    setCounsellorFormData({
      name: "",
      email: "",
      mobile: "",
      specialization: "engineering",
      isActive: true,
    });
    setIsCounsellorModalOpen(true);
  };

  const handleOpenEditCounsellor = (c) => {
    setEditingCounsellor(c);
    setCounsellorFormData({
      name: c.name || "",
      email: c.email || "",
      mobile: c.mobile || "",
      specialization: c.specialization || "",
      isActive: c.isActive !== false,
    });
    setIsCounsellorModalOpen(true);
  };

  const handleToggleCounsellorActive = async (c) => {
    try {
      await adminApi.updateCounsellor(c.id, { isActive: !c.isActive });
      showToast(
        `Counsellor ${c.name} is now ${!c.isActive ? "Active" : "Inactive"}`,
        "success"
      );
      loadAdminData();
    } catch (err) {
      showToast(err.message || "Failed to update counsellor", "error");
    }
  };

  const handleSaveCounsellor = async (e) => {
    e.preventDefault();
    try {
      if (editingCounsellor) {
        await adminApi.updateCounsellor(editingCounsellor.id, {
          name: counsellorFormData.name,
          email: counsellorFormData.email,
          mobile: counsellorFormData.mobile || null,
          specialization: counsellorFormData.specialization || null,
          isActive: counsellorFormData.isActive,
        });
        showToast(`Counsellor ${counsellorFormData.name} updated successfully!`, "success");
      } else {
        await adminApi.createCounsellor({
          name: counsellorFormData.name,
          email: counsellorFormData.email,
          mobile: counsellorFormData.mobile || null,
          specialization: counsellorFormData.specialization || null,
          isActive: counsellorFormData.isActive,
        });
        showToast(
          `Counsellor ${counsellorFormData.name} created! Available slots auto-generated.`,
          "success"
        );
      }
      setIsCounsellorModalOpen(false);
      loadAdminData();
    } catch (err) {
      showToast(err.message || "Failed to save counsellor", "error");
    }
  };

  // Filtered Lists
  const filteredColleges = useMemo(() => {
    if (!collegeSearch.trim()) return colleges;
    const q = collegeSearch.toLowerCase();
    return colleges.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.city && c.city.toLowerCase().includes(q)) ||
        (c.state && c.state.toLowerCase().includes(q))
    );
  }, [colleges, collegeSearch]);

  const filteredUsers = useMemo(() => {
    if (!userSearch.trim()) return users;
    const q = userSearch.toLowerCase();
    return users.filter(
      (u) =>
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.mobile?.includes(q)
    );
  }, [users, userSearch]);

  // =========================================================================
  // VIEW 1: NOT LOGGED IN AS ADMIN -> REDIRECT IMMEDIATELY TO HOME
  // =========================================================================
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: AUTHENTICATED ADMIN DASHBOARD
  // =========================================================================
  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      {/* 1. TOP NAV & SWITCH BAR */}
      <header className="bg-slate-950 text-white border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center font-black">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-base tracking-tight text-white">
                  Admin Command Shield
                </span>
                <span className="px-2 py-0.2 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-500 text-white">
                  Tier S
                </span>
              </div>
              <span className="text-[11px] text-slate-400 block -mt-0.5">
                Logged in as <b className="text-rose-300">{currentUser?.email}</b>
              </span>
            </div>
          </div>

          {/* Quick Switch Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick CSV Exports Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setHeaderExportOpen((prev) => !prev)}
                className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="Download CSV Reports"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden md:inline">Download CSV</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {headerExportOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-3 z-50 space-y-3 text-xs animate-fade-in">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="font-extrabold text-white text-xs flex items-center gap-1.5">
                      <Download className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Download Student Data (CSV)</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setHeaderExportOpen(false)}
                      className="text-slate-400 hover:text-white font-bold p-1 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Export 1: Counselling */}
                  <div className="p-3 rounded-xl bg-slate-800/90 border border-slate-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-emerald-400 font-extrabold">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>1. Counselling Registrations</span>
                      </div>
                      <span className="text-[10px] text-slate-400">Tickets & Slots</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={counsellingExportRange}
                        onChange={(e) => setCounsellingExportRange(e.target.value)}
                        className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs font-semibold outline-none"
                      >
                        <option value="1d">Last 1 Day</option>
                        <option value="3d">Last 3 Days</option>
                        <option value="7d">Last 7 Days</option>
                        <option value="all">All Time</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          handleDownloadExport("counselling", counsellingExportRange);
                          setHeaderExportOpen(false);
                        }}
                        disabled={isExportingCounselling}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition-all"
                      >
                        <Download className={`w-3.5 h-3.5 ${isExportingCounselling ? "animate-bounce" : ""}`} />
                        <span>{isExportingCounselling ? "..." : "Export"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Export 2: Registered Students */}
                  <div className="p-3 rounded-xl bg-slate-800/90 border border-slate-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-indigo-400 font-extrabold">
                        <Users className="w-3.5 h-3.5" />
                        <span>2. Registered Students</span>
                      </div>
                      <span className="text-[10px] text-slate-400">Student Profiles</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={usersExportRange}
                        onChange={(e) => setUsersExportRange(e.target.value)}
                        className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs font-semibold outline-none"
                      >
                        <option value="1d">Last 1 Day</option>
                        <option value="3d">Last 3 Days</option>
                        <option value="7d">Last 7 Days</option>
                        <option value="all">All Time</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          handleDownloadExport("users", usersExportRange);
                          setHeaderExportOpen(false);
                        }}
                        disabled={isExportingUsers}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition-all"
                      >
                        <Download className={`w-3.5 h-3.5 ${isExportingUsers ? "animate-bounce" : ""}`} />
                        <span>{isExportingUsers ? "..." : "Export"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Link
              href="/colleges"
              className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-white text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Switch to Student Portal</span>
              <span className="sm:hidden">Student</span>
            </Link>

            <button
              onClick={() => {
                logoutUser();
                showToast("Logged out of Admin Portal", "info");
              }}
              className="px-3 py-1.5 rounded-xl border border-rose-900/50 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* 2. SUB NAV TABS */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800/80 flex items-center gap-1 overflow-x-auto scrollbar-none py-2">
          {[
            { id: "colleges", label: "Colleges Directory", icon: Building2, count: colleges.length },
            { id: "counsellors", label: "Counsellors & Mentors", icon: Sparkles, count: counsellors.length },
            { id: "import", label: "Bulk CSV Importer", icon: FileSpreadsheet },
            { id: "counselling", label: "Counselling Requests", icon: Calendar, count: counsellingRequests.length },
            { id: "courses", label: "Course Catalog", icon: BookOpen },
            { id: "users", label: "Registered Users", icon: Users, count: users.length },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? "bg-rose-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-white hover:bg-slate-900"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                      isActive ? "bg-rose-800 text-white" : "bg-slate-800 text-slate-300"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* 3. MAIN DASHBOARD CONTENT */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* ================================================================= */}
        {/* TAB 1: COLLEGES & PROGRAMS MANAGEMENT */}
        {/* ================================================================= */}
        {activeTab === "colleges" && (
          <div className="space-y-4">
            {/* Top Toolbar */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={collegeSearch}
                  onChange={(e) => setCollegeSearch(e.target.value)}
                  placeholder="Search college, city, state..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-indigo-600 bg-slate-50"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={loadAdminData}
                  className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                  title="Refresh"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingData ? "animate-spin" : ""}`} />
                </button>
                <button
                  onClick={handleOpenAddCollege}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create College</span>
                </button>
              </div>
            </div>

            {/* Colleges Table */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-extrabold uppercase border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Rank</th>
                      <th className="py-3 px-4">College Name</th>
                      <th className="py-3 px-4">Location</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Featured</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {filteredColleges.map((col) => {
                      return (
                        <tr key={col.slug || col.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-black text-slate-900">
                            #{col.ranking || col.nirfRank || "-"}
                          </td>
                          <td className="py-3 px-4 font-extrabold text-slate-900">
                            <Link
                              href={`/colleges/${col.slug}`}
                              target="_blank"
                              className="hover:text-indigo-600 flex items-center gap-1"
                            >
                              <span>{col.name}</span>
                              <ExternalLink className="w-3 h-3 text-slate-400" />
                            </Link>
                          </td>
                          <td className="py-3 px-4 text-slate-500">
                            {col.city}, {col.state}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                              {col.category || "engineering"}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <button
                              onClick={() => handleToggleFeatured(col)}
                              className={`p-1 rounded-lg transition-colors cursor-pointer ${
                                col.is_featured
                                  ? "text-amber-500 hover:text-amber-600 bg-amber-50"
                                  : "text-slate-300 hover:text-slate-500"
                              }`}
                              title={col.is_featured ? "Featured (Click to disable)" : "Not featured (Click to enable)"}
                            >
                              <Star className="w-4 h-4 fill-current" />
                            </button>
                          </td>
                          <td className="py-3 px-4 text-right space-x-1">
                            <button
                              onClick={() => handleOpenAddProgram(col)}
                              className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-[11px] transition-colors cursor-pointer"
                              title="Add Program"
                            >
                              + Program
                            </button>
                            <button
                              onClick={() => handleOpenEditCollege(col)}
                              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-indigo-600 cursor-pointer"
                              title="Edit College"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteCollege(col)}
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer"
                              title="Delete College"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB: COUNSELLORS & MENTORS MANAGEMENT */}
        {/* ================================================================= */}
        {activeTab === "counsellors" && (
          <div className="space-y-4">
            {/* Top Toolbar */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto flex-1">
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={counsellorSearch}
                    onChange={(e) => setCounsellorSearch(e.target.value)}
                    placeholder="Search counsellor by name/email..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-indigo-600 bg-slate-50"
                  />
                </div>

                {/* Specialization Filter */}
                <select
                  value={counsellorSpecFilter}
                  onChange={(e) => setCounsellorSpecFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-slate-50 outline-none"
                >
                  <option value="all">All Specializations</option>
                  <option value="engineering">Engineering</option>
                  <option value="management">Management</option>
                  <option value="medical">Medical</option>
                </select>

                {/* Active Filter */}
                <select
                  value={counsellorActiveFilter}
                  onChange={(e) => setCounsellorActiveFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-slate-50 outline-none"
                >
                  <option value="all">All Status</option>
                  <option value="true">Active Only</option>
                  <option value="false">Inactive Only</option>
                </select>

                {/* Sort */}
                <select
                  value={counsellorSort}
                  onChange={(e) => setCounsellorSort(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-slate-50 outline-none"
                >
                  <option value="newest">Sort: Newest</option>
                  <option value="name">Sort: Name (A-Z)</option>
                  <option value="load">Sort: Least Loaded</option>
                </select>
              </div>

              <button
                onClick={handleOpenAddCounsellor}
                className="w-full md:w-auto px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add Counsellor</span>
              </button>
            </div>

            {/* Counsellors List Table */}
            {counsellors.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs space-y-2">
                <Sparkles className="w-8 h-8 mx-auto text-slate-300" />
                <p className="font-bold text-slate-700">No counsellors found.</p>
                <p>Click &quot;Add Counsellor&quot; above to create a new advisor profile.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-600 font-extrabold uppercase border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">Counsellor</th>
                        <th className="py-3 px-4">Contact</th>
                        <th className="py-3 px-4">Specialization</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-center">Upcoming Bookings</th>
                        <th className="py-3 px-4 text-center">Open Slots</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {counsellors.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-extrabold flex items-center justify-center text-xs shrink-0">
                                {c.name?.slice(0, 2).toUpperCase() || "CN"}
                              </div>
                              <div>
                                <p className="font-extrabold text-slate-900">{c.name}</p>
                                <span className="text-[11px] text-slate-400">ID: #{c.id}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-semibold text-slate-800">{c.email}</p>
                            <p className="text-slate-400 text-[11px]">{c.mobile || "No mobile"}</p>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                                c.specialization === "engineering"
                                  ? "bg-indigo-100 text-indigo-800 border border-indigo-200"
                                  : c.specialization === "management"
                                  ? "bg-amber-100 text-amber-800 border border-amber-200"
                                  : c.specialization === "medical"
                                  ? "bg-teal-100 text-teal-800 border border-teal-200"
                                  : "bg-slate-100 text-slate-700 border border-slate-200"
                              }`}
                            >
                              {c.specialization || "Generalist"}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <button
                              type="button"
                              onClick={() => handleToggleCounsellorActive(c)}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold cursor-pointer border transition-colors ${
                                c.isActive
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                                  : "bg-slate-100 text-slate-500 border-slate-300 hover:bg-slate-200"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  c.isActive ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                                }`}
                              />
                              <span>{c.isActive ? "Active" : "Inactive"}</span>
                            </button>
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-slate-900">
                            <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-extrabold text-xs">
                              {c.upcomingBookings || 0}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-slate-900">
                            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-extrabold text-xs">
                              {c.openSlots || 0}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenEditCounsellor(c)}
                                className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <Edit3 className="w-3 h-3 text-slate-500" />
                                <span>Edit</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 2: BULK CSV IMPORTER */}
        {/* ================================================================= */}
        {activeTab === "import" && (
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-black text-slate-900">Bulk CSV Upload Engine</h2>
              </div>
              <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
                Bulk upload colleges & programs in an atomic transaction. If course names are
                found in the catalog, they are mapped automatically.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono text-slate-700">
              <span className="font-bold text-slate-900 block mb-1">Expected CSV Headers:</span>
              <code>name,degree,branch,city,state,ranking,total_fees,mode</code>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Paste CSV Data
              </label>
              <textarea
                rows={8}
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
                className="w-full p-3 font-mono text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-slate-900 bg-slate-50"
              />
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={handleRunBulkImport}
                disabled={isImporting}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>{isImporting ? "Processing Bulk Import..." : "Import Colleges (POST /admin/colleges/import)"}</span>
              </button>
            </div>

            {importResults && (
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-extrabold text-slate-900">Import Report:</span>
                  <span className="text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-md">
                    ✓ {importResults.imported} Imported
                  </span>
                  {importResults.failed > 0 && (
                    <span className="text-rose-700 font-bold bg-rose-100 px-2 py-0.5 rounded-md">
                      ✗ {importResults.failed} Failed
                    </span>
                  )}
                </div>
                {importResults.errors && importResults.errors.length > 0 && (
                  <div className="space-y-1 pt-2 border-t border-slate-200">
                    {importResults.errors.map((err, i) => (
                      <p key={i} className="text-rose-600 font-medium">
                        Row {err.row}: {err.name} — {err.error}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 3: COUNSELLING REQUESTS DESK */}
        {/* ================================================================= */}
        {activeTab === "counselling" && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-600" />
                <h2 className="font-extrabold text-slate-900 text-sm">Counselling Tickets</h2>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-500 font-bold">Status:</span>
                  {["all", "pending", "contacted", "closed"].map((st) => (
                    <button
                      key={st}
                      onClick={() => setCounsellingFilter(st)}
                      className={`px-2.5 py-1 rounded-lg font-bold capitalize transition-all cursor-pointer ${
                        counsellingFilter === st
                          ? "bg-slate-900 text-white shadow-xs"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                {/* CSV Download Section */}
                <div className="flex items-center gap-1.5 pl-0 md:pl-3 border-t md:border-t-0 md:border-l border-slate-200 pt-2 md:pt-0 w-full md:w-auto justify-end">
                  <select
                    value={counsellingExportRange}
                    onChange={(e) => setCounsellingExportRange(e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl border border-slate-300 text-slate-700 bg-slate-50 text-xs font-semibold outline-none cursor-pointer"
                  >
                    <option value="1d">Last 1 Day</option>
                    <option value="3d">Last 3 Days</option>
                    <option value="7d">Last 7 Days</option>
                    <option value="all">All Time</option>
                  </select>

                  <button
                    onClick={() => handleDownloadExport("counselling", counsellingExportRange)}
                    disabled={isExportingCounselling}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                    title="Download students registered for counselling in CSV format"
                  >
                    <Download className={`w-3.5 h-3.5 ${isExportingCounselling ? "animate-bounce" : ""}`} />
                    <span>{isExportingCounselling ? "Exporting..." : "Download CSV"}</span>
                  </button>
                </div>
              </div>
            </div>

            {counsellingRequests.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
                No counselling tickets found for this filter.
              </div>
            ) : (
              <div className="space-y-3">
                {counsellingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-xs text-slate-900">Ticket #{req.id}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            req.status === "pending"
                              ? "bg-amber-100 text-amber-800"
                              : req.status === "contacted"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {req.status}
                        </span>
                        <span className="text-xs text-slate-400">
                          {new Date(req.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-700">
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          {req.user?.name || "Student"} ({req.user?.email || "No email"})
                        </span>
                        <span className="flex items-center gap-1 text-indigo-700">
                          <Phone className="w-3.5 h-3.5" />
                          {req.mobile}
                        </span>
                        {req.preferredSlot && (
                          <span className="flex items-center gap-1 text-emerald-700">
                            <Clock className="w-3.5 h-3.5" />
                            Slot: {new Date(req.preferredSlot).toLocaleString()}
                          </span>
                        )}
                      </div>

                      {req.message && (
                        <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 mt-2">
                          &ldquo;{req.message}&rdquo;
                        </p>
                      )}
                    </div>

                    {/* Status change action buttons */}
                    <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                      {req.status === "pending" && (
                        <button
                          onClick={() => handleUpdateCounselling(req.id, "contacted")}
                          className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all cursor-pointer"
                        >
                          Mark Contacted
                        </button>
                      )}
                      {req.status !== "closed" && (
                        <button
                          onClick={() => handleUpdateCounselling(req.id, "closed")}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-all cursor-pointer"
                        >
                          Close Ticket
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 4: COURSES CATALOG */}
        {/* ================================================================= */}
        {activeTab === "courses" && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                <h2 className="font-extrabold text-slate-900 text-sm">Academic Catalog Management</h2>
              </div>
              <button
                onClick={() => setIsCourseModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Course (POST /admin/courses)</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {courses.map((grp) => (
                <div key={grp.degree} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="font-black text-slate-900 text-base">{grp.degree}</span>
                    <span className="text-xs text-slate-400 font-bold">
                      {grp.branches?.length} Branches
                    </span>
                  </div>
                  <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                    {grp.branches?.map((b) => (
                      <div
                        key={b.branch}
                        className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs flex items-center justify-between"
                      >
                        <span className="font-semibold text-slate-800">{b.branch}</span>
                        <span className="text-[10px] text-slate-400">
                          {b.courses?.length || 1} course variants
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 5: REGISTERED USERS DIRECTORY */}
        {/* ================================================================= */}
        {activeTab === "users" && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Filter student by name or email..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-indigo-600 bg-slate-50"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
                {/* CSV Download Section */}
                <div className="flex items-center gap-1.5">
                  <select
                    value={usersExportRange}
                    onChange={(e) => setUsersExportRange(e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl border border-slate-300 text-slate-700 bg-slate-50 text-xs font-semibold outline-none cursor-pointer"
                  >
                    <option value="1d">Last 1 Day</option>
                    <option value="3d">Last 3 Days</option>
                    <option value="7d">Last 7 Days</option>
                    <option value="all">All Time</option>
                  </select>

                  <button
                    onClick={() => handleDownloadExport("users", usersExportRange)}
                    disabled={isExportingUsers}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                    title="Download registered students in CSV format"
                  >
                    <Download className={`w-3.5 h-3.5 ${isExportingUsers ? "animate-bounce" : ""}`} />
                    <span>{isExportingUsers ? "Exporting..." : "Download CSV"}</span>
                  </button>
                </div>

                <span className="text-xs font-bold text-slate-500 pl-2 border-l border-slate-200">
                  Total: {filteredUsers.length} Users
                </span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-extrabold uppercase border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4">Mobile</th>
                      <th className="py-3 px-4">Target Degree</th>
                      <th className="py-3 px-4">Education Level</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Registered</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-extrabold text-slate-900">{u.name}</p>
                          <p className="text-slate-500 text-[11px]">{u.email}</p>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{u.mobile || "-"}</td>
                        <td className="py-3 px-4">{u.target_degree || "-"}</td>
                        <td className="py-3 px-4 text-slate-500">{u.education_level || "-"}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              u.role === "admin"
                                ? "bg-rose-100 text-rose-800 border border-rose-200"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {u.role || "user"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400">
                          {u.created_at ? new Date(u.created_at).toLocaleDateString() : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* =================================================================== */}
      {/* MODAL 1: ADD / EDIT COLLEGE */}
      {/* =================================================================== */}
      {isCollegeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-lg text-slate-900">
                {editingCollege ? "Edit College (PUT /admin/colleges/:id)" : "Create College (POST /admin/colleges)"}
              </h3>
              <button
                onClick={() => setIsCollegeModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCollege} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">College Name</label>
                <input
                  type="text"
                  value={collegeFormData.name}
                  onChange={(e) => setCollegeFormData({ ...collegeFormData, name: e.target.value })}
                  placeholder="e.g. Indian Institute of Technology Kharagpur"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={collegeFormData.category}
                    onChange={(e) => setCollegeFormData({ ...collegeFormData, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-medium"
                  >
                    <option value="engineering">Engineering</option>
                    <option value="management">Management</option>
                    <option value="medical">Medical</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ownership Type</label>
                  <select
                    value={collegeFormData.type}
                    onChange={(e) => setCollegeFormData({ ...collegeFormData, type: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-medium"
                  >
                    <option value="government">Government</option>
                    <option value="private">Private</option>
                    <option value="deemed">Deemed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={collegeFormData.city}
                    onChange={(e) => setCollegeFormData({ ...collegeFormData, city: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">State</label>
                  <input
                    type="text"
                    value={collegeFormData.state}
                    onChange={(e) => setCollegeFormData({ ...collegeFormData, state: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-medium"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">NIRF Ranking</label>
                  <input
                    type="number"
                    value={collegeFormData.ranking}
                    onChange={(e) => setCollegeFormData({ ...collegeFormData, ranking: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Established Year</label>
                  <input
                    type="number"
                    value={collegeFormData.established_year}
                    onChange={(e) => setCollegeFormData({ ...collegeFormData, established_year: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Website URL</label>
                <input
                  type="url"
                  value={collegeFormData.website}
                  onChange={(e) => setCollegeFormData({ ...collegeFormData, website: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tagline / Description</label>
                <textarea
                  rows={2}
                  value={collegeFormData.description}
                  onChange={(e) => setCollegeFormData({ ...collegeFormData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-medium"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCollegeModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-md cursor-pointer"
                >
                  {editingCollege ? "Update College" : "Create College"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 2: ADD PROGRAM TO COLLEGE */}
      {/* =================================================================== */}
      {isProgramModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-base text-slate-900">Add Program to College</h3>
                <p className="text-[11px] text-slate-500">{targetCollegeForProgram?.name}</p>
              </div>
              <button
                onClick={() => setIsProgramModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProgram} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Catalog Course ID</label>
                <select
                  value={programFormData.courseId}
                  onChange={(e) => setProgramFormData({ ...programFormData, courseId: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-medium"
                >
                  <option value={1}>1 - B.Tech CSE</option>
                  <option value={2}>2 - B.Tech CSE (AIML)</option>
                  <option value={3}>3 - B.Tech CSE (Data Science)</option>
                  <option value={11}>11 - B.Tech Electrical Engineering</option>
                  <option value={12}>12 - B.Tech Mechanical Engineering</option>
                  <option value={25}>25 - MBA General Management</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Display Name</label>
                <input
                  type="text"
                  value={programFormData.displayName}
                  onChange={(e) => setProgramFormData({ ...programFormData, displayName: e.target.value })}
                  placeholder="e.g. B.Tech in Computer Science and Engineering"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mode</label>
                  <select
                    value={programFormData.mode}
                    onChange={(e) => setProgramFormData({ ...programFormData, mode: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-medium"
                  >
                    <option value="offline">Offline</option>
                    <option value="online">Online</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Duration (Years)</label>
                  <input
                    type="number"
                    value={programFormData.durationYears}
                    onChange={(e) => setProgramFormData({ ...programFormData, durationYears: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-medium"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Total Fees (₹)</label>
                  <input
                    type="number"
                    value={programFormData.totalFees}
                    onChange={(e) => setProgramFormData({ ...programFormData, totalFees: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Average Package (₹)</label>
                  <input
                    type="number"
                    value={programFormData.placementAvg}
                    onChange={(e) => setProgramFormData({ ...programFormData, placementAvg: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-medium"
                    required
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsProgramModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md cursor-pointer"
                >
                  Add Program (POST /programs)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 3: ADD COURSE TO CATALOG */}
      {/* =================================================================== */}
      {isCourseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-base text-slate-900">Add Course to Catalog</h3>
              <button
                onClick={() => setIsCourseModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCourse} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Degree</label>
                <input
                  type="text"
                  value={courseFormData.degree}
                  onChange={(e) => setCourseFormData({ ...courseFormData, degree: e.target.value })}
                  placeholder="e.g. B.Tech, M.Tech, MBA"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Branch Name</label>
                <input
                  type="text"
                  value={courseFormData.branch}
                  onChange={(e) => setCourseFormData({ ...courseFormData, branch: e.target.value })}
                  placeholder="e.g. Artificial Intelligence & Robotics"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Specialization (Optional)</label>
                <input
                  type="text"
                  value={courseFormData.specialization}
                  onChange={(e) => setCourseFormData({ ...courseFormData, specialization: e.target.value })}
                  placeholder="e.g. Autonomous Drones"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Domain</label>
                <input
                  type="text"
                  value={courseFormData.domain}
                  onChange={(e) => setCourseFormData({ ...courseFormData, domain: e.target.value })}
                  placeholder="e.g. AI/Data, Technology, Management"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-medium"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCourseModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-md cursor-pointer"
                >
                  Add Course (POST /admin/courses)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* =================================================================== */}
      {/* MODAL 4: ADD / EDIT COUNSELLOR */}
      {/* =================================================================== */}
      {isCounsellorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-lg text-slate-900">
                {editingCounsellor
                  ? "Edit Counsellor (PATCH /admin/counsellors/:id)"
                  : "Add Counsellor (POST /admin/counsellors)"}
              </h3>
              <button
                onClick={() => setIsCounsellorModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCounsellor} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={counsellorFormData.name}
                  onChange={(e) =>
                    setCounsellorFormData({ ...counsellorFormData, name: e.target.value })
                  }
                  placeholder="e.g. Dr. Priya Sundaram"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-medium outline-none focus:border-indigo-600"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  value={counsellorFormData.email}
                  onChange={(e) =>
                    setCounsellorFormData({ ...counsellorFormData, email: e.target.value })
                  }
                  placeholder="e.g. priya@collegecomparison.com"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-medium outline-none focus:border-indigo-600"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Mobile Number (Optional)
                </label>
                <input
                  type="tel"
                  value={counsellorFormData.mobile}
                  onChange={(e) =>
                    setCounsellorFormData({ ...counsellorFormData, mobile: e.target.value })
                  }
                  placeholder="e.g. 9876543210"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-medium outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Specialization Stream
                </label>
                <select
                  value={counsellorFormData.specialization}
                  onChange={(e) =>
                    setCounsellorFormData({
                      ...counsellorFormData,
                      specialization: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-medium outline-none focus:border-indigo-600"
                >
                  <option value="">Generalist (Matches all colleges)</option>
                  <option value="engineering">Engineering</option>
                  <option value="management">Management</option>
                  <option value="medical">Medical</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Matches college category for prioritized student mentorship allocation.
                </p>
              </div>

              <div className="pt-1 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="counsellorIsActive"
                  checked={counsellorFormData.isActive}
                  onChange={(e) =>
                    setCounsellorFormData({ ...counsellorFormData, isActive: e.target.checked })
                  }
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <label
                  htmlFor="counsellorIsActive"
                  className="font-bold text-slate-700 cursor-pointer"
                >
                  Active (Receives bookings and open slots)
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCounsellorModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold cursor-pointer"
                >
                  {editingCounsellor ? "Save Changes" : "Create Counsellor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-8">
          <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
            <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping"></span>
            Loading Admin Shield...
          </div>
        </div>
      }
    >
      <AdminPortalContent />
    </Suspense>
  );
}
