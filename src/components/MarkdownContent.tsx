"use client";

import type { ReactNode } from "react";

type Block =
  | { type: "heading"; level: 1 | 2 | 3; text: string }
  | { type: "image"; alt: string; src: string }
  | { type: "paragraph"; text: string }
  | { type: "quote"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "code"; language?: string; code: string };

const headingClasses: Record<1 | 2 | 3, string> = {
  1: "mt-8 mb-4 text-4xl font-bold tracking-tight text-slate-950",
  2: "mt-7 mb-3 text-2xl font-bold tracking-tight text-slate-900",
  3: "mt-6 mb-2 text-xl font-semibold text-slate-900",
};

function safeHref(href: string) {
  if (/^(https?:\/\/|mailto:|\/)/i.test(href)) {
    return href;
  }

  return "#";
}

function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];
    const key = `${match.index}-${token}`;

    if (token.startsWith("`")) {
      nodes.push(
        <code key={key} className="rounded bg-slate-100 px-1.5 py-0.5 text-[0.92em] font-medium text-slate-900">
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith("**")) {
      nodes.push(<strong key={key}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("*")) {
      nodes.push(<em key={key}>{token.slice(1, -1)}</em>);
    } else {
      const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        nodes.push(
          <a
            key={key}
            href={safeHref(linkMatch[2])}
            className="font-medium text-indigo-600 underline underline-offset-2 hover:text-indigo-700"
            target={linkMatch[2].startsWith("http") ? "_blank" : undefined}
            rel={linkMatch[2].startsWith("http") ? "noreferrer" : undefined}
          >
            {linkMatch[1]}
          </a>
        );
      }
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

function parseMarkdown(markdown: string): Block[] {
  const blocks: Block[] = [];
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) {
      index += 1;
      continue;
    }

    const fenceMatch = trimmed.match(/^```(\w+)?/);
    if (fenceMatch) {
      const codeLines: string[] = [];
      index += 1;

      while (index < lines.length && !lines[index].trim().startsWith("```")) {
        codeLines.push(lines[index]);
        index += 1;
      }

      blocks.push({ type: "code", language: fenceMatch[1], code: codeLines.join("\n") });
      index += 1;
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      blocks.push({
        type: "heading",
        level: headingMatch[1].length as 1 | 2 | 3,
        text: headingMatch[2],
      });
      index += 1;
      continue;
    }

    const imageMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imageMatch) {
      blocks.push({
        type: "image",
        alt: imageMatch[1] || "Chapter image",
        src: imageMatch[2],
      });
      index += 1;
      continue;
    }

    if (trimmed.startsWith(">")) {
      const quoteLines: string[] = [];
      while (index < lines.length && lines[index].trim().startsWith(">")) {
        quoteLines.push(lines[index].trim().replace(/^>\s?/, ""));
        index += 1;
      }
      blocks.push({ type: "quote", text: quoteLines.join(" ") });
      continue;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (index < lines.length && /^[-*]\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^[-*]\s+/, ""));
        index += 1;
      }
      blocks.push({ type: "ul", items });
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = [];
      while (index < lines.length && /^\d+\.\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^\d+\.\s+/, ""));
        index += 1;
      }
      blocks.push({ type: "ol", items });
      continue;
    }

    const paragraphLines: string[] = [];
    while (
      index < lines.length &&
      lines[index].trim() &&
      !/^(#{1,3})\s+/.test(lines[index].trim()) &&
      !/^!\[[^\]]*\]\([^)]+\)$/.test(lines[index].trim()) &&
      !/^```/.test(lines[index].trim()) &&
      !/^[-*]\s+/.test(lines[index].trim()) &&
      !/^\d+\.\s+/.test(lines[index].trim()) &&
      !lines[index].trim().startsWith(">")
    ) {
      paragraphLines.push(lines[index].trim());
      index += 1;
    }

    blocks.push({ type: "paragraph", text: paragraphLines.join(" ") });
  }

  return blocks;
}

export function MarkdownContent({ content }: { content: string }) {
  const blocks = parseMarkdown(content || "No content available.");

  return (
    <article className="mt-8 max-w-none text-slate-700">
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          const Heading = `h${block.level}` as const;
          return (
            <Heading key={index} className={headingClasses[block.level]}>
              {renderInline(block.text)}
            </Heading>
          );
        }

        if (block.type === "paragraph") {
          return (
            <p key={index} className="my-4 text-base leading-7 text-slate-700 break-words">
              {renderInline(block.text)}
            </p>
          );
        }

        if (block.type === "image") {
          return (
            <figure key={index} className="my-6">
              <img
                src={safeHref(block.src)}
                alt={block.alt}
                className="max-h-[520px] w-full rounded-lg border border-slate-200 object-contain"
              />
              {block.alt && block.alt !== "Chapter image" && (
                <figcaption className="mt-2 text-center text-sm text-slate-500">{block.alt}</figcaption>
              )}
            </figure>
          );
        }

        if (block.type === "quote") {
          return (
            <blockquote key={index} className="my-5 border-l-4 border-indigo-200 bg-indigo-50 px-4 py-3 text-slate-700 break-words">
              {renderInline(block.text)}
            </blockquote>
          );
        }

        if (block.type === "ul") {
          return (
            <ul key={index} className="my-4 list-disc space-y-2 pl-6 text-base leading-7">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex} className="break-words">{renderInline(item)}</li>
              ))}
            </ul>
          );
        }

        if (block.type === "ol") {
          return (
            <ol key={index} className="my-4 list-decimal space-y-2 pl-6 text-base leading-7">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex} className="break-words">{renderInline(item)}</li>
              ))}
            </ol>
          );
        }

        return (
          <pre key={index} className="my-5 overflow-x-auto rounded-lg bg-slate-950 p-4 text-sm leading-6 text-slate-100">
            <code>{block.code}</code>
          </pre>
        );
      })}
    </article>
  );
}
