import React, { useState } from 'react'
import { X, Upload, Check } from 'lucide-react'

interface AddAttributeDialogProps {
    onClose: () => void
    onSuccess: () => void
}

export default function AddAttributeDialog({ onClose, onSuccess }: AddAttributeDialogProps) {
    const [formData, setFormData] = useState({
        attribute_name: '',
        attribute_type: 'string' as 'integer' | 'string' | 'decimal' | 'checkbox' | 'image',
        options: '',
        attribute_logo: '',
        sort_weight: 0
    })

    const [uploading, setUploading] = useState(false)
    const [saving, setSaving] = useState(false)

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith('image/')) {
            alert('请选择图片文件')
            return
        }

        if (file.size > 10 * 1024 * 1024) {
            alert('图片大小不能超过10MB')
            return
        }

        setUploading(true)
        try {
            const uploadFormData = new FormData()
            uploadFormData.append('file', file)

            const response = await fetch('/api/upload/logo', {
                method: 'POST',
                body: uploadFormData
            })

            const result = await response.json()
            if (result.success) {
                setFormData({ ...formData, attribute_logo: result.data.path })
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

        if (!formData.attribute_name.trim()) {
            alert('请输入属性名')
            return
        }

        setSaving(true)
        try {
            const response = await fetch('/api/member-attributes', {
                method: 'POST',
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
                        <h2 className="text-2xl font-bold">添加属性</h2>
                        <button onClick={onClose} className="text-white hover:bg-white/20 rounded-lg p-2 transition">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Logo上传 */}
                    <div className="flex justify-center">
                        <div className="relative">
                            {formData.attribute_logo ? (
                                <div className="relative">
                                    <img
                                        src={`/${formData.attribute_logo}`}
                                        alt="Logo"
                                        className="w-20 h-20 rounded-lg object-cover border-2 border-blue-200"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, attribute_logo: '' })}
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
                                    <div className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition">
                                        {uploading ? (
                                            <div className="animate-spin text-blue-500">⏳</div>
                                        ) : (
                                            <Upload className="text-gray-400" size={24} />
                                        )}
                                    </div>
                                    <p className="text-xs text-center text-gray-500 mt-1">Logo</p>
                                </label>
                            )}
                        </div>
                    </div>

                    {/* 必填字段 */}
                    <div className="bg-blue-50 p-4 rounded-lg space-y-3">
                        <h3 className="font-semibold text-blue-800 mb-2">必填信息</h3>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                属性名 <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.attribute_name}
                                onChange={(e) => setFormData({ ...formData, attribute_name: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="例如：身高、体重、爱好"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                属性类型 <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={formData.attribute_type}
                                onChange={(e) => setFormData({ ...formData, attribute_type: e.target.value as any })}
                                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="string">字符串</option>
                                <option value="integer">整数</option>
                                <option value="decimal">小数</option>
                                <option value="checkbox">复选框</option>
                                <option value="image">图片</option>
                            </select>
                        </div>
                    </div>

                    {/* 可选字段 */}
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                可选项
                                <span className="text-xs text-gray-500 ml-2">(用逗号分隔，例如：A型,B型,O型,AB型)</span>
                            </label>
                            <textarea
                                value={formData.options}
                                onChange={(e) => setFormData({ ...formData, options: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                rows={2}
                                placeholder="如果需要下拉选择，可以在这里输入选项"
                            />
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
