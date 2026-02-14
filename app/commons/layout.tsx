import { TimeOfDayThemeShell } from "@/app/commons/_components/time-of-day-theme-shell";

export default function CommonsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <TimeOfDayThemeShell>{children}</TimeOfDayThemeShell>;
}
