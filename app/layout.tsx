import type { Metadata } from "next";
import { Geist, Geist_Mono, Press_Start_2P } from "next/font/google";
import { Toaster } from "sonner";
import { AudioFocusProvider } from "@/components/audio-focus-provider";
import { PwaRegister } from "@/components/pwa-register";
import { SpotifyPlaybackProvider } from "@/components/spotify/spotify-playback-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { EdgeSwipeNav } from "@/src/components/EdgeSwipeNav";
import { Analytics } from "@vercel/analytics/next";

import "./globals.css";
import { SessionProvider } from "next-auth/react";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
const metadataBase =
  siteUrl && URL.canParse(siteUrl) ? new URL(siteUrl) : undefined;

export const metadata: Metadata = {
  ...(metadataBase ? { metadataBase } : {}),
  title:
    "Brooks AI HUB - A Mobile AI Chat and Marketplace for apps and games and media",
  description:
    "Brooks AI HUB - A Mobile AI Chat and Marketplace for apps and games and media",
  icons: {
    icon: [
      { url: "/icons/app-icon.png", sizes: "2048x2048", type: "image/png" },
    ],
    apple: [{ url: "/icons/app-icon.png", sizes: "2048x2048" }],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

const geist = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist-mono",
});

const pressStart = Press_Start_2P({
  subsets: ["latin"],
  display: "swap",
  weight: "400",
  variable: "--font-press-start",
});

const LIGHT_THEME_COLOR = "hsl(0 0% 100%)";
const DARK_THEME_COLOR = "hsl(240deg 10% 3.92%)";
const THEME_COLOR_SCRIPT = `\
(function() {
  var html = document.documentElement;
  var meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    document.head.appendChild(meta);
  }
  function updateThemeColor() {
    var isDark = html.classList.contains('dark');
    meta.setAttribute('content', isDark ? '${DARK_THEME_COLOR}' : '${LIGHT_THEME_COLOR}');
  }
  var observer = new MutationObserver(updateThemeColor);
  observer.observe(html, { attributes: true, attributeFilter: ['class'] });
  updateThemeColor();
})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      className={`${geist.variable} ${geistMono.variable} ${pressStart.variable}`}
      // `next-themes` injects an extra classname to the body element to avoid
      // visual flicker before hydration. Hence the `suppressHydrationWarning`
      // prop is necessary to avoid the React hydration mismatch warning.
      // https://github.com/pacocoursey/next-themes?tab=readme-ov-file#with-app
      lang="en"
      suppressHydrationWarning
    >
      <head>
        <meta content="yes" name="apple-mobile-web-app-capable" />
        <meta content="default" name="apple-mobile-web-app-status-bar-style" />
        <link
          href="/icons/app-icon.png"
          rel="apple-touch-icon"
          sizes="2048x2048"
        />
        <script
          // biome-ignore lint/security/noDangerouslySetInnerHtml: "Required"
          dangerouslySetInnerHTML={{
            __html: THEME_COLOR_SCRIPT,
          }}
        />
      </head>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          disableTransitionOnChange
          enableSystem
        >
          <PwaRegister />
          <Toaster position="top-center" />
          <EdgeSwipeNav />
          <SessionProvider>
            <AudioFocusProvider>
              <SpotifyPlaybackProvider>{children}</SpotifyPlaybackProvider>
            </AudioFocusProvider>
          </SessionProvider>
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
