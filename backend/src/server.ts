
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { prisma } from "./lib/prisma.js";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    message: "EventPro API is running",
  });
});


app.get("/api/health/db", async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
  
      res.status(200).json({
        status: "ok",
        message: "EventPro database connection is working",
      });
    } catch (error) {
      console.error("Database connection failed:", error);
  
      res.status(503).json({
        status: "error",
        message: "Cannot connect to database",
      });
    }
  });
  

app.listen(PORT, () => {
  console.log(`EventPro API running at http://localhost:${PORT}`);
});
