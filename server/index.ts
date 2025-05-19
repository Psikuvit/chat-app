import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdir } from 'fs/promises';
import { messageStore } from './services/messageStore.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Enable CORS
app.use(cors({
  origin: "http://localhost:3000",
  methods: ["GET", "POST"],
  credentials: true
}));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, join(__dirname, 'uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

// Create uploads directory
try {
  await mkdir(join(__dirname, 'uploads'), { recursive: true });
} catch (err) {
  console.error('Error creating uploads directory:', err);
}

// Serve static files
app.use('/uploads', express.static(join(__dirname, 'uploads')));

// Handle file uploads
app.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  res.json({ fileUrl: `/uploads/${req.file.filename}` });
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

const users = new Set<string>();

io.on('connection', async (socket) => {
  console.log('New client connected');
  
  const username = socket.handshake.query.username as string;
  if (username) {
    users.add(username);
    console.log(`${username} joined`);
    
    // Send existing messages to the new user
    const messages = await messageStore.getAllMessages();
    socket.emit('load-messages', messages);
    
    io.emit('users', Array.from(users));

    socket.on('message', async (messageData) => {
      const message = {
        ...messageData,
        id: uuidv4(),
        timestamp: Date.now()
      };
      await messageStore.saveMessage(message);
      io.emit('message', message);
      console.log(`Message from ${username}:`, message.content);
    });

    socket.on('disconnect', () => {
      users.delete(username);
      io.emit('users', Array.from(users));
      console.log(`${username} left`);
    });
  }
});

const PORT = 3001;  // Changed from 3000 to 3001
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});