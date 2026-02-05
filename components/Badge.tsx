import { ReactNode } from "react";

export default function Badge({
  children,
  className,
  dotColor
}: {
  children: ReactNode;
  className?: string;
  dotColor?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-700 ${
        className ?? ""
      }`}
    >
      {dotColor ? (
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: dotColor }}
        />
      ) : null}
      {children}
    </span>
  );
}
