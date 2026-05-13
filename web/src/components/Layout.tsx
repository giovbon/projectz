import { Sidebar } from './Sidebar';
import { MarkdownPage } from './MarkdownPage';
import { SlideDeck } from './SlideDeck';
import { CodeTree } from './CodeTree';
import { FormActivity } from './FormActivity';
import { useMenu } from '../hooks/useMenu';
import { useMarkdown } from '../hooks/useMarkdown';
import { useState, useCallback } from 'preact/hooks';

interface LayoutProps {
  path?: string;
  slug?: string;
  pageSlug?: string;
}

export function Layout({ slug, pageSlug }: LayoutProps) {
  const { menu, loading: menuLoading, error: menuError } = useMenu();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Determine the current page slug from URL or default
  const currentSlug = slug || pageSlug || 'index';
  const { page, slidesData, loading: pageLoading, error: pageError, isSlides } = useMarkdown(currentSlug);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  return (
    <div class="app-shell">
      {/* Top bar (mobile) */}
      <header class="topbar">
        <button class="menu-toggle" onClick={toggleSidebar} aria-label="Toggle menu">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            {sidebarOpen ? (
              <path d="M18 6L6 18M6 6l12 12" />
            ) : (
              <path d="M3 12h18M3 6h18M3 18h18" />
            )}
          </svg>
        </button>
        <span class="topbar-title">ProjectZ</span>
      </header>

      <div class="app-body">
        {/* Sidebar */}
        <aside class={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
          <div class="sidebar-header">
            <h2 class="sidebar-logo">📝 ProjectZ</h2>
          </div>
          <nav class="sidebar-nav">
            {menuLoading && <p class="sidebar-loading">Carregando menu...</p>}
            {menuError && <p class="sidebar-error">Erro: {menuError}</p>}
            {menu && <Sidebar menu={menu} currentSlug={currentSlug} />}
          </nav>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && <div class="sidebar-overlay" onClick={toggleSidebar} />}

        {/* Main content */}
        <main class="main-content">
          {pageLoading && (
            <div class="loading-spinner">
              <div class="spinner" />
              <p>Carregando...</p>
            </div>
          )}

          {pageError && (
            <div class="error-box">
              <h2>Erro</h2>
              <p>{pageError}</p>
            </div>
          )}

          {!pageLoading && !pageError && page && (
            <>
              {page.notFound && (
                <div class="error-box">
                  <h2>404 — Página não encontrada</h2>
                  <p>A página <code>{currentSlug}</code> não existe.</p>
                </div>
              )}

              {!page.notFound && isSlides && <SlideDeck slidesData={slidesData!} />}

              {!page.notFound && page.type === 'codetree' && <CodeTree raw={page.raw || ''} />}

              {!page.notFound && !isSlides && page.type !== 'codetree' && (
                <MarkdownPage html={page.html || ''} title={page.title} />
              )}

              {!page.notFound && page.type === 'form' && <FormActivity />}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
