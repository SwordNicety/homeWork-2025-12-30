import { Users, UserPlus, Plus, Trash2, AlertTriangle, Minus } from 'lucide-react'
import PageContainer from '@/components/PageContainer'
import { useState, useEffect } from 'react'
import AddMemberDialog from '@/components/AddMemberDialog'
import AddAttributeDialog from '@/components/AddAttributeDialog'
import CellEditor from '@/components/CellEditor'

interface Member {
    id: number
    nickname: string
    name?: string
    birthday_text?: string
    birthday_date?: string
    zodiac_sign?: string
    chinese_zodiac?: string
    avatar_path?: string
    gender?: string
    sort_weight: number
}

interface AttributeDefinition {
    id: number
    attribute_name: string
    attribute_type: 'integer' | 'string' | 'decimal' | 'checkbox' | 'image'
    options?: string
    attribute_logo?: string
    sort_weight: number
}

interface AttributeValue {
    id: number
    member_id: number
    attribute_id: number
    value_text?: string
    value_number?: number
    value_boolean?: number
    value_image?: string
}

// 移除确认对话框
interface RemoveDialogState {
    type: 'member' | 'attribute'
    id: number
    name: string
}

// 固定属性名称（对应成员表中的字段）
const FIXED_ATTRIBUTES = [
    { key: 'avatar_path', label: '头像', type: 'image' as const },
    { key: 'name', label: '姓名', type: 'string' as const },
    { key: 'gender', label: '性别', type: 'string' as const },
    { key: 'birthday_text', label: '生日文本', type: 'string' as const },
    { key: 'birthday_date', label: '生日日期', type: 'string' as const },
    { key: 'zodiac_sign', label: '星座', type: 'string' as const },
    { key: 'chinese_zodiac', label: '属相', type: 'string' as const },
    { key: 'sort_weight', label: '排序权重', type: 'integer' as const },
]

export default function FamilyMembersPage() {
    const [members, setMembers] = useState<Member[]>([])
    const [attributes, setAttributes] = useState<AttributeDefinition[]>([])
    const [attributeValues, setAttributeValues] = useState<AttributeValue[]>([])
    const [showAddMember, setShowAddMember] = useState(false)
    const [showAddAttribute, setShowAddAttribute] = useState(false)
    const [removeDialog, setRemoveDialog] = useState<RemoveDialogState | null>(null)
    const [editingCell, setEditingCell] = useState<{
        memberId: number
        attributeId?: number
        attributeKey?: string
        type: string
        currentValue: any
    } | null>(null)
    const [hoveringCell, setHoveringCell] = useState<{
        memberId: number
        attributeId?: number
        attributeKey?: string
    } | null>(null)

    const loadData = async () => {
        try {
            // 加载成员
            const membersRes = await fetch('/api/family-members')
            const membersData = await membersRes.json()
            if (membersData.success) {
                setMembers(membersData.data)
            }

            // 加载属性定义
            const attrsRes = await fetch('/api/member-attributes')
            const attrsData = await attrsRes.json()
            if (attrsData.success) {
                setAttributes(attrsData.data)
            }

            // 加载属性值
            const valuesRes = await fetch('/api/member-attribute-values')
            const valuesData = await valuesRes.json()
            if (valuesData.success) {
                setAttributeValues(valuesData.data)
            }
        } catch (error) {
            console.error('加载数据失败:', error)
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    // 获取某个成员的某个属性值
    const getAttributeValue = (memberId: number, attributeId: number) => {
        return attributeValues.find(v => v.member_id === memberId && v.attribute_id === attributeId)
    }

    // 获取某个成员的固定属性值
    const getFixedValue = (member: Member, key: string) => {
        return (member as any)[key]
    }

    // 保存固定属性值
    const saveFixedValue = async (memberId: number, key: string, value: any) => {
        try {
            const response = await fetch(`/api/family-members/${memberId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...members.find(m => m.id === memberId),
                    [key]: value
                })
            })

            const result = await response.json()
            if (result.success) {
                await loadData()
            } else {
                alert('保存失败: ' + result.error)
            }
        } catch (error) {
            alert('保存失败: ' + error)
        }
    }

    // 保存动态属性值
    const saveAttributeValue = async (memberId: number, attributeId: number, type: string, value: any) => {
        try {
            const payload: any = {
                member_id: memberId,
                attribute_id: attributeId
            }

            if (type === 'integer' || type === 'decimal') {
                payload.value_number = value
            } else if (type === 'checkbox') {
                payload.value_boolean = value
            } else if (type === 'image') {
                payload.value_image = value
            } else {
                payload.value_text = value
            }

            const response = await fetch('/api/member-attribute-values', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            const result = await response.json()
            if (result.success) {
                await loadData()
            } else {
                alert('保存失败: ' + result.error)
            }
        } catch (error) {
            alert('保存失败: ' + error)
        }
    }

    // 快捷增减数值
    const quickAdjustValue = async (
        memberId: number,
        attributeId: number | undefined,
        attributeKey: string | undefined,
        type: string,
        currentValue: number | null,
        delta: number
    ) => {
        const newValue = (currentValue || 0) + delta
        // 对于小数类型，保留一位小数
        const finalValue = type === 'decimal' ? Math.round(newValue * 10) / 10 : newValue

        if (attributeKey) {
            await saveFixedValue(memberId, attributeKey, finalValue)
        } else if (attributeId) {
            await saveAttributeValue(memberId, attributeId, type, finalValue)
        }
    }

    // 计算某行数值属性的最大最小值
    const getRowMinMax = (attrId: number, type: string): { min: number | null; max: number | null } => {
        if (type !== 'integer' && type !== 'decimal') return { min: null, max: null }

        const values = members.map(member => {
            const attrValue = getAttributeValue(member.id, attrId)
            return attrValue?.value_number ?? null
        }).filter(v => v !== null) as number[]

        if (values.length === 0) return { min: null, max: null }
        return { min: Math.min(...values), max: Math.max(...values) }
    }

    // 计算固定属性行的最大最小值
    const getFixedRowMinMax = (key: string, type: string): { min: number | null; max: number | null } => {
        if (type !== 'integer' && type !== 'decimal') return { min: null, max: null }

        const values = members.map(member => {
            const val = getFixedValue(member, key)
            return typeof val === 'number' ? val : null
        }).filter(v => v !== null) as number[]

        if (values.length === 0) return { min: null, max: null }
        return { min: Math.min(...values), max: Math.max(...values) }
    }

    // 渲染单元格内容
    const renderCellContent = (
        type: string,
        value: any,
        isHighest?: boolean,
        isLowest?: boolean,
        showQuickAdjust?: boolean,
        onAdjust?: (delta: number) => void
    ) => {
        if (type === 'image') {
            if (!value) {
                return <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">未设置</div>
            }
            return (
                <img
                    src={`/${value}`}
                    alt=""
                    className="w-20 h-20 rounded-lg object-cover mx-auto"
                />
            )
        } else if (type === 'checkbox') {
            return (
                <div className="flex justify-center">
                    <input
                        type="checkbox"
                        checked={value === 1 || value === true}
                        readOnly
                        className="w-5 h-5 pointer-events-none"
                    />
                </div>
            )
        } else if (type === 'integer' || type === 'decimal') {
            // 数值类型：放大字号、加粗
            return (
                <div className="flex items-center justify-center gap-1 relative">
                    <div className="text-lg font-bold text-gray-800">{value ?? '-'}</div>
                    {/* 快捷增减按钮 */}
                    {showQuickAdjust && onAdjust && (
                        <div className="absolute right-0 flex flex-col gap-0.5">
                            <button
                                onClick={(e) => { e.stopPropagation(); onAdjust(type === 'decimal' ? 0.1 : 1) }}
                                className="w-6 h-6 bg-green-500 hover:bg-green-600 text-white rounded flex items-center justify-center text-sm font-bold shadow"
                            >
                                <Plus size={14} />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); onAdjust(type === 'decimal' ? -0.1 : -1) }}
                                className="w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded flex items-center justify-center text-sm font-bold shadow"
                            >
                                <Minus size={14} />
                            </button>
                        </div>
                    )}
                </div>
            )
        } else {
            return <div className="px-2 py-1 text-sm text-center">{value || '-'}</div>
        }
    }

    // 获取单元格背景色
    const getCellBgClass = (value: number | null, min: number | null, max: number | null): string => {
        if (value === null || min === null || max === null || min === max) return ''
        if (value === max) return 'bg-orange-100'
        if (value === min) return 'bg-blue-100'
        return ''
    }

    // 删除成员
    const deleteMember = async (id: number) => {
        try {
            const response = await fetch(`/api/family-members/${id}`, {
                method: 'DELETE'
            })
            const result = await response.json()
            if (result.success) {
                await loadData()
                setRemoveDialog(null)
            } else {
                alert('删除失败: ' + result.error)
            }
        } catch (error) {
            alert('删除失败: ' + error)
        }
    }

    // 删除属性
    const deleteAttribute = async (id: number) => {
        try {
            const response = await fetch(`/api/member-attributes/${id}`, {
                method: 'DELETE'
            })
            const result = await response.json()
            if (result.success) {
                await loadData()
                setRemoveDialog(null)
            } else {
                alert('删除失败: ' + result.error)
            }
        } catch (error) {
            alert('删除失败: ' + error)
        }
    }

    return (
        <PageContainer
            title="家庭成员"
            subtitle="我们温馨的一家人"
            icon={<Users size={40} />}
            iconColor="text-pink-600"
            iconBgColor="bg-gradient-to-br from-pink-400 to-rose-500"
        >
            {/* 操作按钮 */}
            <div className="flex justify-end gap-3 mb-6">
                <button
                    onClick={() => setShowAddMember(true)}
                    className="px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl hover:from-pink-600 hover:to-rose-600 transition shadow-lg hover:shadow-xl flex items-center gap-2 font-medium text-lg"
                >
                    <UserPlus size={24} />
                    添加成员
                </button>
                <button
                    onClick={() => setShowAddAttribute(true)}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 transition shadow-lg hover:shadow-xl flex items-center gap-2 font-medium text-lg"
                >
                    <Plus size={24} />
                    添加属性
                </button>
            </div>

            {/* 家人信息表格 */}
            {members.length === 0 ? (
                <div className="text-center py-20 text-gray-400">
                    <Users size={64} className="mx-auto mb-4 opacity-50" />
                    <p className="text-lg">还没有添加家庭成员，点击右上角"添加成员"开始吧！</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col">
                    {/* 固定表头区域：昵称行 + 头像行 */}
                    <div className="flex-shrink-0 overflow-x-auto border-b-2 border-pink-200">
                        <table className="w-full border-collapse">
                            <thead className="bg-gradient-to-r from-pink-100 to-rose-100">
                                {/* 昵称行 */}
                                <tr>
                                    <th className="border border-gray-300 p-3 text-center font-semibold text-gray-700 bg-pink-50 min-w-[120px]">
                                        成员
                                    </th>
                                    {members.map(member => (
                                        <th
                                            key={member.id}
                                            className="border border-gray-300 p-3 text-center font-bold text-gray-800 min-w-[150px] cursor-pointer hover:bg-pink-200 transition text-lg"
                                            onDoubleClick={() => setRemoveDialog({
                                                type: 'member',
                                                id: member.id,
                                                name: member.nickname
                                            })}
                                            title="双击管理此成员"
                                        >
                                            {member.nickname}
                                        </th>
                                    ))}
                                </tr>
                                {/* 头像行 */}
                                <tr>
                                    <td className="border border-gray-300 p-3 text-center font-medium text-gray-700 bg-pink-50">
                                        头像
                                    </td>
                                    {members.map(member => (
                                        <td
                                            key={member.id}
                                            className="border border-gray-300 p-3 text-center cursor-pointer hover:bg-blue-50 transition"
                                            onDoubleClick={() => {
                                                setEditingCell({
                                                    memberId: member.id,
                                                    attributeKey: 'avatar_path',
                                                    type: 'image',
                                                    currentValue: member.avatar_path
                                                })
                                            }}
                                        >
                                            {member.avatar_path ? (
                                                <img
                                                    src={`/${member.avatar_path}`}
                                                    alt=""
                                                    className="w-20 h-20 rounded-lg object-cover mx-auto"
                                                />
                                            ) : (
                                                <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center mx-auto text-gray-400 text-sm">
                                                    未设置
                                                </div>
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            </thead>
                        </table>
                    </div>

                    {/* 可滚动的属性区域 */}
                    <div className="flex-1 overflow-auto" style={{ maxHeight: 'calc(100vh - 420px)' }}>
                        <table className="w-full border-collapse">
                            <tbody>
                                {/* 固定属性行（排除头像） */}
                                {FIXED_ATTRIBUTES.filter(attr => attr.key !== 'avatar_path').map(attr => {
                                    const { min, max } = getFixedRowMinMax(attr.key, attr.type)
                                    return (
                                        <tr key={attr.key} className="hover:bg-gray-50 transition">
                                            <td className="border border-gray-300 p-3 text-center font-medium text-gray-700 bg-pink-50 min-w-[120px]">
                                                {attr.label}
                                            </td>
                                            {members.map(member => {
                                                const value = getFixedValue(member, attr.key)
                                                const numValue = typeof value === 'number' ? value : null
                                                const isHighest = numValue !== null && numValue === max && min !== max
                                                const isLowest = numValue !== null && numValue === min && min !== max
                                                const isHovering = hoveringCell?.memberId === member.id && hoveringCell?.attributeKey === attr.key
                                                const isNumericType = attr.type === 'integer'

                                                return (
                                                    <td
                                                        key={member.id}
                                                        className={`border border-gray-300 p-3 text-center cursor-pointer hover:bg-blue-50 transition min-w-[150px] ${getCellBgClass(numValue, min, max)}`}
                                                        onDoubleClick={() => {
                                                            setEditingCell({
                                                                memberId: member.id,
                                                                attributeKey: attr.key,
                                                                type: attr.type,
                                                                currentValue: value
                                                            })
                                                        }}
                                                        onMouseEnter={() => isNumericType && setHoveringCell({ memberId: member.id, attributeKey: attr.key })}
                                                        onMouseLeave={() => setHoveringCell(null)}
                                                    >
                                                        {renderCellContent(
                                                            attr.type,
                                                            value,
                                                            isHighest,
                                                            isLowest,
                                                            isHovering,
                                                            (delta) => quickAdjustValue(member.id, undefined, attr.key, attr.type, numValue, delta)
                                                        )}
                                                    </td>
                                                )
                                            })}
                                        </tr>
                                    )
                                })}

                                {/* 动态属性行 */}
                                {attributes.map(attr => {
                                    const { min, max } = getRowMinMax(attr.id, attr.attribute_type)
                                    return (
                                        <tr key={attr.id} className="hover:bg-gray-50 transition">
                                            <td
                                                className="border border-gray-300 p-3 text-center font-medium text-gray-700 bg-pink-50 cursor-pointer hover:bg-pink-200 transition min-w-[120px]"
                                                onDoubleClick={() => setRemoveDialog({
                                                    type: 'attribute',
                                                    id: attr.id,
                                                    name: attr.attribute_name
                                                })}
                                                title="双击管理此属性"
                                            >
                                                <div className="flex items-center justify-center gap-2">
                                                    {attr.attribute_logo && (
                                                        <img src={`/${attr.attribute_logo}`} alt="" className="w-6 h-6 rounded" />
                                                    )}
                                                    {attr.attribute_name}
                                                </div>
                                            </td>
                                            {members.map(member => {
                                                const attrValue = getAttributeValue(member.id, attr.id)
                                                let displayValue: any = null

                                                if (attr.attribute_type === 'integer' || attr.attribute_type === 'decimal') {
                                                    displayValue = attrValue?.value_number ?? null
                                                } else if (attr.attribute_type === 'checkbox') {
                                                    displayValue = attrValue?.value_boolean
                                                } else if (attr.attribute_type === 'image') {
                                                    displayValue = attrValue?.value_image
                                                } else {
                                                    displayValue = attrValue?.value_text
                                                }

                                                const numValue = (attr.attribute_type === 'integer' || attr.attribute_type === 'decimal') ? displayValue : null
                                                const isHighest = numValue !== null && numValue === max && min !== max
                                                const isLowest = numValue !== null && numValue === min && min !== max
                                                const isHovering = hoveringCell?.memberId === member.id && hoveringCell?.attributeId === attr.id
                                                const isNumericType = attr.attribute_type === 'integer' || attr.attribute_type === 'decimal'

                                                return (
                                                    <td
                                                        key={member.id}
                                                        className={`border border-gray-300 p-3 text-center cursor-pointer hover:bg-blue-50 transition min-w-[150px] ${getCellBgClass(numValue, min, max)}`}
                                                        onDoubleClick={() => {
                                                            setEditingCell({
                                                                memberId: member.id,
                                                                attributeId: attr.id,
                                                                type: attr.attribute_type,
                                                                currentValue: displayValue
                                                            })
                                                        }}
                                                        onMouseEnter={() => isNumericType && setHoveringCell({ memberId: member.id, attributeId: attr.id })}
                                                        onMouseLeave={() => setHoveringCell(null)}
                                                    >
                                                        {renderCellContent(
                                                            attr.attribute_type,
                                                            displayValue,
                                                            isHighest,
                                                            isLowest,
                                                            isHovering,
                                                            (delta) => quickAdjustValue(member.id, attr.id, undefined, attr.attribute_type, numValue, delta)
                                                        )}
                                                    </td>
                                                )
                                            })}
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* 对话框 */}
            {showAddMember && (
                <AddMemberDialog
                    onClose={() => setShowAddMember(false)}
                    onSuccess={loadData}
                />
            )}

            {showAddAttribute && (
                <AddAttributeDialog
                    onClose={() => setShowAddAttribute(false)}
                    onSuccess={loadData}
                />
            )}

            {/* 单元格编辑器 */}
            {editingCell && (
                <CellEditor
                    type={editingCell.type as any}
                    value={editingCell.currentValue}
                    onSave={(value) => {
                        if (editingCell.attributeKey) {
                            // 保存固定属性
                            saveFixedValue(editingCell.memberId, editingCell.attributeKey, value)
                        } else if (editingCell.attributeId) {
                            // 保存动态属性
                            saveAttributeValue(editingCell.memberId, editingCell.attributeId, editingCell.type, value)
                        }
                        setEditingCell(null)
                    }}
                    onCancel={() => setEditingCell(null)}
                    imageSize={{ width: 120, height: 120 }}
                    uploadType={editingCell.attributeKey === 'avatar_path' ? 'avatar' : 'attribute'}
                />
            )}

            {/* 移除确认对话框 */}
            {removeDialog && (
                <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setRemoveDialog(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="bg-gradient-to-r from-red-500 to-rose-500 text-white p-6">
                            <div className="flex items-center gap-3">
                                <AlertTriangle size={28} />
                                <h2 className="text-xl font-bold">
                                    管理{removeDialog.type === 'member' ? '成员' : '属性'}
                                </h2>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="mb-6 text-center">
                                <div className="text-2xl font-bold text-gray-800 mb-2">「{removeDialog.name}」</div>
                                <p className="text-gray-500">
                                    {removeDialog.type === 'member'
                                        ? '确定要删除这个成员吗？该成员的所有属性值也会被删除。'
                                        : '确定要删除这个属性吗？所有成员的该属性值都会被删除。'
                                    }
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setRemoveDialog(null)}
                                    className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition font-medium"
                                >
                                    取消
                                </button>
                                <button
                                    onClick={() => {
                                        if (removeDialog.type === 'member') {
                                            deleteMember(removeDialog.id)
                                        } else {
                                            deleteAttribute(removeDialog.id)
                                        }
                                    }}
                                    className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl hover:from-red-600 hover:to-rose-600 transition font-medium flex items-center justify-center gap-2"
                                >
                                    <Trash2 size={18} />
                                    移除条目
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </PageContainer>
    )
}

