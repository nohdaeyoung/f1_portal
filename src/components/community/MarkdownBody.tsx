import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";

interface Props {
  children: string;
  className?: string;
}

export function MarkdownBody({ children, className = "" }: Props) {
  return (
    <div className={`prose-f1 ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          h1: ({ children }) => <h1 className="text-xl font-bold text-white mt-5 mb-2">{children}</h1>,
          h2: ({ children }) => <h2 className="text-lg font-bold text-white mt-4 mb-2">{children}</h2>,
          h3: ({ children }) => <h3 className="text-base font-bold text-white mt-3 mb-1">{children}</h3>,
          p: ({ children }) => <p className="text-[#C8D0E0] leading-relaxed text-sm mb-3">{children}</p>,
          strong: ({ children }) => <strong className="text-white font-bold">{children}</strong>,
          em: ({ children }) => <em className="italic text-[#CBD5E1]">{children}</em>,
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-[#E8002D] hover:underline">
              {children}
            </a>
          ),
          ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-3 text-[#C8D0E0] text-sm">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 mb-3 text-[#C8D0E0] text-sm">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-[#E8002D] pl-4 my-3 text-[#94A3B8] italic text-sm">
              {children}
            </blockquote>
          ),
          code: ({ children, className: codeClass }) => {
            const isBlock = codeClass?.startsWith("language-");
            if (isBlock) {
              return (
                <pre className="bg-[#0D0D14] border border-[#2D2D3A] rounded-lg p-4 overflow-x-auto my-3">
                  <code className="text-[#E2E8F0] text-xs font-mono leading-relaxed">{children}</code>
                </pre>
              );
            }
            return (
              <code className="bg-[#1E1E2E] text-[#E8002D] text-xs font-mono px-1.5 py-0.5 rounded">{children}</code>
            );
          },
          hr: () => <hr className="border-[#2D2D3A] my-4" />,
          table: ({ children }) => (
            <div className="overflow-x-auto my-3">
              <table className="w-full text-sm border-collapse">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="border-b border-[#2D2D3A]">{children}</thead>,
          th: ({ children }) => <th className="text-left px-3 py-2 text-xs text-[#64748B] uppercase font-bold">{children}</th>,
          td: ({ children }) => <td className="px-3 py-2 text-[#C8D0E0] border-b border-[#2D2D3A]/50">{children}</td>,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
