/**
 * API client for ProjectZ.
 *
 * In self-hosted mode, calls go to /api/* on the same origin.
 * In GitHub Pages mode, we detect the environment and adjust endpoints accordingly.
 */

const API_BASE = isGitHubPages() ? '/projectz/api' : '/api';

function isGitHubPages(): boolean {
  return window.location.hostname.includes('github.io');
}

export interface Section {
  label: string;
  slug: string;
  pages: Page[];
  type?: string;
}

export interface Page {
  title: string;
  slug: string;
  path: string;
  type?: string;
  theme?: string;
}

export interface Menu {
  sections: Section[];
}

export interface PageResponse {
  title: string;
  slug: string;
  path: string;
  html: string;
  raw: string;
  type?: string;
  theme?: string;
  notFound?: boolean;
}

export interface SlidesResponse {
  title: string;
  theme: string;
  slides: string[];
  raw: string;
}

export async function fetchMenu(): Promise<Menu> {
  // In GitHub Pages mode, fetch a pre-built menu.json
  if (isGitHubPages()) {
    const res = await fetch(`${API_BASE}/menu.json`);
    if (!res.ok) throw new Error('Failed to fetch menu');
    return res.json();
  }

  const res = await fetch(`${API_BASE}/menu`);
  if (!res.ok) throw new Error('Failed to fetch menu');
  return res.json();
}

export async function fetchPage(slug: string): Promise<PageResponse> {
  if (isGitHubPages()) {
    // Fetch pre-rendered HTML or raw markdown
    const res = await fetch(`${API_BASE}/pages/${slug}.json`);
    if (res.status === 404) {
      return { title: '', slug, path: '', html: '', raw: '', notFound: true };
    }
    if (!res.ok) throw new Error('Failed to fetch page');
    return res.json();
  }

  const res = await fetch(`${API_BASE}/page/${slug}`);
  if (!res.ok) throw new Error('Failed to fetch page');
  return res.json();
}

export async function fetchSlides(slug: string): Promise<SlidesResponse> {
  if (isGitHubPages()) {
    const res = await fetch(`${API_BASE}/slides/${slug}.json`);
    if (!res.ok) throw new Error('Failed to fetch slides');
    return res.json();
  }

  const res = await fetch(`${API_BASE}/slides/${slug}`);
  if (!res.ok) throw new Error('Failed to fetch slides');
  return res.json();
}

export async function submitActivity(data: {
  name: string;
  email: string;
  message: string;
}): Promise<{ status: string; message: string }> {
  const res = await fetch(`${API_BASE}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...data, date: new Date().toISOString() }),
  });
  if (!res.ok) throw new Error('Failed to submit');
  return res.json();
}
