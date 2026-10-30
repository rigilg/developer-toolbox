import Link from "next/link";
import { Command, ArrowUpRight } from "lucide-react";
export function Footer() {
  return (
    <footer className="site-footer">
      <div>
        <Link href="/" className="footer-brand">
          <Command size={17} /> developer toolbox<span>.</span>
        </Link>
        <p>Small tools. A better workflow.</p>
      </div>
      <nav aria-label="Footer">
        <Link href="/about">About</Link>
        <Link href="/privacy">Privacy</Link>
        <a href="https://github.com/rigilg/developer-toolbox">
          GitHub <ArrowUpRight size={12} />
        </a>
        <a href="https://rigilgilbert.com">
          Contact <ArrowUpRight size={12} />
        </a>
      </nav>
      <span>© {new Date().getFullYear()} Rigil Gilbert</span>
    </footer>
  );
}
