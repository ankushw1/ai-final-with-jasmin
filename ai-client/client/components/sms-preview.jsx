"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { ChevronLeft, MoreVertical, Plus } from 'lucide-react'

export function SmsPreview({ sender, message, messagePart, totalParts }) {
  const [currentTime, setCurrentTime] = useState("")

  // Update the current time every minute
  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const hours = now.getHours()
      const minutes = now.getMinutes()
      const ampm = hours >= 12 ? "PM" : "AM"
      const formattedHours = hours % 12 || 12
      const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes
      setCurrentTime(`${formattedHours}:${formattedMinutes} ${ampm}`)
    }

    updateTime()
    const interval = setInterval(updateTime, 60000)

    return () => clearInterval(interval)
  }, [])

  // Get the current part of the message to display
  const getMessagePart = () => {
    if (!message || totalParts <= 1) return message
    
    // Calculate part length based on message length and total parts
    const partLength = Math.ceil(message.length / totalParts)
    const start = (messagePart - 1) * partLength
    const end = Math.min(start + partLength, message.length)
    
    return message.substring(start, end)
  }

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-[320px]">
        <Card className="overflow-hidden border-8 border-black rounded-[40px] bg-white shadow-xl">
          {/* Phone status bar */}
          <div className="bg-black text-white px-6 py-2 flex justify-between items-center text-xs">
            <div>{currentTime}</div>
            <div className="flex items-center space-x-1">
              <div>5G</div>
              <div className="w-6 h-3 rounded-sm border border-white flex items-center">
                <div className="w-4 h-2 bg-white ml-0.5 rounded-sm"></div>
              </div>
            </div>
          </div>

          {/* Message header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center">
              <ChevronLeft className="h-5 w-5 mr-4" />
              <div className="font-semibold">{sender}</div>
            </div>
            <MoreVertical className="h-5 w-5" />
          </div>

          {/* Message content */}
          <div className="bg-gray-100 h-[500px] p-4 flex flex-col">
            <div className="text-xs text-center text-gray-500 mb-2">
              Text Message
              <div>Today, {currentTime}</div>
            </div>

            <div className="bg-gray-200 rounded-2xl p-3 max-w-[80%] self-start mt-2 min-h-[60px]">
              <p className="text-sm whitespace-pre-wrap break-words">{getMessagePart()}</p>
            </div>

            {totalParts > 1 && (
              <div className="text-xs text-center text-gray-500 mt-2">
                Part {messagePart} of {totalParts}
              </div>
            )}

            <div className="mt-auto">
              <div className="flex items-center bg-white rounded-full p-2 border">
                <Plus className="h-5 w-5 text-gray-400 mr-2" />
                <div className="text-gray-400 flex-1">Text message</div>
                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-4 h-4">
                    <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Phone home indicator */}
          <div className="bg-black py-2 flex justify-center">
            <div className="w-1/3 h-1 bg-white rounded-full"></div>
          </div>
        </Card>
      </div>
    </div>
  )
}