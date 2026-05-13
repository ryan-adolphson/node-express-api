import "dotenv/config";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const pool = new pg.Pool({ connectionString: process.env.DIRECT_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const products = [
    {
        name: "Wireless Noise-Cancelling Headphones",
        price: 299.99,
        description:
            "Premium over-ear headphones with 30-hour battery life and active noise cancellation.",
        stock: 45,
        category: "Electronics",
        imageUrl: "https://placehold.co/400x400?text=Headphones",
    },
    {
        name: "Mechanical Keyboard",
        price: 129.99,
        description:
            "Compact TKL mechanical keyboard with Cherry MX Brown switches and RGB backlighting.",
        stock: 80,
        category: "Electronics",
        imageUrl: "https://placehold.co/400x400?text=Keyboard",
    },
    {
        name: "Ergonomic Office Chair",
        price: 449.0,
        description:
            "Fully adjustable mesh chair with lumbar support, armrests, and a 5-year warranty.",
        stock: 20,
        category: "Furniture",
        imageUrl: "https://placehold.co/400x400?text=Chair",
    },
    {
        name: "Stainless Steel Water Bottle",
        price: 34.95,
        description:
            "Double-wall insulated 32oz bottle — keeps drinks cold for 24 hours, hot for 12.",
        stock: 200,
        category: "Outdoors",
        imageUrl: "https://placehold.co/400x400?text=Bottle",
    },
    {
        name: "Yoga Mat",
        price: 59.99,
        description:
            "Non-slip 6mm thick mat with carrying strap. Suitable for all levels.",
        stock: 120,
        category: "Fitness",
        imageUrl: "https://placehold.co/400x400?text=Yoga+Mat",
    },
    {
        name: "USB-C Docking Station",
        price: 89.99,
        description:
            "7-in-1 hub with 4K HDMI, 100W PD, 3x USB-A, SD card reader, and Gigabit Ethernet.",
        stock: 60,
        category: "Electronics",
        imageUrl: "https://placehold.co/400x400?text=Dock",
    },
    {
        name: "Ceramic Pour-Over Coffee Set",
        price: 48.0,
        description:
            "Handcrafted dripper and carafe set for a clean, precise brew. Dishwasher safe.",
        stock: 35,
        category: "Kitchen",
        imageUrl: "https://placehold.co/400x400?text=Coffee+Set",
    },
    {
        name: "Hardcover Notebook A5",
        price: 14.99,
        description:
            "200-page dot-grid notebook with lay-flat binding and ribbon bookmark.",
        stock: 300,
        category: "Stationery",
        imageUrl: "https://placehold.co/400x400?text=Notebook",
    },
];

async function main() {
    console.log("Seeding database...");

    await prisma.product.deleteMany();

    const created = await prisma.product.createMany({ data: products });

    console.log(`Seeded ${created.count} products.`);
}

main()
    .catch((err) => {
        console.error(err);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
