export interface Role {
  /** Role title, e.g. "Senior Software Engineer" */
  title: string
  /** Date range, e.g. "Nov 2019 – Present" */
  dateRange: string
  /** Duration, e.g. "6 yrs 9 mos" */
  duration: string
  /** Short description of the role */
  blurb?: string
  /** Skill tags for the role */
  skills: string[]
  /** Single-role companies only: the employer/employment-type line, e.g. "Tesco · Full-time" */
  sub?: string
}

export interface Company {
  name: string
  /** Path under public/, e.g. "/images/logos/tesco.svg" */
  logo: string
  location: string
  /** Multi-role companies only: total tenure, e.g. "2 yrs 3 mos" */
  duration?: string
  /** Company-level description */
  blurb?: string
  /**
   * Roles at the company. One role renders the single-role layout;
   * two or more render the timeline layout.
   */
  roles: Role[]
}

export const experience: Company[] = [
  {
    name: 'Tesco',
    logo: '/images/logos/tesco.svg',
    location: 'London Area, United Kingdom',
    blurb:
      "Leading engineering across Tesco's customer Authentication & Registration journeys, owning the technical direction for millions of customers entering the Tesco ecosystem.",
    roles: [
      {
        title: 'Senior Software Engineer',
        sub: 'Tesco · Full-time',
        dateRange: 'Nov 2019 – Present',
        duration: '6 yrs 9 mos',
        skills: ['Leadership', 'Mentoring', 'TypeScript', 'Node.js', 'React', 'Architecture', 'Strategy', 'Identity', 'Authentication', 'Security'],
      },
    ],
  },
  {
    name: 'Whitbread',
    logo: '/images/logos/whitbread.svg',
    location: 'London Area, United Kingdom',
    duration: '2 yrs 3 mos',
    blurb: "Led product engineering across Whitbread's digital estate, including Premier Inn's booking journeys.",
    roles: [
      {
        title: 'Technical Lead',
        dateRange: 'Dec 2018 – Aug 2019',
        duration: '9 mos',
        blurb: "Technical lead for the front-end, setting technical direction and driving the migration from Angular.js to React across Whitbread's booking platforms.",
        skills: ['Leadership', 'Architecture', 'React', 'Mentoring'],
      },
      {
        title: 'Senior Product Developer',
        dateRange: 'Jun 2017 – Nov 2018',
        duration: '1 yr 6 mos',
        blurb: 'Senior engineer on the Business Booker area of the Premier Inn website, building customer-facing booking features with React and a modern front-end toolchain.',
        skills: ['React', 'JavaScript', 'Angular.js', 'SCSS'],
      },
    ],
  },
  {
    name: 'Next Ltd',
    logo: '/images/logos/next.png',
    location: 'Enderby, UK',
    duration: '4 yrs 8 mos',
    blurb: "Delivered and scaled front-end features for Next's high-traffic eCommerce platform.",
    roles: [
      {
        title: 'Lead Developer',
        dateRange: 'Feb 2017 – Apr 2017',
        duration: '3 mos',
        blurb: 'Led the mobile engineering team for next.co.uk, owning architecture, code quality and mentoring across the team.',
        skills: ['Leadership', 'Mentoring', 'JavaScript', 'Angular.js', 'SQL Server', 'C#', 'ASP.NET'],
      },
      {
        title: 'Senior eCommerce Developer',
        dateRange: 'Feb 2015 – Feb 2017',
        duration: '2 yrs 1 mo',
        blurb: "Delivered and optimised high-traffic features for Next's online store, leading projects and running a scrum team across the .NET and front-end stack.",
        skills: ['ASP.NET', 'C#', 'jQuery', 'SQL Server', 'Angular.js'],
      },
      {
        title: 'eCommerce Developer',
        dateRange: 'Sep 2012 – Feb 2015',
        duration: '2 yrs 6 mos',
        blurb: "Developed and maintained features for Next's eCommerce platform using ASP.NET, C# and jQuery.",
        skills: ['ASP.NET', 'C#', 'jQuery', 'SQL Server'],
      },
    ],
  },
  {
    name: 'Dreamscape Design Ltd',
    logo: '/images/logos/dreamscape.jpeg',
    location: 'Nuneaton, UK',
    blurb: 'Built bespoke websites and web applications for a range of agency clients.',
    roles: [
      {
        title: 'Web Developer',
        sub: 'Dreamscape Design Ltd',
        dateRange: 'May 2007 – Aug 2012',
        duration: '5 yrs 4 mos',
        skills: ['HTML', 'CSS', 'JavaScript', 'jQuery', 'ASP.NET', 'VB.NET', 'SQL Server'],
      },
    ],
  },
]
