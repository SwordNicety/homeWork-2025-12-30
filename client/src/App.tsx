import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import FamilyMembersPage from './pages/FamilyMembersPage'
import TodoTasksPage from './pages/TodoTasksPage'
import KnowledgeBasePage from './pages/KnowledgeBasePage'
import CategoryDetailPage from './pages/CategoryDetailPage'
import SectionDetailPage from './pages/SectionDetailPage'
import MumuDiaryPage from './pages/MumuDiaryPage'
import PeriodicTasksPage from './pages/PeriodicTasksPage'
import GameSpacePage from './pages/GameSpacePage'
import FavoritesPage from './pages/FavoritesPage'
import GrowthTrackPage from './pages/GrowthTrackPage'

function App() {
    return (
        <Routes>
            <Route path="/" element={<Layout />}>
                <Route index element={<HomePage />} />
                <Route path="family" element={<FamilyMembersPage />} />
                <Route path="todos" element={<TodoTasksPage />} />
                <Route path="knowledge" element={<KnowledgeBasePage />} />
                <Route path="knowledge/:categoryId" element={<CategoryDetailPage />} />
                <Route path="knowledge/:categoryId/:sectionId" element={<SectionDetailPage />} />
                <Route path="diary" element={<MumuDiaryPage />} />
                <Route path="periodic" element={<PeriodicTasksPage />} />
                <Route path="games" element={<GameSpacePage />} />
                <Route path="favorites" element={<FavoritesPage />} />
                <Route path="growth" element={<GrowthTrackPage />} />
            </Route>
        </Routes>
    )
}

export default App
