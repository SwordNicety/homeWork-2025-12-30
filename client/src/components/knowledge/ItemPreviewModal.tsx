import React, { useEffect, useRef, useState } from 'react'
import { X, Edit2, ChevronLeft, ChevronRight } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface KnowledgeItem {
    id: string
    section_id?: string
    subsection_id?: string
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

interface ItemPreviewModalProps {
    item: KnowledgeItem
    items?: KnowledgeItem[] // 所有知识点列表，用于上下切换
    currentIndex?: number // 当前知识点在列表中的索引
    onClose: () => void
    onEdit?: () => void
    onNavigate?: (index: number) => void // 切换知识点回调
}

export default function ItemPreviewModal({ item, items, currentIndex, onClose, onEdit, onNavigate }: ItemPreviewModalProps) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0)
    const audioRef = useRef<HTMLAudioElement>(null)
    const videoRef = useRef<HTMLVideoElement>(null)

    const parsePathArray = (paths?: string): string[] => {
        try {
            return paths ? JSON.parse(paths) : []
        } catch {
            return []
        }
    }

    const imagePaths = parsePathArray(item.image_paths)
    const audioPaths = parsePathArray(item.audio_paths)
    const videoPaths = parsePathArray(item.video_paths)

    // 上一条/下一条导航
    const canGoPrev = items && currentIndex !== undefined && currentIndex > 0
    const canGoNext = items && currentIndex !== undefined && currentIndex < items.length - 1

    const goPrev = () => {
        if (canGoPrev && onNavigate) {
            onNavigate(currentIndex - 1)
        }
    }

    const goNext = () => {
        if (canGoNext && onNavigate) {
            onNavigate(currentIndex + 1)
        }
    }

    // 键盘事件处理
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.key) {
                case 'Escape':
                    onClose()
                    break
                case 'ArrowLeft':
                    e.preventDefault()
                    // 优先导航知识点，如果没有导航则切换图片
                    if (canGoPrev) {
                        goPrev()
                    } else if (imagePaths.length > 1) {
                        setCurrentImageIndex(prev => (prev > 0 ? prev - 1 : imagePaths.length - 1))
                    }
                    break
                case 'ArrowRight':
                    e.preventDefault()
                    // 优先导航知识点，如果没有导航则切换图片
                    if (canGoNext) {
                        goNext()
                    } else if (imagePaths.length > 1) {
                        setCurrentImageIndex(prev => (prev < imagePaths.length - 1 ? prev + 1 : 0))
                    }
                    break
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [onClose, imagePaths.length, canGoPrev, canGoNext])

    // 自动播放音频
    useEffect(() => {
        if (audioPaths.length > 0 && audioRef.current) {
            audioRef.current.play().catch(() => { })
        }
    }, [])

    return (
        <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex flex-col z-50">
            {/* 顶部栏 */}
            <div className="flex items-center justify-between p-4 text-white shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="hover:bg-white/10 rounded-lg p-2 transition">
                        <X size={24} />
                    </button>
                    <h2 className="text-xl font-bold">知识预览</h2>
                </div>
                <div className="flex items-center gap-4">
                    {onEdit && (
                        <button
                            onClick={onEdit}
                            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition"
                        >
                            <Edit2 size={18} />
                            编辑
                        </button>
                    )}
                </div>
            </div>

            {/* 主内容区 */}
            <div className="flex-1 overflow-auto p-6">
                <div className="max-w-4xl mx-auto space-y-6">
                    {/* 知识名称和关键字 */}
                    <div className="text-center">
                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{item.name}</h1>
                        {item.keywords && (
                            <div className="flex flex-wrap justify-center gap-2">
                                {item.keywords.split(/[,，]/).map((kw, i) => (
                                    <span key={i} className="px-3 py-1 bg-white/10 text-white/80 rounded-full text-sm">
                                        {kw.trim()}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 简注 */}
                    {item.brief_note && (
                        <div className="text-center">
                            <p className="text-2xl text-amber-300 font-medium">{item.brief_note}</p>
                        </div>
                    )}

                    {/* 图片展示 */}
                    {imagePaths.length > 0 && (
                        <div className="relative">
                            <div className="flex justify-center">
                                <img
                                    src={`/${imagePaths[currentImageIndex]}`}
                                    alt=""
                                    className="max-h-80 object-contain rounded-xl shadow-2xl"
                                />
                            </div>
                            {imagePaths.length > 1 && (
                                <>
                                    <button
                                        onClick={() => setCurrentImageIndex(prev => (prev > 0 ? prev - 1 : imagePaths.length - 1))}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition"
                                    >
                                        <ChevronLeft size={24} />
                                    </button>
                                    <button
                                        onClick={() => setCurrentImageIndex(prev => (prev < imagePaths.length - 1 ? prev + 1 : 0))}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition"
                                    >
                                        <ChevronRight size={24} />
                                    </button>
                                    <div className="flex justify-center gap-2 mt-4">
                                        {imagePaths.map((_, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setCurrentImageIndex(idx)}
                                                className={`w-3 h-3 rounded-full transition ${idx === currentImageIndex ? 'bg-white' : 'bg-white/30'
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* 音频播放 */}
                    {audioPaths.length > 0 && (
                        <div className="flex flex-col gap-2 items-center">
                            {audioPaths.map((audioPath, idx) => (
                                <audio
                                    key={idx}
                                    ref={idx === 0 ? audioRef : null}
                                    controls
                                    src={`/${audioPath}`}
                                    className="w-full max-w-md"
                                />
                            ))}
                        </div>
                    )}

                    {/* 视频播放 */}
                    {videoPaths.length > 0 && (
                        <div className="flex flex-col gap-4 items-center">
                            {videoPaths.map((videoPath, idx) => (
                                <video
                                    key={idx}
                                    ref={idx === 0 ? videoRef : null}
                                    controls
                                    src={`/${videoPath}`}
                                    className="w-full max-w-2xl rounded-xl"
                                />
                            ))}
                        </div>
                    )}

                    {/* 简介 */}
                    {item.summary && (
                        <div className="bg-white/10 rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-white/70 mb-3">简介</h3>
                            <div className="prose prose-invert max-w-none">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {item.summary}
                                </ReactMarkdown>
                            </div>
                        </div>
                    )}

                    {/* 详情 */}
                    {item.detail && (
                        <div className="bg-white/10 rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-white/70 mb-3">详情</h3>
                            <div className="prose prose-invert max-w-none">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {item.detail}
                                </ReactMarkdown>
                            </div>
                        </div>
                    )}

                    {/* 学习统计 */}
                    <div className="bg-white/5 rounded-xl p-4">
                        <div className="flex justify-center gap-8 text-sm">
                            <div className="text-center">
                                <div className="text-green-400 font-bold text-xl">{item.correct_count || 0}</div>
                                <div className="text-white/50">正确</div>
                            </div>
                            <div className="text-center">
                                <div className="text-red-400 font-bold text-xl">{item.wrong_count || 0}</div>
                                <div className="text-white/50">错误</div>
                            </div>
                            <div className="text-center">
                                <div className="text-blue-400 font-bold text-xl">{item.consecutive_correct || 0}</div>
                                <div className="text-white/50">连续正确</div>
                            </div>
                            <div className="text-center">
                                <div className="text-orange-400 font-bold text-xl">{item.consecutive_wrong || 0}</div>
                                <div className="text-white/50">连续错误</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 底部操作栏 - 上一条/下一条按钮 */}
            {items && items.length > 1 && (
                <div className="p-4 md:p-6 flex items-center justify-center gap-4 md:gap-8 shrink-0 bg-black/20">
                    <button
                        onClick={goPrev}
                        disabled={!canGoPrev}
                        className="px-4 md:px-6 py-3 bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-xl transition flex items-center gap-2"
                    >
                        <ChevronLeft size={24} />
                        <span className="hidden md:inline">上一条</span>
                        <span className="hidden md:inline text-sm text-white/60">(←)</span>
                    </button>

                    <div className="text-white/60 text-sm">
                        {(currentIndex || 0) + 1} / {items.length}
                    </div>

                    <button
                        onClick={goNext}
                        disabled={!canGoNext}
                        className="px-4 md:px-6 py-3 bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-xl transition flex items-center gap-2"
                    >
                        <span className="hidden md:inline">下一条</span>
                        <span className="hidden md:inline text-sm text-white/60">(→)</span>
                        <ChevronRight size={24} />
                    </button>
                </div>
            )}

            {/* 底部提示 */}
            <div className="p-4 text-center text-white/50 text-sm shrink-0">
                按 ESC 关闭 {items && items.length > 1 ? '| ← → 切换知识点' : (imagePaths.length > 1 ? '| 左右箭头切换图片' : '')}
            </div>
        </div>
    )
}
