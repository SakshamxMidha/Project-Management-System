import express, { urlencoded } from "express";
import cors from "cors"
import cookieParser from "cookie-parser";

//import healthcheck and use
import healthcheckRoutes from "./routes/healthcheck_router.js"
import authRouter from "./routes/auth-router.js"

const app = express();

//basics config middleware

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser())

//cors

app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(",") || "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Authorization", "Content-Type"],
}));

app.get("/", (req, res) => {
  res.send("hello");
});

app.get("/hell", (req, res) => {
  res.send("this is HELL");
});

//Routes
app.use("/api/v1/healthcheck",healthcheckRoutes)
app.use("/api/v1/auth",authRouter)

export default app;
