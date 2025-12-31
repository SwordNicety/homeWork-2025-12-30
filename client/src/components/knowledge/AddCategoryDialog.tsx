import React, { useState, useEffect } from 'react'
import { X, Upload, Check } from 'lucide-react'

interface KnowledgeCategory {
    id?: number
    name: string
    description?: string
    logo_path?: string
    color?: string
    dir_name: string
    sort_weight?: number
}

interface AddCategoryDialogProps {
    category?: KnowledgeCategory | null
    onClose: () => void
    onSuccess: () => void
}

// 预设颜色
const PRESET_COLORS = [
    '#3B82F6', '#8B5CF6', '#EC4899', '#EF4444', '#F97316',
    '#EAB308', '#22C55E', '#14B8A6', '#06B6D4', '#6366F1',
]

export default function AddCategoryDialog({ category, onClose, onSuccess }: AddCategoryDialogProps) {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        logo_path: '',
        color: '#3B82F6',
        sort_weight: 0,
        dir_name: ''
    })

    const isEditing = !!category?.id

    useEffect(() => {
        if (category) {
            setFormData({
                name: category.name || '',
                description: category.description || '',
                logo_path: category.logo_path || '',
                color: category.color || '#3B82F6',
                sort_weight: category.sort_weight || 0,
                dir_name: category.dir_name || ''
            })
        }
    }, [category])

    const [uploading, setUploading] = useState(false)
    const [saving, setSaving] = useState(false)

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith('image/')) {
            alert('请选择图片文件')
            return
        }

        setUploading(true)
        try {
            const uploadFormData = new FormData()
            uploadFormData.append('file', file)

            const response = await fetch('/api/upload/knowledge-logo', {
                method: 'POST',
                body: uploadFormData
            })

            const result = await response.json()
            if (result.success) {
                setFormData({ ...formData, logo_path: result.data.path })
            } else {
                alert('上传失败: ' + result.error)
            }
        } catch (error) {
            alert('上传失败: ' + error)
        } finally {
            setUploading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.name.trim()) {
            alert('请输入知识库名')
            return
        }
        if (!formData.dir_name.trim()) {
            alert('请输入文件目录名')
            return
        }

        setSaving(true)
        try {
            const url = isEditing
                ? `/api/knowledge/categories/${category!.id}`
                : '/api/knowledge/categories'
            const method = isEditing ? 'PUT' : 'POST'

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

    return (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
                <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white p-6 rounded-t-2xl">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold">{isEditing ? '编辑知识库' : '添加知识库'}</h2>
                        <button onClick={onClose} className="text-white hover:bg-white/20 rounded-lg p-2 transition">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Logo上传 */}
                    <div className="flex justify-center">
                        <div className="relative">
                            {formData.logo_path ? (
                                <div className="relative">
                                    <img
                                        src={`/${formData.logo_path}`}
                                        alt="Logo"
                                        className="w-20 h-20 rounded-xl object-cover border-2 border-blue-200"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, logo_path: '' })}
                                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ) : (
                                <label className="block cursor-pointer">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileUpload}
                                        className="hidden"
                                        disabled={uploading}
                                    />
                                    <div className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition">
                                        {uploading ? (
                                            <div className="animate-spin text-blue-500">⏳</div>
                                        ) : (
                                            <Upload className="text-gray-400" size={24} />
                                        )}
                                    </div>
                                    <p className="text-xs text-center text-gray-500 mt-1">Logo(可选)</p>
                                </label>
                            )}
                        </div>
                    </div>

                    {/* 必填字段 */}
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                知识库名 <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="例如：数学、英语、编程"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                文件目录名 <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.dir_name}
                                onChange={(e) => setFormData({ ...formData, dir_name: e.target.value.replace(/[^a-zA-Z0-9_-]/g, '') })}
                                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="英文或数字，如：math, english"
                                required
                            />
                            <p className="text-xs text-gray-500 mt-1">仅支持英文、数字、下划线和中划线</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">知识库备注</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                rows={2}
                                placeholder="描述这个知识库的内容..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">板块颜色</label>
                            <div className="flex gap-2 flex-wrap">
                                {PRESET_COLORS.map(color => (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, color })}
                                        className={`w-8 h-8 rounded-lg transition ${formData.color === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                排序权重
                                <span className="text-xs text-gray-500 ml-2">(数字越小越靠前)</span>
                            </label>
                            <input
                                type="number"
                                value={formData.sort_weight}
                                onChange={(e) => setFormData({ ...formData, sort_weight: parseInt(e.target.value) || 0 })}
                                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

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
                            className="px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 transition font-medium flex items-center gap-2 disabled:opacity-50"
                        >
                            {saving ? (
                                <>
                                    <div className="animate-spin">⏳</div>
                                    保存中...
                                </>
                            ) : (
                                <>
                                    <Check size={18} />
                                    保存
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
