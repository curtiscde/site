'use client'

import { createContext, useState, useEffect, useContext, JSX } from 'react'

type ConsentState = 'undecided' | 'granted' | 'denied'

interface ConsentContextValue {
  consent: ConsentState | null
  grantConsent: () => void
  denyConsent: () => void
}

export const ConsentContext = createContext<ConsentContextValue>({
  consent: null,
  grantConsent: () => {},
  denyConsent: () => {},
})

const STORAGE_KEY = 'cookie-consent'

export const ConsentProvider = ({ children }: { children: JSX.Element | JSX.Element[] }) => {
  const [consent, setConsent] = useState<ConsentState | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ConsentState | null
    setConsent(stored === 'granted' || stored === 'denied' ? stored : 'undecided')
  }, [])

  const grantConsent = () => {
    setConsent('granted')
    localStorage.setItem(STORAGE_KEY, 'granted')
  }

  const denyConsent = () => {
    setConsent('denied')
    localStorage.setItem(STORAGE_KEY, 'denied')
  }

  return (
    <ConsentContext.Provider value={{ consent, grantConsent, denyConsent }}>
      {children}
    </ConsentContext.Provider>
  )
}

export const useConsent = () => useContext(ConsentContext)
