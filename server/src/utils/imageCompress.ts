import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 获取当前平台的工具目录
function getToolsDir(): string {
    const platform = os.platform(); // 'darwin', 'linux', 'win32'
    return path.join(__dirname, '../../../tools', platform);
}

// 获取工具路径
function getToolPath(toolName: string): string {
    const toolsDir = getToolsDir();
    const ext = os.platform() === 'win32' ? '.exe' : '';
    const toolPath = path.join(toolsDir, toolName + ext);

    // 如果项目工具目录中存在，使用项目中的
    if (fs.existsSync(toolPath)) {
        return toolPath;
    }

    // 否则尝试使用系统安装的
    return toolName;
}

// 压缩配置
interface CompressionConfig {
    quality: number;  // 压缩质量 1-100
    maxWidth?: number;  // 最大宽度
    maxHeight?: number; // 最大高度
}

const DEFAULT_CONFIG: CompressionConfig = {
    quality: 70,
    maxWidth: 1920,
    maxHeight: 1920
};

/**
 * 压缩图片
 * @param inputPath 输入文件路径
 * @param outputPath 输出文件路径（如果不提供则覆盖原文件）
 * @param config 压缩配置
 * @returns 是否成功
 */
export async function compressImage(
    inputPath: string,
    outputPath?: string,
    config: Partial<CompressionConfig> = {}
): Promise<boolean> {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };
    const output = outputPath || inputPath;
    const ext = path.extname(inputPath).toLowerCase();

    try {
        const convertPath = getToolPath('convert');

        // 构建 ImageMagick 命令
        let args: string[] = [inputPath];

        // 调整大小（保持比例）
        if (finalConfig.maxWidth && finalConfig.maxHeight) {
            args.push('-resize', `${finalConfig.maxWidth}x${finalConfig.maxHeight}>`);
        }

        // 去除元数据
        args.push('-strip');

        // 根据图片格式设置压缩参数
        switch (ext) {
            case '.png':
                // PNG 使用 pngquant 风格压缩
                args.push('-quality', String(finalConfig.quality));
                // 对 PNG 使用调色板压缩
                args.push('-colors', '256');
                break;

            case '.jpg':
            case '.jpeg':
                // JPEG 使用质量参数
                args.push('-quality', String(finalConfig.quality));
                // 使用渐进式 JPEG
                args.push('-interlace', 'Plane');
                break;

            case '.webp':
                args.push('-quality', String(finalConfig.quality));
                break;

            case '.gif':
                // GIF 优化
                args.push('-layers', 'Optimize');
                break;

            default:
                // 其他格式使用通用压缩
                args.push('-quality', String(finalConfig.quality));
        }

        args.push(output);

        // 执行压缩
        const command = `"${convertPath}" ${args.map(a => `"${a}"`).join(' ')}`;
        execSync(command, { stdio: 'pipe' });

        console.log(`[ImageCompress] Compressed: ${inputPath} -> ${output}`);
        return true;
    } catch (error) {
        console.error(`[ImageCompress] Failed to compress ${inputPath}:`, error);
        return false;
    }
}

/**
 * 检查是否为图片文件
 */
export function isImageFile(filename: string): boolean {
    const ext = path.extname(filename).toLowerCase();
    return ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.tiff'].includes(ext);
}

/**
 * 压缩上传的图片 Buffer
 * @param buffer 图片 Buffer
 * @param filename 原始文件名
 * @param config 压缩配置
 * @returns 压缩后的 Buffer
 */
export async function compressImageBuffer(
    buffer: Buffer,
    filename: string,
    config: Partial<CompressionConfig> = {}
): Promise<Buffer> {
    const ext = path.extname(filename).toLowerCase();

    // 非图片文件直接返回
    if (!isImageFile(filename)) {
        return buffer;
    }

    // 创建临时文件
    const tempDir = os.tmpdir();
    const tempInput = path.join(tempDir, `compress_input_${Date.now()}${ext}`);
    const tempOutput = path.join(tempDir, `compress_output_${Date.now()}${ext}`);

    try {
        // 写入临时文件
        fs.writeFileSync(tempInput, buffer);

        // 压缩
        const success = await compressImage(tempInput, tempOutput, config);

        if (success && fs.existsSync(tempOutput)) {
            // 读取压缩后的文件
            const compressedBuffer = fs.readFileSync(tempOutput);

            // 如果压缩后更大，返回原始文件
            if (compressedBuffer.length >= buffer.length) {
                console.log(`[ImageCompress] Compressed size larger than original, keeping original`);
                return buffer;
            }

            const ratio = ((1 - compressedBuffer.length / buffer.length) * 100).toFixed(1);
            console.log(`[ImageCompress] Size reduced by ${ratio}% (${buffer.length} -> ${compressedBuffer.length})`);

            return compressedBuffer;
        }

        return buffer;
    } finally {
        // 清理临时文件
        try {
            if (fs.existsSync(tempInput)) fs.unlinkSync(tempInput);
            if (fs.existsSync(tempOutput)) fs.unlinkSync(tempOutput);
        } catch (e) {
            // 忽略清理错误
        }
    }
}

/**
 * 检查压缩工具是否可用
 */
export function isCompressionAvailable(): boolean {
    try {
        const convertPath = getToolPath('convert');
        execSync(`"${convertPath}" --version`, { stdio: 'pipe' });
        return true;
    } catch {
        return false;
    }
}
