"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Command, Sun, Moon, ArrowUpRight } from "lucide-react";
import { tools } from "@/config/tools";
import { Button } from "./ui/button";
export function Header() {
  const [light, setLight] = useState(false);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  useEffect(() => {
    try {
      const v = localStorage.getItem("toolbox-theme") === "light";
      setLight(v);
      document.documentElement.dataset.theme = v ? "light" : "dark";
    } catch {}
    const key = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  function toggle() {
    setLight(!light);
    document.documentElement.dataset.theme = !light ? "light" : "dark";
    try {
      localStorage.setItem("toolbox-theme", !light ? "light" : "dark");
    } catch {}
  }
  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          <Link href="/" className="brand">
            <span className="brand-icon">
              <Command size={21} />
            </span>
            <span>
              developer<span className="brand-thin">toolbox</span>
              <span className="brand-dot">.</span>
            </span>
          </Link>
          <nav aria-label="Main navigation">
            <Link href="/#categories">Explore tools</Link>
            <Link href="/about">About</Link>
            <a
              href="https://github.com/rigilg/developer-toolbox"
              target="_blank"
              rel="noreferrer"
            >
              GitHub <ArrowUpRight size={13} />
            </a>
            <a href="https://rigilgilbert.com" target="_blank" rel="noreferrer">
              By Rigil <ArrowUpRight size={13} />
            </a>
          </nav>
          <div className="header-actions">
            <button
              className="search-shortcut"
              onClick={() => setOpen(true)}
              aria-label="Quick search tools"
              aria-keyshortcuts="Control+K Meta+K"
            >
              <span>Quick search</span>
              <kbd aria-hidden="true">⌘ K</kbd>
            </button>
            <Button
              variant="ghost"
              onClick={toggle}
              aria-label="Toggle color theme"
            >
              {light ? <Moon size={18} /> : <Sun size={18} />}
            </Button>
          </div>
        </div>
      </header>
      {open && (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <section
            className="command-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Find a tool"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="command-input">
              <input
                autoFocus
                aria-label="Search all tools"
                placeholder="What are you working on?"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Close
              </Button>
            </div>
            <div className="command-results">
              {tools
                .filter((t) =>
                  (t.name + " " + t.keywords.join(" "))
                    .toLowerCase()
                    .includes(search.toLowerCase()),
                )
                .map((t) => (
                  <Link
                    key={t.slug}
                    href={"/tools/" + t.slug}
                    onClick={() => setOpen(false)}
                  >
                    {t.name}
                    <ArrowUpRight size={15} />
                  </Link>
                ))}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
