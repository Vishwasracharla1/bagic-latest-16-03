import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from '../common/Navbar'
import Sidebar from '../common/Sidebar'
import ComplianceOverview from './ComplianceOverview'
import ComplianceGRM from './ComplianceGRM'
import ComplianceViolations from './ComplianceViolations'
import ComplianceAudit from './ComplianceAudit'
import CompliancePolicy from './CompliancePolicy'

const sidebarItems = [
    { id: 'overview', icon: 'shield-alt', label: 'Overview' },
    { id: 'grm', icon: 'project-diagram', label: 'GRM Explorer' },
    { id: 'violations', icon: 'bell', label: 'Violations' },
    { id: 'audit', icon: 'clipboard-check', label: 'Audit Reports' },
    { id: 'policy', icon: 'file-contract', label: 'Policy Mgmt' },
]

export default function ComplianceDashboard() {
    return (
        <div className="h-screen flex flex-col">
            <Navbar
                title="Compliance Dashboard"
                userName="Arjun Patel"
                userRole="Compliance Officer"
                userIcon="shield-alt"
            />
            <div className="flex flex-1 overflow-hidden">
                <Sidebar items={sidebarItems} basePath="/compliance" />
                <div className="flex-1 p-6 overflow-y-auto bg-gray-50/50">
                    <Routes>
                        <Route path="overview" element={<ComplianceOverview />} />
                        <Route path="grm" element={<ComplianceGRM />} />
                        <Route path="violations" element={<ComplianceViolations />} />
                        <Route path="audit" element={<ComplianceAudit />} />
                        <Route path="policy" element={<CompliancePolicy />} />
                        <Route path="/" element={<Navigate to="overview" replace />} />
                    </Routes>
                </div>
            </div>
        </div>
    )
}
