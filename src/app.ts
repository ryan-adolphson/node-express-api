import express from "express";
import { productRouter } from "./routes/products";
import { orderRouter } from "./routes/order";

const app = express();

app.use(express.json());

app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
});

app.use("/products", productRouter);
app.use("/orders", orderRouter);

export default app;
