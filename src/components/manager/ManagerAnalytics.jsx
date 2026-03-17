import { useState, useEffect, useRef } from 'react'
import { MOCK_DATA } from '../../data/mockData'
import * as echarts from 'echarts'

export default function ManagerAnalytics() {
    const manager = MOCK_DATA.manager
    const progressRef = useRef(null)
    const riskRef = useRef(null)
    const skillRef = useRef(null)
    const chartInstances = useRef([])

    const [allManagers, setAllManagers] = useState([])
    const [selectedManager, setSelectedManager] = useState(localStorage.getItem('active_manager_id') || localStorage.getItem('user_id') || 'BAJ00003')
    const [selectedManagerName, setSelectedManagerName] = useState(localStorage.getItem('active_manager_name') || localStorage.getItem('user_name') || 'Select Manager')
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const [isInitialLoading, setIsInitialLoading] = useState(true)
    const [analyticsStats, setAnalyticsStats] = useState({
        low_risk_members: 0,
        topicImprovements: [],
        teamProgress: [],
        riskDistribution: [],
        skillTrends: [],
        focusAreas: []
    })
    const role = localStorage.getItem('user_role')

    useEffect(() => {
        const fetchAnalyticsData = async () => {
            try {
                const token = import.meta.env.VITE_COHORTS_AUTH_TOKEN;

                const [lowRiskRes, topicsRes, progressRes, riskRes, trendsRes, focusRes] = await Promise.all([
                    fetch('https://ig.gov-cloud.ai/pi-cohorts-service-dbaas/v1.0/cohorts/adhoc', {
                        method: 'POST',
                        headers: {
                            'accept': 'application/json',
                            'authorization': `Bearer ${token}`,
                            'content-type': 'application/json'
                        },
                        body: JSON.stringify({
                            type: "TIDB",
                            definition: `SELECT COUNT(*) AS low_risk_members FROM t_69a82b4442abf6674cbcb928_t e LEFT JOIN ( SELECT g.employee_id, ROUND(AVG(g.progress_pct), 0) AS avg_progress_pct FROM t_69a8310842abf6674cbcb943_t g WHERE g.status <> 'cancelled' GROUP BY g.employee_id ) g ON e.employee_id = g.employee_id LEFT JOIN ( SELECT s.employee_id, COUNT(*) AS sessions_count, MAX(s.started_at) AS last_session_at, DATEDIFF(CURRENT_DATE, DATE(MAX(s.started_at))) AS last_session_days_ago FROM t_69a82d5742abf6674cbcb935_t s GROUP BY s.employee_id ) s ON e.employee_id = s.employee_id WHERE e.manager_id ='${selectedManager}' AND e.employment_status <> 'resigned' AND IFNULL(g.avg_progress_pct, 0) >= 60;`
                        })
                    }),
                    fetch('https://ig.gov-cloud.ai/pi-cohorts-service-dbaas/v1.0/cohorts/adhoc', {
                        method: 'POST',
                        headers: {
                            'accept': 'application/json',
                            'authorization': `Bearer ${token}`,
                            'content-type': 'application/json'
                        },
                        body: JSON.stringify({
                            type: "TIDB",
                            definition: `SELECT s.primary_topic, ROUND( ( IFNULL(AVG(CASE WHEN SUBSTR(s.started_at, 1, 4) = '2025' THEN s.sentiment_score END), 0) - IFNULL(AVG(CASE WHEN SUBSTR(s.started_at, 1, 4) = '2024' THEN s.sentiment_score END), 0) ) * 100, 0 ) AS improvement_pct FROM t_69a82d5742abf6674cbcb935_t s JOIN t_69a82b4442abf6674cbcb928_t e ON e.employee_id = s.employee_id WHERE e.manager_id = '${selectedManager}' AND e.employment_status <> 'resigned' AND SUBSTR(s.started_at, 1, 4) IN ('2024', '2025') GROUP BY s.primary_topic ORDER BY improvement_pct DESC;`
                        })
                    }),
                    fetch('https://ig.gov-cloud.ai/pi-cohorts-service-dbaas/v1.0/cohorts/adhoc', {
                        method: 'POST',
                        headers: {
                            'accept': 'application/json',
                            'authorization': `Bearer ${token}`,
                            'content-type': 'application/json'
                        },
                        body: JSON.stringify({
                            type: "TIDB",
                            definition: `SELECT e.employee_id, CONCAT(e.first_name, ' ', e.last_name) AS employee_name, ROUND(IFNULL(AVG(g.progress_pct), 0), 0) AS progress_pct FROM t_69a82b4442abf6674cbcb928_t e LEFT JOIN t_69a8310842abf6674cbcb943_t g ON e.employee_id = g.employee_id AND g.status <> 'cancelled' WHERE e.manager_id = '${selectedManager}' AND e.employment_status <> 'resigned' GROUP BY e.employee_id, e.first_name, e.last_name ORDER BY progress_pct DESC, employee_name ASC;`
                        })
                    }),
                    fetch('https://ig.gov-cloud.ai/pi-cohorts-service-dbaas/v1.0/cohorts/adhoc', {
                        method: 'POST',
                        headers: {
                            'accept': 'application/json',
                            'authorization': `Bearer ${token}`,
                            'content-type': 'application/json'
                        },
                        body: JSON.stringify({
                            type: "TIDB",
                            definition: `SELECT r.risk_level, IFNULL(x.member_count, 0) AS member_count FROM ( SELECT 'Low Risk' AS risk_level UNION ALL SELECT 'Medium Risk' UNION ALL SELECT 'High Risk' ) r LEFT JOIN ( SELECT risk_level, COUNT(*) AS member_count FROM ( SELECT e.employee_id, CASE WHEN IFNULL(s.last_session_days_ago, 9999) > 14 AND IFNULL(g.avg_progress_pct, 0) < 40 THEN 'High Risk' WHEN IFNULL(s.last_session_days_ago, 9999) > 14 OR IFNULL(g.avg_progress_pct, 0) < 60 THEN 'Medium Risk' ELSE 'Low Risk' END AS risk_level FROM t_69a82b4442abf6674cbcb928_t e LEFT JOIN ( SELECT employee_id, ROUND(AVG(progress_pct), 0) AS avg_progress_pct FROM t_69a8310842abf6674cbcb943_t WHERE status <> 'cancelled' GROUP BY employee_id ) g ON e.employee_id = g.employee_id LEFT JOIN ( SELECT employee_id, DATEDIFF(CURRENT_DATE, DATE(MAX(started_at))) AS last_session_days_ago FROM t_69a82d5742abf6674cbcb935_t GROUP BY employee_id ) s ON e.employee_id = s.employee_id WHERE e.manager_id = '${selectedManager}' AND e.employment_status <> 'resigned' ) base GROUP BY risk_level ) x ON r.risk_level = x.risk_level ORDER BY CASE r.risk_level WHEN 'Low Risk' THEN 1 WHEN 'Medium Risk' THEN 2 WHEN 'High Risk' THEN 3 END;`
                        })
                    }),
                    fetch('https://ig.gov-cloud.ai/pi-cohorts-service-dbaas/v1.0/cohorts/adhoc', {
                        method: 'POST',
                        headers: {
                            'accept': 'application/json',
                            'authorization': `Bearer ${token}`,
                            'content-type': 'application/json'
                        },
                        body: JSON.stringify({
                            type: "TIDB",
                            definition: `SELECT q.quarter_key, REPLACE(q.primary_topic, '_', ' ') AS skill_name, ROUND(AVG(q.sentiment_score) * 100, 0) AS trend_value FROM ( SELECT s.primary_topic, s.sentiment_score, CASE WHEN MONTH(s.started_at) BETWEEN 4 AND 6 THEN 'Q1' WHEN MONTH(s.started_at) BETWEEN 7 AND 9 THEN 'Q2' WHEN MONTH(s.started_at) BETWEEN 10 AND 12 THEN 'Q3' ELSE 'Q4' END AS quarter_key, CASE WHEN MONTH(s.started_at) BETWEEN 4 AND 6 THEN 1 WHEN MONTH(s.started_at) BETWEEN 7 AND 9 THEN 2 WHEN MONTH(s.started_at) BETWEEN 10 AND 12 THEN 3 ELSE 4 END AS quarter_order FROM t_69a82d5742abf6674cbcb935_t s JOIN t_69a82b4442abf6674cbcb928_t e ON e.employee_id = s.employee_id WHERE e.manager_id = '${selectedManager}' AND e.employment_status <> 'resigned' AND s.primary_topic IS NOT NULL ) q GROUP BY q.quarter_key, q.quarter_order, q.primary_topic ORDER BY q.quarter_order ASC, q.primary_topic ASC;`
                        })
                    }),
                    fetch('https://ig.gov-cloud.ai/pi-cohorts-service-dbaas/v1.0/cohorts/adhoc', {
                        method: 'POST',
                        headers: {
                            'accept': 'application/json',
                            'authorization': `Bearer ${token}`,
                            'content-type': 'application/json'
                        },
                        body: JSON.stringify({
                            type: "TIDB",
                            definition: `SELECT g.category AS focus_area, COUNT(*) AS active_count FROM t_69a8310842abf6674cbcb943_t g JOIN t_69a82b4442abf6674cbcb928_t e ON e.employee_id = g.employee_id WHERE e.manager_id = '${selectedManager}' AND e.employment_status <> 'resigned' AND g.status <> 'completed' AND g.status <> 'cancelled' GROUP BY g.category ORDER BY active_count DESC, g.category ASC LIMIT 4;`
                        })
                    })
                ]);

                let lowRiskVal = 0;
                let topicsData = [];
                let progressData = [];
                let riskData = [];
                let trendsData = [];
                let focusData = [];

                if (lowRiskRes.ok) {
                    const data = await lowRiskRes.json();
                    const stats = data?.[0] || data?.data?.[0] || data?.list?.[0] || (Array.isArray(data) ? data[0] : null);
                    if (stats) lowRiskVal = stats.low_risk_members || 0;
                }

                if (topicsRes.ok) {
                    const data = await topicsRes.json();
                    topicsData = Array.isArray(data) ? data : data?.data || data?.list || [];
                }

                if (progressRes.ok) {
                    const data = await progressRes.json();
                    progressData = Array.isArray(data) ? data : data?.data || data?.list || [];
                }

                if (riskRes.ok) {
                    const data = await riskRes.json();
                    riskData = Array.isArray(data) ? data : data?.data || data?.list || [];
                }

                if (trendsRes.ok) {
                    const data = await trendsRes.json();
                    trendsData = Array.isArray(data) ? data : data?.data || data?.list || [];
                }

                if (focusRes.ok) {
                    const data = await focusRes.json();
                    focusData = Array.isArray(data) ? data : data?.data || data?.list || [];
                }

                setAnalyticsStats({
                    low_risk_members: lowRiskVal,
                    topicImprovements: topicsData,
                    teamProgress: progressData,
                    riskDistribution: riskData,
                    skillTrends: trendsData,
                    focusAreas: focusData
                });

            } catch (err) {
                console.error("Error fetching analytics stats:", err);
            }
        };

        if (selectedManager) {
            fetchAnalyticsData();
        }
    }, [selectedManager]);

    useEffect(() => {
        const fetchManagers = async () => {
            try {
                const token = import.meta.env.VITE_ENTITIES_AUTH_TOKEN;
                const response = await fetch('https://igs.gov-cloud.ai/pi-entity-instances-service/v2.0/schemas/69a82b4442abf6674cbcb928/instances/list?size=1000', {
                    method: 'POST',
                    headers: {
                        'accept': 'application/json, text/plain, */*',
                        'authorization': `Bearer ${token}`,
                        'content-type': 'application/json'
                    },
                    body: JSON.stringify({
                        "dbType": "TIDB",
                        "distinctColumns": ["manager_id"]
                    })
                });

                if (response.ok) {
                    const responseData = await response.json();
                    let mgrList = responseData?.data || responseData?.list || (Array.isArray(responseData) ? responseData : []);

                    let formattedManagers = mgrList
                        .filter(m => m.manager_id)
                        .map(m => ({ id: m.manager_id, name: m.manager_id }));

                    const currentUserId = localStorage.getItem('user_id');
                    if (role === 'manager' && currentUserId) {
                        formattedManagers = formattedManagers.filter(m => String(m.id) === String(currentUserId));
                    }

                    setAllManagers(formattedManagers);

                    if (formattedManagers.length > 0) {
                        const current = formattedManagers.find(m => m.id === selectedManager);
                        if (current) {
                            setSelectedManagerName(current.name);
                        } else {
                            setSelectedManager(formattedManagers[0].id);
                            setSelectedManagerName(formattedManagers[0].name);
                        }
                    }
                }
            } catch (err) {
                console.error("Error fetching managers:", err);
            } finally {
                setIsInitialLoading(false);
            }
        };

        if (role === 'admin' || role === 'manager') {
            fetchManagers();
        } else {
            setIsInitialLoading(false);
        }
    }, [role]);

    const palette = [
        "#5470C6", "#91CC75", "#EE6666", "#73C0DE", "#FAC858", "#3BA272", "#FC8452", "#9A60B4", "#EA7CCC"
    ]

    useEffect(() => {
        // Clear existing instances
        chartInstances.current.forEach(c => c?.dispose())
        chartInstances.current = []

        // 1. Team Progress Chart (Horizontal Bar - Functional Legend)
        if (progressRef.current && analyticsStats.teamProgress.length > 0) {
            const chart = echarts.init(progressRef.current)
            chartInstances.current.push(chart)

            const names = analyticsStats.teamProgress.map(m => m.employee_name)
            const values = analyticsStats.teamProgress.map(m => m.progress_pct)

            // One series per person so legend can toggle each bar
            const series = names.map((name, idx) => ({
                name,
                type: 'bar',
                data: names.map((_, i) => i === idx ? values[idx] : 0),
                barWidth: '60%',
                barGap: '-100%',
                itemStyle: {
                    color: palette[idx % palette.length],
                    borderRadius: [0, 4, 4, 0]
                },
                label: {
                    show: true,
                    position: 'right',
                    fontSize: 9,
                    fontWeight: 'bold',
                    formatter: (p) => p.value ? p.value + '%' : ''
                },
                emphasis: { focus: 'series' }
            }))

            chart.setOption({
                grid: { left: 120, right: 40, top: 40, bottom: 20 }, // Increased left margin for full names
                tooltip: {
                    trigger: 'axis',
                    axisPointer: { type: 'shadow' },
                    formatter: (params) => {
                        const active = params.find(p => p.value !== 0) || params[0];
                        return `<div style="font-weight:bold">${active.axisValue}</div><div>Progress: ${active.value}%</div>`;
                    }
                },
                legend: { top: 0, type: 'scroll', icon: 'circle', itemWidth: 10, textStyle: { fontSize: 10 } },
                xAxis: { type: 'value', max: 100, splitLine: { show: false }, axisLabel: { fontSize: 9 } },
                yAxis: { type: 'category', data: names, axisLabel: { fontSize: 10, fontWeight: 'bold' } },
                series
            })
        }

        // 2. Risk Distribution Chart (Doughnut)
        if (riskRef.current && analyticsStats.riskDistribution.length > 0) {
            const chart = echarts.init(riskRef.current)
            chartInstances.current.push(chart)

            const riskColors = {
                'Low Risk': '#4CAF50',
                'Medium Risk': '#FFC107',
                'High Risk': '#F44336'
            };

            const chartData = analyticsStats.riskDistribution.map(r => ({
                name: r.risk_level,
                value: r.member_count,
                itemStyle: { color: riskColors[r.risk_level] || '#999' }
            }));

            chart.setOption({
                tooltip: {
                    trigger: 'item',
                    formatter: '{b}: <b>{c} Members</b> ({d}%)'
                },
                legend: { bottom: 0, icon: 'circle', itemWidth: 8, textStyle: { fontSize: 10 } },
                series: [{
                    type: 'pie',
                    radius: ['50%', '80%'],
                    avoidLabelOverlap: false,
                    itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
                    label: { show: false },
                    emphasis: {
                        label: {
                            show: true,
                            fontSize: 12,
                            fontWeight: 'bold',
                            formatter: '{b}\n{c} Members'
                        }
                    },
                    data: chartData
                }]
            })
        }

        // 3. Skill Trends Chart (Line)
        if (skillRef.current && analyticsStats.skillTrends.length > 0) {
            const chart = echarts.init(skillRef.current)
            chartInstances.current.push(chart)

            // Extract unique quarters (preserving order from the query)
            const quarters = [...new Set(analyticsStats.skillTrends.map(t => t.quarter_key))];

            // Extract unique skill names
            const skills = [...new Set(analyticsStats.skillTrends.map(t => t.skill_name))];

            // Define colors for skills
            const skillColors = ['#5470C6', '#91CC75', '#EE6666', '#73C0DE', '#3BA272', '#FC8452', '#9A60B4', '#EA7CCC'];

            // Map data for each skill
            const series = skills.map((skill, idx) => {
                const skillData = quarters.map(q => {
                    const match = analyticsStats.skillTrends.find(t => t.skill_name === skill && t.quarter_key === q);
                    return match ? match.trend_value : null;
                });

                return {
                    name: skill,
                    type: 'line',
                    smooth: true,
                    connectNulls: true,
                    data: skillData,
                    itemStyle: { color: skillColors[idx % skillColors.length] },
                    symbolSize: 6,
                    lineStyle: { width: 3 }
                };
            });

            chart.setOption({
                grid: { left: 40, right: 40, top: 40, bottom: 40 },
                tooltip: {
                    trigger: 'axis',
                    formatter: (params) => {
                        let res = `<div style="font-weight:bold;margin-bottom:4px;">${params[0].axisValue}</div>`;
                        params.forEach(p => {
                            if (p.value !== null) {
                                res += `<div style="display:flex;justify-content:space-between;gap:20px;">
                                    <span>${p.marker} ${p.seriesName}</span>
                                    <span style="font-weight:bold">${p.value >= 0 ? '+' : ''}${p.value}%</span>
                                </div>`;
                            }
                        });
                        return res;
                    }
                },
                legend: { top: 0, type: 'scroll', icon: 'circle', textStyle: { fontSize: 10 } },
                xAxis: {
                    type: 'category',
                    data: quarters,
                    boundaryGap: false,
                    axisLabel: { fontSize: 9 }
                },
                yAxis: {
                    type: 'value',
                    axisLabel: {
                        fontSize: 9,
                        formatter: (v) => `${v >= 0 ? '+' : ''}${v}%`
                    }
                },
                series
            })
        }

        const handleResize = () => chartInstances.current.forEach(c => c?.resize())
        window.addEventListener('resize', handleResize)
        return () => {
            window.removeEventListener('resize', handleResize)
            chartInstances.current.forEach(c => c?.dispose())
        }
    }, [manager, analyticsStats, isInitialLoading])

    if (isInitialLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <div className="w-12 h-12 border-4 border-primary-blue/20 border-t-primary-blue rounded-full animate-spin mb-4"></div>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest animate-pulse">Initializing Analytics...</p>
            </div>
        )
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl mb-1 flex items-center gap-3 text-gray-800 font-bold tracking-tight">
                        <i className="fas fa-chart-bar text-primary-blue text-xl"></i>
                        Team Analytics
                    </h1>
                    <p className="text-gray-400 text-sm font-medium tracking-wide">Data-driven insights on your team's coaching progress</p>
                </div>

                {/* Manager Toggle Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="bg-white border border-gray-100 px-4 py-2 rounded-xl text-sm font-bold text-gray-700 flex items-center gap-3 hover:border-primary-blue/30 transition-all shadow-sm group"
                    >
                        <span className="opacity-40 uppercase tracking-widest text-[10px]">Manager:</span>
                        <span className="text-primary-blue">{selectedManagerName}</span>
                        <i className={`fas fa-chevron-${isDropdownOpen ? 'up' : 'down'} text-[10px] opacity-40 group-hover:opacity-100`}></i>
                    </button>

                    {isDropdownOpen && (
                        <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-[100] max-h-[300px] flex flex-col">
                            <div className="p-2 sticky top-0 bg-white border-b border-gray-50">
                                <input
                                    type="text"
                                    placeholder="Search manager..."
                                    className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary-blue/20"
                                    onChange={(e) => {
                                        const term = e.target.value.toLowerCase()
                                        const items = document.querySelectorAll('.mgr-item')
                                        items.forEach(item => {
                                            const text = item.textContent.toLowerCase()
                                            item.style.display = text.includes(term) ? 'block' : 'none'
                                        })
                                    }}
                                />
                            </div>
                            <div className="overflow-y-auto">
                                {allManagers.map((mgr, i) => (
                                    <button
                                        key={i}
                                        className="mgr-item w-full text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 hover:bg-primary-blue/5 hover:text-primary-blue flex items-center justify-between transition-all border-b border-gray-50 last:border-0"
                                        onClick={() => {
                                            setSelectedManager(mgr.id)
                                            setSelectedManagerName(mgr.name)
                                            setIsDropdownOpen(false)
                                            localStorage.setItem('active_manager_id', mgr.id)
                                            localStorage.setItem('active_manager_name', mgr.name)
                                        }}
                                    >
                                        <span>{mgr.name}</span>
                                        <span className="text-[10px] opacity-40 font-medium whitespace-nowrap ml-4">ID: {mgr.id}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                {/* Fixed Low Risk Card */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-primary-light/30 rounded-lg flex items-center justify-center text-primary-blue text-sm flex-shrink-0">
                            <i className="fas fa-users"></i>
                        </div>
                        <div>
                            <div className="text-xl font-bold text-gray-900 leading-none mb-1">{analyticsStats.low_risk_members}</div>
                            <div className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Low Risk members</div>
                        </div>
                    </div>
                </div>

                {/* Dynamic Topic Cards */}
                {analyticsStats.topicImprovements.map((topic, i) => {
                    const iconMap = {
                        'feedback': 'comment-dots',
                        'wellbeing': 'heart',
                        'delegation': 'tasks',
                        'stakeholder_management': 'users-cog',
                        'career_clarity': 'compass',
                        'default': 'star'
                    };

                    const labelMap = {
                        'feedback': 'Feedback Imp.',
                        'wellbeing': 'Wellbeing Growth',
                        'delegation': 'Delegation Growth',
                        'stakeholder_management': 'Stakeholder Imp.',
                        'career_clarity': 'Career Clarity',
                        'default': topic.primary_topic
                    };

                    const icon = iconMap[topic.primary_topic] || iconMap.default;
                    const label = labelMap[topic.primary_topic] || topic.primary_topic.replace('_', ' ');
                    const improvement = topic.improvement_pct || 0;
                    
                    const displayValue = (
                        <div className="flex items-center gap-1">
                            <i className={`fas fa-arrow-${improvement >= 0 ? 'up text-success' : 'down text-danger'} text-xs`}></i>
                            <span className={improvement >= 0 ? 'text-gray-900' : 'text-gray-900'}>
                                {Math.abs(improvement)}%
                            </span>
                        </div>
                    );

                    return (
                        <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 bg-primary-light/30 rounded-lg flex items-center justify-center text-primary-blue text-sm flex-shrink-0">
                                    <i className={`fas fa-${icon}`}></i>
                                </div>
                                <div>
                                    <div className="text-xl font-bold leading-none mb-1">{displayValue}</div>
                                    <div className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">{label}</div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                    <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
                        <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2 uppercase tracking-wider">
                            <i className="fas fa-chart-bar text-primary-blue text-xs"></i> Team Progress
                        </h2>
                    </div>
                    <div className="p-4 h-[250px]" ref={progressRef}></div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                    <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
                        <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2 uppercase tracking-wider">
                            <i className="fas fa-chart-pie text-primary-blue text-xs"></i> Risk Distribution
                        </h2>
                    </div>
                    <div className="p-4 h-[250px]" ref={riskRef}></div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
                    <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
                        <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2 uppercase tracking-wider">
                            <i className="fas fa-chart-line text-primary-blue text-xs"></i> Skill Trends
                        </h2>
                    </div>
                    <div className="p-4 h-[250px]" ref={skillRef}></div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                    <div className="px-4 py-3 border-b border-gray-50">
                        <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2 uppercase tracking-wider">
                            <i className="fas fa-star text-primary-blue text-xs"></i> Focus Areas
                        </h2>
                    </div>
                    <div className="p-4">
                        {analyticsStats.focusAreas.length > 0 ? (
                            analyticsStats.focusAreas.map((area, index) => {
                                const label = area.focus_area.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                                const maxCount = analyticsStats.focusAreas[0]?.active_count || 1;
                                const width = (area.active_count / maxCount) * 100;

                                return (
                                    <div key={index} className="mb-4 last:mb-0">
                                        <div className="flex justify-between items-center mb-1.5">
                                            <span className="text-[11px] font-bold text-gray-700">{label}</span>
                                            <span className="text-[10px] text-gray-400 font-medium">{area.active_count} active</span>
                                        </div>
                                        <div className="w-full bg-gray-50 border border-gray-100 rounded-full h-1.5 overflow-hidden">
                                            <div
                                                className="bg-primary-blue h-full rounded-full transition-all duration-1000"
                                                style={{ width: `${width}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full py-10 opacity-30">
                                <i className="fas fa-bullseye text-2xl mb-2"></i>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-center">No Active Focus Areas</p>
                                <p className="text-[9px] font-medium mt-1">Select a manager with active goals</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
