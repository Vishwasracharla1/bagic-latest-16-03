import { useEffect, useRef } from 'react'
import { MOCK_DATA } from '../../data/mockData'
import * as echarts from 'echarts'

export default function EmployeeProgress() {
    const employee = MOCK_DATA.employee
    const chartRef = useRef(null)
    const chartInstance = useRef(null)

    useEffect(() => {
        if (chartRef.current) {
            if (chartInstance.current) chartInstance.current.dispose()
            chartInstance.current = echarts.init(chartRef.current)

            const option = {
                grid: { left: 40, right: 30, top: 40, bottom: 40 },
                tooltip: { trigger: 'axis', axisPointer: { type: 'line' } },
                legend: { top: 0, textStyle: { fontSize: 10 }, type: 'scroll' },
                xAxis: { type: 'category', data: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8'], boundaryGap: false, axisLabel: { fontSize: 9 } },
                yAxis: { type: 'value', max: 100, axisLabel: { fontSize: 9, formatter: '{value}%' } },
                series: employee.goals.slice(0, 3).map((goal, index) => ({
                    name: goal.title,
                    type: 'line',
                    smooth: true,
                    data: Array.from({ length: 8 }, (_, i) => Math.min(goal.progress, Math.round((goal.progress / 8) * (i + 1) + (Math.random() * 10 - 5)))),
                    itemStyle: { color: ['#5470C6', '#91CC75', '#EE6666', '#FAC858'][index % 4] },
                    lineStyle: { width: 2.5 },
                    symbol: 'circle',
                    symbolSize: 4
                }))
            }

            chartInstance.current.setOption(option)
        }

        const handleResize = () => chartInstance.current?.resize()
        window.addEventListener('resize', handleResize)
        return () => {
            window.removeEventListener('resize', handleResize)
            chartInstance.current?.dispose()
        }
    }, [employee])

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl mb-1 flex items-center gap-3 text-gray-800 font-bold tracking-tight">
                    <i className="fas fa-chart-line text-primary-blue text-xl"></i>
                    Progress Dashboard
                </h1>
                <p className="text-gray-400 text-sm tracking-wide">Track your growth journey</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 flex flex-col gap-4">
                    {/* Progress Chart */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
                            <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <i className="fas fa-chart-line text-primary-blue text-[10px]"></i> Progress Over Time
                            </h2>
                        </div>
                        <div className="p-4 h-[250px]" ref={chartRef}></div>
                    </div>

                    {/* Goal Details */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
                            <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <i className="fas fa-bullseye text-primary-blue text-[10px]"></i> Goal Progress Details
                            </h2>
                        </div>
                        <div className="p-4 space-y-4">
                            {employee.goals.map((goal) => (
                                <div key={goal.id} className="pb-4 last:pb-0 border-b border-gray-50 last:border-b-0">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-[13px] font-bold text-gray-800 tracking-tight">{goal.title}</h4>
                                        <span className={`text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider ${goal.status === 'on-track' || goal.status === 'completed' ? 'bg-success/10 text-success' :
                                            goal.status === 'at-risk' ? 'bg-danger/10 text-danger' :
                                                'bg-warning/10 text-warning'
                                            }`}>{goal.status}</span>
                                    </div>
                                    <div className="w-full bg-gray-50 border border-gray-100 rounded-full h-1.5 mb-2 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-1000 ${goal.progress >= 70 ? 'bg-success' : goal.progress >= 40 ? 'bg-warning' : 'bg-danger'
                                                }`}
                                            style={{ width: `${goal.progress}%` }}
                                        ></div>
                                    </div>
                                    <div className="flex items-center justify-between text-[10px] text-gray-400 uppercase tracking-wider">
                                        <span>{goal.progress}% complete</span>
                                        <span>Due: {new Date(goal.targetDate).toLocaleDateString()}</span>
                                    </div>

                                    {goal.milestones && (
                                        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-1.5 ml-2">
                                            {goal.milestones.map((m, i) => (
                                                <div key={i} className="flex items-center gap-2 text-[11px] p-1.5 bg-gray-50/50 rounded-lg border border-gray-100/50">
                                                    <i className={`fas fa-${m.completed ? 'check-circle text-success' : 'circle text-gray-200'} text-[10px]`}></i>
                                                    <span className={`${m.completed ? 'line-through text-gray-400' : 'text-gray-600'}`}>{m.title}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="flex flex-col gap-4">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/20 flex items-center justify-between">
                            <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <i className="fas fa-trophy text-primary-blue text-[10px]"></i> Achievements
                            </h2>
                        </div>
                        <div className="p-4 space-y-3">
                            {[
                                { icon: 'star', title: 'First Goal Set', desc: 'Journey started', date: 'Oct 01' },
                                { icon: 'comments', title: '10 Sessions', desc: 'Consistency', date: 'Nov 15' },
                                { icon: 'bullseye', title: 'Goal Mastery', desc: 'Feedback Skill', date: 'Dec 20' },
                            ].map((achievement, i) => (
                                <div key={i} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-b-0">
                                    <div className="w-8 h-8 bg-warning/10 text-warning rounded-lg flex items-center justify-center flex-shrink-0 text-sm">
                                        <i className={`fas fa-${achievement.icon}`}></i>
                                    </div>
                                    <div>
                                        <div className="font-bold text-[12px] text-gray-800 flex justify-between gap-2 overflow-hidden">
                                            <span className="truncate">{achievement.title}</span>
                                            <span className="text-[9px] text-gray-400 uppercase mt-0.5 flex-shrink-0">{achievement.date}</span>
                                        </div>
                                        <div className="text-[10px] text-gray-500 mt-0.5">{achievement.desc}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/20">
                            <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <i className="fas fa-lightbulb text-primary-blue text-[10px]"></i> Skill Map
                            </h2>
                        </div>
                        <div className="p-4 space-y-4">
                            {['Feedback', 'Delegation', 'Conflict Res.', 'EQ'].map((skill, i) => (
                                <div key={i} className="last:mb-0">
                                    <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-gray-500 mb-1.5">
                                        <span>{skill}</span>
                                        <span className="text-gray-800">{[82, 65, 45, 72][i]}%</span>
                                    </div>
                                    <div className="w-full bg-gray-50 border border-gray-100/50 rounded-full h-1.5 overflow-hidden">
                                        <div
                                            className="bg-primary-blue h-full rounded-full transition-all duration-1000"
                                            style={{ width: `${[82, 65, 45, 72][i]}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
