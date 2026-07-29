"use client";

import { useRef, useState } from "react";

export function CodeBlock(props: React.ComponentProps<"pre">) {
  const preRef = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = preRef.current?.textContent ?? "";
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className="relative my-5">
      <button
        type="button"
        onClick={handleCopy}
        className="absolute top-3 right-3 rounded-full bg-yolk text-yolk-ink text-xs font-semibold px-3 py-1.5 hover:bg-yolk-bright transition"
      >
        {copied ? "Скопировано" : "Скопировать"}
      </button>
      <pre ref={preRef} {...props} />
    </div>
  );
}
