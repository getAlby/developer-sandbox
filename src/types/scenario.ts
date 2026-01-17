export type ScenarioComplexity = 'simplest' | 'simple' | 'medium' | 'advanced';

export interface Scenario {
  id: string;
  title: string;
  description: string;
  education: string;
  complexity: ScenarioComplexity;
  requiredWallets: string[];
  icon: string;
}
