import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { MOCK_DATA } from '../../data/mockData'
import { getNudgeIcon, getContentIcon } from '../../utils/helpers'

export default function EmployeeOverview() {
    const navigate = useNavigate()
    const employee = MOCK_DATA.employee
    const [activeGoalsCount, setActiveGoalsCount] = useState(0)
    const [completedGoalsCount, setCompletedGoalsCount] = useState(0)
    const [sessionsCount, setSessionsCount] = useState(0)
    const [allEmployees, setAllEmployees] = useState([])
    const [milestonesCount, setMilestonesCount] = useState(0)
    const [milestonesInProgressCount, setMilestonesInProgressCount] = useState(0)
    const [milestoneSummaryStatus, setMilestoneSummaryStatus] = useState('N/A')
    const [overallProgress, setOverallProgress] = useState(0)
    const [activeGoals, setActiveGoals] = useState([])
    const [learningRecommendations, setLearningRecommendations] = useState([])
    const [nudges, setNudges] = useState([])
    const role = localStorage.getItem('user_role')
    const initialId = localStorage.getItem('active_employee_id') || (role !== 'admin' ? localStorage.getItem('user_id') : '')
    const [activeEmployeeId, setActiveEmployeeId] = useState(initialId)
    const initialName = localStorage.getItem('active_employee_name') || localStorage.getItem('user_name') || employee.name
    const [selectedEmployeeName, setSelectedEmployeeName] = useState(initialName)
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const currentName = localStorage.getItem('user_name') || employee.name

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!activeEmployeeId || activeEmployeeId === 'admin') return;
            try {
                const apiUrl = import.meta.env.VITE_COHORTS_API_URL;
                const token = import.meta.env.VITE_COHORTS_AUTH_TOKEN;

                if (!apiUrl || !token){
                    console.warn("Cohorts API URL or Token not found in environment variables.");
                    return;
                }

                const headers = {
                    'accept': 'application/json',
                    'authorization': `Bearer ${token}`,
                    'content-type': 'application/json'
                };

                // Fetch Goals Data (Active and Completed)
                const goalsResponse = await fetch(apiUrl, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        type: "TIDB",
                        definition: `SELECT g.employee_id, COUNT(*) AS total_goals, SUM( CASE WHEN COALESCE(LOWER(g.status), '') NOT IN ('completed', 'cancelled') THEN 1 ELSE 0 END ) AS active_goals, SUM( CASE WHEN COALESCE(LOWER(g.status), '') = 'completed' OR g.progress_pct >= 100 THEN 1 ELSE 0 END ) AS completed_goals FROM t_69a8310842abf6674cbcb943_t g WHERE g.employee_id = '${activeEmployeeId}' GROUP BY g.employee_id;`
                    })
                });

                if (goalsResponse.ok) {
                    const goalsData = await goalsResponse.json();
                    if (goalsData.data && Array.isArray(goalsData.data) && goalsData.data.length > 0) {
                        const row = goalsData.data[0];
                        setActiveGoalsCount(row.active_goals || 0);
                        setCompletedGoalsCount(row.completed_goals || 0);
                    } else {
                        setActiveGoalsCount(0);
                        setCompletedGoalsCount(0);
                    }
                }

                // Fetch Sessions Data
                const sessionsResponse = await fetch(apiUrl, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        type: "TIDB",
                        definition: `SELECT '${activeEmployeeId}' as employee_id, COUNT(*) AS sessions_this_month FROM t_69a82d5742abf6674cbcb935_t s WHERE s.employee_id = '${activeEmployeeId}' AND YEAR(s.started_at) = YEAR(CURRENT_DATE) AND MONTH(s.started_at) = MONTH(CURRENT_DATE);`
                    })
                });

                if (sessionsResponse.ok) {
                    const sessionsData = await sessionsResponse.json();
                    if (sessionsData.data && Array.isArray(sessionsData.data) && sessionsData.data.length > 0) {
                        const count = sessionsData.data[0].sessions_this_month;
                        setSessionsCount(count || 0);
                    } else {
                        setSessionsCount(0);
                    }
                }

                // Fetch Milestones Data
                const milestonesResponse = await fetch(apiUrl, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        type: "TIDB",
                        definition: `SELECT g.employee_id, COUNT(*) AS total_milestones, SUM( CASE WHEN g.progress_pct > 0 AND g.progress_pct < 100 AND COALESCE(LOWER(g.status), '') NOT IN ('completed', 'cancelled') THEN 1 ELSE 0 END ) AS milestones_in_progress, SUM( CASE WHEN g.progress_pct >= 100 OR LOWER(COALESCE(g.status, '')) = 'completed' THEN 1 ELSE 0 END ) AS milestones_completed, SUM( CASE WHEN g.progress_pct = 0 AND COALESCE(LOWER(g.status), '') NOT IN ('completed', 'cancelled') THEN 1 ELSE 0 END ) AS milestones_not_started, SUM( CASE WHEN g.due_date < CURRENT_DATE AND g.progress_pct < 100 AND COALESCE(LOWER(g.status), '') NOT IN ('completed', 'cancelled') THEN 1 ELSE 0 END ) AS milestones_at_risk, CASE WHEN SUM( CASE WHEN g.progress_pct > 0 AND g.progress_pct < 100 AND COALESCE(LOWER(g.status), '') NOT IN ('completed', 'cancelled') THEN 1 ELSE 0 END ) > 0 THEN 'IN PROGRESS' WHEN SUM( CASE WHEN g.progress_pct >= 100 OR LOWER(COALESCE(g.status, '')) = 'completed' THEN 1 ELSE 0 END ) = COUNT(*) THEN 'COMPLETED' WHEN SUM( CASE WHEN g.due_date < CURRENT_DATE AND g.progress_pct < 100 AND COALESCE(LOWER(g.status), '') NOT IN ('completed', 'cancelled') THEN 1 ELSE 0 END ) > 0 THEN 'AT RISK' ELSE 'NOT STARTED' END AS milestone_summary_status FROM t_69a8310842abf6674cbcb943_t g WHERE g.employee_id = '${activeEmployeeId}' GROUP BY g.employee_id;`
                    })
                });

                if (milestonesResponse.ok) {
                    const milestonesData = await milestonesResponse.json();
                    if (milestonesData.data && Array.isArray(milestonesData.data) && milestonesData.data.length > 0) {
                        const row = milestonesData.data[0];
                        setMilestonesCount(row.total_milestones || 0);
                        setMilestonesInProgressCount(row.milestones_in_progress || 0);
                        setMilestoneSummaryStatus(row.milestone_summary_status || 'N/A');
                    } else {
                        setMilestonesCount(0);
                        setMilestonesInProgressCount(0);
                        setMilestoneSummaryStatus('N/A');
                    }
                }

                // Fetch Overall Progress
                const progressResponse = await fetch(apiUrl, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        type: "TIDB",
                        definition: `SELECT g.employee_id, ROUND(AVG(g.progress_pct), 0) AS overall_progress_pct FROM t_69a8310842abf6674cbcb943_t g WHERE g.employee_id = '${activeEmployeeId}' GROUP BY g.employee_id;`
                    })
                });

                if (progressResponse.ok) {
                    const progressData = await progressResponse.json();
                    if (progressData.data && Array.isArray(progressData.data) && progressData.data.length > 0) {
                        const row = progressData.data[0];
                        setOverallProgress(row.overall_progress_pct || 0);
                    } else {
                        setOverallProgress(0);
                    }
                }

                // Fetch Active Goals List (from instances schema)
                const activeGoalsResponse = await fetch('https://igs.gov-cloud.ai/pi-entity-instances-service/v2.0/schemas/69a8310842abf6674cbcb943/instances/list?size=1000', {
                    method: 'POST',
                    headers: {
                        ...headers,
                        'authorization': `Bearer ${import.meta.env.VITE_ENTITIES_AUTH_TOKEN || token}`
                    },
                    body: JSON.stringify({
                        dbType: "TIDB",
                        filter: {
                            employee_id: activeEmployeeId,
                            status: "active"
                        }
                    })
                });

                if (activeGoalsResponse.ok) {
                    const activeGoalsData = await activeGoalsResponse.json();
                    let goalsList = [];
                    if (Array.isArray(activeGoalsData)) {
                        goalsList = activeGoalsData;
                    } else if (activeGoalsData.data && Array.isArray(activeGoalsData.data)) {
                        goalsList = activeGoalsData.data;
                    } else if (activeGoalsData.list && Array.isArray(activeGoalsData.list)) {
                        goalsList = activeGoalsData.list;
                    }
                    setActiveGoals(goalsList);
                }

                // Fetch Recommended Learning Content IDs from Chatbot API
                let recommendedIds = [];
                try {
                    const recommendRes = await fetch(`https://ig.gov-cloud.ai/chatbot-ai-coach/recommend-content/${activeEmployeeId}`);
                    if (recommendRes.ok) {
                        const recommendData = await recommendRes.json();
                        recommendedIds = recommendData.recommended_content || [];
                    }
                } catch (err) {
                    console.error("Error fetching recommended IDs:", err);
                }

                if (recommendedIds.length > 0) {
                    // Extract IDs from 'content_items_C-XXX' format to ['C-XXX', ...]
                    const cleanIdList = recommendedIds.map(id => id.replace('content_items_', ''));
                    
                    const learningResponse = await fetch('https://igs.gov-cloud.ai/pi-entity-instances-service/v2.0/schemas/69a81b1242abf6674cbcb8f1/instances/list?size=1000', {
                        method: 'POST',
                        headers: {
                            'accept': 'application/json, text/plain, */*',
                            'authorization': `Bearer ${token}`, // Using token from cohorts/entities as applicable
                            'content-type': 'application/json'
                        },
                        body: JSON.stringify({
                            "dbType": "TIDB",
                            "conditionalFilter": {
                                "logicalOperator": "OR",
                                "conditions": [
                                    {
                                        "field": "content_id",
                                        "operator": "IN",
                                        "value": cleanIdList
                                    }
                                ]
                            }
                        })
                    });

                    if (learningResponse.ok) {
                        const responseData = await learningResponse.json();
                        let contentItems = [];
                        if (Array.isArray(responseData)) {
                            contentItems = responseData;
                        } else if (responseData.data && Array.isArray(responseData.data)) {
                            contentItems = responseData.data;
                        } else if (responseData.content && Array.isArray(responseData.content)) {
                            contentItems = responseData.content;
                        }

                        if (contentItems.length > 0) {
                            // Map to expected UI format
                            const mappedContent = contentItems.map(item => ({
                                ...item,
                                employee_id: activeEmployeeId,
                                completion_pct: 0,
                                rating: null
                            }));
                            setLearningRecommendations(mappedContent);
                        }
                    }
                } else {
                    // Fallback to original logic if no recommendations from AI
                    const learningResponse = await fetch(apiUrl, {
                        method: 'POST',
                        headers,
                        body: JSON.stringify({
                            type: "TIDB",
                            definition: `SELECT '${activeEmployeeId}' AS employee_id, ci.content_id, ci.title, ci.content_type, ci.duration_minutes, ci.primary_topic, ci.difficulty_level, IFNULL(cu.completion_pct, 0) AS completion_pct, cu.rating FROM t_69a8310842abf6674cbcb943_t g JOIN t_69a81b1242abf6674cbcb8f1_t ci ON g.category = ci.primary_topic LEFT JOIN t_69a81bfd42abf6674cbcb8fc_t cu ON cu.employee_id = '${activeEmployeeId}' AND cu.content_id = ci.content_id WHERE g.employee_id = '${activeEmployeeId}' AND g.status <> 'completed' AND g.status <> 'cancelled' AND ci.is_active = 1 AND (cu.completion_pct IS NULL OR cu.completion_pct < 100) LIMIT 2;`
                        })
                    });

                    if (learningResponse.ok) {
                        const learningData = await learningResponse.json();
                        if (learningData.data && Array.isArray(learningData.data)) {
                            setLearningRecommendations(learningData.data);
                        } else {
                            setLearningRecommendations([]);
                        }
                    }
                }

                // Fetch Action Nudges
                const nudgesResponse = await fetch('https://ig.gov-cloud.ai/pi-cohorts-service-dbaas/v1.0/cohorts/adhoc', {
                    method: 'POST',
                    headers: {
                        ...headers,
                        'referer': 'http://localhost:5173/',
                        'origin': 'http://localhost:5173'
                    },
                    body: JSON.stringify({
                        type: "TIDB",
                        definition: `SELECT employee_id, nudge_id, title, message, created_date, ui_badge, nudge_type FROM ( SELECT n.employee_id, n.nudge_id, n.nudge_type, CASE WHEN LOWER(n.nudge_type) = 'reminder' THEN 'Prepare feedback example' WHEN LOWER(n.nudge_type) = 'celebration' THEN 'Attention Needed' ELSE 'Attention Needed' END AS title, CASE WHEN LOWER(n.nudge_type) = 'reminder' THEN CONCAT('Before ', CAST(n.due_at AS DATE), ' prepare one specific example for ', g.title) WHEN LOWER(n.nudge_type) = 'celebration' THEN CONCAT('Great progress on ', g.title, '. You are building consistency.') ELSE CONCAT('Consider taking the next step for ', g.title) END AS message, CAST(n.created_at AS DATE) AS created_date, CASE WHEN LOWER(n.nudge_type) = 'reminder' AND n.due_at IS NOT NULL AND CAST(n.due_at AS DATE) <= CURRENT_DATE THEN 'URGENT' WHEN LOWER(n.nudge_type) = 'reminder' THEN 'ATTENTION' ELSE 'INFO' END AS ui_badge, ROW_NUMBER() OVER ( PARTITION BY n.employee_id, n.goal_id, n.nudge_type ORDER BY n.created_at DESC ) AS rn FROM t_69a82c1542abf6674cbcb929_t n LEFT JOIN t_69a8310842abf6674cbcb943_t g ON n.goal_id = g.goal_id WHERE n.employee_id = '${activeEmployeeId}' AND LOWER(COALESCE(n.status, 'sent')) <> 'dismissed' ) x WHERE rn = 1 ORDER BY created_date DESC;`
                    })
                });

                if (nudgesResponse.ok) {
                    const nudgesData = await nudgesResponse.json();
                    if (nudgesData.data && Array.isArray(nudgesData.data)) {
                        setNudges(nudgesData.data);
                    } else {
                        setNudges([]);
                    }
                }
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            }
        };

        fetchDashboardData();
    }, [activeEmployeeId]);

    useEffect(() => {
        // Fetch all employees for admin switching
        if (role === 'admin') {
            const fetchAllEmployees = async () => {
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
                            dbType: "TIDB",
                            distinctColumns: ["employee_id", "first_name", "last_name"]
                        })
                    });

                    if (response.ok) {
                        const responseData = await response.json();
                        let employeeList = [];
                        if (Array.isArray(responseData)) {
                            employeeList = responseData;
                        } else if (responseData.data && Array.isArray(responseData.data)) {
                            employeeList = responseData.data;
                        } else if (responseData.list && Array.isArray(responseData.list)) {
                            employeeList = responseData.list;
                        }

                        setAllEmployees(employeeList || []);
                        
                        // Auto-select first employee if admin and list is not empty
                        if (employeeList && employeeList.length > 0) {
                            const currentId = localStorage.getItem('active_employee_id');
                            const currentEmp = employeeList.find(e => e.employee_id === currentId) || employeeList[0];
                            
                            setActiveEmployeeId(currentEmp.employee_id);
                            setSelectedEmployeeName(`${currentEmp.first_name} ${currentEmp.last_name}`);
                        }
                    }
                } catch (err) {
                    console.error("Error fetching employees for dropdown:", err);
                }
            };
            fetchAllEmployees();
        }
    }, [role]);

    return (
        <div>
            {/* Welcome */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl mb-1 flex items-center gap-3 text-gray-800 font-bold tracking-tight">
                        <i className="fas fa-home text-primary-blue text-xl"></i>
                        Welcome, {selectedEmployeeName || currentName.split(' ')[0]}!
                    </h1>
                    <p className="text-gray-400 text-sm font-medium tracking-wide">Your AI coaching journey continues</p>
                </div>

                {role === 'admin' && allEmployees.length > 0 && (
                    <div className="relative">
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="bg-white border border-gray-200 px-4 py-2 rounded-xl text-xs font-bold text-gray-700 flex items-center gap-3 hover:border-primary-blue hover:text-primary-blue transition-all shadow-sm group"
                        >
                            <span className="opacity-40 uppercase tracking-widest text-[10px]">EMPLOYEES:</span>
                            <span className="text-primary-blue">{selectedEmployeeName || 'Select Employee'}</span>
                            <i className={`fas fa-chevron-${isDropdownOpen ? 'up' : 'down'} text-[10px] opacity-40 group-hover:opacity-100`}></i>
                        </button>

                        {isDropdownOpen && (
                            <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-[100] max-h-[400px] overflow-y-auto">
                                <div className="p-2 sticky top-0 bg-white border-b border-gray-50">
                                    <input
                                        type="text"
                                        placeholder="Search employee..."
                                        className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary-blue/20"
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={(e) => {
                                            const term = e.target.value.toLowerCase()
                                            const items = document.querySelectorAll('.emp-item')
                                            items.forEach(item => {
                                                const text = item.textContent.toLowerCase()
                                                item.style.display = text.includes(term) ? 'flex' : 'none'
                                            })
                                        }}
                                    />
                                </div>
                                {allEmployees.map((emp, i) => (
                                    <button
                                        key={`${emp.employee_id}-${i}`}
                                        className="emp-item w-full text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-500 hover:bg-primary-blue/5 hover:text-primary-blue flex items-center justify-between transition-all border-b border-gray-50 last:border-0"
                                        onClick={() => {
                                            const name = `${emp.first_name} ${emp.last_name}`
                                            setSelectedEmployeeName(name)
                                            setActiveEmployeeId(emp.employee_id)
                                            localStorage.setItem('active_employee_id', emp.employee_id)
                                            localStorage.setItem('active_employee_name', name)
                                            setIsDropdownOpen(false)
                                        }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[10px] text-gray-400">
                                                {emp.first_name?.[0]}{emp.last_name?.[0]}
                                            </div>
                                            <div>
                                                <div className="text-gray-800">{emp.first_name} {emp.last_name}</div>
                                                <div className="text-[9px] opacity-60 font-medium">ID: {emp.employee_id}</div>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[
                    { icon: 'bullseye', value: `${activeGoalsCount}`, label: 'Active Goals', change: `${completedGoalsCount} completed` },
                    { icon: 'comments', value: `${sessionsCount}`, label: 'Sessions', change: 'This month', color: 'success' },
                    { icon: 'chart-line', value: `${overallProgress}%`, label: 'Avg Progress', change: 'Across all goals', color: 'info' },
                    { icon: 'star', value: `${milestonesCount}`, label: 'Milestones', change: `${milestoneSummaryStatus} (${milestonesInProgressCount})`, color: 'warning' },
                ].map((stat, i) => (
                    <div key={i} className={`bg-white rounded-xl p-4 shadow-sm border border-gray-100 ${stat.color ? `border-l-4 border-l-${stat.color}` : ''}`}>
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-primary-light/30 rounded-lg flex items-center justify-center text-primary-blue text-sm flex-shrink-0">
                                <i className={`fas fa-${stat.icon}`}></i>
                            </div>
                            <div>
                                <div className="text-xl font-bold text-gray-900 leading-none mb-1">{stat.value}</div>
                                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none mb-1.5">{stat.label}</div>
                                <div className="text-[9px] text-success font-bold uppercase tracking-tighter opacity-80">{stat.change}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Goals Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between bg-gray-50/10">
                            <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <i className="fas fa-bullseye text-primary-blue text-[10px]"></i> Active Progress
                            </h2>
                      
                        </div>
                        <div className="p-4 space-y-4">
                            {activeGoals.length > 0 ? (
                                activeGoals.map((goal, idx) => (
                                    <div key={idx} className="pb-4 border-b border-gray-50 last:border-b-0 last:pb-0">
                                        <div className="flex items-center justify-between mb-2">
                                            <div>
                                                <h4 className="text-[13px] font-bold text-gray-800 tracking-tight">{goal.title}</h4>
                                                <p className="text-[11px] text-gray-500 font-medium leading-tight mt-0.5 line-clamp-1">{goal.description}</p>
                                            </div>
                                            <span className={`text-[8px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${goal.status === 'active' || goal.status === 'on-track' ? 'bg-success/10 text-success' :
                                                goal.status === 'at-risk' ? 'bg-danger/10 text-danger' :
                                                    'bg-warning/10 text-warning'
                                                }`}>{goal.status}</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="flex-1 bg-gray-50 border border-gray-100 rounded-full h-1.5 overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${goal.progress_pct >= 70 ? 'bg-success' : goal.progress_pct >= 40 ? 'bg-warning' : 'bg-danger'
                                                        }`}
                                                    style={{ width: `${goal.progress_pct}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-[10px] font-bold text-gray-400 w-8 text-right">{goal.progress_pct}%</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-6 text-gray-400 text-xs font-medium uppercase tracking-widest bg-gray-50/50 rounded-xl border border-dashed border-gray-100 italic">
                                    No active goals found
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recommended Content Preview */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between bg-gray-50/10">
                            <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <i className="fas fa-book-open text-primary-blue text-[10px]"></i> Up Next in Learning
                            </h2>
                        </div>
                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            {learningRecommendations.length > 0 ? (
                                learningRecommendations.map((content, idx) => (
                                    <div 
                                        key={idx} 
                                        onClick={() => navigate('/employee/chat')}
                                        className="bg-gray-50/30 border border-gray-100 rounded-xl p-3 hover:border-primary-blue/30 transition-all group cursor-pointer"
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-6 h-6 bg-white border border-gray-100 rounded flex items-center justify-center text-[10px] text-primary-blue">
                                                <i className={`fas fa-${getContentIcon(content.content_type)}`}></i>
                                            </div>
                                            <span className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">{content.content_type}</span>
                                        </div>
                                        <h4 className="text-[12px] font-bold text-gray-800 mb-1 group-hover:text-primary-blue transition-colors line-clamp-1">{content.title}</h4>
                                        <div className="flex items-center justify-between mt-3">
                                            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">
                                                <i className="fas fa-clock mr-1"></i>{content.duration_minutes}m duration
                                            </span>
                                            <i className="fas fa-chevron-right text-[10px] text-gray-300 group-hover:text-primary-blue transform translate-x-0 group-hover:translate-x-1 transition-all"></i>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-full text-center py-6 text-gray-400 text-xs font-medium uppercase tracking-widest bg-gray-50/50 rounded-xl border border-dashed border-gray-100 italic">
                                    No recommendations available
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    {/* AI Coach Preview */}
                    <div className="bg-primary-blue rounded-2xl p-5 shadow-lg shadow-primary-blue/20 text-white overflow-hidden relative group">
                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-700"></div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center text-xl">
                                <i className="fas fa-robot"></i>
                            </div>
                            <div>
                                <h2 className="text-sm font-bold tracking-tight">AI Leadership Coach</h2>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-white/70">Online now</span>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 mb-5 border border-white/10">
                            <p className="text-[11px] font-medium leading-relaxed italic text-white/90">
                                "Hi {(selectedEmployeeName || currentName).split(' ')[0]}! Ready to practice that feedback scenario?"
                            </p>
                        </div>
                        <button
                            onClick={() => navigate('/employee/chat')}
                            className="bg-white text-primary-blue border-none px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider cursor-pointer w-full flex items-center justify-center gap-2 transition-all hover:bg-opacity-90 active:scale-95 shadow-sm"
                        >
                            <i className="fas fa-comments"></i> Start conversation
                        </button>
                    </div>


                    {/* Nudges */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/10">
                            <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <i className="fas fa-bell text-primary-blue text-[10px]"></i> Action Nudges
                            </h2>
                        </div>
                        <div className="p-4 space-y-3">
                            {nudges.length > 0 ? (
                                nudges.map((nudge, i) => (
                                    <div key={nudge.nudge_id || i} className={`flex items-start gap-3 p-2.5 rounded-xl border transition-all hover:bg-gray-50/50 ${nudge.ui_badge === 'URGENT' ? 'bg-danger/5 border-danger/10' : 'bg-transparent border-transparent'}`}>
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0 ${
                                            nudge.nudge_type?.toLowerCase() === 'reminder' ? 'bg-blue-100 text-blue-600' :
                                            nudge.nudge_type?.toLowerCase() === 'celebration' ? 'bg-amber-100 text-amber-600' :
                                            'bg-emerald-100 text-emerald-600'
                                        }`}>
                                            <i className={`fas fa-${
                                                nudge.nudge_type?.toLowerCase() === 'reminder' ? 'bolt' :
                                                nudge.nudge_type?.toLowerCase() === 'celebration' ? 'trophy' :
                                                'lightbulb'
                                            } text-xs`}></i>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <div className="text-[11px] font-bold text-gray-800 leading-tight">{nudge.title || 'Attention Needed'}</div>
                                                {nudge.ui_badge === 'URGENT' && <span className="text-[7px] bg-danger text-white px-1 rounded uppercase font-bold">Urgent</span>}
                                            </div>
                                            <div className="text-[10px] text-gray-500 font-medium mt-0.5 leading-tight">{nudge.message}</div>
                                            <div className="text-[8px] text-gray-400 font-bold uppercase tracking-tighter mt-1.5">{nudge.created_date}</div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-6 text-gray-400 text-xs font-medium uppercase tracking-widest bg-gray-50/50 rounded-xl border border-dashed border-gray-100 italic">
                                    No active nudges
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
