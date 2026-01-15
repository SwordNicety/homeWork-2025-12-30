import fs from 'fs';
import path from 'path';
import { getKnowledgeDataPath, getProjectRoot } from './deployConfigManager.js';

// 获取知识库根目录（从配置读取）
function getKnowledgeRoot(): string {
    return getKnowledgeDataPath();
}

// ============ 类型定义 ============

export interface CategoryConfig {
    name: string;
    description?: string;
    color?: string;
    sort_weight?: number;
    created_at?: string;
    updated_at?: string;
}

export interface SectionConfig {
    name: string;
    description?: string;
    color?: string;
    sort_weight?: number;
    created_at?: string;
    updated_at?: string;
}

export interface SubSectionConfig {
    name: string;
    description?: string;
    color?: string;
    sort_weight?: number;
    created_at?: string;
    updated_at?: string;
}

export interface ItemConfig {
    name: string;
    keywords?: string;
    brief_note?: string;
    summary?: string;
    detail?: string;
    sort_weight?: number;
    // 媒体文件列表（相对于知识点目录的文件名）
    audio_files?: string[];
    image_files?: string[];
    video_files?: string[];
    // 学习统计
    correct_count?: number;
    wrong_count?: number;
    consecutive_correct?: number;
    consecutive_wrong?: number;
    last_study_at?: string;
    last_correct_at?: string;
    last_wrong_at?: string;
    created_at?: string;
    updated_at?: string;
}

// API返回的数据结构
export interface Category {
    id: string;  // 使用目录名作为ID
    name: string;
    description?: string;
    logo_path?: string;
    color?: string;
    sort_weight: number;
    dir_name: string;
    section_count?: number;
    item_count?: number;
    created_at?: string;
    updated_at?: string;
}

export interface Section {
    id: string;
    category_id: string;
    name: string;
    description?: string;
    logo_path?: string;
    color?: string;
    sort_weight: number;
    dir_name: string;
    subsection_count?: number;
    item_count?: number;
    last_study_at?: string;
    created_at?: string;
    updated_at?: string;
}

export interface SubSection {
    id: string;
    section_id: string;
    category_id?: string;
    name: string;
    description?: string;
    logo_path?: string;
    color?: string;
    sort_weight: number;
    dir_name: string;
    item_count?: number;
    last_study_at?: string;
    created_at?: string;
    updated_at?: string;
    // 额外信息
    section_name?: string;
    section_dir?: string;
    category_name?: string;
    category_dir?: string;
}

export interface Item {
    id: string;
    subsection_id: string;
    section_id?: string;
    name: string;
    keywords?: string;
    brief_note?: string;
    summary?: string;
    detail?: string;
    sort_weight: number;
    // 完整路径的媒体文件
    audio_paths?: string;
    image_paths?: string;
    video_paths?: string;
    // 学习统计
    correct_count: number;
    wrong_count: number;
    consecutive_correct: number;
    consecutive_wrong: number;
    last_study_at?: string;
    last_correct_at?: string;
    last_wrong_at?: string;
    created_at?: string;
    updated_at?: string;
}

// ============ 工具函数 ============

function ensureDir(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

function readJsonFile<T>(filePath: string): T | null {
    try {
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf-8');
            return JSON.parse(content);
        }
    } catch (error) {
        console.error(`Error reading ${filePath}:`, error);
    }
    return null;
}

function writeJsonFile(filePath: string, data: any): void {
    ensureDir(path.dirname(filePath));
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

function findIconFile(dirPath: string): string | undefined {
    const extensions = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'];
    for (const ext of extensions) {
        const iconPath = path.join(dirPath, `icon.${ext}`);
        if (fs.existsSync(iconPath)) {
            return iconPath;
        }
    }
    return undefined;
}

function getRelativePath(absolutePath: string): string {
    return path.relative(getProjectRoot(), absolutePath);
}

function getDirectories(dirPath: string): string[] {
    if (!fs.existsSync(dirPath)) {
        return [];
    }
    return fs.readdirSync(dirPath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
}

// 将字符串转换为合法的目录名
function sanitizeDirName(str: string): string {
    // 移除或替换不合法的文件系统字符
    return str
        .replace(/[<>:"/\\|?*]/g, '') // 移除Windows不允许的字符
        .replace(/[\s]+/g, '_')       // 空格替换为下划线
        .replace(/[^\w\u4e00-\u9fa5\-_.]/g, '') // 只保留字母、数字、中文、下划线、连字符、点
        .substring(0, 50)             // 限制长度
        .replace(/^[.\s]+|[.\s]+$/g, ''); // 移除开头和结尾的点和空格
}

function generateDirName(name: string, keywords?: string): string {
    // 优先使用关键字，否则使用名称
    const baseName = keywords?.trim() || name?.trim() || '';
    const sanitized = sanitizeDirName(baseName);

    // 如果清理后为空，使用时间戳
    if (!sanitized) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        return `${timestamp}_${random}`;
    }

    return sanitized;
}

// 确保目录名在父目录中唯一
function ensureUniqueDirName(parentPath: string, baseDirName: string): string {
    let dirName = baseDirName;
    let counter = 1;

    while (fs.existsSync(path.join(parentPath, dirName))) {
        dirName = `${baseDirName}_${counter}`;
        counter++;
    }

    return dirName;
}

// ============ 一级板块（知识库）操作 ============

export function getAllCategories(): Category[] {
    ensureDir(getKnowledgeRoot());
    const dirs = getDirectories(getKnowledgeRoot());
    const categories: Category[] = [];

    for (const dirName of dirs) {
        const categoryPath = path.join(getKnowledgeRoot(), dirName);
        const configPath = path.join(categoryPath, 'config.json');
        const config = readJsonFile<CategoryConfig>(configPath);

        if (config) {
            const iconPath = findIconFile(categoryPath);
            const sectionDirs = getDirectories(categoryPath);

            // 计算条目数量
            let itemCount = 0;
            let sectionCount = 0;
            for (const sectionDir of sectionDirs) {
                const sectionPath = path.join(categoryPath, sectionDir);
                const sectionConfigPath = path.join(sectionPath, 'config.json');
                if (fs.existsSync(sectionConfigPath)) {
                    sectionCount++;
                    const subSectionDirs = getDirectories(sectionPath);
                    for (const subSectionDir of subSectionDirs) {
                        const subSectionPath = path.join(sectionPath, subSectionDir);
                        const subSectionConfigPath = path.join(subSectionPath, 'config.json');
                        if (fs.existsSync(subSectionConfigPath)) {
                            const itemDirs = getDirectories(subSectionPath);
                            for (const itemDir of itemDirs) {
                                const itemConfigPath = path.join(subSectionPath, itemDir, 'config.json');
                                if (fs.existsSync(itemConfigPath)) {
                                    itemCount++;
                                }
                            }
                        }
                    }
                }
            }

            categories.push({
                id: dirName,
                name: config.name,
                description: config.description,
                logo_path: iconPath ? getRelativePath(iconPath) : undefined,
                color: config.color || '#3B82F6',
                sort_weight: config.sort_weight || 0,
                dir_name: dirName,
                section_count: sectionCount,
                item_count: itemCount,
                created_at: config.created_at,
                updated_at: config.updated_at
            });
        }
    }

    // 按权重排序
    categories.sort((a, b) => a.sort_weight - b.sort_weight);
    return categories;
}

export function getCategoryById(categoryId: string): Category | null {
    const categoryPath = path.join(getKnowledgeRoot(), categoryId);
    const configPath = path.join(categoryPath, 'config.json');
    const config = readJsonFile<CategoryConfig>(configPath);

    if (!config) return null;

    const iconPath = findIconFile(categoryPath);
    const sectionDirs = getDirectories(categoryPath);

    let itemCount = 0;
    let sectionCount = 0;
    for (const sectionDir of sectionDirs) {
        const sectionPath = path.join(categoryPath, sectionDir);
        const sectionConfigPath = path.join(sectionPath, 'config.json');
        if (fs.existsSync(sectionConfigPath)) {
            sectionCount++;
            const subSectionDirs = getDirectories(sectionPath);
            for (const subSectionDir of subSectionDirs) {
                const subSectionPath = path.join(sectionPath, subSectionDir);
                const subSectionConfigPath = path.join(subSectionPath, 'config.json');
                if (fs.existsSync(subSectionConfigPath)) {
                    const itemDirs = getDirectories(subSectionPath);
                    for (const itemDir of itemDirs) {
                        const itemConfigPath = path.join(subSectionPath, itemDir, 'config.json');
                        if (fs.existsSync(itemConfigPath)) {
                            itemCount++;
                        }
                    }
                }
            }
        }
    }

    return {
        id: categoryId,
        name: config.name,
        description: config.description,
        logo_path: iconPath ? getRelativePath(iconPath) : undefined,
        color: config.color || '#3B82F6',
        sort_weight: config.sort_weight || 0,
        dir_name: categoryId,
        section_count: sectionCount,
        item_count: itemCount,
        created_at: config.created_at,
        updated_at: config.updated_at
    };
}

export function createCategory(data: { name: string; description?: string; color?: string; sort_weight?: number; dir_name: string }): Category {
    const dirName = data.dir_name || generateDirName(data.name);
    const categoryPath = path.join(getKnowledgeRoot(), dirName);
    ensureDir(categoryPath);

    const now = new Date().toISOString();
    const config: CategoryConfig = {
        name: data.name,
        description: data.description,
        color: data.color || '#3B82F6',
        sort_weight: data.sort_weight || 0,
        created_at: now,
        updated_at: now
    };

    writeJsonFile(path.join(categoryPath, 'config.json'), config);

    return {
        id: dirName,
        name: config.name,
        description: config.description,
        color: config.color,
        sort_weight: config.sort_weight || 0,
        dir_name: dirName,
        section_count: 0,
        item_count: 0,
        created_at: config.created_at,
        updated_at: config.updated_at
    };
}

export function updateCategory(categoryId: string, data: { name?: string; description?: string; color?: string; sort_weight?: number }): boolean {
    const categoryPath = path.join(getKnowledgeRoot(), categoryId);
    const configPath = path.join(categoryPath, 'config.json');
    const config = readJsonFile<CategoryConfig>(configPath);

    if (!config) return false;

    const updatedConfig: CategoryConfig = {
        ...config,
        name: data.name ?? config.name,
        description: data.description ?? config.description,
        color: data.color ?? config.color,
        sort_weight: data.sort_weight ?? config.sort_weight,
        updated_at: new Date().toISOString()
    };

    writeJsonFile(configPath, updatedConfig);
    return true;
}

export function deleteCategory(categoryId: string): { success: boolean; error?: string } {
    const categoryPath = path.join(getKnowledgeRoot(), categoryId);

    if (!fs.existsSync(categoryPath)) {
        return { success: false, error: '知识库不存在' };
    }

    // 检查是否有二级板块
    const sectionDirs = getDirectories(categoryPath);
    const hasSections = sectionDirs.some(dir => {
        const configPath = path.join(categoryPath, dir, 'config.json');
        return fs.existsSync(configPath);
    });

    if (hasSections) {
        return { success: false, error: '请先删除所有二级板块' };
    }

    fs.rmSync(categoryPath, { recursive: true });
    return { success: true };
}

// ============ 二级板块操作 ============

export function getSectionsByCategory(categoryId: string): Section[] {
    const categoryPath = path.join(getKnowledgeRoot(), categoryId);
    const dirs = getDirectories(categoryPath);
    const sections: Section[] = [];

    for (const dirName of dirs) {
        const sectionPath = path.join(categoryPath, dirName);
        const configPath = path.join(sectionPath, 'config.json');
        const config = readJsonFile<SectionConfig>(configPath);

        if (config) {
            const iconPath = findIconFile(sectionPath);
            const subSectionDirs = getDirectories(sectionPath);

            let itemCount = 0;
            let subSectionCount = 0;
            let lastStudyAt: string | undefined;

            for (const subSectionDir of subSectionDirs) {
                const subSectionPath = path.join(sectionPath, subSectionDir);
                const subSectionConfigPath = path.join(subSectionPath, 'config.json');
                if (fs.existsSync(subSectionConfigPath)) {
                    subSectionCount++;
                    const itemDirs = getDirectories(subSectionPath);
                    for (const itemDir of itemDirs) {
                        const itemConfigPath = path.join(subSectionPath, itemDir, 'config.json');
                        const itemConfig = readJsonFile<ItemConfig>(itemConfigPath);
                        if (itemConfig) {
                            itemCount++;
                            if (itemConfig.last_study_at) {
                                if (!lastStudyAt || itemConfig.last_study_at > lastStudyAt) {
                                    lastStudyAt = itemConfig.last_study_at;
                                }
                            }
                        }
                    }
                }
            }

            sections.push({
                id: `${categoryId}/${dirName}`,
                category_id: categoryId,
                name: config.name,
                description: config.description,
                logo_path: iconPath ? getRelativePath(iconPath) : undefined,
                color: config.color || '#8B5CF6',
                sort_weight: config.sort_weight || 0,
                dir_name: dirName,
                subsection_count: subSectionCount,
                item_count: itemCount,
                last_study_at: lastStudyAt,
                created_at: config.created_at,
                updated_at: config.updated_at
            });
        }
    }

    sections.sort((a, b) => a.sort_weight - b.sort_weight);
    return sections;
}

export function getSectionById(sectionId: string): Section | null {
    const parts = sectionId.split('/');
    if (parts.length !== 2) return null;

    const [categoryId, dirName] = parts;
    const sectionPath = path.join(getKnowledgeRoot(), categoryId, dirName);
    const configPath = path.join(sectionPath, 'config.json');
    const config = readJsonFile<SectionConfig>(configPath);

    if (!config) return null;

    const iconPath = findIconFile(sectionPath);
    const subSectionDirs = getDirectories(sectionPath);

    let itemCount = 0;
    let subSectionCount = 0;
    let lastStudyAt: string | undefined;

    for (const subSectionDir of subSectionDirs) {
        const subSectionPath = path.join(sectionPath, subSectionDir);
        const subSectionConfigPath = path.join(subSectionPath, 'config.json');
        if (fs.existsSync(subSectionConfigPath)) {
            subSectionCount++;
            const itemDirs = getDirectories(subSectionPath);
            for (const itemDir of itemDirs) {
                const itemConfigPath = path.join(subSectionPath, itemDir, 'config.json');
                const itemConfig = readJsonFile<ItemConfig>(itemConfigPath);
                if (itemConfig) {
                    itemCount++;
                    if (itemConfig.last_study_at && (!lastStudyAt || itemConfig.last_study_at > lastStudyAt)) {
                        lastStudyAt = itemConfig.last_study_at;
                    }
                }
            }
        }
    }

    return {
        id: sectionId,
        category_id: categoryId,
        name: config.name,
        description: config.description,
        logo_path: iconPath ? getRelativePath(iconPath) : undefined,
        color: config.color || '#8B5CF6',
        sort_weight: config.sort_weight || 0,
        dir_name: dirName,
        subsection_count: subSectionCount,
        item_count: itemCount,
        last_study_at: lastStudyAt,
        created_at: config.created_at,
        updated_at: config.updated_at
    };
}

export function createSection(categoryId: string, data: { name: string; description?: string; color?: string; sort_weight?: number; dir_name: string }): Section {
    const dirName = data.dir_name || generateDirName(data.name);
    const sectionPath = path.join(getKnowledgeRoot(), categoryId, dirName);
    ensureDir(sectionPath);

    const now = new Date().toISOString();
    const config: SectionConfig = {
        name: data.name,
        description: data.description,
        color: data.color || '#8B5CF6',
        sort_weight: data.sort_weight || 0,
        created_at: now,
        updated_at: now
    };

    writeJsonFile(path.join(sectionPath, 'config.json'), config);

    return {
        id: `${categoryId}/${dirName}`,
        category_id: categoryId,
        name: config.name,
        description: config.description,
        color: config.color,
        sort_weight: config.sort_weight || 0,
        dir_name: dirName,
        subsection_count: 0,
        item_count: 0,
        created_at: config.created_at,
        updated_at: config.updated_at
    };
}

export function updateSection(sectionId: string, data: { name?: string; description?: string; color?: string; sort_weight?: number }): boolean {
    const parts = sectionId.split('/');
    if (parts.length !== 2) return false;

    const [categoryId, dirName] = parts;
    const sectionPath = path.join(getKnowledgeRoot(), categoryId, dirName);
    const configPath = path.join(sectionPath, 'config.json');
    const config = readJsonFile<SectionConfig>(configPath);

    if (!config) return false;

    const updatedConfig: SectionConfig = {
        ...config,
        name: data.name ?? config.name,
        description: data.description ?? config.description,
        color: data.color ?? config.color,
        sort_weight: data.sort_weight ?? config.sort_weight,
        updated_at: new Date().toISOString()
    };

    writeJsonFile(configPath, updatedConfig);
    return true;
}

export function deleteSection(sectionId: string): { success: boolean; error?: string } {
    const parts = sectionId.split('/');
    if (parts.length !== 2) return { success: false, error: '无效的板块ID' };

    const [categoryId, dirName] = parts;
    const sectionPath = path.join(getKnowledgeRoot(), categoryId, dirName);

    if (!fs.existsSync(sectionPath)) {
        return { success: false, error: '二级板块不存在' };
    }

    // 检查是否有三级板块
    const subSectionDirs = getDirectories(sectionPath);
    const hasSubSections = subSectionDirs.some(dir => {
        const configPath = path.join(sectionPath, dir, 'config.json');
        return fs.existsSync(configPath);
    });

    if (hasSubSections) {
        return { success: false, error: '请先删除所有三级板块' };
    }

    fs.rmSync(sectionPath, { recursive: true });
    return { success: true };
}

// ============ 三级板块操作 ============

export function getSubSectionsBySection(sectionId: string): SubSection[] {
    const parts = sectionId.split('/');
    if (parts.length !== 2) return [];

    const [categoryId, sectionDirName] = parts;
    const sectionPath = path.join(getKnowledgeRoot(), categoryId, sectionDirName);
    const dirs = getDirectories(sectionPath);
    const subSections: SubSection[] = [];

    for (const dirName of dirs) {
        const subSectionPath = path.join(sectionPath, dirName);
        const configPath = path.join(subSectionPath, 'config.json');
        const config = readJsonFile<SubSectionConfig>(configPath);

        if (config) {
            const iconPath = findIconFile(subSectionPath);
            const itemDirs = getDirectories(subSectionPath);

            let itemCount = 0;
            let lastStudyAt: string | undefined;

            for (const itemDir of itemDirs) {
                const itemConfigPath = path.join(subSectionPath, itemDir, 'config.json');
                const itemConfig = readJsonFile<ItemConfig>(itemConfigPath);
                if (itemConfig) {
                    itemCount++;
                    if (itemConfig.last_study_at && (!lastStudyAt || itemConfig.last_study_at > lastStudyAt)) {
                        lastStudyAt = itemConfig.last_study_at;
                    }
                }
            }

            subSections.push({
                id: `${sectionId}/${dirName}`,
                section_id: sectionId,
                category_id: categoryId,
                name: config.name,
                description: config.description,
                logo_path: iconPath ? getRelativePath(iconPath) : undefined,
                color: config.color || '#10B981',
                sort_weight: config.sort_weight || 0,
                dir_name: dirName,
                item_count: itemCount,
                last_study_at: lastStudyAt,
                created_at: config.created_at,
                updated_at: config.updated_at
            });
        }
    }

    subSections.sort((a, b) => a.sort_weight - b.sort_weight);
    return subSections;
}

export function getSubSectionById(subSectionId: string): SubSection | null {
    const parts = subSectionId.split('/');
    if (parts.length !== 3) return null;

    const [categoryId, sectionDirName, dirName] = parts;
    const subSectionPath = path.join(getKnowledgeRoot(), categoryId, sectionDirName, dirName);
    const configPath = path.join(subSectionPath, 'config.json');
    const config = readJsonFile<SubSectionConfig>(configPath);

    if (!config) return null;

    // 获取上级信息
    const sectionConfigPath = path.join(getKnowledgeRoot(), categoryId, sectionDirName, 'config.json');
    const sectionConfig = readJsonFile<SectionConfig>(sectionConfigPath);
    const categoryConfigPath = path.join(getKnowledgeRoot(), categoryId, 'config.json');
    const categoryConfig = readJsonFile<CategoryConfig>(categoryConfigPath);

    const iconPath = findIconFile(subSectionPath);
    const itemDirs = getDirectories(subSectionPath);

    let itemCount = 0;
    let lastStudyAt: string | undefined;

    for (const itemDir of itemDirs) {
        const itemConfigPath = path.join(subSectionPath, itemDir, 'config.json');
        const itemConfig = readJsonFile<ItemConfig>(itemConfigPath);
        if (itemConfig) {
            itemCount++;
            if (itemConfig.last_study_at && (!lastStudyAt || itemConfig.last_study_at > lastStudyAt)) {
                lastStudyAt = itemConfig.last_study_at;
            }
        }
    }

    return {
        id: subSectionId,
        section_id: `${categoryId}/${sectionDirName}`,
        category_id: categoryId,
        name: config.name,
        description: config.description,
        logo_path: iconPath ? getRelativePath(iconPath) : undefined,
        color: config.color || '#10B981',
        sort_weight: config.sort_weight || 0,
        dir_name: dirName,
        item_count: itemCount,
        last_study_at: lastStudyAt,
        section_name: sectionConfig?.name,
        section_dir: sectionDirName,
        category_name: categoryConfig?.name,
        category_dir: categoryId,
        created_at: config.created_at,
        updated_at: config.updated_at
    };
}

export function createSubSection(sectionId: string, data: { name: string; description?: string; color?: string; sort_weight?: number; dir_name: string }): SubSection | null {
    const parts = sectionId.split('/');
    if (parts.length !== 2) return null;

    const [categoryId, sectionDirName] = parts;
    const dirName = data.dir_name || generateDirName(data.name);
    const subSectionPath = path.join(getKnowledgeRoot(), categoryId, sectionDirName, dirName);
    ensureDir(subSectionPath);

    const now = new Date().toISOString();
    const config: SubSectionConfig = {
        name: data.name,
        description: data.description,
        color: data.color || '#10B981',
        sort_weight: data.sort_weight || 0,
        created_at: now,
        updated_at: now
    };

    writeJsonFile(path.join(subSectionPath, 'config.json'), config);

    return {
        id: `${sectionId}/${dirName}`,
        section_id: sectionId,
        category_id: categoryId,
        name: config.name,
        description: config.description,
        color: config.color,
        sort_weight: config.sort_weight || 0,
        dir_name: dirName,
        item_count: 0,
        created_at: config.created_at,
        updated_at: config.updated_at
    };
}

export function updateSubSection(subSectionId: string, data: { name?: string; description?: string; color?: string; sort_weight?: number }): boolean {
    const parts = subSectionId.split('/');
    if (parts.length !== 3) return false;

    const [categoryId, sectionDirName, dirName] = parts;
    const subSectionPath = path.join(getKnowledgeRoot(), categoryId, sectionDirName, dirName);
    const configPath = path.join(subSectionPath, 'config.json');
    const config = readJsonFile<SubSectionConfig>(configPath);

    if (!config) return false;

    const updatedConfig: SubSectionConfig = {
        ...config,
        name: data.name ?? config.name,
        description: data.description ?? config.description,
        color: data.color ?? config.color,
        sort_weight: data.sort_weight ?? config.sort_weight,
        updated_at: new Date().toISOString()
    };

    writeJsonFile(configPath, updatedConfig);
    return true;
}

export function deleteSubSection(subSectionId: string): { success: boolean; error?: string } {
    const parts = subSectionId.split('/');
    if (parts.length !== 3) return { success: false, error: '无效的板块ID' };

    const [categoryId, sectionDirName, dirName] = parts;
    const subSectionPath = path.join(getKnowledgeRoot(), categoryId, sectionDirName, dirName);

    if (!fs.existsSync(subSectionPath)) {
        return { success: false, error: '三级板块不存在' };
    }

    // 检查是否有知识条目
    const itemDirs = getDirectories(subSectionPath);
    const hasItems = itemDirs.some(dir => {
        const configPath = path.join(subSectionPath, dir, 'config.json');
        return fs.existsSync(configPath);
    });

    if (hasItems) {
        return { success: false, error: '请先删除所有知识条目' };
    }

    fs.rmSync(subSectionPath, { recursive: true });
    return { success: true };
}

// ============ 知识条目操作 ============

export function getItemsBySubSection(subSectionId: string): Item[] {
    const parts = subSectionId.split('/');
    if (parts.length !== 3) return [];

    const [categoryId, sectionDirName, subSectionDirName] = parts;
    const subSectionPath = path.join(getKnowledgeRoot(), categoryId, sectionDirName, subSectionDirName);
    const dirs = getDirectories(subSectionPath);
    const items: Item[] = [];

    for (const dirName of dirs) {
        const itemPath = path.join(subSectionPath, dirName);
        const configPath = path.join(itemPath, 'config.json');
        const config = readJsonFile<ItemConfig>(configPath);

        if (config) {
            // 转换媒体文件路径为完整相对路径
            const toFullPaths = (files: string[] | undefined): string => {
                if (!files || files.length === 0) return '[]';
                const fullPaths = files.map(f => getRelativePath(path.join(itemPath, f)));
                return JSON.stringify(fullPaths);
            };

            items.push({
                id: `${subSectionId}/${dirName}`,
                subsection_id: subSectionId,
                section_id: `${categoryId}/${sectionDirName}`,
                name: config.name,
                keywords: config.keywords,
                brief_note: config.brief_note,
                summary: config.summary,
                detail: config.detail,
                sort_weight: config.sort_weight || 0,
                audio_paths: toFullPaths(config.audio_files),
                image_paths: toFullPaths(config.image_files),
                video_paths: toFullPaths(config.video_files),
                correct_count: config.correct_count || 0,
                wrong_count: config.wrong_count || 0,
                consecutive_correct: config.consecutive_correct || 0,
                consecutive_wrong: config.consecutive_wrong || 0,
                last_study_at: config.last_study_at,
                last_correct_at: config.last_correct_at,
                last_wrong_at: config.last_wrong_at,
                created_at: config.created_at,
                updated_at: config.updated_at
            });
        }
    }

    items.sort((a, b) => a.sort_weight - b.sort_weight);
    return items;
}

export function getItemById(itemId: string): Item | null {
    const parts = itemId.split('/');
    if (parts.length !== 4) return null;

    const [categoryId, sectionDirName, subSectionDirName, dirName] = parts;
    const itemPath = path.join(getKnowledgeRoot(), categoryId, sectionDirName, subSectionDirName, dirName);
    const configPath = path.join(itemPath, 'config.json');
    const config = readJsonFile<ItemConfig>(configPath);

    if (!config) return null;

    const toFullPaths = (files: string[] | undefined): string => {
        if (!files || files.length === 0) return '[]';
        const fullPaths = files.map(f => getRelativePath(path.join(itemPath, f)));
        return JSON.stringify(fullPaths);
    };

    return {
        id: itemId,
        subsection_id: `${categoryId}/${sectionDirName}/${subSectionDirName}`,
        section_id: `${categoryId}/${sectionDirName}`,
        name: config.name,
        keywords: config.keywords,
        brief_note: config.brief_note,
        summary: config.summary,
        detail: config.detail,
        sort_weight: config.sort_weight || 0,
        audio_paths: toFullPaths(config.audio_files),
        image_paths: toFullPaths(config.image_files),
        video_paths: toFullPaths(config.video_files),
        correct_count: config.correct_count || 0,
        wrong_count: config.wrong_count || 0,
        consecutive_correct: config.consecutive_correct || 0,
        consecutive_wrong: config.consecutive_wrong || 0,
        last_study_at: config.last_study_at,
        last_correct_at: config.last_correct_at,
        last_wrong_at: config.last_wrong_at,
        created_at: config.created_at,
        updated_at: config.updated_at
    };
}

export function createItem(subSectionId: string, data: {
    name: string;
    keywords?: string;
    brief_note?: string;
    summary?: string;
    detail?: string;
    sort_weight?: number;
    temp_files?: string[];  // 临时文件路径列表
}): Item | null {
    const parts = subSectionId.split('/');
    if (parts.length !== 3) return null;

    const [categoryId, sectionDirName, subSectionDirName] = parts;
    const parentPath = path.join(getKnowledgeRoot(), categoryId, sectionDirName, subSectionDirName);
    const baseDirName = generateDirName(data.name, data.keywords);
    const dirName = ensureUniqueDirName(parentPath, baseDirName);
    const itemPath = path.join(parentPath, dirName);
    ensureDir(itemPath);

    const now = new Date().toISOString();

    // 处理临时文件：移动到知识条目目录
    const audioFiles: string[] = [];
    const imageFiles: string[] = [];
    const videoFiles: string[] = [];

    if (data.temp_files && data.temp_files.length > 0) {
        const tempDir = path.join(getKnowledgeRoot(), '.temp');
        for (const tempFile of data.temp_files) {
            const tempFilePath = path.join(tempDir, tempFile);
            if (fs.existsSync(tempFilePath)) {
                const destPath = path.join(itemPath, tempFile);
                fs.renameSync(tempFilePath, destPath);

                // 根据文件前缀分类
                if (tempFile.startsWith('img_')) {
                    imageFiles.push(tempFile);
                } else if (tempFile.startsWith('aud_')) {
                    audioFiles.push(tempFile);
                } else if (tempFile.startsWith('vid_')) {
                    videoFiles.push(tempFile);
                }
            }
        }
    }

    const config: ItemConfig = {
        name: data.name,
        keywords: data.keywords,
        brief_note: data.brief_note,
        summary: data.summary,
        detail: data.detail,
        sort_weight: data.sort_weight || 0,
        audio_files: audioFiles,
        image_files: imageFiles,
        video_files: videoFiles,
        correct_count: 0,
        wrong_count: 0,
        consecutive_correct: 0,
        consecutive_wrong: 0,
        created_at: now,
        updated_at: now
    };

    writeJsonFile(path.join(itemPath, 'config.json'), config);

    // 构建返回的路径
    const toFullPaths = (files: string[]): string => {
        if (files.length === 0) return '[]';
        const fullPaths = files.map(f => getRelativePath(path.join(itemPath, f)));
        return JSON.stringify(fullPaths);
    };

    return {
        id: `${subSectionId}/${dirName}`,
        subsection_id: subSectionId,
        section_id: `${categoryId}/${sectionDirName}`,
        name: config.name,
        keywords: config.keywords,
        brief_note: config.brief_note,
        summary: config.summary,
        detail: config.detail,
        sort_weight: config.sort_weight || 0,
        audio_paths: toFullPaths(audioFiles),
        image_paths: toFullPaths(imageFiles),
        video_paths: toFullPaths(videoFiles),
        correct_count: 0,
        wrong_count: 0,
        consecutive_correct: 0,
        consecutive_wrong: 0,
        created_at: config.created_at,
        updated_at: config.updated_at
    };
}

export function updateItem(itemId: string, data: {
    name?: string;
    keywords?: string;
    brief_note?: string;
    summary?: string;
    detail?: string;
    sort_weight?: number;
    audio_files?: string[];
    image_files?: string[];
    video_files?: string[];
}): boolean {
    const parts = itemId.split('/');
    if (parts.length !== 4) return false;

    const [categoryId, sectionDirName, subSectionDirName, dirName] = parts;
    const itemPath = path.join(getKnowledgeRoot(), categoryId, sectionDirName, subSectionDirName, dirName);
    const configPath = path.join(itemPath, 'config.json');
    const config = readJsonFile<ItemConfig>(configPath);

    if (!config) return false;

    const updatedConfig: ItemConfig = {
        ...config,
        name: data.name ?? config.name,
        keywords: data.keywords ?? config.keywords,
        brief_note: data.brief_note ?? config.brief_note,
        summary: data.summary ?? config.summary,
        detail: data.detail ?? config.detail,
        sort_weight: data.sort_weight ?? config.sort_weight,
        audio_files: data.audio_files ?? config.audio_files,
        image_files: data.image_files ?? config.image_files,
        video_files: data.video_files ?? config.video_files,
        updated_at: new Date().toISOString()
    };

    writeJsonFile(configPath, updatedConfig);
    return true;
}

export function deleteItem(itemId: string): { success: boolean; error?: string } {
    const parts = itemId.split('/');
    if (parts.length !== 4) return { success: false, error: '无效的知识条目ID' };

    const [categoryId, sectionDirName, subSectionDirName, dirName] = parts;
    const itemPath = path.join(getKnowledgeRoot(), categoryId, sectionDirName, subSectionDirName, dirName);

    if (!fs.existsSync(itemPath)) {
        return { success: false, error: '知识条目不存在' };
    }

    fs.rmSync(itemPath, { recursive: true });
    return { success: true };
}

export function updateItemStudy(itemId: string, isCorrect: boolean): boolean {
    const parts = itemId.split('/');
    if (parts.length !== 4) return false;

    const [categoryId, sectionDirName, subSectionDirName, dirName] = parts;
    const itemPath = path.join(getKnowledgeRoot(), categoryId, sectionDirName, subSectionDirName, dirName);
    const configPath = path.join(itemPath, 'config.json');
    const config = readJsonFile<ItemConfig>(configPath);

    if (!config) return false;

    const now = new Date().toISOString();
    const updatedConfig: ItemConfig = {
        ...config,
        correct_count: (config.correct_count || 0) + (isCorrect ? 1 : 0),
        wrong_count: (config.wrong_count || 0) + (isCorrect ? 0 : 1),
        consecutive_correct: isCorrect ? (config.consecutive_correct || 0) + 1 : 0,
        consecutive_wrong: isCorrect ? 0 : (config.consecutive_wrong || 0) + 1,
        last_study_at: now,
        last_correct_at: isCorrect ? now : config.last_correct_at,
        last_wrong_at: isCorrect ? config.last_wrong_at : now,
        updated_at: now
    };

    writeJsonFile(configPath, updatedConfig);
    return true;
}

export function clearItemStudyRecord(itemId: string): boolean {
    const parts = itemId.split('/');
    if (parts.length !== 4) return false;

    const [categoryId, sectionDirName, subSectionDirName, dirName] = parts;
    const itemPath = path.join(getKnowledgeRoot(), categoryId, sectionDirName, subSectionDirName, dirName);
    const configPath = path.join(itemPath, 'config.json');
    const config = readJsonFile<ItemConfig>(configPath);

    if (!config) return false;

    const updatedConfig: ItemConfig = {
        ...config,
        correct_count: 0,
        wrong_count: 0,
        consecutive_correct: 0,
        consecutive_wrong: 0,
        last_study_at: undefined,
        last_correct_at: undefined,
        last_wrong_at: undefined,
        updated_at: new Date().toISOString()
    };

    writeJsonFile(configPath, updatedConfig);
    return true;
}

export function clearSubSectionStudyRecords(subSectionId: string): boolean {
    const items = getItemsBySubSection(subSectionId);
    for (const item of items) {
        clearItemStudyRecord(item.id);
    }
    return true;
}

// ============ 文件上传相关 ============

export function getItemPath(itemId: string): string | null {
    const parts = itemId.split('/');
    if (parts.length !== 4) return null;

    const [categoryId, sectionDirName, subSectionDirName, dirName] = parts;
    return path.join(getKnowledgeRoot(), categoryId, sectionDirName, subSectionDirName, dirName);
}

export function getSubSectionPath(subSectionId: string): string | null {
    const parts = subSectionId.split('/');
    if (parts.length !== 3) return null;

    const [categoryId, sectionDirName, subSectionDirName] = parts;
    return path.join(getKnowledgeRoot(), categoryId, sectionDirName, subSectionDirName);
}

export function getSectionPath(sectionId: string): string | null {
    const parts = sectionId.split('/');
    if (parts.length !== 2) return null;

    const [categoryId, sectionDirName] = parts;
    return path.join(getKnowledgeRoot(), categoryId, sectionDirName);
}

export function getCategoryPath(categoryId: string): string | null {
    return path.join(getKnowledgeRoot(), categoryId);
}

export function addMediaToItem(itemId: string, type: 'audio' | 'image' | 'video', fileName: string): boolean {
    const parts = itemId.split('/');
    if (parts.length !== 4) return false;

    const [categoryId, sectionDirName, subSectionDirName, dirName] = parts;
    const itemPath = path.join(getKnowledgeRoot(), categoryId, sectionDirName, subSectionDirName, dirName);
    const configPath = path.join(itemPath, 'config.json');
    const config = readJsonFile<ItemConfig>(configPath);

    if (!config) return false;

    const fieldName = `${type}_files` as keyof ItemConfig;
    const currentFiles = (config[fieldName] as string[]) || [];
    currentFiles.push(fileName);

    const updatedConfig: ItemConfig = {
        ...config,
        [fieldName]: currentFiles,
        updated_at: new Date().toISOString()
    };

    writeJsonFile(configPath, updatedConfig);
    return true;
}

export function removeMediaFromItem(itemId: string, type: 'audio' | 'image' | 'video', fileName: string): boolean {
    const parts = itemId.split('/');
    if (parts.length !== 4) return false;

    const [categoryId, sectionDirName, subSectionDirName, dirName] = parts;
    const itemPath = path.join(getKnowledgeRoot(), categoryId, sectionDirName, subSectionDirName, dirName);
    const configPath = path.join(itemPath, 'config.json');
    const config = readJsonFile<ItemConfig>(configPath);

    if (!config) return false;

    const fieldName = `${type}_files` as keyof ItemConfig;
    const currentFiles = (config[fieldName] as string[]) || [];
    const index = currentFiles.indexOf(fileName);
    if (index > -1) {
        currentFiles.splice(index, 1);
    }

    const updatedConfig: ItemConfig = {
        ...config,
        [fieldName]: currentFiles,
        updated_at: new Date().toISOString()
    };

    writeJsonFile(configPath, updatedConfig);

    // 删除文件
    const filePath = path.join(itemPath, fileName);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }

    return true;
}

// 临时文件上传目录管理
export function getTempDir(): string {
    const tempDir = path.join(getKnowledgeRoot(), '.temp');
    ensureDir(tempDir);
    return tempDir;
}

// 生成临时文件名
export function generateTempFileName(type: 'audio' | 'image' | 'video', originalName: string): string {
    const ext = path.extname(originalName).toLowerCase();
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);

    const prefix = type === 'audio' ? 'aud' : type === 'image' ? 'img' : 'vid';
    return `${prefix}_${timestamp}_${random}${ext}`;
}

// 保存临时文件
export function saveTempFile(data: Buffer, fileName: string): string {
    const tempDir = getTempDir();
    const filePath = path.join(tempDir, fileName);
    fs.writeFileSync(filePath, data);
    return fileName;
}

// 清理临时文件
export function cleanupTempFiles(fileNames: string[]): void {
    const tempDir = getTempDir();
    for (const fileName of fileNames) {
        const filePath = path.join(tempDir, fileName);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }
}

// 清理过期的临时文件（超过24小时）
export function cleanupExpiredTempFiles(): number {
    const tempDir = path.join(getKnowledgeRoot(), '.temp');
    if (!fs.existsSync(tempDir)) return 0;

    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24小时
    let cleaned = 0;

    const files = fs.readdirSync(tempDir);
    for (const file of files) {
        const filePath = path.join(tempDir, file);
        const stat = fs.statSync(filePath);
        if (now - stat.mtimeMs > maxAge) {
            fs.unlinkSync(filePath);
            cleaned++;
        }
    }

    return cleaned;
}

// 获取临时文件的相对路径（用于前端预览）
export function getTempFileRelativePath(fileName: string): string {
    return `knowledgeFiles/.temp/${fileName}`;
}

// 导出知识库根目录获取函数
export { getKnowledgeRoot };
