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
import tasksRoutes from './routes/tasks.js';
import periodicTasksRoutes from './routes/periodicTasks.js';
import gamesRoutes from './routes/games.js';
import { initializeIndex } from './utils/knowledgeIndexManager.js';
import { initFileDB } from './utils/familyMembersFileManager.js';
import { initHonorsDB } from './utils/honorsManager.js';
import { initTasksDB } from './utils/taskManager.js';
import { initPeriodicTasksDB, checkAndGenerateTodayTasks } from './utils/periodicTaskManager.js';
import { initGamesDB } from './utils/gamesManager.js';
import {
    loadDeployConfig,
    getKnowledgeDataPath,
    getTheaterDataPath,
    getDiaryDataPath,
    getTasksDataPath,
    getGamesDataPath,
    getHonorsDataPath,
    getFamilyMembersDataPath,
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
        fileSize: 500 * 1024 * 1024, // 500MB - 支持大视频文件
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

// 任务上传文件静态访问（从配置获取路径）
const tasksUploadPath = path.join(getTasksDataPath(), 'uploads');
if (!fs.existsSync(tasksUploadPath)) {
    fs.mkdirSync(tasksUploadPath, { recursive: true });
}
await fastify.register(fastifyStatic, {
    root: tasksUploadPath,
    prefix: '/taskUploads/',
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

// 游戏上传文件静态访问（从配置获取路径）
const gameUploadPath = path.join(getGamesDataPath(), 'uploads');
if (!fs.existsSync(gameUploadPath)) {
    fs.mkdirSync(gameUploadPath, { recursive: true });
}
await fastify.register(fastifyStatic, {
    root: gameUploadPath,
    prefix: '/gameUploads/',
    decorateReply: false
});

// 荣誉上传文件静态访问（从配置获取路径）
const honorsUploadPath = path.join(getHonorsDataPath(), 'uploads');
if (!fs.existsSync(honorsUploadPath)) {
    fs.mkdirSync(honorsUploadPath, { recursive: true });
}
await fastify.register(fastifyStatic, {
    root: honorsUploadPath,
    prefix: '/honorsUploads/',
    decorateReply: false
});

// 成员上传文件静态访问（从配置获取路径）
const membersUploadPath = path.join(getFamilyMembersDataPath(), 'uploads');
if (!fs.existsSync(membersUploadPath)) {
    fs.mkdirSync(membersUploadPath, { recursive: true });
}
await fastify.register(fastifyStatic, {
    root: membersUploadPath,
    prefix: '/membersUploads/',
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
await fastify.register(diaryRoutes);
await fastify.register(theaterRoutes);
await fastify.register(honorsRoutes);
await fastify.register(tasksRoutes);
await fastify.register(gamesRoutes);
await fastify.register(periodicTasksRoutes);

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

        // 初始化任务数据库
        initTasksDB();

        // 初始化周期任务数据库
        initPeriodicTasksDB();

        // 初始化游戏数据库
        initGamesDB();

        // 生成今日周期任务
        const generatedCount = checkAndGenerateTodayTasks();
        if (generatedCount > 0) {
            console.log(`📋 已自动生成 ${generatedCount} 个周期任务`);
        }

        await fastify.listen({ port: 3000, host: '0.0.0.0' });
        console.log('🚀 服务器已启动: http://localhost:3000');
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();
