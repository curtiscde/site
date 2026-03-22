'use client'

import { useConsent } from '../../context/ConsentContext'
import Link from 'next/link'

export function CookieBanner() {
  const { consent, grantConsent, denyConsent } = useConsent()

  if (consent !== 'undecided') return null

  return (
    <div className="alert shadow-lg fixed bottom-0 left-0 right-0 z-50 rounded-none">
      <span>
        We use cookies for analytics and advertising. See our{' '}
        <Link href="/privacy-policy" className="link">Privacy Policy</Link>.
      </span>
      <div className="flex gap-2">
        <button className="btn btn-sm btn-ghost" onClick={denyConsent}>Decline</button>
        <button className="btn btn-sm btn-primary" onClick={grantConsent}>Accept</button>
      </div>
    </div>
  )
}
