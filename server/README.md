# Cadmus Collaborative Editor – Backend (Server)

This is the backend server for the **Cadmus collaborative editing** homework task.  
It is built with **TypeScript (Node.js + Express)**, uses **Socket.IO** for real-time collaboration, and persists data with **MongoDB (via Mongoose)**.

---

## Overview

The server manages:

- **API endpoints** for documents, users, and health monitoring  
- **Real-time ProseMirror Operational Transform (OT)** collaboration sync  
- **Step persistence** via MongoDB and an in-memory document file manager  
- **Cron jobs** to:
  - persist steps every 10 seconds

---

## Features

### REST API
- **Documents** → create, fetch steps, delete  
- **Users** → login via email, manage preferences/profile  
- **Health** → server + DB checks  

### Collaboration API (WebSockets)
- `pullUpdates` → fetch steps since version  
- `pushUpdates` → send/confirm new steps  
- `join-document` → join a live editing session  

### Persistence Layer
- **In-memory** → `DocumentFileManager` tracks clients, versions, step queues  
- **MongoDB** → `DocumentPersistenceService` flushes steps every 10s  
- **Cleanup** → removes inactive docs after 30 mins  

---

## Prerequisites

- **Node.js** ≥ 18  
- **npm** (bundled with Node.js)  
- **MongoDB** (local or hosted URI)  

---

## Environment Variables

Create a `.env` file in the `server/` root:

```bash
# Server Configuration
PORT=4000

# Database Configuration
MONGO_URI=
```

## 🚀 Getting Started

### Install dependencies
```bash
cd server
npm install
```

### Start in development

```bash
(hot reload via ts-node-dev)
npm run dev
```

Build for production
```bash
npm run build
```

Run production build
```bash
npm start
```

## API Routes

### Health Checks

- `GET /health` → Server status + DB status, uptime, memory usage  
- `GET /health/db` → MongoDB connection health

### User API

- `POST /api/users/login` → Login/register via email  
- `GET /api/users/profile/:email` → Get profile  
- `PUT /api/users/preferences/:email` → Update preferences  
- `POST /api/users/track-access` → Track document access  
- (Legacy) `POST /api/users/create` → Create user  
- (Legacy) `GET /api/users/:userId` → Get user by ID  
- (Legacy) `GET /api/users/:userId/documents` → List user’s docs

### Document API

- `POST /api/documents/create` → Create a new doc  
- `GET /api/documents/:id/steps?version=X` → Fetch steps since version  
- `DELETE /api/documents/:id` → Delete doc

---

## WebSocket Events

### `pullUpdates`

Client asks for new steps since version:

```json
{ "docId": "123", "version": 2 }
```

### Responds with:

```json
{ "steps": [...], "version": 3, "users": 2 }
```

### `pushUpdates`

### Client sends new steps:

```json
{ "docId": "123", "version": 2, "steps": [ {...stepJSON} ], "clientID": "client-xyz" }
```
### Responds with:

```json
{ "version": 3 }
```

### join-document
#### Join document room:

```json
{ "documentId": "123", "clientId": "abc", "userId": "user-xyz" }
```

### disconnect
```json
Removes client from memory
```

## Persistence Layer

### In-Memory

- Keeps active sessions and connected clients fast  
- Ensures step order is correct  
- Rejects out-of-order versions

### MongoDB

- Persists steps in `StepModel` (version, clientId, stepData)  
- Stores metadata in `DocumentModel` and `UserModel`  
- `DocumentPersistenceService` flushes every 10s

---

## Scaling Notes

- Single instance → fine for homework  
- Real-world systems:
  - Use Redis pub/sub or Kafka for socket sync  
  - Horizontal scaling requires distributed step ordering  
  - MongoDB ensures durability  
  - Redis cache improves replay speed

---

## Example Usage

### Document Creation

```bash
curl -X POST http://localhost:4000/api/documents/create \
  -H "Content-Type: application/json" \
  -d '{"name":"My Test Doc","userId":"user_abc"}'
```

### Fetch Steps
```bash
curl http://localhost:4000/api/documents/123/steps?version=2
```
### Login with Email
```bash
curl -X POST http://localhost:4000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

### Run Together with Client
- Frontend — React + Vite runs on `http://localhost:3000`

- Backend — Node/Express + Socket.IO runs on `http://localhost:4000`

The frontend auto-connects to the backend for API and WebSocket collaboration.
