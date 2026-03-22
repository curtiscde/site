'use client'

import Script from 'next/script'
import { useConsent } from '../../context/ConsentContext'
import { config } from '../../config'

export function GoogleAnalytics() {
  const { consent } = useConsent()

  if (consent !== 'granted') return null

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${config.analytics.ga4MeasurementId}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">{`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${config.analytics.ga4MeasurementId}');
      `}</Script>
    </>
  )
}
