import { FastifyInstance } from 'fastify';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 视频中心根目录
const VIDEO_CENTER_PATH = path.join(__dirname, '../../../videoCenter');
const RESOURCES_PATH = path.join(VIDEO_CENTER_PATH, 'resources');
const BREAK_PATH = path.join(VIDEO_CENTER_PATH, 'have_a_break');

// 支持的视频格式
const VIDEO_EXTENSIONS = ['.mp4', '.mkv', '.avi', '.mov', '.webm', '.m4v', '.flv', '.wmv'];

// 检查是否是视频文件
function isVideoFile(filename: string): boolean {
    const ext = path.extname(filename).toLowerCase();
    return VIDEO_EXTENSIONS.includes(ext);
}

// 检查目录是否只包含视频文件（没有子目录）
function isVideoDirectory(dirPath: string): boolean {
    try {
        const items = fs.readdirSync(dirPath);
        for (const item of items) {
            if (item.startsWith('.')) continue;
            const itemPath = path.join(dirPath, item);
            const stat = fs.statSync(itemPath);
            if (stat.isDirectory() && item !== 'icon.png') {
                return false;
            }
        }
        return true;
    } catch {
        return false;
    }
}

// 获取目录的 icon
function getDirectoryIcon(dirPath: string, relativePath: string): string | null {
    const iconPath = path.join(dirPath, 'icon.png');
    if (fs.existsSync(iconPath)) {
        return `/videoCenter/resources/${relativePath}/icon.png`;
    }
    return null;
}

// 获取目录信息
interface DirectoryInfo {
    name: string;
    path: string;
    type: 'category' | 'videos';
    icon: string | null;
    children?: DirectoryInfo[];
    videoCount?: number;
}

// 递归扫描目录结构
function scanDirectory(dirPath: string, relativePath: string = ''): DirectoryInfo[] {
    const result: DirectoryInfo[] = [];

    try {
        const items = fs.readdirSync(dirPath);

        for (const item of items) {
            // 跳过隐藏文件和特殊文件
            if (item.startsWith('.') || item === 'icon.png' || item === 'statistics.json') continue;

            const itemPath = path.join(dirPath, item);
            const stat = fs.statSync(itemPath);

            if (stat.isDirectory()) {
                const itemRelativePath = relativePath ? `${relativePath}/${item}` : item;
                const isVideosDir = isVideoDirectory(itemPath);

                const dirInfo: DirectoryInfo = {
                    name: item,
                    path: itemRelativePath,
                    type: isVideosDir ? 'videos' : 'category',
                    icon: getDirectoryIcon(itemPath, itemRelativePath)
                };

                if (isVideosDir) {
                    // 统计视频文件数量
                    const videoFiles = fs.readdirSync(itemPath).filter(f => isVideoFile(f));
                    dirInfo.videoCount = videoFiles.length;
                }

                result.push(dirInfo);
            }
        }
    } catch (error) {
        console.error('扫描目录失败:', error);
    }

    return result;
}

// 视频文件信息
interface VideoFileInfo {
    filename: string;
    path: string;
    displayName: string;
    order: number;
}

// 视频统计信息
interface VideoStatistics {
    filename: string;
    playCount: number;
    lastPosition: number; // 上次播放位置（秒）
    totalWatchTime: number; // 累计观看时间（秒）
    lastPlayedAt: string | null;
    duration: number; // 视频时长（秒）
}

// 目录统计信息
interface DirectoryStatistics {
    videos: VideoStatistics[];
    playOrder: string[]; // 播放顺序
    updatedAt: string;
}

// 获取或创建统计文件
function getOrCreateStatistics(dirPath: string): DirectoryStatistics {
    const statsPath = path.join(dirPath, 'statistics.json');

    if (fs.existsSync(statsPath)) {
        try {
            const content = fs.readFileSync(statsPath, 'utf-8');
            return JSON.parse(content);
        } catch {
            // 文件损坏，重新创建
        }
    }

    // 创建新的统计文件
    const videoFiles = fs.readdirSync(dirPath)
        .filter(f => isVideoFile(f))
        .sort();

    const stats: DirectoryStatistics = {
        videos: videoFiles.map(filename => ({
            filename,
            playCount: 0,
            lastPosition: 0,
            totalWatchTime: 0,
            lastPlayedAt: null,
            duration: 0
        })),
        playOrder: videoFiles,
        updatedAt: new Date().toISOString()
    };

    fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2));
    return stats;
}

// 更新统计信息
function updateStatistics(dirPath: string, filename: string, updates: Partial<VideoStatistics>): DirectoryStatistics {
    const stats = getOrCreateStatistics(dirPath);

    let videoStats = stats.videos.find(v => v.filename === filename);
    if (!videoStats) {
        videoStats = {
            filename,
            playCount: 0,
            lastPosition: 0,
            totalWatchTime: 0,
            lastPlayedAt: null,
            duration: 0
        };
        stats.videos.push(videoStats);
        if (!stats.playOrder.includes(filename)) {
            stats.playOrder.push(filename);
        }
    }

    Object.assign(videoStats, updates);
    stats.updatedAt = new Date().toISOString();

    const statsPath = path.join(dirPath, 'statistics.json');
    fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2));

    return stats;
}

// 获取休息视频列表
function getBreakVideos(): string[] {
    try {
        const files = fs.readdirSync(BREAK_PATH);
        return files.filter(f => isVideoFile(f));
    } catch {
        return [];
    }
}

export default async function theaterRoutes(fastify: FastifyInstance) {

    // 获取根目录板块列表
    fastify.get('/api/theater/categories', async (request, reply) => {
        try {
            const categories = scanDirectory(RESOURCES_PATH);
            return { success: true, data: categories };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 获取指定目录的子目录/视频列表
    fastify.get<{ Params: { '*': string } }>('/api/theater/browse/*', async (request, reply) => {
        try {
            const relativePath = request.params['*'] || '';
            const dirPath = path.join(RESOURCES_PATH, relativePath);

            if (!fs.existsSync(dirPath)) {
                return reply.status(404).send({ success: false, error: '目录不存在' });
            }

            // 检查是否是视频目录
            if (isVideoDirectory(dirPath)) {
                // 返回视频文件列表和统计信息
                const stats = getOrCreateStatistics(dirPath);
                const videoFiles = fs.readdirSync(dirPath)
                    .filter(f => isVideoFile(f))
                    .map((filename, index) => {
                        const videoStats = stats.videos.find(v => v.filename === filename);
                        return {
                            filename,
                            path: `${relativePath}/${filename}`,
                            displayName: path.basename(filename, path.extname(filename)),
                            order: stats.playOrder.indexOf(filename) !== -1 ? stats.playOrder.indexOf(filename) : index,
                            playCount: videoStats?.playCount || 0,
                            lastPosition: videoStats?.lastPosition || 0,
                            totalWatchTime: videoStats?.totalWatchTime || 0,
                            lastPlayedAt: videoStats?.lastPlayedAt || null,
                            duration: videoStats?.duration || 0
                        };
                    })
                    .sort((a, b) => a.order - b.order);

                return {
                    success: true,
                    data: {
                        type: 'videos',
                        path: relativePath,
                        name: path.basename(dirPath),
                        icon: getDirectoryIcon(dirPath, relativePath),
                        videos: videoFiles
                    }
                };
            } else {
                // 返回子目录列表
                const categories = scanDirectory(dirPath, relativePath);
                return {
                    success: true,
                    data: {
                        type: 'categories',
                        path: relativePath,
                        name: path.basename(dirPath),
                        icon: getDirectoryIcon(dirPath, relativePath),
                        categories
                    }
                };
            }
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 更新视频播放统计
    fastify.post<{
        Params: { '*': string };
        Body: {
            filename: string;
            playCount?: number;
            lastPosition?: number;
            totalWatchTime?: number;
            duration?: number;
            lastPlayedAt?: string;
        }
    }>('/api/theater/stats/*', async (request, reply) => {
        try {
            const relativePath = request.params['*'] || '';
            const dirPath = path.join(RESOURCES_PATH, relativePath);

            if (!fs.existsSync(dirPath)) {
                return reply.status(404).send({ success: false, error: '目录不存在' });
            }

            const { filename, ...updates } = request.body;

            if (updates.playCount !== undefined || updates.lastPosition !== undefined) {
                (updates as any).lastPlayedAt = new Date().toISOString();
            }

            const stats = updateStatistics(dirPath, filename, updates as Partial<VideoStatistics>);

            return { success: true, data: stats };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 获取休息视频列表
    fastify.get('/api/theater/break-videos', async (request, reply) => {
        try {
            const videos = getBreakVideos();
            return {
                success: true,
                data: videos.map(filename => ({
                    filename,
                    path: `/videoCenter/have_a_break/${filename}`
                }))
            };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 增加播放次数
    fastify.post<{
        Params: { '*': string };
        Body: { filename: string }
    }>('/api/theater/increment-play/*', async (request, reply) => {
        try {
            const relativePath = request.params['*'] || '';
            const dirPath = path.join(RESOURCES_PATH, relativePath);

            if (!fs.existsSync(dirPath)) {
                return reply.status(404).send({ success: false, error: '目录不存在' });
            }

            const { filename } = request.body;
            const currentStats = getOrCreateStatistics(dirPath);
            const videoStats = currentStats.videos.find(v => v.filename === filename);
            const currentPlayCount = videoStats?.playCount || 0;

            const stats = updateStatistics(dirPath, filename, {
                playCount: currentPlayCount + 1,
                lastPlayedAt: new Date().toISOString()
            });

            return { success: true, data: stats };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });
}
