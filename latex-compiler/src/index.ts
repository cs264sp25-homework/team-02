import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import latexRoutes from "./routes/latex.routes";

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.text({ limit: "50mb" })); // Handle plain text input

// Routes
app.use("/latex", latexRoutes);

// Basic health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
