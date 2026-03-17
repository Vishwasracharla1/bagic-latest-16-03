import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { MOCK_DATA } from '../../data/mockData'
import * as echarts from 'echarts'

export default function ComplianceOverview() {
    const navigate = useNavigate()
    const compliance = MOCK_DATA.compliance
    const overview = compliance.complianceOverview
    const chartRef = useRef(null)
    const chartInstance = useRef(null)

    const [apiData, setApiData] = useState(null)
    const [trendData, setTrendData] = useState(null)
    const [recentEvents, setRecentEvents] = useState(null)
    const [boundaryData, setBoundaryData] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Fetch Card Stats
                // Fetch Card Stats
                const statsResponse = await fetch(import.meta.env.VITE_COHORTS_API_URL, {
                    method: 'POST',
                    headers: {
                        'accept': 'application/json',
                        'authorization': `Bearer ${import.meta.env.VITE_COHORTS_AUTH_TOKEN}`,
                        'content-type': 'application/json'
                    },
                    body: JSON.stringify({
                        "type": "TIDB",
                        "definition": "WITH audit_stats AS ( SELECT COUNT(*) AS reasoning_events FROM t_69b3f2dba006f77c68dc80fb_t WHERE audit_created_at >= '2025-01-01' AND audit_created_at < DATE_ADD('2025-03-31', INTERVAL 1 DAY) ), violation_stats AS ( SELECT COUNT(*) AS violations FROM t_69b3f434a006f77c68dc80fd_t WHERE created_at >= '2025-01-01' AND created_at < DATE_ADD('2025-03-31', INTERVAL 1 DAY) ), escalation_stats AS ( SELECT COUNT(*) AS escalations FROM t_69b3f503a006f77c68dc80fe_t WHERE created_at >= '2025-01-01' AND created_at < DATE_ADD('2025-03-31', INTERVAL 1 DAY) ) SELECT a.reasoning_events, v.violations, e.escalations, ROUND( CASE WHEN a.reasoning_events = 0 THEN 0 ELSE ((a.reasoning_events - v.violations) * 100.0 / a.reasoning_events) END, 2 ) AS pass_rate_pct, ROUND( CASE WHEN a.reasoning_events = 0 THEN 0 ELSE (e.escalations * 100.0 / a.reasoning_events) END, 2 ) AS escalation_rate_pct FROM audit_stats a CROSS JOIN violation_stats v CROSS JOIN escalation_stats e;"
                    })
                });
                const statsResult = await statsResponse.json();
                if (statsResult.status === 'success' && statsResult.data?.length > 0) {
                    const raw = statsResult.data[0];
                    setApiData({
                        ...raw,
                        violations_pass_text: `${raw.pass_rate_pct}% PASS`,
                        escalation_rate_text: `${raw.escalation_rate_pct}% RATE`,
                        pass_rate_text: `${raw.pass_rate_pct}%`,
                        period_label: 'Q1 2025'
                    });
                }

                // Fetch Trend Data
                const trendResponse = await fetch(import.meta.env.VITE_COHORTS_API_URL, {
                    method: 'POST',
                    headers: {
                        'accept': 'application/json',
                        'authorization': `Bearer ${import.meta.env.VITE_COHORTS_AUTH_TOKEN}`,
                        'content-type': 'application/json'
                    },
                    body: JSON.stringify({
                        "type": "TIDB",
                        "definition": "SELECT YEAR(audit_created_at) AS year, QUARTER(audit_created_at) AS quarter, COUNT(*) AS total_audit_events FROM t_69b3f2dba006f77c68dc80fb_t GROUP BY YEAR(audit_created_at), QUARTER(audit_created_at) ORDER BY year, quarter;"
                    })
                });
                const trendResult = await trendResponse.json();
                if (trendResult.status === 'success' && trendResult.data) {
                    setTrendData(trendResult.data);
                }

                // Fetch Recent Events
                const eventsResponse = await fetch(import.meta.env.VITE_COHORTS_API_URL, {
                    method: 'POST',
                    headers: {
                        'accept': 'application/json',
                        'authorization': `Bearer ${import.meta.env.VITE_COHORTS_AUTH_TOKEN}`,
                        'content-type': 'application/json'
                    },
                    body: JSON.stringify({
                        "type": "TIDB",
                        "definition": "SELECT audit_id, decision_type, framework_used, confidence_score, audit_created_at FROM t_69b3f2dba006f77c68dc80fb_t ORDER BY audit_created_at DESC LIMIT 10;"
                    })
                });
                const eventsResult = await eventsResponse.json();
                if (eventsResult.status === 'success' && eventsResult.data) {
                    setRecentEvents(eventsResult.data.map(d => ({
                        event_title: d.decision_type.replace(/_/g, ' '),
                        event_date: new Date(d.audit_created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit' }),
                        audit_id: d.audit_id,
                        framework: d.framework_used,
                        confidence: d.confidence_score
                    })));
                }

                // Fetch Boundary Protection Data
                const boundaryResponse = await fetch(import.meta.env.VITE_COHORTS_API_URL, {
                    method: 'POST',
                    headers: {
                        'accept': 'application/json',
                        'authorization': `Bearer ${import.meta.env.VITE_COHORTS_AUTH_TOKEN}`,
                        'content-type': 'application/json'
                    },
                    body: JSON.stringify({
                        "type": "TIDB",
                        "definition": "SELECT p.policy_id, p.policy_name, p.related_framework, p.severity, p.status AS policy_status, COUNT(DISTINCT a.audit_id) AS checks_count, COUNT(DISTINCT v.violation_id) AS errors_count, CASE WHEN COUNT(DISTINCT v.violation_id) = 0 THEN 'SECURE' ELSE 'BREACHED' END AS boundary_status FROM t_69b3f374a006f77c68dc80fc_t p LEFT JOIN t_69b3f2dba006f77c68dc80fb_t a ON p.related_framework = a.framework_used AND a.audit_created_at >= '2025-01-01' AND a.audit_created_at < DATE_ADD('2025-03-31', INTERVAL 1 DAY) LEFT JOIN t_69b3f434a006f77c68dc80fd_t v ON p.policy_id = v.policy_id AND v.created_at >= '2025-01-01' AND v.created_at < DATE_ADD('2025-03-31', INTERVAL 1 DAY) WHERE LOWER(COALESCE(p.status, 'active')) = 'active' GROUP BY p.policy_id, p.policy_name, p.related_framework, p.severity, p.status ORDER BY p.policy_name;"
                    })
                });
                const boundaryResult = await boundaryResponse.json();
                if (boundaryResult.status === 'success' && boundaryResult.data) {
                    setBoundaryData(boundaryResult.data);
                }

            } catch (error) {
                console.error("Error fetching compliance data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    useEffect(() => {
        if (chartRef.current) {
            if (chartInstance.current) chartInstance.current.dispose()
            chartInstance.current = echarts.init(chartRef.current)

            const xAxisData = trendData ? trendData.map(d => `Q${d.quarter} ${d.year}`) : ['Q1', 'Q2', 'Q3', 'Q4']
            const seriesData = trendData ? trendData.map(d => d.total_audit_events) : [6234, 7891, 9234, apiData ? apiData.reasoning_events : 12847]

            const option = {
                grid: { left: 50, right: 20, top: 40, bottom: 40 },
                tooltip: { trigger: 'axis', axisPointer: { type: 'line' } },
                legend: { top: 0, textStyle: { fontSize: 10 }, icon: 'circle' },
                xAxis: { type: 'category', data: xAxisData, splitLine: { show: false }, axisLabel: { fontSize: 9 } },
                yAxis: { type: 'value', splitLine: { lineStyle: { type: 'dashed', opacity: 0.3 } }, axisLabel: { fontSize: 9 } },
                series: [{
                    name: 'Audit Events',
                    type: 'line',
                    smooth: true,
                    data: seriesData,
                    itemStyle: { color: '#5470C6' },
                    areaStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: 'rgba(84, 112, 198, 0.3)' },
                            { offset: 1, color: 'rgba(84, 112, 198, 0.05)' }
                        ])
                    },
                    symbol: 'circle',
                    symbolSize: 6
                }]
            }

            chartInstance.current.setOption(option)
        }

        const handleResize = () => chartInstance.current?.resize()
        window.addEventListener('resize', handleResize)
        return () => {
            window.removeEventListener('resize', handleResize)
            chartInstance.current?.dispose()
        }
    }, [overview, apiData, trendData])

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl mb-1 flex items-center gap-3 text-gray-800 font-bold tracking-tight">
                    <i className="fas fa-shield-alt text-primary-blue text-xl"></i>
                    Compliance Overview
                </h1>
                <p className="text-gray-400 text-sm font-medium tracking-wide">{apiData ? `${apiData.period_label} - Comprehensive audit status` : 'Loading Compliance Status...'}</p>
                {loading && (
                    <div className="text-[10px] text-primary-blue animate-pulse mt-1 font-bold">
                        <i className="fas fa-sync-alt fa-spin mr-1"></i> UPDATING REAL-TIME DATA...
                    </div>
                )}
            </div>

            {/* Status Banner */}
            <div className={`flex items-center gap-4 p-4 rounded-xl mb-4 border shadow-sm ${(!apiData || apiData.violations === 0) ? 'bg-success/5 border-success/10' : 'bg-warning/5 border-warning/10'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${(!apiData || apiData.violations === 0) ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                    <i className={`fas fa-${(!apiData || apiData.violations === 0) ? 'check-circle' : 'exclamation-triangle'}`}></i>
                </div>
                <div className="flex-1">
                    <h2 className="text-sm font-bold text-gray-800 tracking-tight">{(apiData && apiData.violations === 0) ? 'All Systems Compliant' : 'Attention Required'}</h2>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                        {apiData 
                            ? `${apiData.reasoning_events.toLocaleString()} events audited - ${apiData.violations} boundary breaches.`
                            : 'Authenticating with Compliance Engine...'}
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[
                    { 
                        icon: 'check-circle', 
                        value: apiData ? apiData.reasoning_events.toLocaleString() : '---', 
                        label: 'Reasoning Events', 
                        change: apiData ? apiData.period_label : 'Q1 2025' 
                    },
                    { 
                        icon: 'shield-alt', 
                        value: apiData ? apiData.violations : '---', 
                        label: 'Violations', 
                        change: apiData ? apiData.violations_pass_text : 'Pending', 
                        color: apiData ? (apiData.violations === 0 ? 'success' : 'warning') : ''
                    },
                    { 
                        icon: 'exclamation-circle', 
                        value: apiData ? apiData.escalations : '---', 
                        label: 'Escalations', 
                        change: apiData ? apiData.escalation_rate_text : '---' 
                    },
                    { 
                        icon: 'clipboard-check', 
                        value: apiData ? apiData.pass_rate_text : '---', 
                        label: 'Pass Rate', 
                        change: apiData ? 'Validated' : 'Queued', 
                        color: 'success' 
                    },
                ].map((stat, i) => (
                    <div key={i} className={`bg-white rounded-xl p-4 shadow-sm border border-gray-100 ${stat.color ? `border-l-4 border-l-${stat.color}` : ''}`}>
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-primary-light/30 rounded-lg flex items-center justify-center text-primary-blue text-sm">
                                <i className={`fas fa-${stat.icon}`}></i>
                            </div>
                            <div>
                                <div className="text-lg font-bold text-gray-800 leading-none mb-1">{stat.value}</div>
                                <div className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">{stat.label}</div>
                                <div className="text-[8px] text-success font-bold tracking-tighter uppercase">{stat.change}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* Boundary Protection */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between bg-gray-50/10">
                            <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <i className="fas fa-shield-alt text-primary-blue text-[10px]"></i> Boundary Protection
                            </h2>
                        </div>
                        <div className="p-4 space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar">
                            {(boundaryData || [
                                { policy_name: 'Clinical Boundary', checks_count: 0, errors_count: 0, boundary_status: 'SECURE' },
                                { policy_name: 'Legal Boundary', checks_count: 0, errors_count: 0, boundary_status: 'SECURE' },
                                { policy_name: 'Hr Boundary', checks_count: 0, errors_count: 0, boundary_status: 'SECURE' },
                                { policy_name: 'Confidentiality Boundary', checks_count: 0, errors_count: 0, boundary_status: 'SECURE' }
                            ]).map((data, idx) => (
                                <div key={data.policy_id || idx} className="pb-4 border-b border-gray-50 last:border-b-0 last:pb-0">
                                    <div className="flex items-center justify-between mb-2">
                                        <div>
                                            <h3 className="text-[12px] font-bold text-gray-800 tracking-tight">{data.policy_name}</h3>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">Checks: {data.checks_count.toLocaleString()}</span>
                                                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">Errors: {data.errors_count}</span>
                                            </div>
                                        </div>
                                        <div className={`text-[8px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest ${data.boundary_status === 'SECURE' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                                            {data.boundary_status}
                                        </div>
                                    </div>
                                    <div className="w-full bg-gray-50 border border-gray-100 rounded-full h-1 relative overflow-hidden">
                                        <div className={`h-full rounded-full transition-all duration-700 ${data.boundary_status === 'SECURE' ? 'bg-success' : 'bg-danger'}`} 
                                             style={{ width: `${data.checks_count > 0 ? Math.max(0, ((data.checks_count - data.errors_count) / data.checks_count * 100)) : 100}%` }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Trend Chart */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
                            <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <i className="fas fa-chart-line text-primary-blue text-[10px]"></i> Volume Trend
                            </h2>
                        </div>
                        <div className="p-4 h-[200px]" ref={chartRef}></div>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* System Status Mini */}
                    <div className="bg-primary-blue/5 rounded-xl border border-primary-blue/10 p-4">
                        <div className="text-[9px] text-primary-blue font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                            <i className="fas fa-microchip"></i> Node Status
                        </div>
                        <div className="space-y-2">
                            {['Guardrail Agent', 'GRM Logger', 'Policy Engine'].map((sys) => (
                                <div key={sys} className="flex items-center justify-between text-[11px] font-bold text-gray-700">
                                    <span className="flex items-center gap-2 opacity-80">
                                        <div className="w-1.5 h-1.5 rounded-full bg-success"></div> {sys}
                                    </span>
                                    <span className="text-success text-[9px] font-bold uppercase tracking-tighter">Live</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recent Activity Mini */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-4 py-1.5 border-b border-gray-50 bg-gray-50/10">
                            <h2 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Recent Events</h2>
                        </div>
                        <div className="p-3 space-y-4 max-h-[430px] overflow-y-auto custom-scrollbar">
                            {(recentEvents || []).map((activity, i) => (
                                <div key={i} className="pb-3 border-b border-gray-50 last:border-b-0 last:pb-0">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="text-[10px] font-bold text-gray-800 uppercase tracking-tight truncate pr-2">{activity.event_title}</span>
                                        <span className="text-[8px] text-gray-400 font-bold uppercase whitespace-nowrap bg-gray-50 px-1.5 py-0.5 rounded">{activity.event_date}</span>
                                    </div>
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <span className="text-[8px] text-primary-blue bg-primary-blue/5 px-1.5 py-0.5 rounded font-bold">{activity.audit_id}</span>
                                        <span className="text-[8px] text-gray-400 font-bold uppercase">Framework: <span className="text-gray-600">{activity.framework}</span></span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full transition-all duration-500 ${activity.confidence >= 0.7 ? 'bg-success' : (activity.confidence >= 0.4 ? 'bg-warning' : 'bg-danger')}`}
                                                style={{ width: `${activity.confidence * 100}%` }}
                                            ></div>
                                        </div>
                                        <span className={`text-[8px] font-bold ${activity.confidence >= 0.7 ? 'text-success' : (activity.confidence >= 0.4 ? 'text-warning' : 'text-danger')}`}>
                                            {(activity.confidence * 100).toFixed(0)}% Conf.
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {(!recentEvents || recentEvents.length === 0) && (
                                <div className="text-center py-4 text-[10px] text-gray-400 font-bold uppercase">Initializing Live Feed...</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
