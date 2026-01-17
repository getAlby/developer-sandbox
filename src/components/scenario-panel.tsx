import { useScenarioStore } from '@/stores';
import {
  SimplePaymentScenario,
  LightningAddressScenario,
  TransactionHistoryScenario,
} from './scenarios';

export function ScenarioPanel() {
  const { currentScenario } = useScenarioStore();

  switch (currentScenario.id) {
    case 'simple-payment':
      return <SimplePaymentScenario />;
    case 'lightning-address':
      return <LightningAddressScenario />;
    case 'transaction-history':
      return <TransactionHistoryScenario />;
    default:
      return null;
  }
}
