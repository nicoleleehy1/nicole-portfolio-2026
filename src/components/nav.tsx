"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { RESUME_URL, sections } from "../app/metadata";

// Each link reads like a tracking label: hover draws corner brackets and shows its ID tag.
const navItems = sections.map((s, i) => ({ ...s, id: `NAV-${2203 + i * 4}` }));

export function Nav() {
  const pathname = usePathname();
  return (
    <nav className="nav" data-content>
      <Link href="/" className="nav-name" data-id="PRT-2201">Nicole Lee</Link>
      <div className="nav-links">
        {navItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
            data-id={item.id}
            className={`nav-link${pathname === item.href || pathname.startsWith(`${item.href}/`) ? " active" : ""}`}
          >
            {item.label}
          </Link>
        ))}
        <a href={RESUME_URL} target="_blank" rel="noreferrer" className="nav-link" data-id="NAV-2223">
          Resume
        </a>
      </div>
    </nav>
  );
}
