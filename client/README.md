# Cadmus Collaborative Editor – Frontend (Client)

This is the frontend client for the Cadmus collaborative editing homework task. It is built with **React + TypeScript**, powered by **TipTap (ProseMirror-based)** for the editor, and styled with **Tailwind CSS**.

The client enables online rich-text editing, a live word counter, user authentication via email, and real-time collaborative editing via a backend API using ProseMirror’s collaboration plugin and WebSockets (**Socket.IO**).

---

## Features

- Rich-text editor powered by **TipTap (ProseMirror)**
- Live word and character counter with debounce updates
- Real-time collaboration using ProseMirror’s operational transform algorithm
- Persistence support – catches up latest document on refresh
- User sessions with simple email login, stored in `localStorage`
- Collaborator display with user ID and status indicators
- Auto-save of document content locally
- Responsive UI inspired by modern editors like **Notion/Google Docs**

---

## Prerequisites

- **Node.js** (>= 18 recommended)  
- **npm** (comes with Node.js)

---

## Getting Started

### 1. Install dependencies

```bash
cd client
npm install
```

---

### 2. Start development server
---
```bash
npm run dev
```
This runs the Vite React development server on:
http://localhost:3000

---

### 3. Connect to backend

The frontend expects the backend server to run separately on:

http://localhost:4000 (WebSocket)

http://localhost:4000/api (REST endpoints)

Make sure the backend is started before testing collaboration.

---

### Available Scripts

```bash
npm run dev      # Start frontend dev server with Vite
npm run build    # Type-check and build production output
npm run preview  # Preview the production build locally
npm run lint     # Run ESLint checks
```
---

### 📂 Project Structure


```text
client/
├── index.html              # Vite entry point
├── package.json
├── vite.config.ts
├── tsconfig.json
└── src/
    ├── App.tsx             # Root React app with routes & Socket provider
    ├── pages/
    │   └── EditorPage.tsx  # Main editor page with auth & editor
    ├── components/
    │   ├── Editor/
    │   │   ├── TiptapEditor.tsx   # ProseMirror + TipTap collaborative editor
    │   │   ├── EditorToolbar.tsx  # Rich text toolbar
    │   │   └── WordCounter.tsx    # Live word/character counter
    │   ├── EmailLogin.tsx         # Email login form
    │   └── UserHeader.tsx         # User profile header
    ├── contexts/SocketContext.tsx # Provides socket.io client
    ├── hooks/                     # Custom hooks
    │   ├── useWordCount.ts
    │   ├── useEmailAuth.ts
    │   ├── usePersistedUser.ts
    │   └── useDebouncedSend.ts
    ├── services/                  # Collaboration & API connections
    │   ├── EditorConnection.ts
    │   ├── collabClient.ts
    │   └── api.ts
    ├── types/collab.ts            # Collaboration-related types
    └── utils/wordCount.ts         # Word count helper
```
---

### How Collaboration Works

1. **Editor Initialization** → TipTap’s editor is extended with ProseMirror’s collab plugin  
2. **Synchronization** → Each client uses `sendableSteps` and `receiveTransaction` to push and pull document changes  
3. **Communication** → `EditorConnection` and `SocketContext` handle WebSocket events (`pushUpdates`, `pullUpdates`)  
4. **Resilience** → Invalid step ranges trigger a resync of the document from version 0  
5. **Persistence** → Local `localStorage` saves user info + document snapshots for recovery  

---

### Notes

- **Default backend API**:  
  - `http://localhost:4000/api` → REST endpoints  
  - `http://localhost:4000` → WebSocket  

- If you run the backend on a different port/host, update the URLs in:  
  - `src/services/api.ts`  
  - `src/contexts/SocketContext.tsx`  

---

## 🛠️ Troubleshooting

- **Socket not connecting** → Ensure backend server is running on port `4000`  
- **Word counter not updating** → Check the editor is initialized and content is present  
- **Steps version mismatch** → A resync request should automatically restore document state  
