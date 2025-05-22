import express from 'express'
import cors from 'cors'
import multer from 'multer'
import { Server } from 'socket.io'
import { createServer } from 'http'
import { v4 as uuidv4 } from 'uuid'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { mkdir } from 'fs/promises'
import { messageStore } from './services/messageStore.js'
import { config } from './config.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()

app.use(cors({
  origin: config.corsOrigin,
  methods: ["GET", "POST"],
  credentials: true
}))

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = join(__dirname, 'uploads')
    try {
      await mkdir(uploadDir, { recursive: true })
      cb(null, uploadDir)
    } catch (err) {
      cb(err as Error, '')
    }
  },
  filename: (req, file, cb) => {
    const ext = file.originalname.split('.').pop()
    const uniqueName = `${Date.now()}-${uuidv4()}.${ext}`
    cb(null, uniqueName)
  }
})

const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Only images are allowed'))
      return
    }
    cb(null, true)
  }
})

try {
  await mkdir(join(__dirname, 'uploads'), { recursive: true })
} catch (err) {
  console.error('Error creating uploads directory:', err)
}

app.use('/uploads', express.static(join(__dirname, 'uploads')))

app.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' })
  }
  
  const fileUrl = `/uploads/${req.file.filename}`
  console.log('File uploaded:', fileUrl)
  res.json({ fileUrl })
})

const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? [/\.vercel\.app$/, config.corsOrigin]
      : config.corsOrigin,
    methods: ["GET", "POST"],
    credentials: true
  },
  maxHttpBufferSize: 1e7
})

const users = new Set<string>()

io.on('connection', async (socket) => {
  console.log('New client connected')
  
  const username = socket.handshake.query.username as string
  if (username) {
    users.add(username)
    console.log(`${username} joined`)
    
    const messages = await messageStore.getAllMessages()
    socket.emit('load-messages', messages)
    
    io.emit('users', Array.from(users))

    socket.on('typing', ({ isTyping }) => {
      socket.broadcast.emit('user-typing', { username, isTyping })
    })

    socket.on('message', async (messageData) => {
      const message = {
        ...messageData,
        id: uuidv4(),
        timestamp: Date.now()
      }
      await messageStore.saveMessage(message)
      io.emit('message', message)
      console.log(`Message from ${username}:`, message.content)
    })

    socket.on('reset-logs', async () => {
      await messageStore.resetMessages()
      io.emit('load-messages', [])
      console.log(`Chat logs reset by ${username}`)
    })

    socket.on('disconnect', () => {
      users.delete(username)
      io.emit('users', Array.from(users))
      console.log(`${username} left`)
    })
  }
})

const PORT = 3001
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})