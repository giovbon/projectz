import { defineConfig, Plugin } from "vite";
import preact from "@preact/preset-vite";
import * as fs from "node:fs";
import * as path from "node:path";

// Mock API plugin — simulates the Go backend using local content/ directory
function mockApiPlugin(): Plugin {
  const CONTENT_DIR = path.resolve(__dirname, "..", "content");

  function readMarkdownFiles(
    dir: string,
  ): Map<
    string,
    { raw: string; frontmatter: Record<string, string>; body: string }
  > {
    const map = new Map<
      string,
      { raw: string; frontmatter: Record<string, string>; body: string }
    >();
    const walk = (d: string, prefix: string) => {
      const entries = fs.readdirSync(d, { withFileTypes: true });
      for (const e of entries) {
        if (e.name.startsWith(".")) continue;
        const full = path.join(d, e.name);
        if (e.isDirectory()) {
          walk(full, prefix ? `${prefix}/${e.name}` : e.name);
        } else if (e.name.endsWith(".md")) {
          // Normalize Windows line endings
          const raw = fs.readFileSync(full, "utf-8").replace(/\r\n/g, "\n");
          const slug = (prefix ? `${prefix}/${e.name}` : e.name).replace(
            /\.md$/,
            "",
          );
          const fm: Record<string, string> = {};
          let body = raw;

          // Parse frontmatter
          if (raw.startsWith("---")) {
            const end = raw.indexOf("---", 3);
            if (end !== -1) {
              const fmText = raw.slice(3, end).trim();
              body = raw.slice(end + 3).trim();
              for (const line of fmText.split("\n")) {
                const colonIdx = line.indexOf(":");
                if (colonIdx !== -1) {
                  fm[line.slice(0, colonIdx).trim()] = line
                    .slice(colonIdx + 1)
                    .trim();
                }
              }
            }
          }
          map.set(slug, { raw, frontmatter: fm, body });
        }
      }
    };
    walk(dir, "");
    return map;
  }

  function buildMenu(
    allFiles: Map<
      string,
      { raw: string; frontmatter: Record<string, string>; body: string }
    >,
  ) {
    const entries = fs.readdirSync(CONTENT_DIR, { withFileTypes: true });
    const sections: any[] = [];

    for (const e of entries) {
      if (e.name.startsWith(".")) continue;
      if (e.isDirectory()) {
        const pages: any[] = [];
        for (const [slug, data] of allFiles) {
          if (slug.startsWith(e.name + "/") && !slug.endsWith("/_index")) {
            const pageName = path.basename(slug);
            const title =
              data.frontmatter.title || extractTitle(data.body) || pageName;
            const ptype = data.frontmatter.type || "";
            pages.push({
              title,
              slug: pageName,
              path: slug + ".md",
              type: ptype,
              theme: data.frontmatter.theme || "",
            });
          }
        }
        if (pages.length > 0) {
          const label = e.name
            .replace(/-/g, " ")
            .replace(/_/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase());
          const stype = e.name === "slides" ? "slides" : "";
          sections.push({ label, slug: e.name, pages, type: stype });
        }
      } else if (e.name.endsWith(".md")) {
        const slug = e.name.replace(/\.md$/, "");
        const data = allFiles.get(slug);
        const title =
          data?.frontmatter.title || (data ? extractTitle(data.body) : slug);
        sections.push({
          label: title,
          slug,
          pages: [{ title, slug, path: e.name }],
        });
      }
    }

    sections.sort((a, b) => a.label.localeCompare(b.label));
    return { sections };
  }

  function extractTitle(body: string): string {
    const m = body.match(/^#\s+(.+)/m);
    return m ? m[1] : "Untitled";
  }

  function markdownToHtml(md: string): string {
    // Simple markdown → HTML for mock (full goldmark parity in Go backend)
    let html = md
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      // Code blocks
      .replace(
        /```(\w*)\n([\s\S]*?)```/g,
        '<pre><code class="language-$1">$2</code></pre>',
      )
      // Inline code
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      // Headings
      .replace(/^#### (.+)$/gm, "<h4>$1</h4>")
      .replace(/^### (.+)$/gm, "<h3>$1</h3>")
      .replace(/^## (.+)$/gm, "<h2>$1</h2>")
      .replace(/^# (.+)$/gm, "<h1>$1</h1>")
      // Bold / italic
      .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
      // Images
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />')
      // Lists
      .replace(/^- (.+)$/gm, "<li>$1</li>")
      .replace(/(<li>.*<\/li>\n?)+/g, "<ul>$&</ul>")
      // Paragraphs
      .replace(/^(?!<[a-z]|$)(.+)$/gm, "<p>$1</p>")
      // Cleanup
      .replace(/<p>\s*<\/p>/g, "")
      .replace(/\n/g, "");

    return html;
  }

  const allFiles = readMarkdownFiles(CONTENT_DIR);
  const menu = buildMenu(allFiles);

  return {
    name: "projectz-mock-api",
    configureServer(server) {
      // GET /api/menu
      server.middlewares.use("/api/menu", (_req, res) => {
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(menu));
      });

      // GET /api/page/*
      server.middlewares.use("/api/page", (req, res) => {
        // Connect strips the prefix from req.url, so it's just /path
        let pagePath = (req.url || "").replace(/^\//, "") || "index";
        if (!pagePath.endsWith(".md")) pagePath += ".md";

        const slug = pagePath.replace(/\.md$/, "");
        const data = allFiles.get(slug);

        if (!data) {
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({ notFound: true, slug: path.basename(slug) }),
          );
          return;
        }

        const title = data.frontmatter.title || extractTitle(data.body);
        const ptype = data.frontmatter.type || "";
        const html = markdownToHtml(data.body);

        res.setHeader("Content-Type", "application/json");
        res.end(
          JSON.stringify({
            title,
            slug: path.basename(slug),
            path: pagePath,
            html,
            raw: data.raw,
            type: ptype,
            theme: data.frontmatter.theme || "",
          }),
        );
      });

      // GET /api/slides/*
      server.middlewares.use("/api/slides", (req, res) => {
        // Connect strips the prefix from req.url
        let pagePath =
          (req.url || "").replace(/^\//, "") || "slides/apresentacao";
        if (!pagePath.endsWith(".md")) pagePath += ".md";

        const slug = pagePath.replace(/\.md$/, "");
        const data = allFiles.get(slug);

        if (!data) {
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "not found" }));
          return;
        }

        const title = data.frontmatter.title || extractTitle(data.body);
        const theme = data.frontmatter.theme || "black";
        const slides = data.body
          // Normalize line endings first
          .replace(/\r\n/g, "\n")
          .split(/\n*---\n+/)
          .map((s) => s.trim())
          .filter((s) => s.length > 0);

        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ title, theme, slides, raw: data.raw }));
      });

      // POST /api/submit
      server.middlewares.use("/api/submit", (req, res) => {
        res.setHeader("Content-Type", "application/json");
        res.end(
          JSON.stringify({
            status: "ok",
            message: "submission recorded (mock mode)",
          }),
        );
      });

      console.log("  🔧 Mock API server active (content/ directory)");
    },
  };
}

export default defineConfig({
  plugins: [preact(), mockApiPlugin()],
  base: "./",
  build: {
    outDir: "../server/embed",
    emptyOutDir: true,
  },
  server: {
    port: 3000,
    // To use with the real Go backend, remove mockApiPlugin() and uncomment:
    // proxy: { "/api": "http://localhost:8080" },
  },
});
