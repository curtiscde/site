'use client'

import Script from 'next/script'
import { useEffect, useRef } from 'react'
import { useConsent } from '../../context/ConsentContext'
import { config } from '../../config'

export function AdsenseScript() {
  const { consent } = useConsent()

  if (consent !== 'granted') return null

  return (
    <Script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-${config.analytics.adsensePublisherId}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  )
}

export function AdsenseUnit({ adSlot }: { adSlot: string }) {
  const { consent } = useConsent()
  const initialized = useRef(false)

  useEffect(() => {
    if (consent !== 'granted' || initialized.current) return
    initialized.current = true
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({})
    } catch (e) {
      console.error('Adsense error', e)
    }
  }, [consent])

  if (consent !== 'granted') return null

  return (
    <ins
      className="adsbygoogle"
      style={{ display: 'block' }}
      data-ad-client={`ca-${config.analytics.adsensePublisherId}`}
      data-ad-slot={adSlot}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  )
}
