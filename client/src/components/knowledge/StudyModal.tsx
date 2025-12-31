import React, { useState, useEffect, useCallback, useRef } from 'react'
import { X, ChevronLeft, ChevronRight, Check, XCircle } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

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

    // 阶段2时自动播放音频，阶段3时自动播放视频
    useEffect(() => {
        if (revealStage === 2) {
            // 阶段2：自动播放第一个音频
            setTimeout(() => {
                if (audioRefs.current.length > 0) {
                    audioRefs.current[0]?.play().catch(() => { })
                }
            }, 100)
        } else if (revealStage === 3) {
            // 阶段3：自动播放第一个视频
            setTimeout(() => {
                if (videoRefs.current.length > 0) {
                    videoRefs.current[0]?.play().catch(() => { })
                }
            }, 100)
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
                className="flex-1 flex flex-col overflow-auto cursor-pointer select-none p-4"
                onClick={handleContentClick}
            >
                {/* 上半部分：左-关键字，右-简注+简介+音频 */}
                <div className="flex gap-4 mb-4" style={{ minHeight: revealStage === 1 ? '50vh' : '15vh' }}>
                    {/* 左上: 知识关键字 - 始终显示 */}
                    <div className="flex-1 bg-white/10 backdrop-blur-lg rounded-2xl py-2 px-4 flex items-center justify-center">
                        {currentItem.keywords ? (
                            <div className="flex items-center justify-center gap-3 md:gap-6 flex-wrap">
                                {currentItem.keywords.split(/[,，]/).filter(kw => kw.trim()).map((kw, i) => (
                                    <span
                                        key={i}
                                        className="px-4 md:px-6 py-2 md:py-3 bg-gradient-to-r from-cyan-500/40 to-teal-500/40 backdrop-blur-sm rounded-xl md:rounded-2xl font-bold text-white shadow-2xl border-2 border-white/30 animate-pulse"
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

                    {/* 右上: 简注 + 简介 + 音频 - 阶段2+ */}
                    {revealStage >= 2 && (
                        <div className="flex-1 bg-white/10 backdrop-blur-lg rounded-2xl p-6 text-white overflow-auto animate-fadeIn">
                            {/* 简注 */}
                            <div className="mb-4">
                                <h3 className="text-lg font-semibold text-cyan-300 mb-2">📝 简注</h3>
                                <p className="text-2xl md:text-3xl leading-relaxed">
                                    {currentItem.brief_note || '暂无简注'}
                                </p>
                            </div>
                            {/* 简介 */}
                            {currentItem.summary && (
                                <div className="mb-4">
                                    <h3 className="text-lg font-semibold text-cyan-300 mb-2">📋 简介</h3>
                                    <div className="text-xl leading-relaxed prose prose-invert prose-lg max-w-none">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {currentItem.summary}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                            )}
                            {/* 音频 */}
                            {audioPaths.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-semibold text-cyan-300 mb-2">🔊 音频</h3>
                                    <div className="flex flex-wrap gap-2">
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
                        </div>
                    )}
                </div>

                {/* 下半部分：详情、图片、视频 - 阶段3 */}
                {revealStage >= 3 && (
                    <div className="flex-1 animate-fadeIn">
                        {(() => {
                            // 计算底部有哪些元素需要显示
                            const hasDetail = !!currentItem.detail
                            const hasImages = imagePaths.length > 0
                            const hasVideos = videoPaths.length > 0
                            const bottomItems = [hasDetail, hasImages, hasVideos].filter(Boolean).length

                            if (bottomItems === 0) {
                                return (
                                    <div className="h-full bg-white/10 backdrop-blur-lg rounded-2xl p-6 flex items-center justify-center">
                                        <div className="text-center text-white/50">
                                            <p className="text-lg mb-2">暂无更多内容</p>
                                            {/* 学习统计 */}
                                            <div className="flex flex-wrap justify-center gap-4 text-sm text-white/70 mt-4">
                                                <span className="flex items-center gap-1">
                                                    <Check size={14} className="text-green-400" />
                                                    正确 {currentItem.correct_count || 0}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <XCircle size={14} className="text-red-400" />
                                                    错误 {currentItem.wrong_count || 0}
                                                </span>
                                                <span>连正 {currentItem.consecutive_correct || 0}</span>
                                                <span>连错 {currentItem.consecutive_wrong || 0}</span>
                                            </div>
                                        </div>
                                    </div>
                                )
                            }

                            return (
                                <div className={`h-full grid gap-4 ${bottomItems === 1 ? 'grid-cols-1' :
                                    bottomItems === 2 ? 'grid-cols-2' :
                                        'grid-cols-3'
                                    }`}>
                                    {/* 详情 */}
                                    {hasDetail && (
                                        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 text-white overflow-auto">
                                            <h3 className="text-lg font-semibold text-cyan-300 mb-2">📚 详情</h3>
                                            <div className="prose prose-invert prose-lg max-w-none 
                                                prose-headings:text-cyan-200 prose-headings:font-bold
                                                prose-p:text-white prose-p:leading-relaxed
                                                prose-strong:text-yellow-300 prose-strong:font-bold
                                                prose-em:text-pink-300
                                                prose-ul:text-white prose-ol:text-white
                                                prose-li:marker:text-cyan-400
                                                prose-code:text-green-300 prose-code:bg-black/30 prose-code:px-1 prose-code:rounded
                                                prose-pre:bg-black/40 prose-pre:rounded-xl
                                                prose-blockquote:border-l-cyan-400 prose-blockquote:text-white/80
                                                prose-a:text-cyan-300 prose-a:underline
                                                prose-table:text-white prose-th:text-cyan-200 prose-td:border-white/20
                                            ">
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                    {currentItem.detail}
                                                </ReactMarkdown>
                                            </div>
                                        </div>
                                    )}

                                    {/* 图片 */}
                                    {hasImages && (
                                        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 overflow-auto">
                                            <h3 className="text-lg font-semibold text-cyan-300 mb-3 sticky top-0 bg-inherit">🖼️ 图片</h3>
                                            <div className="flex flex-col gap-4">
                                                {imagePaths.map((path, i) => (
                                                    <img
                                                        key={i}
                                                        src={`/${path}`}
                                                        alt=""
                                                        className="w-full object-contain rounded-xl shadow-lg cursor-pointer hover:opacity-90 transition"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            window.open(`/${path}`, '_blank')
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* 视频 */}
                                    {hasVideos && (
                                        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 overflow-auto">
                                            <h3 className="text-lg font-semibold text-cyan-300 mb-3 sticky top-0 bg-inherit">🎬 视频</h3>
                                            <div className="flex flex-col gap-4">
                                                {videoPaths.map((path, i) => (
                                                    <video
                                                        key={i}
                                                        ref={(el) => { if (el) videoRefs.current[i] = el }}
                                                        controls
                                                        src={`/${path}`}
                                                        className="w-full rounded-xl"
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })()}

                        {/* 学习统计 - 固定在底部区域下方 */}
                        {(currentItem.detail || imagePaths.length > 0 || videoPaths.length > 0) && (
                            <div className="mt-4 bg-white/5 backdrop-blur-lg rounded-2xl p-3">
                                <div className="flex flex-wrap justify-center gap-6 text-sm text-white/70">
                                    <span className="flex items-center gap-1">
                                        <Check size={14} className="text-green-400" />
                                        正确 {currentItem.correct_count || 0}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <XCircle size={14} className="text-red-400" />
                                        错误 {currentItem.wrong_count || 0}
                                    </span>
                                    <span>连正 {currentItem.consecutive_correct || 0}</span>
                                    <span>连错 {currentItem.consecutive_wrong || 0}</span>
                                </div>
                            </div>
                        )}
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
