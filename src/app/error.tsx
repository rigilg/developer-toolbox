"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="prose-page">
      <h1>Something went wrong.</h1>
      <p>Your input has not been saved. Reload the workspace to try again.</p>
      <button className="button button-primary" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
