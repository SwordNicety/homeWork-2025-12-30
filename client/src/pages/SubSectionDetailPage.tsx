import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Plus, ArrowLeft, Edit2, Trash2, Play, BookOpen, Search, RotateCcw, ChevronUp, ChevronDown, CheckSquare, Square } from 'lucide-react'
import PageContainer from '../components/PageContainer'
import AddItemDialog from '../components/knowledge/AddItemDialog'
import StudyModal from '../components/knowledge/StudyModal'
import ItemPreviewModal from '../components/knowledge/ItemPreviewModal'

interface KnowledgeCategory {
    id: string
    name: string
    description?: string
    logo_path?: string
    color?: string
    dir_name: string
}

interface KnowledgeSection {
    id: string
    category_id: string
    name: string
    description?: string
    logo_path?: string
    color?: string
    dir_name: string
}

interface KnowledgeSubSection {
    id: string
    section_id: string
    name: string
    description?: string
    logo_path?: string
    color?: string
    dir_name: string
    category_id?: string
    category_name?: string
    category_dir?: string
    section_name?: string
    section_dir?: string
}

interface KnowledgeItem {
    id: string
    subsection_id: string
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

type SortField = 'name' | 'keywords' | 'correct_count' | 'wrong_count' | 'consecutive_correct' | 'consecutive_wrong' | 'last_study_at' | 'sort_weight'
type SortDirection = 'asc' | 'desc'
type FilterOption = 'all' | 'never' | 'weak' | 'strong'

// 格式化最后学习时间
function formatLastStudyTime(dateStr?: string): string {
    if (!dateStr) return '从未学习'

    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
        const isToday = date.toDateString() === now.toDateString()
        if (isToday) return '今天学过'
        return '1天前'
    } else if (diffDays === 1) {
        return '1天前'
    } else if (diffDays < 30) {
        return `${diffDays}天前`
    } else if (diffDays < 365) {
        const months = Math.floor(diffDays / 30)
        return `${months}个月前`
    } else {
        const years = Math.floor(diffDays / 365)
        return `${years}年前`
    }
}

export default function SubSectionDetailPage() {
    const { categoryId, sectionId, subSectionId } = useParams<{ categoryId: string; sectionId: string; subSectionId: string }>()
    const navigate = useNavigate()

    const [category, setCategory] = useState<KnowledgeCategory | null>(null)
    const [section, setSection] = useState<KnowledgeSection | null>(null)
    const [subSection, setSubSection] = useState<KnowledgeSubSection | null>(null)
    const [items, setItems] = useState<KnowledgeItem[]>([])
    const [loading, setLoading] = useState(true)
    const [showAddDialog, setShowAddDialog] = useState(false)
    const [editingItem, setEditingItem] = useState<KnowledgeItem | null>(null)
    const [previewItem, setPreviewItem] = useState<KnowledgeItem | null>(null)
    const [showStudyModal, setShowStudyModal] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterOption, setFilterOption] = useState<FilterOption>('all')

    // 排序状态
    const [sortField, setSortField] = useState<SortField>('sort_weight')
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

    // 勾选状态
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

    useEffect(() => {
        if (categoryId && sectionId && subSectionId) {
            fetchData()
        }
    }, [categoryId, sectionId, subSectionId])

    const fetchData = async () => {
        try {
            const categoryRes = await fetch(`/api/knowledge/categories/${categoryId}`)
            const categoryResult = await categoryRes.json()
            if (categoryResult.success) {
                setCategory(categoryResult.data)
            }

            // 构建完整的 section ID（格式：categoryId/sectionId），并进行URL编码
            const fullSectionId = `${categoryId}/${sectionId}`
            const sectionRes = await fetch(`/api/knowledge/sections/${encodeURIComponent(fullSectionId)}`)
            const sectionResult = await sectionRes.json()
            if (sectionResult.success) {
                setSection(sectionResult.data)
            }

            // 构建完整的 subSection ID（格式：categoryId/sectionId/subSectionId），并进行URL编码
            const fullSubSectionId = `${categoryId}/${sectionId}/${subSectionId}`
            const subSectionRes = await fetch(`/api/knowledge/subsections/${encodeURIComponent(fullSubSectionId)}`)
            const subSectionResult = await subSectionRes.json()
            if (subSectionResult.success) {
                setSubSection(subSectionResult.data)
            }

            const itemsRes = await fetch(`/api/knowledge/items?subsectionId=${encodeURIComponent(fullSubSectionId)}`)
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
            const response = await fetch(`/api/knowledge/items/${encodeURIComponent(item.id)}`, {
                method: 'DELETE'
            })
            const result = await response.json()
            if (result.success) {
                fetchData()
                setSelectedIds(prev => {
                    const next = new Set(prev)
                    next.delete(item.id)
                    return next
                })
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

    const handlePreview = (item: KnowledgeItem) => {
        setPreviewItem(item)
    }

    const handlePreviewEdit = () => {
        if (previewItem) {
            setEditingItem(previewItem)
            setPreviewItem(null)
            setShowAddDialog(true)
        }
    }

    const handleDialogClose = () => {
        setShowAddDialog(false)
        setEditingItem(null)
    }

    const handleDialogSuccess = () => {
        fetchData()
        handleDialogClose()
    }

    const handleStudyUpdate = async (itemId: string, isCorrect: boolean) => {
        try {
            await fetch(`/api/knowledge/items/${encodeURIComponent(itemId)}/study`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isCorrect })
            })
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

    const handleClearAllStudyRecords = async () => {
        if (!confirm('确定要清空本板块所有知识点的学习记录吗？\n此操作不可恢复！')) {
            return
        }

        try {
            const fullSubSectionId = `${categoryId}/${sectionId}/${subSectionId}`
            const response = await fetch(`/api/knowledge/subsections/${encodeURIComponent(fullSubSectionId)}/clear-study-records`, {
                method: 'PUT'
            })
            const result = await response.json()
            if (result.success) {
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

    // 处理排序点击
    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
        } else {
            setSortField(field)
            setSortDirection('asc')
        }
    }

    // 渲染排序图标
    const renderSortIcon = (field: SortField) => {
        if (sortField !== field) {
            return <ChevronUp size={14} className="text-gray-300" />
        }
        return sortDirection === 'asc'
            ? <ChevronUp size={14} className="text-emerald-500" />
            : <ChevronDown size={14} className="text-emerald-500" />
    }

    // 勾选操作
    const toggleSelect = (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        setSelectedIds(prev => {
            const next = new Set(prev)
            if (next.has(id)) {
                next.delete(id)
            } else {
                next.add(id)
            }
            return next
        })
    }

    const toggleSelectAll = () => {
        if (selectedIds.size === displayItems.length) {
            setSelectedIds(new Set())
        } else {
            setSelectedIds(new Set(displayItems.map(item => item.id)))
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
        result.sort((a, b) => {
            let comparison = 0
            switch (sortField) {
                case 'name':
                    comparison = a.name.localeCompare(b.name)
                    break
                case 'keywords':
                    comparison = (a.keywords || '').localeCompare(b.keywords || '')
                    break
                case 'correct_count':
                    comparison = (a.correct_count || 0) - (b.correct_count || 0)
                    break
                case 'wrong_count':
                    comparison = (a.wrong_count || 0) - (b.wrong_count || 0)
                    break
                case 'consecutive_correct':
                    comparison = (a.consecutive_correct || 0) - (b.consecutive_correct || 0)
                    break
                case 'consecutive_wrong':
                    comparison = (a.consecutive_wrong || 0) - (b.consecutive_wrong || 0)
                    break
                case 'last_study_at':
                    if (!a.last_study_at && !b.last_study_at) comparison = 0
                    else if (!a.last_study_at) comparison = 1
                    else if (!b.last_study_at) comparison = -1
                    else comparison = new Date(a.last_study_at).getTime() - new Date(b.last_study_at).getTime()
                    break
                default:
                    comparison = (a.sort_weight || 0) - (b.sort_weight || 0)
            }
            return sortDirection === 'asc' ? comparison : -comparison
        })

        return result
    }

    const displayItems = getFilteredAndSortedItems()

    // 获取要学习的项目
    const getStudyItems = () => {
        if (selectedIds.size > 0) {
            return displayItems.filter(item => selectedIds.has(item.id))
        }
        return displayItems
    }

    const getSubSectionColor = () => subSection?.color || section?.color || category?.color || '#10b981'

    if (loading) {
        return (
            <PageContainer title="加载中...">
                <div className="flex items-center justify-center h-64">
                    <div className="text-gray-500">加载中...</div>
                </div>
            </PageContainer>
        )
    }

    if (!subSection || !section || !category) {
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
        <PageContainer title={subSection.name}>
            <div className="p-6 h-full flex flex-col">
                {/* 顶部导航 */}
                <div className="flex items-center gap-4 mb-6">
                    <button
                        onClick={() => navigate(`/knowledge/${categoryId}/${sectionId}`)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                    >
                        <ArrowLeft size={24} className="text-gray-600" />
                    </button>

                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span className="cursor-pointer hover:text-gray-700" onClick={() => navigate('/knowledge')}>
                            知识库
                        </span>
                        <span>/</span>
                        <span className="cursor-pointer hover:text-gray-700" onClick={() => navigate(`/knowledge/${categoryId}`)}>
                            {category.name}
                        </span>
                        <span>/</span>
                        <span className="cursor-pointer hover:text-gray-700" onClick={() => navigate(`/knowledge/${categoryId}/${sectionId}`)}>
                            {section.name}
                        </span>
                        <span>/</span>
                        <span className="font-medium text-gray-700">{subSection.name}</span>
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
                        onClick={() => setShowStudyModal(true)}
                        disabled={getStudyItems().length === 0}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Play size={20} />
                        开始学习 {selectedIds.size > 0 && `(${selectedIds.size})`}
                    </button>

                    <button
                        onClick={() => setShowAddDialog(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg hover:from-emerald-600 hover:to-teal-600 transition shadow-lg"
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
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                    </div>

                    <select
                        value={filterOption}
                        onChange={(e) => setFilterOption(e.target.value as FilterOption)}
                        className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    >
                        <option value="all">全部</option>
                        <option value="never">从未学习</option>
                        <option value="weak">薄弱知识</option>
                        <option value="strong">已掌握</option>
                    </select>

                    <span className="text-sm text-gray-500">
                        共 {displayItems.length} / {items.length} 个知识点
                        {selectedIds.size > 0 && ` | 已选 ${selectedIds.size} 个`}
                    </span>
                </div>

                {/* 知识列表 - 表格形式 */}
                {items.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 rounded-xl">
                        <BookOpen size={64} className="text-gray-300 mb-4" />
                        <p className="text-gray-500 text-lg">还没有知识点</p>
                        <p className="text-gray-400 text-sm mt-1">点击上方按钮添加第一个知识点</p>
                    </div>
                ) : (
                    <div className="flex-1 overflow-auto bg-white rounded-xl shadow-sm">
                        <table className="w-full">
                            <thead className="bg-gray-50 sticky top-0">
                                <tr className="text-left text-sm text-gray-600">
                                    <th className="p-3 w-12">
                                        <button onClick={toggleSelectAll} className="hover:bg-gray-200 p-1 rounded">
                                            {selectedIds.size === displayItems.length && displayItems.length > 0 ? (
                                                <CheckSquare size={18} className="text-emerald-500" />
                                            ) : (
                                                <Square size={18} className="text-gray-400" />
                                            )}
                                        </button>
                                    </th>
                                    <th className="p-3 w-10">#</th>
                                    <th className="p-3 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('name')}>
                                        <div className="flex items-center gap-1">
                                            知识名称 {renderSortIcon('name')}
                                        </div>
                                    </th>
                                    <th className="p-3 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('keywords')}>
                                        <div className="flex items-center gap-1">
                                            关键字 {renderSortIcon('keywords')}
                                        </div>
                                    </th>
                                    <th className="p-3 w-20 text-center cursor-pointer hover:bg-gray-100" onClick={() => handleSort('correct_count')}>
                                        <div className="flex items-center justify-center gap-1">
                                            正确 {renderSortIcon('correct_count')}
                                        </div>
                                    </th>
                                    <th className="p-3 w-20 text-center cursor-pointer hover:bg-gray-100" onClick={() => handleSort('wrong_count')}>
                                        <div className="flex items-center justify-center gap-1">
                                            错误 {renderSortIcon('wrong_count')}
                                        </div>
                                    </th>
                                    <th className="p-3 w-20 text-center cursor-pointer hover:bg-gray-100" onClick={() => handleSort('consecutive_correct')}>
                                        <div className="flex items-center justify-center gap-1">
                                            连正 {renderSortIcon('consecutive_correct')}
                                        </div>
                                    </th>
                                    <th className="p-3 w-20 text-center cursor-pointer hover:bg-gray-100" onClick={() => handleSort('consecutive_wrong')}>
                                        <div className="flex items-center justify-center gap-1">
                                            连错 {renderSortIcon('consecutive_wrong')}
                                        </div>
                                    </th>
                                    <th className="p-3 w-28 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('last_study_at')}>
                                        <div className="flex items-center gap-1">
                                            最后学习 {renderSortIcon('last_study_at')}
                                        </div>
                                    </th>
                                    <th className="p-3 w-24 text-center">操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayItems.map((item, index) => (
                                    <tr
                                        key={item.id}
                                        className={`border-t border-gray-100 hover:bg-gray-50 cursor-pointer transition ${selectedIds.has(item.id) ? 'bg-emerald-50' : ''
                                            }`}
                                        onClick={() => handlePreview(item)}
                                    >
                                        <td className="p-3">
                                            <button
                                                onClick={(e) => toggleSelect(item.id, e)}
                                                className="hover:bg-gray-200 p-1 rounded"
                                            >
                                                {selectedIds.has(item.id) ? (
                                                    <CheckSquare size={18} className="text-emerald-500" />
                                                ) : (
                                                    <Square size={18} className="text-gray-400" />
                                                )}
                                            </button>
                                        </td>
                                        <td className="p-3">
                                            <div
                                                className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold"
                                                style={{
                                                    backgroundColor: getSubSectionColor() + '20',
                                                    color: getSubSectionColor()
                                                }}
                                            >
                                                {index + 1}
                                            </div>
                                        </td>
                                        <td className="p-3">
                                            <div className="font-medium text-gray-800">{item.name}</div>
                                            {item.brief_note && (
                                                <div className="text-xs text-gray-500 truncate max-w-xs mt-0.5">
                                                    {item.brief_note}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-3">
                                            {item.keywords && (
                                                <div className="flex gap-1 flex-wrap">
                                                    {item.keywords.split(/[,，]/).slice(0, 3).map((kw, i) => (
                                                        <span key={i} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                                                            {kw.trim()}
                                                        </span>
                                                    ))}
                                                    {item.keywords.split(/[,，]/).length > 3 && (
                                                        <span className="text-xs text-gray-400">+{item.keywords.split(/[,，]/).length - 3}</span>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-3 text-center">
                                            <span className="text-green-600 font-medium">{item.correct_count || 0}</span>
                                        </td>
                                        <td className="p-3 text-center">
                                            <span className="text-red-500 font-medium">{item.wrong_count || 0}</span>
                                        </td>
                                        <td className="p-3 text-center">
                                            <span className={`font-medium ${(item.consecutive_correct || 0) >= 3 ? 'text-green-600' : 'text-gray-600'}`}>
                                                {item.consecutive_correct || 0}
                                            </span>
                                        </td>
                                        <td className="p-3 text-center">
                                            <span className={`font-medium ${(item.consecutive_wrong || 0) >= 3 ? 'text-red-500' : 'text-gray-600'}`}>
                                                {item.consecutive_wrong || 0}
                                            </span>
                                        </td>
                                        <td className="p-3">
                                            <span className={`text-sm ${item.last_study_at ? 'text-gray-600' : 'text-gray-400'}`}>
                                                {formatLastStudyTime(item.last_study_at)}
                                            </span>
                                        </td>
                                        <td className="p-3">
                                            <div className="flex justify-center gap-1">
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
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* 添加/编辑对话框 */}
            {showAddDialog && (
                <AddItemDialog
                    subsectionId={`${categoryId}/${sectionId}/${subSectionId}`}
                    categoryDir={category.dir_name}
                    sectionDir={section.dir_name}
                    subsectionDir={subSection.dir_name}
                    item={editingItem}
                    onClose={handleDialogClose}
                    onSuccess={handleDialogSuccess}
                />
            )}

            {/* 知识预览弹窗 */}
            {previewItem && (() => {
                const itemsList = getFilteredAndSortedItems()
                return (
                    <ItemPreviewModal
                        item={previewItem}
                        items={itemsList}
                        currentIndex={itemsList.findIndex((i: KnowledgeItem) => i.id === previewItem.id)}
                        onClose={() => setPreviewItem(null)}
                        onEdit={handlePreviewEdit}
                        onNavigate={(index: number) => setPreviewItem(itemsList[index])}
                    />
                )
            })()}

            {/* 学习弹窗 */}
            {showStudyModal && (
                <StudyModal
                    sectionName={subSection.name}
                    items={getStudyItems()}
                    onClose={() => {
                        setShowStudyModal(false)
                        fetchData()
                    }}
                    onStudyUpdate={handleStudyUpdate}
                />
            )}
        </PageContainer>
    )
}
