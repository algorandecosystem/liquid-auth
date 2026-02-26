// @ts-nocheck - mermaid ships 391 .d.ts files that OOM the TypeScript language server
import mermaid from 'mermaid';

export function initMermaid(nodes: HTMLElement[]): void {
  mermaid.initialize({ startOnLoad: false, theme: 'neutral' });
  mermaid.run({ nodes });
}
