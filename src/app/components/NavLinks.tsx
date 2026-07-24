'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"

const links = [
  { href: "/", label: "Blog" },
  { href: "/cv", label: "CV" },
]

const isActive = (pathname: string, href: string) =>
  href === "/" ? pathname === "/" : pathname.startsWith(href)

export const NavLinks = () => {
  const pathname = usePathname()

  return (
    <nav className="flex items-center gap-0.5 sm:gap-1">
      {links.map(({ href, label }) => {
        const active = isActive(pathname, href)
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`btn btn-ghost btn-sm px-2 sm:px-3 ${active ? "text-primary font-bold bg-primary/10" : "font-semibold"}`}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
