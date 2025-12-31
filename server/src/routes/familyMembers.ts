import { FastifyInstance } from 'fastify';
import { getDatabase } from '../db/index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 类型定义
interface FamilyMember {
    id?: number;
    nickname: string;
    name?: string;
    birthday_text?: string;
    birthday_date?: string;
    zodiac_sign?: string;
    chinese_zodiac?: string;
    avatar_path?: string;
    gender?: string;
    sort_weight?: number;
}

interface AttributeDefinition {
    id?: number;
    attribute_name: string;
    attribute_type: 'integer' | 'string' | 'decimal' | 'checkbox' | 'image';
    options?: string;
    attribute_logo?: string;
    sort_weight?: number;
}

interface AttributeValue {
    id?: number;
    member_id: number;
    attribute_id: number;
    value_text?: string;
    value_number?: number;
    value_boolean?: number;
    value_image?: string;
}

export default async function familyMembersRoutes(fastify: FastifyInstance) {
    const db = getDatabase();

    // ============ 家庭成员 CRUD ============

    // 获取所有家庭成员（按权重排序）
    fastify.get('/api/family-members', async (request, reply) => {
        try {
            const members = db.prepare(
                'SELECT * FROM family_members ORDER BY sort_weight ASC, id ASC'
            ).all();
            return { success: true, data: members };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 获取单个家庭成员
    fastify.get<{ Params: { id: string } }>('/api/family-members/:id', async (request, reply) => {
        try {
            const member = db.prepare(
                'SELECT * FROM family_members WHERE id = ?'
            ).get(request.params.id);
            if (!member) {
                return reply.status(404).send({ success: false, error: '成员不存在' });
            }
            return { success: true, data: member };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 创建家庭成员
    fastify.post<{ Body: FamilyMember }>('/api/family-members', async (request, reply) => {
        try {
            const { nickname, name, birthday_text, birthday_date, zodiac_sign, chinese_zodiac, avatar_path, gender, sort_weight } = request.body;

            // 检查昵称是否重复
            const existing = db.prepare('SELECT id FROM family_members WHERE nickname = ?').get(nickname);
            if (existing) {
                return reply.status(400).send({ success: false, error: '昵称已存在' });
            }

            const result = db.prepare(`
        INSERT INTO family_members (nickname, name, birthday_text, birthday_date, zodiac_sign, chinese_zodiac, avatar_path, gender, sort_weight)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(nickname, name || null, birthday_text || null, birthday_date || null, zodiac_sign || null, chinese_zodiac || null, avatar_path || null, gender || null, sort_weight || 0);

            return { success: true, data: { id: result.lastInsertRowid } };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 更新家庭成员
    fastify.put<{ Params: { id: string }; Body: FamilyMember }>('/api/family-members/:id', async (request, reply) => {
        try {
            const { nickname, name, birthday_text, birthday_date, zodiac_sign, chinese_zodiac, avatar_path, gender, sort_weight } = request.body;

            // 检查昵称是否与其他成员重复
            const existing = db.prepare('SELECT id FROM family_members WHERE nickname = ? AND id != ?').get(nickname, request.params.id);
            if (existing) {
                return reply.status(400).send({ success: false, error: '昵称已存在' });
            }

            db.prepare(`
        UPDATE family_members 
        SET nickname = ?, name = ?, birthday_text = ?, birthday_date = ?, zodiac_sign = ?, chinese_zodiac = ?, avatar_path = ?, gender = ?, sort_weight = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(nickname, name || null, birthday_text || null, birthday_date || null, zodiac_sign || null, chinese_zodiac || null, avatar_path || null, gender || null, sort_weight || 0, request.params.id);

            return { success: true };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 删除家庭成员
    fastify.delete<{ Params: { id: string } }>('/api/family-members/:id', async (request, reply) => {
        try {
            db.prepare('DELETE FROM family_members WHERE id = ?').run(request.params.id);
            return { success: true };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // ============ 属性定义 CRUD ============

    // 获取所有属性定义（按权重排序）
    fastify.get('/api/member-attributes', async (request, reply) => {
        try {
            const attributes = db.prepare(
                'SELECT * FROM member_attribute_definitions ORDER BY sort_weight ASC, id ASC'
            ).all();
            return { success: true, data: attributes };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 创建属性定义
    fastify.post<{ Body: AttributeDefinition }>('/api/member-attributes', async (request, reply) => {
        try {
            const { attribute_name, attribute_type, options, attribute_logo, sort_weight } = request.body;

            // 检查属性名是否重复
            const existing = db.prepare('SELECT id FROM member_attribute_definitions WHERE attribute_name = ?').get(attribute_name);
            if (existing) {
                return reply.status(400).send({ success: false, error: '属性名已存在' });
            }

            const result = db.prepare(`
        INSERT INTO member_attribute_definitions (attribute_name, attribute_type, options, attribute_logo, sort_weight)
        VALUES (?, ?, ?, ?, ?)
      `).run(attribute_name, attribute_type, options || null, attribute_logo || null, sort_weight || 0);

            return { success: true, data: { id: result.lastInsertRowid } };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 更新属性定义
    fastify.put<{ Params: { id: string }; Body: AttributeDefinition }>('/api/member-attributes/:id', async (request, reply) => {
        try {
            const { attribute_name, attribute_type, options, attribute_logo, sort_weight } = request.body;

            // 检查属性名是否与其他属性重复
            const existing = db.prepare('SELECT id FROM member_attribute_definitions WHERE attribute_name = ? AND id != ?').get(attribute_name, request.params.id);
            if (existing) {
                return reply.status(400).send({ success: false, error: '属性名已存在' });
            }

            db.prepare(`
        UPDATE member_attribute_definitions 
        SET attribute_name = ?, attribute_type = ?, options = ?, attribute_logo = ?, sort_weight = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(attribute_name, attribute_type, options || null, attribute_logo || null, sort_weight || 0, request.params.id);

            return { success: true };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 删除属性定义
    fastify.delete<{ Params: { id: string } }>('/api/member-attributes/:id', async (request, reply) => {
        try {
            db.prepare('DELETE FROM member_attribute_definitions WHERE id = ?').run(request.params.id);
            return { success: true };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // ============ 属性值 CRUD ============

    // 获取指定成员的所有属性值
    fastify.get<{ Params: { memberId: string } }>('/api/family-members/:memberId/attributes', async (request, reply) => {
        try {
            const values = db.prepare(`
        SELECT mav.*, mad.attribute_name, mad.attribute_type, mad.attribute_logo
        FROM member_attribute_values mav
        JOIN member_attribute_definitions mad ON mav.attribute_id = mad.id
        WHERE mav.member_id = ?
        ORDER BY mad.sort_weight ASC, mad.id ASC
      `).all(request.params.memberId);
            return { success: true, data: values };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 获取所有成员的所有属性值（用于表格展示）
    fastify.get('/api/member-attribute-values', async (request, reply) => {
        try {
            const values = db.prepare(`
        SELECT mav.*, mad.attribute_name, mad.attribute_type, fm.nickname
        FROM member_attribute_values mav
        JOIN member_attribute_definitions mad ON mav.attribute_id = mad.id
        JOIN family_members fm ON mav.member_id = fm.id
      `).all();
            return { success: true, data: values };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 设置或更新属性值
    fastify.post<{ Body: AttributeValue }>('/api/member-attribute-values', async (request, reply) => {
        try {
            const { member_id, attribute_id, value_text, value_number, value_boolean, value_image } = request.body;

            // 检查是否已存在
            const existing = db.prepare(
                'SELECT id FROM member_attribute_values WHERE member_id = ? AND attribute_id = ?'
            ).get(member_id, attribute_id);

            if (existing) {
                // 更新
                db.prepare(`
          UPDATE member_attribute_values 
          SET value_text = ?, value_number = ?, value_boolean = ?, value_image = ?, updated_at = CURRENT_TIMESTAMP
          WHERE member_id = ? AND attribute_id = ?
        `).run(value_text || null, value_number || null, value_boolean || null, value_image || null, member_id, attribute_id);
            } else {
                // 插入
                db.prepare(`
          INSERT INTO member_attribute_values (member_id, attribute_id, value_text, value_number, value_boolean, value_image)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(member_id, attribute_id, value_text || null, value_number || null, value_boolean || null, value_image || null);
            }

            return { success: true };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 删除属性值
    fastify.delete<{ Params: { id: string } }>('/api/member-attribute-values/:id', async (request, reply) => {
        try {
            db.prepare('DELETE FROM member_attribute_values WHERE id = ?').run(request.params.id);
            return { success: true };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // ============ 文件上传 ============

    // 上传成员头像
    fastify.post('/api/upload/avatar', async (request, reply) => {
        try {
            const data = await request.file();
            if (!data) {
                return reply.status(400).send({ success: false, error: '没有文件上传' });
            }

            const uploadDir = path.join(__dirname, '../../../uploadFiles/members/avatars');

            // 确保目录存在
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            // 生成唯一文件名
            const timestamp = Date.now();
            const extname = path.extname(data.filename);
            const filename = `avatar_${timestamp}_${Math.random().toString(36).substring(7)}${extname}`;
            const filepath = path.join(uploadDir, filename);

            // 保存文件
            const buffer = await data.toBuffer();
            fs.writeFileSync(filepath, buffer);

            const relativePath = `uploadFiles/members/avatars/${filename}`;
            return { success: true, data: { path: relativePath } };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 上传属性Logo
    fastify.post('/api/upload/logo', async (request, reply) => {
        try {
            const data = await request.file();
            if (!data) {
                return reply.status(400).send({ success: false, error: '没有文件上传' });
            }

            const uploadDir = path.join(__dirname, '../../../uploadFiles/members/logos');

            // 确保目录存在
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            // 生成唯一文件名
            const timestamp = Date.now();
            const extname = path.extname(data.filename);
            const filename = `logo_${timestamp}_${Math.random().toString(36).substring(7)}${extname}`;
            const filepath = path.join(uploadDir, filename);

            // 保存文件
            const buffer = await data.toBuffer();
            fs.writeFileSync(filepath, buffer);

            const relativePath = `uploadFiles/members/logos/${filename}`;
            return { success: true, data: { path: relativePath } };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 上传属性值图片
    fastify.post('/api/upload/attribute', async (request, reply) => {
        try {
            const data = await request.file();
            if (!data) {
                return reply.status(400).send({ success: false, error: '没有文件上传' });
            }

            const uploadDir = path.join(__dirname, '../../../uploadFiles/members/attributes');

            // 确保目录存在
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            // 生成唯一文件名
            const timestamp = Date.now();
            const extname = path.extname(data.filename);
            const filename = `attr_${timestamp}_${Math.random().toString(36).substring(7)}${extname}`;
            const filepath = path.join(uploadDir, filename);

            // 保存文件
            const buffer = await data.toBuffer();
            fs.writeFileSync(filepath, buffer);

            const relativePath = `uploadFiles/members/attributes/${filename}`;
            return { success: true, data: { path: relativePath } };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });
}
