import type { SnippetId } from "@/data/code-snippets";

export type ScenarioComplexity = "simplest" | "simple" | "medium" | "advanced";

export interface ScenarioPrompt {
  title: string;
  description: string;
  prompt: string;
}

export interface Scenario {
  id: string;
  title: string;
  description: string;
  education: string;
  complexity: ScenarioComplexity;
  requiredWallets: string[];
  icon: string;
  howItWorks?: { title: string; description: string }[];
  prompts?: ScenarioPrompt[];
  snippetIds?: SnippetId[];
}
