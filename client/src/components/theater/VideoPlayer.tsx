import { useState, useEffect, useRef, useCallback } from 'react'
import { X, Play, Pause, Volume2, VolumeX, Maximize, SkipForward, SkipBack } from 'lucide-react'

interface VideoPlayerProps {
    videoUrl: string
    title: string
    initialPosition?: number
    onClose: () => void
    onTimeUpdate: (currentTime: number, duration: number) => void
    onEnded: () => void
    onPlayStateChange: (isPlaying: boolean) => void
    autoPlay?: boolean
}

export default function VideoPlayer({
    videoUrl,
    title,
    initialPosition = 0,
    onClose,
    onTimeUpdate,
    onEnded,
    onPlayStateChange,
    autoPlay = true
}: VideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const [volume, setVolume] = useState(1)
    const [isMuted, setIsMuted] = useState(false)
    const [showControls, setShowControls] = useState(true)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    // 进入全屏
    const enterFullscreen = useCallback(async () => {
        try {
            if (containerRef.current) {
                await containerRef.current.requestFullscreen()
                setIsFullscreen(true)
            }
        } catch (error) {
            console.error('全屏失败:', error)
        }
    }, [])

    // 退出全屏
    const exitFullscreen = useCallback(async () => {
        try {
            if (document.fullscreenElement) {
                await document.exitFullscreen()
                setIsFullscreen(false)
            }
        } catch (error) {
            console.error('退出全屏失败:', error)
        }
    }, [])

    // 自动进入全屏
    useEffect(() => {
        enterFullscreen()
        return () => {
            if (document.fullscreenElement) {
                document.exitFullscreen()
            }
        }
    }, [enterFullscreen])

    // 监听全屏变化
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement)
            if (!document.fullscreenElement) {
                // 用户通过 ESC 退出全屏时，关闭播放器
                // onClose()
            }
        }
        document.addEventListener('fullscreenchange', handleFullscreenChange)
        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange)
        }
    }, [])

    // 设置初始播放位置
    useEffect(() => {
        const video = videoRef.current
        if (video && initialPosition > 0) {
            video.currentTime = initialPosition
        }
    }, [initialPosition])

    // 自动播放
    useEffect(() => {
        const video = videoRef.current
        if (video && autoPlay) {
            video.play().catch(console.error)
        }
    }, [autoPlay])

    // 键盘控制
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const video = videoRef.current
            if (!video) return

            switch (e.key) {
                case 'ArrowLeft':
                    e.preventDefault()
                    video.currentTime = Math.max(0, video.currentTime - 10)
                    showControlsTemporarily()
                    break
                case 'ArrowRight':
                    e.preventDefault()
                    video.currentTime = Math.min(video.duration, video.currentTime + 10)
                    showControlsTemporarily()
                    break
                case 'ArrowUp':
                    e.preventDefault()
                    setVolume(v => Math.min(1, v + 0.1))
                    video.volume = Math.min(1, video.volume + 0.1)
                    showControlsTemporarily()
                    break
                case 'ArrowDown':
                    e.preventDefault()
                    setVolume(v => Math.max(0, v - 0.1))
                    video.volume = Math.max(0, video.volume - 0.1)
                    showControlsTemporarily()
                    break
                case ' ':
                    e.preventDefault()
                    togglePlay()
                    break
                case 'Escape':
                    e.preventDefault()
                    handleClose()
                    break
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => {
            window.removeEventListener('keydown', handleKeyDown)
        }
    }, [])

    const showControlsTemporarily = () => {
        setShowControls(true)
        if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current)
        }
        controlsTimeoutRef.current = setTimeout(() => {
            if (isPlaying) {
                setShowControls(false)
            }
        }, 3000)
    }

    const togglePlay = () => {
        const video = videoRef.current
        if (!video) return

        if (video.paused) {
            video.play()
        } else {
            video.pause()
        }
    }

    const handleTimeUpdate = () => {
        const video = videoRef.current
        if (!video) return

        setCurrentTime(video.currentTime)
        onTimeUpdate(video.currentTime, video.duration)
    }

    const handleLoadedMetadata = () => {
        const video = videoRef.current
        if (!video) return

        setDuration(video.duration)
        if (initialPosition > 0 && initialPosition < video.duration) {
            video.currentTime = initialPosition
        }
    }

    const handlePlay = () => {
        setIsPlaying(true)
        onPlayStateChange(true)
        showControlsTemporarily()
    }

    const handlePause = () => {
        setIsPlaying(false)
        onPlayStateChange(false)
        setShowControls(true)
    }

    const handleEnded = () => {
        setIsPlaying(false)
        onPlayStateChange(false)
        onEnded()
    }

    const handleClose = async () => {
        await exitFullscreen()
        onClose()
    }

    const toggleMute = () => {
        const video = videoRef.current
        if (!video) return

        video.muted = !video.muted
        setIsMuted(video.muted)
    }

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const video = videoRef.current
        if (!video) return

        const time = parseFloat(e.target.value)
        video.currentTime = time
        setCurrentTime(time)
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const handleMouseMove = () => {
        showControlsTemporarily()
    }

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 bg-black z-50 flex items-center justify-center"
            onMouseMove={handleMouseMove}
            onClick={showControlsTemporarily}
        >
            {/* 视频 */}
            <video
                ref={videoRef}
                src={videoUrl}
                className="w-full h-full object-contain"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onPlay={handlePlay}
                onPause={handlePause}
                onEnded={handleEnded}
                onClick={togglePlay}
            />

            {/* 控制条 */}
            <div
                className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
            >
                {/* 标题 */}
                <div className="absolute top-0 left-0 right-0 p-4">
                    <h3 className="text-white text-lg font-medium">{title}</h3>
                </div>

                <div className="p-4 pt-16">
                    {/* 进度条 */}
                    <div className="mb-4">
                        <input
                            type="range"
                            min={0}
                            max={duration || 0}
                            value={currentTime}
                            onChange={handleSeek}
                            className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer
                                [&::-webkit-slider-thumb]:appearance-none
                                [&::-webkit-slider-thumb]:w-4
                                [&::-webkit-slider-thumb]:h-4
                                [&::-webkit-slider-thumb]:rounded-full
                                [&::-webkit-slider-thumb]:bg-white
                                [&::-webkit-slider-thumb]:cursor-pointer"
                        />
                        <div className="flex justify-between text-white/70 text-sm mt-1">
                            <span>{formatTime(currentTime)}</span>
                            <span>{formatTime(duration)}</span>
                        </div>
                    </div>

                    {/* 控制按钮 */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            {/* 后退10秒 */}
                            <button
                                onClick={() => {
                                    const video = videoRef.current
                                    if (video) video.currentTime = Math.max(0, video.currentTime - 10)
                                }}
                                className="text-white hover:text-white/80 transition"
                                title="后退10秒 (←)"
                            >
                                <SkipBack size={24} />
                            </button>

                            {/* 播放/暂停 */}
                            <button
                                onClick={togglePlay}
                                className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition"
                            >
                                {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                            </button>

                            {/* 前进10秒 */}
                            <button
                                onClick={() => {
                                    const video = videoRef.current
                                    if (video) video.currentTime = Math.min(video.duration, video.currentTime + 10)
                                }}
                                className="text-white hover:text-white/80 transition"
                                title="前进10秒 (→)"
                            >
                                <SkipForward size={24} />
                            </button>

                            {/* 音量 */}
                            <button
                                onClick={toggleMute}
                                className="text-white hover:text-white/80 transition"
                                title="静音"
                            >
                                {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
                            </button>
                            <input
                                type="range"
                                min={0}
                                max={1}
                                step={0.1}
                                value={volume}
                                onChange={(e) => {
                                    const val = parseFloat(e.target.value)
                                    setVolume(val)
                                    if (videoRef.current) videoRef.current.volume = val
                                }}
                                className="w-20 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer
                                    [&::-webkit-slider-thumb]:appearance-none
                                    [&::-webkit-slider-thumb]:w-3
                                    [&::-webkit-slider-thumb]:h-3
                                    [&::-webkit-slider-thumb]:rounded-full
                                    [&::-webkit-slider-thumb]:bg-white"
                            />
                        </div>

                        <div className="flex items-center gap-4">
                            {/* 全屏 */}
                            <button
                                onClick={isFullscreen ? exitFullscreen : enterFullscreen}
                                className="text-white hover:text-white/80 transition"
                                title="全屏"
                            >
                                <Maximize size={24} />
                            </button>

                            {/* 关闭 */}
                            <button
                                onClick={handleClose}
                                className="text-white hover:text-white/80 transition"
                                title="退出 (ESC)"
                            >
                                <X size={24} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* 快捷键提示 */}
            <div
                className={`absolute top-4 right-4 text-white/50 text-sm transition-opacity ${showControls ? 'opacity-100' : 'opacity-0'
                    }`}
            >
                <div>← → 快进/后退</div>
                <div>↑ ↓ 音量</div>
                <div>空格 播放/暂停</div>
                <div>ESC 退出</div>
            </div>
        </div>
    )
}
