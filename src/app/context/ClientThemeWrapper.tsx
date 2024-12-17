'use client'

import { JSX, ReactNode, useContext } from 'react'
import { ThemeContext } from './ThemeContext'

export default function ClientThemeWrapper({ children }: { children: ReactNode | JSX.Element | JSX.Element[] }) {
  const { theme } = useContext(ThemeContext)

  return <div data-theme={theme}>{children}</div>
}