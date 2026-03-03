import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from '../common/Navbar'
import Sidebar from '../common/Sidebar'
import HRDashboardView from './HRDashboardView'
import HRPrograms from './HRPrograms'
import HRStudio from './HRStudio'
import HRROI from './HRROI'
import HRGRM from './HRGRM'

const sidebarItems = [
    { id: 'dashboard', icon: 'tachometer-alt', label: 'Dashboard' },
    { id: 'programs', icon: 'list', label: 'Programs' },
    { id: 'studio', icon: 'cogs', label: 'Program Studio' },
    { id: 'roi', icon: 'calculator', label: 'ROI Calculator' },
    { id: 'grm', icon: 'search', label: 'GRM Explorer' },
]

export default function HRDashboard() {
    return (
        <div className="h-screen flex flex-col">
            <Navbar
                title="HR Program Owner"
                userName="Neha Kapoor"
                userRole="L&D Head"
                userIcon="briefcase"
            />
            <div className="flex flex-1 overflow-hidden">
                <Sidebar items={sidebarItems} basePath="/hr" />
                <div className="flex-1 p-6 overflow-y-auto bg-gray-50/50">
                    <Routes>
                        <Route path="dashboard" element={<HRDashboardView />} />
                        <Route path="programs" element={<HRPrograms />} />
                        <Route path="studio" element={<HRStudio />} />
                        <Route path="roi" element={<HRROI />} />
                        <Route path="grm" element={<HRGRM />} />
                        <Route path="/" element={<Navigate to="dashboard" replace />} />
                    </Routes>
                </div>
            </div>
        </div>
    )
}
