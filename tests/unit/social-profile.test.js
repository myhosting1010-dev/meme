import test from "node:test";
import assert from "node:assert/strict";
import { socialProfileSchema } from "../../src/schemas/social-profile.js";
import { SocialProfile } from "../../src/models/social-profile.js";

test("X profiles accept usernames and normalize Twitter URLs to X", () => {
  for (const profile of ["@support_team", "support_team", "https://x.com/support_team", "https://twitter.com/support_team/", "https://www.x.com/support_team"]) {
    assert.deepEqual(socialProfileSchema.parse({ profile }), { handle: "support_team", profileUrl: "https://x.com/support_team" });
  }
});
test("social input rejects unrelated sites, unsafe URLs and non-profile routes", () => {
  for (const profile of ["", "javascript:alert(1)", "http://x.com/support", "https://example.com/support", "https://x.com.evil.com/support", "https://user@x.com/support", "https://x.com/support/status/123", "https://x.com/home", "https://x.com/support?next=evil", "https://x.com/support#hash", "@this_handle_is_far_too_long", "@@support"]) {
    assert.equal(socialProfileSchema.safeParse({ profile }).success, false, profile);
  }
  assert.equal(socialProfileSchema.safeParse({ profile: "@support", role: "admin" }).success, false);
});
test("social profiles enforce unique normalized handles", () => {
  assert.ok(SocialProfile.schema.indexes().some(([fields, options]) => fields.profileKey === 1 && options.unique));
});
