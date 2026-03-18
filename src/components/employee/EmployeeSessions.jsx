import { useState, useEffect } from 'react'

export default function EmployeeSessions() {
    const [sessionsList, setSessionsList] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [allEmployees, setAllEmployees] = useState([])
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const initialId = localStorage.getItem('active_employee_id') || 'BAJ00004'
    const [activeEmployeeId, setActiveEmployeeId] = useState(initialId)
    const initialName = localStorage.getItem('active_employee_name') || localStorage.getItem('user_name') || ''
    const [selectedEmployeeName, setSelectedEmployeeName] = useState(initialName)
    const role = localStorage.getItem('user_role')

    useEffect(() => {
        const fetchSessions = async () => {
            setIsLoading(true);
            try {
                const token = import.meta.env.VITE_ENTITIES_AUTH_TOKEN;
                const response = await fetch('https://igs.gov-cloud.ai/pi-entity-instances-service/v2.0/schemas/69a82d5742abf6674cbcb935/instances/list?size=1000', {
                    method: 'POST',
                    headers: {
                        'accept': 'application/json, text/plain, */*',
                        'authorization': `Bearer ${token}`,
                        'content-type': 'application/json'
                    },
                    body: JSON.stringify({
                        "dbType": "TIDB",
                        "filter": {
                            "employee_id": activeEmployeeId
                        }
                    })
                });

                if (response.ok) {
                    const responseData = await response.json();
                    let list = [];
                    if (Array.isArray(responseData)) {
                        list = responseData;
                    } else if (responseData.data && Array.isArray(responseData.data)) {
                        list = responseData.data;
                    } else if (responseData.list && Array.isArray(responseData.list)) {
                        list = responseData.list;
                    }
                    setSessionsList(list);
                }
            } catch (error) {
                console.error("Error fetching sessions:", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (activeEmployeeId) {
            fetchSessions();
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
                            const currentId = localStorage.getItem('active_employee_id') || 'BAJ00004';
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

    const calculateDuration = (start, end) => {
        if (!start || !end) return 0;
        const diff = new Date(end) - new Date(start);
        return Math.round(diff / (1000 * 60));
    };

    const formatTopic = (topic) => {
        if (!topic) return 'Coaching Session';
        return topic.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl mb-1 flex items-center gap-3 text-gray-800 font-bold tracking-tight">
                        <i className="fas fa-calendar text-primary-blue text-xl"></i>
                        Session History
                    </h1>
                    <p className="text-gray-400 text-sm font-medium tracking-wide">Review your past coaching sessions</p>
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
                                                const items = document.querySelectorAll('.emp-item-sessions')
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
                                                className="emp-item-sessions w-full text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-500 hover:bg-primary-blue/5 hover:text-primary-blue flex items-center justify-between transition-all border-b border-gray-50 last:border-0"
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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {sessionsList.length > 0 ? (
                        sessionsList.map((session, idx) => (
                            <div key={session.session_id || idx} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full">
                                <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/20">
                                    <div>
                                        <h2 className="text-sm font-bold text-gray-800 tracking-tight flex items-center gap-2">
                                            <i className="fas fa-comments text-primary-blue text-xs"></i>
                                            {formatTopic(session.primary_topic)}
                                        </h2>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1 flex items-center gap-3">
                                            <span><i className="fas fa-calendar mr-1"></i>{new Date(session.started_at).toLocaleDateString()}</span>
                                            <span><i className="fas fa-clock mr-1"></i>{calculateDuration(session.started_at, session.ended_at)} min</span>
                                        </p>
                                    </div>
                                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${session.session_type === 'ai' || session.session_type === 'AI' ? 'bg-info/10 text-info border border-info/10' :
                                        'bg-success/10 text-success border border-success/10'
                                        }`}>{session.session_type}</span>
                                </div>
                                <div className="p-4 flex-1 flex flex-col">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-100/50">
                                            <span className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Framework</span>
                                            <p className="text-[11px] font-bold text-gray-700 mt-1">{session.framework_used || 'N/A'}{session.framework_stage ? ` • ${session.framework_stage}` : ''}</p>
                                        </div>
                                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-100/50">
                                            <span className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Outcome</span>
                                            <p className="text-[11px] font-bold text-gray-700 mt-1 leading-relaxed">
                                                {session.outcome_summary || 'No summary available'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-gray-50 mt-auto">
                                        <div className="flex gap-2">
                                            <button className="bg-primary-blue text-white border-none px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer hover:bg-primary-dark transition-all shadow-sm">
                                                Transcript
                                            </button>
                                            <button className="bg-white text-gray-500 border border-gray-100 px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer hover:bg-gray-50 hover:text-gray-700 transition-all">
                                                <i className="fas fa-redo mr-1 text-[9px]"></i> Continue
                                            </button>
                                        </div>
                                        <button className="text-primary-blue bg-transparent border-none text-[10px] font-bold cursor-pointer hover:underline uppercase tracking-wider">
                                            Add Reflection
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-12 text-gray-400 text-xs font-medium uppercase tracking-widest bg-gray-50/50 rounded-2xl border border-dashed border-gray-100 italic">
                            No coaching sessions found
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
