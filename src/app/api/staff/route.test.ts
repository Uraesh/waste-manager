import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from './route';
import { NextRequest } from 'next/server';

const mockSupabase = {
  auth: {
    getSession: vi.fn(),
    admin: {
      createUser: vi.fn(),
      deleteUser: vi.fn(),
    },
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

describe('API /api/staff', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('GET', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
      const response = await GET();
      expect(response.status).toBe(401);
    });

    it('should return 403 if user is not an admin', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'user-id' } } },
        error: null,
      });
      const singleMock = vi.fn().mockResolvedValue({ data: { role: 'user' }, error: null });
      const eqMock = vi.fn(() => ({ single: singleMock }));
      mockSupabase.from.mockReturnValue({ select: () => ({ eq: eqMock }) });

      const response = await GET();
      expect(response.status).toBe(403);
    });

    it('should return 200 with staff profiles if user is an admin', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'admin-id' } } },
        error: null,
      });

      const singleMock = vi.fn().mockResolvedValue({ data: { role: 'admin' }, error: null });
      const eqMock = vi.fn(() => ({ single: singleMock }));
      
      const mockStaff = [{ id: 'staff-1', name: 'Staff Member' }];
      const selectMock = vi.fn((columns) => {
        if (columns === 'role') {
            return { eq: eqMock };
        }
        return Promise.resolve({ data: mockStaff, error: null });
      });

      mockSupabase.from.mockImplementation((tableName) => {
        if (tableName === 'users') {
          return { select: () => ({ eq: eqMock }) };
        }
        if (tableName === 'staff_profiles') {
          return { select: () => Promise.resolve({ data: mockStaff, error: null }) };
        }
      });
      
      const response = await GET();
      const body = await response.json();
      expect(response.status).toBe(200);
      expect(body).toEqual(mockStaff);
    });
  });

  describe('POST', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
      const request = new NextRequest('http://localhost/api/staff', { method: 'POST', body: JSON.stringify({}) });
      const response = await POST(request);
      expect(response.status).toBe(401);
    });

    it('should return 403 if user is not an admin', async () => {
        mockSupabase.auth.getSession.mockResolvedValue({ data: { session: { user: { id: 'user-id' } } }, error: null });
        const singleMock = vi.fn().mockResolvedValue({ data: { role: 'user' }, error: null });
        const eqMock = vi.fn(() => ({ single: singleMock }));
        mockSupabase.from.mockReturnValue({ select: () => ({ eq: eqMock }) });

        const request = new NextRequest('http://localhost/api/staff', { method: 'POST', body: JSON.stringify({}) });
        const response = await POST(request);
        expect(response.status).toBe(403);
    });

    it('should create a staff profile and return 201 if user is an admin', async () => {
        mockSupabase.auth.getSession.mockResolvedValue({ data: { session: { user: { id: 'admin-id' } } }, error: null });
        const singleMock = vi.fn().mockResolvedValue({ data: { role: 'admin' }, error: null });
        const eqMock = vi.fn(() => ({ single: singleMock }));
        const insertMock = vi.fn(() => ({
            select: () => ({
                single: () => Promise.resolve({ data: { id: 'new-staff-id' }, error: null })
            })
        }));

        mockSupabase.from.mockImplementation((tableName) => {
            if (tableName === 'users') {
                return { select: () => ({ eq: eqMock }), insert: () => Promise.resolve({ error: null }) };
            }
            if (tableName === 'staff_profiles') {
                return { insert: insertMock };
            }
        });
        
        mockSupabase.auth.admin.createUser.mockResolvedValue({ data: { user: { id: 'new-user-id' } }, error: null });
        
        const newStaff = { email: 'staff@example.com', password: 'password', first_name: 'New', last_name: 'Staff', position: 'Driver' };
        const request = new NextRequest('http://localhost/api/staff', { method: 'POST', body: JSON.stringify(newStaff) });
        const response = await POST(request);
        
        expect(response.status).toBe(201);
    });
  });
});
