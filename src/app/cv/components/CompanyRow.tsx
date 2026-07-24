import Image from 'next/image'
import { Company, Role } from '../experience'

const SkillBadges = ({ skills, size }: { skills: string[]; size: 'sm' | 'xs' }) => (
  <div className={`flex flex-wrap ${size === 'sm' ? 'gap-2 mt-3' : 'gap-1.5 mt-2.5'}`}>
    {skills.map((skill) => (
      <span
        key={skill}
        className={`badge badge-outline rounded-[1.9rem] ${size === 'sm' ? 'text-[12.5px]' : 'text-xs'}`}
      >
        {skill}
      </span>
    ))}
  </div>
)

const SingleRole = ({ company, role }: { company: Company; role: Role }) => (
  <>
    <div className="text-lg font-bold text-base-content leading-tight">{role.title}</div>
    {role.sub && <div className="text-[15px] text-base-content">{role.sub}</div>}
    <div className="mt-0.5 text-sm text-base-content/60">{`${role.dateRange} · ${role.duration}`}</div>
    <div className="text-sm text-base-content/60">{company.location}</div>
    {company.blurb && <p className="mt-3 text-[14.5px] leading-relaxed text-base-content/80">{company.blurb}</p>}
    <SkillBadges skills={role.skills} size="sm" />
  </>
)

const RoleTimeline = ({ company }: { company: Company }) => (
  <>
    <div className="text-lg font-bold text-base-content leading-tight">{company.name}</div>
    {company.duration && <div className="mt-0.5 text-sm text-base-content/60">{company.duration}</div>}
    <div className="text-sm text-base-content/60">{company.location}</div>
    <div className="mt-3.5">
      {company.roles.map((role, index) => (
        <div key={role.title} className="relative pl-[22px] pb-4">
          <span className="absolute left-0 top-[5px] h-[9px] w-[9px] rounded-full bg-primary" />
          {index < company.roles.length - 1 && (
            <span className="absolute left-1 top-[14px] bottom-0 w-px bg-base-300" />
          )}
          <div className="text-[15px] font-bold text-base-content">{role.title}</div>
          <div className="text-[13.5px] text-base-content/60">{`${role.dateRange} · ${role.duration}`}</div>
          {role.blurb && <p className="mt-[7px] text-sm leading-snug text-base-content/80">{role.blurb}</p>}
          <SkillBadges skills={role.skills} size="xs" />
        </div>
      ))}
    </div>
  </>
)

export const CompanyRow = ({ company }: { company: Company }) => {
  const isSingleRole = company.roles.length === 1

  return (
    <div className="flex gap-4 border-t border-base-200 py-6">
      <div className="cv-logo-tile flex-none w-14 h-14 rounded-lg">
        <Image
          src={company.logo}
          alt={`${company.name} logo`}
          width={56}
          height={56}
          className="h-full w-full rounded-lg object-contain p-1.5"
        />
      </div>
      <div className="min-w-0 flex-1">
        {isSingleRole ? <SingleRole company={company} role={company.roles[0]} /> : <RoleTimeline company={company} />}
      </div>
    </div>
  )
}
