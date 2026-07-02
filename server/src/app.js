import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "node:http";
import { router as roomRouter } from "./routes/roomRoutes.js";
import { router as gameStateRouter } from "./routes/gameSessionRoutes.js";
import { router as playerRouter } from "./routes/playerRoutes.js";
import { router as actionRouter, roomActionRouter } from "./routes/actionRoutes.js";
import { router as friendRouter } from "./routes/friendRoutes.js";
import { initializeSocket } from "./socket/index.js";
import { router as authRouter } from "./routes/authRoutes.js";

dotenv.config();

const app = express()
const httpServer = createServer(app)


app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
  })
);
app.use(express.json())

app.use("/api/auth", authRouter)
app.use("/api/rooms", roomRouter)
app.use("/api/rooms", roomActionRouter)
app.use("/api/game-states", gameStateRouter)
app.use("/api/players", playerRouter)
app.use("/api/actions", actionRouter)
app.use("/api/friends", friendRouter)

app.get("/", (req, res) => {
    res.send("server is running")
})

initializeSocket(httpServer)
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT)
