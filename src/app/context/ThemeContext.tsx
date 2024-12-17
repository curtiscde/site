'use client'

import { createContext, useState, useEffect, JSX } from "react"

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const ThemeContext = createContext({ theme: 'light', changeTheme: (theme: string) => { } })

export const ThemeProvider = ({ children }: { children: JSX.Element | JSX.Element[] }) => {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') || 'light';
    setTheme(storedTheme)
  }, [])

  const changeTheme = (theme: string) => {
    setTheme(theme)
    localStorage.setItem('theme', theme)
  }

  return (
    <ThemeContext.Provider value={{ theme, changeTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}