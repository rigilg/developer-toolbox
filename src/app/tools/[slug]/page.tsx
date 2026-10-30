import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, ArrowUpRight } from "lucide-react";
import { tools, toolBySlug, categories } from "@/config/tools";
import { Workbench } from "@/components/tools/workbench";
import { Icon } from "@/components/icon";
export function generateStaticParams() {
  return tools.map((t) => ({ slug: t.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const t = toolBySlug(slug);
  return {
    title: t?.name + " Online",
    description: t?.description + " Free, with no account required.",
    alternates: { canonical: "/tools/" + slug },
    openGraph: {
      title: t?.name + " — Developer Toolbox",
      description: t?.description,
      url: "/tools/" + slug,
    },
  };
}
export default async function ToolPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tool = toolBySlug(slug);
  if (!tool) notFound();
  const category = categories.find((c) => c.id === tool.category)!;
  return (
    <div className="tool-page">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/">Toolbox</Link>
        <ChevronRight size={12} />
        <Link href={"/categories/" + category.id}>{category.name}</Link>
        <ChevronRight size={12} />
        <span>{tool.name}</span>
      </nav>
      <div className="tool-page-heading">
        <span className="large-tool-icon" style={{ color: category.color }}>
          <Icon name={tool.icon} size={27} />
        </span>
        <div>
          <div className="eyebrow small">{category.name}</div>
          <h1>{tool.name}</h1>
          <p>{tool.description}</p>
        </div>
      </div>
      <Workbench key={slug} tool={tool} />
      <section className="tool-help">
        <h2>How to use {tool.name}</h2>
        <p>
          {["pkce-generator", "password-generator", "uuid-generator"].includes(
            slug,
          )
            ? "Choose your generation settings, then select Generate. Copy or download the result; generated values are never saved."
            : "Paste your input or load the example, choose the relevant options, then select Run tool. Errors appear below the editors. Copy or download the result when ready."}
        </p>
        {tool.note && <p>{tool.note}</p>}
        <p>
          Keyboard shortcuts: Ctrl/⌘ + Enter to run, Ctrl/⌘ + K to find another
          tool.
        </p>
      </section>
      <section className="related-tools">
        <h2>Keep your workflow moving</h2>
        <div>
          {tools
            .filter((t) => t.category === tool.category && t.slug !== slug)
            .slice(0, 4)
            .map((t) => (
              <Link key={t.slug} href={"/tools/" + t.slug}>
                {t.name}
                <ArrowUpRight size={15} />
              </Link>
            ))}
        </div>
      </section>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: tool.name,
            url: "https://toolbox.rigilgilbert.com/tools/" + slug,
            description: tool.description,
            applicationCategory: "DeveloperApplication",
            operatingSystem: "Any modern browser",
            offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
          }).replace(/</g, "\u003c"),
        }}
      />
    </div>
  );
}
