import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Plus, ArrowLeft, Edit2, Trash2, Layers, ChevronRight, BookOpen, GripVertical } from 'lucide-react'
import PageContainer from '../components/PageContainer'
import AddSectionDialog from '../components/knowledge/AddSectionDialog'

interface KnowledgeCategory {
    id: number
    name: string
    description?: string
    logo_path?: string
    color?: string
    dir_name: string
}

interface KnowledgeSection {
    id: number
    category_id: number
    name: string
    description?: string
    logo_path?: string
    color?: string
    dir_name: string
    sort_weight: number
    item_count?: number
    last_study_at?: string
}

export default function CategoryDetailPage() {
    const { categoryId } = useParams<{ categoryId: string }>()
    const navigate = useNavigate()

    const [category, setCategory] = useState<KnowledgeCategory | null>(null)
    const [sections, setSections] = useState<KnowledgeSection[]>([])
    const [loading, setLoading] = useState(true)
    const [showAddDialog, setShowAddDialog] = useState(false)
    const [editingSection, setEditingSection] = useState<KnowledgeSection | null>(null)

    useEffect(() => {
        if (categoryId) {
            fetchData()
        }
    }, [categoryId])

    const fetchData = async () => {
        try {
            // 获取分类信息
            const categoryRes = await fetch(`/api/knowledge/categories/${categoryId}`)
            const categoryResult = await categoryRes.json()
            if (categoryResult.success) {
                setCategory(categoryResult.data)
            }

            // 获取板块列表
            const sectionsRes = await fetch(`/api/knowledge/sections?categoryId=${categoryId}`)
            const sectionsResult = await sectionsRes.json()
            if (sectionsResult.success) {
                setSections(sectionsResult.data)
            }
        } catch (error) {
            console.error('Failed to fetch data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (section: KnowledgeSection) => {
        if (!confirm(`确定要删除板块「${section.name}」吗？此操作不可恢复！`)) {
            return
        }

        try {
            const response = await fetch(`/api/knowledge/sections/${section.id}`, {
                method: 'DELETE'
            })
            const result = await response.json()
            if (result.success) {
                fetchData()
            } else {
                alert('删除失败: ' + result.error)
            }
        } catch (error) {
            alert('删除失败: ' + error)
        }
    }

    const handleEdit = (section: KnowledgeSection) => {
        setEditingSection(section)
        setShowAddDialog(true)
    }

    const handleDialogClose = () => {
        setShowAddDialog(false)
        setEditingSection(null)
    }

    const handleDialogSuccess = () => {
        fetchData()
        handleDialogClose()
    }

    const getSectionColor = (color?: string) => {
        return color || category?.color || '#8b5cf6'
    }

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '从未学习'
        const date = new Date(dateStr)
        return date.toLocaleDateString('zh-CN')
    }

    if (loading) {
        return (
            <PageContainer title="加载中...">
                <div className="flex items-center justify-center h-64">
                    <div className="text-gray-500">加载中...</div>
                </div>
            </PageContainer>
        )
    }

    if (!category) {
        return (
            <PageContainer title="未找到">
                <div className="flex flex-col items-center justify-center h-64">
                    <p className="text-gray-500 text-lg mb-4">知识库不存在</p>
                    <button
                        onClick={() => navigate('/knowledge')}
                        className="px-4 py-2 bg-teal-500 text-white rounded-lg"
                    >
                        返回知识库
                    </button>
                </div>
            </PageContainer>
        )
    }

    return (
        <PageContainer title={category.name}>
            <div className="p-6">
                {/* 顶部导航 */}
                <div className="flex items-center gap-4 mb-6">
                    <button
                        onClick={() => navigate('/knowledge')}
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                    >
                        <ArrowLeft size={24} className="text-gray-600" />
                    </button>

                    <div className="flex items-center gap-4 flex-1">
                        <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md"
                            style={{ backgroundColor: (category.color || '#06b6d4') + '20' }}
                        >
                            {category.logo_path ? (
                                <img src={`/${category.logo_path}`} alt="" className="w-8 h-8 object-contain" />
                            ) : (
                                <BookOpen size={24} style={{ color: category.color || '#06b6d4' }} />
                            )}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">{category.name}</h1>
                            {category.description && (
                                <p className="text-gray-500 text-sm">{category.description}</p>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={() => setShowAddDialog(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition shadow-lg"
                    >
                        <Plus size={20} />
                        添加板块
                    </button>
                </div>

                {/* 板块列表 */}
                {sections.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-xl">
                        <Layers size={64} className="text-gray-300 mb-4" />
                        <p className="text-gray-500 text-lg">还没有板块</p>
                        <p className="text-gray-400 text-sm mt-1">点击上方按钮创建第一个板块</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {sections.map((section, index) => (
                            <div
                                key={section.id}
                                className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer group"
                                onClick={() => navigate(`/knowledge/${categoryId}/${section.id}`)}
                            >
                                <div className="p-5">
                                    <div className="flex items-start gap-4">
                                        {/* 序号 */}
                                        <div
                                            className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg flex-shrink-0"
                                            style={{
                                                backgroundColor: getSectionColor(section.color) + '20',
                                                color: getSectionColor(section.color)
                                            }}
                                        >
                                            {index + 1}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-gray-800 truncate">{section.name}</h3>
                                            <p className="text-gray-500 text-sm mt-1 line-clamp-2">
                                                {section.description || '暂无描述'}
                                            </p>
                                        </div>

                                        {section.logo_path && (
                                            <img
                                                src={`/${section.logo_path}`}
                                                alt=""
                                                className="w-10 h-10 object-contain rounded"
                                            />
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between mt-4 pt-3 border-t">
                                        <div className="flex items-center gap-4 text-sm text-gray-500">
                                            <span>{section.item_count || 0} 个知识点</span>
                                            <span>上次学习：{formatDate(section.last_study_at)}</span>
                                        </div>

                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleEdit(section)
                                                }}
                                                className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded transition"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleDelete(section)
                                                }}
                                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* 添加卡片 */}
                        <div
                            onClick={() => setShowAddDialog(true)}
                            className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl hover:border-purple-500 hover:bg-purple-50/50 transition-all duration-300 cursor-pointer flex flex-col items-center justify-center min-h-[150px] group"
                        >
                            <div className="w-10 h-10 rounded-full bg-gray-200 group-hover:bg-purple-100 flex items-center justify-center mb-2 transition">
                                <Plus size={24} className="text-gray-400 group-hover:text-purple-500 transition" />
                            </div>
                            <span className="text-gray-500 group-hover:text-purple-600 font-medium text-sm">
                                添加板块
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* 添加/编辑对话框 */}
            {showAddDialog && (
                <AddSectionDialog
                    categoryId={parseInt(categoryId!)}
                    categoryDir={category.dir_name}
                    section={editingSection}
                    onClose={handleDialogClose}
                    onSuccess={handleDialogSuccess}
                />
            )}
        </PageContainer>
    )
}
