import { useState, useRef, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { MOCK_DATA } from '../../data/mockData'

/**
 * A floating chatbot component that appears in the bottom right corner.
 * Designed with premium aesthetics, glassmorphism, and smooth animations.
 */
export default function FloatingChatbot() {
    const location = useLocation()
    const [isOpen, setIsOpen] = useState(false)
    const role = localStorage.getItem('user_role')
    
    // Admin/User states
    const [employees, setEmployees] = useState([])
    const [selectedEmployee, setSelectedEmployee] = useState(localStorage.getItem('active_employee_id') || localStorage.getItem('user_id') || '')
    const [selectedEmployeeName, setSelectedEmployeeName] = useState(localStorage.getItem('active_employee_name') || 'Select Employee...')
    const [isIdDropdownOpen, setIsIdDropdownOpen] = useState(false)
    const [isLoadingEmployees, setIsLoadingEmployees] = useState(false)

    // Don't show chatbot on login page
    if (location.pathname === '/login') {
        return null
    }

    const [messages, setMessages] = useState([
        {
            sender: 'ai',
            message: "Hi! I'm your AI Coach. How can I help you today?",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
    ])
    const [input, setInput] = useState('')
    const [isTyping, setIsTyping] = useState(false)
    const chatEndRef = useRef(null)

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        if (isOpen) {
            scrollToBottom()
        }
    }, [messages, isOpen])

    useEffect(() => {
        if (role === 'admin' && isOpen) {
            fetchEmployees()
        }
    }, [role, isOpen])

    const fetchEmployees = async () => {
        if (employees.length > 0) return;
        setIsLoadingEmployees(true)
        try {
            const response = await fetch('https://igs.gov-cloud.ai/pi-entity-instances-service/v2.0/schemas/69a82b4442abf6674cbcb928/instances/list?size=1000', {
                method: 'POST',
                headers: {
                    'accept': 'application/json, text/plain, */*',
                    'authorization': `Bearer ${import.meta.env.VITE_API_AUTHORIZATION_TOKEN}`,
                    'content-type': 'application/json'
                },
                body: JSON.stringify({
                    "dbType": "TIDB",
                    "distinctColumns": ["employee_id","first_name","last_name"]
                })
            })
            const data = await response.json()
            const content = Array.isArray(data) ? data : (data?.content || [])

            if (Array.isArray(content)) {
                const uniqueEmployees = []
                const seenIds = new Set()
                content.forEach(item => {
                    if (item.employee_id && !seenIds.has(item.employee_id)) {
                        seenIds.add(item.employee_id)
                        uniqueEmployees.push(item)
                    }
                })
                setEmployees(uniqueEmployees)
            }
        } catch (error) {
            console.error("Error fetching employees", error)
        } finally {
            setIsLoadingEmployees(false)
        }
    }

    const formatMessage = (text) => {
        if (typeof text !== 'string') return text;
        
        // Regex for bold text and special IDs
        const inlineRegex = /(\*\*.*?\*\*|(?:S-|RE-|BAJ)\d+)/g;

        const parseLineContent = (content) => {
            const parts = content.split(inlineRegex);
            return parts.map((part, i) => {
                if (!part) return null;
                
                // Handle Bold
                if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={i} className="font-bold text-gray-950">{part.slice(2, -2)}</strong>;
                }
                
                // Handle IDs
                if (/^S-\d+$/.test(part)) {
                    return (
                        <span key={i} className="inline-flex items-center bg-blue-50 text-primary-blue px-2 py-0.5 rounded-lg border border-blue-100 font-bold text-[10px] mx-0.5 shadow-sm align-middle">
                            <i className="fas fa-calendar-check mr-1.5 text-[8px] opacity-70"></i>
                            {part}
                        </span>
                    );
                }
                if (/^RE-\d+$/.test(part)) {
                    return (
                        <span key={i} className="inline-flex items-center bg-green-50 text-green-600 px-2 py-0.5 rounded-lg border border-green-100 font-bold text-[10px] mx-0.5 shadow-sm align-middle">
                            <i className="fas fa-clipboard-list mr-1.5 text-[8px] opacity-70"></i>
                            {part}
                        </span>
                    );
                }
                if (/^BAJ\d+$/.test(part)) {
                    return (
                        <span key={i} className="inline-flex items-center bg-purple-50 text-purple-600 px-2 py-0.5 rounded-lg border border-purple-100 font-bold text-[10px] mx-0.5 shadow-sm align-middle">
                            <i className="fas fa-id-badge mr-1.5 text-[8px] opacity-70"></i>
                            {part}
                        </span>
                    );
                }
                
                return part;
            });
        };

        const lines = text.split('\n');
        
        return (
            <div className="space-y-2">
                {lines.map((line, idx) => {
                    const trimmedLine = line.trim();
                    if (!trimmedLine) return <div key={idx} className="h-1" />;

                    // Handle Bullet Points
                    const isBullet = trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ');
                    // Handle Numbered Lists (e.g., "1. ")
                    const isNumbered = /^\d+\.\s/.test(trimmedLine);

                    if (isBullet || isNumbered) {
                        const contentToParse = isBullet ? trimmedLine.slice(2) : trimmedLine.slice(trimmedLine.indexOf(' ') + 1);
                        const bulletIcon = isBullet ? (
                            <i className="fas fa-circle text-[6px]"></i>
                        ) : (
                            <span className="text-[10px] font-bold">{trimmedLine.split('.')[0]}.</span>
                        );

                        return (
                            <div key={idx} className="flex gap-3 pl-3 py-0.5">
                                <span className={`text-primary-blue flex-shrink-0 ${isBullet ? 'mt-2' : 'mt-0.5'}`}>
                                    {bulletIcon}
                                </span>
                                <div className="flex-1 text-gray-700 leading-relaxed text-[13px]">
                                    {parseLineContent(contentToParse)}
                                </div>
                            </div>
                        );
                    }

                    return (
                        <p key={idx} className="m-0 text-gray-700 leading-relaxed text-[13px]">
                            {parseLineContent(line)}
                        </p>
                    );
                })}
            </div>
        );
    };

    const handleSend = async () => {
        if (!input.trim()) return

        // Always fetch the freshest ID from storage to stay in sync with the platform's persona switchers
        const currentContextId = localStorage.getItem('active_employee_id') || localStorage.getItem('user_id') || selectedEmployee;

        let finalQuestion = input;
        if (currentContextId) {
            finalQuestion = `${input} of ${currentContextId}`;
        }

        const userMessage = {
            sender: 'user',
            message: input, // Display original input to user
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }

        setMessages(prev => [...prev, userMessage])
        setInput('')
        setIsTyping(true)

        try {
            const response = await fetch('https://ig.gov-cloud.ai/chatbot-ai-coach/chat', {
                method: 'POST',
                headers: {
                    'accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    "question": finalQuestion
                })
            })

            const data = await response.json()
            const aiReplyText = data?.answer || data?.reply?.replyText || (typeof data === 'string' ? data : (data.message || "I'm here to help with your coaching needs."))

            const aiResponse = {
                sender: 'ai',
                message: aiReplyText,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
            
            setTimeout(() => {
                setMessages(prev => [...prev, aiResponse])
                setIsTyping(false)
            }, 600)
        } catch (error) {
            console.error("Chatbot error:", error)
            setTimeout(() => {
                setMessages(prev => [...prev, {
                    sender: 'ai',
                    message: "I'm having a bit of trouble connecting to my knowledge base. How else can I assist?",
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }])
                setIsTyping(false)
            }, 600)
        }
    }

    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end">
            {/* Chat Window */}
            {isOpen && (
                <div className="mb-4 w-[400px] h-[620px] bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 flex flex-col overflow-hidden transition-all duration-300 ease-out transform origin-bottom-right">
                    {/* Header */}
                    <div className="p-4 bg-primary-blue text-white flex flex-col gap-3 shadow-lg relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                        <div className="flex items-center justify-between relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30 shadow-inner">
                                    <i className="fas fa-robot text-xl"></i>
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm tracking-tight">BAGIC AI Coach</h3>
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]"></span>
                                        <span className="text-[10px] font-bold text-white/80 uppercase tracking-widest text-[8px]">Active Intelligence</span>
                                    </div>
                                </div>
                            </div>
                            <button 
                                onClick={() => setIsOpen(false)}
                                className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-all"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        {/* Admin Dropdown - Only show outside of employee persona */}
                        {role === 'admin' && !location.pathname.includes('/employee') && (
                            <div className="relative z-20">
                                <button 
                                    onClick={() => setIsIdDropdownOpen(!isIdDropdownOpen)}
                                    className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-lg px-3 py-1.5 flex items-center justify-between text-[11px] font-bold hover:bg-white/20 transition-all text-white/90"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="text-white/40 uppercase tracking-widest text-[9px]">Context:</span>
                                        <span>{selectedEmployeeName}</span>
                                        {selectedEmployee && <span className="text-[9px] opacity-50">({selectedEmployee})</span>}
                                    </div>
                                    <i className={`fas fa-chevron-${isIdDropdownOpen ? 'up' : 'down'} text-[9px]`}></i>
                                </button>

                                {isIdDropdownOpen && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[300px] animate-in fade-in zoom-in-95 duration-200">
                                        <div className="p-2 sticky top-0 bg-white border-b border-gray-50">
                                            <input 
                                                type="text"
                                                placeholder="Search employee..."
                                                className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-1.5 text-xs text-gray-800 outline-none focus:ring-2 focus:ring-primary-blue/20"
                                                onClick={(e) => e.stopPropagation()}
                                                onChange={(e) => {
                                                    const term = e.target.value.toLowerCase()
                                                    const items = document.querySelectorAll('.chatbot-emp-item')
                                                    items.forEach(item => {
                                                        const text = item.textContent.toLowerCase()
                                                        item.style.display = text.includes(term) ? 'flex' : 'none'
                                                    })
                                                }}
                                            />
                                        </div>
                                        <div className="overflow-y-auto custom-scrollbar flex-1">
                                            {isLoadingEmployees ? (
                                                <div className="p-8 text-center">
                                                    <i className="fas fa-circle-notch animate-spin text-primary-blue mb-2"></i>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Loading Employees...</p>
                                                </div>
                                            ) : employees.length === 0 ? (
                                                <div className="p-8 text-center text-gray-400">
                                                    <i className="fas fa-user-slash mb-2 text-xl opacity-20"></i>
                                                    <p className="text-[10px] font-bold uppercase tracking-widest">No employees found</p>
                                                </div>
                                            ) : (
                                                employees.map((emp, i) => (
                                                    <button
                                                        key={`${emp.employee_id}-${i}`}
                                                        className="chatbot-emp-item w-full text-left px-4 py-2.5 text-[11px] font-bold text-gray-600 hover:bg-primary-blue/5 hover:text-primary-blue flex items-center justify-between transition-all border-b border-gray-50 last:border-0"
                                                        onClick={() => {
                                                            const name = `${emp.first_name} ${emp.last_name}`
                                                            setSelectedEmployee(emp.employee_id)
                                                            setSelectedEmployeeName(name)
                                                            localStorage.setItem('active_employee_id', emp.employee_id)
                                                            localStorage.setItem('active_employee_name', name)
                                                            setIsIdDropdownOpen(false)
                                                        }}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[9px]">
                                                                {emp.first_name?.[0]}{emp.last_name?.[0]}
                                                            </div>
                                                            <div>
                                                                <div className="text-gray-800">{emp.first_name} {emp.last_name}</div>
                                                                <div className="text-[9px] opacity-50 font-medium lowercase">ID: {emp.employee_id}</div>
                                                            </div>
                                                        </div>
                                                        <i className="fas fa-plus text-[8px] opacity-0 group-hover:opacity-100 transition-opacity"></i>
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 p-5 overflow-y-auto bg-gray-50/40 flex flex-col gap-5 custom-scrollbar">
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {msg.sender === 'ai' && (
                                    <div className="w-7 h-7 bg-primary-blue/10 text-primary-blue rounded-lg flex items-center justify-center mr-2 flex-shrink-0 text-[10px] border border-primary-blue/5">
                                        <i className="fas fa-robot"></i>
                                    </div>
                                )}
                                <div className={`max-w-[85%] p-3.5 rounded-2xl text-[13px] font-medium leading-relaxed shadow-sm transition-all hover:shadow-md ${
                                    msg.sender === 'user' 
                                        ? 'bg-primary-blue text-white rounded-br-none shadow-primary-blue/10' 
                                        : 'bg-white text-gray-800 border border-gray-100/50 rounded-bl-none'
                                }`}>
                                    {msg.sender === 'ai' ? formatMessage(msg.message) : msg.message}
                                    <div className={`text-[9px] mt-2 opacity-40 font-bold uppercase tracking-tighter ${msg.sender === 'user' ? 'text-right text-white' : 'text-left text-gray-500'}`}>
                                        {msg.timestamp}
                                    </div>
                                </div>
                                {msg.sender === 'user' && (
                                    <div className="w-7 h-7 bg-gray-200 text-gray-500 rounded-lg flex items-center justify-center ml-2 flex-shrink-0 text-[10px] border border-gray-300/20">
                                        <i className="fas fa-user-circle"></i>
                                    </div>
                                )}
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="w-7 h-7 bg-primary-blue/10 rounded-lg mr-2 flex-shrink-0"></div>
                                <div className="bg-white border border-gray-100 p-3.5 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 bg-primary-blue/40 rounded-full animate-bounce [animation-duration:0.6s]"></span>
                                    <span className="w-1.5 h-1.5 bg-primary-blue/40 rounded-full animate-bounce [animation-duration:0.6s] [animation-delay:0.2s]"></span>
                                    <span className="w-1.5 h-1.5 bg-primary-blue/40 rounded-full animate-bounce [animation-duration:0.6s] [animation-delay:0.4s]"></span>
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-white border-t border-gray-100">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Type your message..."
                                className="flex-1 bg-gray-50 border border-transparent rounded-xl px-4 py-2.5 text-sm outline-none focus:bg-white focus:border-primary-blue/30 focus:ring-4 focus:ring-primary-blue/5 transition-all"
                            />
                            <button 
                                onClick={handleSend}
                                className="w-10 h-10 bg-primary-blue text-white rounded-xl shadow-lg shadow-primary-blue/20 flex items-center justify-center hover:bg-primary-dark transition-all transform active:scale-95"
                            >
                                <i className="fas fa-paper-plane"></i>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 transform hover:scale-110 active:scale-90 ${
                    isOpen 
                        ? 'bg-gray-800 text-white rotate-90' 
                        : 'bg-primary-blue text-white'
                }`}
            >
                {isOpen ? (
                    <i className="fas fa-times text-xl"></i>
                ) : (
                    <div className="relative">
                        <i className="fas fa-comment-dots text-2xl"></i>
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
                    </div>
                )}
            </button>
        </div>
    )
}
