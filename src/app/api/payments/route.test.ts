import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from './route';
import { NextRequest } from 'next/server';

const mockSupabase = {
  auth: {
    getSession: vi.fn(),
  },
  from: vi.fn(),
};

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => mockSupabase,
}));

vi.mock('next/headers', () => ({
  cookies: () => ({
    get: vi.fn(),
    set: vi.fn(),
  }),
}));

describe('API /api/payments', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  const mockSession = (role: string) => ({
    data: { session: { user: { id: `${role}-id` } } },
    error: null,
  });

  describe('GET', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
      const request = new NextRequest('http://localhost/api/payments');
      const response = await GET(request);
      expect(response.status).toBe(401);
    });

    it('should return all payments for an admin user', async () => {
      mockSupabase.auth.getSession.mockResolvedValue(mockSession('admin'));
      const singleUserMock = vi.fn().mockResolvedValue({ data: { id: 'admin-id', role: 'admin' }, error: null });
      const eqUserMock = vi.fn(() => ({ single: singleUserMock }));
      const orderMock = vi.fn().mockResolvedValue({ data: [{ id: 'payment-1' }], error: null });
      mockSupabase.from.mockImplementation((tableName) => {
        if (tableName === 'users') return { select: () => ({ eq: eqUserMock }) };
        if (tableName === 'payments') return { select: () => ({ order: orderMock }) };
      });

      const request = new NextRequest('http://localhost/api/payments');
      const response = await GET(request);
      const body = await response.json();
      expect(response.status).toBe(200);
      expect(body.payments).toHaveLength(1);
    });

    it('should return only client-specific payments for a client user', async () => {
        mockSupabase.auth.getSession.mockResolvedValue(mockSession('client'));
        const singleUserMock = vi.fn().mockResolvedValue({ data: { id: 'client-user-id', role: 'client' }, error: null });
        const eqUserMock = vi.fn(() => ({ single: singleUserMock }));
        const singleClientMock = vi.fn().mockResolvedValue({ data: { id: 'client-profile-id' }, error: null });
        const eqClientMock = vi.fn(() => ({ single: singleClientMock }));
        const orderMock = vi.fn().mockResolvedValue({ data: [{ id: 'client-payment-1' }], error: null });
        const eqPaymentMock = vi.fn(() => ({ order: orderMock }));

        mockSupabase.from.mockImplementation((tableName) => {
            if (tableName === 'users') return { select: () => ({ eq: eqUserMock }) };
            if (tableName === 'clients') return { select: () => ({ eq: eqClientMock }) };
            if (tableName === 'payments') return { select: () => ({ eq: eqPaymentMock }) };
        });

        const request = new NextRequest('http://localhost/api/payments');
        const response = await GET(request);
        expect(response.status).toBe(200);
    });
  });

  describe('POST', () => {
    it('should return 403 if a non-admin user tries to create a payment', async () => {
        mockSupabase.auth.getSession.mockResolvedValue(mockSession('client'));
        const singleUserMock = vi.fn().mockResolvedValue({ data: { id: 'client-user-id', role: 'client' }, error: null });
        const eqUserMock = vi.fn(() => ({ single: singleUserMock }));
        mockSupabase.from.mockReturnValue({ select: () => ({ eq: eqUserMock }) });

        const request = new NextRequest('http://localhost/api/payments', { method: 'POST', body: JSON.stringify({}) });
        const response = await POST(request);
        expect(response.status).toBe(403);
    });

    it('should allow an admin to create a payment and return 201', async () => {
        mockSupabase.auth.getSession.mockResolvedValue(mockSession('admin'));
        const singleUserMock = vi.fn().mockResolvedValue({ data: { id: 'admin-id', role: 'admin' }, error: null });
        const eqUserMock = vi.fn(() => ({ single: singleUserMock }));
        const singleMissionMock = vi.fn().mockResolvedValue({ data: { client_id: 'client-1' }, error: null });
        const eqMissionMock = vi.fn(() => ({ single: singleMissionMock }));
        const singlePaymentMock = vi.fn().mockResolvedValue({ data: { id: 'new-payment' }, error: null });
        const selectPaymentMock = vi.fn(() => ({ single: singlePaymentMock }));

        mockSupabase.from.mockImplementation((tableName) => {
            if (tableName === 'users') return { select: () => ({ eq: eqUserMock }) };
            if (tableName === 'missions') return { select: () => ({ eq: eqMissionMock }) };
            if (tableName === 'payments') return { insert: () => ({ select: selectPaymentMock }) };
        });

        const paymentData = { mission_id: 'mission-1', amount: 100, payment_method: 'card' };
        const request = new NextRequest('http://localhost/api/payments', { method: 'POST', body: JSON.stringify(paymentData) });
        const response = await POST(request);
        expect(response.status).toBe(201);
    });
  });
});
