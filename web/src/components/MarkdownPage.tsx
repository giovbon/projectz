interface MarkdownPageProps {
  html: string;
  title?: string;
}

export function MarkdownPage({ html, title }: MarkdownPageProps) {
  return (
    <article class="markdown-body">
      {title && <h1 class="page-title">{title}</h1>}
      <div
        class="markdown-content"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </article>
  );
}
