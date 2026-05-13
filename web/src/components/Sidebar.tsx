import { Menu, Section, Page } from '../lib/api';

interface SidebarProps {
  menu: Menu;
  currentSlug: string;
}

export function Sidebar({ menu, currentSlug }: SidebarProps) {
  return (
    <ul class="sidebar-tree">
      {menu.sections.map((section) => (
        <SidebarSection key={section.slug} section={section} currentSlug={currentSlug} />
      ))}
    </ul>
  );
}

function SidebarSection({ section, currentSlug }: { section: Section; currentSlug: string }) {
  const hasMultiplePages = section.pages.length > 1;
  const isActive = section.pages.some((p) => p.slug === currentSlug);

  return (
    <li class="sidebar-section">
      {hasMultiplePages ? (
        <details open={isActive}>
          <summary class={`sidebar-section-label ${isActive ? 'active' : ''}`}>
            {section.type === 'slides' && '🎥 '}
            {section.label}
          </summary>
          <ul class="sidebar-pages">
            {section.pages.map((page) => (
              <SidebarItem key={page.slug} page={page} currentSlug={currentSlug} sectionSlug={section.slug} />
            ))}
          </ul>
        </details>
      ) : (
        <>
          {section.pages.length === 1 ? (
            <SidebarItem page={section.pages[0]} currentSlug={currentSlug} sectionSlug={section.slug} />
          ) : (
            <span class="sidebar-section-label empty">{section.label}</span>
          )}
        </>
      )}
    </li>
  );
}

function SidebarItem({
  page,
  currentSlug,
  sectionSlug,
}: {
  page: Page;
  currentSlug: string;
  sectionSlug: string;
}) {
  const href = `/${page.path.replace(/\.md$/, '')}`;
  const isActive = page.slug === currentSlug;

  return (
    <li class="sidebar-item">
      <a href={href} class={`sidebar-link ${isActive ? 'active' : ''}`}>
        {page.type === 'slides' && '🎥 '}
        {page.type === 'codetree' && '🌳 '}
        {page.title}
      </a>
    </li>
  );
}
