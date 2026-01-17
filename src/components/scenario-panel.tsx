import { useScenarioStore } from '@/stores';
import { SimplePaymentScenario, LightningAddressScenario } from './scenarios';

export function ScenarioPanel() {
  const { currentScenario } = useScenarioStore();

  switch (currentScenario.id) {
    case 'simple-payment':
      return <SimplePaymentScenario />;
    case 'lightning-address':
      return <LightningAddressScenario />;
    default:
      return null;
  }
}
