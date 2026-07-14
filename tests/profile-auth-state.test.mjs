import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readSource = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("profile initializer keeps member, guest, anonymous, and auth-failed states separate", async () => {
  const initializerSource = await readSource("src/composables/useProfileInitializer.js");
  const profileViewSource = await readSource("src/views/ProfileView.vue");

  assert.match(initializerSource, /const isVerified = await authStore\.verifyToken\(\)/);
  assert.match(initializerSource, /if \(!isVerified\)\s*{\s*profileStore\.clearProfile\("anonymous"\)/);
  assert.match(initializerSource, /status:\s*"auth_failed"/);
  assert.match(initializerSource, /status:\s*"member"/);
  assert.match(initializerSource, /status:\s*"guest"/);
  assert.match(initializerSource, /status:\s*"anonymous"/);
  assert.match(
    initializerSource,
    /if \(!authStore\.hasVerifiedToken\)\s*{\s*const isVerified = await authStore\.verifyToken\(\)/,
  );

  assert.match(
    initializerSource,
    /if \(authStore\.isLoggedIn\)\s*{\s*const profile = await profileStore\.loadMemberProfile\(\)/,
  );

  const authFailedIndex = initializerSource.indexOf('status: "auth_failed"');
  const guestFallbackIndex = initializerSource.indexOf("const guestPlayer =");
  assert.ok(authFailedIndex > -1, "auth_failed status should be returned");
  assert.ok(guestFallbackIndex > -1, "guest fallback should still exist for explicit guests");
  assert.ok(
    authFailedIndex < guestFallbackIndex,
    "token verification failure must be handled before guest fallback",
  );

  assert.match(profileViewSource, /result\?\.status === "auth_failed"/);
  assert.match(profileViewSource, /query:\s*{\s*auth:\s*"login"\s*}/);
  assert.match(profileViewSource, /result\?\.status === "anonymous"/);
  assert.match(profileViewSource, /router\.replace/);
});
