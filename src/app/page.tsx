'use client'

import { Search, Send, Plus, Phone, Trash2 } from "lucide-react"
import { useState, useEffect, useRef, useCallback } from "react"
import { Socket } from "socket.io-client"
import LoginScreen from "@/components/LoginScreen"
import { socketService } from "@/services/socket"
import { Message } from "@/types/chat"
import Image from 'next/image'

export default function ChatInterface() {
  const [currentUser, setCurrentUser] = useState<string | null>(null)
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])
  const [socket, setSocket] = useState<Socket | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (currentUser) {
      const newSocket = socketService.connect(currentUser)
      setSocket(newSocket)

      newSocket.on('users', (users: string[]) => {
        setOnlineUsers(users)
      })

      // Add handler for loading old messages
      newSocket.on('load-messages', (messages: Message[]) => {
        setMessages(messages)
      })

      newSocket.on('message', (message: Message) => {
        setMessages(prev => [...prev, message])
      })

      return () => {
        socketService.disconnect()
      }
    }
  }, [currentUser])

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (socket && newMessage.trim()) {
      socket.emit('message', {
        content: newMessage,
        sender: currentUser,
        timestamp: Date.now()
      })
      setNewMessage('')
    }
  }

  const renderMessage = (message: Message) => (
    <div
      key={message.id}
      className={`flex ${message.sender === currentUser ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`max-w-[70%] rounded-lg p-3 ${
        message.sender === currentUser 
          ? 'bg-blue-500 text-white' 
          : 'bg-white text-gray-800'
      }`}>
        <p className="text-sm font-medium mb-1">{message.sender}</p>
        {message.fileUrl ? (
          <Image 
            src={`http://localhost:3000${message.fileUrl}`} 
            alt="Shared image"
            width={400}
            height={300} 
            className="max-w-full rounded"
          />
        ) : (
          <p>{message.content}</p>
        )}
      </div>
    </div>
  );

  // Filter online users based on search query
  const filteredUsers = onlineUsers.filter(user => 
    user.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const resetLogs = () => {
    if (socket) {
      socket.emit('reset-logs')
      setMessages([])
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !socket) return

    const formData = new FormData()
    formData.append('image', file)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SOCKET_SERVER_URL}/upload`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) throw new Error('Upload failed')

      const { fileUrl } = await response.json()
      
      socket.emit('message', {
        content: file.name,
        sender: currentUser,
        timestamp: Date.now(),
        fileUrl,
        type: 'image'
      })
    } catch (error) {
      console.error('Error uploading file:', error)
      alert('Failed to upload image')
    }
  }

  const setTypingStatus = useCallback((isTyping: boolean) => {
    if (socket && currentUser) {
      socket.emit('typing', { isTyping });
    }
  }, [socket, currentUser]);

  const handleTyping = useCallback(() => {
    setTypingStatus(true);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      setTypingStatus(false);
    }, 2000);
  }, [setTypingStatus]);

  useEffect(() => {
    if (currentUser && socket) {
      socket.on('user-typing', ({ username, isTyping }) => {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          if (isTyping) {
            newSet.add(username);
          } else {
            newSet.delete(username);
          }
          return newSet;
        });
      });

      return () => {
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        setTypingStatus(false);
        socket.off('user-typing');
      };
    }
  }, [currentUser, socket, setTypingStatus]);

  if (!currentUser) {
    return <LoginScreen onLogin={setCurrentUser} />
  }

  return (
    <div className="flex h-screen bg-[url('/background.jpg')] bg-cover">
      {/* Left sidebar with contacts */}
      <div className="w-80 bg-gray-800/90 backdrop-blur-sm flex flex-col border-r border-gray-700">
        {/* Search bar */}
        <div className="p-4 border-b border-gray-700">
          <div className="relative flex items-center gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <Search className="h-4 w-4 text-white" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search a user?"
                className="w-full rounded-full bg-gray-700 px-4 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-600"
              />
            </div>
            <button
              onClick={resetLogs}
              className="p-2 rounded-full hover:bg-gray-700 text-red-400 hover:text-red-500 transition-colors"
              title="Reset chat logs"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Online users list */}
        <div className="flex-1 overflow-auto">
          <ul className="divide-y divide-gray-700">
            {filteredUsers.map((user, index) => (
              <li
                key={user}
                className={`flex items-center p-4 hover:bg-gray-700 cursor-pointer ${
                  index % 2 === 0 ? "bg-gray-800" : "bg-gray-900"
                }`}
              >
                <div className="h-2 w-2 rounded-full bg-green-400 mr-3"></div>
                <div className="flex-1">
                  <p className="font-medium text-white">{user}</p>
                </div>
              </li>
            ))}
            {filteredUsers.length === 0 && (
              <li className="p-4 text-gray-400 text-center">
                No users found
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 p-6 overflow-auto">
          <div className="space-y-4">
            {messages.map((message) => renderMessage(message))}
            {typingUsers.size > 0 && (
              <div className="text-sm text-gray-400 italic">
                {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Message input */}
        <div className="p-4 bg-gray-800/90 backdrop-blur-sm border-t border-gray-700">
          <form onSubmit={sendMessage} className="flex items-center gap-2">
            <label className="p-2 rounded-full hover:bg-gray-700 cursor-pointer">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
              <Plus className="h-5 w-5 text-white" />
            </label>
            <div className="flex-1 bg-gray-700 rounded-full px-4 py-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleTyping}
                placeholder="Type a message"
                className="w-full bg-transparent focus:outline-none text-white placeholder-gray-400"
              />
            </div>
            <button type="submit" className="p-2 rounded-full hover:bg-gray-700">
              <Send className="h-5 w-5 text-white" />
            </button>
            <button type="button" className="p-2 rounded-full hover:bg-gray-700">
              <Phone className="h-5 w-5 text-white" />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
