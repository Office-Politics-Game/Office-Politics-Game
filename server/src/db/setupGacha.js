import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pool from "./index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const setupSql = fs.readFileSync(path.join(__dirname, "gachaSetup.sql"), "utf8");

try {
  await pool.query(setupSql);
  console.log("gacha setup complete");
} catch (error) {
  console.error("gacha setup failed", error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
