import { create } from 'zustand';
import type { SnippetCategory } from '@/data/code-snippets';

type VisualizationTab = 'log' | 'flow' | 'chart' | 'snippets';

interface UIState {
  visualizationTab: VisualizationTab;
  snippetCategory: SnippetCategory;
  setVisualizationTab: (tab: VisualizationTab) => void;
  setSnippetCategory: (category: SnippetCategory) => void;
  openCodeSnippetsHelp: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  visualizationTab: 'log',
  snippetCategory: 'getting-started',

  setVisualizationTab: (tab) => set({ visualizationTab: tab }),
  setSnippetCategory: (category) => set({ snippetCategory: category }),

  // Convenience method to open Code Snippets tab on Getting Started
  openCodeSnippetsHelp: () =>
    set({
      visualizationTab: 'snippets',
      snippetCategory: 'getting-started',
    }),
}));
