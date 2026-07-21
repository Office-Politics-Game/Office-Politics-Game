import { readFile } from "node:fs/promises"
import { jest } from "@jest/globals"

const verifyTokenMock = jest.fn()

jest.unstable_mockModule("../src/services/authService.js", () => ({
  verifyToken: verifyTokenMock,
}))

const {
  getChatPlayerRoom,
  registerChatHandlers,
} = await import("../src/socket/chatHandlers.js")

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

describe("chat socket handlers", () => {
  test("valid member Cookie joins only the verified player's chat room", async () => {
    const { handlers, socket } = createSocket({
      officePoliticsAuthToken: "cookie-member-token",
    })
    const callback = jest.fn()
    verifyTokenMock.mockResolvedValueOnce({ id: 2 })
    registerChatHandlers(socket)

    await handlers.get("chat:subscribe")(
      { token: "member-token", playerId: 999 },
      callback,
    )

    expect(verifyTokenMock).toHaveBeenCalledWith("cookie-member-token")
    expect(socket.join).toHaveBeenCalledWith("chat:player:2")
    expect(socket.join).not.toHaveBeenCalledWith("chat:player:999")
    expect(socket.data.chatPlayerId).toBe(2)
    expect(callback).toHaveBeenCalledWith({
      ok: true,
      data: { playerId: 2 },
    })
  })

  test("missing or invalid member Cookie is rejected without joining", async () => {
    const { handlers, socket } = createSocket()
    const callback = jest.fn()
    verifyTokenMock.mockRejectedValueOnce(new Error("登入驗證失敗"))
    registerChatHandlers(socket)

    await handlers.get("chat:subscribe")({}, callback)

    expect(verifyTokenMock).toHaveBeenCalledWith("")
    expect(socket.join).not.toHaveBeenCalled()
    expect(socket.data.chatPlayerId).toBeUndefined()
    expect(callback).toHaveBeenCalledWith({
      ok: false,
      error: { message: "登入驗證失敗" },
    })
  })

  test("subscribing as another verified player leaves the old chat room first", async () => {
    const { handlers, socket } = createSocket({
      officePoliticsAuthToken: "player-2-cookie",
    })
    verifyTokenMock
      .mockResolvedValueOnce({ id: 2 })
      .mockResolvedValueOnce({ id: 3 })
    registerChatHandlers(socket)

    await handlers.get("chat:subscribe")({}, jest.fn())
    socket.request.cookies.officePoliticsAuthToken = "player-3-cookie"
    await handlers.get("chat:subscribe")({}, jest.fn())

    expect(verifyTokenMock).toHaveBeenNthCalledWith(1, "player-2-cookie")
    expect(verifyTokenMock).toHaveBeenNthCalledWith(2, "player-3-cookie")

    expect(socket.leave).toHaveBeenCalledWith("chat:player:2")
    expect(socket.join).toHaveBeenLastCalledWith("chat:player:3")
    expect(socket.leave.mock.invocationCallOrder[0]).toBeLessThan(
      socket.join.mock.invocationCallOrder[1],
    )
    expect(socket.data.chatPlayerId).toBe(3)
  })

  test("subscribed player can unsubscribe without leaving unrelated rooms", async () => {
    const { handlers, socket } = createSocket()
    const callback = jest.fn()
    socket.data.chatPlayerId = 2
    registerChatHandlers(socket)

    await handlers.get("chat:unsubscribe")({}, callback)

    expect(socket.leave).toHaveBeenCalledTimes(1)
    expect(socket.leave).toHaveBeenCalledWith("chat:player:2")
    expect(socket.data.chatPlayerId).toBeUndefined()
    expect(callback).toHaveBeenCalledWith({
      ok: true,
      data: { playerId: 2 },
    })
  })

  test("unsubscribe is idempotent when no chat identity exists", async () => {
    const { handlers, socket } = createSocket()
    const callback = jest.fn()
    registerChatHandlers(socket)

    await handlers.get("chat:unsubscribe")({}, callback)

    expect(socket.leave).not.toHaveBeenCalled()
    expect(callback).toHaveBeenCalledWith({
      ok: true,
      data: { playerId: null },
    })
  })

  test("unsubscribe cancels a subscription whose token verification is still pending", async () => {
    const { handlers, socket } = createSocket({
      officePoliticsAuthToken: "pending-member-cookie",
    })
    const subscribeCallback = jest.fn()
    const unsubscribeCallback = jest.fn()
    let resolveVerification
    const verificationPromise = new Promise((resolve) => {
      resolveVerification = resolve
    })
    verifyTokenMock.mockReturnValueOnce(verificationPromise)
    registerChatHandlers(socket)

    const subscribePromise = handlers.get("chat:subscribe")({}, subscribeCallback)
    const unsubscribePromise = handlers.get("chat:unsubscribe")(
      {},
      unsubscribeCallback,
    )
    resolveVerification({ id: 2 })

    await Promise.all([subscribePromise, unsubscribePromise])

    expect(socket.join).not.toHaveBeenCalled()
    expect(socket.data.chatPlayerId).toBeUndefined()
    expect(unsubscribeCallback).toHaveBeenCalledWith({
      ok: true,
      data: { playerId: null },
    })
  })

  test("socket initialization parses Cookies and keeps guest handlers registered", async () => {
    const source = await readFile(
      new URL("../src/socket/index.js", import.meta.url),
      "utf8",
    )

    expect(source).toMatch(
      /import \{[^}]*registerChatHandlers[^}]*\} from "\.\/chatHandlers\.js"/,
    )
    expect(source).toMatch(/import cookieParser from "cookie-parser"/)
    expect(source).toMatch(/io\.engine\.use\(cookieParser\(\)\)/)
    expect(source).toMatch(/registerRoomHandlers\(io, socket\)/)
    expect(source).toMatch(/registerGameHandlers\(io, socket\)/)
    expect(source).toMatch(/registerChatHandlers\(socket\)/)
    expect(getChatPlayerRoom(2)).toBe("chat:player:2")
  })

  test("socket server allows credentialed CORS", async () => {
    const source = await readFile(
      new URL("../src/socket/index.js", import.meta.url),
      "utf8",
    )

    expect(source).toMatch(/credentials: true/)
  })
})
