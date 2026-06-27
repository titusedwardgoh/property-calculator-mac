"use client";

export default function QuestionInfoTooltip({ ariaLabel, children }) {
  if (children == null || String(children).trim() === "") return null;

  return (
    <span className="group relative ml-1.5 inline-flex shrink-0 align-middle">
      <button
        type="button"
        aria-label={ariaLabel}
        className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-400 text-sm font-semibold text-gray-500 transition-colors hover:border-primary hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      >
        i
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 z-20 mb-2 w-72 max-w-[min(18rem,calc(100vw-2rem))] rounded-lg bg-secondary px-3 py-2 text-left text-sm leading-snug text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {children}
      </span>
    </span>
  );
}
