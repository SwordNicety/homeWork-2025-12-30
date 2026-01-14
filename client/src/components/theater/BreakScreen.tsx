import { useState, useEffect, useRef, useCallback } from 'react'
import { Coffee, ChevronLeft, ChevronRight } from 'lucide-react'

interface BreakScreenProps {
    duration: number // 休息时长（秒）
    onBreakEnd: () => void
}

interface BreakVideo {
    filename: string
    path: string
}

export default function BreakScreen({ duration, onBreakEnd }: BreakScreenProps) {
    const [videos, setVideos] = useState<BreakVideo[]>([])
    const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
    const [remainingTime, setRemainingTime] = useState(duration)
    const [isLoading, setIsLoading] = useState(true)
    const videoRef = useRef<HTMLVideoElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    // 获取休息视频列表
    useEffect(() => {
        const fetchBreakVideos = async () => {
            try {
                const response = await fetch('/api/theater/break-videos')
                const result = await response.json()
                if (result.success && result.data.length > 0) {
                    // 随机排序
                    const shuffled = [...result.data].sort(() => Math.random() - 0.5)
                    setVideos(shuffled)
                    setCurrentVideoIndex(0)
                }
            } catch (error) {
                console.error('获取休息视频失败:', error)
            } finally {
                setIsLoading(false)
            }
        }
        fetchBreakVideos()
    }, [])

    // 进入全屏
    useEffect(() => {
        const enterFullscreen = async () => {
            try {
                if (containerRef.current) {
                    await containerRef.current.requestFullscreen()
                }
            } catch (error) {
                console.error('全屏失败:', error)
            }
        }
        enterFullscreen()

        return () => {
            if (document.fullscreenElement) {
                document.exitFullscreen().catch(() => { })
            }
        }
    }, [])

    // 倒计时
    useEffect(() => {
        const timer = setInterval(() => {
            setRemainingTime(prev => {
                if (prev <= 1) {
                    clearInterval(timer)
                    onBreakEnd()
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        return () => clearInterval(timer)
    }, [onBreakEnd])

    // 键盘控制切换视频
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') {
                e.preventDefault()
                switchVideo(-1)
            } else if (e.key === 'ArrowRight') {
                e.preventDefault()
                switchVideo(1)
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [videos.length])

    const switchVideo = useCallback((direction: number) => {
        if (videos.length === 0) return
        setCurrentVideoIndex(prev => {
            let next = prev + direction
            if (next < 0) next = videos.length - 1
            if (next >= videos.length) next = 0
            return next
        })
    }, [videos.length])

    // 当前视频播放结束时自动切换
    const handleVideoEnded = () => {
        switchVideo(1)
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const currentVideo = videos[currentVideoIndex]

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 bg-black z-50 flex items-center justify-center"
        >
            {/* 背景视频 */}
            {!isLoading && currentVideo && (
                <video
                    ref={videoRef}
                    src={currentVideo.path}
                    className="absolute inset-0 w-full h-full object-cover"
                    autoPlay
                    loop={videos.length === 1}
                    muted
                    onEnded={handleVideoEnded}
                />
            )}

            {/* 遮罩层 */}
            <div className="absolute inset-0 bg-black/30" />

            {/* 内容 */}
            <div className="relative z-10 text-center text-white">
                <div className="mb-8">
                    <Coffee size={80} className="mx-auto mb-4 animate-bounce" />
                    <h1 className="text-4xl font-bold mb-2">休息一下眼睛吧！</h1>
                    <p className="text-xl opacity-80">看看远处，活动一下身体</p>
                </div>

                {/* 倒计时 */}
                <div className="bg-white/20 backdrop-blur-md rounded-3xl px-12 py-8 inline-block">
                    <div className="text-6xl font-bold font-mono mb-2">
                        {formatTime(remainingTime)}
                    </div>
                    <p className="text-lg opacity-80">休息结束后可继续观看</p>
                </div>
            </div>

            {/* 切换视频按钮 */}
            {videos.length > 1 && (
                <>
                    <button
                        onClick={() => switchVideo(-1)}
                        className="absolute left-8 top-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition"
                    >
                        <ChevronLeft size={32} />
                    </button>
                    <button
                        onClick={() => switchVideo(1)}
                        className="absolute right-8 top-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition"
                    >
                        <ChevronRight size={32} />
                    </button>
                </>
            )}

            {/* 快捷键提示 */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/50 text-sm">
                使用 ← → 方向键切换视频
            </div>

            {/* 视频指示器 */}
            {videos.length > 1 && (
                <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-2">
                    {videos.map((_, index) => (
                        <div
                            key={index}
                            className={`w-2 h-2 rounded-full transition ${index === currentVideoIndex ? 'bg-white' : 'bg-white/30'
                                }`}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
