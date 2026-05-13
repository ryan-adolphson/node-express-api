import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireApiKey } from "../middleware/auth";

export const productRouter = Router();

productRouter.use(requireApiKey);

const createProductSchema = z.object({
    name: z.string().min(1),
    price: z.number().positive(),
    description: z.string().optional(),
    stock: z.number().int().min(0).optional(),
    category: z.string().optional(),
    imageUrl: z.string().url().optional(),
});

// GET /products
productRouter.get("/", async (_req, res) => {
    try {
        const products = await prisma.product.findMany({
            orderBy: { createdAt: "desc" },
        });
        res.json(products);
    } catch {
        res.status(500).json({ error: "Failed to fetch products" });
    }
});

// GET /products/:id
productRouter.get("/:id", async (req, res) => {
    try {
        const product = await prisma.product.findUnique({
            where: { id: req.params.id },
        });

        if (!product) {
            res.status(404).json({ error: "Product not found" });
            return;
        }

        res.json(product);
    } catch {
        res.status(500).json({ error: "Failed to fetch product" });
    }
});

// POST /products
productRouter.post("/", async (req, res) => {
    const parsed = createProductSchema.safeParse(req.body);

    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten() });
        return;
    }

    try {
        const product = await prisma.product.create({ data: parsed.data });
        res.status(201).json(product);
    } catch {
        res.status(500).json({ error: "Failed to create product" });
    }
});

// DELETE /products/:id
productRouter.delete("/:id", async (req, res) => {
    try {
        const product = await prisma.product.findUnique({
            where: { id: req.params.id },
        });

        if (!product) {
            res.status(404).json({ error: "Product not found" });
            return;
        }

        await prisma.product.delete({ where: { id: req.params.id } });
        res.status(204).send();
    } catch {
        res.status(500).json({ error: "Failed to delete product" });
    }
});
