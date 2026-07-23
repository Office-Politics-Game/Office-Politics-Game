import { readFile } from "node:fs/promises"
import { jest } from "@jest/globals"

const verifyTokenMock = jest.fn()

jest.unstable_mockModule("../src/services/authService.js", () => ({
  verifyToken: verifyTokenMock,
}))

let getFriendPlayerRoom
let registerFriendHandlers

try {
  ;({
    getFriendPlayerRoom,
    registerFriendHandlers,
  } = await import("../src/socket/friendHandlers.js"))
} catch {
  // The first TDD run intentionally reaches the assertions without the module.
}

function createSocket(cookies = {}) {
  const handlers = new Map()
  const socket = {
    data: {},
    request: { cookies },
    join: jest.fn(),
    leave: jest.fn(),
    on: jest.fn((eventName, handler) => {
      handlers.set(eventName, handler)
    }),
  }

  return { handlers, socket }
}

beforeEach(() => {
  verifyTokenMock.mockReset()
})

describe("friend socket handlers", () => {
  test("valid member Cookie joins only the verified player's friend room", async () => {
    expect(registerFriendHandlers).toBeDefined()
    const { handlers, socket } = createSocket({
      officePoliticsAuthToken: "cookie-member-token",
    })
    const callback = jest.fn()
    verifyTokenMock.mockResolvedValueOnce({ id: 2 })
    registerFriendHandlers(socket)

    await handlers.get("friend:subscribe")(
      { token: "payload-token", playerId: 999 },
      callback,
    )

    expect(verifyTokenMock).toHaveBeenCalledWith("cookie-member-token")
    expect(socket.join).toHaveBeenCalledWith("friend:player:2")
    expect(socket.join).not.toHaveBeenCalledWith("friend:player:999")
    expect(socket.data.friendPlayerId).toBe(2)
    expect(callback).toHaveBeenCalledWith({
      ok: true,
      data: { playerId: 2 },
    })
  })

  test("missing or invalid member Cookie is rejected without joining", async () => {
    expect(registerFriendHandlers).toBeDefined()
    const { handlers, socket } = createSocket()
    const callback = jest.fn()
    verifyTokenMock.mockRejectedValueOnce(new Error("登入驗證失敗"))
    registerFriendHandlers(socket)

    await handlers.get("friend:subscribe")({}, callback)

    expect(verifyTokenMock).toHaveBeenCalledWith("")
    expect(socket.join).not.toHaveBeenCalled()
    expect(socket.data.friendPlayerId).toBeUndefined()
    expect(callback).toHaveBeenCalledWith({
      ok: false,
      error: { message: "登入驗證失敗" },
    })
  })

  test("subscribing as another verified player leaves the old room first", async () => {
    expect(registerFriendHandlers).toBeDefined()
    const { handlers, socket } = createSocket({
      officePoliticsAuthToken: "player-2-cookie",
    })
    verifyTokenMock
      .mockResolvedValueOnce({ id: 2 })
      .mockResolvedValueOnce({ id: 3 })
    registerFriendHandlers(socket)

    await handlers.get("friend:subscribe")({}, jest.fn())
    socket.request.cookies.officePoliticsAuthToken = "player-3-cookie"
    await handlers.get("friend:subscribe")({}, jest.fn())

    expect(socket.leave).toHaveBeenCalledWith("friend:player:2")
    expect(socket.join).toHaveBeenLastCalledWith("friend:player:3")
    expect(socket.leave.mock.invocationCallOrder[0]).toBeLessThan(
      socket.join.mock.invocationCallOrder[1],
    )
    expect(socket.data.friendPlayerId).toBe(3)
  })

  test("unsubscribe leaves only the personal friend room", async () => {
    expect(registerFriendHandlers).toBeDefined()
    const { handlers, socket } = createSocket()
    const callback = jest.fn()
    socket.data.friendPlayerId = 2
    registerFriendHandlers(socket)

    await handlers.get("friend:unsubscribe")({}, callback)

    expect(socket.leave).toHaveBeenCalledTimes(1)
    expect(socket.leave).toHaveBeenCalledWith("friend:player:2")
    expect(socket.data.friendPlayerId).toBeUndefined()
    expect(callback).toHaveBeenCalledWith({
      ok: true,
      data: { playerId: 2 },
    })
  })

  test("unsubscribe is idempotent without a friend identity", async () => {
    expect(registerFriendHandlers).toBeDefined()
    const { handlers, socket } = createSocket()
    const callback = jest.fn()
    registerFriendHandlers(socket)

    await handlers.get("friend:unsubscribe")({}, callback)

    expect(socket.leave).not.toHaveBeenCalled()
    expect(callback).toHaveBeenCalledWith({
      ok: true,
      data: { playerId: null },
    })
  })

  test("socket initialization registers friend handlers without replacing guest handlers", async () => {
    expect(getFriendPlayerRoom).toBeDefined()
    const source = await readFile(
      new URL("../src/socket/index.js", import.meta.url),
      "utf8",
    )

    expect(source).toMatch(
      /import \{[^}]*registerFriendHandlers[^}]*\} from "\.\/friendHandlers\.js"/,
    )
    expect(source).toMatch(/registerRoomHandlers\(io, socket\)/)
    expect(source).toMatch(/registerGameHandlers\(io, socket\)/)
    expect(source).toMatch(/registerChatHandlers\(socket\)/)
    expect(source).toMatch(/registerFriendHandlers\(socket\)/)
    expect(getFriendPlayerRoom(2)).toBe("friend:player:2")
  })
})
