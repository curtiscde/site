import Link from "next/link";

export const Header = () => (
  <div className="navbar bg-base-100">
    <div className="avatar mx-2">
      <div className="w-10 rounded-full">
        <img src="/images/curtis.jpeg" />
      </div>
    </div>
    <Link href="/" className="btn btn-ghost text-xl">Curtis Timson</Link>
  </div>
)