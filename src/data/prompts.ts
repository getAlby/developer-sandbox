import { scenarios } from "./scenarios";
import type { ScenarioPrompt } from "@/types";

export type PromptCategory =
  | "this-scenario"
  | "getting-started"
  | "all-scenarios";

export const PROMPT_CATEGORIES: {
  id: PromptCategory;
  label: string;
}[] = [
  { id: "this-scenario", label: "This Scenario" },
  { id: "getting-started", label: "Getting Started" },
  { id: "all-scenarios", label: "All Scenarios" },
];

export interface PromptWithScenario extends ScenarioPrompt {
  scenarioTitle: string;
  scenarioIcon: string;
}

export const GETTING_STARTED_PROMPTS: ScenarioPrompt[] = [
  {
    title: "Example Prompt",
    description:
      "A complete example showing what a good Lightning app prompt looks like. Be specific about the tech stack, features, and UX.",
    prompt: `Create a Vite Typescript React app where a user can connect their wallet and then purchase fake cat pictures (simple canvas art) with a single click. Each picture costs 5000 sats. Show the total the shop has earned and their remaining stock of cat pictures. There should only be 21. Write tests for the app using vitest and playwright. Also take screenshots and review the screenshots.`,
  },
  {
    title: "Testing Frontend Apps",
    description:
      "Add this to any prompt to get automated tests and visual review, and reduce the amount of human feedback and testing required. Works with vitest for unit/integration tests and playwright for end-to-end.",
    prompt: `Write tests for the app using vitest and playwright. Also take screenshots and review the screenshots.`,
  },
  {
    title: "Testing Backend / Console Apps",
    description:
      "Try this to any prompt to get automated tests and reduce the amount of human feedback and testing required. Works with jest.",
    prompt: `Create a Typescript console app where Alice creates an invoice and Bob pays it. Write tests for it using jest.`,
  },
];

export function getAllPrompts(): PromptWithScenario[] {
  return scenarios.flatMap((scenario) =>
    (scenario.prompts ?? []).map((prompt) => ({
      ...prompt,
      scenarioTitle: scenario.title,
      scenarioIcon: scenario.icon,
    })),
  );
}
