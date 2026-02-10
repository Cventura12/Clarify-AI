"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function DashboardMotion({ children }: { children: React.ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!rootRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let hoverCleanup: (() => void) | null = null;

    const context = gsap.context(() => {
      const timeline = gsap.timeline();

      timeline
        .addLabel("hero")
        .from("[data-motion='hero-kicker']", {
          opacity: 0,
          y: 12,
          duration: 0.4,
          ease: "power2.out",
        })
        .from("[data-motion='hero-title']", {
          opacity: 0,
          y: 18,
          duration: 0.6,
          ease: "power2.out",
          onStart: () => {
            rootRef.current?.setAttribute("data-hero-state", "animating");
          },
          onComplete: () => {
            rootRef.current?.setAttribute("data-hero-state", "done");
          },
        })
        .from("[data-motion='hero-pills']", {
          opacity: 0,
          y: 12,
          duration: 0.45,
          ease: "power2.out",
        })
        .from("[data-motion='hero-command']", {
          opacity: 0,
          y: 16,
          duration: 0.55,
          ease: "power2.out",
        })
        .addLabel("panels", "+=0.1")
        .from(
          "[data-motion='panel']",
          {
            opacity: 0,
            y: 16,
            duration: 0.6,
            ease: "power2.out",
            stagger: 0.12,
          },
          "panels"
        )
        .addLabel("cards", "+=0.05")
        .from(
          "[data-motion='card']",
          {
            opacity: 0,
            y: 14,
            duration: 0.5,
            ease: "power3.out",
            stagger: 0.07,
          },
          "cards"
        );

      const pulseItems = gsap.utils.toArray<HTMLElement>("[data-signal-pulse='true']");
      if (pulseItems.length > 0) {
        pulseItems.forEach((item, index) => {
          const baseShadow = window.getComputedStyle(item).boxShadow;
          gsap.to(item, {
            keyframes: [
              { scale: 1.01, boxShadow: "0 18px 36px rgba(99, 102, 241, 0.18)" },
              { scale: 1, boxShadow: baseShadow },
            ],
            duration: 0.9,
            ease: "power2.out",
            delay: timeline.duration() + 0.1 + index * 0.12,
          });
        });
      }

      gsap.to("[data-motion='hero-title']", {
        y: -2,
        repeat: -1,
        yoyo: true,
        duration: 1.6,
        ease: "sine.inOut",
        delay: timeline.duration() + 0.2,
      });

      const orbs = gsap.utils.toArray<HTMLElement>("[data-motion='orb']");
      orbs.forEach((orb, index) => {
        gsap.to(orb, {
          x: index === 0 ? 50 : -40,
          y: index === 0 ? -30 : 45,
          duration: index === 0 ? 34 : 40,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      });

      const cards = gsap.utils.toArray<HTMLElement>("[data-motion='card']");
      const cleanupHover: Array<() => void> = [];
      cards.forEach((card) => {
        const baseShadow = window.getComputedStyle(card).boxShadow;
        const handleEnter = () => {
          gsap.to(card, {
            y: -4,
            boxShadow: "0 20px 46px rgba(15, 23, 42, 0.12)",
            duration: 0.2,
            ease: "power2.out",
          });
        };
        const handleLeave = () => {
          gsap.to(card, {
            y: 0,
            boxShadow: baseShadow,
            duration: 0.25,
            ease: "power2.out",
          });
        };
        card.addEventListener("mouseenter", handleEnter);
        card.addEventListener("mouseleave", handleLeave);
        cleanupHover.push(() => {
          card.removeEventListener("mouseenter", handleEnter);
          card.removeEventListener("mouseleave", handleLeave);
        });
      });

      hoverCleanup = () => {
        cleanupHover.forEach((cleanup) => cleanup());
      };
    }, rootRef);

    return () => {
      hoverCleanup?.();
      context.revert();
    };
  }, []);

  return <div ref={rootRef}>{children}</div>;
}
