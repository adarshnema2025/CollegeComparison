"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import { Scale, X, ArrowRight, Trash2, ChevronDown, ChevronUp, Plus } from "lucide-react";

export default function CompareTray() {
  const {
    compareList,
    removeFromCompare,
    clearCompare,
    isCompareTrayOpen,
    setIsCompareTrayOpen,
    triggerCompare,
  } = useApp();

  const [minimized, setMinimized] = useState(false);

  if (compareList.length === 0 || !isCompareTrayOpen) {
    return null;
  }

  // 2 total comparison slots (Head-to-Head)
  const slots = [0, 1];

  const compareHref =
    compareList.length >= 2
      ? `/compare?c1=${encodeURIComponent(compareList[0]?.slug || compareList[0]?.id)}&c2=${encodeURIComponent(
          compareList[1]?.slug || compareList[1]?.id
        )}`
      : "/compare";

  if (minimized) {
    return (
      <div className="fixed bottom-4 right-4 z-40 animate-fade-in">
        <button
          onClick={() => setMinimized(false)}
          className="flex items-center gap-3 px-4 py-2.5 rounded-full bg-slate-900/95 border border-slate-700 text-white shadow-2xl hover:border-indigo-500 transition-all backdrop-blur-md"
        >
          <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold">
            {compareList.length}
          </div>
          <span className="text-xs font-semibold tracking-tight">
            Compare Tray Active
          </span>
          <ChevronUp className="w-4 h-4 text-slate-400" />
        </button>
      </div>
    );
  }

  return (
    <aside aria-label="Compare Tray" className="fixed bottom-0 inset-x-0 z-40 p-2 sm:p-4 pointer-events-none">
      <div className="max-w-5xl mx-auto bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-2xl p-3 sm:p-4 text-white pointer-events-auto animate-slide-up">
        {/* Tray Header Bar */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-bold text-slate-200 tracking-wide uppercase text-[11px]">
              Comparison Arena Tray
            </span>
            <span className="text-slate-400 font-medium">
              ({compareList.length}/2 selected)
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={clearCompare}
              className="text-slate-400 hover:text-red-400 font-medium transition-colors flex items-center gap-1 text-[11px]"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear All</span>
            </button>
            <button
              onClick={() => setMinimized(true)}
              className="text-slate-400 hover:text-white p-1 rounded transition-colors"
              title="Minimize tray"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Slot Grid + Action */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* 2 slots */}
          <div className="grid grid-cols-2 gap-2 flex-1">
            {slots.map((idx) => {
              const college = compareList[idx];
              if (college) {
                return (
                  <div
                    key={college.id}
                    className="relative bg-slate-800/90 border border-slate-700 rounded-xl p-2.5 flex items-center gap-2.5 group hover:border-slate-600 transition-colors"
                  >
                    <div
                      className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center font-bold text-xs ${college.avatarBg}`}
                    >
                      {college.code || college.shortName.slice(0, 3)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-white truncate leading-tight">
                        {college.shortName}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-emerald-400 font-bold">
                          {college.stats?.medianSalary || "Top Tier"}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          #{college.nirfRank}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromCompare(college.id)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-slate-700 hover:bg-red-600 text-slate-300 hover:text-white flex items-center justify-center text-xs shadow transition-colors"
                      title={`Remove ${college.shortName}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              }
              return (
                <Link
                  key={`empty-${idx}`}
                  href="/colleges"
                  className="border border-dashed border-slate-700 hover:border-indigo-500 rounded-xl p-2.5 flex items-center justify-center gap-1.5 text-slate-500 hover:text-indigo-400 transition-all group bg-slate-800/30"
                >
                  <Plus className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-medium">Add College #{idx + 1}</span>
                </Link>
              );
            })}
          </div>

          {/* CTA Compare Button */}
          <div className="flex items-center gap-2 shrink-0">
            {compareList.length >= 2 ? (
              <button
                type="button"
                onClick={() => triggerCompare(compareHref)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm tracking-tight flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all hover:gap-3 cursor-pointer"
              >
                <span>Compare 2 Colleges Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 text-slate-400 text-xs font-medium text-center flex items-center justify-center gap-2 border border-slate-700">
                <Scale className="w-3.5 h-3.5" />
                <span>Select {2 - compareList.length} more to unlock head-to-head comparison</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
