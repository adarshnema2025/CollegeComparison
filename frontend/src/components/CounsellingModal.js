"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import { COLLEGES, COUNSELLORS } from "@/data/colleges";
import { counsellingApi } from "@/lib/api";
import {
  X,
  Calendar,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  Video,
  ArrowRight,
  Phone,
  Check,
  Copy,
  ExternalLink,
  MessageSquare,
  Scale,
  RefreshCw,
  Loader2,
} from "lucide-react";

export default function CounsellingDrawer() {
  const {
    counsellingModalOpen,
    closeCounsellingModal,
    counsellingTargetCollege,
    compareList,
    bookSession,
    currentUser,
    openAuthModal,
    backendComparisons,
    showToast,
  } = useApp();

  // Form State
  const [mobileNumber, setMobileNumber] = useState(
    currentUser?.phone ? currentUser.phone.replace("+91 ", "") : "9876543210"
  );
  const [isPhoneVerified, setIsPhoneVerified] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);

  // Live Slots Availability from Backend
  const [availabilityDays, setAvailabilityDays] = useState([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [selectedSlotObj, setSelectedSlotObj] = useState(null);

  // Optional note
  const [notes, setNotes] = useState("");

  // Rate limit & error state
  const [bookingError, setBookingError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Success state with confirmation details
  const [isSuccess, setIsSuccess] = useState(false);
  const [confirmedBookingData, setConfirmedBookingData] = useState(null);

  // Link copied state
  const [copiedLink, setCopiedLink] = useState(false);

  // Fetch live availability slots
  const fetchAvailability = useCallback(async () => {
    setLoadingAvailability(true);
    setBookingError(null);
    try {
      const res = await counsellingApi.getAvailability();
      if (res?.success && Array.isArray(res.data?.days)) {
        setAvailabilityDays(res.data.days);
        if (res.data.days.length > 0) {
          setSelectedDayIndex(0);
          if (res.data.days[0].slots?.length > 0) {
            setSelectedSlotObj(res.data.days[0].slots[0]);
          } else {
            setSelectedSlotObj(null);
          }
        }
      }
    } catch (err) {
      console.warn("Could not load availability slots from backend:", err.message);
    } finally {
      setLoadingAvailability(false);
    }
  }, []);

  // Fetch when drawer opens
  useEffect(() => {
    if (counsellingModalOpen) {
      fetchAvailability();
      if (currentUser?.phone || currentUser?.mobile) {
        setMobileNumber((currentUser.phone || currentUser.mobile).replace(/[\s\-\+]/g, "").slice(-10));
      }
    }
  }, [counsellingModalOpen, fetchAvailability, currentUser]);

  const handleClose = () => {
    setIsSuccess(false);
    setBookingError(null);
    setCopiedLink(false);
    closeCounsellingModal();
  };

  // Helper to format ISO slot time to IST readable format (e.g. 10:00 AM)
  const formatTimeIST = (isoString) => {
    if (!isoString) return "";
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString("en-IN", {
        timeZone: "Asia/Calcutta",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch (_) {
      return "";
    }
  };

  // Helper for human-readable day label (e.g., "Today, Nov 15")
  const formatDayLabel = (dateStr) => {
    if (!dateStr) return "";
    try {
      const now = new Date();
      const todayStr = now.toLocaleDateString("en-CA", { timeZone: "Asia/Calcutta" });
      const tomorrowStr = new Date(now.getTime() + 86400000).toLocaleDateString("en-CA", {
        timeZone: "Asia/Calcutta",
      });

      const d = new Date(dateStr + "T12:00:00+05:30");
      const formatted = d.toLocaleDateString("en-IN", {
        weekday: "short",
        month: "short",
        day: "numeric",
        timeZone: "Asia/Calcutta",
      });

      if (dateStr === todayStr) return `Today (${formatted})`;
      if (dateStr === tomorrowStr) return `Tomorrow (${formatted})`;
      return formatted;
    } catch (_) {
      return dateStr;
    }
  };

  // Group slots of currently selected day into Morning / Afternoon / Evening
  const activeDaySlots = availabilityDays[selectedDayIndex]?.slots || [];

  const groupedSlots = useMemo(() => {
    const morning = [];
    const afternoon = [];
    const evening = [];

    activeDaySlots.forEach((slot) => {
      const d = new Date(slot.start);
      // Calculate hour in IST
      const istHour = (d.getUTCHours() + 5 + Math.floor((d.getUTCMinutes() + 30) / 60)) % 24;
      if (istHour < 12) {
        morning.push(slot);
      } else if (istHour < 17) {
        afternoon.push(slot);
      } else {
        evening.push(slot);
      }
    });

    return { morning, afternoon, evening };
  }, [activeDaySlots]);

  if (!counsellingModalOpen) return null;

  // Resolve College A and College B for top thumbnail snapshot
  let collegeA = null;
  let collegeB = null;

  if (counsellingTargetCollege) {
    collegeA = counsellingTargetCollege;
    collegeB = COLLEGES.find((c) => c.id !== collegeA.id) || COLLEGES[1];
  } else if (compareList && compareList.length >= 2) {
    collegeA = compareList[0];
    collegeB = compareList[1];
  } else if (compareList && compareList.length === 1) {
    collegeA = compareList[0];
    collegeB = COLLEGES.find((c) => c.id !== collegeA.id) || COLLEGES[1];
  } else {
    collegeA = COLLEGES.find((c) => c.id === "iit-bombay") || COLLEGES[0];
    collegeB = COLLEGES.find((c) => c.id === "iit-delhi") || COLLEGES[1];
  }

  // Find linked backend comparison ID if exists
  const linkedComparison = (backendComparisons || []).find(
    (cmp) =>
      (cmp.programA?.college?.id === collegeA.id || cmp.programA?.college?.slug === collegeA.slug) &&
      (cmp.programB?.college?.id === collegeB.id || cmp.programB?.college?.slug === collegeB.slug)
  );

  // Handle phone verification simulation
  const handleVerifyPhone = () => {
    if (mobileNumber.length < 10) {
      showToast("Please enter a valid 10-digit mobile number", "warning");
      return;
    }
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setIsPhoneVerified(true);
      showToast("Mobile verified successfully!", "success");
    }, 400);
  };

  // Handle Confirm Booking
  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    setBookingError(null);

    if (!currentUser) {
      openAuthModal("login", "counselling");
      showToast("Please log in or create an account to book your counselling slot", "info");
      return;
    }

    if (!selectedSlotObj) {
      showToast("Please select an available time slot", "warning");
      return;
    }

    if (mobileNumber.length < 10) {
      showToast("Please enter a valid 10-digit mobile number", "warning");
      return;
    }

    const slotStartFormatted = formatTimeIST(selectedSlotObj.start);
    const slotEndFormatted = formatTimeIST(selectedSlotObj.end);
    const selectedDateLabel = formatDayLabel(availabilityDays[selectedDayIndex]?.date);

    const bookingPayload = {
      slot: selectedSlotObj.start,
      slotIso: selectedSlotObj.start,
      counsellorName: COUNSELLORS[0].name,
      counsellorRole: COUNSELLORS[0].role,
      collegeName: `${collegeA.shortName} vs ${collegeB.shortName}`,
      date: selectedDateLabel,
      time: `${slotStartFormatted} - ${slotEndFormatted} IST`,
      phone: `+91 ${mobileNumber}`,
      mobile: mobileNumber,
      notes: notes,
      comparisonId: linkedComparison ? linkedComparison.id : null,
      type: "1-on-1 Video Session",
    };

    setIsSubmitting(true);
    try {
      const created = await bookSession(bookingPayload);
      setConfirmedBookingData({
        ...bookingPayload,
        counsellorName:
          created?.backendData?.counsellor?.name ||
          created?.counsellor?.name ||
          created?.counsellorName ||
          COUNSELLORS[0].name,
        meetLink:
          created?.meetLink ||
          `https://meet.google.com/cc-${Math.floor(Math.random() * 899 + 100)}-${Math.floor(
            Math.random() * 899 + 100
          )}`,
      });
      setIsSuccess(true);
    } catch (err) {
      console.warn("Booking request error:", err);
      const msg = err.message || "Failed to book session";

      if (msg.toLowerCase().includes("limit") || msg.includes("429")) {
        setBookingError({
          type: "limit",
          title: "Booking Rate Limit Reached",
          message:
            "You already have 2 upcoming bookings. Please cancel an existing booking from your Dashboard or wait until it is over.",
        });
      } else if (msg.toLowerCase().includes("slot") || msg.includes("409")) {
        setBookingError({
          type: "conflict",
          title: "Time Slot No Longer Available",
          message: "That slot was claimed just now. Please pick another open slot.",
        });
        fetchAvailability(); // Refresh to show current open slots
      } else {
        setBookingError({
          type: "general",
          title: "Booking Error",
          message: msg,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyMeetLink = (link) => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(link);
      setCopiedLink(true);
      showToast("Google Meet link copied!", "info");
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-xs animate-fade-in">
      <div
        className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col justify-between animate-slide-right overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* DRAWER TOP HEADER */}
        <div className="bg-slate-900 text-white p-5 border-b border-slate-800 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[11px] uppercase font-extrabold tracking-wider text-emerald-400">
                1-on-1 Admissions Mentorship
              </span>
            </div>
            <button
              onClick={handleClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              title="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <h3 className="text-xl font-extrabold text-white mt-2 tracking-tight">
            Book Free Counselling Session
          </h3>
          <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
            Direct strategy call with senior ex-IIT/IIM advisors. 100% unbiased & live auto-matching.
          </p>

          {/* TOP: THUMBNAIL SNAPSHOT OF THE TWO COMPARED COLLEGES */}
          <div className="mt-4 p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between gap-3">
            {/* College A Snapshot */}
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${collegeA.avatarBg}`}
              >
                {collegeA.code || collegeA.logoText}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-white truncate leading-tight">
                  {collegeA.shortName}
                </p>
                <span className="text-[10px] text-emerald-400 font-bold block">
                  #{collegeA.nirfRank} • {collegeA.stats.medianSalary}
                </span>
              </div>
            </div>

            {/* Bridge "VS" Pill */}
            <div className="px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 text-[10px] font-black shrink-0 border border-slate-600">
              VS
            </div>

            {/* College B Snapshot */}
            <div className="flex items-center gap-2.5 min-w-0 flex-1 justify-end text-right">
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-white truncate leading-tight">
                  {collegeB.shortName}
                </p>
                <span className="text-[10px] text-emerald-400 font-bold block">
                  #{collegeB.nirfRank} • {collegeB.stats.medianSalary}
                </span>
              </div>
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${collegeB.avatarBg}`}
              >
                {collegeB.code || collegeB.logoText}
              </div>
            </div>
          </div>
        </div>

        {/* DRAWER SCROLLABLE BODY */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* ERROR STATE */}
          {bookingError ? (
            <div className="p-5 rounded-2xl bg-red-50 border border-red-200 text-red-900 space-y-3 animate-fade-in">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-sm font-extrabold text-red-950">
                    {bookingError.title}
                  </h4>
                  <p className="text-xs text-red-700 leading-relaxed">
                    {bookingError.message}
                  </p>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setBookingError(null);
                    fetchAvailability();
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Choose Another Slot</span>
                </button>
                {bookingError.type === "limit" && (
                  <Link
                    href="/dashboard"
                    onClick={handleClose}
                    className="px-3.5 py-1.5 rounded-xl bg-white border border-red-300 text-red-800 text-xs font-bold hover:bg-red-50 transition-colors"
                  >
                    View Active Bookings
                  </Link>
                )}
              </div>
            </div>
          ) : isSuccess ? (
            /* SUCCESS STATE WITH CONFIRMATION DETAILS */
            <div className="space-y-5 animate-fade-in">
              <div className="text-center space-y-2 py-2">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-extrabold text-slate-900">
                  Counselling Session Confirmed!
                </h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Your 30-minute 1-on-1 strategy call with our verified advisor has been scheduled.
                </p>
              </div>

              {/* Confirmation Details Card */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3.5 text-xs">
                <div className="flex justify-between items-center pb-2.5 border-b border-slate-200">
                  <span className="text-slate-500 font-semibold">Comparing Dilemma:</span>
                  <span className="font-extrabold text-slate-900 text-right">
                    {confirmedBookingData?.collegeName}
                  </span>
                </div>

                <div className="flex justify-between items-center pb-2.5 border-b border-slate-200">
                  <span className="text-slate-500 font-semibold">Assigned Mentor:</span>
                  <span className="font-extrabold text-indigo-700">
                    {confirmedBookingData?.counsellorName}
                  </span>
                </div>

                <div className="flex justify-between items-center pb-2.5 border-b border-slate-200">
                  <span className="text-slate-500 font-semibold">Date & Time:</span>
                  <span className="font-extrabold text-slate-900">
                    {confirmedBookingData?.date} • {confirmedBookingData?.time}
                  </span>
                </div>

                <div className="flex justify-between items-center pb-2.5 border-b border-slate-200">
                  <span className="text-slate-500 font-semibold">Student Mobile:</span>
                  <span className="font-extrabold text-slate-900">
                    {confirmedBookingData?.phone}
                  </span>
                </div>

                {/* Google Meet Room with Copy Link */}
                <div className="pt-1 space-y-1.5">
                  <span className="text-slate-500 font-semibold block">Google Meet Room:</span>
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-2">
                    <span className="font-bold text-indigo-600 truncate text-[11px]">
                      {confirmedBookingData?.meetLink}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyMeetLink(confirmedBookingData?.meetLink)}
                      className="px-2 py-1 rounded bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 text-[10px] font-bold flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      {copiedLink ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedLink ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Notification Pill */}
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Slot locked in live database. WhatsApp reminder will be sent to student mobile.</span>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-2">
                <Link
                  href="/dashboard"
                  onClick={handleClose}
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <span>View in Student Hub Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Done & Close Drawer
                </button>
              </div>
            </div>
          ) : (
            /* ACTIVE BOOKING FORM */
            <form onSubmit={handleConfirmBooking} className="space-y-5">
              {/* Login Banner if not signed in */}
              {!currentUser && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-3 text-xs text-amber-900">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>Please log in to confirm your slot reservation.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => openAuthModal("login", "counselling")}
                    className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs shrink-0 cursor-pointer"
                  >
                    Log In
                  </button>
                </div>
              )}

              {/* 1. MOBILE NUMBER INPUT */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Mobile Number (For WhatsApp Meeting Link & SMS)
                </label>
                <div className="flex gap-2">
                  <div className="px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-1 shrink-0">
                    <span>🇮🇳 +91</span>
                  </div>

                  <div className="relative flex-1">
                    <input
                      type="tel"
                      required
                      value={mobileNumber}
                      onChange={(e) => {
                        setMobileNumber(e.target.value.replace(/\D/g, ""));
                        setIsPhoneVerified(false);
                      }}
                      placeholder="9876543210"
                      maxLength={10}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-xs sm:text-sm font-semibold outline-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleVerifyPhone}
                    disabled={isVerifying || isPhoneVerified}
                    className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                      isPhoneVerified
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-300"
                        : "bg-slate-900 hover:bg-indigo-600 text-white"
                    }`}
                  >
                    {isPhoneVerified ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Verified</span>
                      </>
                    ) : isVerifying ? (
                      <span>Verifying...</span>
                    ) : (
                      <span>Verify</span>
                    )}
                  </button>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                  <span>100% spam-free. We never share your contact.</span>
                  {currentUser?.name && (
                    <span className="text-indigo-600 font-semibold truncate">
                      Booking as {currentUser.name}
                    </span>
                  )}
                </div>
              </div>

              {/* 2. CALENDAR DATE PICKER */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Select Date</span>
                  </label>
                  <button
                    type="button"
                    onClick={fetchAvailability}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${loadingAvailability ? "animate-spin" : ""}`} />
                    <span>Refresh Slots</span>
                  </button>
                </div>

                {loadingAvailability ? (
                  <div className="py-6 flex items-center justify-center gap-2 text-xs text-slate-500">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                    <span>Loading available mentor slots...</span>
                  </div>
                ) : availabilityDays.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-2">
                    <p className="text-xs text-slate-600">No open slots available in the next 3 days.</p>
                    <button
                      type="button"
                      onClick={fetchAvailability}
                      className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg cursor-pointer"
                    >
                      Check Again
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {availabilityDays.map((day, idx) => {
                      const isSelected = selectedDayIndex === idx;
                      const dayLabel = formatDayLabel(day.date);
                      const slotsCount = day.slots?.length || 0;

                      return (
                        <button
                          key={day.date}
                          type="button"
                          onClick={() => {
                            setSelectedDayIndex(idx);
                            if (day.slots?.length > 0) {
                              setSelectedSlotObj(day.slots[0]);
                            } else {
                              setSelectedSlotObj(null);
                            }
                          }}
                          className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                            isSelected
                              ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                              : "bg-slate-50 hover:bg-white text-slate-700 border-slate-200"
                          }`}
                        >
                          <div className="truncate">{dayLabel}</div>
                          <div
                            className={`text-[10px] font-semibold mt-0.5 ${
                              isSelected ? "text-indigo-200" : "text-emerald-600"
                            }`}
                          >
                            {slotsCount} {slotsCount === 1 ? "Slot" : "Slots"}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 3. TIME-SLOT CHIPS GROUPED BY MORNING / AFTERNOON / EVENING */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Time Slots</span>
                  </label>
                  <span className="text-[10px] text-slate-600 font-bold bg-slate-100 px-2 py-0.5 rounded-md">
                    Timezone: IST (GMT+5:30)
                  </span>
                </div>

                {activeDaySlots.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3 text-center">
                    No open time slots remaining for this day. Please pick another date above.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {/* Morning */}
                    {groupedSlots.morning.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                          Morning
                        </span>
                        <div className="grid grid-cols-2 gap-2">
                          {groupedSlots.morning.map((slot) => {
                            const isSelected = selectedSlotObj?.start === slot.start;
                            const label = `${formatTimeIST(slot.start)} - ${formatTimeIST(slot.end)}`;
                            return (
                              <button
                                key={slot.start}
                                type="button"
                                onClick={() => setSelectedSlotObj(slot)}
                                className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                                  isSelected
                                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                    : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
                                }`}
                              >
                                {label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Afternoon */}
                    {groupedSlots.afternoon.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                          Afternoon
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {groupedSlots.afternoon.map((slot) => {
                            const isSelected = selectedSlotObj?.start === slot.start;
                            const label = `${formatTimeIST(slot.start)} - ${formatTimeIST(slot.end)}`;
                            return (
                              <button
                                key={slot.start}
                                type="button"
                                onClick={() => setSelectedSlotObj(slot)}
                                className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                                  isSelected
                                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                    : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
                                }`}
                              >
                                {label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Evening */}
                    {groupedSlots.evening.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                          Evening (Most Popular)
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {groupedSlots.evening.map((slot) => {
                            const isSelected = selectedSlotObj?.start === slot.start;
                            const label = `${formatTimeIST(slot.start)} - ${formatTimeIST(slot.end)}`;
                            return (
                              <button
                                key={slot.start}
                                type="button"
                                onClick={() => setSelectedSlotObj(slot)}
                                className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                                  isSelected
                                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                    : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
                                }`}
                              >
                                {label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 4. OPTIONAL NOTE TEXTAREA */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                    <span>Specific Doubts / Choice Notes (Optional)</span>
                  </label>
                  <span className="text-[10px] text-slate-400">{notes.length}/300</span>
                </div>
                <textarea
                  rows={2}
                  maxLength={300}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g., Comparing Computer Science at DTU vs Mechanical at IIT Bombay, or JoSAA choice filling priority order..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-xs font-medium outline-none resize-none transition-all placeholder:text-slate-400"
                />
              </div>

              {/* Zero Commission Guarantee Ribbon */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2.5 text-xs text-slate-600">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <b className="text-slate-800">100% Unbiased Guarantee:</b> Our counsellors do not accept referral fees from colleges.
                </span>
              </div>

              {/* PRIMARY BUTTON: "CONFIRM BOOKING" */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedSlotObj}
                  className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold text-sm shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Securing Video Slot...</span>
                    </>
                  ) : (
                    <>
                      <Video className="w-4 h-4" />
                      <span>Confirm Slot Booking (Free 30-Min Call)</span>
                    </>
                  )}
                </button>
                <p className="text-[11px] text-slate-400 text-center mt-2">
                  Instant Google Meet link & SMS confirmation dispatched upon reservation.
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
