import { create } from 'zustand';
import type { Scenario } from '@/types';
import { scenarios } from '@/data/scenarios';

interface ScenarioState {
  currentScenario: Scenario;
  setCurrentScenario: (scenarioId: string) => void;
}

export const useScenarioStore = create<ScenarioState>((set) => ({
  currentScenario: scenarios[0],

  setCurrentScenario: (scenarioId: string) => {
    const scenario = scenarios.find((s) => s.id === scenarioId);
    if (scenario) {
      set({ currentScenario: scenario });
    }
  },
}));
