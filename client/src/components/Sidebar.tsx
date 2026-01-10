import { NavLink } from 'react-router-dom'
import {
    Home,
    Users,
    CheckSquare,
    BookOpen,
    PenTool,
    RefreshCw,
    Gamepad2,
    Star,
    TrendingUp,
    Film,
    Trophy
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
    path: string
    label: string
    icon: React.ReactNode
    color: string
    bgColor: string
}

const navItems: NavItem[] = [
    {
        path: '/',
        label: '首页',
        icon: <Home size={28} />,
        color: 'text-amber-600',
        bgColor: 'bg-amber-100 hover:bg-amber-200'
    },
    {
        path: '/family',
        label: '家庭成员',
        icon: <Users size={28} />,
        color: 'text-pink-600',
        bgColor: 'bg-pink-100 hover:bg-pink-200'
    },
    {
        path: '/todos',
        label: '待做任务',
        icon: <CheckSquare size={28} />,
        color: 'text-green-600',
        bgColor: 'bg-green-100 hover:bg-green-200'
    },
    {
        path: '/knowledge',
        label: '知识库',
        icon: <BookOpen size={28} />,
        color: 'text-blue-600',
        bgColor: 'bg-blue-100 hover:bg-blue-200'
    },
    {
        path: '/diary',
        label: '木木日记',
        icon: <PenTool size={28} />,
        color: 'text-purple-600',
        bgColor: 'bg-purple-100 hover:bg-purple-200'
    },
    {
        path: '/periodic',
        label: '周期任务',
        icon: <RefreshCw size={28} />,
        color: 'text-cyan-600',
        bgColor: 'bg-cyan-100 hover:bg-cyan-200'
    },
    {
        path: '/games',
        label: '游戏空间',
        icon: <Gamepad2 size={28} />,
        color: 'text-orange-600',
        bgColor: 'bg-orange-100 hover:bg-orange-200'
    },
    {
        path: '/theater',
        label: '放映厅',
        icon: <Film size={28} />,
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-100 hover:bg-indigo-200'
    },
    {
        path: '/honors',
        label: '荣誉室',
        icon: <Trophy size={28} />,
        color: 'text-amber-600',
        bgColor: 'bg-amber-100 hover:bg-amber-200'
    },
    {
        path: '/favorites',
        label: '我的收藏',
        icon: <Star size={28} />,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100 hover:bg-yellow-200'
    },
    {
        path: '/growth',
        label: '成长轨迹',
        icon: <TrendingUp size={28} />,
        color: 'text-rose-600',
        bgColor: 'bg-rose-100 hover:bg-rose-200'
    },
]

export default function Sidebar() {
    return (
        <aside className="fixed left-0 top-0 h-screen w-72 bg-white/80 backdrop-blur-lg shadow-card border-r border-white/50 flex flex-col">
            {/* Logo区域 */}
            <div className="p-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                        <Home size={28} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                            木木的家
                        </h1>
                        <p className="text-sm text-gray-500">家庭助手</p>
                    </div>
                </div>
            </div>

            {/* 导航菜单 */}
            <nav className="flex-1 p-4 overflow-y-auto">
                <ul className="space-y-2">
                    {navItems.map((item) => (
                        <li key={item.path}>
                            <NavLink
                                to={item.path}
                                end={item.path === '/'}
                                className={({ isActive }) =>
                                    cn(
                                        'flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-200 group',
                                        'text-xl font-medium',
                                        item.bgColor,
                                        isActive
                                            ? `${item.bgColor} ring-2 ring-offset-2 ring-current shadow-soft scale-[1.02]`
                                            : 'hover:scale-[1.02]'
                                    )
                                }
                            >
                                {({ isActive }) => (
                                    <>
                                        <span className={cn(
                                            'transition-transform duration-200',
                                            item.color,
                                            isActive && 'scale-110'
                                        )}>
                                            {item.icon}
                                        </span>
                                        <span className={cn(
                                            item.color,
                                            'font-semibold'
                                        )}>
                                            {item.label}
                                        </span>
                                    </>
                                )}
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>

            {/* 底部装饰 */}
            <div className="p-4 border-t border-gray-100">
                <div className="text-center text-gray-400 text-sm">
                    🏠 温馨小家 · 快乐每天
                </div>
            </div>
        </aside>
    )
}
