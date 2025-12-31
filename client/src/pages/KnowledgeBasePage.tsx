import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, FolderOpen, Edit2, Trash2, BookOpen, ChevronRight } from 'lucide-react'
import PageContainer from '../components/PageContainer'
import AddCategoryDialog from '../components/knowledge/AddCategoryDialog'

interface KnowledgeCategory {
    id: number
    name: string
    description?: string
    logo_path?: string
    color?: string
    dir_name: string
    sort_weight: number
    created_at: string
    updated_at: string
    section_count?: number
    item_count?: number
}

export default function KnowledgeBasePage() {
    const navigate = useNavigate()
    const [categories, setCategories] = useState<KnowledgeCategory[]>([])
    const [loading, setLoading] = useState(true)
    const [showAddDialog, setShowAddDialog] = useState(false)
    const [editingCategory, setEditingCategory] = useState<KnowledgeCategory | null>(null)

    useEffect(() => {
        fetchCategories()
    }, [])

    const fetchCategories = async () => {
        try {
            const response = await fetch('/api/knowledge/categories')
            const result = await response.json()
            if (result.success) {
                setCategories(result.data)
            }
        } catch (error) {
            console.error('Failed to fetch categories:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (category: KnowledgeCategory) => {
        if (!confirm(`确定要删除知识库「${category.name}」吗？此操作不可恢复！`)) {
            return
        }

        try {
            const response = await fetch(`/api/knowledge/categories/${category.id}`, {
                method: 'DELETE'
            })
            const result = await response.json()
            if (result.success) {
                fetchCategories()
            } else {
                alert('删除失败: ' + result.error)
            }
        } catch (error) {
            alert('删除失败: ' + error)
        }
    }

    const handleEdit = (category: KnowledgeCategory) => {
        setEditingCategory(category)
        setShowAddDialog(true)
    }

    const handleDialogClose = () => {
        setShowAddDialog(false)
        setEditingCategory(null)
    }

    const handleDialogSuccess = () => {
        fetchCategories()
        handleDialogClose()
    }

    const getCategoryColor = (color?: string) => {
        return color || '#06b6d4'
    }

    if (loading) {
        return (
            <PageContainer title="知识库">
                <div className="flex items-center justify-center h-64">
                    <div className="text-gray-500">加载中...</div>
                </div>
            </PageContainer>
        )
    }

    return (
        <PageContainer title="知识库">
            <div className="p-6">
                {/* 顶部操作栏 */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <BookOpen className="text-teal-500" size={28} />
                        <h1 className="text-2xl font-bold text-gray-800">我的知识库</h1>
                        <span className="text-gray-500 text-sm">({categories.length} 个分类)</span>
                    </div>
                    <button
                        onClick={() => setShowAddDialog(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-lg hover:from-teal-600 hover:to-cyan-600 transition shadow-lg"
                    >
                        <Plus size={20} />
                        添加知识库
                    </button>
                </div>

                {/* 分类卡片网格 */}
                {categories.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-xl">
                        <FolderOpen size={64} className="text-gray-300 mb-4" />
                        <p className="text-gray-500 text-lg">还没有知识库</p>
                        <p className="text-gray-400 text-sm mt-1">点击上方按钮创建第一个知识库</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {categories.map((category) => (
                            <div
                                key={category.id}
                                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer group"
                                onClick={() => navigate(`/knowledge/${category.id}`)}
                            >
                                {/* 顶部彩色条 */}
                                <div
                                    className="h-2"
                                    style={{ backgroundColor: getCategoryColor(category.color) }}
                                />

                                <div className="p-5">
                                    {/* Logo 和标题 */}
                                    <div className="flex items-start gap-4">
                                        <div
                                            className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md"
                                            style={{ backgroundColor: getCategoryColor(category.color) + '20' }}
                                        >
                                            {category.logo_path ? (
                                                <img
                                                    src={`/${category.logo_path}`}
                                                    alt=""
                                                    className="w-10 h-10 object-contain"
                                                />
                                            ) : (
                                                <BookOpen
                                                    size={28}
                                                    style={{ color: getCategoryColor(category.color) }}
                                                />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-lg text-gray-800 truncate">
                                                {category.name}
                                            </h3>
                                            <p className="text-gray-500 text-sm mt-1 line-clamp-2">
                                                {category.description || '暂无描述'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* 统计信息 */}
                                    <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                                        <span>{category.section_count || 0} 个板块</span>
                                        <span>{category.item_count || 0} 个知识点</span>
                                    </div>

                                    {/* 操作按钮 */}
                                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleEdit(category)
                                                }}
                                                className="p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition"
                                                title="编辑"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleDelete(category)
                                                }}
                                                className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                                                title="删除"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-1 text-sm font-medium group-hover:translate-x-1 transition"
                                            style={{ color: getCategoryColor(category.color) }}
                                        >
                                            进入学习
                                            <ChevronRight size={16} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* 添加卡片 */}
                        <div
                            onClick={() => setShowAddDialog(true)}
                            className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl hover:border-teal-500 hover:bg-teal-50/50 transition-all duration-300 cursor-pointer flex flex-col items-center justify-center min-h-[220px] group"
                        >
                            <div className="w-14 h-14 rounded-full bg-gray-200 group-hover:bg-teal-100 flex items-center justify-center mb-3 transition">
                                <Plus size={28} className="text-gray-400 group-hover:text-teal-500 transition" />
                            </div>
                            <span className="text-gray-500 group-hover:text-teal-600 font-medium">
                                添加知识库
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* 添加/编辑对话框 */}
            {showAddDialog && (
                <AddCategoryDialog
                    category={editingCategory}
                    onClose={handleDialogClose}
                    onSuccess={handleDialogSuccess}
                />
            )}
        </PageContainer>
    )
}
