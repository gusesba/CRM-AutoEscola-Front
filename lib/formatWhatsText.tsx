import React from "react";

export function formatWhatsText(text: string): React.ReactNode[] {
  const patterns: {
    regex: RegExp;
    render: (t: string, i: number) => React.ReactNode;
  }[] = [
    {
      regex: /\*(.*?)\*/g,
      render: (t, i) => <strong key={i}>{t}</strong>,
    },
    {
      regex: /_(.*?)_/g,
      render: (t, i) => <em key={i}>{t}</em>,
    },
    {
      regex: /~(.*?)~/g,
      render: (t, i) => <s key={i}>{t}</s>,
    },
    {
      regex: /`([^`]+)`/g,
      render: (t, i) => (
        <code
          key={i}
          className="px-1 py-0.5 rounded bg-gray-200 text-[0.85em] font-mono"
        >
          {t}
        </code>
      ),
    },
  ];

  let nodes: React.ReactNode[] = [text];

  patterns.forEach(({ regex, render }) => {
    const newNodes: React.ReactNode[] = [];

    nodes.forEach((node) => {
      if (typeof node !== "string") {
        newNodes.push(node);
        return;
      }

      let lastIndex = 0;
      let match;
      let keyIndex = 0;

      while ((match = regex.exec(node)) !== null) {
        const [full, content] = match;
        const start = match.index;

        newNodes.push(node.slice(lastIndex, start));
        newNodes.push(render(content, keyIndex++));

        lastIndex = start + full.length;
      }

      newNodes.push(node.slice(lastIndex));
    });

    nodes = newNodes;
  });

  return nodes;
}
