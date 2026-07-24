import React from 'react'
import { render, screen, within } from '@testing-library/react'
import '@testing-library/jest-dom'
import { CompanyRow } from './CompanyRow'
import { Company } from '../experience'

const singleRoleCompany: Company = {
  name: 'Tesco',
  logo: '/images/logos/tesco.svg',
  location: 'London Area, United Kingdom',
  blurb: 'Leading engineering across authentication journeys.',
  roles: [
    {
      title: 'Senior Software Engineer',
      sub: 'Tesco · Full-time',
      dateRange: 'Nov 2019 – Present',
      duration: '6 yrs 9 mos',
      skills: ['TypeScript', 'React'],
    },
  ],
}

const multiRoleCompany: Company = {
  name: 'Whitbread',
  logo: '/images/logos/whitbread.svg',
  location: 'London Area, United Kingdom',
  duration: '2 yrs 3 mos',
  blurb: 'Led product engineering across the digital estate.',
  roles: [
    {
      title: 'Technical Lead',
      dateRange: 'Dec 2018 – Aug 2019',
      duration: '9 mos',
      blurb: 'Set the technical direction for the front-end.',
      skills: ['Leadership', 'Architecture'],
    },
    {
      title: 'Senior Product Developer',
      dateRange: 'Jun 2017 – Nov 2018',
      duration: '1 yr 6 mos',
      blurb: 'Built customer-facing booking features.',
      skills: ['React', 'SCSS'],
    },
  ],
}

describe('CompanyRow', () => {
  describe('single-role company', () => {
    it('renders the role title and employer sub-line', () => {
      render(<CompanyRow company={singleRoleCompany} />)
      expect(screen.getByText('Senior Software Engineer')).toBeInTheDocument()
      expect(screen.getByText('Tesco · Full-time')).toBeInTheDocument()
    })

    it('renders the date range with duration and the location', () => {
      render(<CompanyRow company={singleRoleCompany} />)
      expect(screen.getByText('Nov 2019 – Present · 6 yrs 9 mos')).toBeInTheDocument()
      expect(screen.getByText('London Area, United Kingdom')).toBeInTheDocument()
    })

    it('renders each skill badge', () => {
      render(<CompanyRow company={singleRoleCompany} />)
      expect(screen.getByText('TypeScript')).toBeInTheDocument()
      expect(screen.getByText('React')).toBeInTheDocument()
    })

    it('renders the company logo with alt text', () => {
      render(<CompanyRow company={singleRoleCompany} />)
      expect(screen.getByRole('img', { name: 'Tesco logo' })).toBeInTheDocument()
    })
  })

  describe('multi-role company (timeline)', () => {
    it('renders the company name and total duration as the header', () => {
      render(<CompanyRow company={multiRoleCompany} />)
      expect(screen.getByText('Whitbread')).toBeInTheDocument()
      expect(screen.getByText('2 yrs 3 mos')).toBeInTheDocument()
    })

    it('renders every role with its own title and per-role blurb', () => {
      render(<CompanyRow company={multiRoleCompany} />)
      expect(screen.getByText('Technical Lead')).toBeInTheDocument()
      expect(screen.getByText('Set the technical direction for the front-end.')).toBeInTheDocument()
      expect(screen.getByText('Senior Product Developer')).toBeInTheDocument()
      expect(screen.getByText('Built customer-facing booking features.')).toBeInTheDocument()
    })

    it('does not render the single-role employer sub-line', () => {
      render(<CompanyRow company={multiRoleCompany} />)
      // The multi-role header shows the company name, not a "Company · Full-time" line.
      expect(screen.queryByText(/· Full-time/)).toBeNull()
    })
  })
})

describe('CompanyRow skills scoping', () => {
  it('scopes skills to their role in the timeline', () => {
    render(<CompanyRow company={multiRoleCompany} />)
    const lead = screen.getByText('Technical Lead').closest('div')!.parentElement!
    expect(within(lead).getByText('Leadership')).toBeInTheDocument()
  })
})
