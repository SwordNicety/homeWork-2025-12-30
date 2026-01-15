import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 项目根目录
const PROJECT_ROOT = path.join(__dirname, '../../../');
const CONFIGS_DIR = path.join(PROJECT_ROOT, 'configs');

// 配置文件路径
const LOCAL_DEPLOY_CONFIG_PATH = path.join(CONFIGS_DIR, 'localDeployConfig.json');
const DEPLOY_CONFIG_PATH = path.join(CONFIGS_DIR, 'deployConfig.json');

// ============ 类型定义 ============

export interface DataPathsConfig {
    // 放映厅数据目录
    theater: string;
    // 知识库数据目录
    knowledge: string;
    // 家庭成员数据目录
    familyMembers: string;
    // 日记数据目录
    diary: string;
    // 荣誉室数据目录
    honors: string;
}

export interface ServerConfig {
    host: string;
    port: number;
}

export interface DatabaseConfig {
    type: string;
    path: string;
}

export interface LogsConfig {
    path: string;
}

export interface DeployConfig {
    server: ServerConfig;
    database: DatabaseConfig;
    logs: LogsConfig;
    dataPaths: DataPathsConfig;
}

// ============ 配置加载 ============

let cachedConfig: DeployConfig | null = null;

/**
 * 解析路径，支持相对路径（相对于项目根目录）和绝对路径
 */
function resolvePath(configPath: string): string {
    if (path.isAbsolute(configPath)) {
        return configPath;
    }
    return path.resolve(PROJECT_ROOT, configPath);
}

/**
 * 加载部署配置
 * 优先加载 localDeployConfig.json，如果不存在则加载 deployConfig.json
 */
export function loadDeployConfig(): DeployConfig {
    if (cachedConfig) {
        return cachedConfig;
    }

    let configPath: string;
    let configSource: string;

    // 优先加载 localDeployConfig.json
    if (fs.existsSync(LOCAL_DEPLOY_CONFIG_PATH)) {
        configPath = LOCAL_DEPLOY_CONFIG_PATH;
        configSource = 'localDeployConfig.json';
    } else {
        configPath = DEPLOY_CONFIG_PATH;
        configSource = 'deployConfig.json';
    }

    console.log(`📁 加载部署配置: ${configSource}`);

    try {
        const content = fs.readFileSync(configPath, 'utf-8');
        const config = JSON.parse(content) as DeployConfig;

        // 验证必要的配置项
        if (!config.dataPaths) {
            console.warn('⚠️ 配置文件中缺少 dataPaths，使用默认值');
            config.dataPaths = getDefaultDataPaths();
        }

        cachedConfig = config;
        return config;
    } catch (error) {
        console.error(`❌ 加载配置文件失败: ${configPath}`, error);
        throw error;
    }
}

/**
 * 获取默认的数据路径配置
 */
function getDefaultDataPaths(): DataPathsConfig {
    return {
        theater: '../homeWorkData/theater',
        knowledge: '../homeWorkData/knowledge',
        familyMembers: '../homeWorkData/familyMembers',
        diary: '../homeWorkData/diary',
        honors: '../homeWorkData/honors'
    };
}

/**
 * 重新加载配置（清除缓存）
 */
export function reloadDeployConfig(): DeployConfig {
    cachedConfig = null;
    return loadDeployConfig();
}

// ============ 数据路径获取 ============

/**
 * 获取放映厅数据根目录
 */
export function getTheaterDataPath(): string {
    const config = loadDeployConfig();
    return resolvePath(config.dataPaths.theater);
}

/**
 * 获取知识库数据根目录
 */
export function getKnowledgeDataPath(): string {
    const config = loadDeployConfig();
    return resolvePath(config.dataPaths.knowledge);
}

/**
 * 获取家庭成员数据根目录
 */
export function getFamilyMembersDataPath(): string {
    const config = loadDeployConfig();
    return resolvePath(config.dataPaths.familyMembers);
}

/**
 * 获取日记数据根目录
 */
export function getDiaryDataPath(): string {
    const config = loadDeployConfig();
    return resolvePath(config.dataPaths.diary);
}

/**
 * 获取荣誉室数据根目录
 */
export function getHonorsDataPath(): string {
    const config = loadDeployConfig();
    return resolvePath(config.dataPaths.honors);
}

/**
 * 获取项目根目录
 */
export function getProjectRoot(): string {
    return PROJECT_ROOT;
}

/**
 * 获取所有数据路径的解析结果（用于调试）
 */
export function getAllDataPaths(): Record<string, string> {
    return {
        theater: getTheaterDataPath(),
        knowledge: getKnowledgeDataPath(),
        familyMembers: getFamilyMembersDataPath(),
        diary: getDiaryDataPath(),
        honors: getHonorsDataPath(),
        projectRoot: PROJECT_ROOT
    };
}

/**
 * 确保数据目录存在
 */
export function ensureDataDirectories(): void {
    const paths = [
        getTheaterDataPath(),
        getKnowledgeDataPath(),
        getFamilyMembersDataPath(),
        getDiaryDataPath(),
        getHonorsDataPath()
    ];

    for (const p of paths) {
        if (!fs.existsSync(p)) {
            fs.mkdirSync(p, { recursive: true });
            console.log(`📂 创建数据目录: ${p}`);
        }
    }
}
