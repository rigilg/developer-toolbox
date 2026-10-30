import Link from "next/link";
export default function NotFound() {
  return (
    <div className="prose-page">
      <h1>Tool not found.</h1>
      <p>Let’s get you back to the toolbox.</p>
      <Link href="/">Explore all 37 tools →</Link>
    </div>
  );
}
