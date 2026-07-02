import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const readSource = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('friend api wrapper targets the backend friend routes', async () => {
  const source = await readSource('src/services/friendApi.js')

  assert.match(source, /const FRIEND_API_PATH = "\/friends"/)
  assert.match(source, /getFriends\(playerId\)/)
  assert.match(source, /requests\/received/)
  assert.match(source, /requests\/sent/)
  assert.match(source, /requests\/\$\{requestId\}\/accept/)
  assert.match(source, /requests\/\$\{requestId\}\/reject/)
})

test('friend store uses real api data instead of friend mock data', async () => {
  const source = await readSource('src/stores/friendStore.js')

  assert.match(source, /from "@\/services\/friendApi\.js"/)
  assert.match(source, /searchPlayers as searchPlayersApi/)
  assert.match(source, /loadFriendData/)
  assert.match(source, /sendFriendRequestApi/)
  assert.match(source, /acceptFriendRequestApi/)
  assert.match(source, /rejectFriendRequestApi/)
  assert.doesNotMatch(source, /friendMockData/)
  assert.doesNotMatch(source, /mockFriends/)
  assert.doesNotMatch(source, /mockFriendMessages/)
  assert.doesNotMatch(source, /selectedFriendMessages/)
})

test('friend view removes chat mock flow and shows friend details', async () => {
  const source = await readSource('src/views/FriendView.vue')

  assert.match(source, /friendStore\.loadFriendData\(\)/)
  assert.match(source, /selectedFriendDetails/)
  assert.match(source, /好友聊天尚未串接/)
  assert.doesNotMatch(source, /v-model="messageText"/)
  assert.doesNotMatch(source, /輸入訊息/)
  assert.doesNotMatch(source, /selectedFriendMessages/)
  assert.doesNotMatch(source, /sendMessage/)
})

test('add friend form searches players before sending invites', async () => {
  const source = await readSource('src/components/friend/AddFriendForm.vue')

  assert.match(source, /defineEmits\(\["search", "add-friend"\]\)/)
  assert.match(source, /搜尋玩家/)
  assert.match(source, /searchResults/)
  assert.match(source, /relationStatus/)
  assert.match(source, /emit\("search", value\)/)
  assert.match(source, /emit\('add-friend', player\.playerId\)/)
})
