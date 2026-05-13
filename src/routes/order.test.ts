import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../app";

vi.mock("../lib/prisma", () => ({
    prisma: {
        order: {
            findMany: vi.fn(),
            findUnique: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        },
    },
}));

import { prisma } from "../lib/prisma";

const API_KEY = "test-api-key";

beforeEach(() => {
    vi.clearAllMocks();
    process.env.API_KEY = API_KEY;
});

const mockOrder = {
    id: "order-123",
    quantity: 2,
    totalPrice: 19.98,
    status: "pending",
    notes: "Leave at door",
    productId: "product-123",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
};

describe("Auth middleware", () => {
    it("rejects requests with no API key", async () => {
        const res = await request(app).get("/orders");
        expect(res.status).toBe(401);
        expect(res.body.error).toBe("Unauthorized");
    });

    it("rejects requests with wrong API key", async () => {
        const res = await request(app)
            .get("/orders")
            .set("x-api-key", "wrong-key");
        expect(res.status).toBe(401);
    });
});

describe("GET /orders", () => {
    it("returns all orders", async () => {
        vi.mocked(prisma.order.findMany).mockResolvedValue([mockOrder] as any);

        const res = await request(app)
            .get("/orders")
            .set("x-api-key", API_KEY);

        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(1);
        expect(res.body[0].status).toBe("pending");
    });

    it("returns 500 on database error", async () => {
        vi.mocked(prisma.order.findMany).mockRejectedValue(
            new Error("DB error"),
        );

        const res = await request(app)
            .get("/orders")
            .set("x-api-key", API_KEY);

        expect(res.status).toBe(500);
    });
});

describe("GET /orders/:id", () => {
    it("returns a single order", async () => {
        vi.mocked(prisma.order.findUnique).mockResolvedValue(mockOrder as any);

        const res = await request(app)
            .get("/orders/order-123")
            .set("x-api-key", API_KEY);

        expect(res.status).toBe(200);
        expect(res.body.id).toBe("order-123");
    });

    it("returns 404 when order not found", async () => {
        vi.mocked(prisma.order.findUnique).mockResolvedValue(null);

        const res = await request(app)
            .get("/orders/nonexistent")
            .set("x-api-key", API_KEY);

        expect(res.status).toBe(404);
        expect(res.body.error).toBe("Order not found");
    });

    it("returns 500 on database error", async () => {
        vi.mocked(prisma.order.findUnique).mockRejectedValue(
            new Error("DB error"),
        );

        const res = await request(app)
            .get("/orders/order-123")
            .set("x-api-key", API_KEY);

        expect(res.status).toBe(500);
    });
});

describe("POST /orders", () => {
    it("creates an order with valid data", async () => {
        vi.mocked(prisma.order.create).mockResolvedValue(mockOrder as any);

        const res = await request(app)
            .post("/orders")
            .set("x-api-key", API_KEY)
            .send({
                quantity: 2,
                totalPrice: 19.98,
                status: "pending",
                notes: "Leave at door",
                productId: "product-123",
            });

        expect(res.status).toBe(201);
        expect(res.body.status).toBe("pending");
    });

    it("returns 400 when quantity is missing", async () => {
        const res = await request(app)
            .post("/orders")
            .set("x-api-key", API_KEY)
            .send({ totalPrice: 19.98, status: "pending", productId: "p-1" });

        expect(res.status).toBe(400);
    });

    it("returns 400 when status is missing", async () => {
        const res = await request(app)
            .post("/orders")
            .set("x-api-key", API_KEY)
            .send({ quantity: 1, totalPrice: 9.99, productId: "p-1" });

        expect(res.status).toBe(400);
    });

    it("returns 500 on database error", async () => {
        vi.mocked(prisma.order.create).mockRejectedValue(new Error("DB error"));

        const res = await request(app)
            .post("/orders")
            .set("x-api-key", API_KEY)
            .send({
                quantity: 1,
                totalPrice: 9.99,
                status: "pending",
                productId: "p-1",
            });

        expect(res.status).toBe(500);
    });
});

describe("PUT /orders/:id", () => {
    it("updates an order with valid data", async () => {
        const updated = { ...mockOrder, status: "shipped" };
        vi.mocked(prisma.order.findUnique).mockResolvedValue(mockOrder as any);
        vi.mocked(prisma.order.update).mockResolvedValue(updated as any);

        const res = await request(app)
            .put("/orders/order-123")
            .set("x-api-key", API_KEY)
            .send({ status: "shipped" });

        expect(res.status).toBe(200);
        expect(res.body.status).toBe("shipped");
    });

    it("returns 404 when order not found", async () => {
        vi.mocked(prisma.order.findUnique).mockResolvedValue(null);

        const res = await request(app)
            .put("/orders/nonexistent")
            .set("x-api-key", API_KEY)
            .send({ status: "shipped" });

        expect(res.status).toBe(404);
        expect(res.body.error).toBe("Order not found");
    });

    it("returns 400 when body is invalid", async () => {
        const res = await request(app)
            .put("/orders/order-123")
            .set("x-api-key", API_KEY)
            .send({ quantity: "not-a-number" });

        expect(res.status).toBe(400);
    });

    it("returns 500 on database error", async () => {
        vi.mocked(prisma.order.findUnique).mockResolvedValue(mockOrder as any);
        vi.mocked(prisma.order.update).mockRejectedValue(new Error("DB error"));

        const res = await request(app)
            .put("/orders/order-123")
            .set("x-api-key", API_KEY)
            .send({ status: "shipped" });

        expect(res.status).toBe(500);
    });
});

describe("DELETE /orders/:id", () => {
    it("deletes an existing order", async () => {
        vi.mocked(prisma.order.findUnique).mockResolvedValue(mockOrder as any);
        vi.mocked(prisma.order.delete).mockResolvedValue(mockOrder as any);

        const res = await request(app)
            .delete("/orders/order-123")
            .set("x-api-key", API_KEY);

        expect(res.status).toBe(204);
    });

    it("returns 404 when order does not exist", async () => {
        vi.mocked(prisma.order.findUnique).mockResolvedValue(null);

        const res = await request(app)
            .delete("/orders/nonexistent")
            .set("x-api-key", API_KEY);

        expect(res.status).toBe(404);
        expect(res.body.error).toBe("Order not found");
    });

    it("returns 500 on database error", async () => {
        vi.mocked(prisma.order.findUnique).mockResolvedValue(mockOrder as any);
        vi.mocked(prisma.order.delete).mockRejectedValue(new Error("DB error"));

        const res = await request(app)
            .delete("/orders/order-123")
            .set("x-api-key", API_KEY);

        expect(res.status).toBe(500);
    });
});
