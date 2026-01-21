import { useScenarioStore } from '@/stores';
import {
  SimplePaymentScenario,
  LightningAddressScenario,
  NotificationsScenario,
  HoldInvoiceScenario,
  TransactionHistoryScenario,
  ProofOfPaymentScenario,
  FiatConversionScenario,
} from './scenarios';

export function ScenarioPanel() {
  const { currentScenario } = useScenarioStore();

  switch (currentScenario.id) {
    case 'simple-payment':
      return <SimplePaymentScenario />;
    case 'lightning-address':
      return <LightningAddressScenario />;
    case 'notifications':
      return <NotificationsScenario />;
    case 'hold-invoice':
      return <HoldInvoiceScenario />;
    case 'transaction-history':
      return <TransactionHistoryScenario />;
    case 'proof-of-payment':
      return <ProofOfPaymentScenario />;
    case 'fiat-conversion':
      return <FiatConversionScenario />;
    default:
      return null;
  }
}
