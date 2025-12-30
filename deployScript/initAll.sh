#!/bin/bash

# =============================================================================
# 家用小工具 - 环境初始化脚本
# 功能：初始化依赖环境、Node 环境、数据库安装、数据表初始化（智能按需初始化）
# 创建时间: 2025-12-30
# =============================================================================

set -e  # 遇到错误立即退出

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$PROJECT_DIR/logs"
DATA_DIR="$PROJECT_DIR/data"
DB_PATH="$DATA_DIR/homework.db"
DB_INIT_SQL="$PROJECT_DIR/dbInit/db_init_all.sql"
DB_UPDATE_DIR="$PROJECT_DIR/dbInit/update_step"
BACKUP_DIR="$PROJECT_DIR/dbBackup"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_step() {
    echo -e "${CYAN}🔧 $1${NC}"
}

# =============================================================================
# 检查系统依赖
# =============================================================================
check_system_dependencies() {
    echo ""
    echo "=============================================="
    echo "📋 检查系统依赖..."
    echo "=============================================="
    
    local missing_deps=()
    
    # 检查 Node.js
    if command -v node &> /dev/null; then
        local node_version=$(node --version)
        print_success "Node.js 已安装: $node_version"
        
        # 检查 Node.js 版本是否 >= 18
        local major_version=$(echo $node_version | cut -d'.' -f1 | tr -d 'v')
        if [ "$major_version" -lt 18 ]; then
            print_warning "建议使用 Node.js 18 或更高版本，当前版本: $node_version"
        fi
    else
        print_error "Node.js 未安装"
        missing_deps+=("node")
    fi
    
    # 检查 npm
    if command -v npm &> /dev/null; then
        local npm_version=$(npm --version)
        print_success "npm 已安装: v$npm_version"
    else
        print_error "npm 未安装"
        missing_deps+=("npm")
    fi
    
    # 检查 SQLite3 (可选，用于命令行操作)
    if command -v sqlite3 &> /dev/null; then
        local sqlite_version=$(sqlite3 --version | awk '{print $1}')
        print_success "SQLite3 已安装: v$sqlite_version"
    else
        print_warning "SQLite3 命令行工具未安装 (可选，better-sqlite3 会自动处理)"
    fi
    
    # 如果有缺失的依赖，给出安装建议
    if [ ${#missing_deps[@]} -gt 0 ]; then
        echo ""
        print_error "缺少必要的依赖: ${missing_deps[*]}"
        echo ""
        echo "请先安装以下依赖："
        echo ""
        if [[ "$OSTYPE" == "darwin"* ]]; then
            echo "  macOS (使用 Homebrew):"
            echo "    brew install node"
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            echo "  Ubuntu/Debian:"
            echo "    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -"
            echo "    sudo apt-get install -y nodejs"
            echo ""
            echo "  CentOS/RHEL:"
            echo "    curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -"
            echo "    sudo yum install -y nodejs"
        fi
        echo ""
        exit 1
    fi
    
    print_success "系统依赖检查完成"
}

# =============================================================================
# 初始化 Node.js 依赖
# =============================================================================
init_node_dependencies() {
    echo ""
    echo "=============================================="
    echo "📦 初始化 Node.js 依赖..."
    echo "=============================================="
    
    # 初始化根目录依赖（如果有）
    if [ -f "$PROJECT_DIR/package.json" ]; then
        if [ ! -d "$PROJECT_DIR/node_modules" ]; then
            print_step "安装根目录依赖..."
            cd "$PROJECT_DIR"
            npm install
            print_success "根目录依赖安装完成"
        else
            print_info "根目录依赖已存在，跳过安装"
        fi
    fi
    
    # 初始化服务端依赖
    print_step "检查服务端依赖..."
    cd "$PROJECT_DIR/server"
    if [ ! -d "node_modules" ]; then
        print_step "安装服务端依赖..."
        npm install
        print_success "服务端依赖安装完成"
    else
        # 检查 package.json 是否比 node_modules 更新
        if [ "$PROJECT_DIR/server/package.json" -nt "$PROJECT_DIR/server/node_modules" ]; then
            print_step "检测到 package.json 更新，重新安装服务端依赖..."
            npm install
            print_success "服务端依赖更新完成"
        else
            print_info "服务端依赖已是最新，跳过安装"
        fi
    fi
    
    # 初始化客户端依赖
    print_step "检查客户端依赖..."
    cd "$PROJECT_DIR/client"
    if [ ! -d "node_modules" ]; then
        print_step "安装客户端依赖..."
        npm install
        print_success "客户端依赖安装完成"
    else
        # 检查 package.json 是否比 node_modules 更新
        if [ "$PROJECT_DIR/client/package.json" -nt "$PROJECT_DIR/client/node_modules" ]; then
            print_step "检测到 package.json 更新，重新安装客户端依赖..."
            npm install
            print_success "客户端依赖更新完成"
        else
            print_info "客户端依赖已是最新，跳过安装"
        fi
    fi
    
    print_success "Node.js 依赖初始化完成"
}

# =============================================================================
# 创建必要的目录结构
# =============================================================================
create_directories() {
    echo ""
    echo "=============================================="
    echo "📁 创建目录结构..."
    echo "=============================================="
    
    local directories=(
        "$LOG_DIR"
        "$DATA_DIR"
        "$BACKUP_DIR"
        "$PROJECT_DIR/uploadFiles/gameFiles"
        "$PROJECT_DIR/uploadFiles/knowledgeFiles"
        "$PROJECT_DIR/uploadFiles/userFiles"
        "$PROJECT_DIR/tempFiles"
    )
    
    for dir in "${directories[@]}"; do
        if [ ! -d "$dir" ]; then
            mkdir -p "$dir"
            print_step "创建目录: ${dir#$PROJECT_DIR/}"
        fi
    done
    
    print_success "目录结构创建完成"
}

# =============================================================================
# 智能初始化数据库（按需初始化，不抹除现有数据）
# =============================================================================
init_database() {
    echo ""
    echo "=============================================="
    echo "🗄️  智能初始化数据库..."
    echo "=============================================="
    
    # 确保数据目录存在
    mkdir -p "$DATA_DIR"
    
    # 检查数据库是否存在
    if [ -f "$DB_PATH" ]; then
        print_info "检测到已有数据库，将进行智能增量更新..."
        
        # 记录已执行的更新脚本（存储在数据库中）
        local db_version_check=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='db_migrations';" 2>/dev/null || echo "0")
        
        if [ "$db_version_check" = "0" ]; then
            # 创建迁移记录表
            print_step "创建数据库迁移记录表..."
            sqlite3 "$DB_PATH" "CREATE TABLE IF NOT EXISTS db_migrations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                script_name TEXT UNIQUE NOT NULL,
                executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );"
            
            # 检查并创建缺失的表（使用 IF NOT EXISTS 保护现有数据）
            print_step "检查并补充缺失的数据表..."
            if [ -f "$DB_INIT_SQL" ]; then
                sqlite3 "$DB_PATH" < "$DB_INIT_SQL" 2>/dev/null || true
                print_success "数据表结构检查完成（已跳过存在的表）"
            fi
        fi
        
        # 执行增量更新脚本
        if [ -d "$DB_UPDATE_DIR" ] && [ "$(ls -A $DB_UPDATE_DIR 2>/dev/null)" ]; then
            print_step "检查增量更新脚本..."
            
            for sql_file in "$DB_UPDATE_DIR"/*.sql; do
                if [ -f "$sql_file" ]; then
                    local script_name=$(basename "$sql_file")
                    
                    # 检查此脚本是否已执行
                    local already_executed=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM db_migrations WHERE script_name='$script_name';" 2>/dev/null || echo "0")
                    
                    if [ "$already_executed" = "0" ]; then
                        print_step "执行增量更新: $script_name"
                        sqlite3 "$DB_PATH" < "$sql_file"
                        sqlite3 "$DB_PATH" "INSERT INTO db_migrations (script_name) VALUES ('$script_name');"
                        print_success "增量更新完成: $script_name"
                    else
                        print_info "跳过已执行的脚本: $script_name"
                    fi
                fi
            done
        else
            print_info "没有待执行的增量更新脚本"
        fi
        
        print_success "数据库智能更新完成（现有数据已保留）"
        
    else
        # 数据库不存在，全新初始化
        print_step "首次初始化数据库..."
        
        # 创建数据库并执行初始化 SQL
        if [ -f "$DB_INIT_SQL" ]; then
            sqlite3 "$DB_PATH" < "$DB_INIT_SQL"
            print_success "数据表创建完成"
        else
            print_error "找不到初始化 SQL 文件: $DB_INIT_SQL"
            exit 1
        fi
        
        # 创建迁移记录表
        sqlite3 "$DB_PATH" "CREATE TABLE IF NOT EXISTS db_migrations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            script_name TEXT UNIQUE NOT NULL,
            executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );"
        
        # 记录初始化 SQL 为已执行
        sqlite3 "$DB_PATH" "INSERT INTO db_migrations (script_name) VALUES ('db_init_all.sql');"
        
        # 执行所有增量更新脚本
        if [ -d "$DB_UPDATE_DIR" ] && [ "$(ls -A $DB_UPDATE_DIR 2>/dev/null)" ]; then
            for sql_file in "$DB_UPDATE_DIR"/*.sql; do
                if [ -f "$sql_file" ]; then
                    local script_name=$(basename "$sql_file")
                    print_step "执行增量更新: $script_name"
                    sqlite3 "$DB_PATH" < "$sql_file"
                    sqlite3 "$DB_PATH" "INSERT INTO db_migrations (script_name) VALUES ('$script_name');"
                fi
            done
        fi
        
        print_success "数据库初始化完成"
    fi
    
    # 显示数据库信息
    echo ""
    print_info "数据库路径: $DB_PATH"
    local table_count=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';")
    print_info "数据表数量: $table_count"
}

# =============================================================================
# 构建项目
# =============================================================================
build_projects() {
    echo ""
    echo "=============================================="
    echo "🔨 构建项目..."
    echo "=============================================="
    
    # 构建服务端
    print_step "构建服务端..."
    cd "$PROJECT_DIR/server"
    npm run build
    print_success "服务端构建完成"
    
    # 构建客户端
    print_step "构建客户端..."
    cd "$PROJECT_DIR/client"
    npm run build
    print_success "客户端构建完成"
    
    print_success "项目构建完成"
}

# =============================================================================
# 主函数
# =============================================================================
main() {
    echo ""
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║          🏠 家用小工具 - 环境初始化脚本                     ║"
    echo "║                    版本: 1.0.0                             ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""
    echo "项目目录: $PROJECT_DIR"
    echo "当前时间: $(date '+%Y-%m-%d %H:%M:%S')"
    
    # 执行各个初始化步骤
    check_system_dependencies
    create_directories
    init_node_dependencies
    init_database
    build_projects
    
    echo ""
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║                    🎉 初始化完成!                           ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""
    echo "下一步操作："
    echo "  1. 运行启动脚本: sh ./deployScript/startAll.sh"
    echo "  2. 访问应用: http://localhost:3000"
    echo ""
}

# 执行主函数
main "$@"
