# 媒体处理工具

本目录用于存放图片/视频处理所需的工具二进制文件。

## 目录结构

```
tools/
├── darwin/          # macOS 系统
│   ├── ffmpeg
│   ├── ffprobe
│   └── convert
├── linux/           # Linux 系统
│   ├── ffmpeg
│   ├── ffprobe
│   └── convert
├── win32/           # Windows 系统
│   ├── ffmpeg.exe
│   ├── ffprobe.exe
│   └── convert.exe
└── README.md
```

## 下载说明

### macOS (darwin)

**FFmpeg:**
```bash
# 使用 Homebrew 安装后复制
brew install ffmpeg
cp $(which ffmpeg) tools/darwin/
cp $(which ffprobe) tools/darwin/

# 或者从官网下载静态编译版本
# https://evermeet.cx/ffmpeg/
```

**ImageMagick (convert):**
```bash
# 使用 Homebrew 安装后复制
brew install imagemagick
cp $(which convert) tools/darwin/

# 或者从官网下载
# https://imagemagick.org/script/download.php
```

### Linux

**FFmpeg:**
```bash
# Ubuntu/Debian
sudo apt install ffmpeg
cp $(which ffmpeg) tools/linux/
cp $(which ffprobe) tools/linux/

# 或者下载静态编译版本
# https://johnvansickle.com/ffmpeg/
```

**ImageMagick (convert):**
```bash
# Ubuntu/Debian
sudo apt install imagemagick
cp $(which convert) tools/linux/

# 或者从 AppImage 下载
# https://imagemagick.org/script/download.php
```

### Windows (win32)

**FFmpeg:**
- 从 https://www.gyan.dev/ffmpeg/builds/ 下载
- 或从 https://github.com/BtbN/FFmpeg-Builds/releases 下载
- 解压后将 ffmpeg.exe 和 ffprobe.exe 复制到 tools/win32/

**ImageMagick:**
- 从 https://imagemagick.org/script/download.php#windows 下载便携版
- 解压后将 convert.exe 复制到 tools/win32/

## 注意事项

1. 确保二进制文件有执行权限（Linux/macOS）：
   ```bash
   chmod +x tools/darwin/*
   chmod +x tools/linux/*
   ```

2. 工具文件较大，已添加到 .gitignore 中，不会提交到仓库

3. 部署时需要手动下载对应平台的工具
