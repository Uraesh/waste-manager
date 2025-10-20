import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST, PUT, DELETE } from './route';
import { NextRequest } from 'next/server';

const mockSupabase = {
  auth: {
    getUser: vi.fn(),
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

describe('API /api/missions', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  // Common authenticated user mock
  const authenticatedUser = { data: { user: { id: 'user-id' } }, error: null };
  const unauthenticatedUser = { data: { user: null }, error: null };

  describe('GET', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue(unauthenticatedUser);
      const request = new NextRequest('http://localhost/api/missions');
      const response = await GET(request);
      expect(response.status).toBe(401);
    });

    it('should return 200 with missions if user is authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue(authenticatedUser);
      const mockMissions = [{ id: 'mission-1', title: 'Mission Test' }];
      const orderMock = vi.fn().mockResolvedValue({ data: mockMissions, error: null });
      mockSupabase.from.mockReturnValue({ select: () => ({ order: orderMock }) });
      
      const request = new NextRequest('http://localhost/api/missions');
      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.missions).toEqual(mockMissions);
    });
  });

  describe('POST', () => {
    it('should return 401 if user is not authenticated', async () => {
        mockSupabase.auth.getUser.mockResolvedValue(unauthenticatedUser);
        const request = new NextRequest('http://localhost/api/missions', { method: 'POST', body: JSON.stringify({}) });
        const response = await POST(request);
        expect(response.status).toBe(401);
    });

    it('should create a mission and return 201 if data is valid', async () => {
        mockSupabase.auth.getUser.mockResolvedValue(authenticatedUser);
        const singleMock = vi.fn().mockResolvedValue({ data: { id: 'client-id' }, error: null });
        const eqMock = vi.fn(() => ({ single: singleMock }));

        const newMissionData = { title: 'New Mission', client_id: 'client-id', location: 'Test Location', service_type: 'ramassage' };
        const createdMission = { id: 'new-mission-id', ...newMissionData };
        const selectMock = vi.fn(() => ({ single: () => Promise.resolve({ data: createdMission, error: null }) }));

        mockSupabase.from.mockImplementation((tableName) => {
            if (tableName === 'clients') {
                return { select: () => ({ eq: eqMock }) };
            }
            if (tableName === 'missions') {
                return { insert: () => ({ select: selectMock }) };
            }
        });

        const request = new NextRequest('http://localhost/api/missions', { method: 'POST', body: JSON.stringify(newMissionData) });
        const response = await POST(request);
        expect(response.status).toBe(201);
    });
  });

  describe('PUT', () => {
    it('should return 401 if user is not authenticated', async () => {
        mockSupabase.auth.getUser.mockResolvedValue(unauthenticatedUser);
        const request = new NextRequest('http://localhost/api/missions', { method: 'PUT', body: JSON.stringify({ id: 'mission-1' }) });
        const response = await PUT(request);
        expect(response.status).toBe(401);
    });

    it('should update a mission and return 200 if data is valid', async () => {
        mockSupabase.auth.getUser.mockResolvedValue(authenticatedUser);
        const updatedMission = { id: 'mission-1', title: 'Updated Title' };
        const singleMock = vi.fn().mockResolvedValue({ data: updatedMission, error: null });
        const eqMock = vi.fn(() => ({ select: () => ({ single: singleMock }) }));
        mockSupabase.from.mockReturnValue({ update: () => ({ eq: eqMock }) });

        const request = new NextRequest('http://localhost/api/missions', { method: 'PUT', body: JSON.stringify({ id: 'mission-1', title: 'Updated Title' }) });
        const response = await PUT(request);
        expect(response.status).toBe(200);
    });
  });

  describe('DELETE', () => {
    it('should return 401 if user is not authenticated', async () => {
        mockSupabase.auth.getUser.mockResolvedValue(unauthenticatedUser);
        const request = new NextRequest('http://localhost/api/missions?id=mission-1', { method: 'DELETE' });
        const response = await DELETE(request);
        expect(response.status).toBe(401);
    });

    it('should delete a mission and return 200', async () => {
        mockSupabase.auth.getUser.mockResolvedValue(authenticatedUser);
        const singleFetchMock = vi.fn().mockResolvedValue({ data: { id: 'mission-1', status: 'pending' }, error: null });
        const eqFetchMock = vi.fn(() => ({ single: singleFetchMock }));
        const singleDeleteMock = vi.fn().mockResolvedValue({ data: { id: 'mission-1' }, error: null });
        const eqDeleteMock = vi.fn(() => ({ select: () => ({ single: singleDeleteMock }) }));

        mockSupabase.from.mockImplementation((tableName) => {
            if (tableName === 'missions') {
                return {
                    select: () => ({ eq: eqFetchMock }),
                    delete: () => ({ eq: eqDeleteMock })
                };
            }
        });

        const request = new NextRequest('http://localhost/api/missions?id=mission-1', { method: 'DELETE' });
        const response = await DELETE(request);
        expect(response.status).toBe(200);
    });
  });
});
