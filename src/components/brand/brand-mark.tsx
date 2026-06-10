import { cn } from "@/lib/utils";

type BrandMarkProps = {
  className?: string;
};

export function BrandMark({ className }: BrandMarkProps) {
  return (
    <span
      className={cn(
        "inline-flex size-9 shrink-0 items-center justify-center rounded-md border border-primary/20 bg-primary/5 text-primary",
        className,
      )}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 48 48"
        className="size-7"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M16.5 34.5h17.25c5.25 0 9.5-3.58 9.5-8 0-3.93-3.35-7.2-7.77-7.88C34.16 12.86 29.05 8.5 23 8.5c-6.4 0-11.75 4.86-12.35 11.15C7.32 20.7 5 23.45 5 26.75c0 4.28 3.93 7.75 8.78 7.75h2.72Z"
          fill="#FFF6EE"
          stroke="currentColor"
          strokeWidth="2.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M18.5 24.75c.9 1.35 2.04 2.03 3.42 2.03 1.36 0 2.5-.68 3.4-2.03"
          stroke="#2E1F1A"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M29.25 24.75c.9 1.35 2.04 2.03 3.42 2.03 1.36 0 2.5-.68 3.4-2.03"
          stroke="#2E1F1A"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M24 29.75c1.25 1.15 2.6 1.72 4.03 1.72 1.42 0 2.75-.57 4-1.72"
          stroke="#C65A3A"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}
