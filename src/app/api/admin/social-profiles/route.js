import { SocialProfile } from "@/models/social-profile";
import { socialProfileSchema } from "@/schemas/social-profile";
import { adminFailure, adminJson, authorizeAdmin, readAdminJson } from "@/lib/admin-api";

export const runtime = "nodejs";
const serialize = (item, index) => ({ id: item._id.toString(), handle: item.handle, profileUrl: item.profileUrl, current: index === 0 });
async function list() { return (await SocialProfile.find().sort({ updatedAt: -1, _id: -1 }).lean()).map(serialize); }

export async function GET() {
  try {
    const auth = await authorizeAdmin();
    if (auth.error) return auth.error;
    return adminJson({ profiles: await list() });
  } catch (error) { return adminFailure(error); }
}

async function mutate(request, method) {
  try {
    const auth = await authorizeAdmin(request, true);
    if (auth.error) return auth.error;
    const body = await readAdminJson(request);
    if (body.error) return body.error;
    const { id, ...input } = body.data;
    if (method !== "POST" && !/^[a-f0-9]{24}$/i.test(id || "")) return adminJson({ error: "Invalid social profile ID." }, 400);
    if (method === "DELETE") {
      if (Object.keys(input).length) return adminJson({ error: "Invalid deletion request." }, 400);
      if (!await SocialProfile.findByIdAndDelete(id)) return adminJson({ error: "Social profile not found." }, 404);
    } else {
      if (method === "POST" && id !== undefined) return adminJson({ error: "A new profile cannot include an ID." }, 400);
      const parsed = socialProfileSchema.safeParse(input);
      if (!parsed.success) return adminJson({ error: parsed.error.issues[0].message }, 400);
      const data = { ...parsed.data, profileKey: parsed.data.handle.toLowerCase() };
      await SocialProfile.createIndexes();
      if (method === "POST") await SocialProfile.create(data);
      else if (!await SocialProfile.findByIdAndUpdate(id, { $set: data }, { runValidators: true })) return adminJson({ error: "Social profile not found." }, 404);
    }
    return adminJson({ profiles: await list() }, method === "POST" ? 201 : 200);
  } catch (error) {
    if (error?.code === 11000) return adminJson({ error: "That X profile already exists." }, 409);
    return adminFailure(error);
  }
}
export const POST = (request) => mutate(request, "POST");
export const PATCH = (request) => mutate(request, "PATCH");
export const DELETE = (request) => mutate(request, "DELETE");
