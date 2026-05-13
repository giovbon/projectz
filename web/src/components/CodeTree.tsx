import { useMemo, useState, useCallback } from 'preact/hooks';
import { renderMarkdown } from '../lib/markdown';

interface CodeTreeProps {
  raw: string;
}

interface FileNode {
  name: string;
  path: string;
  type: 'folder' | 'file';
  children?: FileNode[];
  content?: string;
  level: number;
}

/**
 * Parses a special markdown format that describes a project structure.
 *
 * Format:
 * ## folder_name/     →  folder (level 2 heading)
 * ### file.ext        →  file in that folder (level 3 heading)
 * #### file.ext       →  file nested one level deeper
 * ```code blocks```   →  content of the file above
 */
function parseCodeTree(markdown: string): FileNode[] {
  const lines = markdown.split('\n');
  const root: FileNode[] = [];
  const stack: FileNode[] = [];

  let currentContent: string[] = [];
  let inCodeBlock = false;
  let codeLanguage = '';

  for (const line of lines) {
    // Track code blocks
    if (line.trim().startsWith('```')) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeLanguage = line.trim().slice(3);
        currentContent = [];
      } else {
        inCodeBlock = false;
        // Assign content to the last file node
        for (let i = stack.length - 1; i >= 0; i--) {
          if (stack[i].type === 'file') {
            stack[i].content = currentContent.join('\n');
            break;
          }
        }
      }
      continue;
    }

    if (inCodeBlock) {
      currentContent.push(line);
      continue;
    }

    // Parse headings as file/folder hierarchy
    const headingMatch = line.match(/^(#{2,5})\s+(.+)$/);
    if (!headingMatch) continue;

    const hashes = headingMatch[1];
    const name = headingMatch[2].trim();
    const level = hashes.length - 2; // ## = level 0, ### = level 1, etc.
    const isFolder = name.endsWith('/');
    const cleanName = isFolder ? name.slice(0, -1) : name;

    const node: FileNode = {
      name: cleanName,
      path: cleanName,
      type: isFolder ? 'folder' : 'file',
      level,
      children: isFolder ? [] : undefined,
    };

    // Pop stack to find parent
    while (stack.length > 0 && stack[stack.length - 1].level >= level) {
      stack.pop();
    }

    if (stack.length === 0) {
      root.push(node);
    } else {
      const parent = stack[stack.length - 1];
      if (parent.type === 'folder' && parent.children) {
        node.path = parent.path + '/' + cleanName;
        parent.children.push(node);
      }
    }

    stack.push(node);
  }

  return root;
}

export function CodeTree({ raw }: CodeTreeProps) {
  const tree = useMemo(() => parseCodeTree(raw), [raw]);
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const toggleFolder = useCallback((path: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  const selectFile = useCallback((node: FileNode) => {
    if (node.type === 'file') {
      setSelectedFile(node);
    }
  }, []);

  return (
    <div class="codetree-container">
      <div class="codetree-sidebar">
        <div class="codetree-header">📁 Explorer</div>
        <FileTree
          nodes={tree}
          expandedFolders={expandedFolders}
          selectedFile={selectedFile}
          onToggleFolder={toggleFolder}
          onSelectFile={selectFile}
          depth={0}
        />
      </div>
      <div class="codetree-viewer">
        {selectedFile ? (
          <>
            <div class="codetree-tab">{selectedFile.name}</div>
            <pre class="codetree-code">
              <code>{selectedFile.content || '// empty file'}</code>
            </pre>
          </>
        ) : (
          <div class="codetree-empty">
            <p>Selecione um arquivo na árvore para visualizar.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function FileTree({
  nodes,
  expandedFolders,
  selectedFile,
  onToggleFolder,
  onSelectFile,
  depth,
}: {
  nodes: FileNode[];
  expandedFolders: Set<string>;
  selectedFile: FileNode | null;
  onToggleFolder: (path: string) => void;
  onSelectFile: (node: FileNode) => void;
  depth: number;
}) {
  return (
    <ul class="file-tree" style={`padding-left: ${depth === 0 ? 0 : 12}px`}>
      {nodes.map((node) => (
        <li key={node.path}>
          {node.type === 'folder' ? (
            <>
              <button
                class={`file-tree-item folder ${expandedFolders.has(node.path) ? 'expanded' : ''}`}
                onClick={() => onToggleFolder(node.path)}
              >
                <span class="file-icon">{expandedFolders.has(node.path) ? '📂' : '📁'}</span>
                {node.name}
              </button>
              {expandedFolders.has(node.path) && node.children && (
                <FileTree
                  nodes={node.children}
                  expandedFolders={expandedFolders}
                  selectedFile={selectedFile}
                  onToggleFolder={onToggleFolder}
                  onSelectFile={onSelectFile}
                  depth={depth + 1}
                />
              )}
            </>
          ) : (
            <button
              class={`file-tree-item file ${selectedFile?.path === node.path ? 'selected' : ''}`}
              onClick={() => onSelectFile(node)}
            >
              <span class="file-icon">📄</span>
              {node.name}
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
