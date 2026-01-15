import { FastifyInstance } from 'fastify';
import * as DiaryManager from '../utils/diaryManager.js';
import { compressImageBuffer, isImageFile } from '../utils/imageCompress.js';

export default async function diaryRoutes(fastify: FastifyInstance) {

    // ============ 日记 CRUD ============

    // 获取选项（心情、天气）
    fastify.get('/api/diary/options', async (request, reply) => {
        try {
            const options = DiaryManager.getOptions();
            return { success: true, data: options };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 获取所有日记列表
    fastify.get('/api/diary', async (request, reply) => {
        try {
            const diaries = DiaryManager.getAllDiaries();
            return { success: true, data: diaries };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 按年月获取日记
    fastify.get<{ Querystring: { year?: string; month?: string } }>('/api/diary/by-month', async (request, reply) => {
        try {
            const { year, month } = request.query;
            if (!year || !month) {
                const now = new Date();
                const diaries = DiaryManager.getDiariesByMonth(now.getFullYear(), now.getMonth() + 1);
                return { success: true, data: diaries };
            }
            const diaries = DiaryManager.getDiariesByMonth(parseInt(year), parseInt(month));
            return { success: true, data: diaries };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 获取今日日记（不存在则创建）
    fastify.get('/api/diary/today', async (request, reply) => {
        try {
            const diary = DiaryManager.getTodayDiary();
            return { success: true, data: diary };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 获取单个日记
    fastify.get<{ Params: { id: string } }>('/api/diary/:id', async (request, reply) => {
        try {
            const diary = DiaryManager.getDiaryById(request.params.id);
            if (!diary) {
                return reply.status(404).send({ success: false, error: '日记不存在' });
            }
            return { success: true, data: diary };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 创建日记
    fastify.post<{ Body: { date: string } }>('/api/diary', async (request, reply) => {
        try {
            const { date } = request.body;
            // 检查是否已存在
            const existing = DiaryManager.getDiaryById(date);
            if (existing) {
                return { success: true, data: existing };
            }
            const diary = DiaryManager.createDiary({ date });
            return { success: true, data: diary };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 更新日记
    fastify.put<{
        Params: { id: string };
        Body: {
            weather?: string[];
            weatherFeel?: string;
            events?: string;
            moods?: DiaryManager.MoodRecord[];
            meals?: DiaryManager.MealRecord[];
        }
    }>('/api/diary/:id', async (request, reply) => {
        try {
            const success = DiaryManager.updateDiary(request.params.id, request.body);
            if (!success) {
                return reply.status(404).send({ success: false, error: '日记不存在' });
            }
            const diary = DiaryManager.getDiaryById(request.params.id);
            return { success: true, data: diary };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 删除日记
    fastify.delete<{ Params: { id: string } }>('/api/diary/:id', async (request, reply) => {
        try {
            const result = DiaryManager.deleteDiary(request.params.id);
            if (!result.success) {
                return reply.status(400).send({ success: false, error: result.error });
            }
            return { success: true };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // ============ 心情管理 ============

    // 更新心情
    fastify.put<{
        Params: { id: string };
        Body: DiaryManager.MoodRecord
    }>('/api/diary/:id/mood', async (request, reply) => {
        try {
            const success = DiaryManager.updateMood(request.params.id, request.body);
            if (!success) {
                return reply.status(404).send({ success: false, error: '日记不存在' });
            }
            return { success: true };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // ============ 饮食管理 ============

    // 更新饮食
    fastify.put<{
        Params: { id: string };
        Body: DiaryManager.MealRecord
    }>('/api/diary/:id/meal', async (request, reply) => {
        try {
            const success = DiaryManager.updateMeal(request.params.id, request.body);
            if (!success) {
                return reply.status(404).send({ success: false, error: '日记不存在' });
            }
            return { success: true };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // ============ 媒体文件上传 ============

    // 上传图片
    fastify.post<{ Params: { id: string } }>('/api/diary/:id/upload/image', async (request, reply) => {
        try {
            const diaryId = request.params.id;
            const data = await request.file();
            if (!data) {
                return reply.status(400).send({ success: false, error: '没有文件上传' });
            }

            // 确保日记存在
            let diary = DiaryManager.getDiaryById(diaryId);
            if (!diary) {
                diary = DiaryManager.createDiary({ date: diaryId });
            }

            let buffer = await data.toBuffer();
            if (isImageFile(data.filename)) {
                buffer = await compressImageBuffer(buffer, data.filename, { quality: 70 });
            }

            const result = DiaryManager.saveMediaFile(diaryId, 'image', buffer, data.filename);
            if (!result.success) {
                return reply.status(500).send({ success: false, error: result.error });
            }

            return { success: true, data: { path: result.path } };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 上传视频
    fastify.post<{ Params: { id: string } }>('/api/diary/:id/upload/video', async (request, reply) => {
        try {
            const diaryId = request.params.id;
            const data = await request.file();
            if (!data) {
                return reply.status(400).send({ success: false, error: '没有文件上传' });
            }

            // 确保日记存在
            let diary = DiaryManager.getDiaryById(diaryId);
            if (!diary) {
                diary = DiaryManager.createDiary({ date: diaryId });
            }

            const buffer = await data.toBuffer();
            const result = DiaryManager.saveMediaFile(diaryId, 'video', buffer, data.filename);
            if (!result.success) {
                return reply.status(500).send({ success: false, error: result.error });
            }

            return { success: true, data: { path: result.path } };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 上传音频
    fastify.post<{ Params: { id: string } }>('/api/diary/:id/upload/audio', async (request, reply) => {
        try {
            const diaryId = request.params.id;
            const data = await request.file();
            if (!data) {
                return reply.status(400).send({ success: false, error: '没有文件上传' });
            }

            // 确保日记存在
            let diary = DiaryManager.getDiaryById(diaryId);
            if (!diary) {
                diary = DiaryManager.createDiary({ date: diaryId });
            }

            const buffer = await data.toBuffer();
            const result = DiaryManager.saveMediaFile(diaryId, 'audio', buffer, data.filename);
            if (!result.success) {
                return reply.status(500).send({ success: false, error: result.error });
            }

            return { success: true, data: { path: result.path } };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 删除媒体文件
    fastify.delete<{
        Params: { id: string };
        Querystring: { type: 'image' | 'video' | 'audio'; path: string }
    }>('/api/diary/:id/media', async (request, reply) => {
        try {
            const { type, path } = request.query;
            const success = DiaryManager.deleteMediaFile(request.params.id, type, path);
            if (!success) {
                return reply.status(400).send({ success: false, error: '删除失败' });
            }
            return { success: true };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });
}
