import type { Background } from './background';

export interface ColorPalette {
  id: string;
  name: string;
  colors: Record<string, string>;
}

export interface RendererResult {
  type: 'svg' | 'png' | 'error';
  data: string;
}

export interface RendererPlugin {
  id: string;
  label: string;
  palette: ColorPalette;
  render(source: string, background: Background): Promise<RendererResult>;
}

export const RENDERER_REGISTRY: RendererPlugin[] = [];
