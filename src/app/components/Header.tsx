import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";

export const Header = () => {
  return (
    <div className="navbar bg-base-100">
      <div className="container mx-auto">
        <div className="flex-none">
          <div className="avatar mx-2">
            <div className="w-10 rounded-full">
              <img src="/images/curtis.jpeg" />
            </div>
          </div>
        </div>
        <div className="flex-1">
          <Link href="/" className="btn btn-ghost text-xl">Curtis Timson</Link>
        </div>
        <div className="flex-none">
          <ThemeToggle />
        </div>
      </div>
    </div>
  )
}