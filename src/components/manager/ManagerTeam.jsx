import { useState, useEffect } from 'react'
import { MOCK_DATA } from '../../data/mockData'

export default function ManagerTeam() {
    const manager = MOCK_DATA.manager
    const [allManagers, setAllManagers] = useState([])
    const [selectedManager, setSelectedManager] = useState(localStorage.getItem('active_manager_id') || localStorage.getItem('user_id') || 'BAJ00003')
    const [selectedManagerName, setSelectedManagerName] = useState(localStorage.getItem('active_manager_name') || localStorage.getItem('user_name') || 'Select Manager')
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const [teamStats, setTeamStats] = useState({
        team_members: 0,
        avg_progress: 0,
        attention_count: 0,
        total_sessions: 0
    })
    const [teamList, setTeamList] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [isInitialLoading, setIsInitialLoading] = useState(true)
    const role = localStorage.getItem('user_role')

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const token = import.meta.env.VITE_COHORTS_AUTH_TOKEN;

                // Fetch Stats
                const statsRes = await fetch('https://ig.gov-cloud.ai/pi-cohorts-service-dbaas/v1.0/cohorts/adhoc', {
                    method: 'POST',
                    headers: {
                        'accept': 'application/json',
                        'authorization': `Bearer ${token}`,
                        'content-type': 'application/json'
                    },
                    body: JSON.stringify({
                        type: "TIDB",
                        definition: `SELECT COUNT(*) AS team_members, ROUND(AVG(IFNULL(g.avg_progress_pct, 0)), 0) AS avg_progress, SUM( CASE WHEN IFNULL(s.sessions_count, 0) = 0 OR IFNULL(g.avg_progress_pct, 0) < 40 THEN 1 ELSE 0 END ) AS attention_count, SUM(IFNULL(s.sessions_count, 0)) AS total_sessions FROM t_69a82b4442abf6674cbcb928_t e LEFT JOIN ( SELECT employee_id, COUNT(*) AS goals_count, ROUND(AVG(progress_pct), 0) AS avg_progress_pct FROM t_69a8310842abf6674cbcb943_t WHERE status <> 'cancelled' GROUP BY employee_id ) g ON e.employee_id = g.employee_id LEFT JOIN ( SELECT employee_id, COUNT(*) AS sessions_count FROM t_69a82d5742abf6674cbcb935_t GROUP BY employee_id ) s ON e.employee_id = s.employee_id WHERE e.manager_id = '${selectedManager}' AND e.employment_status <> 'resigned';`
                    })
                });

                if (statsRes.ok) {
                    const data = await statsRes.json();
                    const stats = data?.[0] || data?.data?.[0] || data?.list?.[0];
                    if (stats) setTeamStats(stats);
                }

                // Fetch Team List
                const listRes = await fetch('https://ig.gov-cloud.ai/pi-cohorts-service-dbaas/v1.0/cohorts/adhoc', {
                    method: 'POST',
                    headers: {
                        'accept': 'application/json',
                        'authorization': `Bearer ${token}`,
                        'content-type': 'application/json'
                    },
                    body: JSON.stringify({
                        type: "TIDB",
                        definition: `SELECT e.employee_id, e.first_name, e.last_name, CONCAT(e.first_name, ' ', e.last_name) AS employee_name, e.role_title, IFNULL(g.goals_count, 0) AS goals_count, IFNULL(g.avg_progress_pct, 0) AS progress_pct, IFNULL(s.sessions_count, 0) AS sessions_count, CASE WHEN IFNULL(s.sessions_count, 0) = 0 AND IFNULL(g.avg_progress_pct, 0) < 40 THEN 'HIGH' WHEN IFNULL(s.sessions_count, 0) = 0 OR IFNULL(g.avg_progress_pct, 0) < 60 THEN 'MEDIUM' ELSE 'LOW' END AS attention_level, CASE WHEN IFNULL(s.sessions_count, 0) = 0 THEN 'No sessions in recent period' WHEN IFNULL(g.avg_progress_pct, 0) < 40 THEN 'Goal progress stalled' WHEN IFNULL(g.avg_progress_pct, 0) < 60 THEN 'Needs attention on goal progress' ELSE NULL END AS alert_message_1, CASE WHEN IFNULL(s.sessions_count, 0) = 0 AND IFNULL(g.avg_progress_pct, 0) < 40 THEN 'Goal progress stalled' ELSE NULL END AS alert_message_2 FROM t_69a82b4442abf6674cbcb928_t e LEFT JOIN ( SELECT employee_id, COUNT(*) AS goals_count, ROUND(AVG(progress_pct), 0) AS avg_progress_pct FROM t_69a8310842abf6674cbcb943_t WHERE status <> 'cancelled' GROUP BY employee_id ) g ON e.employee_id = g.employee_id LEFT JOIN ( SELECT employee_id, COUNT(*) AS sessions_count FROM t_69a82d5742abf6674cbcb935_t GROUP BY employee_id ) s ON e.employee_id = s.employee_id WHERE e.manager_id = '${selectedManager}' AND e.employment_status <> 'resigned' ORDER BY CASE WHEN attention_level = 'HIGH' THEN 1 WHEN attention_level = 'MEDIUM' THEN 2 ELSE 3 END, progress_pct ASC;`
                    })
                });

                if (listRes.ok) {
                    const data = await listRes.json();
                    setTeamList(Array.isArray(data) ? data : data?.data || data?.list || []);
                }

            } catch (err) {
                console.error("Error fetching manager dashboard data:", err);
            } finally {
                setIsLoading(false);
            }
        };

        if (selectedManager) fetchData();
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
                    let mgrList = [];
                    if (Array.isArray(responseData)) {
                        mgrList = responseData;
                    } else if (responseData.data && Array.isArray(responseData.data)) {
                        mgrList = responseData.data;
                    } else if (responseData.list && Array.isArray(responseData.list)) {
                        mgrList = responseData.list;
                    }

                    // Extract and format managers (filter out null/empty)
                    let formattedManagers = mgrList
                        .filter(m => m.manager_id)
                        .map(m => ({ id: m.manager_id, name: m.manager_id })); // Defaulting name to ID for now

                    // If user is a manager, they should only see themselves
                    const currentUserId = localStorage.getItem('user_id');
                    if (role === 'manager' && currentUserId) {
                        formattedManagers = formattedManagers.filter(m => String(m.id) === String(currentUserId));
                    }

                    setAllManagers(formattedManagers);

                    // Set first manager as default if nothing is selected or if using the default placeholder
                    if (formattedManagers.length > 0) {
                        const current = formattedManagers.find(m => m.id === selectedManager);
                        if (current) {
                            setSelectedManagerName(current.name);
                        } else {
                            // If current selection isn't in the list (or we haven't selected anything yet), 
                            // pick the first one from the new list
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
        }
    }, [role]);

    if (isInitialLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <div className="w-12 h-12 border-4 border-primary-blue/20 border-t-primary-blue rounded-full animate-spin mb-4"></div>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest animate-pulse">Initializing Dashboard...</p>
            </div>
        )
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl mb-1 flex items-center gap-3 text-gray-800 font-bold tracking-tight">
                        <i className="fas fa-users text-primary-blue text-xl"></i>
                        Team Overview
                    </h1>
                    <p className="text-gray-400 text-sm font-medium tracking-wide">Monitor and support your team's coaching journey</p>
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
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[
                    { icon: 'users', value: teamStats.team_members, label: 'Team Members', cls: '' },
                    { icon: 'check-circle', value: `${teamStats.avg_progress || 0}%`, label: 'Avg Progress', cls: 'border-l-4 border-l-success' },
                    { icon: 'exclamation-triangle', value: teamStats.attention_count, label: 'Attention', cls: 'border-l-4 border-l-danger' },
                    { icon: 'comments', value: teamStats.total_sessions, label: 'Sessions', cls: 'border-l-4 border-l-info' },
                ].map((stat, i) => (
                    <div key={i} className={`bg-white rounded-xl p-4 shadow-sm border border-gray-100 ${stat.cls}`}>
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-primary-light/30 rounded-lg flex items-center justify-center text-primary-blue text-sm flex-shrink-0">
                                <i className={`fas fa-${stat.icon}`}></i>
                            </div>
                            <div>
                                <div className="text-xl font-bold text-gray-900 leading-none mb-1">
                                    {isLoading ? <div className="h-5 w-8 bg-gray-100 animate-pulse rounded"></div> : stat.value}
                                </div>
                                <div className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">{stat.label}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Team Members */}
            {isLoading ? (
                <div className="flex justify-center py-12 text-gray-400 text-xs font-bold uppercase tracking-widest animate-pulse">
                    Crunching Team Data...
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {teamList.length > 0 ? (
                        teamList.map((member) => (
                            <div key={member.employee_id} className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden ${member.attention_level === 'HIGH' ? 'border-l-4 border-l-danger' :
                                member.attention_level === 'MEDIUM' ? 'border-l-4 border-l-warning' : ''
                                }`}>
                                <div className="p-4 border-b border-gray-50 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold ${member.attention_level === 'HIGH' ? 'bg-danger' :
                                            member.attention_level === 'MEDIUM' ? 'bg-warning' : 'bg-success'
                                            }`}>
                                            {member.first_name?.[0]}{member.last_name?.[0]}
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-gray-800">{member.employee_name}</h3>
                                            <p className="text-[11px] text-gray-500 font-medium">
                                                {member.role_title} <span className="opacity-40 ml-1">ID: {member.employee_id}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-tight ${member.attention_level === 'LOW' ? 'bg-success/10 text-success' :
                                        member.attention_level === 'MEDIUM' ? 'bg-warning/10 text-[#F57C00]' :
                                            'bg-danger/10 text-danger'
                                        }`}>{member.attention_level}</span>
                                </div>
                                <div className="p-4">
                                    <div className="grid grid-cols-3 gap-3 mb-3">
                                        <div className="text-center">
                                            <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Goals</div>
                                            <div className="text-sm font-bold text-gray-800">{member.goals_count}</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Progress</div>
                                            <div className="text-sm font-bold text-gray-800">{member.progress_pct}%</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Sessions</div>
                                            <div className="text-sm font-bold text-gray-800">{member.sessions_count}</div>
                                        </div>
                                    </div>

                                    <div className="w-full bg-gray-100 rounded-full h-1.5 mb-3 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${member.progress_pct >= 70 ? 'bg-success' : member.progress_pct >= 40 ? 'bg-warning' : 'bg-danger'
                                                }`}
                                            style={{ width: `${member.progress_pct}%` }}
                                        ></div>
                                    </div>

                                    {(member.alert_message_1 || member.alert_message_2) && (
                                        <div className="mb-4 space-y-1">
                                            {member.alert_message_1 && (
                                                <div className="text-[10px] text-danger flex items-center gap-1.5 bg-danger/5 p-1.5 rounded border border-danger/10 font-bold uppercase tracking-wide">
                                                    <i className="fas fa-exclamation-circle"></i>{member.alert_message_1}
                                                </div>
                                            )}
                                            {member.alert_message_2 && (
                                                <div className="text-[10px] text-danger flex items-center gap-1.5 bg-danger/5 p-1.5 rounded border border-danger/10 font-bold uppercase tracking-wide">
                                                    <i className="fas fa-exclamation-circle"></i>{member.alert_message_2}
                                                </div>
                                            )}
                                        </div>
                                    )}
{/* 
                                    <div className="flex gap-2">
                                        <button className="flex-1 bg-primary-blue/5 text-primary-blue border border-primary-blue/10 py-1.5 rounded-lg text-xs font-bold cursor-pointer hover:bg-primary-blue hover:text-white transition-all uppercase tracking-wider">
                                            View Analytics
                                        </button>
                                        <button className="flex-1 bg-gray-50 text-gray-500 border border-gray-100 py-1.5 rounded-lg text-xs font-bold cursor-pointer hover:bg-gray-100 hover:text-gray-700 transition-all uppercase tracking-wider">
                                            Prep Session
                                        </button>
                                    </div> */}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full text-center py-16 text-gray-400 text-xs font-bold uppercase tracking-widest bg-gray-50/50 rounded-2xl border border-dashed border-gray-100 italic">
                            No team members found for this manager
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
