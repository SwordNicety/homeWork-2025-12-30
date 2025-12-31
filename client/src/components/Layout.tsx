import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function Layout() {
    return (
        <div className="flex h-screen">
            <Sidebar />
            <main className="flex-1 ml-72 p-8 overflow-auto flex flex-col">
                <Outlet />
            </main>
        </div>
    )
}
