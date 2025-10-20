import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from './route';
import { NextRequest } from 'next/server';

// Create a flexible mock for the Supabase client
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

// Mock the entire module that creates the client
vi.mock('@/lib/supabase/server', () => ({
  createClient: () => mockSupabase,
}));

vi.mock('next/headers', () => ({
  cookies: () => ({
    get: vi.fn(),
    set: vi.fn(),
  }),
}));

describe('API /api/users', () => {
  beforeEach(() => {
    // Reset mocks before each test
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

    it('should return 200 with users if user is an admin', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'admin-id' } } },
        error: null,
      });

      const mockUsers = [{ id: '1', name: 'Test User' }];
      
      const singleMock = vi.fn().mockResolvedValue({ data: { role: 'admin' }, error: null });
      const eqMock = vi.fn(() => ({ single: singleMock }));

      const selectMock = vi.fn((columns) => {
        // For the role check call: supabase.from('users').select('role').eq(...)
        if (columns === 'role') {
          return { eq: eqMock };
        }
        // For the get all users call: await supabase.from('users').select(...)
        return Promise.resolve({ data: mockUsers, error: null });
      });

      mockSupabase.from.mockReturnValue({ select: selectMock });
      
      const response = await GET();
      const body = await response.json();
      expect(response.status).toBe(200);
      expect(body).toEqual(mockUsers);
    });
  });

  describe('POST', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
      const request = new NextRequest('http://localhost/api/users', { method: 'POST', body: JSON.stringify({}) });
      const response = await POST(request);
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
      
      const request = new NextRequest('http://localhost/api/users', { method: 'POST', body: JSON.stringify({}) });
      const response = await POST(request);
      expect(response.status).toBe(403);
    });

    it('should create a user and return 200 if user is an admin', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'admin-id' } } },
        error: null,
      });
      
      const singleMock = vi.fn().mockResolvedValue({ data: { role: 'admin' }, error: null });
      const eqMock = vi.fn(() => ({ single: singleMock }));
      const insertMock = vi.fn().mockResolvedValue({ error: null });
      mockSupabase.from.mockReturnValue({
        select: () => ({ eq: eqMock }),
        insert: insertMock,
      });

      mockSupabase.auth.admin.createUser.mockResolvedValue({
        data: { user: { id: 'new-user-id' } },
        error: null,
      });

      const newUser = { email: 'test@example.com', password: 'password', full_name: 'Test User', role: 'user' };
      const request = new NextRequest('http://localhost/api/users', { method: 'POST', body: JSON.stringify(newUser) });
      const response = await POST(request);
      
      expect(response.status).toBe(200);
    });
  });
});
