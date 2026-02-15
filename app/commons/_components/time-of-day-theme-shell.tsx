"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import schedule from "@/data/nat-commons-background-time-schedule.json";

type CommonsThemeName = keyof typeof schedule.theme_definitions;

const THEME_TO_BACKGROUND: Record<CommonsThemeName, string> = {
  midnight: "/backgrounds/nat-commons/midnight-background-nat-commons.png.png",
  night: "/backgrounds/nat-commons/night-background-nat-commons.png.png",
  dawn: "/backgrounds/nat-commons/dawn-background-nat-commons.png.png",
  morning: "/backgrounds/nat-commons/morning-background-nat-commons.png.png",
  midday: "/backgrounds/nat-commons/midday-background-nat-commons.png.png",
  afternoon:
    "/backgrounds/nat-commons/afternoon-background-nat-commons.png.png",
  dusk: "/backgrounds/nat-commons/dusk-background-nat-commons.png.png",
  evening: "/backgrounds/nat-commons/evening-background-nat-commons.png.png",
};

const FADE_DURATION_MS = 8000;

function getThemeForDate(date: Date): CommonsThemeName {
  return schedule.hour_to_theme[
    `${date.getHours()}` as keyof typeof schedule.hour_to_theme
  ] as CommonsThemeName;
}

function msUntilNextHour(date: Date): number {
  const nextHour = new Date(date);
  nextHour.setMinutes(0, 0, 0);
  nextHour.setHours(nextHour.getHours() + 1);
  return Math.max(1000, nextHour.getTime() - date.getTime());
}

export function TimeOfDayThemeShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const useClearBackground = pathname?.startsWith("/commons/dm") ?? false;
  const initialTheme = useMemo(() => getThemeForDate(new Date()), []);
  const [currentTheme, setCurrentTheme] =
    useState<CommonsThemeName>(initialTheme);
  const [previousTheme, setPreviousTheme] = useState<CommonsThemeName | null>(
    null
  );
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    let hourTimer: ReturnType<typeof setTimeout> | undefined;
    let fadeTimer: ReturnType<typeof setTimeout> | undefined;

    const scheduleNextCheck = () => {
      const now = new Date();
      hourTimer = setTimeout(() => {
        const nextTheme = getThemeForDate(new Date());
        setCurrentTheme((activeTheme) => {
          if (activeTheme === nextTheme) {
            return activeTheme;
          }

          setPreviousTheme(activeTheme);
          setIsFading(true);

          fadeTimer = setTimeout(() => {
            setPreviousTheme(null);
            setIsFading(false);
          }, FADE_DURATION_MS);

          return nextTheme;
        });

        scheduleNextCheck();
      }, msUntilNextHour(now));
    };

    scheduleNextCheck();

    return () => {
      if (hourTimer) {
        clearTimeout(hourTimer);
      }

      if (fadeTimer) {
        clearTimeout(fadeTimer);
      }
    };
  }, []);

  const currentBackground = THEME_TO_BACKGROUND[currentTheme];
  const previousBackground = previousTheme
    ? THEME_TO_BACKGROUND[previousTheme]
    : null;

  return (
    <div className="nat-commons-theme-shell relative min-h-dvh overflow-hidden">
      {useClearBackground ? (
        <div
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(180deg,#d0e8f7_0%,#a8d0ea_48%,#93c2e2_100%)]"
        />
      ) : (
        <div
          aria-hidden
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${currentBackground})` }}
        />
      )}

      {!useClearBackground && previousBackground ? (
        <div
          aria-hidden
          className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-[8000ms] ${
            isFading ? "opacity-0" : "opacity-100"
          }`}
          style={{ backgroundImage: `url(${previousBackground})` }}
        />
      ) : null}

      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 ${
          useClearBackground
            ? "bg-gradient-to-b from-white/45 via-transparent to-sky-900/10"
            : "bg-gradient-to-b from-black/30 via-black/20 to-black/30"
        }`}
      />

      <div className="nat-commons-theme-content relative z-10">{children}</div>
    </div>
  );
}
