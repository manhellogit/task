import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db";
import routes from "./routes";
import { DocumentFileManager } from './services/DocumentFileManager';
import { DocumentPersistenceService } from './services/DocumentPersistenceService';
import { CollabSocket } from './sockets/collabSocket';

dotenv.config();

const app = express();

// FIXED: Allow all origins for development
app.use(cors({
  origin: "*", // This fixes the CORS issue
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
app.use(express.json());

app.use('/', routes);

const server = http.createServer(app);

// FIXED: Allow all origins for Socket.io
const io = new Server(server, { 
  cors: { 
    origin: "*", // This fixes the Socket.io CORS issue
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Initialize services
const fileManager = new DocumentFileManager();
const persistenceService = new DocumentPersistenceService(fileManager);
const collabSocket = new CollabSocket(io, fileManager);

// Start cron job for persistence
persistenceService.initializeCronJob();

// Initialize socket handlers
collabSocket.initialize();

const PORT = process.env.PORT || 4000;

async function startServer() {
  try {
    await connectDB();
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌐 Health check: http://localhost:${PORT}/health`);
      console.log(`🔌 Socket.io ready with CORS: *`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
