import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const readSource = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('room invitation schema and backend routes are registered', async () => {
  const schemaSource = await readSource('server/src/db/schema.sql')
  const appSource = await readSource('server/src/app.js')
  const routeSource = await readSource('server/src/routes/roomInvitationRoutes.js')

  assert.match(schemaSource, /CREATE TABLE room_invitations/)
  assert.match(schemaSource, /unique_pending_room_invitation/)
  assert.match(schemaSource, /status IN \('pending', 'accepted', 'rejected', 'expired'\)/)
  assert.match(appSource, /roomInvitationRouter/)
  assert.match(routeSource, /rooms\/:roomCode\/invitations/)
  assert.match(routeSource, /room-invitations\/:id\/accept/)
  assert.match(routeSource, /room-invitations\/:id\/reject/)
})

test('room invitation frontend api and store expose the MVP flow', async () => {
  const apiSource = await readSource('src/services/roomInvitationApi.js')
  const storeSource = await readSource('src/stores/roomInvitationStore.js')

  assert.match(apiSource, /const ROOM_INVITATION_API_PATH = "\/room-invitations"/)
  assert.match(apiSource, /sendRoomInvitation/)
  assert.match(apiSource, /getPendingRoomInvitations/)
  assert.match(apiSource, /acceptRoomInvitation/)
  assert.match(apiSource, /rejectRoomInvitation/)

  assert.match(storeSource, /useRoomInvitationStore/)
  assert.match(storeSource, /loadInvitations/)
  assert.match(storeSource, /sendInvitation/)
  assert.match(storeSource, /acceptInvitation/)
  assert.match(storeSource, /rejectInvitation/)
  assert.match(storeSource, /roomStore\.fetchRoomState\(roomCode\)/)
})

test('custom room invites friends and lobby exposes pending room invitations', async () => {
  const customRoomSource = await readSource('src/views/CustomRoomView.vue')
  const playerListSource = await readSource('src/components/gameRoom/CustomRoomPlayerList.vue')
  const inviteModalSource = await readSource('src/components/gameRoom/InviteFriendModal.vue')
  const lobbyMenuSource = await readSource('src/components/menu/LobbyMenu.vue')
  const noticeSource = await readSource('src/components/gameRoom/RoomInvitationNotice.vue')

  assert.match(playerListSource, /invite-friend/)
  assert.match(playerListSource, /canInviteFriend/)
  assert.match(customRoomSource, /InviteFriendModal/)
  assert.match(customRoomSource, /availableInviteFriends/)
  assert.match(customRoomSource, /roomInvitationStore\.sendInvitation/)
  assert.match(inviteModalSource, /好友清單/)
  assert.match(inviteModalSource, /發送邀請/)

  assert.match(lobbyMenuSource, /RoomInvitationNotice/)
  assert.match(noticeSource, /房間邀請/)
  assert.match(noticeSource, /roomInvitationStore\.loadInvitations/)
  assert.match(noticeSource, /roomInvitationStore\.acceptInvitation/)
  assert.match(noticeSource, /roomInvitationStore\.rejectInvitation/)
})
