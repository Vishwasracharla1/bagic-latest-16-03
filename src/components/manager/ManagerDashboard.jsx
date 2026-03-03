import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from '../common/Navbar'
import Sidebar from '../common/Sidebar'
import ManagerTeam from './ManagerTeam'
import ManagerAnalytics from './ManagerAnalytics'
import ManagerPrep from './ManagerPrep'
import ManagerAlerts from './ManagerAlerts'

const sidebarItems = [
    { id: 'team', icon: 'users', label: 'Team Overview' },
    { id: 'analytics', icon: 'chart-bar', label: 'Analytics' },
    { id: 'prep', icon: 'clipboard-list', label: 'Session Prep' },
    { id: 'alerts', icon: 'exclamation-triangle', label: 'Alerts' },
]

export default function ManagerDashboard() {
    return (
        <div className="h-screen flex flex-col">
            <Navbar
                title="Manager Dashboard"
                userName="Priya Mehta"
                userRole="Senior Claims Manager"
                userIcon="user-tie"
            />
            <div className="flex flex-1 overflow-hidden">
                <Sidebar items={sidebarItems} basePath="/manager" />
                <div className="flex-1 p-6 overflow-y-auto bg-gray-50/50">
                    <Routes>
                        <Route path="team" element={<ManagerTeam />} />
                        <Route path="analytics" element={<ManagerAnalytics />} />
                        <Route path="prep" element={<ManagerPrep />} />
                        <Route path="alerts" element={<ManagerAlerts />} />
                        <Route path="/" element={<Navigate to="team" replace />} />
                    </Routes>
                </div>
            </div>
        </div>
    )
}
