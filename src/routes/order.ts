import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireApiKey } from "../middleware/auth";

export const orderRouter = Router();

orderRouter.use(requireApiKey);

const createOrderSchema = z.object({
    quantity: z.number().int(),
    totalPrice: z.number(),
    status: z.string().min(1),
    notes: z.string().optional(),
    productId: z.string(),
});

const updateOrderSchema = createOrderSchema.partial();

// GET /orders
orderRouter.get("/", async (_req, res) => {
    try {
        const orders = await prisma.order.findMany({
            orderBy: { createdAt: "desc" },
        });
        res.json(orders);
    } catch {
        res.status(500).json({ error: "Failed to fetch orders" });
    }
});

// GET /orders/:id
orderRouter.get("/:id", async (req, res) => {
    try {
        const order = await prisma.order.findUnique({
            where: { id: req.params.id },
        });

        if (!order) {
            res.status(404).json({ error: "Order not found" });
            return;
        }

        res.json(order);
    } catch {
        res.status(500).json({ error: "Failed to fetch order" });
    }
});

// POST /orders
orderRouter.post("/", async (req, res) => {
    const parsed = createOrderSchema.safeParse(req.body);

    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten() });
        return;
    }

    try {
        const order = await prisma.order.create({ data: parsed.data });
        res.status(201).json(order);
    } catch {
        res.status(500).json({ error: "Failed to create order" });
    }
});

// PUT /orders/:id
orderRouter.put("/:id", async (req, res) => {
    const parsed = updateOrderSchema.safeParse(req.body);

    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten() });
        return;
    }

    try {
        const existing = await prisma.order.findUnique({
            where: { id: req.params.id },
        });

        if (!existing) {
            res.status(404).json({ error: "Order not found" });
            return;
        }

        const updated = await prisma.order.update({
            where: { id: req.params.id },
            data: parsed.data,
        });
        res.json(updated);
    } catch {
        res.status(500).json({ error: "Failed to update order" });
    }
});

// DELETE /orders/:id
orderRouter.delete("/:id", async (req, res) => {
    try {
        const existing = await prisma.order.findUnique({
            where: { id: req.params.id },
        });

        if (!existing) {
            res.status(404).json({ error: "Order not found" });
            return;
        }

        await prisma.order.delete({ where: { id: req.params.id } });
        res.status(204).send();
    } catch {
        res.status(500).json({ error: "Failed to delete order" });
    }
});
