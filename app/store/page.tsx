"use client";

import { ArrowLeft, Download, Search } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function StorePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const apps = [
    {
      id: 1,
      name: "BrooksBears",
      path: "/BrooksBears/",
      description: "AI teddy bear companion for ages 13 and up",
      icon: "/icons/brooksbears-appicon.png",
      category: "Entertainment",
      rating: 4.5,
      downloads: "10K+",
      ageRating: "13+",
      routes: [
        { path: "/BrooksBears/", description: "Main chat interface" },
        { path: "/BrooksBears/BenjaminBear/", description: "Benjamin Bear persona" },
      ],
    },
    {
      id: 2,
      name: "MyCarMindATO",
      path: "/MyCarMindATO/",
      description: "Intelligent automotive AI assistant for your vehicle",
      icon: "/icons/mycarmindato-appicon.png",
      category: "Utilities",
      rating: 4.7,
      downloads: "5K+",
      routes: [
        { path: "/MyCarMindATO/", description: "Main interface" },
        { path: "/MyCarMindATO/Driver/", description: "Personal car owners" },
        { path: "/MyCarMindATO/Trucker/", description: "Commercial truck drivers" },
        { path: "/MyCarMindATO/DeliveryDriver/", description: "Delivery/gig drivers" },
        { path: "/MyCarMindATO/Traveler/", description: "Road trip enthusiasts" },
      ],
    },
    {
      id: 3,
      name: "MyFlowerAI",
      path: "/MyFlowerAI/",
      description: "Cannabis tracking and data analysis for harm reduction",
      icon: "/icons/myflowerai-appicon.png",
      category: "Health & Wellness",
      rating: 4.8,
      downloads: "15K+",
      routes: [
        { path: "/MyFlowerAI/", description: "Main interface" },
        { path: "/MyFlowerAI/quiz", description: "Cannabis personality quiz" },
        { path: "/MyFlowerAI/image-gen", description: "Psychedelic art generator" },
      ],
    },
    {
      id: 4,
      name: "NAMC",
      path: "/NAMC/",
      description: "Northern Americana Media Collection - Your curated media library and lore explorer",
      icon: "/icons/namc-appicon.png",
      category: "Media & Entertainment",
      rating: 4.9,
      downloads: "8K+",
      routes: [
        { path: "/NAMC/", description: "Media curator interface" },
      ],
    },
  ];

  const filteredApps = apps.filter((app) =>
    app.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="store-overlay fixed inset-0 z-50 flex flex-col bg-gradient-to-br from-[#140d12] via-[#1a0f16] to-[#120c16]">
      {/* Header */}
      <div className="store-header sticky top-0 z-10 flex items-center gap-4 border-b border-white/10 bg-[#140d12]/95 px-4 py-3 backdrop-blur-sm">
        <button
          aria-label="Go back"
          className="flex h-10 w-10 items-center justify-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white"
          onClick={() => router.back()}
          type="button"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="font-pixel text-lg text-white">ATO Store</h1>
      </div>

      {/* Search Bar */}
      <div className="store-search px-4 py-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input
            className="w-full rounded-full border border-white/20 bg-white/5 py-3 pl-10 pr-4 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:bg-white/10 focus:outline-none"
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search apps..."
            type="text"
            value={searchQuery}
          />
        </div>
      </div>

      {/* App List */}
      <div className="store-content flex-1 overflow-y-auto -webkit-overflow-scrolling-touch touch-pan-y overscroll-behavior-contain px-4 pb-6">
        <div className="space-y-4">
          {filteredApps.map((app) => (
            <div
              className="store-app-card group rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm transition hover:border-white/20 hover:bg-white/10 cursor-pointer"
              key={app.id}
              onClick={() => {
                // Only BrooksBears has a dedicated app page
                if (app.id === 1) {
                  router.push("/brooksbears-app");
                }
              }}
            >
              <div className="flex gap-4">
                {/* App Icon */}
                <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-white/20 to-white/10 shadow-lg overflow-hidden">
                  <Image
                    src={app.icon}
                    alt={`${app.name} icon`}
                    width={64}
                    height={64}
                    className="h-full w-full object-cover"
                    priority={app.id <= 3}
                  />
                </div>

                {/* App Info */}
                <div className="flex flex-1 flex-col justify-center">
                  <h3 className="font-semibold text-white">{app.name}</h3>
                  <p className="mt-0.5 text-xs text-white/60">{app.category}</p>
                  <div className="mt-1 flex items-center gap-3 text-xs text-white/50">
                    <span className="flex items-center gap-1">
                      ⭐ {app.rating}
                    </span>
                    <span>{app.downloads}</span>
                    {app.routes && app.routes.length > 0 && (
                      <span className="flex items-center gap-1">
                        📍 {app.routes.length} {app.routes.length === 1 ? 'route' : 'routes'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Install Button */}
                <div className="flex flex-shrink-0 items-center">
                  <button
                    className="flex h-9 items-center gap-2 rounded-full bg-white/10 px-4 text-xs font-medium text-white transition hover:bg-white/20"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Keep existing install behavior
                    }}
                  >
                    <Download className="h-3.5 w-3.5" />
                    Install
                  </button>
                </div>
              </div>

              {/* App Description */}
              <p className="mt-3 text-sm text-white/70">{app.description}</p>
            </div>
          ))}

          {filteredApps.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-white/50">No apps found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
