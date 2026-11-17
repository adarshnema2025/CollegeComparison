"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { COLLEGES } from "@/data/colleges";
import {
  User,
  Scale,
  Calendar,
  Settings,
  Bookmark,
  Trash2,
  ExternalLink,
  Video,
  CheckCircle2,
  Clock,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  Save,
  LogOut,
  FileText,
  Phone,
  Mail,
  GraduationCap,
  Building2,
  XCircle,
} from "lucide-react";

export default function StudentDashboardPage() {
  const router = useRouter();
  const {
    currentUser,
    setCurrentUser,
    openAuthModal,
    logoutUser,
    openCounsellingModal,
    showToast,
    updateUserProfile,
    deleteComparison,
    backendComparisons,
    backendConsultations,
    backendBookings,
    cancelBookingSession,
  } = useApp();

  // Left Nav Tabs: "saved" | "consultations" | "settings"
  const [activeTab, setActiveTab] = useState("saved");

  // Local Comparisons State
  const [localSavedComparisons, setLocalSavedComparisons] = useState([
    {
      id: "sc-1",
      collegeA: COLLEGES.find((c) => c.id === "iit-bombay") || COLLEGES[0],
      collegeB: COLLEGES.find((c) => c.id === "iit-delhi") || COLLEGES[1],
      programA: "B.Tech Computer Science & Engineering",
      programB: "B.Tech Computer Science & Engineering",
      dateSaved: "Saved on Nov 2, 2024",
      link: "/compare?c1=iit-bombay&c2=iit-delhi",
    },
    {
      id: "sc-2",
      collegeA: COLLEGES.find((c) => c.id === "bits-pilani") || COLLEGES[3],
      collegeB: COLLEGES.find((c) => c.id === "iiit-hyderabad") || COLLEGES[4],
      programA: "B.E. (Hons) Computer Science",
      programB: "B.Tech Computer Science & Engineering",
      dateSaved: "Saved on Nov 1, 2024",
      link: "/compare?c1=bits-pilani&c2=iiit-hyderabad",
    },
  ]);

  // Merge Live Backend Comparisons with Local Prototypes
  const displayComparisons = useMemo(() => {
    const liveItems = (backendComparisons || []).map((item) => {
      const pA = item.programA;
      const pB = item.programB;
      const colA =
        COLLEGES.find((c) => c.slug === pA?.college?.slug || c.id === pA?.college?.slug) || {
          id: pA?.college?.slug || "iit-delhi",
          shortName: pA?.college?.name?.split(" ").slice(-2).join(" ") || "College A",
          avatarBg: "bg-indigo-700 text-white",
          logoText: (pA?.college?.name || "CA").slice(0, 3).toUpperCase(),
          nirfRank: "Top 5",
          stats: { medianSalary: "₹25.0 LPA" },
        };
      const colB =
        COLLEGES.find((c) => c.slug === pB?.college?.slug || c.id === pB?.college?.slug) || {
          id: pB?.college?.slug || "bits-pilani",
          shortName: pB?.college?.name?.split(" ").slice(-2).join(" ") || "College B",
          avatarBg: "bg-slate-800 text-white",
          logoText: (pB?.college?.name || "CB").slice(0, 3).toUpperCase(),
          nirfRank: "Top 20",
          stats: { medianSalary: "₹18.0 LPA" },
        };

      return {
        id: `backend-${item.id}`,
        rawId: item.id,
        isBackend: true,
        collegeA: colA,
        collegeB: colB,
        programA: pA?.displayName || `${pA?.degree || "B.Tech"} ${pA?.branch || "CSE"}`,
        programB: pB?.displayName || `${pB?.degree || "B.Tech"} ${pB?.branch || "CSE"}`,
        dateSaved: item.createdAt
          ? `Saved on ${new Date(item.createdAt).toLocaleDateString("en-IN", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}`
          : "Saved in Database",
        link: `/compare?c1=${colA.id}&c2=${colB.id}`,
      };
    });

    return [...liveItems, ...localSavedComparisons];
  }, [backendComparisons, localSavedComparisons]);

  // Local Consultations State
  const [localConsultations, setLocalConsultations] = useState([
    {
      id: "cons-1",
      status: "Pending",
      statusClass: "bg-amber-50 text-amber-800 border-amber-300",
      dotClass: "bg-amber-500",
      slotDateTime: "Tomorrow, Nov 5 • 05:30 PM - 06:00 PM IST",
      linkedComparison: "IIT Bombay vs IIT Delhi (B.Tech CSE)",
      linkedUrl: "/compare?c1=iit-bombay&c2=iit-delhi",
      counsellor: "Dr. Arvind Subramanian",
      counsellorRole: "Senior Ex-IIT Admissions Advisor",
      meetLink: "https://meet.google.com/cc-iitb-delhi-789",
      notes: "Need guidance on whether Powai fintech culture outweighs Hauz Khas startup advantages.",
    },
    {
      id: "cons-2",
      status: "Contacted",
      statusClass: "bg-blue-50 text-blue-800 border-blue-300",
      dotClass: "bg-blue-500",
      slotDateTime: "Nov 2, 2024 • 04:00 PM - 04:30 PM IST",
      linkedComparison: "BITS Pilani vs IIIT Hyderabad",
      linkedUrl: "/compare?c1=bits-pilani&c2=iiit-hyderabad",
      counsellor: "Vikram Rathore",
      counsellorRole: "BITS Pilani Career Mentor",
      meetLink: "https://meet.google.com/cc-bits-iiit-412",
      notes: "Call completed. Summary roadmap and placement stats sent to student WhatsApp.",
    },
    {
      id: "cons-3",
      status: "Closed",
      statusClass: "bg-emerald-50 text-emerald-800 border-emerald-300",
      dotClass: "bg-emerald-500",
      slotDateTime: "Oct 28, 2024 • 06:00 PM - 06:30 PM IST",
      linkedComparison: "JoSAA Round 1 Mock Choice Filling Priority Order",
      linkedUrl: "/colleges",
      counsellor: "Pooja Malhotra",
      counsellorRole: "Former IIM Calcutta Admissions Strategist",
      meetLink: null,
      notes: "Preference order locked and submitted. Student opted for Tier-1 Tech over Core.",
    },
  ]);

  // Merge Live Backend Bookings + Consultations + Fallback
  const displayConsultations = useMemo(() => {
    // 1. Live Slot Bookings (from /counselling/bookings/me)
    const liveBookings = (backendBookings || []).map((b) => {
      const isConfirmed = b.status?.toLowerCase() === "confirmed";
      const isCancelled = b.status?.toLowerCase() === "cancelled";

      const statusMap = isCancelled
        ? {
            label: "Cancelled",
            statusClass: "bg-red-50 text-red-800 border-red-300",
            dotClass: "bg-red-500",
          }
        : b.isUpcoming
        ? {
            label: "Confirmed (Upcoming)",
            statusClass: "bg-emerald-50 text-emerald-800 border-emerald-300",
            dotClass: "bg-emerald-500",
          }
        : {
            label: "Completed",
            statusClass: "bg-slate-100 text-slate-800 border-slate-300",
            dotClass: "bg-slate-500",
          };

      let slotTimeFormatted = "Confirmed Slot";
      if (b.slotStart) {
        try {
          const dStart = new Date(b.slotStart);
          const dEnd = new Date(b.slotEnd);
          const datePart = dStart.toLocaleDateString("en-IN", {
            weekday: "short",
            month: "short",
            day: "numeric",
            timeZone: "Asia/Calcutta",
          });
          const startPart = dStart.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "Asia/Calcutta",
          });
          const endPart = dEnd.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "Asia/Calcutta",
          });
          slotTimeFormatted = `${datePart} • ${startPart} - ${endPart} IST`;
        } catch (_) {}
      }

      return {
        id: `backend-booking-${b.id}`,
        rawBookingId: b.id,
        isBooking: true,
        isBackend: true,
        canCancel: isConfirmed && b.isUpcoming,
        status: statusMap.label,
        statusClass: statusMap.statusClass,
        dotClass: statusMap.dotClass,
        slotDateTime: slotTimeFormatted,
        linkedComparison: b.comparisonId ? `Comparison #${b.comparisonId}` : (b.message || "1-on-1 Strategy Call"),
        linkedUrl: b.comparisonId ? `/compare` : "/colleges",
        counsellor: b.counsellor?.name || "Assigned Counsellor",
        counsellorRole: "Verified Admissions Mentor",
        meetLink: isConfirmed ? `https://meet.google.com/cc-consult-${b.id}` : null,
        notes: b.message || "Live slot booking confirmed in database.",
      };
    });

    // 2. Legacy counselling requests
    const liveItems = (backendConsultations || []).map((item) => {
      const statusMap = {
        pending: {
          label: "Pending",
          statusClass: "bg-amber-50 text-amber-800 border-amber-300",
          dotClass: "bg-amber-500",
        },
        contacted: {
          label: "Contacted",
          statusClass: "bg-blue-50 text-blue-800 border-blue-300",
          dotClass: "bg-blue-500",
        },
        closed: {
          label: "Closed",
          statusClass: "bg-emerald-50 text-emerald-800 border-emerald-300",
          dotClass: "bg-emerald-500",
        },
      };

      const st = statusMap[item.status?.toLowerCase()] || statusMap.pending;
      const slotTime = item.preferredSlot
        ? new Date(item.preferredSlot).toLocaleString("en-IN", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }) + " IST"
        : "Upcoming Confirmed Slot";

      const attachedColleges =
        item.colleges?.length > 0
          ? item.colleges.map((c) => c.name).join(" vs ")
          : item.message?.split("-")[0] || "Head-to-Head College Strategy";

      return {
        id: `backend-cons-${item.id}`,
        rawId: item.id,
        isBackend: true,
        canCancel: false,
        status: st.label,
        statusClass: st.statusClass,
        dotClass: st.dotClass,
        slotDateTime: slotTime,
        linkedComparison: attachedColleges,
        linkedUrl: "/compare",
        counsellor: "Senior Admissions Mentor",
        counsellorRole: "Ex-IIT/IIM Admissions Mentor",
        meetLink: `https://meet.google.com/cc-live-${item.id}`,
        notes: item.message || "Session recorded in live database.",
      };
    });

    return [...liveBookings, ...liveItems, ...localConsultations];
  }, [backendBookings, backendConsultations, localConsultations]);

  if (!currentUser) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 bg-white rounded-2xl border border-slate-200 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mx-auto">
            <User className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">Sign in to Student Dashboard</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Please log in to manage your saved comparisons, consultations, and profile preferences.
          </p>
          <button
            onClick={() => openAuthModal("login")}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow transition-all cursor-pointer"
          >
            Sign In / Instant Demo Login
          </button>
        </div>
      </div>
    );
  }

  // Delete comparison handler (calls backend if live)
  const handleDeleteComparison = async (item) => {
    if (item.isBackend && item.rawId) {
      await deleteComparison(item.rawId);
    } else {
      setLocalSavedComparisons((prev) => prev.filter((sc) => sc.id !== item.id));
      showToast("Comparison removed from saved list", "info");
    }
  };

  // Cancel booking handler
  const handleCancelBooking = async (bookingId) => {
    if (
      typeof window !== "undefined" &&
      !window.confirm("Are you sure you want to cancel this scheduled counselling session? The mentor slot will be released.")
    ) {
      return;
    }
    try {
      await cancelBookingSession(bookingId);
    } catch (_) {}
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-32">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white py-8 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-indigo-300 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Student Command Centre</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Student Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Manage your saved head-to-head comparisons, scheduled mentorship consultations, and admission preferences.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => openCounsellingModal()}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-lg transition-all cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              <span>Book New Consultation</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Dashboard Container: Left Nav + Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
          {/* LEFT NAVIGATION SIDEBAR */}
          <aside className="md:col-span-1 bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-5 space-y-6 sticky top-20">
            {/* Student Mini Profile Header */}
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-12 h-12 rounded-xl bg-slate-900 text-indigo-300 font-extrabold text-sm flex items-center justify-center shrink-0 shadow-inner">
                {currentUser.avatarInitials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-extrabold text-slate-900 truncate">
                  {currentUser.name}
                </p>
                <span className="text-[11px] text-slate-500 truncate block">
                  {currentUser.email}
                </span>
                <span className="inline-block mt-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                  Target: {currentUser.targetDegree}
                </span>
              </div>
            </div>

            {/* 3 Nav Items */}
            <nav className="space-y-1">
              {/* Tab 1: Saved Comparisons */}
              <button
                type="button"
                onClick={() => setActiveTab("saved")}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center justify-between cursor-pointer ${
                  activeTab === "saved"
                    ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Scale className="w-4 h-4" />
                  <span>Saved Comparisons</span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    activeTab === "saved"
                      ? "bg-white/20 text-white"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {displayComparisons.length}
                </span>
              </button>

              {/* Tab 2: My Consultations */}
              <button
                type="button"
                onClick={() => setActiveTab("consultations")}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center justify-between cursor-pointer ${
                  activeTab === "consultations"
                    ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Calendar className="w-4 h-4" />
                  <span>My Consultations</span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    activeTab === "consultations"
                      ? "bg-white/20 text-white"
                      : "bg-emerald-100 text-emerald-800"
                  }`}
                >
                  {displayConsultations.length}
                </span>
              </button>

              {/* Tab 3: Profile Settings */}
              <button
                type="button"
                onClick={() => setActiveTab("settings")}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center justify-between cursor-pointer ${
                  activeTab === "settings"
                    ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Settings className="w-4 h-4" />
                  <span>Profile Settings</span>
                </div>
              </button>
            </nav>

            {/* Logout Action */}
            <div className="pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={logoutUser}
                className="w-full text-left px-3.5 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            </div>
          </aside>

          {/* MAIN CONTENT AREA (Right 3 cols) */}
          <main className="md:col-span-3 space-y-6">
            {/* ========================================================= */}
            {/* TAB 1: SAVED COMPARISONS */}
            {/* ========================================================= */}
            {activeTab === "saved" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                      Saved Head-to-Head Comparisons
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Review saved face-offs or open them directly in the Comparison Arena.
                    </p>
                  </div>
                  <Link
                    href="/compare"
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                  >
                    <span>Launch Arena</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {displayComparisons.length === 0 ? (
                  <div className="bg-white p-12 text-center rounded-2xl border border-slate-200/90 shadow-sm space-y-3">
                    <Scale className="w-10 h-10 text-slate-300 mx-auto" />
                    <h3 className="text-base font-bold text-slate-900">
                      No saved comparisons found
                    </h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Explore our college directory and click &quot;Save Comparison&quot; in the arena to pin comparisons here.
                    </p>
                    <Link
                      href="/compare"
                      className="inline-block px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs"
                    >
                      Compare Colleges Now
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {displayComparisons.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all flex flex-col justify-between space-y-4 group"
                      >
                        {/* Top: Dual College Logos & Saved Date */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] text-slate-400 font-medium">
                                {item.dateSaved}
                              </span>
                              {item.isBackend && (
                                <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded border border-emerald-300">
                                  Live Database
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeleteComparison(item)}
                              className="text-slate-400 hover:text-red-600 p-1 rounded-md transition-colors cursor-pointer"
                              title="Delete saved comparison"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Dual College Logos Card Snapshot */}
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between gap-3">
                            {/* College A */}
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <div
                                className={`w-9 h-9 rounded-lg flex items-center justify-center font-extrabold text-xs shrink-0 shadow-xs ${item.collegeA.avatarBg}`}
                              >
                                {item.collegeA.code || item.collegeA.logoText}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-extrabold text-slate-900 truncate">
                                  {item.collegeA.shortName}
                                </p>
                                <span className="text-[10px] text-emerald-600 font-bold block">
                                  #{item.collegeA.nirfRank} • {item.collegeA.stats.medianSalary}
                                </span>
                              </div>
                            </div>

                            <span className="text-[10px] font-black text-slate-400 shrink-0">
                              VS
                            </span>

                            {/* College B */}
                            <div className="flex items-center gap-2.5 min-w-0 flex-1 justify-end text-right">
                              <div className="min-w-0">
                                <p className="text-xs font-extrabold text-slate-900 truncate">
                                  {item.collegeB.shortName}
                                </p>
                                <span className="text-[10px] text-emerald-600 font-bold block">
                                  #{item.collegeB.nirfRank} • {item.collegeB.stats.medianSalary}
                                </span>
                              </div>
                              <div
                                className={`w-9 h-9 rounded-lg flex items-center justify-center font-extrabold text-xs shrink-0 shadow-xs ${item.collegeB.avatarBg}`}
                              >
                                {item.collegeB.code || item.collegeB.logoText}
                              </div>
                            </div>
                          </div>

                          {/* Programs Comparison Details */}
                          <div className="space-y-1 text-xs">
                            <p className="font-extrabold text-slate-800 leading-snug">
                              {item.collegeA.shortName} vs {item.collegeB.shortName}
                            </p>
                            <p className="text-[11px] text-slate-500 line-clamp-1">
                              Branch: {item.programA}
                            </p>
                          </div>
                        </div>

                        {/* Actions: "Open" & "Delete" */}
                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => handleDeleteComparison(item)}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 hover:border-red-300 text-slate-600 hover:text-red-600 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>

                          <Link
                            href={item.link}
                            className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <span>Open Comparison</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB 2: MY CONSULTATIONS */}
            {/* ========================================================= */}
            {activeTab === "consultations" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                      My 1-on-1 Consultations
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Status tracking and schedule for your college admissions strategy calls.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openCounsellingModal()}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>+ Book Slot</span>
                  </button>
                </div>

                {/* Consultations Table / List with Status Pills */}
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 uppercase tracking-wider text-[11px] font-bold">
                          <th className="py-3.5 px-4">Status</th>
                          <th className="py-3.5 px-4">Date & Time Slot</th>
                          <th className="py-3.5 px-4">Linked Comparison</th>
                          <th className="py-3.5 px-4">Mentor</th>
                          <th className="py-3.5 px-4 text-right">Actions</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {displayConsultations.map((c) => (
                          <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                            {/* Status Pill (Pending amber, Contacted blue, Closed green) */}
                            <td className="py-4 px-4 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold border ${c.statusClass}`}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full ${c.dotClass}`}></span>
                                  <span>{c.status}</span>
                                </span>
                                {c.isBackend && (
                                  <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded border border-emerald-300">
                                    Live
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Slot Date/Time */}
                            <td className="py-4 px-4 whitespace-nowrap font-bold text-slate-900">
                              <div className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                                <span>{c.slotDateTime}</span>
                              </div>
                            </td>

                            {/* Linked Comparison */}
                            <td className="py-4 px-4">
                              <Link
                                href={c.linkedUrl}
                                className="font-extrabold text-indigo-600 hover:underline flex items-center gap-1"
                              >
                                <span>{c.linkedComparison}</span>
                                <ExternalLink className="w-3 h-3" />
                              </Link>
                              <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                                {c.notes}
                              </p>
                            </td>

                            {/* Mentor */}
                            <td className="py-4 px-4 whitespace-nowrap">
                              <p className="font-extrabold text-slate-900">{c.counsellor}</p>
                              <span className="text-[10px] text-slate-500 block">
                                {c.counsellorRole}
                              </span>
                            </td>

                            {/* Actions */}
                            <td className="py-4 px-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-2">
                                {c.canCancel && (
                                  <button
                                    type="button"
                                    onClick={() => handleCancelBooking(c.rawBookingId)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-600 font-bold text-xs transition-colors cursor-pointer"
                                    title="Cancel this session"
                                  >
                                    <XCircle className="w-3.5 h-3.5" />
                                    <span>Cancel</span>
                                  </button>
                                )}

                                {c.meetLink ? (
                                  <a
                                    href={c.meetLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-xs transition-colors"
                                  >
                                    <Video className="w-3 h-3" />
                                    <span>Join Meet</span>
                                  </a>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => openCounsellingModal()}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                                  >
                                    <span>Book Follow-up</span>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB 3: PROFILE SETTINGS */}
            {/* ========================================================= */}
            {activeTab === "settings" && (
              <ProfileSettingsTab
                key={currentUser?.id || currentUser?.email || "student"}
                currentUser={currentUser}
                updateUserProfile={updateUserProfile}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

function ProfileSettingsTab({ currentUser, updateUserProfile }) {
  const [name, setName] = useState(currentUser?.name || "Aarav Sharma");
  const [email, setEmail] = useState(currentUser?.email || "aarav.sharma@gmail.com");
  const [phone, setPhone] = useState(
    currentUser?.phone || (currentUser?.mobile ? `+91 ${currentUser.mobile}` : "+91 98765 43210")
  );
  const [targetDegree, setTargetDegree] = useState(
    currentUser?.targetDegree || currentUser?.target_degree || "B.Tech Computer Science"
  );
  const [educationLevel, setEducationLevel] = useState(
    currentUser?.educationLevel || currentUser?.education_level || "Class 12 Appearing"
  );
  const [preferredCity, setPreferredCity] = useState(
    currentUser?.preferredCity || currentUser?.preferred_city || "Delhi NCR"
  );
  const [jeeAdvRank, setJeeAdvRank] = useState(currentUser?.jeeAdvRank || "1,240");
  const [jeeMainRank, setJeeMainRank] = useState(currentUser?.jeeMainRank || "2,150");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSavingProfile(true);
    await updateUserProfile({
      name,
      email,
      phone,
      mobile: phone.replace(/[\s\-\+]/g, "").slice(-10),
      targetDegree,
      educationLevel,
      preferredCity,
      jeeAdvRank,
      jeeMainRank,
    });
    setIsSavingProfile(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-6">
      <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
            Profile & Admission Preferences
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tailor your target degrees, education level, and preferred city to personalize college cutoff matches.
          </p>
        </div>
        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Verified Profile</span>
        </span>
      </div>

      <form onSubmit={handleSaveProfile} className="space-y-5">
        {/* Row 1: Name & Contact Details */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-xs sm:text-sm font-semibold outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-xs sm:text-sm font-semibold outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number (+91)</label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-xs sm:text-sm font-semibold outline-none"
            />
          </div>
        </div>

        {/* Row 2: Target Degree, Education Level, Preferred City */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          {/* Target Degree */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Target Degree</label>
            <select
              value={targetDegree}
              onChange={(e) => setTargetDegree(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-xs sm:text-sm font-semibold text-slate-800 bg-white outline-none cursor-pointer"
            >
              <option value="B.Tech Computer Science">B.Tech Computer Science (CSE)</option>
              <option value="B.Tech Data Science & AI">B.Tech Data Science & AI</option>
              <option value="B.Tech Electronics & Comm">B.Tech Electronics & Comm</option>
              <option value="B.Tech Mechanical Engg">B.Tech Mechanical Engg</option>
              <option value="MBA / PGDM">MBA / Management (PGP/MBA)</option>
              <option value="Dual Degree (B.Tech+MS)">Dual Degree (B.Tech + MS)</option>
            </select>
          </div>

          {/* Education Level */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Education Level</label>
            <select
              value={educationLevel}
              onChange={(e) => setEducationLevel(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-xs sm:text-sm font-semibold text-slate-800 bg-white outline-none cursor-pointer"
            >
              <option value="Class 12 Appearing">Class 12 Appearing (2025)</option>
              <option value="Class 12 Passed (Dropper)">Class 12 Passed (Dropper / 2024)</option>
              <option value="Undergraduate Final Year">Undergraduate Final Year</option>
              <option value="Working Professional">Working Professional</option>
            </select>
          </div>

          {/* Preferred City */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Preferred City / Region</label>
            <select
              value={preferredCity}
              onChange={(e) => setPreferredCity(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-xs sm:text-sm font-semibold text-slate-800 bg-white outline-none cursor-pointer"
            >
              <option value="Delhi NCR">Delhi NCR</option>
              <option value="Mumbai">Mumbai & MMR</option>
              <option value="Pune">Pune, Maharashtra</option>
              <option value="Bengaluru">Bengaluru, Karnataka</option>
              <option value="Hyderabad">Hyderabad, Telangana</option>
              <option value="Chennai">Chennai, Tamil Nadu</option>
              <option value="Pan-India / Flexible">Pan-India / Flexible</option>
            </select>
          </div>
        </div>

        {/* Row 3: Ranks */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              JEE Advanced All India Rank (AIR)
            </label>
            <input
              type="text"
              value={jeeAdvRank}
              onChange={(e) => setJeeAdvRank(e.target.value)}
              placeholder="e.g. 1,240"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-xs sm:text-sm font-semibold outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              JEE Main All India Rank (AIR)
            </label>
            <input
              type="text"
              value={jeeMainRank}
              onChange={(e) => setJeeMainRank(e.target.value)}
              placeholder="e.g. 2,150"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-xs sm:text-sm font-semibold outline-none"
            />
          </div>
        </div>

        {/* Submit Action Button */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={isSavingProfile}
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-75 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-indigo-600/30 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSavingProfile ? "Saving to Database..." : "Save Profile Settings"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
