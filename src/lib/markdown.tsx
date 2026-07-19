import { Fragment, type ReactNode } from "react";

const INLINE_PATTERN = /\*\*(.+?)\*\*|`(.+?)`|\[(.+?)\]\((.+?)\)/g;

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let idx = 0;

  INLINE_PATTERN.lastIndex = 0;
  while ((match = INLINE_PATTERN.exec(text))) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    if (match[1] !== undefined) {
      nodes.push(<strong key={`${keyPrefix}-${idx++}`}>{match[1]}</strong>);
    } else if (match[2] !== undefined) {
      nodes.push(
        <code key={`${keyPrefix}-${idx++}`} className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
          {match[2]}
        </code>
      );
    } else {
      nodes.push(
        <a
          key={`${keyPrefix}-${idx++}`}
          href={match[4]}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-foreground"
        >
          {match[3]}
        </a>
      );
    }

    lastIndex = INLINE_PATTERN.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

export function Markdown({ text, className }: { text: string; className?: string }) {
  const paragraphs = text.split(/\n\n+/);

  return (
    <div className={className}>
      {paragraphs.map((paragraph, pIdx) => (
        <p key={pIdx} className={pIdx > 0 ? "mt-2" : undefined}>
          {paragraph.split("\n").map((line, lIdx, arr) => (
            <Fragment key={lIdx}>
              {renderInline(line, `${pIdx}-${lIdx}`)}
              {lIdx < arr.length - 1 && <br />}
            </Fragment>
          ))}
        </p>
      ))}
    </div>
  );
}
