"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Search,
  ArrowUpRight,
  ArrowRight,
  Star,
  ShieldCheck,
  Zap,
  Globe2,
} from "lucide-react";
import { tools, categories } from "@/config/tools";
import { Icon } from "./icon";
export function Directory({ category }: { category?: string }) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(category || "all");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    try {
      setFavorites(
        JSON.parse(localStorage.getItem("toolbox-favorites") || "[]"),
      );
      setRecent(JSON.parse(localStorage.getItem("toolbox-recent") || "[]"));
    } catch {}
    const key = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        !["INPUT", "TEXTAREA", "SELECT"].includes(
          (e.target as HTMLElement).tagName,
        )
      ) {
        e.preventDefault();
        input.current?.focus();
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  function favorite(slug: string) {
    const value = favorites.includes(slug)
      ? favorites.filter((s) => s !== slug)
      : [...favorites, slug];
    setFavorites(value);
    try {
      localStorage.setItem("toolbox-favorites", JSON.stringify(value));
    } catch {}
  }
  const visible = tools.filter(
    (t) =>
      (active === "all" ||
        (active === "favorites" && favorites.includes(t.slug)) ||
        t.category === active) &&
      (t.name + " " + t.keywords.join(" "))
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <>
      <section className="hero">
        <div className="hero-glow" />
        <div className="eyebrow">
          <span className="status-dot" /> YOUR EVERYDAY DEVELOPMENT COMPANION
        </div>
        <h1>
          {category ? (
            categories.find((c) => c.id === category)?.name
          ) : (
            <>
              Every developer tool.
              <br />
              <span>One place.</span>
            </>
          )}
        </h1>
        <p>
          A fast, free, privacy-focused collection of essential developer
          utilities.
          <br className="desktop-break" /> Less tab switching. More building.
        </p>
        <div className="hero-search">
          <Search size={21} />
          <input
            ref={input}
            aria-label="Search utilities"
            placeholder="Find a tool… JSON, Base64, JWT"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <kbd>/</kbd>
        </div>
        <div className="hero-benefits">
          <span>
            <ShieldCheck size={14} /> Browser-first privacy
          </span>
          <span>
            <Zap size={14} /> No sign-up. No friction.
          </span>
          <span>
            <Globe2 size={14} /> Always free
          </span>
        </div>
      </section>
      <section id="categories" className="directory">
        <div className="section-heading">
          <div>
            <div className="eyebrow small">THE RIGHT TOOL, RIGHT HERE</div>
            <h2>
              Explore the toolbox <span className="count-badge">37</span>
            </h2>
          </div>
          <span className="muted directory-count">
            Six categories. Endless possibilities.
          </span>
        </div>
        <div className="category-tabs" aria-label="Filter by category">
          <button
            aria-pressed={active === "all"}
            onClick={() => setActive("all")}
          >
            All tools <span>37</span>
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              aria-pressed={active === c.id}
              onClick={() => setActive(c.id)}
            >
              <Icon name={c.icon} size={15} />
              {c.name}
              <span>{tools.filter((t) => t.category === c.id).length}</span>
            </button>
          ))}
          <button
            aria-pressed={active === "favorites"}
            onClick={() => setActive("favorites")}
          >
            <Star size={15} />
            Saved
          </button>
        </div>
        {recent.length > 0 && !query && active === "all" && (
          <div className="recent">
            <span>Pick up where you left off</span>
            {recent.slice(0, 4).map((s) => {
              const t = tools.find((t) => t.slug === s);
              return (
                t && (
                  <Link key={s} href={"/tools/" + s}>
                    {t.name}
                    <ArrowUpRight size={12} />
                  </Link>
                )
              );
            })}
          </div>
        )}
        {visible.length === 0 ? (
          <div className="empty-state">
            No tools found. Try a different search or category.
          </div>
        ) : (
          categories
            .filter((c) => visible.some((t) => t.category === c.id))
            .map((c) => (
              <section key={c.id} className="category-section">
                <div className="category-title">
                  <span style={{ color: c.color }}>
                    <Icon name={c.icon} size={20} />
                  </span>
                  <h3>{c.name}</h3>
                  <span className="muted">{c.description}</span>
                  <Link
                    href={"/categories/" + c.id}
                    aria-label={"View " + c.name}
                  >
                    <ArrowRight size={17} />
                  </Link>
                </div>
                <div className="tool-grid">
                  {visible
                    .filter((t) => t.category === c.id)
                    .map((t, n) => (
                      <article className="tool-card" key={t.slug}>
                        <div className="card-top">
                          <span
                            className="tool-icon"
                            style={{ color: c.color }}
                          >
                            <Icon name={t.icon} size={20} />
                          </span>
                          <button
                            className={
                              "favorite " +
                              (favorites.includes(t.slug) ? "is-favorite" : "")
                            }
                            onClick={() => favorite(t.slug)}
                            aria-label={
                              (favorites.includes(t.slug)
                                ? "Unsave "
                                : "Save ") + t.name
                            }
                          >
                            <Star
                              size={16}
                              fill={
                                favorites.includes(t.slug)
                                  ? "currentColor"
                                  : "none"
                              }
                            />
                          </button>
                        </div>
                        <Link href={"/tools/" + t.slug} className="card-link">
                          <h4>{t.name}</h4>
                          <p>{t.description}</p>
                          <div className="card-bottom">
                            <span>
                              {t.remote ? "SERVER DIAGNOSTIC" : "RUNS LOCALLY"}
                              {n === 0 && c.id === "data" && <em>POPULAR</em>}
                            </span>
                            <ArrowUpRight size={17} />
                          </div>
                        </Link>
                      </article>
                    ))}
                </div>
              </section>
            ))
        )}
      </section>
      <section className="privacy-banner">
        <span className="privacy-icon">
          <ShieldCheck size={26} />
        </span>
        <div>
          <h2>Your data is your business.</h2>
          <p>
            Local tools process your input in your browser. No accounts, no
            trackers, no saved payloads.
          </p>
        </div>
        <Link href="/privacy">
          Our privacy promise <ArrowRight size={17} />
        </Link>
      </section>
    </>
  );
}
