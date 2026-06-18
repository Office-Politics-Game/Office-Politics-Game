import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { router as roomRouter } from "./routes/RoomRoutes.js";
import { router as gameStateRouter } from "./routes/GameSessionRoutes.js";
import { router as playerRouter } from "./routes/PlayerRoutes.js";

dotenv.config();

const app = express()

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
  })
);
app.use(express.json())

app.use("/api/rooms", roomRouter)
app.use("/api/game-states", gameStateRouter)
app.use("/api/players", playerRouter)

app.get("/", (req, res) => {
    res.send("server is running")
})

const PORT = process.env.PORT || 3000;
app.listen(PORT);
