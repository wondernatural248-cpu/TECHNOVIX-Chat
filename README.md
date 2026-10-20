# TECHNOVIX Chat ⚡

> Next-Generation Social Messaging Web Application built for the **TECHNOVIX** Brand.
> Engineered with React 18, TypeScript, Vite, Tailwind CSS, Three.js, and Lucide icons.
> Features live multi-user 1-to-1 real-time messaging powered by Supabase Auth, PostgreSQL, Row-Level Security, and WebSockets.

---

## 🌌 Overview & Design Philosophy

TECHNOVIX Chat delivers a futuristic cyberpunk / dark aesthetic:
- **Palette**: Deep cosmic black & charcoal (`#050609`, `#0e121e`, `#151b2c`) accented by electric cyan (`#00f0ff`) and ultraviolet neon violet (`#8b5cf6`).
- **Glassmorphism**: Translucent panels (`backdrop-blur-xl`, subtle border shines, glowing rings).
- **Responsiveness**: Smooth transitions across phones, tablets, and desktop workstations.
- **Safety**: Clean separation of secrets via `.gitignore` and `.env.example`. Demo preview mode available when Supabase keys are not configured.

---

## 🚀 Key Features Implemented

### 1. Real Supabase Authentication & Session Management
- **Supabase Auth**: Real email/password sign-up, sign-in, session persistence in `localStorage`, and sign-out.
- **Auto-Sync Profiles**: PostgreSQL trigger automatically creates and syncs profile records in `public.profiles` whenever a user signs up.
- **Session Continuity**: Automatic session restoration on page reload via `supabase.auth.onAuthStateChange` and `supabase.auth.getSession()`.

### 2. Multi-User 1-on-1 Real-Time Chat & Search
- **Registered User Search**: Instant cryptographic registry search by username (`@handle`) or full name.
- **Atomic Conversation Creation**: PostgreSQL RPC function `get_or_create_direct_conversation(other_user_id)` ensures race-free, idempotent direct chat setup.
- **Supabase Realtime WebSockets**: New messages broadcast live to both users' screens instantly without page refreshes.
- **Message History & Delivery States**: Loads previous messages from PostgreSQL when a conversation opens; displays real timestamps and optimistic sending/delivered states.

### 3. Strict Row Level Security (RLS)
- **Profiles**: Authenticated users can view registered profiles for user discovery; users can only update their own profile.
- **Conversations & Participants**: Users can only view and participate in conversations they belong to.
- **Messages**: Users can only view messages belonging to their conversations, and can only insert messages with their own `auth.uid()` as `sender_id`.
- **Zero Secret Exposure**: Only the public `anon` key is used in frontend code; the `service_role` key is never exposed.

### 4. Interactive Screens & Components
1. **Welcome / Sign-In Screen**:
   - Connection status badge indicating live Supabase or demo mode.
   - Email and password authentication with clear error alerts.
   - **Instant Demo Preview** action for immediate one-click testing without credentials.
2. **Sign-Up Screen**:
   - Full name, `@handle`, work email, and secret passkey.
   - Cyber avatar preset selector.
   - Protocol agreement toggle and email confirmation notice.
3. **Conversation List & User Search**:
   - Filter tabs (*All*, *Direct*, *Channels*, *Unread*).
   - Search bar for existing conversations.
   - **New Chat Modal** (`+` button) to discover registered identities and start 1-on-1 chats.
4. **Chat Area & Composer**:
   - Real-time message stream with loading spinner, smooth scroll to bottom, and date separators.
   - Message bubbles with timestamps and delivery states.
   - Enter to send, Shift+Enter for new line, emoji reactions, simulated voice recorder, and attachments preview.
5. **Profile Drawer**:
   - Edit bio, change online status indicator (`online`, `away`, `busy`, `offline`).
   - Live Supabase connection indicator and Sign Out action.
6. **Stories / Status Reel**:
   - Auto-advancing ephemeral status modal (~2.5s per item).
7. **TECHNOVIX ARCADE — CYBER DRIFT 3D**:
   - Genuine real-time 3D WebGL racing engine powered by **Three.js**.
   - Procedural 3D car models (APEX-GT, VORTEX-R, PHANTOM-X), smooth chase camera with Nitro FOV punch, dynamic city skyline, procedural audio synth, and drifting mechanics.

---

## 🛠️ Project Structure

```
Technovix-Chat/
├── .env.example                # Template with setup instructions
├── .gitignore                  # Safeguards .env.local and node_modules
├── package.json                # Dependencies (@supabase/supabase-js, three, lucide-react)
├── supabase/
│   └── schema.sql              # Production PostgreSQL schema, RLS, triggers & RPC
└── src/
    ├── main.tsx                # React entry
    ├── App.tsx                 # Screen router & responsive layout
    ├── types/
    │   ├── chat.ts             # Domain models (User, Message, Story, Conversation)
    │   └── database.types.ts   # Supabase TypeScript schema definitions
    ├── lib/
    │   └── supabase.ts         # Supabase client initializer with fallback
    ├── context/
    │   └── AppContext.tsx      # Central state, Auth listener, Realtime & messaging
    ├── components/
    │   ├── auth/               # SignInScreen, SignUpScreen, AuthLayout
    │   ├── chat/               # ChatArea, ConversationList, MessageComposer, NewChatModal
    │   ├── common/             # Avatar, Badge, Button, Input
    │   ├── navigation/         # AppHeader, MobileNav, Sidebar
    │   ├── profile/            # ProfileDrawer
    │   ├── stories/            # StoryBar, StoryViewerModal
    │   └── arcade/             # CYBER DRIFT 3D racing game
```

---

## ⚡ Quick Start & Run Instructions

### 1. Run Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:3000`.

### 2. Verify Production Build
```bash
npm run build
```

---

## 🔌 Connecting Your Supabase Project

1. **Create a Supabase Project**:
   Sign in to [supabase.com](https://supabase.com) and create a new project.

2. **Execute Database Schema**:
   In your Supabase Dashboard, open the **SQL Editor**, paste the contents of `supabase/schema.sql`, and click **Run**. This creates:
   - `profiles`, `conversations`, `conversation_participants`, and `messages` tables.
   - User creation trigger on `auth.users`.
   - RPC function `get_or_create_direct_conversation`.
   - Row Level Security (RLS) policies.
   - Supabase Realtime publication setup.

3. **Get Your API Credentials**:
   In your Supabase Dashboard, go to **Project Settings** -> **API**:
   - Copy **Project URL**
   - Copy **anon / public** API Key

4. **Configure Local Environment**:
   Create a file named `.env.local` in the project root:
   ```env
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
   *Note: In Supabase Auth -> Providers -> Email, you can optionally disable "Confirm email" for immediate local testing without needing an SMTP email provider.*

5. **Restart Dev Server**:
   ```bash
   npm run dev
   ```

---

## 🧪 Testing Multi-User Realtime Messaging

To test real-time 1-on-1 messaging between two separate users:

1. **User 1 (Regular Browser Window)**:
   - Navigate to `http://localhost:3000`.
   - Click **Create a new identity profile**.
   - Sign up with `alice@technovix.io`, handle `alice.matrix`, and password `password123`.
   - User 1 is logged in and enters the dashboard.

2. **User 2 (Incognito / Second Browser Window)**:
   - Open an Incognito window (or a different browser such as Firefox/Edge) at `http://localhost:3000`.
   - Click **Create a new identity profile**.
   - Sign up with `bob@technovix.io`, handle `bob.cipher`, and password `password123`.
   - User 2 is logged in and enters the dashboard.

3. **Start Direct Chat & Transmit**:
   - In Alice's window, click the **`+` (New Chat)** icon in the Messages list header.
   - In the search modal, Bob (`@bob.cipher`) will appear. Click **Chat**.
   - The direct conversation opens. Type `"Greetings from the neural grid, Bob!"` and press Enter.
   - **Observe live real-time sync**: Bob's browser instantly displays Alice's message via Supabase Realtime WebSockets without needing a page refresh!
   - Bob can reply `"Packet received loud and clear, Alice!"` and Alice sees the message instantly.
