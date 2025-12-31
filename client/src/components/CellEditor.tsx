import React, { useState, useEffect, useRef } from 'react'
import { X, Upload, Check } from 'lucide-react'

// 通用编辑器属性类型
interface EditorProps {
    type: 'string' | 'integer' | 'decimal' | 'checkbox' | 'image'
    value: any
    onSave: (value: any) => void
    onCancel: () => void
    options?: string[] // 用于下拉选择
    imageSize?: { width: number; height: number }
    uploadType?: 'avatar' | 'logo' | 'attribute' // 图片上传类型
}

// 通用单元格编辑器组件
export default function CellEditor({ type, value, onSave, onCancel, options, imageSize, uploadType = 'attribute' }: EditorProps) {
    const [editValue, setEditValue] = useState(value)
    const inputRef = useRef<HTMLInputElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    useEffect(() => {
        // 自动聚焦
        if (type === 'string' && textareaRef.current) {
            textareaRef.current.focus()
            textareaRef.current.select()
        } else if ((type === 'integer' || type === 'decimal') && inputRef.current) {
            inputRef.current.focus()
            inputRef.current.select()
        }
    }, [type])

    const handleSave = () => {
        if (type === 'integer') {
            const intValue = parseInt(editValue)
            if (isNaN(intValue)) {
                alert('请输入有效的整数')
                return
            }
            onSave(intValue)
        } else if (type === 'decimal') {
            const floatValue = parseFloat(editValue)
            if (isNaN(floatValue)) {
                alert('请输入有效的数字')
                return
            }
            onSave(floatValue)
        } else {
            onSave(editValue)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSave()
        } else if (e.key === 'Escape') {
            onCancel()
        }
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // 检查文件类型
        if (!file.type.startsWith('image/')) {
            alert('请选择图片文件')
            return
        }

        // 检查文件大小（限制10MB）
        if (file.size > 10 * 1024 * 1024) {
            alert('图片大小不能超过10MB')
            return
        }

        try {
            const formData = new FormData()
            formData.append('file', file)

            const response = await fetch(`/api/upload/${uploadType}`, {
                method: 'POST',
                body: formData
            })

            const result = await response.json()
            if (result.success) {
                setEditValue(result.data.path)
            } else {
                alert('上传失败: ' + result.error)
            }
        } catch (error) {
            alert('上传失败: ' + error)
        }
    }

    // 字符串编辑器
    if (type === 'string') {
        return (
            <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50" onClick={onCancel}>
                <div className="bg-white rounded-lg shadow-xl p-4 min-w-[400px]" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-800">编辑文本</h3>
                        <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
                            <X size={20} />
                        </button>
                    </div>
                    <textarea
                        ref={textareaRef}
                        value={editValue || ''}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="w-full border border-gray-300 rounded-lg p-2 min-h-[100px] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="请输入内容..."
                    />
                    <div className="flex justify-end gap-2 mt-3">
                        <button
                            onClick={onCancel}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                        >
                            取消
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center gap-2"
                        >
                            <Check size={16} />
                            保存
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    // 整数/小数编辑器
    if (type === 'integer' || type === 'decimal') {
        return (
            <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50" onClick={onCancel}>
                <div className="bg-white rounded-lg shadow-xl p-4 min-w-[300px]" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-800">编辑{type === 'integer' ? '整数' : '小数'}</h3>
                        <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
                            <X size={20} />
                        </button>
                    </div>
                    <input
                        ref={inputRef}
                        type="number"
                        step={type === 'decimal' ? '0.01' : '1'}
                        value={editValue || ''}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={`请输入${type === 'integer' ? '整数' : '小数'}...`}
                    />
                    <div className="flex justify-end gap-2 mt-3">
                        <button
                            onClick={onCancel}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                        >
                            取消
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center gap-2"
                        >
                            <Check size={16} />
                            保存
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    // 复选框编辑器
    if (type === 'checkbox') {
        return (
            <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50" onClick={onCancel}>
                <div className="bg-white rounded-lg shadow-xl p-4 min-w-[300px]" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-800">编辑选项</h3>
                        <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
                            <X size={20} />
                        </button>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                        <input
                            type="checkbox"
                            checked={editValue === 1 || editValue === true}
                            onChange={(e) => setEditValue(e.target.checked ? 1 : 0)}
                            className="w-5 h-5 text-blue-500 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-gray-700">选中</span>
                    </div>
                    <div className="flex justify-end gap-2 mt-3">
                        <button
                            onClick={onCancel}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                        >
                            取消
                        </button>
                        <button
                            onClick={() => onSave(editValue)}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center gap-2"
                        >
                            <Check size={16} />
                            保存
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    // 图片编辑器
    if (type === 'image') {
        const imgWidth = imageSize?.width || 120
        const imgHeight = imageSize?.height || 120

        return (
            <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50" onClick={onCancel}>
                <div className="bg-white rounded-lg shadow-xl p-4 min-w-[400px]" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-800">编辑图片</h3>
                        <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
                            <X size={20} />
                        </button>
                    </div>

                    {/* 图片预览 */}
                    <div className="flex justify-center mb-4">
                        {editValue ? (
                            <div className="relative">
                                <img
                                    src={`/${editValue}`}
                                    alt="预览"
                                    style={{ width: imgWidth, height: imgHeight }}
                                    className="rounded-lg object-cover border-2 border-gray-200"
                                />
                                <button
                                    onClick={() => setEditValue('')}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        ) : (
                            <div
                                style={{ width: imgWidth, height: imgHeight }}
                                className="border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50"
                            >
                                <div className="text-center">
                                    <Upload className="mx-auto text-gray-400" size={32} />
                                    <p className="text-sm text-gray-500 mt-2">点击上传图片</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 上传按钮 */}
                    <label className="block">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            className="hidden"
                        />
                        <div className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-center cursor-pointer">
                            选择图片
                        </div>
                    </label>

                    <div className="flex justify-end gap-2 mt-3">
                        <button
                            onClick={onCancel}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                        >
                            取消
                        </button>
                        <button
                            onClick={() => onSave(editValue)}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center gap-2"
                        >
                            <Check size={16} />
                            保存
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return null
}
