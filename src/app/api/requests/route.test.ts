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

describe('API /api/requests', () => {
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
      const response = await GET();
      expect(response.status).toBe(401);
    });

    it('should return all requests for an admin', async () => {
        mockSupabase.auth.getSession.mockResolvedValue(mockSession('admin'));
        const singleUserMock = vi.fn().mockResolvedValue({ data: { role: 'admin' }, error: null });
        const eqUserMock = vi.fn(() => ({ single: singleUserMock }));
        const selectRequestsMock = vi.fn().mockResolvedValue({ data: [{id: 'req-1'}], error: null });

        mockSupabase.from.mockImplementation((tableName) => {
            if (tableName === 'users') return { select: () => ({ eq: eqUserMock }) };
            if (tableName === 'missions') return { select: selectRequestsMock };
        });

        const response = await GET();
        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body).toHaveLength(1);
    });
  });

  describe('POST', () => {
    it('should return 403 if a staff member tries to create a request', async () => {
      mockSupabase.auth.getSession.mockResolvedValue(mockSession('staff'));
      const singleUserMock = vi.fn().mockResolvedValue({ data: { role: 'staff' }, error: null });
      const eqUserMock = vi.fn(() => ({ single: singleUserMock }));
      mockSupabase.from.mockReturnValue({ select: () => ({ eq: eqUserMock }) });

      const request = new NextRequest('http://localhost/api/requests', { method: 'POST', body: JSON.stringify({}) });
      const response = await POST(request);
      expect(response.status).toBe(403);
    });

    it('should allow a client to create a request for themselves', async () => {
        mockSupabase.auth.getSession.mockResolvedValue(mockSession('client'));
        const singleUserMock = vi.fn().mockResolvedValue({ data: { role: 'client' }, error: null });
        const eqUserMock = vi.fn(() => ({ single: singleUserMock }));
        const singleClientMock = vi.fn().mockResolvedValue({ data: { id: 'client-profile-id' }, error: null });
        const eqClientMock = vi.fn(() => ({ single: singleClientMock }));
        const singleInsertMock = vi.fn().mockResolvedValue({ data: {id: 'new-req-1'}, error: null });
        const selectInsertMock = vi.fn(() => ({ single: singleInsertMock }));

        mockSupabase.from.mockImplementation((tableName) => {
            if (tableName === 'users') return { select: () => ({ eq: eqUserMock }) };
            if (tableName === 'clients') return { select: () => ({ eq: eqClientMock }) };
            if (tableName === 'missions') return { insert: () => ({ select: selectInsertMock }) };
        });
        const requestBody = { title: 'Test', location: 'Here', service_type: 'ramassage', description: 'test' };
        const request = new NextRequest('http://localhost/api/requests', { method: 'POST', body: JSON.stringify(requestBody) });
        const response = await POST(request);
        expect(response.status).toBe(201);
    });
  });
});
