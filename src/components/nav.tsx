"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { RESUME_URL } from "../app/metadata";

const navItems = [
  { label: "Experience", href: "/experience" },
  { label: "Research", href: "/research" },
  { label: "Projects", href: "/projects" },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <nav className="nav">
      <Link href="/" className="nav-name">Nicole Lee</Link>
      <div className="nav-links">
        {navItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-link${pathname === item.href ? " active" : ""}`}
          >
            {item.label}
          </Link>
        ))}
        <a href={RESUME_URL} target="_blank" rel="noreferrer" className="nav-link">
          Resume
        </a>
      </div>
    </nav>
  );
}
