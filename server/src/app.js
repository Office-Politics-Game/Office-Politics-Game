import express from "express";
import cors from "cors";
import pool from "./db/index.js";

const app = express()

app.use(cors())
app.use(express.json())

app.get("/", (req, res) => {
    res.send("server is running")
})

app.listen(3000, () => {
    console.log("server is running on port 3000")
})