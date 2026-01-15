import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import fastifyMultipart from '@fastify/multipart';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import familyMembersRoutes from './routes/familyMembers.js';
import knowledgeRoutes from './routes/knowledge.js';
import diaryRoutes from './routes/diary.js';
import theaterRoutes from './routes/theater.js';
import honorsRoutes from './routes/honors.js';
import { initializeIndex } from './utils/knowledgeIndexManager.js';
import { initFileDB } from './utils/familyMembersFileManager.js';
import { initHonorsDB } from './utils/honorsManager.js';
import {
    loadDeployConfig,
    getKnowledgeDataPath,
    getTheaterDataPath,
    getDiaryDataPath,
    ensureDataDirectories,
    getAllDataPaths
} from './utils/deployConfigManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载部署配置
const deployConfig = loadDeployConfig();
console.log('📋 部署配置已加载');
console.log('📂 数据路径:', getAllDataPaths());

// 确保数据目录存在
ensureDataDirectories();

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

// 日记上传文件静态访问（从配置获取路径）
const diaryUploadPath = path.join(getDiaryDataPath(), 'uploads');
if (!fs.existsSync(diaryUploadPath)) {
    fs.mkdirSync(diaryUploadPath, { recursive: true });
}
await fastify.register(fastifyStatic, {
    root: diaryUploadPath,
    prefix: '/diaryUploads/',
    decorateReply: false
});

// 知识库文件静态访问（从配置获取路径）
const knowledgePath = getKnowledgeDataPath();
if (fs.existsSync(knowledgePath)) {
    await fastify.register(fastifyStatic, {
        root: knowledgePath,
        prefix: '/knowledgeFiles/',
        decorateReply: false
    });
}

// 配置文件静态访问
const configsPath = path.join(__dirname, '../../configs');
await fastify.register(fastifyStatic, {
    root: configsPath,
    prefix: '/configs/',
    decorateReply: false
});

// 视频中心文件静态访问（从配置获取路径）
const videoCenterPath = getTheaterDataPath();
if (fs.existsSync(videoCenterPath)) {
    await fastify.register(fastifyStatic, {
        root: videoCenterPath,
        prefix: '/videoCenter/',
        decorateReply: false
    });
}

// 静态文件服务 - 生产环境下服务前端构建产物
const clientDistPath = path.join(__dirname, '../../client/dist');
await fastify.register(fastifyStatic, {
    root: clientDistPath,
    prefix: '/'
});

// 注册路由
await fastify.register(familyMembersRoutes);
await fastify.register(knowledgeRoutes);
await fastify.register(diaryRoutes);
await fastify.register(theaterRoutes);
await fastify.register(honorsRoutes);

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
        // 初始化文件数据库
        initFileDB();

        // 初始化知识库索引
        initializeIndex();

        // 初始化荣誉室数据库
        initHonorsDB();

        await fastify.listen({ port: 3000, host: '0.0.0.0' });
        console.log('🚀 服务器已启动: http://localhost:3000');
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();
