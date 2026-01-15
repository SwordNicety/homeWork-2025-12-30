import fs from 'fs';
import path from 'path';
import { getFamilyMembersDataPath } from './deployConfigManager.js';

// 获取数据存储根目录（从配置读取）
function getFileDBRoot(): string {
    return getFamilyMembersDataPath();
}

// ============ 类型定义 ============

export interface FamilyMember {
    id: string;  // 使用UUID或自增ID
    nickname: string;
    name?: string;
    birthday_text?: string;
    birthday_date?: string;
    zodiac_sign?: string;
    chinese_zodiac?: string;
    avatar_path?: string;
    gender?: string;
    sort_weight: number;
    created_at: string;
    updated_at: string;
}

export interface AttributeDefinition {
    id: string;
    attribute_name: string;
    attribute_type: 'integer' | 'string' | 'decimal' | 'checkbox' | 'image';
    options?: string;
    attribute_logo?: string;
    sort_weight: number;
    created_at: string;
    updated_at: string;
}

export interface AttributeValue {
    id: string;
    member_id: string;
    attribute_id: string;
    value_text?: string;
    value_number?: number;
    value_boolean?: number;
    value_image?: string;
    created_at: string;
    updated_at: string;
}

// 数据存储结构
interface FamilyMembersData {
    members: FamilyMember[];
    last_member_id: number;
}

interface AttributeDefinitionsData {
    definitions: AttributeDefinition[];
    last_definition_id: number;
}

interface AttributeValuesData {
    values: AttributeValue[];
    last_value_id: number;
}

// ============ 工具函数 ============

function ensureDir(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

function readJsonFile<T>(filePath: string, defaultValue: T): T {
    try {
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf-8');
            return JSON.parse(content);
        }
    } catch (error) {
        console.error(`Error reading ${filePath}:`, error);
    }
    return defaultValue;
}

function writeJsonFile(filePath: string, data: any): void {
    ensureDir(path.dirname(filePath));
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

function getNow(): string {
    return new Date().toISOString();
}

// ============ 文件路径 ============

function getMembersFilePath(): string {
    return path.join(getFileDBRoot(), 'members.json');
}

function getAttributeDefinitionsFilePath(): string {
    return path.join(getFileDBRoot(), 'attributeDefinitions.json');
}

function getAttributeValuesFilePath(): string {
    return path.join(getFileDBRoot(), 'attributeValues.json');
}

// ============ 初始化 ============

export function initFileDB(): void {
    ensureDir(getFileDBRoot());

    // 确保各数据文件存在
    if (!fs.existsSync(getMembersFilePath())) {
        writeJsonFile(getMembersFilePath(), { members: [], last_member_id: 0 });
    }
    if (!fs.existsSync(getAttributeDefinitionsFilePath())) {
        writeJsonFile(getAttributeDefinitionsFilePath(), { definitions: [], last_definition_id: 0 });
    }
    if (!fs.existsSync(getAttributeValuesFilePath())) {
        writeJsonFile(getAttributeValuesFilePath(), { values: [], last_value_id: 0 });
    }
}

// ============ 家庭成员 CRUD ============

export function getAllMembers(): FamilyMember[] {
    initFileDB();
    const data = readJsonFile<FamilyMembersData>(getMembersFilePath(), { members: [], last_member_id: 0 });
    // 按权重和ID排序
    return data.members.sort((a, b) => {
        if (a.sort_weight !== b.sort_weight) {
            return a.sort_weight - b.sort_weight;
        }
        return parseInt(a.id) - parseInt(b.id);
    });
}

export function getMemberById(id: string): FamilyMember | undefined {
    const members = getAllMembers();
    return members.find(m => m.id === id);
}

export function getMemberByNickname(nickname: string): FamilyMember | undefined {
    const members = getAllMembers();
    return members.find(m => m.nickname === nickname);
}

export function createMember(data: Omit<FamilyMember, 'id' | 'created_at' | 'updated_at' | 'sort_weight'> & { sort_weight?: number }): FamilyMember {
    initFileDB();
    const fileData = readJsonFile<FamilyMembersData>(getMembersFilePath(), { members: [], last_member_id: 0 });

    const newId = (fileData.last_member_id + 1).toString();
    const now = getNow();

    const member: FamilyMember = {
        id: newId,
        nickname: data.nickname,
        name: data.name,
        birthday_text: data.birthday_text,
        birthday_date: data.birthday_date,
        zodiac_sign: data.zodiac_sign,
        chinese_zodiac: data.chinese_zodiac,
        avatar_path: data.avatar_path,
        gender: data.gender,
        sort_weight: data.sort_weight || 0,
        created_at: now,
        updated_at: now
    };

    fileData.members.push(member);
    fileData.last_member_id = parseInt(newId);

    writeJsonFile(getMembersFilePath(), fileData);
    return member;
}

export function updateMember(id: string, data: Partial<Omit<FamilyMember, 'id' | 'created_at'>>): boolean {
    initFileDB();
    const fileData = readJsonFile<FamilyMembersData>(getMembersFilePath(), { members: [], last_member_id: 0 });

    const index = fileData.members.findIndex(m => m.id === id);
    if (index === -1) {
        return false;
    }

    fileData.members[index] = {
        ...fileData.members[index],
        ...data,
        updated_at: getNow()
    };

    writeJsonFile(getMembersFilePath(), fileData);
    return true;
}

export function deleteMember(id: string): boolean {
    initFileDB();
    const fileData = readJsonFile<FamilyMembersData>(getMembersFilePath(), { members: [], last_member_id: 0 });

    const index = fileData.members.findIndex(m => m.id === id);
    if (index === -1) {
        return false;
    }

    fileData.members.splice(index, 1);
    writeJsonFile(getMembersFilePath(), fileData);

    // 同时删除该成员的所有属性值
    deleteAttributeValuesByMember(id);

    return true;
}

// ============ 属性定义 CRUD ============

export function getAllAttributeDefinitions(): AttributeDefinition[] {
    initFileDB();
    const data = readJsonFile<AttributeDefinitionsData>(getAttributeDefinitionsFilePath(), { definitions: [], last_definition_id: 0 });
    // 按权重和ID排序
    return data.definitions.sort((a, b) => {
        if (a.sort_weight !== b.sort_weight) {
            return a.sort_weight - b.sort_weight;
        }
        return parseInt(a.id) - parseInt(b.id);
    });
}

export function getAttributeDefinitionById(id: string): AttributeDefinition | undefined {
    const definitions = getAllAttributeDefinitions();
    return definitions.find(d => d.id === id);
}

export function getAttributeDefinitionByName(name: string): AttributeDefinition | undefined {
    const definitions = getAllAttributeDefinitions();
    return definitions.find(d => d.attribute_name === name);
}

export function createAttributeDefinition(data: Omit<AttributeDefinition, 'id' | 'created_at' | 'updated_at' | 'sort_weight'> & { sort_weight?: number }): AttributeDefinition {
    initFileDB();
    const fileData = readJsonFile<AttributeDefinitionsData>(getAttributeDefinitionsFilePath(), { definitions: [], last_definition_id: 0 });

    const newId = (fileData.last_definition_id + 1).toString();
    const now = getNow();

    const definition: AttributeDefinition = {
        id: newId,
        attribute_name: data.attribute_name,
        attribute_type: data.attribute_type,
        options: data.options,
        attribute_logo: data.attribute_logo,
        sort_weight: data.sort_weight || 0,
        created_at: now,
        updated_at: now
    };

    fileData.definitions.push(definition);
    fileData.last_definition_id = parseInt(newId);

    writeJsonFile(getAttributeDefinitionsFilePath(), fileData);
    return definition;
}

export function updateAttributeDefinition(id: string, data: Partial<Omit<AttributeDefinition, 'id' | 'created_at'>>): boolean {
    initFileDB();
    const fileData = readJsonFile<AttributeDefinitionsData>(getAttributeDefinitionsFilePath(), { definitions: [], last_definition_id: 0 });

    const index = fileData.definitions.findIndex(d => d.id === id);
    if (index === -1) {
        return false;
    }

    fileData.definitions[index] = {
        ...fileData.definitions[index],
        ...data,
        updated_at: getNow()
    };

    writeJsonFile(getAttributeDefinitionsFilePath(), fileData);
    return true;
}

export function deleteAttributeDefinition(id: string): boolean {
    initFileDB();
    const fileData = readJsonFile<AttributeDefinitionsData>(getAttributeDefinitionsFilePath(), { definitions: [], last_definition_id: 0 });

    const index = fileData.definitions.findIndex(d => d.id === id);
    if (index === -1) {
        return false;
    }

    fileData.definitions.splice(index, 1);
    writeJsonFile(getAttributeDefinitionsFilePath(), fileData);

    // 同时删除该属性的所有值
    deleteAttributeValuesByDefinition(id);

    return true;
}

// ============ 属性值 CRUD ============

export function getAllAttributeValues(): AttributeValue[] {
    initFileDB();
    const data = readJsonFile<AttributeValuesData>(getAttributeValuesFilePath(), { values: [], last_value_id: 0 });
    return data.values;
}

export function getAttributeValuesByMember(memberId: string): (AttributeValue & { attribute_name?: string; attribute_type?: string; attribute_logo?: string })[] {
    const values = getAllAttributeValues().filter(v => v.member_id === memberId);
    const definitions = getAllAttributeDefinitions();

    return values.map(v => {
        const def = definitions.find(d => d.id === v.attribute_id);
        return {
            ...v,
            attribute_name: def?.attribute_name,
            attribute_type: def?.attribute_type,
            attribute_logo: def?.attribute_logo
        };
    }).sort((a, b) => {
        const defA = definitions.find(d => d.id === a.attribute_id);
        const defB = definitions.find(d => d.id === b.attribute_id);
        const weightA = defA?.sort_weight || 0;
        const weightB = defB?.sort_weight || 0;
        if (weightA !== weightB) return weightA - weightB;
        return parseInt(a.id) - parseInt(b.id);
    });
}

export function getAllAttributeValuesWithDetails(): (AttributeValue & { attribute_name?: string; attribute_type?: string; nickname?: string })[] {
    const values = getAllAttributeValues();
    const definitions = getAllAttributeDefinitions();
    const members = getAllMembers();

    return values.map(v => {
        const def = definitions.find(d => d.id === v.attribute_id);
        const member = members.find(m => m.id === v.member_id);
        return {
            ...v,
            attribute_name: def?.attribute_name,
            attribute_type: def?.attribute_type,
            nickname: member?.nickname
        };
    });
}

export function getAttributeValue(memberId: string, attributeId: string): AttributeValue | undefined {
    const values = getAllAttributeValues();
    return values.find(v => v.member_id === memberId && v.attribute_id === attributeId);
}

export function setAttributeValue(data: {
    member_id: string;
    attribute_id: string;
    value_text?: string;
    value_number?: number;
    value_boolean?: number;
    value_image?: string;
}): AttributeValue {
    initFileDB();
    const fileData = readJsonFile<AttributeValuesData>(getAttributeValuesFilePath(), { values: [], last_value_id: 0 });

    const existingIndex = fileData.values.findIndex(
        v => v.member_id === data.member_id && v.attribute_id === data.attribute_id
    );

    const now = getNow();

    if (existingIndex >= 0) {
        // 更新现有值
        fileData.values[existingIndex] = {
            ...fileData.values[existingIndex],
            value_text: data.value_text,
            value_number: data.value_number,
            value_boolean: data.value_boolean,
            value_image: data.value_image,
            updated_at: now
        };
        writeJsonFile(getAttributeValuesFilePath(), fileData);
        return fileData.values[existingIndex];
    } else {
        // 创建新值
        const newId = (fileData.last_value_id + 1).toString();
        const value: AttributeValue = {
            id: newId,
            member_id: data.member_id,
            attribute_id: data.attribute_id,
            value_text: data.value_text,
            value_number: data.value_number,
            value_boolean: data.value_boolean,
            value_image: data.value_image,
            created_at: now,
            updated_at: now
        };

        fileData.values.push(value);
        fileData.last_value_id = parseInt(newId);

        writeJsonFile(getAttributeValuesFilePath(), fileData);
        return value;
    }
}

export function deleteAttributeValue(id: string): boolean {
    initFileDB();
    const fileData = readJsonFile<AttributeValuesData>(getAttributeValuesFilePath(), { values: [], last_value_id: 0 });

    const index = fileData.values.findIndex(v => v.id === id);
    if (index === -1) {
        return false;
    }

    fileData.values.splice(index, 1);
    writeJsonFile(getAttributeValuesFilePath(), fileData);
    return true;
}

export function deleteAttributeValuesByMember(memberId: string): void {
    initFileDB();
    const fileData = readJsonFile<AttributeValuesData>(getAttributeValuesFilePath(), { values: [], last_value_id: 0 });
    fileData.values = fileData.values.filter(v => v.member_id !== memberId);
    writeJsonFile(getAttributeValuesFilePath(), fileData);
}

export function deleteAttributeValuesByDefinition(attributeId: string): void {
    initFileDB();
    const fileData = readJsonFile<AttributeValuesData>(getAttributeValuesFilePath(), { values: [], last_value_id: 0 });
    fileData.values = fileData.values.filter(v => v.attribute_id !== attributeId);
    writeJsonFile(getAttributeValuesFilePath(), fileData);
}
