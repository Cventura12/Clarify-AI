import "./globals.css";
import type { ReactNode } from "react";
import Sidebar from "@/components/Sidebar";
import { Manrope, Sora } from "next/font/google";

const display = Sora({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700"],
});

const body = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
});

export const metadata = {
  title: "Clarify AI",
  description: "Personal execution layer",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${body.variable} ${display.variable}`}>
      <body className="min-h-screen bg-[var(--app-bg)] font-body text-[var(--text)] antialiased">
        <div className="flex min-h-screen flex-col lg:flex-row">
          <Sidebar />
          <main className="relative flex-1 overflow-hidden bg-[var(--app-main-bg)]">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -top-24 right-[-8rem] h-80 w-80 rounded-full bg-[var(--accent)]/20 blur-[120px]" />
              <div className="absolute bottom-[-12rem] left-[-10rem] h-96 w-96 rounded-full bg-[var(--accent-2)]/18 blur-[140px]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.6),transparent_55%)]" />
            </div>
            <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-6 sm:px-6 sm:py-8 md:px-10 md:py-12">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
