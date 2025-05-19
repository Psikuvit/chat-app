import dotenv from 'dotenv'
dotenv.config()

export const config = {
  port: process.env.PORT || 3001,
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  uploadDir: process.env.UPLOAD_DIR || './uploads'
}
