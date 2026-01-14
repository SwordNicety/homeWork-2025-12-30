import { useState, useEffect, useCallback, useRef } from 'react'
import {
    Film,
    ChevronRight,
    ChevronLeft,
    Play,
    Clock,
    Eye,
    History,
    Settings,
    Timer,
    Coffee,
    Folder,
    PlayCircle
} from 'lucide-react'
import PageContainer from '../components/PageContainer'
import VideoPlayer from '../components/theater/VideoPlayer'
import BreakScreen from '../components/theater/BreakScreen'

// 类型定义
interface DirectoryInfo {
    name: string
    path: string
    type: 'category' | 'videos'
    icon: string | null
    videoCount?: number
}

interface VideoInfo {
    filename: string
    path: string
    displayName: string
    order: number
    playCount: number
    lastPosition: number
    totalWatchTime: number
    lastPlayedAt: string | null
    duration: number
}

interface BrowseResult {
    type: 'categories' | 'videos'
    path: string
    name: string
    icon: string | null
    categories?: DirectoryInfo[]
    videos?: VideoInfo[]
}

// 时长选项
const TOTAL_WATCH_OPTIONS = Array.from({ length: 17 }, (_, i) => (i + 1) * 10) // 10-180分钟
const BREAK_INTERVAL_OPTIONS = [5, 10, 15, 20] // 5-20分钟

// 休息时长（分钟）
const BREAK_DURATION = 3

export default function TheaterPage() {
    // 配置状态
    const [totalWatchLimit, setTotalWatchLimit] = useState(60) // 分钟
    const [breakInterval, setBreakInterval] = useState(15) // 分钟
    const [showConfig, setShowConfig] = useState(false)

    // 观看统计
    const [todayWatchTime, setTodayWatchTime] = useState(0) // 秒
    const [sessionWatchTime, setSessionWatchTime] = useState(0) // 当前连续观看时间（秒）

    // 目录浏览
    const [currentPath, setCurrentPath] = useState<string[]>([])
    const [browseData, setBrowseData] = useState<BrowseResult | null>(null)
    const [loading, setLoading] = useState(true)

    // 播放状态
    const [playingVideo, setPlayingVideo] = useState<VideoInfo | null>(null)
    const [isBreaking, setIsBreaking] = useState(false)
    const [pendingVideo, setPendingVideo] = useState<VideoInfo | null>(null) // 休息后待播放的视频

    // 播放计时器
    const watchTimerRef = useRef<NodeJS.Timeout | null>(null)
    // 上次保存进度的时间
    const lastSaveTimeRef = useRef<number>(0)

    // 加载目录数据
    const loadDirectory = useCallback(async (pathArray: string[]) => {
        setLoading(true)
        try {
            const pathStr = pathArray.join('/')
            const url = pathStr ? `/api/theater/browse/${pathStr}` : '/api/theater/categories'
            const response = await fetch(url)
            const result = await response.json()

            if (result.success) {
                if (pathStr === '' || !pathStr) {
                    // 根目录返回的是 categories 数组
                    setBrowseData({
                        type: 'categories',
                        path: '',
                        name: '放映厅',
                        icon: null,
                        categories: result.data
                    })
                } else {
                    setBrowseData(result.data)
                }
            }
        } catch (error) {
            console.error('加载目录失败:', error)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        loadDirectory(currentPath)
    }, [currentPath, loadDirectory])

    // 进入子目录
    const enterDirectory = (dirName: string) => {
        setCurrentPath(prev => [...prev, dirName])
    }

    // 返回上级
    const goBack = () => {
        setCurrentPath(prev => prev.slice(0, -1))
    }

    // 检查是否可以播放
    const canPlay = () => {
        const limitSeconds = totalWatchLimit * 60
        return todayWatchTime < limitSeconds
    }

    // 检查是否需要休息
    const needsBreak = () => {
        const intervalSeconds = breakInterval * 60
        return sessionWatchTime >= intervalSeconds
    }

    // 开始播放
    const startPlay = async (video: VideoInfo, continueWatch: boolean = false) => {
        if (!canPlay()) {
            alert('今日观看时间已达上限，明天再来吧！')
            return
        }

        // 记录播放次数
        const pathStr = currentPath.join('/')
        await fetch(`/api/theater/increment-play/${pathStr}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filename: video.filename })
        })

        setPlayingVideo({
            ...video,
            lastPosition: continueWatch ? video.lastPosition : 0
        })
    }

    // 播放时间更新（节流，每10秒保存一次进度）
    const handleTimeUpdate = async (currentTime: number, duration: number) => {
        if (!playingVideo) return

        // 更新本地视频信息的时长
        if (duration > 0 && playingVideo.duration !== duration) {
            setPlayingVideo(prev => prev ? { ...prev, duration } : null)
        }

        // 节流：每10秒保存一次进度
        const now = Date.now()
        if (now - lastSaveTimeRef.current < 10000) return
        lastSaveTimeRef.current = now

        // 每隔一定时间保存进度
        const pathStr = currentPath.join('/')

        // 更新统计数据
        await fetch(`/api/theater/stats/${pathStr}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                filename: playingVideo.filename,
                lastPosition: currentTime,
                duration: duration
            })
        })
    }

    // 播放状态变化
    const handlePlayStateChange = (isPlaying: boolean) => {
        if (isPlaying) {
            // 开始计时
            watchTimerRef.current = setInterval(() => {
                setTodayWatchTime(prev => prev + 1)
                setSessionWatchTime(prev => prev + 1)
            }, 1000)
        } else {
            // 停止计时
            if (watchTimerRef.current) {
                clearInterval(watchTimerRef.current)
                watchTimerRef.current = null
            }
        }
    }

    // 检查是否需要休息（在播放过程中）
    useEffect(() => {
        if (playingVideo && needsBreak()) {
            // 获取当前视频元素来检查剩余时长
            const videoElement = document.querySelector('video')
            if (videoElement) {
                const remainingTime = videoElement.duration - videoElement.currentTime
                if (remainingTime > 5 * 60 || isNaN(remainingTime)) {
                    // 剩余超过5分钟，立即休息
                    setPendingVideo({
                        ...playingVideo,
                        lastPosition: videoElement.currentTime
                    })
                    setPlayingVideo(null)
                    setIsBreaking(true)
                    setSessionWatchTime(0)
                }
                // 否则允许播放完成
            }
        }
    }, [sessionWatchTime, playingVideo])

    // 视频播放结束
    const handleVideoEnded = async () => {
        if (!playingVideo) return

        // 保存最终进度
        const pathStr = currentPath.join('/')
        await fetch(`/api/theater/stats/${pathStr}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                filename: playingVideo.filename,
                lastPosition: 0, // 重置进度
                totalWatchTime: (playingVideo.totalWatchTime || 0) + playingVideo.duration
            })
        })

        // 检查是否需要休息
        if (needsBreak()) {
            setPlayingVideo(null)
            setIsBreaking(true)
            setSessionWatchTime(0)
        } else {
            // 自动播放下一个
            const videos = browseData?.videos || []
            const currentIndex = videos.findIndex(v => v.filename === playingVideo.filename)
            if (currentIndex < videos.length - 1) {
                startPlay(videos[currentIndex + 1])
            } else {
                setPlayingVideo(null)
            }
        }
    }

    // 关闭播放器
    const handleClosePlayer = async () => {
        if (playingVideo) {
            // 保存当前进度
            const pathStr = currentPath.join('/')
            const video = document.querySelector('video')
            if (video) {
                await fetch(`/api/theater/stats/${pathStr}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        filename: playingVideo.filename,
                        lastPosition: video.currentTime,
                        totalWatchTime: (playingVideo.totalWatchTime || 0) + video.currentTime
                    })
                })
            }
        }

        if (watchTimerRef.current) {
            clearInterval(watchTimerRef.current)
            watchTimerRef.current = null
        }

        setPlayingVideo(null)
        loadDirectory(currentPath)
    }

    // 休息结束
    const handleBreakEnd = () => {
        setIsBreaking(false)
        if (pendingVideo) {
            startPlay(pendingVideo, true)
            setPendingVideo(null)
        }
    }

    // 格式化时间
    const formatDuration = (seconds: number) => {
        if (!seconds || seconds <= 0) return '--:--'
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const formatWatchTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600)
        const mins = Math.floor((seconds % 3600) / 60)
        if (hours > 0) {
            return `${hours}小时${mins}分钟`
        }
        return `${mins}分钟`
    }

    // 渲染板块卡片
    const renderCategoryCard = (category: DirectoryInfo) => (
        <div
            key={category.path}
            onClick={() => enterDirectory(category.name)}
            className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer group"
        >
            {/* 图标区域 */}
            <div className="relative h-32 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center overflow-hidden">
                {category.icon ? (
                    <img
                        src={category.icon}
                        alt={category.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                ) : (
                    <Folder size={48} className="text-white/80" />
                )}
                {/* 悬浮遮罩 */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <PlayCircle size={48} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
            </div>

            {/* 信息区域 */}
            <div className="p-4">
                <h3 className="font-bold text-lg text-gray-800 mb-2 truncate">{category.name}</h3>
                <div className="flex items-center justify-between text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                        {category.type === 'videos' ? (
                            <>
                                <Film size={14} />
                                {category.videoCount || 0} 个视频
                            </>
                        ) : (
                            <>
                                <Folder size={14} />
                                点击进入
                            </>
                        )}
                    </span>
                    <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </div>
            </div>
        </div>
    )

    // 渲染视频卡片
    const renderVideoCard = (video: VideoInfo) => {
        const hasProgress = video.lastPosition > 0 && video.lastPosition < video.duration
        const progressPercent = video.duration > 0 ? (video.lastPosition / video.duration) * 100 : 0

        return (
            <div
                key={video.filename}
                className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden"
            >
                {/* 视频预览区域 */}
                <div className="relative h-36 bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                    <Film size={40} className="text-white/50" />

                    {/* 进度条 */}
                    {hasProgress && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
                            <div
                                className="h-full bg-indigo-500"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                    )}
                </div>

                {/* 信息区域 */}
                <div className="p-4">
                    <h3 className="font-bold text-gray-800 mb-3 truncate" title={video.displayName}>
                        {video.displayName}
                    </h3>

                    {/* 统计信息 */}
                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-500 mb-4">
                        <div className="flex items-center gap-1">
                            <Clock size={14} />
                            {formatDuration(video.duration)}
                        </div>
                        <div className="flex items-center gap-1">
                            <Eye size={14} />
                            {video.playCount} 次
                        </div>
                        {hasProgress && (
                            <div className="flex items-center gap-1 col-span-2">
                                <History size={14} />
                                上次看到 {formatDuration(video.lastPosition)}
                            </div>
                        )}
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex gap-2">
                        {hasProgress && (
                            <button
                                onClick={() => startPlay(video, true)}
                                disabled={!canPlay()}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-300 text-white rounded-lg transition"
                            >
                                <Play size={16} />
                                继续观看
                            </button>
                        )}
                        <button
                            onClick={() => startPlay(video, false)}
                            disabled={!canPlay()}
                            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition ${hasProgress
                                ? 'flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700'
                                : 'flex-1 bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-300 text-white'
                                }`}
                        >
                            <Play size={16} />
                            {hasProgress ? '从头看' : '开始观看'}
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    // 渲染面包屑
    const renderBreadcrumb = () => (
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            <button
                onClick={() => setCurrentPath([])}
                className="hover:text-indigo-500 transition"
            >
                放映厅
            </button>
            {currentPath.map((name, index) => (
                <div key={index} className="flex items-center gap-2">
                    <ChevronRight size={14} />
                    <button
                        onClick={() => setCurrentPath(currentPath.slice(0, index + 1))}
                        className="hover:text-indigo-500 transition"
                    >
                        {name}
                    </button>
                </div>
            ))}
        </div>
    )

    // 渲染配置区域
    const renderConfigSection = () => (
        <div className="bg-white rounded-2xl shadow-md p-4 mb-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                    {/* 今日观看统计 */}
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                            <Clock size={20} className="text-indigo-500" />
                        </div>
                        <div>
                            <div className="text-xs text-gray-500">今日已看</div>
                            <div className="font-bold text-gray-800">
                                {formatWatchTime(todayWatchTime)}
                                <span className="text-gray-400 font-normal"> / {totalWatchLimit}分钟</span>
                            </div>
                        </div>
                    </div>

                    {/* 连续观看时间 */}
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                            <Timer size={20} className="text-amber-500" />
                        </div>
                        <div>
                            <div className="text-xs text-gray-500">连续观看</div>
                            <div className="font-bold text-gray-800">
                                {formatWatchTime(sessionWatchTime)}
                                <span className="text-gray-400 font-normal"> / {breakInterval}分钟休息</span>
                            </div>
                        </div>
                    </div>

                    {/* 剩余时间提示 */}
                    {!canPlay() && (
                        <div className="flex items-center gap-2 text-red-500">
                            <Coffee size={20} />
                            <span className="font-medium">今日观看时间已用完</span>
                        </div>
                    )}
                </div>

                {/* 配置按钮 */}
                <button
                    onClick={() => setShowConfig(!showConfig)}
                    className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition"
                >
                    <Settings size={18} />
                    设置
                </button>
            </div>

            {/* 展开的配置项 */}
            {showConfig && (
                <div className="mt-4 pt-4 border-t flex gap-8">
                    <div className="flex items-center gap-3">
                        <label className="text-sm text-gray-600">今日总观看时长：</label>
                        <select
                            value={totalWatchLimit}
                            onChange={(e) => setTotalWatchLimit(Number(e.target.value))}
                            className="px-3 py-2 border rounded-lg text-sm"
                        >
                            {TOTAL_WATCH_OPTIONS.map(mins => (
                                <option key={mins} value={mins}>{mins} 分钟</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-3">
                        <label className="text-sm text-gray-600">休息间隔：</label>
                        <select
                            value={breakInterval}
                            onChange={(e) => setBreakInterval(Number(e.target.value))}
                            className="px-3 py-2 border rounded-lg text-sm"
                        >
                            {BREAK_INTERVAL_OPTIONS.map(mins => (
                                <option key={mins} value={mins}>{mins} 分钟</option>
                            ))}
                        </select>
                    </div>
                </div>
            )}
        </div>
    )

    if (loading && !browseData) {
        return (
            <PageContainer title="放映厅">
                <div className="flex items-center justify-center h-64">
                    <div className="text-gray-500">加载中...</div>
                </div>
            </PageContainer>
        )
    }

    return (
        <PageContainer title="放映厅">
            <div className="p-6">
                {/* 顶部标题 */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                        <Film className="text-white" size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">放映厅</h1>
                        <p className="text-gray-500 text-sm">保护眼睛，快乐观影</p>
                    </div>
                </div>

                {/* 配置区域 */}
                {renderConfigSection()}

                {/* 面包屑 */}
                {currentPath.length > 0 && (
                    <div className="flex items-center gap-4 mb-4">
                        <button
                            onClick={goBack}
                            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition"
                        >
                            <ChevronLeft size={18} />
                            返回上级
                        </button>
                        {renderBreadcrumb()}
                    </div>
                )}

                {/* 内容区域 */}
                {browseData?.type === 'videos' ? (
                    // 视频列表
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {browseData.videos?.map(renderVideoCard)}
                    </div>
                ) : (
                    // 目录列表
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {browseData?.categories?.map(renderCategoryCard)}

                        {/* 空状态 */}
                        {browseData?.categories?.length === 0 && (
                            <div className="col-span-full flex flex-col items-center justify-center h-64 bg-gray-50 rounded-xl">
                                <Film size={64} className="text-gray-300 mb-4" />
                                <p className="text-gray-500 text-lg">这里还没有内容</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* 视频播放器 */}
            {playingVideo && (
                <VideoPlayer
                    videoUrl={`/videoCenter/resources/${currentPath.join('/')}/${playingVideo.filename}`}
                    title={playingVideo.displayName}
                    initialPosition={playingVideo.lastPosition}
                    onClose={handleClosePlayer}
                    onTimeUpdate={handleTimeUpdate}
                    onEnded={handleVideoEnded}
                    onPlayStateChange={handlePlayStateChange}
                />
            )}

            {/* 休息界面 */}
            {isBreaking && (
                <BreakScreen
                    duration={BREAK_DURATION * 60}
                    onBreakEnd={handleBreakEnd}
                />
            )}
        </PageContainer>
    )
}
