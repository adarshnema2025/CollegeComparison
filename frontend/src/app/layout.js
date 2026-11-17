import { Suspense } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CompareTray from "@/components/CompareTray";
import AuthModal from "@/components/AuthModal";
import CounsellingModal from "@/components/CounsellingModal";
import Toast from "@/components/Toast";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata = {
  title: "CollegeComparison - Head-to-Head College Discovery & Counselling",
  description:
    "Discover, compare Indian engineering & management colleges head-to-head with verified NIRF data, real median placements, and 1-on-1 expert counselling.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${jakarta.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans bg-slate-50 text-slate-900 selection:bg-indigo-500 selection:text-white">
        <AppProvider>
          <Suspense fallback={<div className="h-16 bg-white border-b border-slate-200" />}>
            <Navbar />
          </Suspense>
          <main className="flex-1">{children}</main>
          <Footer />
          <CompareTray />
          <AuthModal />
          <CounsellingModal />
          <Toast />
        </AppProvider>
      </body>
    </html>
  );
}
