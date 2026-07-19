import { readFile } from "node:fs/promises"

const readSource = (path) =>
  readFile(new URL(`../${path}`, import.meta.url), "utf8")

test("HTTP and Socket room leave entrypoints share the leaveRoom service contract", async () => {
  const [routeSource, controllerSource, socketSource] = await Promise.all([
    readSource("src/routes/roomRoutes.js"),
    readSource("src/controllers/roomController.js"),
    readSource("src/socket/roomHandlers.js"),
  ])

  expect(routeSource).toMatch(/router\.post\("\/:roomCode\/leave", handleLeaveRoom\)/)
  expect(controllerSource).toMatch(/async function handleLeaveRoom/)
  expect(socketSource).toMatch(/socket\.on\("room:leave"/)
  expect(socketSource).toMatch(/await leaveRoom\(/)
  expect(socketSource).toMatch(/"room:dissolved"/)
  expect(socketSource).toMatch(/socket\.leave\(normalizedRoomCode\)/)
})
