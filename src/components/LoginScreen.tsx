import { FormEvent, useState } from 'react'

interface LoginScreenProps {
  onLogin: (username: string) => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [username, setUsername] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (username.trim()) {
      onLogin(username.trim())
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-[url('/background.jpg')] bg-cover">
      <form onSubmit={handleSubmit} className="w-80 p-6 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg">
        <h2 className="text-2xl text-black font-bold text-center mb-6">Welcome to Chat App</h2>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter your username"
          className="w-full rounded-full text-black bg-gray-100 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
          required
        />
        <button
          type="submit"
          className="w-full mt-4 bg-blue-500 text-white rounded-full px-4 py-2 hover:bg-blue-600"
        >
          Join Chat
        </button>
      </form>
    </div>
  )
}