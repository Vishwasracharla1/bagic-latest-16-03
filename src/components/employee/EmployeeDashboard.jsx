import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from '../common/Navbar'
import Sidebar from '../common/Sidebar'
import EmployeeOverview from './EmployeeOverview'
import EmployeeChat from './EmployeeChat'
import EmployeeContent from './EmployeeContent'
import EmployeeProgress from './EmployeeProgress'
import EmployeeSessions from './EmployeeSessions'

const sidebarItems = [
    { id: 'overview', icon: 'home', label: 'Overview' },
    { id: 'chat', icon: 'comments', label: 'AI Coach Chat' },
    { id: 'content', icon: 'book', label: 'Content Feed' },
    { id: 'progress', icon: 'chart-line', label: 'Progress' },
    { id: 'sessions', icon: 'calendar', label: 'Sessions' },
]

export default function EmployeeDashboard() {
    return (
        <div className="h-screen flex flex-col">
            <Navbar
                title="Employee Dashboard"
                userName="Rahul Sharma"
                userRole="Claims Team Lead"
                userIcon="user"
            />
            <div className="flex flex-1 overflow-hidden">
                <Sidebar items={sidebarItems} basePath="/employee" />
                <div className="flex-1 p-6 overflow-y-auto bg-gray-50/50">
                    <Routes>
                        <Route path="overview" element={<EmployeeOverview />} />
                        <Route path="chat" element={<EmployeeChat />} />
                        <Route path="content" element={<EmployeeContent />} />
                        <Route path="progress" element={<EmployeeProgress />} />
                        <Route path="sessions" element={<EmployeeSessions />} />
                        <Route path="/" element={<Navigate to="overview" replace />} />
                    </Routes>
                </div>
            </div>
        </div>
    )
}
