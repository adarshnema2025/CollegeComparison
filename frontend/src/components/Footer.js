"use client";

import React from "react";
import Link from "next/link";
import { Scale, ShieldCheck, Heart, Mail, Phone, ExternalLink } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#0B1120] text-slate-300 border-t border-slate-800">
      {/* Top Banner / Trust Bar */}
      <div className="border-b border-slate-800/80 bg-slate-900/60 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <p className="text-slate-300">
              <span className="font-bold text-white">100% Verified NIRF & JoSAA Data:</span>{" "}
              We ingest certified Ministry of Education reports. No sponsored ranking placements.
            </p>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Student Helpline: +91 (800) 890-4210</span>
            <span>•</span>
            <span>counsel@collegecomparison.in</span>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Brand info */}
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow">
                <Scale className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-white text-lg tracking-tight">
                College<span className="text-indigo-400">Comparison</span>
              </span>
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              The high-conversion discovery & head-to-head program comparison engine built for Indian aspirants. Designed with Apple & Linear precision to eliminate cluttered ads and biased rankings.
            </p>
            <div className="flex items-center gap-3 pt-2 text-xs text-slate-400">
              <span className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 font-medium">
                JoSAA 2024
              </span>
              <span className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 font-medium">
                JAC Delhi
              </span>
              <span className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 font-medium">
                BITSAT Ready
              </span>
            </div>
          </div>

          {/* Popular Comparisons */}
          <div>
            <h4 className="text-xs uppercase font-extrabold tracking-wider text-white mb-3">
              Hot Head-to-Head
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link href="/compare" className="hover:text-indigo-400 transition-colors">
                  IIT Bombay vs IIT Delhi
                </Link>
              </li>
              <li>
                <Link href="/compare" className="hover:text-indigo-400 transition-colors">
                  BITS Pilani vs IIIT Hyderabad
                </Link>
              </li>
              <li>
                <Link href="/compare" className="hover:text-indigo-400 transition-colors">
                  IIT Madras vs NIT Trichy
                </Link>
              </li>
              <li>
                <Link href="/compare" className="hover:text-indigo-400 transition-colors">
                  DTU Delhi vs VIT Vellore
                </Link>
              </li>
              <li>
                <Link href="/compare" className="hover:text-indigo-400 transition-colors">
                  IIT Roorkee vs IIT Guwahati
                </Link>
              </li>
            </ul>
          </div>

          {/* Directory by Stream */}
          <div>
            <h4 className="text-xs uppercase font-extrabold tracking-wider text-white mb-3">
              Explore Colleges
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link href="/colleges" className="hover:text-indigo-400 transition-colors">
                  Top Engineering Colleges (B.Tech)
                </Link>
              </li>
              <li>
                <Link href="/colleges" className="hover:text-indigo-400 transition-colors">
                  Elite IIMs & MBA Institutes
                </Link>
              </li>
              <li>
                <Link href="/colleges" className="hover:text-indigo-400 transition-colors">
                  Computer Science (CSE) Cutoffs
                </Link>
              </li>
              <li>
                <Link href="/colleges" className="hover:text-indigo-400 transition-colors">
                  Delhi NCR Tech Institutions
                </Link>
              </li>
              <li>
                <Link href="/colleges" className="hover:text-indigo-400 transition-colors">
                  Private Deemed Universities
                </Link>
              </li>
            </ul>
          </div>

          {/* Student Tools */}
          <div>
            <h4 className="text-xs uppercase font-extrabold tracking-wider text-white mb-3">
              Tools & Guidance
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link href="/courses" className="hover:text-indigo-400 transition-colors">
                  Explore Colleges by Course
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-indigo-400 transition-colors">
                  Student Shortlist & Predictor
                </Link>
              </li>
              <li>
                <Link href="/colleges" className="hover:text-indigo-400 transition-colors">
                  NIRF Rank Matrix 2024
                </Link>
              </li>
              <li>
                <Link href="/compare" className="hover:text-indigo-400 transition-colors">
                  Multi-Factor ROI Calculator
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-indigo-400 transition-colors">
                  Verified Placement Data
                </Link>
              </li>
              <li>
                <span className="text-emerald-400 font-semibold cursor-pointer">
                  Book Counselling Session
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© 2025 CollegeComparison. Made for Indian students with pride.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-slate-300 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-slate-300 cursor-pointer">Terms of Service</span>
            <span className="hover:text-slate-300 cursor-pointer">NIRF Audit Methodology</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
