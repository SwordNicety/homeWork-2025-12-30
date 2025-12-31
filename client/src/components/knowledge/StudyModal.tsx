import React, { useState, useEffect, useCallback, useRef } from 'react'
import { X, ChevronLeft, ChevronRight, Check, XCircle } from 'lucide-react'

interface KnowledgeItem {
    id: number
    section_id: number
    name: string
    keywords?: string
    brief_note?: string
    summary?: string
    detail?: string
    audio_paths?: string
    image_paths?: string
    video_paths?: string
    correct_count?: number
    wrong_count?: number
    consecutive_correct?: number
    consecutive_wrong?: number
}

interface StudyModalProps {
    sectionName: string
    items: KnowledgeItem[]
    onClose: () => void
    onStudyUpdate: (itemId: number, isCorrect: boolean) => Promise<void>
}

// 展示阶段: 1=只显示关键字, 2=追加简注, 3=显示全部内容
type RevealStage = 1 | 2 | 3

export default function StudyModal({ sectionName, items, onClose, onStudyUpdate }: StudyModalProps) {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [revealStage, setRevealStage] = useState<RevealStage>(1)
    const [updating, setUpdating] = useState(false)
    const [keywordFontSize, setKeywordFontSize] = useState(400)

    const audioRefs = useRef<HTMLAudioElement[]>([])
    const videoRefs = useRef<HTMLVideoElement[]>([])

    const currentItem = items[currentIndex]

    // 加载配置
    useEffect(() => {
        fetch('/configs/config.json')
            .then(res => res.json())
            .then(config => {
                if (config.knowledgeBaseConfig?.keywordDisplayHeight) {
                    setKeywordFontSize(config.knowledgeBaseConfig.keywordDisplayHeight)
                }
            })
            .catch(() => { })
    }, [])

    // 切换到下一个知识点时重置阶段
    useEffect(() => {
        setRevealStage(1)
        audioRefs.current = []
        videoRefs.current = []
    }, [currentIndex])

    // 进入阶段3时自动播放音视频
    useEffect(() => {
        if (revealStage === 3) {
            // 自动播放第一个音频
            if (audioRefs.current.length > 0) {
                audioRefs.current[0]?.play().catch(() => { })
            }
            // 自动播放第一个视频
            if (videoRefs.current.length > 0) {
                videoRefs.current[0]?.play().catch(() => { })
            }
        }
    }, [revealStage])

    const parsePathArray = (paths?: string): string[] => {
        try {
            return paths ? JSON.parse(paths) : []
        } catch {
            return []
        }
    }

    // 推进展示阶段
    const advanceStage = useCallback(() => {
        if (revealStage < 3) {
            setRevealStage((prev) => (prev + 1) as RevealStage)
        }
    }, [revealStage])

    const goNext = useCallback(() => {
        if (currentIndex < items.length - 1) {
            setCurrentIndex(currentIndex + 1)
        }
    }, [currentIndex, items.length])

    const goPrev = useCallback(() => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1)
        }
    }, [currentIndex])

    const handleAnswer = useCallback(async (isCorrect: boolean) => {
        if (updating) return
        setUpdating(true)
        try {
            await onStudyUpdate(currentItem.id, isCorrect)
            goNext()
        } catch (error) {
            console.error('Failed to update study:', error)
        } finally {
            setUpdating(false)
        }
    }, [updating, currentItem?.id, onStudyUpdate, goNext])

    // 键盘事件处理
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        switch (e.key) {
            case 'ArrowLeft':
                e.preventDefault()
                handleAnswer(false)
                break
            case 'ArrowRight':
                e.preventDefault()
                handleAnswer(true)
                break
            case ' ':
                e.preventDefault()
                // 空格键：如果未完全展示则推进阶段，否则跳到下一个
                if (revealStage < 3) {
                    advanceStage()
                } else {
                    goNext()
                }
                break
            case 'Escape':
                onClose()
                break
        }
    }, [revealStage, advanceStage, goNext, handleAnswer, onClose])

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [handleKeyDown])

    // 点击主内容区推进阶段
    const handleContentClick = () => {
        if (revealStage < 3) {
            advanceStage()
        }
    }

    const imagePaths = parsePathArray(currentItem?.image_paths)
    const audioPaths = parsePathArray(currentItem?.audio_paths)
    const videoPaths = parsePathArray(currentItem?.video_paths)

    // 计算字体大小：基于配置的高度值，转换为合适的字体大小
    // keywordFontSize 配置值作为关键字区域高度，字体大小约为高度的1/3
    const calculatedFontSize = Math.max(48, Math.min(keywordFontSize / 3, 200))

    if (!currentItem) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white rounded-2xl p-8 text-center">
                    <p className="text-xl text-gray-600">没有可学习的知识条目</p>
                    <button onClick={onClose} className="mt-4 px-6 py-2 bg-teal-500 text-white rounded-lg">
                        返回
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col z-50">
            {/* 顶部栏 */}
            <div className="flex items-center justify-between p-4 text-white shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="hover:bg-white/10 rounded-lg p-2 transition">
                        <X size={24} />
                    </button>
                    <h2 className="text-xl font-bold">{sectionName}</h2>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-white/70">
                        {currentIndex + 1} / {items.length}
                    </span>
                    {/* 阶段指示器 */}
                    <div className="flex items-center gap-1">
                        {[1, 2, 3].map((stage) => (
                            <div
                                key={stage}
                                className={`w-3 h-3 rounded-full transition-all ${revealStage >= stage ? 'bg-cyan-400' : 'bg-white/20'
                                    }`}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* 进度条 */}
            <div className="px-4 shrink-0">
                <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-teal-400 to-cyan-400 transition-all duration-300"
                        style={{ width: `${((currentIndex + 1) / items.length) * 100}%` }}
                    />
                </div>
            </div>

            {/* 主内容区 - 可点击推进阶段 */}
            <div
                className="flex-1 flex flex-col overflow-auto cursor-pointer select-none"
                onClick={handleContentClick}
            >
                {/* 阶段1: 知识关键字 - 占据屏幕一半 */}
                <div
                    className="flex items-center justify-center px-8 transition-all duration-500"
                    style={{
                        minHeight: revealStage === 1 ? '50vh' : keywordFontSize,
                        height: revealStage === 1 ? '50vh' : 'auto'
                    }}
                >
                    {currentItem.keywords ? (
                        <div className="flex items-center justify-center gap-4 md:gap-8 flex-wrap">
                            {currentItem.keywords.split(/[,，]/).filter(kw => kw.trim()).map((kw, i) => (
                                <span
                                    key={i}
                                    className="px-6 md:px-10 py-4 md:py-6 bg-gradient-to-r from-cyan-500/40 to-teal-500/40 backdrop-blur-sm rounded-2xl md:rounded-3xl font-bold text-white shadow-2xl border-2 border-white/30 animate-pulse"
                                    style={{ fontSize: `${calculatedFontSize}px` }}
                                >
                                    {kw.trim()}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <span
                            className="text-white/50 font-bold"
                            style={{ fontSize: `${calculatedFontSize}px` }}
                        >
                            {currentItem.name}
                        </span>
                    )}
                </div>

                {/* 阶段2+: 知识简注 */}
                {revealStage >= 2 && (
                    <div className="px-8 py-6 animate-fadeIn">
                        <div className="max-w-4xl mx-auto bg-white/10 backdrop-blur-lg rounded-2xl p-6 text-white">
                            <h3 className="text-lg font-semibold text-cyan-300 mb-2">📝 简注</h3>
                            <p className="text-2xl md:text-3xl leading-relaxed">
                                {currentItem.brief_note || '暂无简注'}
                            </p>
                        </div>
                    </div>
                )}

                {/* 阶段3: 全部内容 */}
                {revealStage >= 3 && (
                    <div className="px-8 py-4 space-y-6 animate-fadeIn">
                        <div className="max-w-5xl mx-auto space-y-6">
                            {/* 知识名 */}
                            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 text-white">
                                <h3 className="text-lg font-semibold text-cyan-300 mb-2">📖 知识名</h3>
                                <h1 className="text-3xl md:text-4xl font-bold">{currentItem.name}</h1>
                            </div>

                            {/* 简介 */}
                            {currentItem.summary && (
                                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 text-white">
                                    <h3 className="text-lg font-semibold text-cyan-300 mb-2">📋 简介</h3>
                                    <p className="text-xl leading-relaxed">{currentItem.summary}</p>
                                </div>
                            )}

                            {/* 详情 */}
                            {currentItem.detail && (
                                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 text-white">
                                    <h3 className="text-lg font-semibold text-cyan-300 mb-2">📚 详情</h3>
                                    <div className="text-lg leading-relaxed whitespace-pre-wrap">
                                        {currentItem.detail}
                                    </div>
                                </div>
                            )}

                            {/* 图片 */}
                            {imagePaths.length > 0 && (
                                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
                                    <h3 className="text-lg font-semibold text-cyan-300 mb-4">🖼️ 图片</h3>
                                    <div className="flex flex-wrap gap-4 justify-center">
                                        {imagePaths.map((path, i) => (
                                            <img
                                                key={i}
                                                src={`/${path}`}
                                                alt=""
                                                className="max-h-64 rounded-xl shadow-lg cursor-pointer hover:scale-105 transition"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    window.open(`/${path}`, '_blank')
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* 音频 */}
                            {audioPaths.length > 0 && (
                                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
                                    <h3 className="text-lg font-semibold text-cyan-300 mb-4">🔊 音频</h3>
                                    <div className="flex flex-wrap gap-4 justify-center">
                                        {audioPaths.map((path, i) => (
                                            <audio
                                                key={i}
                                                ref={(el) => { if (el) audioRefs.current[i] = el }}
                                                controls
                                                src={`/${path}`}
                                                className="h-12"
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* 视频 */}
                            {videoPaths.length > 0 && (
                                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
                                    <h3 className="text-lg font-semibold text-cyan-300 mb-4">🎬 视频</h3>
                                    <div className="flex flex-wrap gap-4 justify-center">
                                        {videoPaths.map((path, i) => (
                                            <video
                                                key={i}
                                                ref={(el) => { if (el) videoRefs.current[i] = el }}
                                                controls
                                                src={`/${path}`}
                                                className="max-h-64 rounded-xl"
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* 学习统计 */}
                            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-4">
                                <div className="flex justify-center gap-8 text-base text-white/70">
                                    <span className="flex items-center gap-2">
                                        <Check size={18} className="text-green-400" />
                                        正确 {currentItem.correct_count || 0}
                                    </span>
                                    <span className="flex items-center gap-2">
                                        <XCircle size={18} className="text-red-400" />
                                        错误 {currentItem.wrong_count || 0}
                                    </span>
                                    <span>连续正确 {currentItem.consecutive_correct || 0}</span>
                                    <span>连续错误 {currentItem.consecutive_wrong || 0}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 点击提示 */}
                {revealStage < 3 && (
                    <div className="text-center py-8 text-white/50 text-lg animate-bounce">
                        👆 点击屏幕或按空格键查看更多
                    </div>
                )}
            </div>

            {/* 底部操作栏 */}
            <div className="p-4 md:p-6 flex items-center justify-center gap-4 md:gap-8 shrink-0 bg-black/20">
                <button
                    onClick={(e) => { e.stopPropagation(); goPrev() }}
                    disabled={currentIndex === 0}
                    className="px-4 md:px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    <ChevronLeft size={24} />
                </button>

                <button
                    onClick={(e) => { e.stopPropagation(); handleAnswer(false) }}
                    disabled={updating}
                    className="px-6 md:px-8 py-3 md:py-4 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white rounded-2xl transition shadow-lg flex items-center gap-2 font-bold text-base md:text-lg disabled:opacity-50"
                >
                    <XCircle size={24} />
                    错了 (←)
                </button>

                <button
                    onClick={(e) => { e.stopPropagation(); handleAnswer(true) }}
                    disabled={updating}
                    className="px-6 md:px-8 py-3 md:py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-2xl transition shadow-lg flex items-center gap-2 font-bold text-base md:text-lg disabled:opacity-50"
                >
                    <Check size={24} />
                    对了 (→)
                </button>

                <button
                    onClick={(e) => { e.stopPropagation(); goNext() }}
                    disabled={currentIndex >= items.length - 1}
                    className="px-4 md:px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    <ChevronRight size={24} />
                </button>
            </div>

            {/* 键盘提示 */}
            <div className="text-center pb-3 text-white/40 text-sm shrink-0">
                键盘操作：← 错误 | → 正确 | 空格 {revealStage < 3 ? '查看更多' : '下一个'} | ESC 退出
            </div>

            {/* 动画样式 */}
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.5s ease-out;
                }
            `}</style>
        </div>
    )
}
