"use client";

import { isValidElement, useState, type ReactNode } from "react";
import { IconCheck, IconCopy } from "@/components/icons";

function extractText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (isValidElement(node)) return extractText((node.props as { children?: ReactNode }).children);
  return "";
}

export function CodeBlock({ children }: { children?: ReactNode }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const text = extractText(children).replace(/\n$/, "");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <button
        type="button"
        onClick={handleCopy}
        className={`absolute top-2.5 right-2.5 flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition ${
          copied
            ? "border-yolk/50 bg-yolk/10 text-yolk"
            : "border-border bg-bg-elevated text-cream/70 hover:border-yolk/50 hover:text-yolk"
        }`}
      >
        {copied ? (
          <>
            <IconCheck className="w-3.5 h-3.5" />
            Скопировано
          </>
        ) : (
          <>
            <IconCopy className="w-3.5 h-3.5" />
            Копировать
          </>
        )}
      </button>
      <pre>{children}</pre>
    </div>
  );
}
