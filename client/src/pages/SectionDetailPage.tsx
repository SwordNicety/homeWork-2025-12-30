import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Plus, ArrowLeft, Edit2, Trash2, Play, BookOpen, Search, Filter, ChevronDown, RotateCcw } from 'lucide-react'
import PageContainer from '../components/PageContainer'
import AddItemDialog from '../components/knowledge/AddItemDialog'
import StudyModal from '../components/knowledge/StudyModal'

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
}

interface KnowledgeItem {
    id: number
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

type SortOption = 'default' | 'name' | 'correct' | 'wrong' | 'lastStudy' | 'random'
type FilterOption = 'all' | 'never' | 'weak' | 'strong'

export default function SectionDetailPage() {
    const { categoryId, sectionId } = useParams<{ categoryId: string; sectionId: string }>()
    const navigate = useNavigate()

    const [category, setCategory] = useState<KnowledgeCategory | null>(null)
    const [section, setSection] = useState<KnowledgeSection | null>(null)
    const [items, setItems] = useState<KnowledgeItem[]>([])
    const [loading, setLoading] = useState(true)
    const [showAddDialog, setShowAddDialog] = useState(false)
    const [editingItem, setEditingItem] = useState<KnowledgeItem | null>(null)
    const [showStudyModal, setShowStudyModal] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [sortOption, setSortOption] = useState<SortOption>('default')
    const [filterOption, setFilterOption] = useState<FilterOption>('all')

    useEffect(() => {
        if (categoryId && sectionId) {
            fetchData()
        }
    }, [categoryId, sectionId])

    const fetchData = async () => {
        try {
            // 获取分类信息
            const categoryRes = await fetch(`/api/knowledge/categories/${categoryId}`)
            const categoryResult = await categoryRes.json()
            if (categoryResult.success) {
                setCategory(categoryResult.data)
            }

            // 获取板块信息
            const sectionRes = await fetch(`/api/knowledge/sections/${sectionId}`)
            const sectionResult = await sectionRes.json()
            if (sectionResult.success) {
                setSection(sectionResult.data)
            }

            // 获取知识条目
            const itemsRes = await fetch(`/api/knowledge/items?sectionId=${sectionId}`)
            const itemsResult = await itemsRes.json()
            if (itemsResult.success) {
                setItems(itemsResult.data)
            }
        } catch (error) {
            console.error('Failed to fetch data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (item: KnowledgeItem) => {
        if (!confirm(`确定要删除知识点「${item.name}」吗？`)) {
            return
        }

        try {
            const response = await fetch(`/api/knowledge/items/${item.id}`, {
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

    const handleEdit = (item: KnowledgeItem) => {
        setEditingItem(item)
        setShowAddDialog(true)
    }

    const handleDialogClose = () => {
        setShowAddDialog(false)
        setEditingItem(null)
    }

    const handleDialogSuccess = () => {
        fetchData()
        handleDialogClose()
    }

    const handleStudyUpdate = async (itemId: number, isCorrect: boolean) => {
        try {
            await fetch(`/api/knowledge/items/${itemId}/study`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isCorrect })
            })
            // 更新本地数据
            setItems(prev => prev.map(item => {
                if (item.id === itemId) {
                    return {
                        ...item,
                        correct_count: (item.correct_count || 0) + (isCorrect ? 1 : 0),
                        wrong_count: (item.wrong_count || 0) + (isCorrect ? 0 : 1),
                        consecutive_correct: isCorrect ? (item.consecutive_correct || 0) + 1 : 0,
                        consecutive_wrong: isCorrect ? 0 : (item.consecutive_wrong || 0) + 1,
                        last_study_at: new Date().toISOString()
                    }
                }
                return item
            }))
        } catch (error) {
            console.error('Failed to update study:', error)
        }
    }

    // 清空所有学习记录
    const handleClearAllStudyRecords = async () => {
        if (!confirm('确定要清空本板块所有知识点的学习记录吗？\n此操作不可恢复！')) {
            return
        }

        try {
            const response = await fetch(`/api/knowledge/sections/${sectionId}/clear-study-records`, {
                method: 'PUT'
            })
            const result = await response.json()
            if (result.success) {
                // 更新本地数据
                setItems(prev => prev.map(item => ({
                    ...item,
                    correct_count: 0,
                    wrong_count: 0,
                    consecutive_correct: 0,
                    consecutive_wrong: 0,
                    last_study_at: undefined,
                    last_correct_at: undefined,
                    last_wrong_at: undefined
                })))
                alert('已清空所有学习记录')
            } else {
                alert('清空失败: ' + result.error)
            }
        } catch (error) {
            alert('清空失败: ' + error)
        }
    }

    const getFilteredAndSortedItems = () => {
        let result = [...items]

        // 搜索过滤
        if (searchTerm) {
            const term = searchTerm.toLowerCase()
            result = result.filter(item =>
                item.name.toLowerCase().includes(term) ||
                item.keywords?.toLowerCase().includes(term) ||
                item.brief_note?.toLowerCase().includes(term)
            )
        }

        // 筛选
        switch (filterOption) {
            case 'never':
                result = result.filter(item => !item.last_study_at)
                break
            case 'weak':
                result = result.filter(item => (item.wrong_count || 0) > (item.correct_count || 0))
                break
            case 'strong':
                result = result.filter(item => (item.consecutive_correct || 0) >= 3)
                break
        }

        // 排序
        switch (sortOption) {
            case 'name':
                result.sort((a, b) => a.name.localeCompare(b.name))
                break
            case 'correct':
                result.sort((a, b) => (b.correct_count || 0) - (a.correct_count || 0))
                break
            case 'wrong':
                result.sort((a, b) => (b.wrong_count || 0) - (a.wrong_count || 0))
                break
            case 'lastStudy':
                result.sort((a, b) => {
                    if (!a.last_study_at) return 1
                    if (!b.last_study_at) return -1
                    return new Date(b.last_study_at).getTime() - new Date(a.last_study_at).getTime()
                })
                break
            case 'random':
                result.sort(() => Math.random() - 0.5)
                break
            default:
                result.sort((a, b) => (a.sort_weight || 0) - (b.sort_weight || 0))
        }

        return result
    }

    const displayItems = getFilteredAndSortedItems()

    const getSectionColor = () => section?.color || category?.color || '#8b5cf6'

    if (loading) {
        return (
            <PageContainer title="加载中...">
                <div className="flex items-center justify-center h-64">
                    <div className="text-gray-500">加载中...</div>
                </div>
            </PageContainer>
        )
    }

    if (!section || !category) {
        return (
            <PageContainer title="未找到">
                <div className="flex flex-col items-center justify-center h-64">
                    <p className="text-gray-500 text-lg mb-4">板块不存在</p>
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
        <PageContainer title={section.name}>
            <div className="p-6 h-full flex flex-col">
                {/* 顶部导航 */}
                <div className="flex items-center gap-4 mb-6">
                    <button
                        onClick={() => navigate(`/knowledge/${categoryId}`)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                    >
                        <ArrowLeft size={24} className="text-gray-600" />
                    </button>

                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span
                            className="cursor-pointer hover:text-gray-700"
                            onClick={() => navigate('/knowledge')}
                        >
                            知识库
                        </span>
                        <span>/</span>
                        <span
                            className="cursor-pointer hover:text-gray-700"
                            onClick={() => navigate(`/knowledge/${categoryId}`)}
                        >
                            {category.name}
                        </span>
                        <span>/</span>
                        <span className="font-medium text-gray-700">{section.name}</span>
                    </div>

                    <div className="flex-1" />

                    <button
                        onClick={handleClearAllStudyRecords}
                        disabled={items.length === 0}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-400 to-amber-500 text-white rounded-lg hover:from-orange-500 hover:to-amber-600 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        title="清空所有学习记录"
                    >
                        <RotateCcw size={20} />
                        清空学习记录
                    </button>

                    <button
                        onClick={() => {
                            setSortOption('random')
                            setShowStudyModal(true)
                        }}
                        disabled={items.length === 0}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Play size={20} />
                        开始学习
                    </button>

                    <button
                        onClick={() => setShowAddDialog(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition shadow-lg"
                    >
                        <Plus size={20} />
                        添加知识
                    </button>
                </div>

                {/* 搜索和筛选栏 */}
                <div className="flex items-center gap-4 mb-4">
                    <div className="relative flex-1 max-w-md">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="搜索知识点..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                    </div>

                    <select
                        value={filterOption}
                        onChange={(e) => setFilterOption(e.target.value as FilterOption)}
                        className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                        <option value="all">全部</option>
                        <option value="never">从未学习</option>
                        <option value="weak">薄弱知识</option>
                        <option value="strong">已掌握</option>
                    </select>

                    <select
                        value={sortOption}
                        onChange={(e) => setSortOption(e.target.value as SortOption)}
                        className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                        <option value="default">默认排序</option>
                        <option value="name">按名称</option>
                        <option value="correct">按正确次数</option>
                        <option value="wrong">按错误次数</option>
                        <option value="lastStudy">按最后学习</option>
                        <option value="random">随机</option>
                    </select>

                    <span className="text-sm text-gray-500">
                        共 {displayItems.length} / {items.length} 个知识点
                    </span>
                </div>

                {/* 知识列表 */}
                {items.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 rounded-xl">
                        <BookOpen size={64} className="text-gray-300 mb-4" />
                        <p className="text-gray-500 text-lg">还没有知识点</p>
                        <p className="text-gray-400 text-sm mt-1">点击上方按钮添加第一个知识点</p>
                    </div>
                ) : (
                    <div className="flex-1 overflow-auto">
                        <div className="grid gap-3">
                            {displayItems.map((item, index) => (
                                <div
                                    key={item.id}
                                    className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 p-4 cursor-pointer group"
                                    onClick={() => handleEdit(item)}
                                >
                                    <div className="flex items-center gap-4">
                                        {/* 序号 */}
                                        <div
                                            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
                                            style={{
                                                backgroundColor: getSectionColor() + '20',
                                                color: getSectionColor()
                                            }}
                                        >
                                            {index + 1}
                                        </div>

                                        {/* 主要内容 */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-medium text-gray-800 truncate">{item.name}</h3>
                                                {item.keywords && (
                                                    <div className="flex gap-1 flex-shrink-0">
                                                        {item.keywords.split(/[,，]/).slice(0, 3).map((kw, i) => (
                                                            <span key={i} className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-xs rounded">
                                                                {kw.trim()}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            {item.brief_note && (
                                                <p className="text-sm text-gray-500 mt-1 truncate">{item.brief_note}</p>
                                            )}
                                        </div>

                                        {/* 统计 */}
                                        <div className="flex items-center gap-4 text-sm flex-shrink-0">
                                            <span className="text-green-600">✓ {item.correct_count || 0}</span>
                                            <span className="text-red-500">✗ {item.wrong_count || 0}</span>
                                            {item.consecutive_correct && item.consecutive_correct >= 3 && (
                                                <span className="px-2 py-0.5 bg-green-100 text-green-600 text-xs rounded-full">
                                                    已掌握
                                                </span>
                                            )}
                                        </div>

                                        {/* 操作 */}
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleEdit(item)
                                                }}
                                                className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded transition"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleDelete(item)
                                                }}
                                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* 添加/编辑对话框 */}
            {showAddDialog && (
                <AddItemDialog
                    sectionId={parseInt(sectionId!)}
                    categoryDir={category.dir_name}
                    sectionDir={section.dir_name}
                    item={editingItem}
                    onClose={handleDialogClose}
                    onSuccess={handleDialogSuccess}
                />
            )}

            {/* 学习弹窗 */}
            {showStudyModal && (
                <StudyModal
                    sectionName={section.name}
                    items={displayItems}
                    onClose={() => {
                        setShowStudyModal(false)
                        fetchData() // 刷新数据
                    }}
                    onStudyUpdate={handleStudyUpdate}
                />
            )}
        </PageContainer>
    )
}
