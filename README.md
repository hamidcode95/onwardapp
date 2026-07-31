# Onward 🚀

**Onward** is a friendly, ADHD-aware productivity companion. Instead of a plain to-do list, it breaks your day into small, low-friction "modules" and pairs you with **Oly**, a virtual buddy that helps you focus, decide, and celebrate wins along the way.

🔗 **Live app:** [onwardapp.ir](https://onwardapp.ir)

---

## ✨ Features

- **Task Shredder** — turns a big, overwhelming goal into a checklist of tiny, doable steps.
- **Focus Room** — visual focus timer sessions with Oly by your side.
- **Brain Dump** — instantly capture everything on your mind, then send items straight to the Task Shredder.
- **Decision Maker** — can't choose? Let Oly pick your next move for you.
- **Mind Scanner** — a quick check-in on your mental/energy level.
- **Success Archive** — a record of your focus minutes and completed tasks.
- **Chat with Oly** — a conversational AI buddy for quick motivation or advice.
- **Oly's Sanctuary** — spend "feathers" (earned through focus & tasks) to decorate Oly's home.
- **Accounts & sync** — sign in and keep your progress backed up with Supabase.
- **Installable PWA** — works offline-ready and can be installed like a native app.

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | [React](https://reactjs.org/) + [Vite](https://vitejs.dev/) + TypeScript |
| Styling / UI | [Tailwind CSS](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/), [Radix UI](https://www.radix-ui.com/) |
| Animation | [Framer Motion](https://www.framer.com/motion/) |
| Data / state | [TanStack Query](https://tanstack.com/query), React Hooks |
| Auth & Backend | [Supabase](https://supabase.com/) (Auth, Database, Edge Functions) |
| AI | Supabase Edge Function (`ai-assistant`) |
| Charts | [Recharts](https://recharts.org/) |
| PWA | [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) |
| Deployment | [Vercel](https://vercel.com/) |

## 🧭 Architecture

The app is a single-page React app. A central hub screen (`Index.tsx`) switches between self-contained "modules," while shared hooks handle local app state, authentication, and notifications. AI-powered modules call a single Supabase Edge Function that talks to the AI provider.

```mermaid
graph TD
    subgraph Client["React SPA (Vite + TypeScript)"]
        Hub["Index.tsx - Hub Screen"]

        subgraph Modules["Feature Modules"]
            TS["Task Shredder"]
            FR["Focus Room"]
            BD["Brain Dump"]
            DM["Decision Maker"]
            MS["Mind Scanner"]
            SA["Success Archive"]
            OC["Chat with Oly"]
            SR["Oly's Sanctuary"]
        end

        subgraph Hooks["Shared Hooks"]
            useAppState["useAppState"]
            useAuth["useAuth"]
            useAI["useAI"]
            useNotifications["useNotifications"]
        end

        UI["shadcn/ui + Radix + Tailwind components"]
    end

    subgraph Supabase["Supabase Backend"]
        Auth["Auth"]
        DB["Database"]
        EdgeFn["Edge Function: ai-assistant"]
    end

    AIProvider["AI Provider"]
    PWA["Service Worker / PWA"]

    Hub --> TS & FR & BD & DM & MS & SA & OC & SR
    TS & FR & BD & DM & MS & SA & OC & SR --> UI

    TS --> useAI
    DM --> useAI
    OC --> useAI
    MS --> useAI

    Hub --> useAppState
    Hub --> useAuth
    Hub --> useNotifications

    useAuth --> Auth
    useAppState --> DB
    useAI --> EdgeFn
    EdgeFn --> AIProvider

    Client -.registers.-> PWA
```

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) 18+ (or [Bun](https://bun.sh/), since the repo ships a `bun.lockb`)
- A [Supabase](https://supabase.com/) project (URL + anon key) for auth, database, and the `ai-assistant` edge function

### Installation

```bash
# Clone the repository
git clone https://github.com/hamidcode95/onwardapp.git
cd onwardapp

# Install dependencies
npm install
# or, if you prefer Bun:
bun install
```

### Environment variables

Create a `.env` file in the project root with your Supabase credentials:

```env
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Run locally

```bash
npm run dev
```

The app will be available at `http://localhost:5173` (default Vite port).

### Build for production

```bash
npm run build
```

### Preview the production build

```bash
npm run preview
```

## 📁 Project Structure

```
onwardapp/
├── public/              # Static assets, PWA service worker
├── src/
│   ├── components/      # Reusable UI components (GlassCard, Oly, etc.)
│   ├── hooks/            # useAppState, useAuth, useAI, useNotifications
│   ├── integrations/     # Supabase client setup
│   ├── modules/          # Feature modules (Task Shredder, Focus Room, ...)
│   ├── pages/             # Route-level pages (Index, Auth, NotFound)
│   ├── App.tsx
│   └── main.tsx
├── supabase/
│   ├── config.toml
│   └── functions/
│       └── ai-assistant/  # Edge function powering AI features
└── vite.config.ts
```

## 🌐 Deployment

The project is configured for deployment on [Vercel](https://vercel.com/).

**Live demo:** [https://onwardapp.ir](https://onwardapp.ir)

## 🤝 Contributing

Issues and pull requests are welcome! If you'd like to propose a significant change, please open an issue first to discuss what you'd like to change.

## 📄 License

No license has been specified yet for this project.
