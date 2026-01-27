import { create } from 'zustand';
import type { SnippetCategory } from '@/data/code-snippets';
import type { PromptCategory } from '@/data/prompts';

type VisualizationTab = 'log' | 'flow' | 'chart' | 'snippets' | 'prompts' | 'production';

interface UIState {
  visualizationTab: VisualizationTab;
  snippetCategory: SnippetCategory;
  promptCategory: PromptCategory;
  setVisualizationTab: (tab: VisualizationTab) => void;
  setSnippetCategory: (category: SnippetCategory) => void;
  setPromptCategory: (category: PromptCategory) => void;
  openCodeSnippetsHelp: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  visualizationTab: 'log',
  snippetCategory: 'getting-started',
  promptCategory: 'this-scenario',

  setVisualizationTab: (tab) => set({ visualizationTab: tab }),
  setSnippetCategory: (category) => set({ snippetCategory: category }),
  setPromptCategory: (category) => set({ promptCategory: category }),

  // Convenience method to open Code Snippets tab on Getting Started
  openCodeSnippetsHelp: () =>
    set({
      visualizationTab: 'snippets',
      snippetCategory: 'getting-started',
    }),
}));
