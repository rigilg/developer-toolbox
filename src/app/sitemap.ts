import type { MetadataRoute } from "next";
import { tools, categories } from "@/config/tools";
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    "",
    "/privacy",
    "/about",
    ...categories.map((c) => "/categories/" + c.id),
    ...tools.map((t) => "/tools/" + t.slug),
  ].map((path) => ({
    url: "https://toolbox.rigilgilbert.com" + path,
    changeFrequency: "monthly",
    priority: path === "" ? 1 : 0.7,
  }));
}
