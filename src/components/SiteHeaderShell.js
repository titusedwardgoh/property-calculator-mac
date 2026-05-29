/** Shared outer padding/width for public, logged-in, and survey headers */
export default function SiteHeaderShell({ children }) {
  return (
    <div className="md:ml-10">
      <div className="container mx-auto max-w-7xl px-4 py-3 sm:py-4">{children}</div>
    </div>
  );
}
