import { User } from "@/models/user";
import { Session } from "@/models/session";
import { Trader } from "@/models/trader";
import { Transaction } from "@/models/transaction";
import { adminUserInputSchema } from "@/schemas/admin-user";
import { adminFailure, adminJson, authorizeAdmin, readAdminJson } from "@/lib/admin-api";

export const runtime = "nodejs";

export async function GET(request) {
  try {
    const auth = await authorizeAdmin();
    if (auth.error) return auth.error;
    const url = new URL(request.url);
    const page = Math.max(1, Math.min(100000, Number(url.searchParams.get("page")) || 1));
    const pageSize = 25;
    const [records, total] = await Promise.all([
      User.find().select("username email role membershipPlan balance createdAt updatedAt").sort({ createdAt: -1, _id: -1 }).skip((page - 1) * pageSize).limit(pageSize).lean(),
      User.countDocuments(),
    ]);
    return adminJson({ users: records.map(serializeUser), pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) } });
  } catch (error) { return adminFailure(error); }
}

export async function PATCH(request) {
  try {
    const auth = await authorizeAdmin(request, true);
    if (auth.error) return auth.error;
    const body = await readAdminJson(request);
    if (body.error) return body.error;
    const { id, ...input } = body.data;
    if (!/^[a-f0-9]{24}$/i.test(id || "")) return adminJson({ error: "Invalid user ID." }, 400);
    const parsed = adminUserInputSchema.safeParse(input);
    if (!parsed.success) return adminJson({ error: parsed.error.issues[0].message }, 400);
    if (id === auth.user.id && parsed.data.role !== "admin") return adminJson({ error: "You cannot remove your own admin access." }, 400);
    const user = await User.findByIdAndUpdate(id, { $set: { ...parsed.data, balance: parsed.data.balance, usernameKey: parsed.data.username.toLowerCase() } }, { new: true, runValidators: true }).select("username email role membershipPlan balance createdAt updatedAt").lean();
    if (!user) return adminJson({ error: "User not found." }, 404);
    return adminJson({ user: serializeUser(user) });
  } catch (error) { return adminFailure(error); }
}

export async function DELETE(request) {
  try {
    const auth = await authorizeAdmin(request, true);
    if (auth.error) return auth.error;
    const body = await readAdminJson(request);
    if (body.error) return body.error;
    const { id } = body.data;
    if (!/^[a-f0-9]{24}$/i.test(id || "")) return adminJson({ error: "Invalid user ID." }, 400);
    if (id === auth.user.id) return adminJson({ error: "You cannot delete your own admin account." }, 400);
    if (await Transaction.exists({ userId: id, status: { $in: ["pending", "processing"] } })) return adminJson({ error: "Review this user's pending transactions before deleting their account." }, 409);
    const user = await User.findByIdAndDelete(id).select("_id");
    if (!user) return adminJson({ error: "User not found." }, 404);
    await Promise.all([Session.deleteMany({ userId: user._id }), Trader.updateMany({ userId: user._id }, { $set: { userId: null } })]);
    return adminJson({ deletedId: id });
  } catch (error) { return adminFailure(error); }
}

function serializeUser(user) {
  return { id: user._id.toString(), username: user.username, email: user.email, role: user.role, membershipPlan: user.membershipPlan, balance: user.balance, createdAt: user.createdAt, updatedAt: user.updatedAt };
}
