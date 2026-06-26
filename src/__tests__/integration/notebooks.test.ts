/**
 * /api/notebooks API 集成测试
 * 测试错题本创建、获取、更新、删除等接口
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Use vi.hoisted to ensure mocks are initialized before module imports
const mocks = vi.hoisted(() => ({
    mockPrismaUser: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
    },
    mockPrismaSubject: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    },
    mockPrismaErrorItem: {
        updateMany: vi.fn(),
    },
    mockSession: {
        user: {
            email: 'user@example.com',
            name: 'Test User',
        },
        expires: '2025-12-31',
    },
}));

// Mock Prisma client
vi.mock('@/lib/prisma', () => ({
    prisma: {
        user: mocks.mockPrismaUser,
        subject: mocks.mockPrismaSubject,
        errorItem: mocks.mockPrismaErrorItem,
    },
}));

// Mock next-auth
vi.mock('next-auth', () => ({
    getServerSession: vi.fn(() => Promise.resolve(mocks.mockSession)),
}));

vi.mock('@/lib/auth', () => ({
    authOptions: {},
}));

// Import after mocks
import { GET, POST } from '@/app/api/notebooks/route';
import { GET as GET_NOTEBOOK, PUT, DELETE } from '@/app/api/notebooks/[id]/route';
import { getServerSession } from 'next-auth';

describe('/api/notebooks', () => {
    const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
        name: 'Test User',
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mocks.mockPrismaUser.findUnique.mockResolvedValue(mockUser);
        mocks.mockPrismaUser.findFirst.mockResolvedValue(mockUser);
        vi.mocked(getServerSession).mockResolvedValue(mocks.mockSession);
    });

    describe('GET /api/notebooks (获取所有错题本)', () => {
        it('应该返回用户的所有错题本', async () => {
            const notebooks = [
                { id: 'nb-1', name: '资料分析', userId: 'user-123', _count: { errorItems: 5 } },
                { id: 'nb-2', name: '逻辑推理', userId: 'user-123', _count: { errorItems: 3 } },
            ];
            mocks.mockPrismaSubject.findMany.mockResolvedValue(notebooks);

            const response = await GET();
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data).toHaveLength(2);
            expect(data[0].name).toBe('资料分析');
            expect(data[0]._count.errorItems).toBe(5);
        });

        it('应该在没有错题本时创建考公/考编默认错题本', async () => {
            // 第一次查询返回空数组，创建后第二次查询返回默认错题本
            mocks.mockPrismaSubject.findMany
                .mockResolvedValueOnce([])
                .mockResolvedValueOnce([
                    { id: 'nb-1', name: '资料分析', userId: 'user-123', _count: { errorItems: 0 } },
                    { id: 'nb-2', name: '逻辑推理', userId: 'user-123', _count: { errorItems: 0 } },
                ]);
            mocks.mockPrismaSubject.create.mockResolvedValue({});

            const response = await GET();
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data).toHaveLength(2);
            // 验证创建了默认错题本
            expect(mocks.mockPrismaSubject.create).toHaveBeenCalledTimes(2);
            expect(mocks.mockPrismaSubject.create).toHaveBeenCalledWith({
                data: { name: '资料分析', userId: 'user-123' },
            });
            expect(mocks.mockPrismaSubject.create).toHaveBeenCalledWith({
                data: { name: '逻辑推理', userId: 'user-123' },
            });
        });

        it('应该将旧默认错题本数学和英语改名为考公/考编默认错题本', async () => {
            mocks.mockPrismaSubject.findMany
                .mockResolvedValueOnce([
                    { id: 'nb-math', name: '数学', userId: 'user-123', _count: { errorItems: 2 } },
                    { id: 'nb-english', name: '英语', userId: 'user-123', _count: { errorItems: 1 } },
                ])
                .mockResolvedValueOnce([
                    { id: 'nb-math', name: '资料分析', userId: 'user-123', _count: { errorItems: 2 } },
                    { id: 'nb-english', name: '逻辑推理', userId: 'user-123', _count: { errorItems: 1 } },
                ]);
            mocks.mockPrismaSubject.update.mockResolvedValue({});

            const response = await GET();
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.map((item: any) => item.name)).toEqual(['资料分析', '逻辑推理']);
            expect(mocks.mockPrismaSubject.update).toHaveBeenCalledWith({
                where: { id: 'nb-math' },
                data: { name: '资料分析' },
            });
            expect(mocks.mockPrismaSubject.update).toHaveBeenCalledWith({
                where: { id: 'nb-english' },
                data: { name: '逻辑推理' },
            });
        });

        it('目标错题本已存在时应迁移旧错题并删除旧默认本', async () => {
            mocks.mockPrismaSubject.findMany
                .mockResolvedValueOnce([
                    { id: 'nb-math', name: '数学', userId: 'user-123', _count: { errorItems: 2 } },
                    { id: 'nb-data', name: '资料分析', userId: 'user-123', _count: { errorItems: 3 } },
                    { id: 'nb-english', name: '英语', userId: 'user-123', _count: { errorItems: 1 } },
                    { id: 'nb-logic', name: '逻辑推理', userId: 'user-123', _count: { errorItems: 4 } },
                ])
                .mockResolvedValueOnce([
                    { id: 'nb-data', name: '资料分析', userId: 'user-123', _count: { errorItems: 5 } },
                    { id: 'nb-logic', name: '逻辑推理', userId: 'user-123', _count: { errorItems: 5 } },
                ]);
            mocks.mockPrismaErrorItem.updateMany.mockResolvedValue({ count: 3 });
            mocks.mockPrismaSubject.delete.mockResolvedValue({});

            const response = await GET();
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.map((item: any) => item.name)).toEqual(['资料分析', '逻辑推理']);
            expect(mocks.mockPrismaErrorItem.updateMany).toHaveBeenCalledWith({
                where: { subjectId: 'nb-math', userId: 'user-123' },
                data: { subjectId: 'nb-data' },
            });
            expect(mocks.mockPrismaErrorItem.updateMany).toHaveBeenCalledWith({
                where: { subjectId: 'nb-english', userId: 'user-123' },
                data: { subjectId: 'nb-logic' },
            });
            expect(mocks.mockPrismaSubject.delete).toHaveBeenCalledWith({ where: { id: 'nb-math' } });
            expect(mocks.mockPrismaSubject.delete).toHaveBeenCalledWith({ where: { id: 'nb-english' } });
        });
    });

    describe('POST /api/notebooks (创建错题本)', () => {
        it('应该成功创建错题本', async () => {
            const newNotebook = {
                id: 'nb-new',
                name: '物理',
                userId: 'user-123',
                _count: { errorItems: 0 },
            };
            mocks.mockPrismaSubject.findUnique.mockResolvedValue(null); // 不存在同名
            mocks.mockPrismaSubject.create.mockResolvedValue(newNotebook);

            const request = new Request('http://localhost/api/notebooks', {
                method: 'POST',
                body: JSON.stringify({ name: '物理' }),
                headers: { 'Content-Type': 'application/json' },
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(201);
            expect(data.name).toBe('物理');
            expect(data._count.errorItems).toBe(0);
        });

        it('应该拒绝创建空名称的错题本', async () => {
            const request = new Request('http://localhost/api/notebooks', {
                method: 'POST',
                body: JSON.stringify({ name: '' }),
                headers: { 'Content-Type': 'application/json' },
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.message).toBe('Notebook name is required');
        });

        it('应该拒绝创建只有空格的错题本名称', async () => {
            const request = new Request('http://localhost/api/notebooks', {
                method: 'POST',
                body: JSON.stringify({ name: '   ' }),
                headers: { 'Content-Type': 'application/json' },
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.message).toBe('Notebook name is required');
        });

        it('应该拒绝创建同名错题本', async () => {
            // 模拟已存在同名错题本
            mocks.mockPrismaSubject.findUnique.mockResolvedValue({
                id: 'existing-nb',
                name: '数学',
                userId: 'user-123',
            });

            const request = new Request('http://localhost/api/notebooks', {
                method: 'POST',
                body: JSON.stringify({ name: '数学' }),
                headers: { 'Content-Type': 'application/json' },
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(409);
            expect(data.message).toBe('Notebook with this name already exists');
        });

        it('应该自动 trim 名称两端的空格', async () => {
            mocks.mockPrismaSubject.findUnique.mockResolvedValue(null);
            mocks.mockPrismaSubject.create.mockResolvedValue({
                id: 'nb-new',
                name: '化学',
                userId: 'user-123',
                _count: { errorItems: 0 },
            });

            const request = new Request('http://localhost/api/notebooks', {
                method: 'POST',
                body: JSON.stringify({ name: '  化学  ' }),
                headers: { 'Content-Type': 'application/json' },
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(201);
            expect(data.name).toBe('化学');
        });
    });

    describe('GET /api/notebooks/[id] (获取单个错题本)', () => {
        it('应该返回错题本详情', async () => {
            const notebook = {
                id: 'nb-1',
                name: '数学',
                userId: 'user-123',
                _count: { errorItems: 10 },
            };
            mocks.mockPrismaSubject.findUnique.mockResolvedValue(notebook);

            const request = new Request('http://localhost/api/notebooks/nb-1');
            const response = await GET_NOTEBOOK(request, { params: Promise.resolve({ id: 'nb-1' }) });
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.name).toBe('数学');
            expect(data._count.errorItems).toBe(10);
        });

        it('应该返回 404 当错题本不存在', async () => {
            mocks.mockPrismaSubject.findUnique.mockResolvedValue(null);

            const request = new Request('http://localhost/api/notebooks/not-exist');
            const response = await GET_NOTEBOOK(request, { params: Promise.resolve({ id: 'not-exist' }) });
            const data = await response.json();

            expect(response.status).toBe(404);
            expect(data.message).toBe('Notebook not found');
        });

        it('应该拒绝访问其他用户的错题本', async () => {
            const notebook = {
                id: 'nb-1',
                name: '数学',
                userId: 'other-user-id', // 不同的用户
            };
            mocks.mockPrismaSubject.findUnique.mockResolvedValue(notebook);

            const request = new Request('http://localhost/api/notebooks/nb-1');
            const response = await GET_NOTEBOOK(request, { params: Promise.resolve({ id: 'nb-1' }) });
            const data = await response.json();

            expect(response.status).toBe(403);
            expect(data.message).toContain('Not authorized');
        });
    });

    describe('PUT /api/notebooks/[id] (更新错题本)', () => {
        it('应该成功更新错题本名称', async () => {
            const existingNotebook = {
                id: 'nb-1',
                name: '数学',
                userId: 'user-123',
            };
            mocks.mockPrismaSubject.findUnique.mockResolvedValue(existingNotebook);
            mocks.mockPrismaSubject.update.mockResolvedValue({
                ...existingNotebook,
                name: '高等数学',
                _count: { errorItems: 5 },
            });

            const request = new Request('http://localhost/api/notebooks/nb-1', {
                method: 'PUT',
                body: JSON.stringify({ name: '高等数学' }),
                headers: { 'Content-Type': 'application/json' },
            });

            const response = await PUT(request, { params: Promise.resolve({ id: 'nb-1' }) });
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.name).toBe('高等数学');
        });

        it('应该拒绝更新为空名称', async () => {
            const existingNotebook = {
                id: 'nb-1',
                name: '数学',
                userId: 'user-123',
            };
            mocks.mockPrismaSubject.findUnique.mockResolvedValue(existingNotebook);

            const request = new Request('http://localhost/api/notebooks/nb-1', {
                method: 'PUT',
                body: JSON.stringify({ name: '' }),
                headers: { 'Content-Type': 'application/json' },
            });

            const response = await PUT(request, { params: Promise.resolve({ id: 'nb-1' }) });
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.message).toBe('Notebook name is required');
        });

        it('应该返回 404 当错题本不存在', async () => {
            mocks.mockPrismaSubject.findUnique.mockResolvedValue(null);

            const request = new Request('http://localhost/api/notebooks/not-exist', {
                method: 'PUT',
                body: JSON.stringify({ name: '新名称' }),
                headers: { 'Content-Type': 'application/json' },
            });

            const response = await PUT(request, { params: Promise.resolve({ id: 'not-exist' }) });
            const data = await response.json();

            expect(response.status).toBe(404);
            expect(data.message).toBe('Notebook not found');
        });

        it('应该拒绝更新其他用户的错题本', async () => {
            const existingNotebook = {
                id: 'nb-1',
                name: '数学',
                userId: 'other-user-id', // 不同的用户
            };
            mocks.mockPrismaSubject.findUnique.mockResolvedValue(existingNotebook);

            const request = new Request('http://localhost/api/notebooks/nb-1', {
                method: 'PUT',
                body: JSON.stringify({ name: '新名称' }),
                headers: { 'Content-Type': 'application/json' },
            });

            const response = await PUT(request, { params: Promise.resolve({ id: 'nb-1' }) });
            const data = await response.json();

            expect(response.status).toBe(403);
            expect(data.message).toContain('Not authorized');
        });
    });

    describe('DELETE /api/notebooks/[id] (删除错题本)', () => {
        it('应该成功删除空的错题本', async () => {
            const notebook = {
                id: 'nb-1',
                name: '数学',
                userId: 'user-123',
                _count: { errorItems: 0 }, // 没有错题
            };
            mocks.mockPrismaSubject.findUnique.mockResolvedValue(notebook);
            mocks.mockPrismaSubject.delete.mockResolvedValue(notebook);

            const request = new Request('http://localhost/api/notebooks/nb-1', {
                method: 'DELETE',
            });

            const response = await DELETE(request, { params: Promise.resolve({ id: 'nb-1' }) });
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.message).toBe('Notebook deleted successfully');
            expect(mocks.mockPrismaSubject.delete).toHaveBeenCalledWith({ where: { id: 'nb-1' } });
        });

        it('应该拒绝删除包含错题的错题本', async () => {
            const notebook = {
                id: 'nb-1',
                name: '数学',
                userId: 'user-123',
                _count: { errorItems: 5 }, // 有错题
            };
            mocks.mockPrismaSubject.findUnique.mockResolvedValue(notebook);

            const request = new Request('http://localhost/api/notebooks/nb-1', {
                method: 'DELETE',
            });

            const response = await DELETE(request, { params: Promise.resolve({ id: 'nb-1' }) });
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.message).toContain('Cannot delete notebook with error items');
            expect(mocks.mockPrismaSubject.delete).not.toHaveBeenCalled();
        });

        it('应该返回 404 当错题本不存在', async () => {
            mocks.mockPrismaSubject.findUnique.mockResolvedValue(null);

            const request = new Request('http://localhost/api/notebooks/not-exist', {
                method: 'DELETE',
            });

            const response = await DELETE(request, { params: Promise.resolve({ id: 'not-exist' }) });
            const data = await response.json();

            expect(response.status).toBe(404);
            expect(data.message).toBe('Notebook not found');
        });

        it('应该拒绝删除其他用户的错题本', async () => {
            const notebook = {
                id: 'nb-1',
                name: '数学',
                userId: 'other-user-id', // 不同的用户
                _count: { errorItems: 0 },
            };
            mocks.mockPrismaSubject.findUnique.mockResolvedValue(notebook);

            const request = new Request('http://localhost/api/notebooks/nb-1', {
                method: 'DELETE',
            });

            const response = await DELETE(request, { params: Promise.resolve({ id: 'nb-1' }) });
            const data = await response.json();

            expect(response.status).toBe(403);
            expect(data.message).toContain('Not authorized');
            expect(mocks.mockPrismaSubject.delete).not.toHaveBeenCalled();
        });
    });
});
