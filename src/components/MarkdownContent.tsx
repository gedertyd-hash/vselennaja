import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { CodeBlock } from "@/components/CodeBlock";

export function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="prose-iishnitsa prose prose-sm sm:prose-base">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          pre: CodeBlock,
          video: (props) => (
            <video
              {...props}
              controls
              className="w-full aspect-video rounded-2xl border border-border bg-black"
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
