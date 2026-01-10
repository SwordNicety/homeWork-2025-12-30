#!/bin/bash

# =============================================================================
# 家用小工具 - 服务启动脚本
# 功能：关闭现有服务、构建并启动前后端、打印访问链接、在浏览器中打开主页
# 创建时间: 2025-12-30
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$PROJECT_DIR/logs"
DATA_DIR="$PROJECT_DIR/data"
DB_PATH="$DATA_DIR/homework.db"

# 服务配置
SERVER_PORT=3000
SERVER_HOST="localhost"
APP_URL="http://${SERVER_HOST}:${SERVER_PORT}"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color
BOLD='\033[1m'

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
# 检查环境是否已初始化
# =============================================================================
check_environment() {
    local need_init=false
    
    # 检查依赖是否安装
    if [ ! -d "$PROJECT_DIR/server/node_modules" ]; then
        print_warning "服务端依赖未安装"
        need_init=true
    fi
    
    if [ ! -d "$PROJECT_DIR/client/node_modules" ]; then
        print_warning "客户端依赖未安装"
        need_init=true
    fi
    
    # 检查数据库是否存在
    if [ ! -f "$DB_PATH" ]; then
        print_warning "数据库未初始化"
        need_init=true
    fi
    
    if [ "$need_init" = true ]; then
        echo ""
        print_error "环境未初始化！请先运行初始化脚本："
        echo ""
        echo "    sh ./deployScript/initAll.sh"
        echo ""
        exit 1
    fi
}

# =============================================================================
# 停止现有服务
# =============================================================================
stop_services() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "⏹️  停止现有服务..."
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    local stopped=false
    
    # 通过进程名杀掉服务
    if pgrep -f "homework-server" > /dev/null 2>&1; then
        pkill -f "homework-server" 2>/dev/null || true
        stopped=true
    fi
    
    if pgrep -f "node.*server/dist" > /dev/null 2>&1; then
        pkill -f "node.*server/dist" 2>/dev/null || true
        stopped=true
    fi
    
    # 检查端口占用并杀掉
    local port_pid=$(lsof -ti:$SERVER_PORT 2>/dev/null)
    if [ -n "$port_pid" ]; then
        print_step "发现端口 $SERVER_PORT 被占用 (PID: $port_pid)，正在终止..."
        kill -9 $port_pid 2>/dev/null || true
        stopped=true
    fi
    
    if [ "$stopped" = true ]; then
        print_success "已停止现有服务"
        # 等待进程完全退出
        sleep 2
    else
        print_info "没有检测到运行中的服务"
    fi
}

# =============================================================================
# 构建项目
# =============================================================================
build_projects() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🔨 构建项目..."
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # 构建服务端
    print_step "构建服务端..."
    cd "$PROJECT_DIR/server"
    npm run build > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        print_success "服务端构建完成"
    else
        print_error "服务端构建失败"
        exit 1
    fi
    
    # 构建客户端
    print_step "构建客户端..."
    cd "$PROJECT_DIR/client"
    npm run build > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        print_success "客户端构建完成"
    else
        print_error "客户端构建失败"
        exit 1
    fi
}

# =============================================================================
# 启动服务
# =============================================================================
start_services() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🚀 启动服务..."
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # 确保日志目录存在
    mkdir -p "$LOG_DIR"
    
    # 启动服务端（后台运行）
    cd "$PROJECT_DIR/server"
    print_step "启动后端服务 (端口: $SERVER_PORT)..."
    nohup node dist/index.js > "$LOG_DIR/server.log" 2>&1 &
    
    local server_pid=$!
    echo $server_pid > "$LOG_DIR/server.pid"
    
    # 等待服务启动
    print_step "等待服务启动..."
    local max_wait=30
    local wait_count=0
    
    while [ $wait_count -lt $max_wait ]; do
        if curl -s "${APP_URL}/api/health" > /dev/null 2>&1; then
            print_success "后端服务启动成功 (PID: $server_pid)"
            return 0
        fi
        sleep 1
        wait_count=$((wait_count + 1))
        echo -n "."
    done
    
    echo ""
    print_error "服务启动超时，请检查日志: $LOG_DIR/server.log"
    return 1
}

# =============================================================================
# 在浏览器中打开应用
# =============================================================================
open_browser() {
    print_step "在浏览器中打开应用..."
    
    # 根据操作系统选择打开命令
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        open "$APP_URL"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        if command -v xdg-open &> /dev/null; then
            xdg-open "$APP_URL"
        elif command -v gnome-open &> /dev/null; then
            gnome-open "$APP_URL"
        else
            print_warning "无法自动打开浏览器，请手动访问: $APP_URL"
            return
        fi
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
        # Windows (Git Bash / Cygwin)
        start "$APP_URL"
    else
        print_warning "未知操作系统，请手动打开浏览器访问: $APP_URL"
        return
    fi
    
    print_success "已在浏览器中打开应用"
}

# =============================================================================
# 显示启动成功信息
# =============================================================================
show_success_message() {
    local server_pid=$(cat "$LOG_DIR/server.pid" 2>/dev/null || echo "N/A")
    
    echo ""
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                                                            ║${NC}"
    echo -e "${GREEN}║              ${BOLD}🎉 服务启动成功！${NC}${GREEN}                            ║${NC}"
    echo -e "${GREEN}║                                                            ║${NC}"
    echo -e "${GREEN}╠════════════════════════════════════════════════════════════╣${NC}"
    echo -e "${GREEN}║${NC}                                                            ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}  ${BOLD}🌐 访问地址:${NC}  ${CYAN}${APP_URL}${NC}                        ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}                                                            ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}  ${BOLD}📋 服务信息:${NC}                                              ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}     • 服务端口: ${SERVER_PORT}                                       ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}     • 进程 PID: ${server_pid}                                        ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}     • 日志文件: logs/server.log                            ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}                                                            ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}  ${BOLD}🛠️  常用命令:${NC}                                              ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}     • 查看日志: tail -f logs/server.log                    ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}     • 停止服务: kill ${server_pid}                                   ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}     • 重启服务: sh deployScript/startAll.sh                ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}                                                            ${GREEN}║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# =============================================================================
# 主函数
# =============================================================================
main() {
    echo ""
    echo -e "${MAGENTA}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${MAGENTA}║          ${BOLD}🏠 木木的家 - 服务启动脚本${NC}${MAGENTA}                       ║${NC}"
    echo -e "${MAGENTA}║                    版本: 1.0.0                             ║${NC}"
    echo -e "${MAGENTA}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "项目目录: $PROJECT_DIR"
    echo "当前时间: $(date '+%Y-%m-%d %H:%M:%S')"
    
    # 检查环境
    check_environment
    
    # 停止现有服务
    stop_services
    
    # 构建项目
    build_projects
    
    # 启动服务
    if start_services; then
        # 显示成功信息
        show_success_message
        
        # 在浏览器中打开
        open_browser
    else
        exit 1
    fi
}

# 执行主函数
main "$@"
