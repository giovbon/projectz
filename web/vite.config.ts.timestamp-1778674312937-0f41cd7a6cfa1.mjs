// vite.config.ts
import { defineConfig } from "file:///C:/Users/Giovani/Documents/projectz/web/node_modules/vite/dist/node/index.js";
import preact from "file:///C:/Users/Giovani/Documents/projectz/web/node_modules/@preact/preset-vite/dist/esm/index.mjs";
import * as fs from "node:fs";
import * as path from "node:path";
var __vite_injected_original_dirname = "C:\\Users\\Giovani\\Documents\\projectz\\web";
function mockApiPlugin() {
  const CONTENT_DIR = path.resolve(__vite_injected_original_dirname, "..", "content");
  function readMarkdownFiles(dir) {
    const map = /* @__PURE__ */ new Map();
    const walk = (d, prefix) => {
      const entries = fs.readdirSync(d, { withFileTypes: true });
      for (const e of entries) {
        if (e.name.startsWith(".")) continue;
        const full = path.join(d, e.name);
        if (e.isDirectory()) {
          walk(full, prefix ? `${prefix}/${e.name}` : e.name);
        } else if (e.name.endsWith(".md")) {
          const raw = fs.readFileSync(full, "utf-8");
          const slug = (prefix ? `${prefix}/${e.name}` : e.name).replace(
            /\.md$/,
            ""
          );
          const fm = {};
          let body = raw;
          if (raw.startsWith("---")) {
            const end = raw.indexOf("---", 3);
            if (end !== -1) {
              const fmText = raw.slice(3, end).trim();
              body = raw.slice(end + 3).trim();
              for (const line of fmText.split("\n")) {
                const colonIdx = line.indexOf(":");
                if (colonIdx !== -1) {
                  fm[line.slice(0, colonIdx).trim()] = line.slice(colonIdx + 1).trim();
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
  function buildMenu(allFiles2) {
    const entries = fs.readdirSync(CONTENT_DIR, { withFileTypes: true });
    const sections = [];
    for (const e of entries) {
      if (e.name.startsWith(".")) continue;
      if (e.isDirectory()) {
        const pages = [];
        for (const [slug, data] of allFiles2) {
          if (slug.startsWith(e.name + "/") && !slug.endsWith("/_index")) {
            const pageName = path.basename(slug);
            const title = data.frontmatter.title || extractTitle(data.body) || pageName;
            const ptype = data.frontmatter.type || "";
            pages.push({
              title,
              slug: pageName,
              path: slug + ".md",
              type: ptype,
              theme: data.frontmatter.theme || ""
            });
          }
        }
        if (pages.length > 0) {
          const label = e.name.replace(/-/g, " ").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
          const stype = e.name === "slides" ? "slides" : "";
          sections.push({ label, slug: e.name, pages, type: stype });
        }
      } else if (e.name.endsWith(".md")) {
        const slug = e.name.replace(/\.md$/, "");
        const data = allFiles2.get(slug);
        const title = data?.frontmatter.title || (data ? extractTitle(data.body) : slug);
        sections.push({
          label: title,
          slug,
          pages: [{ title, slug, path: e.name }]
        });
      }
    }
    sections.sort((a, b) => a.label.localeCompare(b.label));
    return { sections };
  }
  function extractTitle(body) {
    const m = body.match(/^#\s+(.+)/m);
    return m ? m[1] : "Untitled";
  }
  function markdownToHtml(md) {
    let html = md.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(
      /```(\w*)\n([\s\S]*?)```/g,
      '<pre><code class="language-$1">$2</code></pre>'
    ).replace(/`([^`]+)`/g, "<code>$1</code>").replace(/^#### (.+)$/gm, "<h4>$1</h4>").replace(/^### (.+)$/gm, "<h3>$1</h3>").replace(/^## (.+)$/gm, "<h2>$1</h2>").replace(/^# (.+)$/gm, "<h1>$1</h1>").replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>").replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\*(.+?)\*/g, "<em>$1</em>").replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>').replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />').replace(/^- (.+)$/gm, "<li>$1</li>").replace(/(<li>.*<\/li>\n?)+/g, "<ul>$&</ul>").replace(/^(?!<[a-z]|$)(.+)$/gm, "<p>$1</p>").replace(/<p>\s*<\/p>/g, "").replace(/\n/g, "");
    return html;
  }
  const allFiles = readMarkdownFiles(CONTENT_DIR);
  const menu = buildMenu(allFiles);
  return {
    name: "projectz-mock-api",
    configureServer(server) {
      server.middlewares.use("/api/menu", (_req, res) => {
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(menu));
      });
      server.middlewares.use("/api/page", (req, res) => {
        let pagePath = (req.url || "").replace(/^\//, "") || "index";
        if (!pagePath.endsWith(".md")) pagePath += ".md";
        const slug = pagePath.replace(/\.md$/, "");
        const data = allFiles.get(slug);
        if (!data) {
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({ notFound: true, slug: path.basename(slug) })
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
            theme: data.frontmatter.theme || ""
          })
        );
      });
      server.middlewares.use("/api/slides", (req, res) => {
        let pagePath = (req.url || "").replace(/^\//, "") || "slides/apresentacao";
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
        const slides = data.body.split(/\n*---\n+/).map((s) => s.trim()).filter((s) => s.length > 0);
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ title, theme, slides, raw: data.raw }));
      });
      server.middlewares.use("/api/submit", (req, res) => {
        res.setHeader("Content-Type", "application/json");
        res.end(
          JSON.stringify({
            status: "ok",
            message: "submission recorded (mock mode)"
          })
        );
      });
      console.log("  \u{1F527} Mock API server active (content/ directory)");
    }
  };
}
var vite_config_default = defineConfig({
  plugins: [preact(), mockApiPlugin()],
  base: "./",
  build: {
    outDir: "../server/embed",
    emptyOutDir: true
  },
  server: {
    port: 3e3
    // To use with the real Go backend, remove mockApiPlugin() and uncomment:
    // proxy: { "/api": "http://localhost:8080" },
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxHaW92YW5pXFxcXERvY3VtZW50c1xcXFxwcm9qZWN0elxcXFx3ZWJcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXEdpb3ZhbmlcXFxcRG9jdW1lbnRzXFxcXHByb2plY3R6XFxcXHdlYlxcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvR2lvdmFuaS9Eb2N1bWVudHMvcHJvamVjdHovd2ViL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnLCBQbHVnaW4gfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHByZWFjdCBmcm9tIFwiQHByZWFjdC9wcmVzZXQtdml0ZVwiO1xuaW1wb3J0ICogYXMgZnMgZnJvbSBcIm5vZGU6ZnNcIjtcbmltcG9ydCAqIGFzIHBhdGggZnJvbSBcIm5vZGU6cGF0aFwiO1xuXG4vLyBNb2NrIEFQSSBwbHVnaW4gXHUyMDE0IHNpbXVsYXRlcyB0aGUgR28gYmFja2VuZCB1c2luZyBsb2NhbCBjb250ZW50LyBkaXJlY3RvcnlcbmZ1bmN0aW9uIG1vY2tBcGlQbHVnaW4oKTogUGx1Z2luIHtcbiAgY29uc3QgQ09OVEVOVF9ESVIgPSBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4uXCIsIFwiY29udGVudFwiKTtcblxuICBmdW5jdGlvbiByZWFkTWFya2Rvd25GaWxlcyhcbiAgICBkaXI6IHN0cmluZyxcbiAgKTogTWFwPFxuICAgIHN0cmluZyxcbiAgICB7IHJhdzogc3RyaW5nOyBmcm9udG1hdHRlcjogUmVjb3JkPHN0cmluZywgc3RyaW5nPjsgYm9keTogc3RyaW5nIH1cbiAgPiB7XG4gICAgY29uc3QgbWFwID0gbmV3IE1hcDxcbiAgICAgIHN0cmluZyxcbiAgICAgIHsgcmF3OiBzdHJpbmc7IGZyb250bWF0dGVyOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+OyBib2R5OiBzdHJpbmcgfVxuICAgID4oKTtcbiAgICBjb25zdCB3YWxrID0gKGQ6IHN0cmluZywgcHJlZml4OiBzdHJpbmcpID0+IHtcbiAgICAgIGNvbnN0IGVudHJpZXMgPSBmcy5yZWFkZGlyU3luYyhkLCB7IHdpdGhGaWxlVHlwZXM6IHRydWUgfSk7XG4gICAgICBmb3IgKGNvbnN0IGUgb2YgZW50cmllcykge1xuICAgICAgICBpZiAoZS5uYW1lLnN0YXJ0c1dpdGgoXCIuXCIpKSBjb250aW51ZTtcbiAgICAgICAgY29uc3QgZnVsbCA9IHBhdGguam9pbihkLCBlLm5hbWUpO1xuICAgICAgICBpZiAoZS5pc0RpcmVjdG9yeSgpKSB7XG4gICAgICAgICAgd2FsayhmdWxsLCBwcmVmaXggPyBgJHtwcmVmaXh9LyR7ZS5uYW1lfWAgOiBlLm5hbWUpO1xuICAgICAgICB9IGVsc2UgaWYgKGUubmFtZS5lbmRzV2l0aChcIi5tZFwiKSkge1xuICAgICAgICAgIGNvbnN0IHJhdyA9IGZzLnJlYWRGaWxlU3luYyhmdWxsLCBcInV0Zi04XCIpO1xuICAgICAgICAgIGNvbnN0IHNsdWcgPSAocHJlZml4ID8gYCR7cHJlZml4fS8ke2UubmFtZX1gIDogZS5uYW1lKS5yZXBsYWNlKFxuICAgICAgICAgICAgL1xcLm1kJC8sXG4gICAgICAgICAgICBcIlwiLFxuICAgICAgICAgICk7XG4gICAgICAgICAgY29uc3QgZm06IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7fTtcbiAgICAgICAgICBsZXQgYm9keSA9IHJhdztcblxuICAgICAgICAgIC8vIFBhcnNlIGZyb250bWF0dGVyXG4gICAgICAgICAgaWYgKHJhdy5zdGFydHNXaXRoKFwiLS0tXCIpKSB7XG4gICAgICAgICAgICBjb25zdCBlbmQgPSByYXcuaW5kZXhPZihcIi0tLVwiLCAzKTtcbiAgICAgICAgICAgIGlmIChlbmQgIT09IC0xKSB7XG4gICAgICAgICAgICAgIGNvbnN0IGZtVGV4dCA9IHJhdy5zbGljZSgzLCBlbmQpLnRyaW0oKTtcbiAgICAgICAgICAgICAgYm9keSA9IHJhdy5zbGljZShlbmQgKyAzKS50cmltKCk7XG4gICAgICAgICAgICAgIGZvciAoY29uc3QgbGluZSBvZiBmbVRleHQuc3BsaXQoXCJcXG5cIikpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBjb2xvbklkeCA9IGxpbmUuaW5kZXhPZihcIjpcIik7XG4gICAgICAgICAgICAgICAgaWYgKGNvbG9uSWR4ICE9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgZm1bbGluZS5zbGljZSgwLCBjb2xvbklkeCkudHJpbSgpXSA9IGxpbmVcbiAgICAgICAgICAgICAgICAgICAgLnNsaWNlKGNvbG9uSWR4ICsgMSlcbiAgICAgICAgICAgICAgICAgICAgLnRyaW0oKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgbWFwLnNldChzbHVnLCB7IHJhdywgZnJvbnRtYXR0ZXI6IGZtLCBib2R5IH0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcbiAgICB3YWxrKGRpciwgXCJcIik7XG4gICAgcmV0dXJuIG1hcDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGJ1aWxkTWVudShcbiAgICBhbGxGaWxlczogTWFwPFxuICAgICAgc3RyaW5nLFxuICAgICAgeyByYXc6IHN0cmluZzsgZnJvbnRtYXR0ZXI6IFJlY29yZDxzdHJpbmcsIHN0cmluZz47IGJvZHk6IHN0cmluZyB9XG4gICAgPixcbiAgKSB7XG4gICAgY29uc3QgZW50cmllcyA9IGZzLnJlYWRkaXJTeW5jKENPTlRFTlRfRElSLCB7IHdpdGhGaWxlVHlwZXM6IHRydWUgfSk7XG4gICAgY29uc3Qgc2VjdGlvbnM6IGFueVtdID0gW107XG5cbiAgICBmb3IgKGNvbnN0IGUgb2YgZW50cmllcykge1xuICAgICAgaWYgKGUubmFtZS5zdGFydHNXaXRoKFwiLlwiKSkgY29udGludWU7XG4gICAgICBpZiAoZS5pc0RpcmVjdG9yeSgpKSB7XG4gICAgICAgIGNvbnN0IHBhZ2VzOiBhbnlbXSA9IFtdO1xuICAgICAgICBmb3IgKGNvbnN0IFtzbHVnLCBkYXRhXSBvZiBhbGxGaWxlcykge1xuICAgICAgICAgIGlmIChzbHVnLnN0YXJ0c1dpdGgoZS5uYW1lICsgXCIvXCIpICYmICFzbHVnLmVuZHNXaXRoKFwiL19pbmRleFwiKSkge1xuICAgICAgICAgICAgY29uc3QgcGFnZU5hbWUgPSBwYXRoLmJhc2VuYW1lKHNsdWcpO1xuICAgICAgICAgICAgY29uc3QgdGl0bGUgPVxuICAgICAgICAgICAgICBkYXRhLmZyb250bWF0dGVyLnRpdGxlIHx8IGV4dHJhY3RUaXRsZShkYXRhLmJvZHkpIHx8IHBhZ2VOYW1lO1xuICAgICAgICAgICAgY29uc3QgcHR5cGUgPSBkYXRhLmZyb250bWF0dGVyLnR5cGUgfHwgXCJcIjtcbiAgICAgICAgICAgIHBhZ2VzLnB1c2goe1xuICAgICAgICAgICAgICB0aXRsZSxcbiAgICAgICAgICAgICAgc2x1ZzogcGFnZU5hbWUsXG4gICAgICAgICAgICAgIHBhdGg6IHNsdWcgKyBcIi5tZFwiLFxuICAgICAgICAgICAgICB0eXBlOiBwdHlwZSxcbiAgICAgICAgICAgICAgdGhlbWU6IGRhdGEuZnJvbnRtYXR0ZXIudGhlbWUgfHwgXCJcIixcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAocGFnZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgIGNvbnN0IGxhYmVsID0gZS5uYW1lXG4gICAgICAgICAgICAucmVwbGFjZSgvLS9nLCBcIiBcIilcbiAgICAgICAgICAgIC5yZXBsYWNlKC9fL2csIFwiIFwiKVxuICAgICAgICAgICAgLnJlcGxhY2UoL1xcYlxcdy9nLCAoYykgPT4gYy50b1VwcGVyQ2FzZSgpKTtcbiAgICAgICAgICBjb25zdCBzdHlwZSA9IGUubmFtZSA9PT0gXCJzbGlkZXNcIiA/IFwic2xpZGVzXCIgOiBcIlwiO1xuICAgICAgICAgIHNlY3Rpb25zLnB1c2goeyBsYWJlbCwgc2x1ZzogZS5uYW1lLCBwYWdlcywgdHlwZTogc3R5cGUgfSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoZS5uYW1lLmVuZHNXaXRoKFwiLm1kXCIpKSB7XG4gICAgICAgIGNvbnN0IHNsdWcgPSBlLm5hbWUucmVwbGFjZSgvXFwubWQkLywgXCJcIik7XG4gICAgICAgIGNvbnN0IGRhdGEgPSBhbGxGaWxlcy5nZXQoc2x1Zyk7XG4gICAgICAgIGNvbnN0IHRpdGxlID1cbiAgICAgICAgICBkYXRhPy5mcm9udG1hdHRlci50aXRsZSB8fCAoZGF0YSA/IGV4dHJhY3RUaXRsZShkYXRhLmJvZHkpIDogc2x1Zyk7XG4gICAgICAgIHNlY3Rpb25zLnB1c2goe1xuICAgICAgICAgIGxhYmVsOiB0aXRsZSxcbiAgICAgICAgICBzbHVnLFxuICAgICAgICAgIHBhZ2VzOiBbeyB0aXRsZSwgc2x1ZywgcGF0aDogZS5uYW1lIH1dLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBzZWN0aW9ucy5zb3J0KChhLCBiKSA9PiBhLmxhYmVsLmxvY2FsZUNvbXBhcmUoYi5sYWJlbCkpO1xuICAgIHJldHVybiB7IHNlY3Rpb25zIH07XG4gIH1cblxuICBmdW5jdGlvbiBleHRyYWN0VGl0bGUoYm9keTogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBjb25zdCBtID0gYm9keS5tYXRjaCgvXiNcXHMrKC4rKS9tKTtcbiAgICByZXR1cm4gbSA/IG1bMV0gOiBcIlVudGl0bGVkXCI7XG4gIH1cblxuICBmdW5jdGlvbiBtYXJrZG93blRvSHRtbChtZDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICAvLyBTaW1wbGUgbWFya2Rvd24gXHUyMTkyIEhUTUwgZm9yIG1vY2sgKGZ1bGwgZ29sZG1hcmsgcGFyaXR5IGluIEdvIGJhY2tlbmQpXG4gICAgbGV0IGh0bWwgPSBtZFxuICAgICAgLnJlcGxhY2UoLyYvZywgXCImYW1wO1wiKVxuICAgICAgLnJlcGxhY2UoLzwvZywgXCImbHQ7XCIpXG4gICAgICAucmVwbGFjZSgvPi9nLCBcIiZndDtcIilcbiAgICAgIC8vIENvZGUgYmxvY2tzXG4gICAgICAucmVwbGFjZShcbiAgICAgICAgL2BgYChcXHcqKVxcbihbXFxzXFxTXSo/KWBgYC9nLFxuICAgICAgICAnPHByZT48Y29kZSBjbGFzcz1cImxhbmd1YWdlLSQxXCI+JDI8L2NvZGU+PC9wcmU+JyxcbiAgICAgIClcbiAgICAgIC8vIElubGluZSBjb2RlXG4gICAgICAucmVwbGFjZSgvYChbXmBdKylgL2csIFwiPGNvZGU+JDE8L2NvZGU+XCIpXG4gICAgICAvLyBIZWFkaW5nc1xuICAgICAgLnJlcGxhY2UoL14jIyMjICguKykkL2dtLCBcIjxoND4kMTwvaDQ+XCIpXG4gICAgICAucmVwbGFjZSgvXiMjIyAoLispJC9nbSwgXCI8aDM+JDE8L2gzPlwiKVxuICAgICAgLnJlcGxhY2UoL14jIyAoLispJC9nbSwgXCI8aDI+JDE8L2gyPlwiKVxuICAgICAgLnJlcGxhY2UoL14jICguKykkL2dtLCBcIjxoMT4kMTwvaDE+XCIpXG4gICAgICAvLyBCb2xkIC8gaXRhbGljXG4gICAgICAucmVwbGFjZSgvXFwqXFwqXFwqKC4rPylcXCpcXCpcXCovZywgXCI8c3Ryb25nPjxlbT4kMTwvZW0+PC9zdHJvbmc+XCIpXG4gICAgICAucmVwbGFjZSgvXFwqXFwqKC4rPylcXCpcXCovZywgXCI8c3Ryb25nPiQxPC9zdHJvbmc+XCIpXG4gICAgICAucmVwbGFjZSgvXFwqKC4rPylcXCovZywgXCI8ZW0+JDE8L2VtPlwiKVxuICAgICAgLy8gTGlua3NcbiAgICAgIC5yZXBsYWNlKC9cXFsoW15cXF1dKylcXF1cXCgoW14pXSspXFwpL2csICc8YSBocmVmPVwiJDJcIj4kMTwvYT4nKVxuICAgICAgLy8gSW1hZ2VzXG4gICAgICAucmVwbGFjZSgvIVxcWyhbXlxcXV0qKVxcXVxcKChbXildKylcXCkvZywgJzxpbWcgc3JjPVwiJDJcIiBhbHQ9XCIkMVwiIC8+JylcbiAgICAgIC8vIExpc3RzXG4gICAgICAucmVwbGFjZSgvXi0gKC4rKSQvZ20sIFwiPGxpPiQxPC9saT5cIilcbiAgICAgIC5yZXBsYWNlKC8oPGxpPi4qPFxcL2xpPlxcbj8pKy9nLCBcIjx1bD4kJjwvdWw+XCIpXG4gICAgICAvLyBQYXJhZ3JhcGhzXG4gICAgICAucmVwbGFjZSgvXig/ITxbYS16XXwkKSguKykkL2dtLCBcIjxwPiQxPC9wPlwiKVxuICAgICAgLy8gQ2xlYW51cFxuICAgICAgLnJlcGxhY2UoLzxwPlxccyo8XFwvcD4vZywgXCJcIilcbiAgICAgIC5yZXBsYWNlKC9cXG4vZywgXCJcIik7XG5cbiAgICByZXR1cm4gaHRtbDtcbiAgfVxuXG4gIGNvbnN0IGFsbEZpbGVzID0gcmVhZE1hcmtkb3duRmlsZXMoQ09OVEVOVF9ESVIpO1xuICBjb25zdCBtZW51ID0gYnVpbGRNZW51KGFsbEZpbGVzKTtcblxuICByZXR1cm4ge1xuICAgIG5hbWU6IFwicHJvamVjdHotbW9jay1hcGlcIixcbiAgICBjb25maWd1cmVTZXJ2ZXIoc2VydmVyKSB7XG4gICAgICAvLyBHRVQgL2FwaS9tZW51XG4gICAgICBzZXJ2ZXIubWlkZGxld2FyZXMudXNlKFwiL2FwaS9tZW51XCIsIChfcmVxLCByZXMpID0+IHtcbiAgICAgICAgcmVzLnNldEhlYWRlcihcIkNvbnRlbnQtVHlwZVwiLCBcImFwcGxpY2F0aW9uL2pzb25cIik7XG4gICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkobWVudSkpO1xuICAgICAgfSk7XG5cbiAgICAgIC8vIEdFVCAvYXBpL3BhZ2UvKlxuICAgICAgc2VydmVyLm1pZGRsZXdhcmVzLnVzZShcIi9hcGkvcGFnZVwiLCAocmVxLCByZXMpID0+IHtcbiAgICAgICAgLy8gQ29ubmVjdCBzdHJpcHMgdGhlIHByZWZpeCBmcm9tIHJlcS51cmwsIHNvIGl0J3MganVzdCAvcGF0aFxuICAgICAgICBsZXQgcGFnZVBhdGggPSAocmVxLnVybCB8fCBcIlwiKS5yZXBsYWNlKC9eXFwvLywgXCJcIikgfHwgXCJpbmRleFwiO1xuICAgICAgICBpZiAoIXBhZ2VQYXRoLmVuZHNXaXRoKFwiLm1kXCIpKSBwYWdlUGF0aCArPSBcIi5tZFwiO1xuXG4gICAgICAgIGNvbnN0IHNsdWcgPSBwYWdlUGF0aC5yZXBsYWNlKC9cXC5tZCQvLCBcIlwiKTtcbiAgICAgICAgY29uc3QgZGF0YSA9IGFsbEZpbGVzLmdldChzbHVnKTtcblxuICAgICAgICBpZiAoIWRhdGEpIHtcbiAgICAgICAgICByZXMuc2V0SGVhZGVyKFwiQ29udGVudC1UeXBlXCIsIFwiYXBwbGljYXRpb24vanNvblwiKTtcbiAgICAgICAgICByZXMuZW5kKFxuICAgICAgICAgICAgSlNPTi5zdHJpbmdpZnkoeyBub3RGb3VuZDogdHJ1ZSwgc2x1ZzogcGF0aC5iYXNlbmFtZShzbHVnKSB9KSxcbiAgICAgICAgICApO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHRpdGxlID0gZGF0YS5mcm9udG1hdHRlci50aXRsZSB8fCBleHRyYWN0VGl0bGUoZGF0YS5ib2R5KTtcbiAgICAgICAgY29uc3QgcHR5cGUgPSBkYXRhLmZyb250bWF0dGVyLnR5cGUgfHwgXCJcIjtcbiAgICAgICAgY29uc3QgaHRtbCA9IG1hcmtkb3duVG9IdG1sKGRhdGEuYm9keSk7XG5cbiAgICAgICAgcmVzLnNldEhlYWRlcihcIkNvbnRlbnQtVHlwZVwiLCBcImFwcGxpY2F0aW9uL2pzb25cIik7XG4gICAgICAgIHJlcy5lbmQoXG4gICAgICAgICAgSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgdGl0bGUsXG4gICAgICAgICAgICBzbHVnOiBwYXRoLmJhc2VuYW1lKHNsdWcpLFxuICAgICAgICAgICAgcGF0aDogcGFnZVBhdGgsXG4gICAgICAgICAgICBodG1sLFxuICAgICAgICAgICAgcmF3OiBkYXRhLnJhdyxcbiAgICAgICAgICAgIHR5cGU6IHB0eXBlLFxuICAgICAgICAgICAgdGhlbWU6IGRhdGEuZnJvbnRtYXR0ZXIudGhlbWUgfHwgXCJcIixcbiAgICAgICAgICB9KSxcbiAgICAgICAgKTtcbiAgICAgIH0pO1xuXG4gICAgICAvLyBHRVQgL2FwaS9zbGlkZXMvKlxuICAgICAgc2VydmVyLm1pZGRsZXdhcmVzLnVzZShcIi9hcGkvc2xpZGVzXCIsIChyZXEsIHJlcykgPT4ge1xuICAgICAgICAvLyBDb25uZWN0IHN0cmlwcyB0aGUgcHJlZml4IGZyb20gcmVxLnVybFxuICAgICAgICBsZXQgcGFnZVBhdGggPVxuICAgICAgICAgIChyZXEudXJsIHx8IFwiXCIpLnJlcGxhY2UoL15cXC8vLCBcIlwiKSB8fCBcInNsaWRlcy9hcHJlc2VudGFjYW9cIjtcbiAgICAgICAgaWYgKCFwYWdlUGF0aC5lbmRzV2l0aChcIi5tZFwiKSkgcGFnZVBhdGggKz0gXCIubWRcIjtcblxuICAgICAgICBjb25zdCBzbHVnID0gcGFnZVBhdGgucmVwbGFjZSgvXFwubWQkLywgXCJcIik7XG4gICAgICAgIGNvbnN0IGRhdGEgPSBhbGxGaWxlcy5nZXQoc2x1Zyk7XG5cbiAgICAgICAgaWYgKCFkYXRhKSB7XG4gICAgICAgICAgcmVzLnNldEhlYWRlcihcIkNvbnRlbnQtVHlwZVwiLCBcImFwcGxpY2F0aW9uL2pzb25cIik7XG4gICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IGVycm9yOiBcIm5vdCBmb3VuZFwiIH0pKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB0aXRsZSA9IGRhdGEuZnJvbnRtYXR0ZXIudGl0bGUgfHwgZXh0cmFjdFRpdGxlKGRhdGEuYm9keSk7XG4gICAgICAgIGNvbnN0IHRoZW1lID0gZGF0YS5mcm9udG1hdHRlci50aGVtZSB8fCBcImJsYWNrXCI7XG4gICAgICAgIGNvbnN0IHNsaWRlcyA9IGRhdGEuYm9keVxuICAgICAgICAgIC5zcGxpdCgvXFxuKi0tLVxcbisvKVxuICAgICAgICAgIC5tYXAoKHMpID0+IHMudHJpbSgpKVxuICAgICAgICAgIC5maWx0ZXIoKHMpID0+IHMubGVuZ3RoID4gMCk7XG5cbiAgICAgICAgcmVzLnNldEhlYWRlcihcIkNvbnRlbnQtVHlwZVwiLCBcImFwcGxpY2F0aW9uL2pzb25cIik7XG4gICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyB0aXRsZSwgdGhlbWUsIHNsaWRlcywgcmF3OiBkYXRhLnJhdyB9KSk7XG4gICAgICB9KTtcblxuICAgICAgLy8gUE9TVCAvYXBpL3N1Ym1pdFxuICAgICAgc2VydmVyLm1pZGRsZXdhcmVzLnVzZShcIi9hcGkvc3VibWl0XCIsIChyZXEsIHJlcykgPT4ge1xuICAgICAgICByZXMuc2V0SGVhZGVyKFwiQ29udGVudC1UeXBlXCIsIFwiYXBwbGljYXRpb24vanNvblwiKTtcbiAgICAgICAgcmVzLmVuZChcbiAgICAgICAgICBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICBzdGF0dXM6IFwib2tcIixcbiAgICAgICAgICAgIG1lc3NhZ2U6IFwic3VibWlzc2lvbiByZWNvcmRlZCAobW9jayBtb2RlKVwiLFxuICAgICAgICAgIH0pLFxuICAgICAgICApO1xuICAgICAgfSk7XG5cbiAgICAgIGNvbnNvbGUubG9nKFwiICBcdUQ4M0RcdUREMjcgTW9jayBBUEkgc2VydmVyIGFjdGl2ZSAoY29udGVudC8gZGlyZWN0b3J5KVwiKTtcbiAgICB9LFxuICB9O1xufVxuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbcHJlYWN0KCksIG1vY2tBcGlQbHVnaW4oKV0sXG4gIGJhc2U6IFwiLi9cIixcbiAgYnVpbGQ6IHtcbiAgICBvdXREaXI6IFwiLi4vc2VydmVyL2VtYmVkXCIsXG4gICAgZW1wdHlPdXREaXI6IHRydWUsXG4gIH0sXG4gIHNlcnZlcjoge1xuICAgIHBvcnQ6IDMwMDAsXG4gICAgLy8gVG8gdXNlIHdpdGggdGhlIHJlYWwgR28gYmFja2VuZCwgcmVtb3ZlIG1vY2tBcGlQbHVnaW4oKSBhbmQgdW5jb21tZW50OlxuICAgIC8vIHByb3h5OiB7IFwiL2FwaVwiOiBcImh0dHA6Ly9sb2NhbGhvc3Q6ODA4MFwiIH0sXG4gIH0sXG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBbVQsU0FBUyxvQkFBNEI7QUFDeFYsT0FBTyxZQUFZO0FBQ25CLFlBQVksUUFBUTtBQUNwQixZQUFZLFVBQVU7QUFIdEIsSUFBTSxtQ0FBbUM7QUFNekMsU0FBUyxnQkFBd0I7QUFDL0IsUUFBTSxjQUFtQixhQUFRLGtDQUFXLE1BQU0sU0FBUztBQUUzRCxXQUFTLGtCQUNQLEtBSUE7QUFDQSxVQUFNLE1BQU0sb0JBQUksSUFHZDtBQUNGLFVBQU0sT0FBTyxDQUFDLEdBQVcsV0FBbUI7QUFDMUMsWUFBTSxVQUFhLGVBQVksR0FBRyxFQUFFLGVBQWUsS0FBSyxDQUFDO0FBQ3pELGlCQUFXLEtBQUssU0FBUztBQUN2QixZQUFJLEVBQUUsS0FBSyxXQUFXLEdBQUcsRUFBRztBQUM1QixjQUFNLE9BQVksVUFBSyxHQUFHLEVBQUUsSUFBSTtBQUNoQyxZQUFJLEVBQUUsWUFBWSxHQUFHO0FBQ25CLGVBQUssTUFBTSxTQUFTLEdBQUcsTUFBTSxJQUFJLEVBQUUsSUFBSSxLQUFLLEVBQUUsSUFBSTtBQUFBLFFBQ3BELFdBQVcsRUFBRSxLQUFLLFNBQVMsS0FBSyxHQUFHO0FBQ2pDLGdCQUFNLE1BQVMsZ0JBQWEsTUFBTSxPQUFPO0FBQ3pDLGdCQUFNLFFBQVEsU0FBUyxHQUFHLE1BQU0sSUFBSSxFQUFFLElBQUksS0FBSyxFQUFFLE1BQU07QUFBQSxZQUNyRDtBQUFBLFlBQ0E7QUFBQSxVQUNGO0FBQ0EsZ0JBQU0sS0FBNkIsQ0FBQztBQUNwQyxjQUFJLE9BQU87QUFHWCxjQUFJLElBQUksV0FBVyxLQUFLLEdBQUc7QUFDekIsa0JBQU0sTUFBTSxJQUFJLFFBQVEsT0FBTyxDQUFDO0FBQ2hDLGdCQUFJLFFBQVEsSUFBSTtBQUNkLG9CQUFNLFNB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
