# Skill: add-resource

Add a fully wired resource to the API — Prisma model, Express CRUD routes, and Vitest tests — following the patterns established by `src/routes/products.ts`.

---

## Step 1 — Gather requirements

Ask the user for the following. Collect everything before proceeding.

**1. Resource name**
Singular PascalCase (e.g. `Order`, `Customer`, `Invoice`). Used for the Prisma model name, router export, and file names. Derive the plural (e.g. `orders`) for the route mount path and `@@map`.

**2. Fields**
For each field, collect:
- Field name (camelCase)
- Prisma scalar type: `String`, `Int`, `Float`, `Boolean`, or `DateTime`
- Optional? (`true` → append `?` to type; `false` → required)

Do NOT ask for `id`, `createdAt`, or `updatedAt` — these are always added automatically.

**3. Relations (optional)**
For each relation to an existing model:
- Field name (e.g. `category`)
- Related model name (must already exist in `prisma/schema.prisma`)
- This always generates a many-to-one (foreign key) relation

**4. Auth required?**
Yes or No. If yes, apply `requireApiKey` middleware at the router level, protecting all five endpoints.

**5. Schema sync method**
Ask whether to:
- **Migrate** — creates a versioned migration file (`prisma migrate dev`)
- **Push** — applies changes directly without a migration file (`prisma db push`), ideal for local prototyping

---

## Step 2 — Update `prisma/schema.prisma`

Append a new model block to the bottom of the file. Follow this exact structure:

```prisma
model {Name} {
    id        String   @id @default(cuid())
    // scalar fields here (required fields first, then optional)
    // relation fields here
    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt

    @@map("{pluralName}")
}
```

**Scalar field format:**
- Required: `fieldName  FieldType`
- Optional:  `fieldName  FieldType?`

**Many-to-one relation format** (for each relation the user specified):
```prisma
    {relatedModel}    {RelatedModel}  @relation(fields: [{relatedModel}Id], references: [id])
    {relatedModel}Id  String
```

Also open the related model in `prisma/schema.prisma` and add the back-relation array field inside it:
```prisma
    {pluralName}  {Name}[]
```

---

## Step 3 — Apply schema to database

Run whichever command the user chose in Step 1:

**Migrate (versioned):**
```bash
npx prisma migrate dev --name add-{lowercaseName}
```

**Push (prototyping):**
```bash
npx prisma db push
```

After either command, regenerate the Prisma client so TypeScript knows about the new model:
```bash
npm run db:generate
```

---

## Step 4 — Create `src/routes/{name}.ts`

Create the file following the exact pattern in `src/routes/products.ts`. Use this structure:

```typescript
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
// Only include this import if auth is required:
import { requireApiKey } from "../middleware/auth";

export const {name}Router = Router();

// Only include this line if auth is required:
{name}Router.use(requireApiKey);

const create{Name}Schema = z.object({
    // Required fields: fieldName: z.string().min(1) / z.number() / z.boolean() / z.coerce.date()
    // Optional fields: fieldName: z.string().optional() etc.
    // Relation fields: {relatedModel}Id: z.string()
});

const update{Name}Schema = create{Name}Schema.partial();

// GET /{pluralName}
{name}Router.get("/", async (_req, res) => {
    try {
        const {pluralName} = await prisma.{name}.findMany({
            orderBy: { createdAt: "desc" },
        });
        res.json({pluralName});
    } catch {
        res.status(500).json({ error: "Failed to fetch {pluralName}" });
    }
});

// GET /{pluralName}/:id
{name}Router.get("/:id", async (req, res) => {
    try {
        const {name} = await prisma.{name}.findUnique({
            where: { id: req.params.id },
        });

        if (!{name}) {
            res.status(404).json({ error: "{Name} not found" });
            return;
        }

        res.json({name});
    } catch {
        res.status(500).json({ error: "Failed to fetch {name}" });
    }
});

// POST /{pluralName}
{name}Router.post("/", async (req, res) => {
    const parsed = create{Name}Schema.safeParse(req.body);

    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten() });
        return;
    }

    try {
        const {name} = await prisma.{name}.create({ data: parsed.data });
        res.status(201).json({name});
    } catch {
        res.status(500).json({ error: "Failed to create {name}" });
    }
});

// PUT /{pluralName}/:id
{name}Router.put("/:id", async (req, res) => {
    const parsed = update{Name}Schema.safeParse(req.body);

    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten() });
        return;
    }

    try {
        const existing = await prisma.{name}.findUnique({
            where: { id: req.params.id },
        });

        if (!existing) {
            res.status(404).json({ error: "{Name} not found" });
            return;
        }

        const updated = await prisma.{name}.update({
            where: { id: req.params.id },
            data: parsed.data,
        });
        res.json(updated);
    } catch {
        res.status(500).json({ error: "Failed to update {name}" });
    }
});

// DELETE /{pluralName}/:id
{name}Router.delete("/:id", async (req, res) => {
    try {
        const existing = await prisma.{name}.findUnique({
            where: { id: req.params.id },
        });

        if (!existing) {
            res.status(404).json({ error: "{Name} not found" });
            return;
        }

        await prisma.{name}.delete({ where: { id: req.params.id } });
        res.status(204).send();
    } catch {
        res.status(500).json({ error: "Failed to delete {name}" });
    }
});
```

**Zod type mapping:**
| Prisma type | Zod validator (required) | Zod validator (optional) |
|-------------|--------------------------|--------------------------|
| `String`    | `z.string().min(1)`      | `z.string().optional()`  |
| `Int`       | `z.number().int()`       | `z.number().int().optional()` |
| `Float`     | `z.number()`             | `z.number().optional()`  |
| `Boolean`   | `z.boolean()`            | `z.boolean().optional()` |
| `DateTime`  | `z.coerce.date()`        | `z.coerce.date().optional()` |

For `update{Name}Schema`, always use `.partial()` on the create schema so all fields become optional.

---

## Step 5 — Register router in `src/app.ts`

Add the import and mount:

```typescript
import { {name}Router } from "./routes/{name}";
// ...
app.use("/{pluralName}", {name}Router);
```

Insert the import alongside the existing route imports and the `app.use` line alongside the existing mounts.

---

## Step 6 — Create `src/routes/{name}.test.ts`

Follow the exact pattern in `src/routes/products.test.ts`. Build the file as follows:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../app";

vi.mock("../lib/prisma", () => ({
    prisma: {
        {name}: {
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

const mock{Name} = {
    id: "test-id-123",
    // include all scalar fields with realistic values
    // include {relatedModel}Id if relations exist
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
};
```

**Auth middleware block** (only if auth is required):
```typescript
describe("Auth middleware", () => {
    it("rejects requests with no API key", async () => {
        const res = await request(app).get("/{pluralName}");
        expect(res.status).toBe(401);
        expect(res.body.error).toBe("Unauthorized");
    });

    it("rejects requests with wrong API key", async () => {
        const res = await request(app)
            .get("/{pluralName}")
            .set("x-api-key", "wrong-key");
        expect(res.status).toBe(401);
    });
});
```

**Per-endpoint test blocks** — include one `describe` per endpoint. For each, write:

- `GET /{pluralName}`: returns array (200), DB error (500)
- `GET /{pluralName}/:id`: returns single record (200), not found (404), DB error (500)
- `POST /{pluralName}`: creates with valid data (201), missing required field (400), DB error (500)
- `PUT /{pluralName}/:id`: updates with valid data (200), not found (404), invalid body (400), DB error (500)
- `DELETE /{pluralName}/:id`: deletes existing (204), not found (404), DB error (500)

When auth is required, set `.set("x-api-key", API_KEY)` on every request. When not required, omit it.

Use `vi.mocked(prisma.{name}.findMany).mockResolvedValue(...)` and `mockRejectedValue(new Error("DB error"))` following the products test patterns exactly.

---

## Step 7 — Run tests

```bash
npm test
```

All new tests must pass and existing tests must remain green. If any test fails, diagnose and fix before reporting done. Do not skip or comment out failing tests.
