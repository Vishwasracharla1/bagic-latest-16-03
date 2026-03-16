import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getContentIcon } from '../../utils/helpers'

export default function EmployeeContent() {
    const navigate = useNavigate()
    const [contentList, setContentList] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [allEmployees, setAllEmployees] = useState([])
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const role = localStorage.getItem('user_role')
    const initialId = localStorage.getItem('active_employee_id') || (role !== 'admin' ? localStorage.getItem('user_id') : '')
    const [activeEmployeeId, setActiveEmployeeId] = useState(initialId)
    const initialName = localStorage.getItem('active_employee_name') || localStorage.getItem('user_name') || ''
    const [selectedEmployeeName, setSelectedEmployeeName] = useState(initialName)

    useEffect(() => {
        const fetchContentFeed = async () => {
            if (!activeEmployeeId || activeEmployeeId === 'admin') return;
            setIsLoading(true);
            try {
                const apiUrl = import.meta.env.VITE_COHORTS_API_URL;
                const token = import.meta.env.VITE_COHORTS_AUTH_TOKEN;

                if (!apiUrl || !token) {
                    console.warn("API URL or Token not found");
                    return;
                }

                const headers = {
                    'accept': 'application/json',
                    'authorization': `Bearer ${token}`,
                    'content-type': 'application/json'
                };

                // 1. Fetch Recommended Content IDs from Chatbot API
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
                    
                    const response = await fetch('https://igs.gov-cloud.ai/pi-entity-instances-service/v2.0/schemas/69a81b1242abf6674cbcb8f1/instances/list?size=1000', {
                        method: 'POST',
                        headers: {
                            'accept': 'application/json, text/plain, */*',
                            'authorization': `Bearer ${token}`,
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

                    if (response.ok) {
                        const responseData = await response.json();
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
                                match_pct: 95,
                                completion_pct: 0,
                                action_label: 'START NOW'
                            }));
                            setContentList(mappedContent);
                        }
                    }
                } else {
                    // Fallback to original logic
                    const response = await fetch(apiUrl, {
                        method: 'POST',
                        headers,
                        body: JSON.stringify({
                            type: "TIDB",
                            definition: `SELECT '${activeEmployeeId}' AS employee_id, ci.content_id, ci.title, ci.content_type, ci.duration_minutes, ci.primary_topic, ci.difficulty_level, ci.skills_tags, ci.business_unit_tags, IFNULL(cu.completion_pct, 0) AS completion_pct, cu.rating, CASE WHEN IFNULL(cu.completion_pct, 0) >= 100 THEN 'COMPLETED' WHEN cu.content_id IS NOT NULL THEN 'CONTINUE' ELSE 'START NOW' END AS action_label, 92 AS match_pct FROM t_69a81b1242abf6674cbcb8f1_t ci LEFT JOIN t_69a81bfd42abf6674cbcb8fc_t cu ON cu.employee_id = '${activeEmployeeId}' AND cu.content_id = ci.content_id WHERE ci.is_active = 1 AND EXISTS ( SELECT 1 FROM t_69a8310842abf6674cbcb943_t g WHERE g.employee_id = '${activeEmployeeId}' AND g.category = ci.primary_topic ) ORDER BY CASE WHEN IFNULL(cu.completion_pct, 0) >= 100 THEN 3 WHEN cu.content_id IS NOT NULL THEN 1 ELSE 2 END, ci.duration_minutes ASC, ci.title ASC;`
                        })
                    });

                    if (response.ok) {
                        const data = await response.json();
                        if (data.data && Array.isArray(data.data)) {
                            setContentList(data.data);
                        } else {
                            setContentList([]);
                        }
                    }
                }
            } catch (error) {
                console.error("Error fetching content feed:", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (activeEmployeeId && activeEmployeeId !== 'admin') {
            fetchContentFeed();
        }
    }, [activeEmployeeId]);

    useEffect(() => {
        // Fetch employees for admin dropdown
        if (role === 'admin') {
            const fetchAllEmployees = async () => {
                try {
                    const token = import.meta.env.VITE_ENTITIES_AUTH_TOKEN;
                    const response = await fetch('https://igs.gov-cloud.ai/pi-entity-instances-service/v2.0/schemas/69a82b4442abf6674cbcb928/instances/list?size=1000', {
                        method: 'POST',
                        headers: {
                            'accept': 'application/json',
                            'authorization': `Bearer ${token}`,
                            'content-type': 'application/json'
                        },
                        body: JSON.stringify({ "dbType": "TIDB" })
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
                        
                        // Auto-select first employee if admin and none selected
                        if (employeeList.length > 0) {
                            const currentId = localStorage.getItem('active_employee_id');
                            const currentEmp = employeeList.find(e => e.employee_id === currentId) || employeeList[0];
                            
                            setActiveEmployeeId(currentEmp.employee_id);
                            setSelectedEmployeeName(`${currentEmp.first_name} ${currentEmp.last_name}`);
                        }
                    }
                } catch (err) {
                    console.error("Error fetching employees:", err);
                }
            };
            fetchAllEmployees();
        }
    }, [role]);

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl mb-1 flex items-center gap-3 text-gray-800 font-bold tracking-tight">
                        <i className="fas fa-book text-primary-blue text-xl"></i>
                        Content Feed
                    </h1>
                    <p className="text-gray-400 text-sm tracking-wide">Personalized content recommendations based on your goals</p>
                </div>

                {/* Searchable Employee Dropdown */}
                <div className="flex items-center gap-4">
                    {role === 'admin' ? (
                        <div className="relative">
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="bg-white border border-gray-100 px-3 py-1.5 rounded-lg text-[11px] font-bold text-gray-700 flex items-center gap-3 hover:border-primary-blue/30 transition-all shadow-sm group"
                            >
                                <span className="opacity-40 uppercase tracking-widest text-[9px]">Employees:</span>
                                <span className="text-primary-blue">{selectedEmployeeName || 'Select...'}</span>
                                <i className={`fas fa-chevron-${isDropdownOpen ? 'up' : 'down'} text-[9px] opacity-40 group-hover:opacity-100`}></i>
                            </button>

                            {isDropdownOpen && (
                                <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-[100] max-h-[400px] flex flex-col">
                                    <div className="p-2 sticky top-0 bg-white border-b border-gray-50">
                                        <input
                                            type="text"
                                            placeholder="Search employee..."
                                            className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary-blue/20"
                                            onClick={(e) => e.stopPropagation()}
                                            onChange={(e) => {
                                                const term = e.target.value.toLowerCase()
                                                const items = document.querySelectorAll('.emp-item-feed')
                                                items.forEach(item => {
                                                    const text = item.textContent.toLowerCase()
                                                    item.style.display = text.includes(term) ? 'flex' : 'none'
                                                })
                                            }}
                                        />
                                    </div>
                                    <div className="overflow-y-auto">
                                        {allEmployees.map((emp, i) => (
                                            <button
                                                key={`${emp.employee_id}-${i}`}
                                                className="emp-item-feed w-full text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-500 hover:bg-primary-blue/5 hover:text-primary-blue flex items-center justify-between transition-all border-b border-gray-50 last:border-0"
                                                onClick={() => {
                                                    const name = `${emp.first_name} ${emp.last_name}`
                                                    setActiveEmployeeId(emp.employee_id)
                                                    setSelectedEmployeeName(name)
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
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 bg-gray-50/50 px-3 py-1.5 rounded-lg border border-gray-50">
                            <span className="opacity-40 uppercase tracking-widest text-[9px] font-bold text-gray-700">Recommended for:</span>
                            <span className="text-[11px] font-bold text-gray-600">{selectedEmployeeName}</span>
                        </div>
                    )}
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-blue"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {contentList.length > 0 ? (
                        contentList.map((content, idx) => (
                            <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden group hover:border-primary-blue/30 transition-all duration-300 flex flex-col h-full">
                                <div className="bg-gray-50 p-4 border-b border-gray-100 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 bg-primary-blue/10 text-primary-blue rounded-lg flex items-center justify-center text-[10px]">
                                            <i className={`fas fa-${getContentIcon(content.content_type)}`}></i>
                                        </div>
                                        <span className="text-[10px] text-gray-600 uppercase tracking-widest">{content.content_type}</span>
                                    </div>
                                    <span className="bg-white text-gray-400 border border-gray-100 px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider">
                                        {Math.round(content.duration_minutes)} min
                                    </span>
                                </div>
                                <div className="p-4 flex-1 flex flex-col">
                                    <h3 className="text-sm font-bold text-gray-800 mb-2 leading-snug group-hover:text-primary-blue transition-colors line-clamp-1">{content.title}</h3>
                                    
                                    <div className="flex items-center gap-3 mb-4 mt-4">
                                        <div className="flex-1 flex items-center gap-2">
                                            <div className="flex-1 bg-gray-50 rounded-full h-1 border border-gray-100 overflow-hidden">
                                                <div
                                                    className="bg-success h-full rounded-full transition-all duration-1000"
                                                    style={{ width: `${content.match_pct}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-[10px] text-success font-bold uppercase tracking-tighter">{content.match_pct}% Match</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-1.5 mb-4">
                                        {(content.skills_tags || '').split(';').filter(Boolean).slice(0, 3).map((skill, i) => (
                                            <span key={i} className="bg-primary-blue/5 text-primary-blue text-[9px] px-2 py-0.5 rounded-md uppercase tracking-wider border border-primary-blue/5">
                                                {skill.trim()}
                                            </span>
                                        ))}
                                    </div>

                                    <div className="flex items-center justify-between text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-4 border-t border-gray-50 pt-3 mt-auto">
                                        <span><i className="fas fa-chart-pie mr-1"></i>{content.completion_pct}% Progress</span>
                                        <span><i className="fas fa-star mr-1 text-warning"></i>{content.rating || 'N/A'}</span>
                                    </div>

                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => navigate('/employee/chat')}
                                            className={`flex-1 ${content.action_label === 'COMPLETED' ? 'bg-gray-400' : 'bg-primary-blue'} text-white border-none py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer hover:opacity-90 transition-all shadow-sm`}
                                        >
                                            {content.action_label}
                                        </button>
                                        <button className="bg-gray-50 text-gray-400 border border-gray-100 px-2.5 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-gray-100 hover:text-gray-600 transition-all">
                                            <i className="fas fa-info-circle"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full text-center py-12 text-gray-400 text-xs font-medium uppercase tracking-widest bg-gray-50/50 rounded-2xl border border-dashed border-gray-100 italic">
                            No content found for your current goals
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
