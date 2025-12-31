import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import fastifyMultipart from '@fastify/multipart';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase } from './db/index.js';
import familyMembersRoutes from './routes/familyMembers.js';
import knowledgeRoutes from './routes/knowledge.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fastify = Fastify({
    logger: true
});

await fastify.register(cors, {
    origin: true
});

// 注册文件上传支持
await fastify.register(fastifyMultipart, {
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
    }
});

// 上传文件静态访问
const uploadPath = path.join(__dirname, '../../uploadFiles');
await fastify.register(fastifyStatic, {
    root: uploadPath,
    prefix: '/uploadFiles/',
    decorateReply: false
});

// 静态文件服务 - 生产环境下服务前端构建产物
const clientDistPath = path.join(__dirname, '../../client/dist');
await fastify.register(fastifyStatic, {
    root: clientDistPath,
    prefix: '/'
});

// 注册路由
await fastify.register(familyMembersRoutes);
await fastify.register(knowledgeRoutes);

// API 路由
fastify.get('/api/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
});

// SPA 路由回退
fastify.setNotFoundHandler(async (request, reply) => {
    if (request.url.startsWith('/api')) {
        return reply.status(404).send({ error: 'API not found' });
    }
    return reply.sendFile('index.html');
});

const start = async () => {
    try {
        // 初始化数据库
        await initDatabase();

        await fastify.listen({ port: 3000, host: '0.0.0.0' });
        console.log('🚀 服务器已启动: http://localhost:3000');
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();
