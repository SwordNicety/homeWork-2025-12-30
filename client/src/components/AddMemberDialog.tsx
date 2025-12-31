import React, { useState } from 'react'
import { X, Upload, Check } from 'lucide-react'

interface AddMemberDialogProps {
    onClose: () => void
    onSuccess: () => void
}

export default function AddMemberDialog({ onClose, onSuccess }: AddMemberDialogProps) {
    const [formData, setFormData] = useState({
        nickname: '',
        name: '',
        birthday_text: '',
        birthday_date: '',
        zodiac_sign: '',
        chinese_zodiac: '',
        avatar_path: '',
        gender: '',
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

            const response = await fetch('/api/upload/avatar', {
                method: 'POST',
                body: uploadFormData
            })

            const result = await response.json()
            if (result.success) {
                setFormData({ ...formData, avatar_path: result.data.path })
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

        if (!formData.nickname.trim()) {
            alert('请输入昵称')
            return
        }

        setSaving(true)
        try {
            const response = await fetch('/api/family-members', {
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

    const zodiacSigns = ['白羊座', '金牛座', '双子座', '巨蟹座', '狮子座', '处女座', '天秤座', '天蝎座', '射手座', '摩羯座', '水瓶座', '双鱼座']
    const chineseZodiacs = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪']

    return (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="sticky top-0 bg-gradient-to-r from-pink-500 to-rose-500 text-white p-6 rounded-t-2xl">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold">添加家庭成员</h2>
                        <button onClick={onClose} className="text-white hover:bg-white/20 rounded-lg p-2 transition">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* 头像上传 */}
                    <div className="flex justify-center">
                        <div className="relative">
                            {formData.avatar_path ? (
                                <div className="relative">
                                    <img
                                        src={`/${formData.avatar_path}`}
                                        alt="头像"
                                        className="w-24 h-24 rounded-full object-cover border-4 border-pink-200"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, avatar_path: '' })}
                                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                    >
                                        <X size={16} />
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
                                    <div className="w-24 h-24 rounded-full border-4 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition">
                                        {uploading ? (
                                            <div className="animate-spin text-pink-500">⏳</div>
                                        ) : (
                                            <Upload className="text-gray-400" size={32} />
                                        )}
                                    </div>
                                    <p className="text-xs text-center text-gray-500 mt-2">点击上传头像</p>
                                </label>
                            )}
                        </div>
                    </div>

                    {/* 必填字段 */}
                    <div className="bg-pink-50 p-4 rounded-lg space-y-3">
                        <h3 className="font-semibold text-pink-800 mb-2">必填信息</h3>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                昵称 <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.nickname}
                                onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                placeholder="例如：爸爸、妈妈、木木"
                                required
                            />
                        </div>
                    </div>

                    {/* 可选字段 */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                placeholder="真实姓名"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">性别</label>
                            <select
                                value={formData.gender}
                                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                            >
                                <option value="">请选择</option>
                                <option value="男">男</option>
                                <option value="女">女</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">生日文本</label>
                            <input
                                type="text"
                                value={formData.birthday_text}
                                onChange={(e) => setFormData({ ...formData, birthday_text: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                placeholder="例如：1990年1月1日"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">生日日期</label>
                            <input
                                type="date"
                                value={formData.birthday_date}
                                onChange={(e) => setFormData({ ...formData, birthday_date: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">星座</label>
                            <select
                                value={formData.zodiac_sign}
                                onChange={(e) => setFormData({ ...formData, zodiac_sign: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                            >
                                <option value="">请选择</option>
                                {zodiacSigns.map(sign => (
                                    <option key={sign} value={sign}>{sign}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">属相</label>
                            <select
                                value={formData.chinese_zodiac}
                                onChange={(e) => setFormData({ ...formData, chinese_zodiac: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                            >
                                <option value="">请选择</option>
                                {chineseZodiacs.map(zodiac => (
                                    <option key={zodiac} value={zodiac}>{zodiac}</option>
                                ))}
                            </select>
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                排序权重
                                <span className="text-xs text-gray-500 ml-2">(数字越小越靠前)</span>
                            </label>
                            <input
                                type="number"
                                value={formData.sort_weight}
                                onChange={(e) => setFormData({ ...formData, sort_weight: parseInt(e.target.value) || 0 })}
                                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
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
                            className="px-6 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg hover:from-pink-600 hover:to-rose-600 transition font-medium flex items-center gap-2 disabled:opacity-50"
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
