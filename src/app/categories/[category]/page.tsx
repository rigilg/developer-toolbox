import { notFound } from "next/navigation";
import { categories } from "@/config/tools";
import { Directory } from "@/components/directory";
export function generateStaticParams() {
  return categories.map((c) => ({ category: c.id }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const c = categories.find((c) => c.id === category);
  return {
    title: c?.name,
    description: c?.description,
    alternates: { canonical: "/categories/" + category },
  };
}
export default async function Page({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  if (!categories.some((c) => c.id === category)) notFound();
  return <Directory category={category} />;
}
