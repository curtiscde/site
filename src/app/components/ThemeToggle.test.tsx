import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ThemeToggle } from './ThemeToggle'
import { ThemeContext } from '../context/ThemeContext'

const renderWithTheme = (theme: string, changeTheme = jest.fn()) =>
  render(
    <ThemeContext.Provider value={{ theme, changeTheme }}>
      <ThemeToggle />
    </ThemeContext.Provider>
  )

describe('ThemeToggle', () => {
  it('checkbox is unchecked when theme is light', () => {
    renderWithTheme('light')
    expect(screen.getByRole('checkbox')).not.toBeChecked()
  })

  it('checkbox is checked when theme is dark', () => {
    renderWithTheme('dark')
    expect(screen.getByRole('checkbox')).toBeChecked()
  })

  it('calls changeTheme with dark when checkbox is clicked while unchecked', () => {
    const changeTheme = jest.fn()
    renderWithTheme('light', changeTheme)
    fireEvent.click(screen.getByRole('checkbox'))
    expect(changeTheme).toHaveBeenCalledWith('dark')
  })

  it('calls changeTheme with light when checkbox is clicked while checked', () => {
    const changeTheme = jest.fn()
    renderWithTheme('dark', changeTheme)
    fireEvent.click(screen.getByRole('checkbox'))
    expect(changeTheme).toHaveBeenCalledWith('light')
  })
})
