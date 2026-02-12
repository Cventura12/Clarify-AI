"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import ThemeToggle from "./ThemeToggle";

const workflowItems = [
  { label: "Dashboard", href: "/", icon: "grid" },
  { label: "Requests", href: "/requests", icon: "list" },
  { label: "Integrations", href: "/integrations", icon: "plug" },
];

const utilityItems = [
  { label: "Settings", href: "/settings", icon: "settings" },
];

const iconClass = "h-4 w-4";

const Icon = ({ name }: { name: string }) => {
  switch (name) {
    case "grid":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
      );
    case "spark":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 3l2.2 5.2L19.5 10l-5.3 1.9L12 17l-2.2-5.1L4.5 10l5.3-1.8L12 3z" />
        </svg>
      );
    case "history":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 12a9 9 0 1 0 9-9" />
          <path d="M3 5v5h5" />
          <path d="M12 7v5l3 2" />
        </svg>
      );
    case "clock":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      );
    case "clipboard":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="5" y="4" width="14" height="16" rx="2" />
          <path d="M9 4.5h6" />
          <path d="M9 9h6" />
          <path d="M9 13h6" />
        </svg>
      );
    case "memory":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="8" />
          <path d="M12 8v4l2 2" />
        </svg>
      );
    case "nodes":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="6" cy="12" r="2" />
          <circle cx="18" cy="6" r="2" />
          <circle cx="18" cy="18" r="2" />
          <path d="M8 12h6" />
          <path d="M16 7.5l-6 3.5" />
          <path d="M16 16.5l-6-3.5" />
        </svg>
      );
    case "plug":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M7 3v6" />
          <path d="M17 3v6" />
          <path d="M5 9h14" />
          <path d="M12 9v6a4 4 0 0 1-4 4H7" />
          <path d="M12 9v6a4 4 0 0 0 4 4h1" />
        </svg>
      );
    case "form":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="5" y="4" width="14" height="16" rx="2" />
          <path d="M8 8h8" />
          <path d="M8 12h8" />
          <path d="M8 16h5" />
        </svg>
      );
    case "file":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M6 3h7l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
          <path d="M13 3v6h6" />
        </svg>
      );
    case "shield":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 3l7 3v6c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6l7-3z" />
          <path d="M9.5 12.5l2 2 4-4" />
        </svg>
      );
    case "list":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M8 6h12" />
          <path d="M8 12h12" />
          <path d="M8 18h12" />
          <circle cx="4" cy="6" r="1" />
          <circle cx="4" cy="12" r="1" />
          <circle cx="4" cy="18" r="1" />
        </svg>
      );
    case "settings":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 0 1-1.4 3.4h-2a1.7 1.7 0 0 0-1.6 1.2l-.1.2a2 2 0 0 1-3.6 0l-.1-.2a1.7 1.7 0 0 0-1.6-1.2h-2A2 2 0 0 1 4 17.1l.1-.1A1.7 1.7 0 0 0 4.4 15a1.7 1.7 0 0 0-.7-1.5l-.2-.1a2 2 0 0 1 0-3.6l.2-.1A1.7 1.7 0 0 0 4.4 9a1.7 1.7 0 0 0-.3-1.9l-.1-.1A2 2 0 0 1 5.4 3.6h2a1.7 1.7 0 0 0 1.6-1.2l.1-.2a2 2 0 0 1 3.6 0l.1.2a1.7 1.7 0 0 0 1.6 1.2h2A2 2 0 0 1 20 6.9l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 .7 1.5l.2.1a2 2 0 0 1 0 3.6l-.2.1a1.7 1.7 0 0 0-.7 1.5z" />
        </svg>
      );
    default:
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v4l2 2" />
        </svg>
      );
  }
};

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const hasAnimatedRef = useRef(false);
  const isReducedMotion =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const workflow = useMemo(
    () =>
      workflowItems.map((item) => ({
        ...item,
        isActive: item.href === "/" ? pathname === "/" : pathname.startsWith(item.href),
      })),
    [pathname]
  );

  const utility = useMemo(
    () =>
      utilityItems.map((item) => ({
        ...item,
        isActive: item.href === "/" ? pathname === "/" : pathname.startsWith(item.href),
      })),
    [pathname]
  );

  useEffect(() => {
    if (!sidebarRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
    if (!isDesktop) return;
    if (hasAnimatedRef.current) return;

    const context = gsap.context(() => {
      gsap.from(sidebarRef.current, {
        x: -12,
        opacity: 0,
        duration: 0.45,
        ease: "power2.out",
      });
    }, sidebarRef);

    hasAnimatedRef.current = true;
    return () => context.revert();
  }, []);

  useEffect(() => {
    if (!sidebarRef.current) return;
    if (!isOpen) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
    if (isDesktop) return;

    const context = gsap.context(() => {
      gsap.fromTo(
        sidebarRef.current,
        { x: -320, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.35, ease: "power3.out" }
      );

      if (navRef.current) {
        const items = navRef.current.querySelectorAll("[data-nav-item]");
        gsap.fromTo(
          items,
          { x: -12, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.3, stagger: 0.06, ease: "power2.out", delay: 0.05 }
        );
      }
    }, sidebarRef);

    return () => context.revert();
  }, [isOpen]);

  const closeSidebar = () => {
    if (!sidebarRef.current) {
      setIsOpen(false);
      return;
    }
    if (isReducedMotion) {
      setIsOpen(false);
      return;
    }
    gsap.to(sidebarRef.current, {
      x: -320,
      opacity: 0,
      duration: 0.25,
      ease: "power3.in",
      onComplete: () => setIsOpen(false),
    });
  };

  return (
    <>
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-[var(--border)] bg-[var(--app-main-bg)] px-4 py-3 lg:hidden">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-[var(--muted)]"
        >
          Menu
        </button>
        <img src="/clarify-logo.svg" alt="Clarify logo" className="h-7 w-auto" />
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-700">
          Ready
        </span>
      </div>

      {isOpen ? (
        <div
          role="presentation"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={closeSidebar}
        />
      ) : null}

      <aside
        ref={sidebarRef}
        className={`fixed inset-y-0 left-0 z-50 w-60 transform border-r border-white/10 bg-gradient-to-b from-[#161820] via-[#11131a] to-[#0d0f14] text-white transition lg:static lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-start justify-between px-6 py-5">
          <img src="/clarify-logo.svg" alt="Clarify logo" className="h-10 w-auto" />
          <button
            type="button"
            onClick={closeSidebar}
            className="rounded-full border border-white/10 px-2 py-1 text-xs text-white/70 lg:hidden"
          >
            Close
          </button>
        </div>
        <div className="h-px w-full bg-white/10" />

        <div className="mx-4 mt-4 rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-xs">
          <p className="text-[10px] uppercase tracking-[0.3em] text-white/40">Agent</p>
          <p className="mt-1 font-medium text-white/80">Ready to interpret requests.</p>
        </div>

        <button
          type="button"
          className="mx-4 mt-3 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300"
        >
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          Agent ready
        </button>

        <nav ref={navRef} className="flex flex-col gap-1 px-4 py-6 text-sm">
          <p className="px-3 pb-2 text-[10px] uppercase tracking-[0.28em] text-white/45">Workflow</p>
          {workflow.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              data-nav-item
              className={`flex items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 transition ${
                item.isActive
                  ? "border-white/25 bg-white/18 text-white shadow-[0_10px_22px_rgba(8,8,8,0.36)]"
                  : "text-white/78 hover:border-white/20 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon name={item.icon} />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="mt-auto border-t border-white/10 px-4 py-4">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <p className="px-3 text-[10px] uppercase tracking-[0.28em] text-white/45">System</p>
              {utility.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  data-nav-item
                  className={`flex items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-sm transition ${
                    item.isActive
                      ? "border-white/25 bg-white/16 text-white"
                      : "text-white/72 hover:border-white/20 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon name={item.icon} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              ))}
            </div>

            <ThemeToggle />

            <div>
              <p className="text-[10px] uppercase tracking-[0.28em] text-white/45">Connection health</p>
              <div className="mt-2 space-y-1.5 text-xs">
                <div className="flex items-center justify-between rounded-lg border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1.5">
                  <span className="inline-flex items-center gap-2 text-emerald-200">
                    <span className="h-2 w-2 rounded-full bg-emerald-300" />
                    Gmail
                  </span>
                  <span className="text-emerald-300">Live</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1.5">
                  <span className="inline-flex items-center gap-2 text-emerald-200">
                    <span className="h-2 w-2 rounded-full bg-emerald-300" />
                    Calendar
                  </span>
                  <span className="text-emerald-300">Live</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5">
                  <span className="inline-flex items-center gap-2 text-white/75">
                    <span className="h-2 w-2 rounded-full bg-slate-400" />
                    Notion
                  </span>
                  <span className="text-white/55">Pending</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
