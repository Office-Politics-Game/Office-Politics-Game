import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readSource = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("profile initializer keeps member, guest, and anonymous states separate", async () => {
  const initializerSource = await readSource("src/composables/useProfileInitializer.js");
  const profileViewSource = await readSource("src/views/ProfileView.vue");

  assert.match(initializerSource, /await authStore\.checkSession\(\)/);
  assert.doesNotMatch(initializerSource, /authStore\.verifyToken\(\)/);
  assert.doesNotMatch(initializerSource, /status:\s*"auth_failed"/);
  assert.match(initializerSource, /status:\s*"member"/);
  assert.match(initializerSource, /status:\s*"guest"/);
  assert.match(initializerSource, /status:\s*"anonymous"/);
  assert.match(
    initializerSource,
    /if \(!authStore\.hasVerifiedToken\)\s*{\s*await authStore\.checkSession\(\)/,
  );

  assert.match(
    initializerSource,
    /if \(authStore\.isLoggedIn\)\s*{\s*const profile = await profileStore\.loadMemberProfile\(\)/,
  );

  const sessionCheckIndex = initializerSource.indexOf("await authStore.checkSession()");
  const guestFallbackIndex = initializerSource.indexOf("const guestPlayer =");
  assert.ok(sessionCheckIndex > -1, "session check should run before profile fallback");
  assert.ok(guestFallbackIndex > -1, "guest fallback should still exist for explicit guests");
  assert.ok(
    sessionCheckIndex < guestFallbackIndex,
    "anonymous session check must still allow guest fallback",
  );

  assert.doesNotMatch(profileViewSource, /result\?\.status === "auth_failed"/);
  assert.match(profileViewSource, /result\?\.status === "anonymous"/);
  assert.match(profileViewSource, /router\.replace/);
});
