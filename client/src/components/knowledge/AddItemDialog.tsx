import React, { useState, useEffect } from 'react'
import { X, Upload, Check, Plus, Trash2, Image, Music, Video, RotateCcw } from 'lucide-react'

interface KnowledgeItem {
    id?: number
    section_id: number
    name: string
    keywords?: string
    brief_note?: string
    summary?: string
    detail?: string
    sort_weight?: number
    audio_paths?: string
    image_paths?: string
    video_paths?: string
    correct_count?: number
    wrong_count?: number
    consecutive_correct?: number
    consecutive_wrong?: number
    last_study_at?: string
    last_correct_at?: string
    last_wrong_at?: string
    created_at?: string
    updated_at?: string
}

interface AddItemDialogProps {
    sectionId: number
    categoryDir: string
    sectionDir: string
    item?: KnowledgeItem | null
    onClose: () => void
    onSuccess: () => void
}

// 格式化时间为 UTC+8
function formatDateTime(dateStr?: string): string {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return date.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
}

export default function AddItemDialog({ sectionId, categoryDir, sectionDir, item, onClose, onSuccess }: AddItemDialogProps) {
    const [formData, setFormData] = useState<KnowledgeItem>({
        section_id: sectionId,
        name: '',
        keywords: '',
        brief_note: '',
        summary: '',
        detail: '',
        sort_weight: 0,
        audio_paths: '[]',
        image_paths: '[]',
        video_paths: '[]'
    })

    const [uploading, setUploading] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const [localItem, setLocalItem] = useState<KnowledgeItem | null | undefined>(item)

    useEffect(() => {
        if (item) {
            setFormData({
                ...item,
                audio_paths: item.audio_paths || '[]',
                image_paths: item.image_paths || '[]',
                video_paths: item.video_paths || '[]'
            })
            setLocalItem(item)
        }
    }, [item])

    // 清理单个条目的学习记录
    const handleClearStudyRecord = async () => {
        if (!item?.id || !confirm('确定要清理此知识点的学习记录吗？\n此操作不可恢复！')) {
            return
        }

        try {
            const response = await fetch(`/api/knowledge/items/${item.id}/clear-study-record`, {
                method: 'PUT'
            })
            const result = await response.json()
            if (result.success) {
                // 更新本地显示
                setLocalItem(prev => prev ? {
                    ...prev,
                    correct_count: 0,
                    wrong_count: 0,
                    consecutive_correct: 0,
                    consecutive_wrong: 0,
                    last_study_at: undefined,
                    last_correct_at: undefined,
                    last_wrong_at: undefined
                } : null)
                alert('已清理学习记录')
            } else {
                alert('清理失败: ' + result.error)
            }
        } catch (error) {
            alert('清理失败: ' + error)
        }
    }

    const parsePathArray = (paths?: string): string[] => {
        try {
            return paths ? JSON.parse(paths) : []
        } catch {
            return []
        }
    }

    const handleFileUpload = async (type: 'image' | 'audio' | 'video', e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(type)
        try {
            const uploadFormData = new FormData()
            uploadFormData.append('file', file)

            const response = await fetch(`/api/upload/knowledge-media?categoryDir=${categoryDir}&sectionDir=${sectionDir}&type=${type}`, {
                method: 'POST',
                body: uploadFormData
            })

            const result = await response.json()
            if (result.success) {
                const fieldName = `${type}_paths` as keyof KnowledgeItem
                const currentPaths = parsePathArray(formData[fieldName] as string)
                currentPaths.push(result.data.path)
                setFormData({ ...formData, [fieldName]: JSON.stringify(currentPaths) })
            } else {
                alert('上传失败: ' + result.error)
            }
        } catch (error) {
            alert('上传失败: ' + error)
        } finally {
            setUploading(null)
        }
    }

    const removeFile = (type: 'image' | 'audio' | 'video', index: number) => {
        const fieldName = `${type}_paths` as keyof KnowledgeItem
        const currentPaths = parsePathArray(formData[fieldName] as string)
        currentPaths.splice(index, 1)
        setFormData({ ...formData, [fieldName]: JSON.stringify(currentPaths) })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.name.trim()) {
            alert('请输入知识名')
            return
        }

        setSaving(true)
        try {
            const url = item?.id
                ? `/api/knowledge/items/${item.id}`
                : '/api/knowledge/items'
            const method = item?.id ? 'PUT' : 'POST'

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            const result = await response.json()
            if (result.success) {
                onSuccess()
                onClose()
            } else {
                alert('保存失败: ' + result.error)
            }
        } catch (error) {
            alert('保存失败: ' + error)
        } finally {
            setSaving(false)
        }
    }

    const imagePaths = parsePathArray(formData.image_paths)
    const audioPaths = parsePathArray(formData.audio_paths)
    const videoPaths = parsePathArray(formData.video_paths)

    return (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="sticky top-0 bg-gradient-to-r from-teal-500 to-cyan-500 text-white p-6 rounded-t-2xl z-10">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold">{item ? '编辑知识条目' : '添加知识条目'}</h2>
                        <button onClick={onClose} className="text-white hover:bg-white/20 rounded-lg p-2 transition">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* 基本信息 */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                知识名 <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                placeholder="知识点名称"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">知识关键字</label>
                            <input
                                type="text"
                                value={formData.keywords || ''}
                                onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                placeholder="关键字，用逗号分隔"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">排序权重</label>
                            <input
                                type="number"
                                value={formData.sort_weight || 0}
                                onChange={(e) => setFormData({ ...formData, sort_weight: parseInt(e.target.value) || 0 })}
                                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">知识简注</label>
                            <input
                                type="text"
                                value={formData.brief_note || ''}
                                onChange={(e) => setFormData({ ...formData, brief_note: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                placeholder="一句话简注"
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">知识简介</label>
                            <textarea
                                value={formData.summary || ''}
                                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                rows={2}
                                placeholder="简要介绍"
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">知识详情</label>
                            <textarea
                                value={formData.detail || ''}
                                onChange={(e) => setFormData({ ...formData, detail: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                rows={4}
                                placeholder="详细内容"
                            />
                        </div>
                    </div>

                    {/* 媒体资源 */}
                    <div className="space-y-4 border-t pt-4">
                        <h3 className="font-semibold text-gray-800">媒体资源</h3>

                        {/* 图片 */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Image size={16} /> 图片
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {imagePaths.map((path, index) => (
                                    <div key={index} className="relative">
                                        <img src={`/${path}`} alt="" className="w-20 h-20 object-cover rounded-lg" />
                                        <button
                                            type="button"
                                            onClick={() => removeFile('image', index)}
                                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}
                                <label className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-50">
                                    <input type="file" accept="image/*" onChange={(e) => handleFileUpload('image', e)} className="hidden" />
                                    {uploading === 'image' ? '⏳' : <Plus className="text-gray-400" />}
                                </label>
                            </div>
                        </div>

                        {/* 音频 */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Music size={16} /> 音频
                            </label>
                            <div className="space-y-2">
                                {audioPaths.map((path, index) => (
                                    <div key={index} className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg">
                                        <audio controls src={`/${path}`} className="flex-1 h-8" />
                                        <button
                                            type="button"
                                            onClick={() => removeFile('audio', index)}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                                <label className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200">
                                    <input type="file" accept="audio/*" onChange={(e) => handleFileUpload('audio', e)} className="hidden" />
                                    {uploading === 'audio' ? '上传中...' : <><Plus size={16} /> 添加音频</>}
                                </label>
                            </div>
                        </div>

                        {/* 视频 */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Video size={16} /> 视频
                            </label>
                            <div className="space-y-2">
                                {videoPaths.map((path, index) => (
                                    <div key={index} className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg">
                                        <video controls src={`/${path}`} className="flex-1 max-h-32 rounded" />
                                        <button
                                            type="button"
                                            onClick={() => removeFile('video', index)}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                                <label className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200">
                                    <input type="file" accept="video/*" onChange={(e) => handleFileUpload('video', e)} className="hidden" />
                                    {uploading === 'video' ? '上传中...' : <><Plus size={16} /> 添加视频</>}
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* 学习统计（只在编辑时显示） */}
                    {localItem && (
                        <div className="border-t pt-4">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-semibold text-gray-800">学习统计</h3>
                                <button
                                    type="button"
                                    onClick={handleClearStudyRecord}
                                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gradient-to-r from-orange-400 to-amber-500 text-white rounded-lg hover:from-orange-500 hover:to-amber-600 transition"
                                >
                                    <RotateCcw size={14} />
                                    清理学习记录
                                </button>
                            </div>
                            <div className="grid grid-cols-4 gap-4 text-sm">
                                <div className="bg-green-50 p-3 rounded-lg">
                                    <div className="text-green-600 font-medium">正确次数</div>
                                    <div className="text-2xl font-bold text-green-700">{localItem.correct_count || 0}</div>
                                </div>
                                <div className="bg-red-50 p-3 rounded-lg">
                                    <div className="text-red-600 font-medium">错误次数</div>
                                    <div className="text-2xl font-bold text-red-700">{localItem.wrong_count || 0}</div>
                                </div>
                                <div className="bg-blue-50 p-3 rounded-lg">
                                    <div className="text-blue-600 font-medium">连续正确</div>
                                    <div className="text-2xl font-bold text-blue-700">{localItem.consecutive_correct || 0}</div>
                                </div>
                                <div className="bg-orange-50 p-3 rounded-lg">
                                    <div className="text-orange-600 font-medium">连续错误</div>
                                    <div className="text-2xl font-bold text-orange-700">{localItem.consecutive_wrong || 0}</div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mt-3 text-sm text-gray-600">
                                <div>创建时间：{formatDateTime(localItem.created_at)}</div>
                                <div>最后编辑：{formatDateTime(localItem.updated_at)}</div>
                                <div>最后学习：{formatDateTime(localItem.last_study_at)}</div>
                                <div>最后正确：{formatDateTime(localItem.last_correct_at)}</div>
                                <div>最后错误：{formatDateTime(localItem.last_wrong_at)}</div>
                            </div>
                        </div>
                    )}

                    {/* 按钮 */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
                        >
                            取消
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-6 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-lg hover:from-teal-600 hover:to-cyan-600 transition font-medium flex items-center gap-2 disabled:opacity-50"
                        >
                            {saving ? '保存中...' : <><Check size={18} />保存</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
