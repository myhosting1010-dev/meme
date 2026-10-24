import { PaymentSettings } from "@/models/payment-settings";
import { getMinimumWithdrawal } from "@/services/payment-settings";
import { withdrawalSettingsSchema } from "@/schemas/withdrawal";
import { adminFailure, adminJson, authorizeAdmin, readAdminJson } from "@/lib/admin-api";
export const runtime = "nodejs";
export async function GET() {
  try {
    const auth = await authorizeAdmin(); if (auth.error) return auth.error;
    return adminJson({ minimumWithdrawal: await getMinimumWithdrawal() });
  } catch (error) { return adminFailure(error); }
}
export async function PATCH(request) {
  try {
    const auth = await authorizeAdmin(request, true); if (auth.error) return auth.error;
    const body = await readAdminJson(request); if (body.error) return body.error;
    const parsed = withdrawalSettingsSchema.safeParse(body.data);
    if (!parsed.success) return adminJson({ error: parsed.error.issues[0].message }, 400);
    const settings = await PaymentSettings.findOneAndUpdate({ _id: "payments" }, { $set: { minimumWithdrawal: parsed.data.minimumWithdrawal, updatedBy: auth.user.id } }, { upsert: true, returnDocument: "after", runValidators: true }).lean();
    return adminJson({ minimumWithdrawal: settings.minimumWithdrawal });
  } catch (error) { return adminFailure(error); }
}
