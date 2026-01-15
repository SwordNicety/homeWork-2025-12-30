import fs from 'fs';
import path from 'path';
import { getHonorsDataPath } from './deployConfigManager.js';

// 获取数据目录（从配置读取）
function getDataDir(): string {
    return getHonorsDataPath();
}

function getHallsFilePath(): string {
    return path.join(getDataDir(), 'halls.json');
}

function getHonorsFilePath(): string {
    return path.join(getDataDir(), 'honors.json');
}

// 荣誉室（一级板块）
export interface HonorHall {
    id: string;
    name: string;
    icon: string | null; // 图标路径
    sort_weight: number;
    created_at: string;
    updated_at: string;
}

// 荣誉条目
export interface Honor {
    id: string;
    hall_id: string; // 所属荣誉室ID
    name: string; // 荣誉名
    honor_date: {
        year: number;
        month: number | null; // 可为空
        day: number | null; // 可为空
    };
    images: string[]; // 图片路径数组，第一张为封面
    videos: string[]; // 视频路径数组
    voice_recordings: string[]; // 内心感想录音
    description: string; // 荣誉介绍（markdown格式）
    honor_type: string; // 荣誉类型
    glory_level: number; // 荣耀度 1-10
    sort_weight: number; // 排序权重
    created_at: string;
    updated_at: string;
}

// 确保数据目录存在
function ensureDataDir(): void {
    const dataDir = getDataDir();
    const hallsFile = getHallsFilePath();
    const honorsFile = getHonorsFilePath();

    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    if (!fs.existsSync(hallsFile)) {
        fs.writeFileSync(hallsFile, JSON.stringify([], null, 2));
    }
    if (!fs.existsSync(honorsFile)) {
        fs.writeFileSync(honorsFile, JSON.stringify([], null, 2));
    }
}

// 读取荣誉室列表
function readHalls(): HonorHall[] {
    ensureDataDir();
    const content = fs.readFileSync(getHallsFilePath(), 'utf-8');
    return JSON.parse(content);
}

// 写入荣誉室列表
function writeHalls(halls: HonorHall[]): void {
    ensureDataDir();
    fs.writeFileSync(getHallsFilePath(), JSON.stringify(halls, null, 2));
}

// 读取荣誉列表
function readHonors(): Honor[] {
    ensureDataDir();
    const content = fs.readFileSync(getHonorsFilePath(), 'utf-8');
    return JSON.parse(content);
}

// 写入荣誉列表
function writeHonors(honors: Honor[]): void {
    ensureDataDir();
    fs.writeFileSync(getHonorsFilePath(), JSON.stringify(honors, null, 2));
}

// 生成唯一ID
function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

// ============ 荣誉室 CRUD ============

export function getAllHalls(): HonorHall[] {
    const halls = readHalls();
    return halls.sort((a, b) => (b.sort_weight || 0) - (a.sort_weight || 0));
}

export function getHallById(id: string): HonorHall | null {
    const halls = readHalls();
    return halls.find(h => h.id === id) || null;
}

export function createHall(data: { name: string; icon?: string | null; sort_weight?: number }): HonorHall {
    const halls = readHalls();
    const now = new Date().toISOString();

    const hall: HonorHall = {
        id: generateId(),
        name: data.name,
        icon: data.icon || null,
        sort_weight: data.sort_weight || 0,
        created_at: now,
        updated_at: now
    };

    halls.push(hall);
    writeHalls(halls);
    return hall;
}

export function updateHall(id: string, data: Partial<Omit<HonorHall, 'id' | 'created_at'>>): boolean {
    const halls = readHalls();
    const index = halls.findIndex(h => h.id === id);
    if (index === -1) return false;

    halls[index] = {
        ...halls[index],
        ...data,
        updated_at: new Date().toISOString()
    };
    writeHalls(halls);
    return true;
}

export function deleteHall(id: string): boolean {
    const halls = readHalls();
    const index = halls.findIndex(h => h.id === id);
    if (index === -1) return false;

    halls.splice(index, 1);
    writeHalls(halls);

    // 同时删除该荣誉室下的所有荣誉
    const honors = readHonors();
    const filteredHonors = honors.filter(h => h.hall_id !== id);
    writeHonors(filteredHonors);

    return true;
}

// ============ 荣誉 CRUD ============

export function getHonorsByHallId(hallId: string): Honor[] {
    const honors = readHonors();
    return honors
        .filter(h => h.hall_id === hallId)
        .sort((a, b) => (b.sort_weight || 0) - (a.sort_weight || 0));
}

export function getHonorById(id: string): Honor | null {
    const honors = readHonors();
    return honors.find(h => h.id === id) || null;
}

export function createHonor(data: {
    hall_id: string;
    name: string;
    honor_date: { year: number; month: number | null; day: number | null };
    images?: string[];
    videos?: string[];
    voice_recordings?: string[];
    description?: string;
    honor_type?: string;
    glory_level?: number;
    sort_weight?: number;
}): Honor {
    const honors = readHonors();
    const now = new Date().toISOString();

    const honor: Honor = {
        id: generateId(),
        hall_id: data.hall_id,
        name: data.name,
        honor_date: data.honor_date,
        images: data.images || [],
        videos: data.videos || [],
        voice_recordings: data.voice_recordings || [],
        description: data.description || '',
        honor_type: data.honor_type || '',
        glory_level: data.glory_level || 5,
        sort_weight: data.sort_weight || 0,
        created_at: now,
        updated_at: now
    };

    honors.push(honor);
    writeHonors(honors);
    return honor;
}

export function updateHonor(id: string, data: Partial<Omit<Honor, 'id' | 'created_at'>>): boolean {
    const honors = readHonors();
    const index = honors.findIndex(h => h.id === id);
    if (index === -1) return false;

    honors[index] = {
        ...honors[index],
        ...data,
        updated_at: new Date().toISOString()
    };
    writeHonors(honors);
    return true;
}

export function deleteHonor(id: string): boolean {
    const honors = readHonors();
    const index = honors.findIndex(h => h.id === id);
    if (index === -1) return false;

    honors.splice(index, 1);
    writeHonors(honors);
    return true;
}

// ============ 辅助功能 ============

// 获取所有已使用的荣誉类型（用于输入提示）
export function getAllHonorTypes(): string[] {
    const honors = readHonors();
    const types = new Set<string>();
    honors.forEach(h => {
        if (h.honor_type && h.honor_type.trim()) {
            types.add(h.honor_type.trim());
        }
    });
    return Array.from(types).sort();
}

// 按荣耀度分组获取荣誉
export function getHonorsGroupedByGloryLevel(hallId: string): Map<number, Honor[]> {
    const honors = getHonorsByHallId(hallId);
    const grouped = new Map<number, Honor[]>();

    for (let i = 10; i >= 1; i--) {
        const levelHonors = honors.filter(h => h.glory_level === i);
        if (levelHonors.length > 0) {
            grouped.set(i, levelHonors.sort((a, b) => (b.sort_weight || 0) - (a.sort_weight || 0)));
        }
    }

    return grouped;
}

// 按年份分组获取荣誉
export function getHonorsGroupedByYear(hallId: string): Map<number, Honor[]> {
    const honors = getHonorsByHallId(hallId);
    const grouped = new Map<number, Honor[]>();

    honors.forEach(h => {
        const year = h.honor_date.year;
        if (!grouped.has(year)) {
            grouped.set(year, []);
        }
        grouped.get(year)!.push(h);
    });

    // 按年份降序排列，组内按权重排序
    const sortedYears = Array.from(grouped.keys()).sort((a, b) => b - a);
    const result = new Map<number, Honor[]>();
    sortedYears.forEach(year => {
        const yearHonors = grouped.get(year)!;
        result.set(year, yearHonors.sort((a, b) => (b.sort_weight || 0) - (a.sort_weight || 0)));
    });

    return result;
}

// 按荣誉类型分组获取荣誉
export function getHonorsGroupedByType(hallId: string): Map<string, Honor[]> {
    const honors = getHonorsByHallId(hallId);
    const grouped = new Map<string, Honor[]>();

    honors.forEach(h => {
        const type = h.honor_type || '未分类';
        if (!grouped.has(type)) {
            grouped.set(type, []);
        }
        grouped.get(type)!.push(h);
    });

    // 组内按权重排序
    grouped.forEach((typeHonors, type) => {
        grouped.set(type, typeHonors.sort((a, b) => (b.sort_weight || 0) - (a.sort_weight || 0)));
    });

    return grouped;
}

// 获取荣誉室的统计信息
export function getHallStatistics(hallId: string): {
    totalCount: number;
    avgGloryLevel: number;
    typeCount: number;
    yearRange: { start: number; end: number } | null;
} {
    const honors = getHonorsByHallId(hallId);

    if (honors.length === 0) {
        return {
            totalCount: 0,
            avgGloryLevel: 0,
            typeCount: 0,
            yearRange: null
        };
    }

    const types = new Set(honors.map(h => h.honor_type || '未分类'));
    const years = honors.map(h => h.honor_date.year);
    const totalGlory = honors.reduce((sum, h) => sum + h.glory_level, 0);

    return {
        totalCount: honors.length,
        avgGloryLevel: Math.round(totalGlory / honors.length * 10) / 10,
        typeCount: types.size,
        yearRange: {
            start: Math.min(...years),
            end: Math.max(...years)
        }
    };
}

// 初始化
export function initHonorsDB(): void {
    ensureDataDir();
    console.log('荣誉室数据库已初始化');
}
