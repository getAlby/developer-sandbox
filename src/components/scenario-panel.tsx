import { useScenarioStore } from "@/stores";
import {
  SimplePaymentScenario,
  LookupInvoiceScenario,
  LightningAddressScenario,
  NotificationsScenario,
  SubscriptionPaymentsScenario,
  HoldInvoiceScenario,
  TransactionHistoryScenario,
  ProofOfPaymentScenario,
  DecodeBolt11InvoiceScenario,
  FiatConversionScenario,
  PaymentForwardingScenario,
  PaymentPrismsScenario,
  LnurlVerifyScenario,
  WrappedInvoicesScenario,
} from "./scenarios";
import { ConnectWalletScenario } from "./bitcoin-connect/connect-wallet";

export function ScenarioPanel() {
  const { currentScenario } = useScenarioStore();

  switch (currentScenario.id) {
    case "simple-payment":
      return <SimplePaymentScenario />;
    case "lookup-invoice":
      return <LookupInvoiceScenario />;
    case "lightning-address":
      return <LightningAddressScenario />;
    case "notifications":
      return <NotificationsScenario />;
    case "subscription-payments":
      return <SubscriptionPaymentsScenario />;
    case "hold-invoice":
      return <HoldInvoiceScenario />;
    case "transaction-history":
      return <TransactionHistoryScenario />;
    case "proof-of-payment":
      return <ProofOfPaymentScenario />;
    case "decode-bolt11-invoice":
      return <DecodeBolt11InvoiceScenario />;
    case "fiat-conversion":
      return <FiatConversionScenario />;
    case "payment-forwarding":
      return <PaymentForwardingScenario />;
    case "payment-prisms":
      return <PaymentPrismsScenario />;
    case "lnurl-verify":
      return <LnurlVerifyScenario />;
    case "wrapped-invoices":
      return <WrappedInvoicesScenario />;
    case "connect-wallet":
      return <ConnectWalletScenario />;
    default:
      return null;
  }
}
