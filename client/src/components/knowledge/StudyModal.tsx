import React, { useState, useEffect, useCallback } from 'react'
import { X, ChevronLeft, ChevronRight, Check, XCircle, Eye, EyeOff, Settings, Volume2, Image as ImageIcon, Video } from 'lucide-react'

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

interface StudySettings {
    showName: boolean
    showKeywords: boolean
    showBriefNote: boolean
    showSummary: boolean
    showDetail: boolean
    showImages: boolean
    showAudios: boolean
    showVideos: boolean
    autoPlayAudio: boolean
}

interface StudyModalProps {
    sectionName: string
    items: KnowledgeItem[]
    onClose: () => void
    onStudyUpdate: (itemId: number, isCorrect: boolean) => Promise<void>
}

const defaultSettings: StudySettings = {
    showName: true,
    showKeywords: false,
    showBriefNote: false,
    showSummary: false,
    showDetail: false,
    showImages: true,
    showAudios: true,
    showVideos: false,
    autoPlayAudio: false
}

export default function StudyModal({ sectionName, items, onClose, onStudyUpdate }: StudyModalProps) {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [settings, setSettings] = useState<StudySettings>(() => {
        const saved = localStorage.getItem('studySettings')
        return saved ? JSON.parse(saved) : defaultSettings
    })
    const [showSettings, setShowSettings] = useState(false)
    const [revealed, setRevealed] = useState<Record<string, boolean>>({})
    const [updating, setUpdating] = useState(false)

    const currentItem = items[currentIndex]

    // 保存设置
    useEffect(() => {
        localStorage.setItem('studySettings', JSON.stringify(settings))
    }, [settings])

    // 键盘事件处理
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (showSettings) return

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
                goNext()
                break
            case 'Escape':
                onClose()
                break
        }
    }, [currentIndex, showSettings])

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [handleKeyDown])

    const parsePathArray = (paths?: string): string[] => {
        try {
            return paths ? JSON.parse(paths) : []
        } catch {
            return []
        }
    }

    const goNext = () => {
        if (currentIndex < items.length - 1) {
            setCurrentIndex(currentIndex + 1)
            setRevealed({})
        }
    }

    const goPrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1)
            setRevealed({})
        }
    }

    const handleAnswer = async (isCorrect: boolean) => {
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
    }

    const toggleReveal = (field: string) => {
        setRevealed({ ...revealed, [field]: !revealed[field] })
    }

    const imagePaths = parsePathArray(currentItem?.image_paths)
    const audioPaths = parsePathArray(currentItem?.audio_paths)
    const videoPaths = parsePathArray(currentItem?.video_paths)

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
            <div className="flex items-center justify-between p-4 text-white">
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
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className="hover:bg-white/10 rounded-lg p-2 transition"
                    >
                        <Settings size={20} />
                    </button>
                </div>
            </div>

            {/* 进度条 */}
            <div className="px-4">
                <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-teal-400 to-cyan-400 transition-all duration-300"
                        style={{ width: `${((currentIndex + 1) / items.length) * 100}%` }}
                    />
                </div>
            </div>

            {/* 设置面板 */}
            {showSettings && (
                <div className="absolute top-20 right-4 bg-white rounded-xl shadow-2xl p-4 w-64 z-10">
                    <h3 className="font-bold text-gray-800 mb-3">显示设置</h3>
                    <div className="space-y-2">
                        {[
                            { key: 'showName', label: '知识名' },
                            { key: 'showKeywords', label: '关键字' },
                            { key: 'showBriefNote', label: '简注' },
                            { key: 'showSummary', label: '简介' },
                            { key: 'showDetail', label: '详情' },
                            { key: 'showImages', label: '图片' },
                            { key: 'showAudios', label: '音频' },
                            { key: 'showVideos', label: '视频' },
                            { key: 'autoPlayAudio', label: '自动播放音频' }
                        ].map(({ key, label }) => (
                            <label key={key} className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings[key as keyof StudySettings]}
                                    onChange={(e) => setSettings({ ...settings, [key]: e.target.checked })}
                                    className="rounded text-teal-500 focus:ring-teal-500"
                                />
                                <span className="text-sm text-gray-700">{label}</span>
                            </label>
                        ))}
                    </div>
                </div>
            )}

            {/* 主内容区 */}
            <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
                <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 max-w-4xl w-full text-white space-y-6">
                    {/* 知识名 */}
                    {settings.showName && (
                        <div className="text-center">
                            <h1 className="text-4xl font-bold mb-2">{currentItem.name}</h1>
                        </div>
                    )}

                    {/* 关键字 */}
                    {settings.showKeywords && currentItem.keywords && (
                        <div className="flex items-center justify-center gap-2 flex-wrap">
                            {currentItem.keywords.split(/[,，]/).map((kw, i) => (
                                <span key={i} className="px-3 py-1 bg-white/20 rounded-full text-sm">
                                    {kw.trim()}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* 简注 - 可隐藏 */}
                    {settings.showBriefNote && currentItem.brief_note && (
                        <div className="text-center">
                            <button
                                onClick={() => toggleReveal('briefNote')}
                                className="flex items-center gap-2 mx-auto text-white/70 hover:text-white"
                            >
                                {revealed.briefNote ? <EyeOff size={16} /> : <Eye size={16} />}
                                简注
                            </button>
                            {revealed.briefNote && (
                                <p className="mt-2 text-xl text-cyan-200">{currentItem.brief_note}</p>
                            )}
                        </div>
                    )}

                    {/* 简介 - 可隐藏 */}
                    {settings.showSummary && currentItem.summary && (
                        <div>
                            <button
                                onClick={() => toggleReveal('summary')}
                                className="flex items-center gap-2 text-white/70 hover:text-white"
                            >
                                {revealed.summary ? <EyeOff size={16} /> : <Eye size={16} />}
                                简介
                            </button>
                            {revealed.summary && (
                                <p className="mt-2 text-lg leading-relaxed">{currentItem.summary}</p>
                            )}
                        </div>
                    )}

                    {/* 详情 - 可隐藏 */}
                    {settings.showDetail && currentItem.detail && (
                        <div>
                            <button
                                onClick={() => toggleReveal('detail')}
                                className="flex items-center gap-2 text-white/70 hover:text-white"
                            >
                                {revealed.detail ? <EyeOff size={16} /> : <Eye size={16} />}
                                详情
                            </button>
                            {revealed.detail && (
                                <div className="mt-2 text-base leading-relaxed whitespace-pre-wrap">
                                    {currentItem.detail}
                                </div>
                            )}
                        </div>
                    )}

                    {/* 图片 */}
                    {settings.showImages && imagePaths.length > 0 && (
                        <div className="flex flex-wrap gap-4 justify-center">
                            {imagePaths.map((path, i) => (
                                <img
                                    key={i}
                                    src={`/${path}`}
                                    alt=""
                                    className="max-h-48 rounded-xl shadow-lg cursor-pointer hover:scale-105 transition"
                                    onClick={() => window.open(`/${path}`, '_blank')}
                                />
                            ))}
                        </div>
                    )}

                    {/* 音频 */}
                    {settings.showAudios && audioPaths.length > 0 && (
                        <div className="flex flex-wrap gap-4 justify-center">
                            {audioPaths.map((path, i) => (
                                <audio
                                    key={i}
                                    controls
                                    src={`/${path}`}
                                    autoPlay={settings.autoPlayAudio && i === 0}
                                    className="h-10"
                                />
                            ))}
                        </div>
                    )}

                    {/* 视频 */}
                    {settings.showVideos && videoPaths.length > 0 && (
                        <div className="flex flex-wrap gap-4 justify-center">
                            {videoPaths.map((path, i) => (
                                <video
                                    key={i}
                                    controls
                                    src={`/${path}`}
                                    className="max-h-48 rounded-xl"
                                />
                            ))}
                        </div>
                    )}

                    {/* 学习统计 */}
                    <div className="flex justify-center gap-6 text-sm text-white/60 pt-4">
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

            {/* 底部操作栏 */}
            <div className="p-6 flex items-center justify-center gap-8">
                <button
                    onClick={goPrev}
                    disabled={currentIndex === 0}
                    className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    <ChevronLeft size={24} />
                </button>

                <button
                    onClick={() => handleAnswer(false)}
                    disabled={updating}
                    className="px-8 py-4 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white rounded-2xl transition shadow-lg flex items-center gap-2 font-bold text-lg disabled:opacity-50"
                >
                    <XCircle size={24} />
                    错了 (←)
                </button>

                <button
                    onClick={() => handleAnswer(true)}
                    disabled={updating}
                    className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-2xl transition shadow-lg flex items-center gap-2 font-bold text-lg disabled:opacity-50"
                >
                    <Check size={24} />
                    对了 (→)
                </button>

                <button
                    onClick={goNext}
                    disabled={currentIndex >= items.length - 1}
                    className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    <ChevronRight size={24} />
                </button>
            </div>

            {/* 键盘提示 */}
            <div className="text-center pb-4 text-white/40 text-sm">
                键盘操作：← 错误 | → 正确 | 空格 下一个 | ESC 退出
            </div>
        </div>
    )
}
