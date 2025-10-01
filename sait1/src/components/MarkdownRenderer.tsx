import { useEffect, useRef, useState } from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [processedContent, setProcessedContent] = useState('');

  useEffect(() => {
    let mermaidId = 0;
    
    // Простая обработка Mermaid диаграмм - показываем код как есть
    const processMermaid = (text: string): string => {
      const mermaidRegex = /```mermaid\n([\s\S]*?)\n```/g;
      return text.replace(mermaidRegex, (match, diagram) => {
        const id = `mermaid-${++mermaidId}`;
        
        // Создаем SVG визуализацию для простых flowchart диаграмм
        const createSimpleFlowchart = (diagramText: string): string => {
          // Ищем узлы и связи
          const lines = diagramText.split('\n').filter(line => line.trim());
          const nodes: { [key: string]: string } = {};
          const edges: { from: string, to: string, label?: string }[] = [];
          
          lines.forEach(line => {
            const trimmed = line.trim();
            
            // Узлы с квадратными скобками [Node]
            const nodeMatch = trimmed.match(/(\w+)\[([^\]]+)\]/);
            if (nodeMatch) {
              nodes[nodeMatch[1]] = nodeMatch[2];
            }
            
            // Узлы с круглыми скобками (Node)
            const roundNodeMatch = trimmed.match(/(\w+)\(([^)]+)\)/);
            if (roundNodeMatch) {
              nodes[roundNodeMatch[1]] = roundNodeMatch[2];
            }
            
            // Связи с стрелками
            const arrowMatch = trimmed.match(/(\w+)\s*-->\s*(\w+)/);
            if (arrowMatch) {
              edges.push({ from: arrowMatch[1], to: arrowMatch[2] });
            }
            
            // Связи с подписями
            const labeledArrowMatch = trimmed.match(/(\w+)\s*-->\|([^|]+)\|\s*(\w+)/);
            if (labeledArrowMatch) {
              edges.push({ from: labeledArrowMatch[1], to: labeledArrowMatch[3], label: labeledArrowMatch[2] });
            }
          });

          // Простое SVG представление
          const svgNodes = Object.keys(nodes).map((key, index) => {
            const x = 50 + (index % 3) * 200;
            const y = 80 + Math.floor(index / 3) * 120;
            const text = nodes[key].replace(/<br>/g, ' ').replace(/<[^>]*>/g, '');
            
            return `
              <g class="node">
                <rect x="${x-60}" y="${y-25}" width="120" height="50" rx="5" 
                      fill="currentColor" fill-opacity="0.1" stroke="currentColor" stroke-width="2"/>
                <text x="${x}" y="${y+5}" text-anchor="middle" class="text-sm font-medium fill-current">
                  ${text.length > 15 ? text.substring(0, 15) + '...' : text}
                </text>
              </g>
            `;
          }).join('');

          return `
            <div class="mermaid-simple bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <div class="text-center mb-4">
                <span class="text-sm text-gray-500 dark:text-gray-400">📊 Диаграмма Mermaid</span>
              </div>
              <svg viewBox="0 0 600 400" class="w-full h-64 text-gray-700 dark:text-gray-300">
                ${svgNodes}
              </svg>
              <details class="mt-4">
                <summary class="cursor-pointer text-sm text-blue-600 dark:text-blue-400 hover:underline">
                  Показать исходный код
                </summary>
                <pre class="mt-2 p-4 bg-gray-100 dark:bg-gray-700 rounded text-xs overflow-x-auto"><code>${diagram}</code></pre>
              </details>
            </div>
          `;
        };

        // Проверяем тип диаграммы
        if (diagram.includes('flowchart')) {
          return createSimpleFlowchart(diagram);
        }

        // Для остальных типов диаграмм показываем код
        return `
          <div id="${id}" class="mermaid-fallback bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 my-6">
            <div class="flex items-center gap-2 mb-3">
              <span class="text-2xl">📊</span>
              <h4 class="font-semibold text-blue-700 dark:text-blue-300">Диаграмма Mermaid</h4>
            </div>
            <p class="text-blue-600 dark:text-blue-400 text-sm mb-4">
              Для полного отображения диаграмм Mermaid рекомендуется использовать специализированные редакторы.
            </p>
            <details>
              <summary class="cursor-pointer text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium">
                Показать код диаграммы
              </summary>
              <pre class="mt-3 p-4 bg-gray-100 dark:bg-gray-700 rounded text-sm overflow-x-auto"><code class="text-gray-800 dark:text-gray-200">${diagram}</code></pre>
            </details>
          </div>
        `;
      });
    };

    // Простой обработчик Markdown
    const processMarkdown = (text: string): string => {
      let html = text;

      // Заголовки
      html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mb-3 mt-6 text-gray-900 dark:text-gray-100">$1</h3>');
      html = html.replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mb-4 mt-8 text-gray-900 dark:text-gray-100">$1</h2>');
      html = html.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mb-6 mt-8 text-gray-900 dark:text-gray-100">$1</h1>');

      // Жирный и курсив
      html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900 dark:text-gray-100">$1</strong>');
      html = html.replace(/\*(.*?)\*/g, '<em class="italic text-gray-700 dark:text-gray-300">$1</em>');

      // Код
      html = html.replace(/`([^`]+)`/g, '<code class="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm font-mono text-gray-800 dark:text-gray-200">$1</code>');

      // Блоки кода (не Mermaid)
      html = html.replace(/```(?!mermaid)([\s\S]*?)```/g, '<pre class="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto my-4 border border-gray-200 dark:border-gray-700"><code class="text-sm text-gray-800 dark:text-gray-200">$1</code></pre>');

      // Списки - сначала обработаем элементы списков
      html = html.replace(/^\* (.+)$/gm, '<li class="ml-4 list-disc text-gray-700 dark:text-gray-300">$1</li>');
      html = html.replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-gray-700 dark:text-gray-300">$1</li>');
      html = html.replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal text-gray-700 dark:text-gray-300">$1</li>');

      // Обернуть последовательные li в ul
      html = html.replace(/(<li[^>]*>.*?<\/li>\s*)+/g, '<ul class="space-y-1 my-4 pl-4">$&</ul>');

      // Ссылки
      html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 dark:text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>');

      // Горизонтальная линия
      html = html.replace(/^---$/gm, '<hr class="my-6 border-gray-300 dark:border-gray-600">');

      // Параграфы - разделяем по двойным переносам
      const paragraphs = html.split(/\n\s*\n/);
      html = paragraphs.map(paragraph => {
        const trimmed = paragraph.trim();
        if (!trimmed) return '';
        
        // Не оборачиваем в p если уже есть блочные элементы
        if (trimmed.match(/^<(h[1-6]|ul|ol|li|pre|div|hr)/)) {
          return trimmed;
        }
        
        return `<p class="mb-4 text-gray-700 dark:text-gray-300 leading-relaxed">${trimmed}</p>`;
      }).join('\n');

      return html;
    };

    // Обработка контента
    let processed = processMermaid(content);
    processed = processMarkdown(processed);
    setProcessedContent(processed);
  }, [content]);

  return (
    <div 
      ref={containerRef}
      className={`markdown-content prose dark:prose-invert max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: processedContent }}
    />
  );
}