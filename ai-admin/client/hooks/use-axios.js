"use client"

import axios from "axios"

const useAxios = () => {
  const getTokenFromCookies = () => {
    if (typeof window !== "undefined") {
      const tokenCookie = document.cookie.split("; ").find((row) => row.startsWith("token="))
      return tokenCookie ? decodeURIComponent(tokenCookie.split("=")[1]) : null
    }
    return null
  }  

  const isValidJWT = (token) => {
    return typeof token === "string" && token.split(".").length === 3
  }

  const token = getTokenFromCookies()

  const instance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,
    headers: {
      ...(isValidJWT(token) && { Authorization: `Bearer ${token}` }),
    },
  })

  return instance
}

export default useAxios
