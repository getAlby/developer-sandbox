import { useScenarioStore } from '@/stores';
import { SimplePaymentScenario } from './scenarios';

export function ScenarioPanel() {
  const { currentScenario } = useScenarioStore();

  switch (currentScenario.id) {
    case 'simple-payment':
      return <SimplePaymentScenario />;
    // Add more scenarios here as they're implemented
    default:
      return null;
  }
}
