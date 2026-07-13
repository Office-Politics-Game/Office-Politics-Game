import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readSource = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("profile personal area keeps expected fields and edit entry points", async () => {
  const infoPanelSource = await readSource("src/components/profile/ProfileInfoPanel.vue");
  const profileViewSource = await readSource("src/views/ProfileView.vue");
  const profileTabsSource = await readSource("src/components/profile/ProfileTabs.vue");
  const passwordModalSource = await readSource("src/components/profile/ProfilePasswordModal.vue");
  const matchPanelSource = await readSource("src/components/profile/ProfileMatchHistoryPanel.vue");
  const profileApiSource = await readSource("src/services/profileApi.js");
  const profileStoreSource = await readSource("src/stores/profileStore.js");

  assert.match(infoPanelSource, /KeyRound/);
  assert.match(infoPanelSource, /label:\s*"帳號安全"/);
  assert.match(infoPanelSource, /value:\s*"修改密碼"/);
  assert.match(infoPanelSource, /id:\s*"password"/);

  assert.match(infoPanelSource, /id:\s*"title"[\s\S]*?editable:\s*false/);
  assert.doesNotMatch(infoPanelSource, /label:\s*"地區"/);
  assert.doesNotMatch(infoPanelSource, /造型收藏/);

  assert.match(profileViewSource, /ProfilePasswordModal/);
  assert.match(profileViewSource, /v-if="isPasswordEditorOpen"/);
  assert.match(profileViewSource, /item\.id === "password"/);
  assert.match(profileViewSource, /openPasswordEditor\(\)/);

  assert.doesNotMatch(
    profileTabsSource,
    /\.profile-tabs__button:hover\s*{\s*background:/,
  );

  assert.match(passwordModalSource, /修改密碼/);
  assert.match(passwordModalSource, /會員安全流程/);

  assert.match(profileApiSource, /PROFILE_API_PATH}\/matches/);
  assert.match(profileStoreSource, /loadMatchHistory/);
  assert.match(profileStoreSource, /getProfileMatches/);
  assert.doesNotMatch(matchPanelSource, /整理中/);
  assert.match(matchPanelSource, /目前還沒有對戰紀錄/);
  assert.match(matchPanelSource, /勝者/);
  assert.match(matchPanelSource, /participants/);

  assert.match(matchPanelSource, /Battle Log/);
  assert.match(matchPanelSource, /WIN/);
  assert.match(matchPanelSource, /LOSE/);
  assert.match(matchPanelSource, /小局/);
  assert.match(matchPanelSource, /XP/);
  assert.doesNotMatch(matchPanelSource, /近20場/);
  assert.doesNotMatch(matchPanelSource, /近期戰績/);
  assert.doesNotMatch(matchPanelSource, /展開/);
});
