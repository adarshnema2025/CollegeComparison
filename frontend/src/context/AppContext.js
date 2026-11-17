"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { COLLEGES } from "@/data/colleges";
import { authApi, counsellingApi, meApi, getToken, setToken } from "@/lib/api";

const AppContext = createContext();

const DEMO_USER = {
  id: 7,
  name: "Aarav Sharma",
  email: "aarav.sharma@gmail.com",
  phone: "+91 98765 43210",
  mobile: "9876543210",
  targetDegree: "B.Tech Computer Science",
  target_degree: "B.Tech Computer Science",
  educationLevel: "Class 12 Appearing",
  education_level: "Class 12 Appearing",
  preferredCity: "Delhi NCR",
  preferred_city: "Delhi NCR",
  city: "New Delhi",
  state: "Delhi",
  targetYear: "2025",
  jeeAdvRank: "1,240",
  jeeMainRank: "2,150",
  homeState: "Delhi NCR",
  avatarInitials: "AS",
};

export function AppProvider({ children }) {
  const router = useRouter();

  // Compare state (persisted in localStorage, defaults to empty so user can freely select colleges)
  const [compareList, setCompareList] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("cc_compare_list");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch (_) {}
    }
    return [];
  });
  const [isCompareTrayOpen, setIsCompareTrayOpen] = useState(true);

  // Sync compareList with localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("cc_compare_list", JSON.stringify(compareList));
      } catch (_) {}
    }
  }, [compareList]);

  // Auth modal state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState("login"); // "login" | "signup"
  const [authModalReason, setAuthModalReason] = useState(null); // null | "compare"
  const [pendingCompareUrl, setPendingCompareUrl] = useState(null);
  const [currentUser, setCurrentUser] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("cc_auth_user");
        if (saved) return JSON.parse(saved);
      } catch (_) {}
    }
    return null;
  });
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);
  const [authInitialized, setAuthInitialized] = useState(false);

  // Counselling modal state
  const [counsellingModalOpen, setCounsellingModalOpen] = useState(false);
  const [counsellingTargetCollege, setCounsellingTargetCollege] = useState(null);

  // Backend sync states: comparisons, consultations & slot bookings
  const [backendComparisons, setBackendComparisons] = useState([]);
  const [backendConsultations, setBackendConsultations] = useState([]);
  const [backendBookings, setBackendBookings] = useState([]);

  // Booked sessions state (local fallback & live sync)
  const [bookedSessions, setBookedSessions] = useState([
    {
      id: "bk-1",
      counsellorName: "Dr. Arvind Subramanian",
      counsellorRole: "Ex-IIT Madras Senior Admissions Advisor",
      collegeName: "IIT Bombay vs IIT Delhi",
      date: "Tomorrow, Nov 5",
      time: "04:30 PM - 05:00 PM IST",
      type: "1-on-1 Video Session",
      status: "Confirmed",
      meetLink: "https://meet.google.com/xyz-iit-counsel",
    },
  ]);

  // Wishlist state
  const [wishlist, setWishlist] = useState(["iit-bombay", "iiit-hyderabad", "bits-pilani"]);

  // Toast state
  const [toast, setToast] = useState({ visible: false, message: "", type: "info" });

  const showToast = useCallback((message, type = "info") => {
    setToast({ visible: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 3500);
  }, []);

  // Fetch backend data for current user
  const fetchUserData = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    try {
      const [compRes, counselRes, bookingsRes] = await Promise.allSettled([
        meApi.getComparisons(20, 0),
        meApi.getCounselling(),
        counsellingApi.getMyBookings({ limit: 50 }),
      ]);

      if (compRes.status === "fulfilled" && compRes.value?.data?.items) {
        setBackendComparisons(compRes.value.data.items);
      }
      if (counselRes.status === "fulfilled" && counselRes.value?.data?.items) {
        setBackendConsultations(counselRes.value.data.items);
      }
      if (bookingsRes.status === "fulfilled" && bookingsRes.value?.data?.items) {
        setBackendBookings(bookingsRes.value.data.items);
      }
    } catch (err) {
      console.warn("Error fetching backend user data:", err);
    }
  }, []);

  // Verify stored session on mount
  useEffect(() => {
    const initSession = async () => {
      const token = getToken();
      if (!token) {
        setAuthInitialized(true);
        return;
      }

      setIsLoadingAuth(true);
      try {
        const res = await authApi.getProfile();
        if (res?.success && res?.data) {
          const u = res.data;
          const userObj = {
            ...u,
            targetDegree: u.target_degree || u.targetDegree || "B.Tech Computer Science",
            educationLevel: u.education_level || u.educationLevel || "Class 12 Appearing",
            preferredCity: u.preferred_city || u.preferredCity || "Delhi NCR",
            phone: u.mobile ? `+91 ${u.mobile}` : "+91 98765 43210",
            avatarInitials:
              u.name
                ?.split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase() || "ST",
            jeeAdvRank: u.jeeAdvRank || "Active",
            jeeMainRank: u.jeeMainRank || "Active",
          };
          setCurrentUser(userObj);
          if (typeof window !== "undefined") {
            localStorage.setItem("cc_auth_user", JSON.stringify(userObj));
          }
          fetchUserData();
        } else {
          authApi.logout();
          setCurrentUser(null);
          if (typeof window !== "undefined") {
            localStorage.removeItem("cc_auth_user");
          }
        }
      } catch (err) {
        console.warn("Session restore failed, clearing token:", err.message);
        authApi.logout();
        setCurrentUser(null);
        if (typeof window !== "undefined") {
          localStorage.removeItem("cc_auth_user");
        }
      } finally {
        setIsLoadingAuth(false);
        setAuthInitialized(true);
      }
    };

    initSession();
  }, [fetchUserData]);

  const addToCompare = (college) => {
    if (compareList.some((item) => item.id === college.id)) {
      showToast(`${college.shortName} is already in comparison`, "warning");
      return false;
    }
    if (compareList.length >= 2) {
      showToast("Maximum 2 colleges can be compared at once", "warning");
      return false;
    }
    setCompareList((prev) => [...prev, college]);
    setIsCompareTrayOpen(true);
    showToast(`Added ${college.shortName} to Compare Tray (2 max)`, "success");
    return true;
  };

  const removeFromCompare = (collegeId) => {
    const col = compareList.find((c) => c.id === collegeId);
    setCompareList((prev) => prev.filter((item) => item.id !== collegeId));
    if (col) {
      showToast(`Removed ${col.shortName} from comparison`, "info");
    }
  };

  const clearCompare = () => {
    setCompareList([]);
    showToast("Compare tray cleared", "info");
  };

  const isInCompare = (collegeId) => {
    return compareList.some((item) => item.id === collegeId);
  };

  const openAuthModal = (tab = "login", reason = null, redirectUrl = null) => {
    setAuthModalTab(tab);
    setAuthModalReason(reason);
    if (redirectUrl) {
      setPendingCompareUrl(redirectUrl);
    }
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
  };

  // Central trigger to compare colleges:
  // Allows user to freely select colleges, but requires login/signup upon clicking Compare
  const triggerCompare = useCallback(
    (targetUrl = null) => {
      const url =
        targetUrl ||
        (compareList.length >= 2
          ? `/compare?c1=${encodeURIComponent(
              compareList[0]?.slug || compareList[0]?.id
            )}&c2=${encodeURIComponent(
              compareList[1]?.slug || compareList[1]?.id
            )}`
          : "/compare");

      if (!currentUser) {
        setPendingCompareUrl(url);
        setAuthModalReason("compare");
        setAuthModalTab("login");
        setAuthModalOpen(true);
        showToast("Please log in or sign up to compare colleges head-to-head", "info");
        return false;
      }

      router.push(url);
      return true;
    },
    [currentUser, compareList, router, showToast]
  );

  // Automatically navigate to pending compare target once user authenticates
  useEffect(() => {
    if (currentUser && pendingCompareUrl) {
      const destination = pendingCompareUrl;
      setPendingCompareUrl(null);
      setAuthModalReason(null);
      router.push(destination);
    }
  }, [currentUser, pendingCompareUrl, router]);

  // Live Login via backend /auth/login
  const loginUser = async (email, password) => {
    setIsLoadingAuth(true);
    try {
      const res = await authApi.login({ email, password });
      if (res?.success) {
        // Fetch full profile if available
        let profile = res.user;
        try {
          const profRes = await authApi.getProfile();
          if (profRes?.success && profRes?.data) {
            profile = profRes.data;
          }
        } catch (_) {}

        const userObj = {
          ...profile,
          targetDegree: profile.target_degree || profile.targetDegree || "B.Tech Computer Science",
          educationLevel: profile.education_level || profile.educationLevel || "Class 12 Appearing",
          preferredCity: profile.preferred_city || profile.preferredCity || "Delhi NCR",
          phone: profile.mobile ? `+91 ${profile.mobile}` : "+91 98765 43210",
          avatarInitials:
            profile.name
              ?.split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase() || "ST",
          jeeAdvRank: "1,240",
          jeeMainRank: "2,150",
        };

        const isAdminUser =
          userObj.role === "admin" ||
          userObj.email?.toLowerCase() === "admin@collegecomparison.com";

        if (typeof window !== "undefined") {
          localStorage.setItem("cc_auth_user", JSON.stringify(userObj));
        }

        setCurrentUser(userObj);
        setAuthInitialized(true);
        closeAuthModal();
        showToast(
          isAdminUser ? `Welcome, Administrator ${userObj.name}!` : `Welcome back, ${userObj.name}!`,
          "success"
        );
        fetchUserData();

        if (isAdminUser && typeof window !== "undefined") {
          window.location.replace("/admin");
        }

        return { success: true, isAdmin: isAdminUser };
      }
      return { success: false, error: res?.error || "Login failed" };
    } catch (err) {
      return { success: false, error: err.message || "Failed to connect to backend server" };
    } finally {
      setIsLoadingAuth(false);
    }
  };

  // Live Register via backend /auth/register
  const registerUser = async (payload) => {
    setIsLoadingAuth(true);
    try {
      const regRes = await authApi.register({
        name: payload.name,
        email: payload.email,
        password: payload.password,
        mobile: payload.mobile || "9876543210",
        target_degree: payload.targetDegree || "B.Tech CSE",
        education_level: payload.educationLevel || "Class 12 Appearing",
        preferred_city: payload.preferredCity || "Delhi NCR",
        city: payload.city || payload.preferredCity || "Delhi",
        state: payload.state || "Delhi",
      });

      if (regRes?.success) {
        // Automatically log in after registration
        return await loginUser(payload.email, payload.password);
      }
      return { success: false, error: regRes?.error || "Registration failed" };
    } catch (err) {
      return { success: false, error: err.message || "Failed to register account" };
    } finally {
      setIsLoadingAuth(false);
    }
  };

  // Demo user fallback login
  const loginDemoUser = async () => {
    try {
      const res = await loginUser("aarav.sharma@gmail.com", "password123");
      if (!res.success) {
        // Offline demo fallback
        setCurrentUser(DEMO_USER);
        closeAuthModal();
        showToast("Logged in as Aarav Sharma (Demo Mode)", "success");
      }
    } catch (_) {
      setCurrentUser(DEMO_USER);
      closeAuthModal();
      showToast("Logged in as Aarav Sharma (Demo Mode)", "success");
    }
  };

  // Logout
  const logoutUser = () => {
    authApi.logout();
    setCurrentUser(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("cc_auth_user");
    }
    setBackendComparisons([]);
    setBackendConsultations([]);
    showToast("Logged out successfully", "info");
    if (typeof window !== "undefined") {
      window.location.replace("/");
    }
  };

  // Profile update
  const updateUserProfile = async (formData) => {
    try {
      const res = await authApi.updateProfile({
        name: formData.name,
        email: formData.email,
        mobile: formData.mobile || formData.phone?.replace("+91 ", ""),
        target_degree: formData.targetDegree,
        education_level: formData.educationLevel,
        preferred_city: formData.preferredCity,
        city: formData.city || formData.preferredCity,
        state: formData.state,
      });

      if (res?.success && res?.data) {
        const u = res.data;
        const updated = {
          ...currentUser,
          ...u,
          targetDegree: u.target_degree || formData.targetDegree,
          educationLevel: u.education_level || formData.educationLevel,
          preferredCity: u.preferred_city || formData.preferredCity,
          phone: u.mobile ? `+91 ${u.mobile}` : formData.phone,
          avatarInitials:
            u.name
              ?.split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase() || "ST",
        };
        setCurrentUser(updated);
        showToast("Profile settings saved successfully to backend!", "success");
        return { success: true };
      }
    } catch (err) {
      // Local fallback
      setCurrentUser((prev) => ({ ...prev, ...formData }));
      showToast("Profile updated locally", "info");
      return { success: true };
    }
  };

  const openCounsellingModal = (college = null) => {
    setCounsellingTargetCollege(college);
    setCounsellingModalOpen(true);
  };

  const closeCounsellingModal = () => {
    setCounsellingModalOpen(false);
    setCounsellingTargetCollege(null);
  };

  // Live Book Session via /counselling/bookings API
  const bookSession = async (session) => {
    const cleanedMobile = (session.phone || session.mobile || "9876543210").replace(/[\s\-\+]/g, "").slice(-10);

    let apiData = null;

    if (getToken()) {
      try {
        // If an ISO slot was selected, use the slot booking API
        if (session.slotIso || session.slot) {
          const res = await counsellingApi.createBooking({
            slot: session.slotIso || session.slot,
            mobile: cleanedMobile,
            message: session.notes || `${session.collegeName || "Counselling"} - ${session.time || "Scheduled Session"}`,
            comparisonId: session.comparisonId ? Number(session.comparisonId) : null,
          });

          if (res?.success) {
            apiData = res.data;
          }
        } else {
          // Fallback to legacy request if no specific slot chosen
          const futureDate = new Date(Date.now() + 48 * 3600 * 1000);
          const isoSlot = futureDate.toISOString();
          const res = await counsellingApi.create({
            mobile: cleanedMobile,
            preferredSlot: isoSlot,
            message: `${session.collegeName || "Admission Counselling"} - ${session.notes || "General consultation"}`,
          });
          if (res?.success) {
            apiData = res.data;
          }
        }
      } catch (err) {
        // Rethrow rate-limit (429) or slot-conflict (409) so modal shows appropriate banner
        throw err;
      }
    }

    const newSession = {
      id: apiData?.id ? `bk-${apiData.id}` : `bk-${Date.now()}`,
      status: apiData?.status ? apiData.status.toUpperCase() : "Confirmed",
      meetLink: `https://meet.google.com/cc-consult-${apiData?.id || Math.floor(Math.random() * 8999 + 1000)}`,
      counsellorName: apiData?.counsellor?.name || session.counsellorName || "Senior Admissions Mentor",
      ...session,
      backendData: apiData,
    };

    setBookedSessions((prev) => [newSession, ...prev]);
    fetchUserData();
    showToast("Counselling session successfully booked! Check your Dashboard.", "success");
    return newSession;
  };

  // Cancel booking session via backend
  const cancelBookingSession = async (bookingId) => {
    try {
      const res = await counsellingApi.cancelBooking(bookingId);
      if (res?.success) {
        showToast("Booking cancelled. The slot has been released.", "info");
        fetchUserData();
        return { success: true, booking: res.data };
      }
    } catch (err) {
      showToast(err.message || "Failed to cancel booking", "warning");
      throw err;
    }
  };

  // Delete comparison from backend and local
  const deleteComparison = async (id) => {
    const numId = Number(id);
    if (!isNaN(numId) && getToken()) {
      try {
        await meApi.deleteComparison(numId);
      } catch (err) {
        console.warn("Backend delete comparison error:", err.message);
      }
    }
    setBackendComparisons((prev) => prev.filter((item) => item.id !== id && item.id !== numId));
    showToast("Comparison removed from your saved list", "info");
  };

  const toggleWishlist = (collegeId) => {
    const exists = wishlist.includes(collegeId);
    const col = COLLEGES.find((c) => c.id === collegeId);
    if (exists) {
      setWishlist((prev) => prev.filter((id) => id !== collegeId));
      showToast(`Removed ${col ? col.shortName : "College"} from wishlist`, "info");
    } else {
      setWishlist((prev) => [...prev, collegeId]);
      showToast(`Saved ${col ? col.shortName : "College"} to your wishlist!`, "success");
    }
  };

  const isWishlisted = (collegeId) => wishlist.includes(collegeId);

  return (
    <AppContext.Provider
      value={{
        compareList,
        setCompareList,
        addToCompare,
        removeFromCompare,
        clearCompare,
        isInCompare,
        isCompareTrayOpen,
        setIsCompareTrayOpen,
        authModalOpen,
        authModalTab,
        setAuthModalTab,
        authModalReason,
        setAuthModalReason,
        pendingCompareUrl,
        setPendingCompareUrl,
        triggerCompare,
        openAuthModal,
        closeAuthModal,
        currentUser,
        setCurrentUser,
        loginUser,
        registerUser,
        loginDemoUser,
        logoutUser,
        updateUserProfile,
        isLoadingAuth,
        authInitialized,
        counsellingModalOpen,
        counsellingTargetCollege,
        openCounsellingModal,
        closeCounsellingModal,
        bookedSessions,
        bookSession,
        backendComparisons,
        backendConsultations,
        backendBookings,
        cancelBookingSession,
        deleteComparison,
        wishlist,
        toggleWishlist,
        isWishlisted,
        toast,
        showToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
