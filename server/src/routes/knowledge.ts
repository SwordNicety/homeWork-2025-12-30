import { FastifyInstance } from 'fastify';
import { getDatabase } from '../db/index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { compressImageBuffer, isImageFile } from '../utils/imageCompress.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 类型定义
interface KnowledgeCategory {
    id?: number;
    name: string;
    description?: string;
    logo_path?: string;
    color?: string;
    sort_weight?: number;
    dir_name: string;
}

interface KnowledgeSection {
    id?: number;
    category_id: number;
    name: string;
    description?: string;
    logo_path?: string;
    color?: string;
    sort_weight?: number;
    dir_name: string;
}

interface KnowledgeItem {
    id?: number;
    section_id: number;
    name: string;
    keywords?: string;
    brief_note?: string;
    summary?: string;
    detail?: string;
    sort_weight?: number;
    audio_paths?: string;
    image_paths?: string;
    video_paths?: string;
    correct_count?: number;
    wrong_count?: number;
    consecutive_correct?: number;
    consecutive_wrong?: number;
    last_study_at?: string;
    last_correct_at?: string;
    last_wrong_at?: string;
}

export default async function knowledgeRoutes(fastify: FastifyInstance) {
    const db = getDatabase();

    // ============ 知识库（一级板块）CRUD ============

    // 获取所有知识库
    fastify.get('/api/knowledge/categories', async (request, reply) => {
        try {
            const categories = db.prepare(`
        SELECT kc.*, 
          (SELECT COUNT(*) FROM knowledge_sections WHERE category_id = kc.id) as section_count,
          (SELECT COUNT(*) FROM knowledge_items ki 
           JOIN knowledge_sections ks ON ki.section_id = ks.id 
           WHERE ks.category_id = kc.id) as item_count
        FROM knowledge_categories kc
        ORDER BY kc.sort_weight ASC, kc.id ASC
      `).all();
            return { success: true, data: categories };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 获取单个知识库
    fastify.get<{ Params: { id: string } }>('/api/knowledge/categories/:id', async (request, reply) => {
        try {
            const category = db.prepare(`
        SELECT kc.*, 
          (SELECT COUNT(*) FROM knowledge_sections WHERE category_id = kc.id) as section_count,
          (SELECT COUNT(*) FROM knowledge_items ki 
           JOIN knowledge_sections ks ON ki.section_id = ks.id 
           WHERE ks.category_id = kc.id) as item_count
        FROM knowledge_categories kc
        WHERE kc.id = ?
      `).get(request.params.id);
            if (!category) {
                return reply.status(404).send({ success: false, error: '知识库不存在' });
            }
            return { success: true, data: category };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 创建知识库
    fastify.post<{ Body: KnowledgeCategory }>('/api/knowledge/categories', async (request, reply) => {
        try {
            const { name, description, logo_path, color, sort_weight, dir_name } = request.body;

            // 创建目录
            const uploadDir = path.join(__dirname, '../../../uploadFiles/knowledgeFiles', dir_name);
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            const result = db.prepare(`
        INSERT INTO knowledge_categories (name, description, logo_path, color, sort_weight, dir_name)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(name, description || null, logo_path || null, color || '#3B82F6', sort_weight || 0, dir_name);

            return { success: true, data: { id: result.lastInsertRowid } };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 更新知识库
    fastify.put<{ Params: { id: string }; Body: KnowledgeCategory }>('/api/knowledge/categories/:id', async (request, reply) => {
        try {
            const { name, description, logo_path, color, sort_weight, dir_name } = request.body;

            db.prepare(`
        UPDATE knowledge_categories 
        SET name = ?, description = ?, logo_path = ?, color = ?, sort_weight = ?, dir_name = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(name, description || null, logo_path || null, color || '#3B82F6', sort_weight || 0, dir_name, request.params.id);

            return { success: true };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 删除知识库
    fastify.delete<{ Params: { id: string } }>('/api/knowledge/categories/:id', async (request, reply) => {
        try {
            // 检查是否有二级板块
            const sections = db.prepare('SELECT COUNT(*) as count FROM knowledge_sections WHERE category_id = ?').get(request.params.id) as any;
            if (sections.count > 0) {
                return reply.status(400).send({ success: false, error: '请先删除所有二级板块' });
            }

            db.prepare('DELETE FROM knowledge_categories WHERE id = ?').run(request.params.id);
            return { success: true };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // ============ 二级板块 CRUD ============

    // 获取二级板块列表（支持 query 参数）
    fastify.get<{ Querystring: { categoryId?: string } }>('/api/knowledge/sections', async (request, reply) => {
        try {
            const { categoryId } = request.query;
            let sql = `
        SELECT ks.*, 
          (SELECT COUNT(*) FROM knowledge_items WHERE section_id = ks.id) as item_count,
          (SELECT MAX(last_study_at) FROM knowledge_items WHERE section_id = ks.id) as last_study_at
        FROM knowledge_sections ks
      `;
            const params: any[] = [];

            if (categoryId) {
                sql += ' WHERE ks.category_id = ?';
                params.push(categoryId);
            }

            sql += ' ORDER BY ks.sort_weight ASC, ks.id ASC';

            const sections = db.prepare(sql).all(...params);
            return { success: true, data: sections };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 获取某知识库的所有二级板块
    fastify.get<{ Params: { categoryId: string } }>('/api/knowledge/categories/:categoryId/sections', async (request, reply) => {
        try {
            const sections = db.prepare(`
        SELECT ks.*, 
          (SELECT COUNT(*) FROM knowledge_items WHERE section_id = ks.id) as item_count,
          (SELECT MAX(updated_at) FROM knowledge_items WHERE section_id = ks.id) as last_updated
        FROM knowledge_sections ks
        WHERE ks.category_id = ?
        ORDER BY ks.sort_weight ASC, ks.id ASC
      `).all(request.params.categoryId);
            return { success: true, data: sections };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 获取单个二级板块
    fastify.get<{ Params: { id: string } }>('/api/knowledge/sections/:id', async (request, reply) => {
        try {
            const section = db.prepare(`
        SELECT ks.*, kc.name as category_name, kc.dir_name as category_dir,
          (SELECT COUNT(*) FROM knowledge_items WHERE section_id = ks.id) as item_count,
          (SELECT MAX(updated_at) FROM knowledge_items WHERE section_id = ks.id) as last_updated
        FROM knowledge_sections ks
        JOIN knowledge_categories kc ON ks.category_id = kc.id
        WHERE ks.id = ?
      `).get(request.params.id);
            if (!section) {
                return reply.status(404).send({ success: false, error: '板块不存在' });
            }
            return { success: true, data: section };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 创建二级板块
    fastify.post<{ Body: KnowledgeSection }>('/api/knowledge/sections', async (request, reply) => {
        try {
            const { category_id, name, description, logo_path, color, sort_weight, dir_name } = request.body;

            // 获取一级板块目录名
            const category = db.prepare('SELECT dir_name FROM knowledge_categories WHERE id = ?').get(category_id) as any;
            if (!category) {
                return reply.status(400).send({ success: false, error: '知识库不存在' });
            }

            // 创建目录
            const uploadDir = path.join(__dirname, '../../../uploadFiles/knowledgeFiles', category.dir_name, dir_name);
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            const result = db.prepare(`
        INSERT INTO knowledge_sections (category_id, name, description, logo_path, color, sort_weight, dir_name)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(category_id, name, description || null, logo_path || null, color || '#8B5CF6', sort_weight || 0, dir_name);

            return { success: true, data: { id: result.lastInsertRowid } };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 更新二级板块
    fastify.put<{ Params: { id: string }; Body: KnowledgeSection }>('/api/knowledge/sections/:id', async (request, reply) => {
        try {
            const { category_id, name, description, logo_path, color, sort_weight, dir_name } = request.body;

            db.prepare(`
        UPDATE knowledge_sections 
        SET category_id = ?, name = ?, description = ?, logo_path = ?, color = ?, sort_weight = ?, dir_name = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(category_id, name, description || null, logo_path || null, color || '#8B5CF6', sort_weight || 0, dir_name, request.params.id);

            return { success: true };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 移动二级板块到其他知识库
    fastify.put<{ Params: { id: string }; Body: { target_category_id: number } }>('/api/knowledge/sections/:id/move', async (request, reply) => {
        try {
            const { target_category_id } = request.body;

            db.prepare(`
        UPDATE knowledge_sections 
        SET category_id = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(target_category_id, request.params.id);

            return { success: true };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 删除二级板块
    fastify.delete<{ Params: { id: string } }>('/api/knowledge/sections/:id', async (request, reply) => {
        try {
            // 检查是否有知识条目
            const items = db.prepare('SELECT COUNT(*) as count FROM knowledge_items WHERE section_id = ?').get(request.params.id) as any;
            if (items.count > 0) {
                return reply.status(400).send({ success: false, error: '请先删除所有知识条目' });
            }

            db.prepare('DELETE FROM knowledge_sections WHERE id = ?').run(request.params.id);
            return { success: true };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // ============ 知识条目 CRUD ============

    // 获取知识条目列表（支持 query 参数）
    fastify.get<{ Querystring: { sectionId?: string } }>('/api/knowledge/items', async (request, reply) => {
        try {
            const { sectionId } = request.query;
            let sql = 'SELECT * FROM knowledge_items';
            const params: any[] = [];

            if (sectionId) {
                sql += ' WHERE section_id = ?';
                params.push(sectionId);
            }

            sql += ' ORDER BY sort_weight ASC, id ASC';

            const items = db.prepare(sql).all(...params);
            return { success: true, data: items };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 获取某板块的所有知识条目
    fastify.get<{ Params: { sectionId: string } }>('/api/knowledge/sections/:sectionId/items', async (request, reply) => {
        try {
            const items = db.prepare(`
        SELECT * FROM knowledge_items
        WHERE section_id = ?
        ORDER BY sort_weight ASC, id ASC
      `).all(request.params.sectionId);
            return { success: true, data: items };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 获取单个知识条目
    fastify.get<{ Params: { id: string } }>('/api/knowledge/items/:id', async (request, reply) => {
        try {
            const item = db.prepare('SELECT * FROM knowledge_items WHERE id = ?').get(request.params.id);
            if (!item) {
                return reply.status(404).send({ success: false, error: '知识条目不存在' });
            }
            return { success: true, data: item };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 创建知识条目
    fastify.post<{ Body: KnowledgeItem }>('/api/knowledge/items', async (request, reply) => {
        try {
            const { section_id, name, keywords, brief_note, summary, detail, sort_weight, audio_paths, image_paths, video_paths } = request.body;

            const result = db.prepare(`
        INSERT INTO knowledge_items (section_id, name, keywords, brief_note, summary, detail, sort_weight, audio_paths, image_paths, video_paths)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(section_id, name, keywords || null, brief_note || null, summary || null, detail || null, sort_weight || 0, audio_paths || null, image_paths || null, video_paths || null);

            return { success: true, data: { id: result.lastInsertRowid } };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 更新知识条目
    fastify.put<{ Params: { id: string }; Body: KnowledgeItem }>('/api/knowledge/items/:id', async (request, reply) => {
        try {
            const { name, keywords, brief_note, summary, detail, sort_weight, audio_paths, image_paths, video_paths } = request.body;

            db.prepare(`
        UPDATE knowledge_items 
        SET name = ?, keywords = ?, brief_note = ?, summary = ?, detail = ?, sort_weight = ?, 
            audio_paths = ?, image_paths = ?, video_paths = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(name, keywords || null, brief_note || null, summary || null, detail || null, sort_weight || 0, audio_paths || null, image_paths || null, video_paths || null, request.params.id);

            return { success: true };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 更新学习记录 (PUT)
    fastify.put<{ Params: { id: string }; Body: { result: 'correct' | 'wrong' | 'skip' } }>('/api/knowledge/items/:id/study', async (request, reply) => {
        try {
            const { result } = request.body;
            const now = new Date().toISOString();

            // 获取当前记录
            const item = db.prepare('SELECT * FROM knowledge_items WHERE id = ?').get(request.params.id) as any;
            if (!item) {
                return reply.status(404).send({ success: false, error: '知识条目不存在' });
            }

            let updateSql = 'UPDATE knowledge_items SET last_study_at = ?';
            const params: any[] = [now];

            if (result === 'correct') {
                updateSql += ', correct_count = correct_count + 1, consecutive_correct = consecutive_correct + 1, consecutive_wrong = 0, last_correct_at = ?';
                params.push(now);
            } else if (result === 'wrong') {
                updateSql += ', wrong_count = wrong_count + 1, consecutive_wrong = consecutive_wrong + 1, consecutive_correct = 0, last_wrong_at = ?';
                params.push(now);
            }

            updateSql += ', updated_at = CURRENT_TIMESTAMP WHERE id = ?';
            params.push(request.params.id);

            db.prepare(updateSql).run(...params);

            return { success: true };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 更新学习记录 (POST - 前端兼容)
    fastify.post<{ Params: { id: string }; Body: { isCorrect: boolean } }>('/api/knowledge/items/:id/study', async (request, reply) => {
        try {
            const { isCorrect } = request.body;
            const now = new Date().toISOString();

            // 获取当前记录
            const item = db.prepare('SELECT * FROM knowledge_items WHERE id = ?').get(request.params.id) as any;
            if (!item) {
                return reply.status(404).send({ success: false, error: '知识条目不存在' });
            }

            let updateSql = 'UPDATE knowledge_items SET last_study_at = ?';
            const params: any[] = [now];

            if (isCorrect) {
                updateSql += ', correct_count = correct_count + 1, consecutive_correct = consecutive_correct + 1, consecutive_wrong = 0, last_correct_at = ?';
                params.push(now);
            } else {
                updateSql += ', wrong_count = wrong_count + 1, consecutive_wrong = consecutive_wrong + 1, consecutive_correct = 0, last_wrong_at = ?';
                params.push(now);
            }

            updateSql += ', updated_at = CURRENT_TIMESTAMP WHERE id = ?';
            params.push(request.params.id);

            db.prepare(updateSql).run(...params);

            return { success: true };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 删除知识条目
    fastify.delete<{ Params: { id: string } }>('/api/knowledge/items/:id', async (request, reply) => {
        try {
            db.prepare('DELETE FROM knowledge_items WHERE id = ?').run(request.params.id);
            return { success: true };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // ============ 文件上传 ============

    // 上传知识库Logo
    fastify.post('/api/upload/knowledge-logo', async (request, reply) => {
        try {
            const data = await request.file();
            if (!data) {
                return reply.status(400).send({ success: false, error: '没有文件上传' });
            }

            const uploadDir = path.join(__dirname, '../../../uploadFiles/knowledgeFiles/logos');
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            const timestamp = Date.now();
            const extname = path.extname(data.filename);
            const filename = `logo_${timestamp}_${Math.random().toString(36).substring(7)}${extname}`;
            const filepath = path.join(uploadDir, filename);

            // 读取并压缩图片
            let buffer = await data.toBuffer();
            if (isImageFile(data.filename)) {
                buffer = await compressImageBuffer(buffer, data.filename, { quality: 70 });
            }
            fs.writeFileSync(filepath, buffer);

            const relativePath = `uploadFiles/knowledgeFiles/logos/${filename}`;
            return { success: true, data: { path: relativePath } };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 清空某个 section 下所有条目的学习记录
    fastify.put<{ Params: { sectionId: string } }>('/api/knowledge/sections/:sectionId/clear-study-records', async (request, reply) => {
        try {
            const { sectionId } = request.params;
            db.prepare(`
                UPDATE knowledge_items 
                SET correct_count = 0, 
                    wrong_count = 0, 
                    consecutive_correct = 0, 
                    consecutive_wrong = 0,
                    last_study_at = NULL,
                    last_correct_at = NULL,
                    last_wrong_at = NULL
                WHERE section_id = ?
            `).run(sectionId);
            return { success: true };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 清空单个条目的学习记录
    fastify.put<{ Params: { id: string } }>('/api/knowledge/items/:id/clear-study-record', async (request, reply) => {
        try {
            db.prepare(`
                UPDATE knowledge_items 
                SET correct_count = 0, 
                    wrong_count = 0, 
                    consecutive_correct = 0, 
                    consecutive_wrong = 0,
                    last_study_at = NULL,
                    last_correct_at = NULL,
                    last_wrong_at = NULL
                WHERE id = ?
            `).run(request.params.id);
            return { success: true };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // ============ 文件上传 ============

    // 上传知识条目媒体文件（图片/音频/视频）
    fastify.post<{ Querystring: { categoryDir: string; sectionDir: string; type: 'image' | 'audio' | 'video' } }>('/api/upload/knowledge-media', async (request, reply) => {
        try {
            const { categoryDir, sectionDir, type } = request.query;
            const data = await request.file();
            if (!data) {
                return reply.status(400).send({ success: false, error: '没有文件上传' });
            }

            const uploadDir = path.join(__dirname, '../../../uploadFiles/knowledgeFiles', categoryDir, sectionDir, type + 's');
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            const timestamp = Date.now();
            const extname = path.extname(data.filename);
            const prefix = type === 'image' ? 'img' : type === 'audio' ? 'aud' : 'vid';
            const filename = `${prefix}_${timestamp}_${Math.random().toString(36).substring(7)}${extname}`;
            const filepath = path.join(uploadDir, filename);

            // 读取文件，对图片进行压缩
            let buffer = await data.toBuffer();
            if (type === 'image' && isImageFile(data.filename)) {
                buffer = await compressImageBuffer(buffer, data.filename, { quality: 70 });
            }
            fs.writeFileSync(filepath, buffer);

            const relativePath = `uploadFiles/knowledgeFiles/${categoryDir}/${sectionDir}/${type}s/${filename}`;
            return { success: true, data: { path: relativePath } };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });
}
