import { useEffect, useRef, useState } from 'react';

interface EnhancedMarkdownRendererProps {
  content: string;
  className?: string;
}

export function EnhancedMarkdownRenderer({ content, className = '' }: EnhancedMarkdownRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [processedContent, setProcessedContent] = useState('');

  useEffect(() => {
    let mermaidId = 0;
    
    // Простая обработка Mermaid диаграмм
    const processMermaid = (text: string): string => {
      const mermaidRegex = /```mermaid\n([\s\S]*?)\n```/g;
      return text.replace(mermaidRegex, (match, diagram) => {
        const id = `mermaid-${++mermaidId}`;
        
        const createSimpleFlowchart = (diagramText: string): string => {
          const lines = diagramText.split('\n').filter(line => line.trim());
          const nodes: { [key: string]: string } = {};
          const edges: { from: string, to: string, label?: string }[] = [];
          
          lines.forEach(line => {
            const trimmed = line.trim();
            
            // Пропускаем объявления типа диаграммы
            if (trimmed.includes('flowchart') || trimmed.includes('graph')) {
              return;
            }
            
            // Парсинг стрелок с узлами A[текст] --> B[текст]
            const fullArrowMatch = trimmed.match(/(\w+)\[([^\]]+)\]\s*-->\s*(\w+)\[([^\]]+)\]/);
            if (fullArrowMatch) {
              nodes[fullArrowMatch[1]] = fullArrowMatch[2];
              nodes[fullArrowMatch[3]] = fullArrowMatch[4];
              edges.push({ from: fullArrowMatch[1], to: fullArrowMatch[3] });
              return;
            }
            
            // Парсинг узлов с квадратными скобками [текст]
            const nodeMatch = trimmed.match(/(\w+)\[([^\]]+)\]/);
            if (nodeMatch) {
              nodes[nodeMatch[1]] = nodeMatch[2];
            }
            
            // Парсинг узлов с круглыми скобками (текст)
            const roundNodeMatch = trimmed.match(/(\w+)\(([^)]+)\)/);
            if (roundNodeMatch) {
              nodes[roundNodeMatch[1]] = roundNodeMatch[2];
            }
            
            // Парсинг простых стрелок A --> B
            const arrowMatch = trimmed.match(/(\w+)\s*-->\s*(\w+)/);
            if (arrowMatch) {
              edges.push({ from: arrowMatch[1], to: arrowMatch[2] });
              // Если узлы не определены, используем их ID как текст
              if (!nodes[arrowMatch[1]]) {
                nodes[arrowMatch[1]] = arrowMatch[1];
              }
              if (!nodes[arrowMatch[2]]) {
                nodes[arrowMatch[2]] = arrowMatch[2];
              }
            }
            
            // Парсинг стрелок с подписями A -->|label| B
            const labeledArrowMatch = trimmed.match(/(\w+)\s*-->\|([^|]+)\|\s*(\w+)/);
            if (labeledArrowMatch) {
              edges.push({ from: labeledArrowMatch[1], to: labeledArrowMatch[3], label: labeledArrowMatch[2] });
              // Если узлы не определены, используем их ID как текст
              if (!nodes[labeledArrowMatch[1]]) {
                nodes[labeledArrowMatch[1]] = labeledArrowMatch[1];
              }
              if (!nodes[labeledArrowMatch[3]]) {
                nodes[labeledArrowMatch[3]] = labeledArrowMatch[3];
              }
            }
          });

          const nodeKeys = Object.keys(nodes);
          if (nodeKeys.length === 0) return '';
          
          const nodePositions: { [key: string]: { x: number, y: number } } = {};
          
          // Улучшенное позиционирование для иерархических диаграмм
          if (nodeKeys.length <= 5) {
            // Для маленьких диаграмм используем иерархическое расположение
            const rootNodes = nodeKeys.filter(key => !edges.some(edge => edge.to === key));
            const leafNodes = nodeKeys.filter(key => !edges.some(edge => edge.from === key));
            
            let yOffset = 60;
            const usedNodes = new Set();
            
            // Размещаем корневые узлы сверху
            rootNodes.forEach((key, index) => {
              nodePositions[key] = {
                x: 200 + index * 160,
                y: yOffset
              };
              usedNodes.add(key);
            });
            
            yOffset += 100;
            
            // Размещаем промежуточные узлы
            nodeKeys.forEach((key, index) => {
              if (!usedNodes.has(key) && !leafNodes.includes(key)) {
                nodePositions[key] = {
                  x: 200 + (index % 3) * 160,
                  y: yOffset
                };
                usedNodes.add(key);
              }
            });
            
            yOffset += 100;
            
            // Размещаем конечные узлы снизу
            leafNodes.forEach((key, index) => {
              if (!usedNodes.has(key)) {
                nodePositions[key] = {
                  x: 150 + index * 160,
                  y: yOffset
                };
                usedNodes.add(key);
              }
            });
          } else {
            // Для больших диаграмм используем сетку
            nodeKeys.forEach((key, index) => {
              const cols = Math.ceil(Math.sqrt(nodeKeys.length));
              const row = Math.floor(index / cols);
              const col = index % cols;
              nodePositions[key] = {
                x: 100 + col * 180,
                y: 80 + row * 100
              };
            });
          }

          const svgNodes = nodeKeys.map((key) => {
            const pos = nodePositions[key];
            const text = nodes[key];
            const words = text.split(' ');
            
            // Разбиваем длинный текст на строки
            const lines = [];
            let currentLine = '';
            
            words.forEach(word => {
              if ((currentLine + ' ' + word).length <= 15) {
                currentLine = currentLine ? currentLine + ' ' + word : word;
              } else {
                if (currentLine) lines.push(currentLine);
                currentLine = word;
              }
            });
            if (currentLine) lines.push(currentLine);
            
            const textElements = lines.map((line, index) => 
              `<text x="${pos.x}" y="${pos.y + (index - lines.length/2 + 0.5) * 14}" text-anchor="middle" 
                     class="text-sm font-medium" fill="white">${line}</text>`
            ).join('');
            
            const rectHeight = Math.max(40, lines.length * 16 + 16);
            const rectWidth = Math.max(120, Math.max(...lines.map(line => line.length)) * 8 + 20);
            
            return `
              <g class="node">
                <rect x="${pos.x - rectWidth/2}" y="${pos.y - rectHeight/2}" 
                      width="${rectWidth}" height="${rectHeight}" rx="8" 
                      fill="#2563eb" stroke="#1d4ed8" stroke-width="2"/>
                ${textElements}
              </g>
            `;
          }).join('');

          // Создание стрелок между узлами
          const svgEdges = edges.map(edge => {
            const fromPos = nodePositions[edge.from];
            const toPos = nodePositions[edge.to];
            if (!fromPos || !toPos) return '';
            
            const dx = toPos.x - fromPos.x;
            const dy = toPos.y - fromPos.y;
            const length = Math.sqrt(dx * dx + dy * dy);
            
            if (length === 0) return '';
            
            const unitX = dx / length;
            const unitY = dy / length;
            
            // Учитываем размеры прямоугольников для точного позиционирования стрелок
            const nodeSize = 60;
            const startX = fromPos.x + unitX * nodeSize;
            const startY = fromPos.y + unitY * 20;
            const endX = toPos.x - unitX * nodeSize;
            const endY = toPos.y - unitY * 20;
            
            return `
              <g class="edge">
                <line x1="${startX}" y1="${startY}" x2="${endX}" y2="${endY}" 
                      stroke="#64748b" stroke-width="2" marker-end="url(#arrowhead)"/>
                ${edge.label ? `<text x="${(startX + endX) / 2}" y="${(startY + endY) / 2 - 8}" 
                  text-anchor="middle" class="text-xs" fill="#64748b">${edge.label}</text>` : ''}
              </g>
            `;
          }).join('');

          const allX = nodeKeys.map(key => nodePositions[key].x);
          const allY = nodeKeys.map(key => nodePositions[key].y);
          const minX = Math.min(...allX) - 100;
          const maxX = Math.max(...allX) + 100;
          const minY = Math.min(...allY) - 50;
          const maxY = Math.max(...allY) + 50;
          
          const viewBoxWidth = maxX - minX;
          const viewBoxHeight = maxY - minY;

          return `
            <div class="mermaid-diagram bg-background border border-border rounded-lg my-6 p-4">
              <svg viewBox="${minX} ${minY} ${viewBoxWidth} ${viewBoxHeight}" class="w-full" style="height: ${Math.max(200, viewBoxHeight)}px;">
                <defs>
                  <marker id="arrowhead" markerWidth="10" markerHeight="7" 
                          refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
                  </marker>
                </defs>
                ${svgEdges}
                ${svgNodes}
              </svg>
              <details class="mt-4 border-t border-border pt-4">
                <summary class="cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Показать исходный код
                </summary>
                <pre class="mt-2 p-3 bg-muted rounded text-xs overflow-x-auto font-mono"><code>${diagram}</code></pre>
              </details>
            </div>
          `;
        };

        if (diagram.includes('flowchart')) {
          return createSimpleFlowchart(diagram);
        }

        return `
          <div id="${id}" class="mermaid-fallback bg-muted/50 border border-border rounded-lg p-6 my-6">
            <div class="flex items-center gap-2 mb-3">
              <span class="text-2xl">📊</span>
              <h4 class="font-semibold text-foreground">Диаграмма Mermaid</h4>
            </div>
            <p class="text-muted-foreground text-sm mb-4">
              Для полного отображения диаграмм Mermaid рекомендуется использовать специализированные редакторы.
            </p>
            <details>
              <summary class="cursor-pointer text-sm text-primary hover:underline font-medium">
                Показать код диаграммы
              </summary>
              <pre class="mt-3 p-4 bg-muted rounded text-sm overflow-x-auto"><code class="text-foreground">${diagram}</code></pre>
            </details>
          </div>
        `;
      });
    };

    // Обработка Obsidian-стиля ссылок
    const processObsidianLinks = (text: string): string => {
      // Обработка ссылок на заголовки [[#заголовок]]
      text = text.replace(/\[\[#([^\]]+)\]\]/g, (match, headerText) => {
        const headerId = headerText.toLowerCase()
          .replace(/[^а-яё\w\s-]/gi, '')
          .replace(/\s+/g, '-')
          .trim();
        
        return `<a href="#${headerId}" class="obsidian-link internal-link text-primary hover:text-primary/80 hover:underline font-medium" data-header="${headerText}">${headerText}</a>`;
      });
      
      // Обработка простых ссылок [[заголовок]]
      text = text.replace(/\[\[([^\]#]+)\]\]/g, (match, linkText) => {
        const headerId = linkText.toLowerCase()
          .replace(/[^а-яё\w\s-]/gi, '')
          .replace(/\s+/g, '-')
          .trim();
        
        return `<a href="#${headerId}" class="obsidian-link internal-link text-primary hover:text-primary/80 hover:underline font-medium" data-header="${linkText}">${linkText}</a>`;
      });
      
      return text;
    };

    // Улучшенный обработчик Markdown
    const processMarkdown = (text: string): string => {
      let html = text;

      // Сначала обрабатываем Obsidian-ссылки
      html = processObsidianLinks(html);

      // Заголовки в стиле Obsidian с видимыми символами #
      html = html.replace(/^(#{4,6}) (.*$)/gim, (match, hashes, title) => {
        const level = hashes.length;
        const id = title.toLowerCase()
          .replace(/[^а-яё\w\s-]/gi, '')
          .replace(/\s+/g, '-')
          .trim();
        const tagName = `h${Math.min(level, 6)}`;
        return `<${tagName} id="${id}" class="obsidian-header mb-3 mt-6 text-foreground scroll-mt-20 flex items-baseline gap-2">
          <span class="hash-symbols text-muted-foreground">${hashes}</span>
          <span class="text-base font-medium">${title}</span>
        </${tagName}>`;
      });
      
      html = html.replace(/^### (.*$)/gim, (match, title) => {
        const id = title.toLowerCase()
          .replace(/[^а-яё\w\s-]/gi, '')
          .replace(/\s+/g, '-')
          .trim();
        return `<h3 id="${id}" class="obsidian-header mb-3 mt-6 text-foreground scroll-mt-20 flex items-baseline gap-2">
          <span class="hash-symbols text-muted-foreground">###</span>
          <span class="text-lg font-semibold">${title}</span>
        </h3>`;
      });
      
      html = html.replace(/^## (.*$)/gim, (match, title) => {
        const id = title.toLowerCase()
          .replace(/[^а-яё\w\s-]/gi, '')
          .replace(/\s+/g, '-')
          .trim();
        return `<h2 id="${id}" class="obsidian-header mb-4 mt-8 text-foreground scroll-mt-20 flex items-baseline gap-2">
          <span class="hash-symbols text-muted-foreground">##</span>
          <span class="text-xl font-semibold">${title}</span>
        </h2>`;
      });
      
      html = html.replace(/^# (.*$)/gim, (match, title) => {
        const id = title.toLowerCase()
          .replace(/[^а-яё\w\s-]/gi, '')
          .replace(/\s+/g, '-')
          .trim();
        return `<h1 id="${id}" class="obsidian-header mb-6 mt-8 text-foreground scroll-mt-20 flex items-baseline gap-2">
          <span class="hash-symbols text-muted-foreground">#</span>
          <span class="text-2xl font-bold">${title}</span>
        </h1>`;
      });

      // Жирный и курсив
      html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>');
      html = html.replace(/\*(.*?)\*/g, '<em class="italic text-muted-foreground">$1</em>');

      // Код
      html = html.replace(/`([^`]+)`/g, '<code class="bg-muted px-2 py-1 rounded text-sm font-mono text-foreground border">$1</code>');

      // Блоки кода (не Mermaid)
      html = html.replace(/```(?!mermaid)([\s\S]*?)```/g, '<pre class="bg-muted p-4 rounded-lg overflow-x-auto my-4 border"><code class="text-sm text-foreground">$1</code></pre>');

      // Выделение важных блоков (callouts)
      html = html.replace(/^> \[!(note|info|tip|warning|danger)\] (.*$)/gim, (match, type, title) => {
        const colors = {
          note: 'border-l-blue-500 bg-blue-50 dark:bg-blue-950/20',
          info: 'border-l-cyan-500 bg-cyan-50 dark:bg-cyan-950/20',
          tip: 'border-l-green-500 bg-green-50 dark:bg-green-950/20',
          warning: 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/20',
          danger: 'border-l-red-500 bg-red-50 dark:bg-red-950/20'
        };
        return `<div class="callout ${colors[type]} border-l-4 p-4 my-4 rounded-r-lg"><div class="font-semibold text-foreground mb-2">${title}</div>`;
      });

      // Обычные цитаты (blockquotes)
      html = html.replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-muted-foreground pl-4 my-4 text-muted-foreground italic">$1</blockquote>');

      // Списки
      html = html.replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-foreground marker:text-muted-foreground">$1</li>');
      html = html.replace(/^\* (.+)$/gm, '<li class="ml-4 list-disc text-foreground marker:text-muted-foreground">$1</li>');
      html = html.replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal text-foreground marker:text-muted-foreground">$1</li>');

      // Обернуть последовательные li в ul
      html = html.replace(/(<li[^>]*>.*?<\/li>\s*)+/g, '<ul class="space-y-1 my-4 pl-4">$&</ul>');

      // Обычные ссылки
      html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary hover:text-primary/80 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>');

      // Горизонтальная линия
      html = html.replace(/^---$/gm, '<hr class="my-6 border-border">');

      // Таблицы (улучшенная поддержка)
      const tableRegex = /\|(.+)\|\n\|[\s\-\|]+\|\n((?:\|.+\|\n?)+)/g;
      html = html.replace(tableRegex, (match, header, rows) => {
        const headerCells = header.split('|')
          .filter(cell => cell.trim())
          .map(cell => `<th class="px-6 py-3 text-left font-semibold text-foreground bg-muted/80 border-b-2 border-border">${cell.trim()}</th>`)
          .join('');
        
        const bodyRows = rows.trim().split('\n').map(row => {
          const cells = row.split('|')
            .filter(cell => cell.trim())
            .map(cell => `<td class="px-6 py-4 text-foreground border-b border-border/30">${cell.trim()}</td>`)
            .join('');
          return `<tr class="hover:bg-muted/20 transition-colors">${cells}</tr>`;
        }).join('');
        
        return `<div class="overflow-x-auto my-6 rounded-lg border border-border bg-card shadow-sm">
          <table class="min-w-full table-auto">
            <thead>
              <tr>${headerCells}</tr>
            </thead>
            <tbody class="divide-y divide-border/30">
              ${bodyRows}
            </tbody>
          </table>
        </div>`;
      });

      // Параграфы
      const paragraphs = html.split(/\n\s*\n/);
      html = paragraphs.map(paragraph => {
        const trimmed = paragraph.trim();
        if (!trimmed) return '';
        
        if (trimmed.match(/^<(h[1-6]|ul|ol|li|pre|div|hr|table)/)) {
          return trimmed;
        }
        
        return `<p class="mb-4 text-foreground leading-relaxed">${trimmed}</p>`;
      }).join('\n');

      return html;
    };

    // Обработка контента
    let processed = processMermaid(content);
    processed = processMarkdown(processed);
    setProcessedContent(processed);
  }, [content]);

  // Обработка кликов по внутренним ссылкам
  useEffect(() => {
    const handleInternalLinkClick = (event: Event) => {
      const target = event.target as HTMLElement;
      if (target.classList.contains('internal-link')) {
        event.preventDefault();
        const href = target.getAttribute('href');
        if (href && href.startsWith('#')) {
          const targetId = href.substring(1);
          const targetElement = document.getElementById(targetId);
          if (targetElement) {
            targetElement.scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            });
            // Добавляем анимацию подсветки заголовка
            targetElement.classList.add('target-highlight');
            setTimeout(() => {
              targetElement.classList.remove('target-highlight');
            }, 2000);
          }
        }
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('click', handleInternalLinkClick);
      return () => container.removeEventListener('click', handleInternalLinkClick);
    }
  }, [processedContent]);

  return (
    <div 
      ref={containerRef}
      className={`markdown-content prose prose-gray dark:prose-invert max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: processedContent }}
    />
  );
}