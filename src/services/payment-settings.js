import "server-only";
import { PaymentSettings } from "@/models/payment-settings";
import { DEFAULT_MINIMUM_WITHDRAWAL } from "@/schemas/withdrawal";
export async function getMinimumWithdrawal() {
  const settings = await PaymentSettings.findById("payments").lean();
  return settings?.minimumWithdrawal ?? DEFAULT_MINIMUM_WITHDRAWAL;
}
