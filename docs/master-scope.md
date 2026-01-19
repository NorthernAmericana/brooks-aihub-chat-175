# Brooks AI HUB — Master Scope (Mobile App + Console)

**Project:** Brooks AI HUB  
**Company:** Northern Americana Tech (NAT)  
**Core idea:** A trust-first, voice-first “hub OS” that routes users to distinct AI “ATOs” (Autonomous Technological Organisms) through a **slash-based system**, while keeping **controlled, user-owned memory** that can sync across devices (phone + console) and optionally work offline.

---

## 1) The Vibe (Non-Negotiables)

Brooks AI HUB should feel like:
- **Cozy + capable.** Like a calm cabin control-room, not a sterile enterprise dashboard.
- **Retro-future.** A friendly “Gameboy OS” energy, but modern and smooth.
- **Woodsy / Northern Americana.** Earth tones, evergreen vibes, soft monochrome, warm light, gentle gradients.
- **Trust-first by default.** The user always feels in control of memory, tools, and what the system is doing.
- **A companion ecosystem.** Not “one chatbot.” It’s a hub of personalities/tools that are each good at something.

Key emotional target:
> “This thing feels like it knows me *because I allowed it to*, and it helps without being cringe or invasive.”

---

## 2) The Two Products

### A) Brooks AI HUB (Mobile App)
**Role:** The user’s main **control center**.
- Manage ATOs (official + unofficial)
- Review transcripts/receipts
- Control memory sharing + retention
- Use voice-first chat
- Sync with console
- Dashboard-style “Today” summaries and quick actions

Think:
- Clean UI
- Fast navigation
- Strong settings + receipts + searchable history

### B) Brooks AI HUB Console (Handheld + Dockable “Machine”)
**Role:** A **physical interface** for the hub that can be used:
- **Standalone handheld** (games, media, offline browsing of local content)
- **Inside BrooksBears** (teddy form factor: voice companion mode)
- **In the car** (nav assistance, trip notes, emotional support)
- **At home docked** (media + hub terminal + voice sessions)

Think:
- A “multi-tool device” that can switch modes based on context
- Feels like a playful OS, but still NAT-trust-first

---

## 3) Product Pillars

### 3.1 Slash Router = The OS
The user navigates the ecosystem by typing or selecting routes like:
- `/brooksbears`
- `/mycarmind`
- `/namc`
- `/weather` (if enabled via unofficial tools)
- `/brooksbears/summaries` (sub-modes)

**Goal:** It feels like a file system of living apps—fast, composable, and expandable.

### 3.2 ATOs (Autonomous Technological Organisms)
ATOs are not just “tabs.” Each ATO has:
- a personality
- a toolset (restricted or powerful depending on status)
- a knowledge scope
- memory permissions

**Official ATOs** = curated, safe, brand-aligned, restricted tools.  
**Unofficial ATOs** = broader tools (web search, external APIs), used when user opts in or when delegated.

> Official agents can hand off to unofficial helpers when needed, without breaking persona boundaries.  
(Architecture reference: multi-agent orchestration + handoffs)  

### 3.3 Memory You Can Actually Trust
Memory is **explicitly controlled**:
- What’s remembered
- Where it’s stored (local / cloud / both)
- Who can access it (which ATOs)
- How long it persists
- Export/Delete/Panic-delete

**Default stance:** minimal retention, maximum user control.

### 3.4 Receipts + Transparency
The hub should make it easy to answer:
- “What do you know about me?”
- “Where did that info come from?”
- “Which agent/tool did this?”
- “What did you store, and why?”

### 3.5 Offline-First, Sync-When-Ready
The console especially must work when offline:
- Store transcripts locally
- Cache knowledge/media locally
- Sync later like “Steam cloud saves” (same user experience, delayed sync)

---

## 4) Core Use Cases (What This System Must Nail)

### 4.1 Voice Companion (BrooksBears / Benjamin Bear)
- Push-to-talk + optional “fluent” mode
- Warm, woodsy tone
- No web browsing by default (official constraints)
- Uses local + approved knowledge only
- Can delegate to helper agents if user opts in

### 4.2 Car Mode (MyCarMindATO)
- Voice-first driving assistant
- Lightweight “trip notes” + “drafts”
- “Where did I go?” timeline / visited places
- Gentle emotional support while driving (short, non-intrusive)
- Minimal friction UI (big buttons, fast actions)

### 4.3 Console Media + Games + Internet Access
- Media playback (local first)
- NAT/NAMC media library access
- Simple browser access when enabled
- Games (indie + NAMC integrations)
- ATO sessions that can continue on mobile

### 4.4 Contextual Memory Across Devices
- Start a session on console → continue on phone
- Create trip notes in car → view/search later on phone
- ATO memory can be shared across ATOs only if user allows it

---

## 5) UX + UI Principles

### 5.1 Mobile UI
- “Hub OS” feel: Today, Chats, Transcripts, Settings
- Strong search + filtering (by ATO, date, topic)
- Quick-launch chips for top ATOs
- Visible session state (which agent, which mode, recording on/off)

### 5.2 Console UI
- Retro-inspired shell with modern smoothness
- Clear mode switching:
  - Handheld mode
  - Docked mode
  - Bear mode
  - Car mode
- Offline-first indicators (what’s cached, what’s pending sync)

### 5.3 Tone & Character Consistency
- Benjamin Bear: warm, calm, sincere, occasionally funny, never manipulative
- The hub: feels like the “OS narrator” (neutral but friendly)
- Official ATOs: consistent brand voice
- Unofficial ATOs: more utilitarian, clearly labeled, tool-heavy

---

## 6) System Architecture (High-Level)

### 6.1 Multi-Agent Orchestration
- A primary/orchestrator agent routes tasks
- Specialist agents can be called as tools or via handoffs
- Official vs unofficial separation enforced by tool access + handoff allowlists

### 6.2 RAG + Knowledge Storage
- Local vector store (offline)
- Cloud vector store (sync)
- “Steam-like” sync model between local/cloud knowledge and transcripts

### 6.3 Slash Router + Dynamic Threads
- Slash path maps to:
  - Agent selection
  - Sub-mode
  - Conversation thread creation/loading
- Auto-titles and folder-style organization per agent

(Reference architecture includes orchestration patterns, tool assignment by agent, RAG local/cloud sync, and slash-based routing.)

---

## 7) Feature Scope

### 7.1 Must-Have (MVP+)
- Slash routing
- Multi-agent definitions (at least: Hub, BrooksBears, CarMind, NAMC)
- Sessions + transcripts saved
- Basic memory controls (on/off, per-ATO permission, delete)
- Receipts (tool usage + sources in plain language)
- Voice loop (push-to-talk at minimum)
- Cross-device sync of sessions/transcripts

### 7.2 Strong Next (Post-MVP)
- Search across transcripts + memories
- Export/delete flows (including “panic delete”)
- Offline-first console mode with local model fallback (even if limited)
- Media library integration (NAMC)
- Car timeline / places / map-friendly drafts workflow

### 7.3 Later / Big Dreams (Not required early)
- Full handheld “OS” polish + theming packs
- Hardware accessories (BearBox, car mount, dock)
- Marketplace for community ATOs
- In-console game store / library
- Local multimodal model on-device

---

## 8) Guardrails + Boundaries

### 8.1 Trust Rules
- No silent memory collection
- No “it remembers everything” vibes
- Clear opt-ins for:
  - web tools
  - external APIs
  - cross-ATO memory sharing

### 8.2 Non-Goals (For Focus)
- We are NOT trying to be “everything ChatGPT can do” on day one.
- We are NOT building a general social network.
- We are NOT shipping unsafe “do anything” agents as official.
- We are NOT requiring constant internet access (especially for console).

---

## 9) Definition of Done (Practical)

A release is “done” when:
- The user can reliably:
  1) open the hub  
  2) start a voice session  
  3) route to an ATO via slash or UI chips  
  4) see transcripts/receipts  
  5) control memory + delete it  
  6) continue the same session or thread on another device after sync  

---

## 10) Repo Conventions (Suggested)

- `docs/master-scope.md` (this file)
- `docs/memory-os.md` (memory schema + permission model)
- `docs/agents/` (one doc per ATO: personality, tools, boundaries)
- `docs/console/` (hardware, modes, offline approach)
- `docs/ui/` (screens, vibe rules, components)

---

## 11) References
- OpenAI Agents SDK quickstart + concepts: agents, tools, handoffs, runner.
- Brooks AI HUB technical architecture reference: multi-agent orchestration, official/unofficial tool boundaries, RAG local/cloud sync, slash routing, offline-first console model.
