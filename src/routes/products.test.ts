import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app';

vi.mock('../lib/prisma', () => ({
  prisma: {
    product: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import { prisma } from '../lib/prisma';

const API_KEY = 'test-api-key';

beforeEach(() => {
  vi.clearAllMocks();
  process.env.API_KEY = API_KEY;
});

const mockProduct = {
  id: 'clx123',
  name: 'Test Widget',
  price: 9.99,
  description: 'A test product',
  stock: 10,
  category: 'widgets',
  imageUrl: 'https://example.com/widget.png',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('Auth middleware', () => {
  it('rejects requests with no API key', async () => {
    const res = await request(app).get('/products');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Unauthorized');
  });

  it('rejects requests with wrong API key', async () => {
    const res = await request(app)
      .get('/products')
      .set('x-api-key', 'wrong-key');
    expect(res.status).toBe(401);
  });
});

describe('GET /products', () => {
  it('returns all products', async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([mockProduct] as any);

    const res = await request(app)
      .get('/products')
      .set('x-api-key', API_KEY);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('Test Widget');
  });

  it('returns 500 on database error', async () => {
    vi.mocked(prisma.product.findMany).mockRejectedValue(new Error('DB error'));

    const res = await request(app)
      .get('/products')
      .set('x-api-key', API_KEY);

    expect(res.status).toBe(500);
  });
});

describe('GET /products/:id', () => {
  it('returns a single product', async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as any);

    const res = await request(app)
      .get('/products/clx123')
      .set('x-api-key', API_KEY);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe('clx123');
  });

  it('returns 404 when product not found', async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue(null);

    const res = await request(app)
      .get('/products/nonexistent')
      .set('x-api-key', API_KEY);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Product not found');
  });
});

describe('POST /products', () => {
  it('creates a product with valid data', async () => {
    vi.mocked(prisma.product.create).mockResolvedValue(mockProduct as any);

    const res = await request(app)
      .post('/products')
      .set('x-api-key', API_KEY)
      .send({
        name: 'Test Widget',
        price: 9.99,
        description: 'A test product',
        stock: 10,
        category: 'widgets',
        imageUrl: 'https://example.com/widget.png',
      });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Test Widget');
  });

  it('returns 400 when name is missing', async () => {
    const res = await request(app)
      .post('/products')
      .set('x-api-key', API_KEY)
      .send({ price: 9.99 });

    expect(res.status).toBe(400);
  });

  it('returns 400 when price is negative', async () => {
    const res = await request(app)
      .post('/products')
      .set('x-api-key', API_KEY)
      .send({ name: 'Bad Product', price: -5 });

    expect(res.status).toBe(400);
  });

  it('returns 400 when imageUrl is not a valid URL', async () => {
    const res = await request(app)
      .post('/products')
      .set('x-api-key', API_KEY)
      .send({ name: 'Product', price: 1.00, imageUrl: 'not-a-url' });

    expect(res.status).toBe(400);
  });
});

describe('DELETE /products/:id', () => {
  it('deletes an existing product', async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as any);
    vi.mocked(prisma.product.delete).mockResolvedValue(mockProduct as any);

    const res = await request(app)
      .delete('/products/clx123')
      .set('x-api-key', API_KEY);

    expect(res.status).toBe(204);
  });

  it('returns 404 when product does not exist', async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue(null);

    const res = await request(app)
      .delete('/products/nonexistent')
      .set('x-api-key', API_KEY);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Product not found');
  });

  it('returns 500 on database error', async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as any);
    vi.mocked(prisma.product.delete).mockRejectedValue(new Error('DB error'));

    const res = await request(app)
      .delete('/products/clx123')
      .set('x-api-key', API_KEY);

    expect(res.status).toBe(500);
  });
});
