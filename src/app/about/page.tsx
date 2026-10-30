export const metadata = { title: "About", alternates: { canonical: "/about" } };
export default function About() {
  return (
    <article className="prose-page">
      <div className="eyebrow">MADE FOR THE WORK BETWEEN THE WORK</div>
      <h1>A better everyday toolbox.</h1>
      <p>
        Developer Toolbox brings 37 useful utilities into one focused workspace.
        Built by Rigil Gilbert for developers, API engineers and anyone who
        spends their day turning data into working software.
      </p>
      <h2>Small tools. Clear answers.</h2>
      <p>
        Explore six categories covering data, encoding, identity, APIs, time and
        generation. Every utility is free, works without registration and makes
        its processing boundaries clear.
      </p>
      <h2>Built with care</h2>
      <p>
        The project uses Next.js, TypeScript and browser cryptographic APIs,
        with independent logic modules and automated tests. Existing Base64 and
        JWT decoder behaviors have been retained from Rigil’s original
        utilities.
      </p>
      <p>
        <a href="https://rigilgilbert.com">Visit rigilgilbert.com →</a>
      </p>
    </article>
  );
}
