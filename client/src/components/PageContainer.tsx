import React from 'react'
import { cn } from '@/lib/utils'

interface PageContainerProps {
    title: string
    subtitle?: string
    icon?: React.ReactNode
    iconColor?: string
    iconBgColor?: string
    children?: React.ReactNode
    showHeader?: boolean
}

export default function PageContainer({
    title,
    subtitle,
    icon,
    iconColor = 'text-blue-600',
    iconBgColor = 'bg-gradient-to-br from-blue-400 to-indigo-500',
    children,
    showHeader = true
}: PageContainerProps) {
    return (
        <div className="w-full h-full flex flex-col">
            {/* 页面标题区 */}
            {showHeader && icon && (
                <div className="mb-8 flex items-center gap-5">
                    <div className={cn(
                        'w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg',
                        iconBgColor
                    )}>
                        <span className={iconColor}>{icon}</span>
                    </div>
                    <div>
                        <h1 className="text-4xl font-bold text-gray-800">{title}</h1>
                        {subtitle && (
                            <p className="text-xl text-gray-500 mt-1">{subtitle}</p>
                        )}
                    </div>
                </div>
            )}

            {/* 页面内容区 */}
            <div className={cn(
                "flex-1 bg-white/70 backdrop-blur-sm rounded-3xl shadow-soft overflow-auto",
                showHeader && icon ? "p-8" : ""
            )}>
                {children || (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                        <div className="text-6xl mb-4">🚧</div>
                        <p className="text-2xl">功能正在建设中...</p>
                        <p className="text-lg mt-2">敬请期待！</p>
                    </div>
                )}
            </div>
        </div>
    )
}
