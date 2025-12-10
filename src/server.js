import dotenv from "dotenv";
import express from "express";
import cookieParser from "cookie-parser";
import route from "./routes/index.js";
import cors from "cors";
import { authMiddleware } from "./middlewares/authMiddleware.js";
import { startExpireOrders } from "./jobs/expireOrders.js";
import { closeEvent } from "./jobs/closeEvents.js";
dotenv.config();

// JOBs
startExpireOrders();
closeEvent();

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = 3000;

app.use("/api", authMiddleware, route);

app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
