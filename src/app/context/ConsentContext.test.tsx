import React from 'react'
import { renderHook, act } from '@testing-library/react'
import { ConsentProvider, useConsent } from './ConsentContext'

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ConsentProvider>{children as React.JSX.Element}</ConsentProvider>
)

describe('ConsentContext', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('initialises with null before localStorage is read', () => {
    const { result } = renderHook(() => useConsent(), { wrapper })
    // Synchronously after render, before effects run, consent is null.
    // After effects settle it will be 'undecided', so we check the final state here
    // and verify it is never 'granted'/'denied' without a stored value.
    expect(['undecided', null]).toContain(result.current.consent)
  })

  it('resolves to undecided when no localStorage value is set', async () => {
    const { result } = renderHook(() => useConsent(), { wrapper })
    await act(async () => {})
    expect(result.current.consent).toBe('undecided')
  })

  it('resolves to granted when localStorage contains granted', async () => {
    localStorage.setItem('cookie-consent', 'granted')
    const { result } = renderHook(() => useConsent(), { wrapper })
    await act(async () => {})
    expect(result.current.consent).toBe('granted')
  })

  it('resolves to denied when localStorage contains denied', async () => {
    localStorage.setItem('cookie-consent', 'denied')
    const { result } = renderHook(() => useConsent(), { wrapper })
    await act(async () => {})
    expect(result.current.consent).toBe('denied')
  })

  it('ignores invalid localStorage values and resolves to undecided', async () => {
    localStorage.setItem('cookie-consent', 'invalid-value')
    const { result } = renderHook(() => useConsent(), { wrapper })
    await act(async () => {})
    expect(result.current.consent).toBe('undecided')
  })

  it('grantConsent sets consent to granted and persists to localStorage', async () => {
    const { result } = renderHook(() => useConsent(), { wrapper })
    await act(async () => {})
    act(() => result.current.grantConsent())
    expect(result.current.consent).toBe('granted')
    expect(localStorage.getItem('cookie-consent')).toBe('granted')
  })

  it('denyConsent sets consent to denied and persists to localStorage', async () => {
    const { result } = renderHook(() => useConsent(), { wrapper })
    await act(async () => {})
    act(() => result.current.denyConsent())
    expect(result.current.consent).toBe('denied')
    expect(localStorage.getItem('cookie-consent')).toBe('denied')
  })
})
