import React, { useContext } from 'react'
import { renderHook, act } from '@testing-library/react'
import { ThemeContext, ThemeProvider } from './ThemeContext'

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>{children as React.JSX.Element}</ThemeProvider>
)

describe('ThemeContext', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('defaults to light when localStorage is empty', async () => {
    const { result } = renderHook(() => useContext(ThemeContext), { wrapper })
    await act(async () => {})
    expect(result.current.theme).toBe('light')
  })

  it('hydrates to the stored theme on mount', async () => {
    localStorage.setItem('theme', 'dark')
    const { result } = renderHook(() => useContext(ThemeContext), { wrapper })
    await act(async () => {})
    expect(result.current.theme).toBe('dark')
  })

  it('changeTheme updates the theme and persists to localStorage', async () => {
    const { result } = renderHook(() => useContext(ThemeContext), { wrapper })
    await act(async () => {})
    act(() => result.current.changeTheme('dark'))
    expect(result.current.theme).toBe('dark')
    expect(localStorage.getItem('theme')).toBe('dark')
  })
})
