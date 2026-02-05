import type { SnippetId } from "@/data/code-snippets";

export type ScenarioComplexity = "simplest" | "simple" | "medium" | "advanced" | "expert";

export type ScenarioSection = "scenarios" | "bitcoin-connect";

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
  icon: string;
  complexity: ScenarioComplexity;
  section?: ScenarioSection;
  requiredWallets?: string[];
  howItWorks?: { title: string; description: string }[];
  prompts?: ScenarioPrompt[];
  snippetIds?: SnippetId[];
}
