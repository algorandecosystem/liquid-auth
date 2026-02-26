declare const mermaid: {
  initialize(config: { startOnLoad?: boolean; theme?: string; [key: string]: unknown }): void;
  run(options?: { nodes?: HTMLElement[]; querySelector?: string }): Promise<void>;
};
export default mermaid;
