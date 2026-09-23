'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navLinks = [
  { href: '/', label: '📊 Dashboard' },
  { href: '/devices', label: '📡 Devices' },
  { href: '/summary', label: '📈 Summary' },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="navbar">
      <div className="navbar__brand">
        <div className="navbar__icon">📡</div>
        <span className="navbar__title">Fleet Monitor</span>
      </div>
      <div className="navbar__links">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`navbar__link ${pathname === link.href ? 'navbar__link--active' : ''}`}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
