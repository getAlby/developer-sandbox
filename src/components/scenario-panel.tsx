import { useScenarioStore } from '@/stores';
import {
  SimplePaymentScenario,
  LookupInvoiceScenario,
  LightningAddressScenario,
  NotificationsScenario,
  HoldInvoiceScenario,
  TransactionHistoryScenario,
  ProofOfPaymentScenario,
  DecodeBolt11InvoiceScenario,
  FiatConversionScenario,
  PaymentForwardingScenario,
  PaymentPrismsScenario,
} from './scenarios';

export function ScenarioPanel() {
  const { currentScenario } = useScenarioStore();

  switch (currentScenario.id) {
    case 'simple-payment':
      return <SimplePaymentScenario />;
    case 'lookup-invoice':
      return <LookupInvoiceScenario />;
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
    case 'decode-bolt11-invoice':
      return <DecodeBolt11InvoiceScenario />;
    case 'fiat-conversion':
      return <FiatConversionScenario />;
    case 'payment-forwarding':
      return <PaymentForwardingScenario />;
    case 'payment-prisms':
      return <PaymentPrismsScenario />;
    default:
      return null;
  }
}
