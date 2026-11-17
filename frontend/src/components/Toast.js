"use client";

import React from "react";
import { useApp } from "@/context/AppContext";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";

export default function Toast() {
  const { toast } = useApp();

  if (!toast.visible) return null;

  const bgConfig = {
    success: "bg-emerald-900/90 border-emerald-500/40 text-emerald-100",
    warning: "bg-amber-950/90 border-amber-500/40 text-amber-100",
    info: "bg-slate-900/95 border-slate-700 text-slate-100",
  }[toast.type || "info"];

  const iconConfig = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
    info: <Info className="w-5 h-5 text-indigo-400 shrink-0" />,
  }[toast.type || "info"];

  return (
    <div className="fixed top-5 right-5 z-50 animate-fade-in max-w-md">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl backdrop-blur-md ${bgConfig}`}
      >
        {iconConfig}
        <p className="text-sm font-medium tracking-tight pr-2">{toast.message}</p>
      </div>
    </div>
  );
}
