import { useState, useEffect } from 'react'

export default function ComplianceViolations() {
    const [apiData, setApiData] = useState(null)
    const [alertsData, setAlertsData] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchViolationData = async () => {
            try {
                // Fetch Stats
                const statsResponse = await fetch(import.meta.env.VITE_COHORTS_API_URL, {
                    method: 'POST',
                    headers: {
                        'accept': 'application/json',
                        'authorization': `Bearer ${import.meta.env.VITE_COHORTS_AUTH_TOKEN}`,
                        'content-type': 'application/json'
                    },
                    body: JSON.stringify({
                        "type": "TIDB",
                        "definition": "SELECT COUNT(*) AS total_violations, IFNULL(SUM( CASE WHEN p.policy_name IN ( 'Psychological Safety in Coaching', 'Safe Feedback Environment', 'Respectful Manager Communication', 'Respectful Feedback Practices', 'Conflict De-escalation Standard', 'Team Conflict Resolution Protocol' ) OR LOWER(COALESCE(v.violation_reason, '')) = 'psychological_safety_flag' OR LOWER(COALESCE(v.violation_reason, '')) LIKE '%team tension%' OR LOWER(COALESCE(v.violation_reason, '')) LIKE '%difficult conversation%' OR LOWER(COALESCE(v.violation_reason, '')) LIKE '%personality clash%' OR LOWER(COALESCE(v.violation_reason, '')) LIKE '%disagreement%' OR LOWER(COALESCE(v.violation_reason, '')) LIKE '%mediation%' OR LOWER(COALESCE(v.violation_reason, '')) LIKE '%resolution%' THEN 1 ELSE 0 END ), 0) AS psychological_safety, IFNULL(SUM( CASE WHEN p.policy_name IN ( 'Ethical Leadership Guidance', 'Ethical Decision Support', 'Ethical Performance Evaluation', 'Bias-Free Coaching Recommendations', 'Fair Team Recognition Guidance', 'Inclusive Communication Guidance', 'Coaching Transparency Requirement', 'Responsible Feedback Escalation' ) OR LOWER(COALESCE(v.violation_reason, '')) = 'leadership_bias_risk' OR LOWER(COALESCE(v.violation_reason, '')) = 'feedback_recommendation_tone_risk' OR LOWER(COALESCE(v.violation_reason, '')) LIKE '%bias%' OR LOWER(COALESCE(v.violation_reason, '')) LIKE '%ethical%' OR LOWER(COALESCE(v.violation_reason, '')) LIKE '%transparency%' OR LOWER(COALESCE(v.violation_reason, '')) LIKE '%constructive criticism%' OR LOWER(COALESCE(v.violation_reason, '')) LIKE '%feedback%' THEN 1 ELSE 0 END ), 0) AS ethics_bias_risk, IFNULL(SUM( CASE WHEN p.policy_name IN ( 'Confidential Coaching Data', 'Confidential Goal Discussions', 'Coaching Boundary Enforcement' ) OR LOWER(COALESCE(v.violation_reason, '')) LIKE '%confidential%' OR LOWER(COALESCE(v.violation_reason, '')) LIKE '%privacy%' THEN 1 ELSE 0 END ), 0) AS confidentiality FROM t_69b3f434a006f77c68dc80fd_t v LEFT JOIN t_69b3f374a006f77c68dc80fc_t p ON v.policy_id = p.policy_id WHERE LOWER(COALESCE(v.status, 'open')) = 'open';"
                    })
                });
                const statsResult = await statsResponse.json();
                if (statsResult.status === 'success' && statsResult.data?.length > 0) {
                    setApiData(statsResult.data[0]);
                }

                // Fetch Detailed Alerts
                const alertsResponse = await fetch(import.meta.env.VITE_COHORTS_API_URL, {
                    method: 'POST',
                    headers: {
                        'accept': 'application/json',
                        'authorization': `Bearer ${import.meta.env.VITE_COHORTS_AUTH_TOKEN}`,
                        'content-type': 'application/json'
                    },
                    body: JSON.stringify({
                        "type": "TIDB",
                        "definition": "SELECT x.violation_id, x.employee_id, x.employee_name, x.role_title, x.policy_name, x.violation_reason, x.severity, x.status, x.created_at, x.alert_category, CASE WHEN x.alert_category = 'Psychological Safety' THEN CONCAT('Psychological safety alert for ', x.employee_name) WHEN x.alert_category = 'Ethics / Bias Risk' THEN CONCAT('Ethics/bias risk detected for ', x.employee_name) WHEN x.alert_category = 'Confidentiality' THEN CONCAT('Confidentiality alert for ', x.employee_name) ELSE CONCAT('Policy alert for ', x.employee_name) END AS alert_title FROM ( SELECT v.violation_id, v.policy_id, p.policy_name, v.employee_id, CONCAT(e.first_name, ' ', e.last_name) AS employee_name, e.role_title, v.violation_reason, v.severity, v.status, v.created_at, CASE WHEN p.policy_name IN ( 'Psychological Safety in Coaching', 'Safe Feedback Environment', 'Respectful Manager Communication', 'Respectful Feedback Practices', 'Conflict De-escalation Standard', 'Team Conflict Resolution Protocol' ) OR LOWER(COALESCE(v.violation_reason, '')) = 'psychological_safety_flag' OR LOWER(COALESCE(v.violation_reason, '')) LIKE '%team tension%' OR LOWER(COALESCE(v.violation_reason, '')) LIKE '%difficult conversation%' OR LOWER(COALESCE(v.violation_reason, '')) LIKE '%personality clash%' OR LOWER(COALESCE(v.violation_reason, '')) LIKE '%disagreement%' OR LOWER(COALESCE(v.violation_reason, '')) LIKE '%mediation%' OR LOWER(COALESCE(v.violation_reason, '')) LIKE '%resolution%' THEN 'Psychological Safety' WHEN p.policy_name IN ( 'Ethical Leadership Guidance', 'Ethical Decision Support', 'Ethical Performance Evaluation', 'Bias-Free Coaching Recommendations', 'Fair Team Recognition Guidance', 'Inclusive Communication Guidance', 'Coaching Transparency Requirement', 'Responsible Feedback Escalation' ) OR LOWER(COALESCE(v.violation_reason, '')) = 'leadership_bias_risk' OR LOWER(COALESCE(v.violation_reason, '')) = 'feedback_recommendation_tone_risk' OR LOWER(COALESCE(v.violation_reason, '')) LIKE '%bias%' OR LOWER(COALESCE(v.violation_reason, '')) LIKE '%ethical%' OR LOWER(COALESCE(v.violation_reason, '')) LIKE '%transparency%' OR LOWER(COALESCE(v.violation_reason, '')) LIKE '%constructive criticism%' OR LOWER(COALESCE(v.violation_reason, '')) LIKE '%feedback%' THEN 'Ethics / Bias Risk' WHEN p.policy_name IN ( 'Confidential Goal Discussions', 'Confidential Coaching Data', 'Coaching Boundary Enforcement' ) OR LOWER(COALESCE(v.violation_reason, '')) LIKE '%confidential%' OR LOWER(COALESCE(v.violation_reason, '')) LIKE '%privacy%' THEN 'Confidentiality' ELSE 'Other' END AS alert_category FROM t_69b3f434a006f77c68dc80fd_t v LEFT JOIN t_69b3f374a006f77c68dc80fc_t p ON v.policy_id = p.policy_id LEFT JOIN t_69a82b4442abf6674cbcb928_t e ON v.employee_id = e.employee_id WHERE LOWER(COALESCE(v.status, 'open')) = 'open' ) x ORDER BY x.created_at DESC LIMIT 20;"
                    })
                });
                const alertsResult = await alertsResponse.json();
                if (alertsResult.status === 'success') {
                    setAlertsData(alertsResult.data || []);
                }
            } catch (error) {
                console.error("Error fetching violation data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchViolationData();
    }, []);

    const totalViolations = apiData ? (apiData.total_violations ?? 0) : 0;
    const isCompliant = totalViolations === 0;

    const getSeverityCls = (severity) => {
        switch (severity?.toLowerCase()) {
            case 'critical': return 'bg-danger/10 text-danger border-danger/20';
            case 'high': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
            case 'medium': return 'bg-warning/10 text-warning border-warning/20';
            default: return 'bg-success/10 text-success border-success/20';
        }
    }

    return (
        <div className="pb-10">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl mb-1 flex items-center gap-3 text-gray-800 font-bold tracking-tight">
                        <i className="fas fa-bell text-primary-blue text-xl"></i>
                        Violation Monitor
                    </h1>
                    <p className="text-gray-400 text-sm font-medium tracking-wide">Real-time boundary breach detection</p>
                </div>
                {loading && (
                    <div className="text-[10px] text-primary-blue animate-pulse font-bold">
                        <i className="fas fa-sync-alt fa-spin mr-1"></i> UPDATING LIVE FEED...
                    </div>
                )}
            </div>

            {/* Status Banner */}
            <div className={`flex items-center gap-4 p-4 rounded-xl mb-4 border shadow-sm ${isCompliant ? 'bg-success/5 border-success/10' : 'bg-danger/5 border-danger/10'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${isCompliant ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                    <i className={`fas fa-${isCompliant ? 'check-circle' : 'exclamation-triangle'}`}></i>
                </div>
                <div>
                    <h2 className="text-sm font-bold text-gray-800 tracking-tight">
                        {apiData ? (isCompliant ? 'System Status: Compliant' : 'System Status: Violations Detected') : 'Initializing Monitor...'}
                    </h2>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                        {apiData ? (isCompliant ? 'ALL SYSTEMS OPERATING WITHIN BOUNDARIES' : 'BOUNDARY BREACHES REQUIRE ATTENTION') : 'Establishing Auth Secure Tunnel...'}
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[
                    { icon: 'shield-alt', value: apiData ? totalViolations : '---', label: 'Total Violations', cls: `border-l-4 ${isCompliant ? 'border-l-success' : 'border-l-danger'}` },
                    { icon: 'user-friends', value: apiData ? (apiData.psychological_safety ?? 0) : '---', label: 'Psychological Safety', cls: '' },
                    { icon: 'balance-scale', value: apiData ? (apiData.ethics_bias_risk ?? 0) : '---', label: 'Ethics & Bias Risk', cls: '' },
                    { icon: 'user-lock', value: apiData ? (apiData.confidentiality ?? 0) : '---', label: 'Confidentiality', cls: '' },
                ].map((stat, i) => (
                    <div key={i} className={`bg-white rounded-xl p-4 shadow-sm border border-gray-100 ${stat.cls}`}>
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-primary-light/30 rounded-lg flex items-center justify-center text-primary-blue text-sm flex-shrink-0">
                                <i className={`fas fa-${stat.icon}`}></i>
                            </div>
                            <div>
                                <div className="text-xl font-bold text-gray-900 leading-none mb-1">{stat.value}</div>
                                <div className="text-[9px] text-gray-400 font-bold uppercase tracking-widest leading-tight">{stat.label}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Content Area */}
            {isCompliant ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                    <div className="w-16 h-16 bg-success/5 text-success rounded-full flex items-center justify-center text-3xl mx-auto mb-4 border border-success/10">
                        <i className="fas fa-check-circle"></i>
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-1">No Recent Alerts</h3>
                    <p className="text-sm text-gray-400 font-medium">All AI interactions are currently within safety protocols.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                             Active Alert Feed <span className="bg-danger/10 text-danger px-1.5 py-0.5 rounded text-[9px]">{alertsData.length} Recent</span>
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 gap-4 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
                        {alertsData.map((alert, idx) => (
                            <div key={idx} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:border-primary-blue/30 transition-all group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-primary-blue group-hover:bg-primary-blue/5 transition-colors">
                                            <i className={`fas fa-${
                                                alert.alert_category === 'Psychological Safety' ? 'user-friends' : 
                                                alert.alert_category === 'Ethics / Bias Risk' ? 'balance-scale' : 
                                                alert.alert_category === 'Confidentiality' ? 'user-lock' : 'info-circle'
                                            }`}></i>
                                        </div>
                                        <div>
                                            <h4 className="text-[13px] font-bold text-gray-800 leading-snug">{alert.alert_title}</h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{alert.employee_id}</span>
                                                <span className="w-1 h-1 bg-gray-200 rounded-full"></span>
                                                <span className="text-[10px] text-gray-500 font-medium">{alert.role_title}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg border ${getSeverityCls(alert.severity)}`}>
                                            {alert.severity}
                                        </span>
                                        <span className="text-[10px] text-gray-400 font-medium tracking-tight">
                                            {new Date(alert.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>

                                <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-50 mb-4">
                                    <div className="text-[9px] text-primary-blue font-bold uppercase tracking-widest mb-1.5 opacity-60">Violation Reason</div>
                                    <p className="text-[11px] text-gray-600 leading-relaxed font-medium capitalize">
                                        {alert.violation_reason}
                                    </p>
                                </div>

                                <div className="flex items-center justify-between text-[10px]">
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100/50 rounded-lg border border-gray-100">
                                        <span className="text-gray-400 font-bold uppercase tracking-widest">Policy</span>
                                        <span className="text-gray-700 font-bold">{alert.policy_name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button className="px-4 py-2 bg-primary-blue/5 text-primary-blue rounded-lg font-bold uppercase tracking-widest hover:bg-primary-blue hover:text-white transition-all border border-primary-blue/10">
                                            Acknowledge
                                        </button>
                                        <button className="px-4 py-2 bg-white text-gray-500 rounded-lg font-bold uppercase tracking-widest border border-gray-200 hover:bg-gray-50 transition-all">
                                            Audit Trail
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
