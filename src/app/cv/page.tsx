import type { Metadata } from 'next'
import { Header } from '../components/Header'
import { Hero } from '../components/Hero'
import { config } from '../config'
import { experience } from './experience'
import { CompanyRow } from './components/CompanyRow'
import './Cv.scss'

export const metadata: Metadata = {
  title: `Curriculum Vitae | ${config.title}`,
  description: `The work history and experience of ${config.title}, Software Engineer.`,
  alternates: { canonical: `${config.url}/cv` },
}

export default function CvPage() {
  return (
    <>
      <Header />
      <Hero title="Curriculum Vitae" subtitle="software engineer · london" />
      <main>
        <div className="cv-experience container mx-auto max-w-3xl px-6 py-10">
          <h2 className="cv-heading mb-2 text-3xl font-extrabold text-base-content">Experience</h2>

          <div>
            {experience.map((company) => (
              <CompanyRow key={company.name} company={company} />
            ))}
          </div>

          <div className="mt-6">
            <a
              href={config.socialLinks.linkedin}
              className="btn btn-primary"
              target="_blank"
              rel="noopener noreferrer"
            >
              View on LinkedIn →
            </a>
          </div>
        </div>
      </main>
    </>
  )
}
