import { ReactNode } from "react";
import type { CSSProperties } from "react";

export default function Card({
  children,
  className,
  style
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 ${
        className ?? ""
      }`}
      style={style}
    >
      {children}
    </div>
  );
}
