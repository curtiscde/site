import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import { NavLinks } from "./NavLinks";
import { config } from "../config";
import { SiteImage } from "./SiteImage";

export const Header = () => {
  return (
    <div className="navbar bg-base-100">
      <div className="container mx-auto">
        <div className="flex-none">
          <div className="avatar mx-2">
            <div className="w-10 rounded-full">
              <Link href="/"><SiteImage src="/images/curtis.png" alt={config.title} sizes="40px" priority /></Link>
            </div>
          </div>
        </div>
        <div className="flex-1">
          <Link href="/" className="btn btn-ghost text-xl">{config.title}</Link>
        </div>
        <div className="flex-none flex items-center gap-1">
          <NavLinks />
          <ThemeToggle />
        </div>
      </div>
    </div>
  )
}