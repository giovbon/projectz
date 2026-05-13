import { marked } from 'marked';

// Configure marked for GFM and other features
marked.setOptions({
  gfm: true,
  breaks: true,
});

/**
 * Renders markdown string to HTML.
 * In self-hosted mode, the server already converts markdown to HTML.
 * This is used primarily for GitHub Pages mode and for the reveal.js slides.
 */
export function renderMarkdown(md: string): string {
  return marked.parse(md) as string;
}

/**
 * Splits markdown content into slides based on "---" separators.
 * Each slide is individually rendered to HTML.
 */
export function parseSlides(markdown: string): string[] {
  const rawSlides = markdown.split('\n---\n');
  return rawSlides
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map((s) => renderMarkdown(s));
}
