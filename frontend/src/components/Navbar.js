"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/context/AppContext";
import {
  GraduationCap,
  Scale,
  Sparkles,
  User,
  Calendar,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Layers,
  Search,
} from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const {
    compareList,
    currentUser,
    openAuthModal,
    logoutUser,
    openCounsellingModal,
    triggerCompare,
  } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const isActive = (path) => pathname === path;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-md shadow-indigo-500/10 group-hover:scale-105 transition-transform">
            <Scale className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-extrabold text-slate-900 text-lg tracking-tight">
                College<span className="text-indigo-600">Comparison</span>
              </span>
              <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-indigo-200/60 uppercase tracking-wider">
                IN
              </span>
            </div>
            <span className="text-[11px] text-slate-600 font-medium tracking-tight">
              Honest Data & Head-to-Head Arena
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          <Link
            href="/colleges"
            className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
              isActive("/colleges")
                ? "text-indigo-600 bg-indigo-50/80"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
            }`}
          >
            Colleges Directory
          </Link>

          <Link
            href="/courses"
            className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
              isActive("/courses")
                ? "text-indigo-600 bg-indigo-50/80"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
            }`}
          >
            Explore Courses
          </Link>

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
            className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer ${
              isActive("/compare")
                ? "text-indigo-600 bg-indigo-50/80"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
            }`}
          >
            <span>Compare Arena</span>
            {compareList.length > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-indigo-600 rounded-full animate-pulse">
                {compareList.length}
              </span>
            )}
          </button>

          <button
            onClick={() => openCounsellingModal()}
            className="px-3 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 transition-colors flex items-center gap-1.5"
          >
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span>1-on-1 Counselling</span>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
              Free
            </span>
          </button>

          <Link
            href="/dashboard"
            className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
              isActive("/dashboard")
                ? "text-indigo-600 bg-indigo-50/80"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
            }`}
          >
            Student Hub
          </Link>
        </nav>

        {/* Action Controls & Auth */}
        <div className="hidden md:flex items-center gap-3">
          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2.5 p-1.5 pr-3 rounded-full border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 transition-all text-left"
              >
                <div className="w-8 h-8 rounded-full bg-slate-900 text-indigo-300 font-bold text-xs flex items-center justify-center shadow-inner">
                  {currentUser.avatarInitials ||
                    (currentUser.name
                      ? currentUser.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()
                      : "ST")}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-800 leading-tight">
                    {currentUser.name}
                  </span>
                  <span className="text-[10px] text-slate-600 font-medium">
                    {currentUser.jeeAdvRank ? `AIR ${currentUser.jeeAdvRank}` : currentUser.targetDegree || "Student"}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Dropdown Menu */}
              {profileDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-fade-in"
                  onMouseLeave={() => setProfileDropdownOpen(false)}
                >
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-xs font-semibold text-slate-900">{currentUser.name}</p>
                    <p className="text-[11px] text-slate-600 truncate">{currentUser.email}</p>
                    <div className="mt-1.5 inline-block text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Target: {currentUser.targetDegree}
                    </div>
                  </div>

                  <Link
                    href="/dashboard"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="block px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600"
                  >
                    My Dashboard & Saved Colleges
                  </Link>

                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      openCounsellingModal();
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600 flex items-center justify-between"
                  >
                    <span>My Counselling Sessions</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  </button>

                  <div className="border-t border-slate-100 my-1"></div>

                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      logoutUser();
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => openAuthModal("login")}
                className="px-3.5 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Log In
              </button>
              <button
                onClick={() => openCounsellingModal()}
                className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm shadow-indigo-600/30 transition-all flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>Book Free Call</span>
              </button>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden items-center gap-2">
          {compareList.length > 0 && (
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
              className="p-2 text-indigo-600 bg-indigo-50 rounded-lg flex items-center gap-1 text-xs font-bold cursor-pointer"
            >
              <Scale className="w-4 h-4" />
              <span>{compareList.length}</span>
            </button>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-700 hover:bg-slate-100 rounded-lg"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3">
          <Link
            href="/colleges"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-semibold text-slate-800 hover:bg-slate-100"
          >
            Colleges Directory
          </Link>
          <Link
            href="/courses"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-semibold text-slate-800 hover:bg-slate-100"
          >
            Explore Courses
          </Link>
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
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
            className="w-full text-left flex items-center justify-between px-3 py-2 rounded-lg text-base font-semibold text-slate-800 hover:bg-slate-100 cursor-pointer"
          >
            <span>Compare Arena</span>
            {compareList.length > 0 && (
              <span className="px-2 py-0.5 text-xs font-bold text-white bg-indigo-600 rounded-full">
                {compareList.length} Selected
              </span>
            )}
          </button>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              openCounsellingModal();
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-base font-semibold text-emerald-700 hover:bg-emerald-50 flex items-center justify-between"
          >
            <span>1-on-1 Counselling</span>
            <span className="text-xs bg-emerald-100 px-2 py-0.5 rounded-full font-bold">
              Free Session
            </span>
          </button>
          <Link
            href="/dashboard"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-semibold text-slate-800 hover:bg-slate-100"
          >
            Student Hub & Shortlist
          </Link>

          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            {currentUser ? (
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div>
                  <p className="text-sm font-bold text-slate-900">{currentUser.name}</p>
                  <p className="text-xs text-slate-500">{currentUser.email}</p>
                </div>
                <button
                  onClick={() => {
                    logoutUser();
                    setMobileMenuOpen(false);
                  }}
                  className="text-xs font-semibold text-red-600 p-2"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openAuthModal("login");
                  }}
                  className="w-full py-2.5 text-sm font-semibold border border-slate-300 rounded-lg text-slate-700 text-center"
                >
                  Log In
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openAuthModal("signup");
                  }}
                  className="w-full py-2.5 text-sm font-semibold bg-indigo-600 text-white rounded-lg text-center"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
