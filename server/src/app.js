import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { router as roomRouter } from "./routes/roomRoutes.js";
import { router as gameStateRouter } from "./routes/gameSessionRoutes.js";
import { router as playerRouter } from "./routes/playerRoutes.js";
import { router as actionRouter } from "./routes/actionRoutes.js";

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
app.use("/api/actions", actionRouter)

app.get("/", (req, res) => {
    res.send("server is running")
})

const PORT = process.env.PORT || 3000;
app.listen(PORT);
