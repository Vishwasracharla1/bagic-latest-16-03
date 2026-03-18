import { useState, useEffect, useRef } from 'react'
import { MOCK_DATA } from '../../data/mockData'
import * as echarts from 'echarts'

export default function EmployeeProgress() {
    const employee = MOCK_DATA.employee
    const chartRef = useRef(null)
    const chartInstance = useRef(null)
    const sessionChartRef = useRef(null)
    const sessionChartInstance = useRef(null)
    const topicChartRef = useRef(null)
    const topicChartInstance = useRef(null)
    const [chartData, setChartData] = useState({ categories: [], series: [] })
    const [sessionsData, setSessionsData] = useState({ dates: [], counts: [] })
    const [topicsData, setTopicsData] = useState({ topics: [], counts: [] })
    const [goals, setGoals] = useState([])
    const [achievements, setAchievements] = useState([])
    const [skills, setSkills] = useState([])
    const [allEmployees, setAllEmployees] = useState([])
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const initialId = localStorage.getItem('active_employee_id') || localStorage.getItem('user_id') || 'BAJ00081'
    const [activeEmployeeId, setActiveEmployeeId] = useState(initialId)
    const initialName = localStorage.getItem('active_employee_name') || localStorage.getItem('user_name') || 'Employee'
    const [selectedEmployeeName, setSelectedEmployeeName] = useState(initialName)
    const role = localStorage.getItem('user_role')

    useEffect(() => {
        const fetchProgressData = async () => {
            try {
                const token = import.meta.env.VITE_COHORTS_AUTH_TOKEN;
                if (!token) return;

                const response = await fetch('https://ig.gov-cloud.ai/pi-cohorts-service-dbaas/v1.0/cohorts/adhoc', {
                    method: 'POST',
                    headers: {
                        'accept': 'application/json',
                        'authorization': 'Bearer eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICI3Ny1NUVdFRTNHZE5adGlsWU5IYmpsa2dVSkpaWUJWVmN1UmFZdHl5ejFjIn0.eyJleHAiOjE3NDcyNTA5ODgsImlhdCI6MTcyNjE0NjMzMSwianRpIjoiOGVlZTU1MDctNGVlOC00NjE1LTg3OWUtNTVkMjViMjQ2MGFmIiwiaXNzIjoiaHR0cDovL2tleWNsb2FrLmtleWNsb2FrLnN2Yy5jbHVzdGVyLmxvY2FsOjgwODAvcmVhbG1zL21hc3RlciIsImF1ZCI6ImFjY291bnQiLCJzdWIiOiJmNzFmMzU5My1hNjdhLTQwYmMtYTExYS05YTQ0NjY4YjQxMGQiLCJ0eXAiOiJCZWFyZXIiLCJhenAiOiJIT0xBQ1JBQ1kiLCJzZXNzaW9uX3N0YXRlIjoiYmI1ZjJkMzktYTQ3ZC00MjI0LWFjZGMtZTdmNzQwNDc2OTgwIiwibmFtZSI6ImtzYW14cCBrc2FteHAiLCJnaXZlbl9uYW1lIjoia3NhbXhwIiwiZmFtaWx5X25hbWUiOiJrc2FteHAiLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJwYXNzd29yZF90ZW5hbnRfa3NhbXhwQG1vYml1c2R0YWFzLmFpIiwiZW1haWwiOiJwYXNzd29yZF90ZW5hbnRfa3NhbXhwQG1vYml1c2R0YWFzLmFpIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImFjciI6IjEiLCJhbGxvd2VkLW9yaWdpbnMiOlsiLyoiXSwicmVhbG1fYWNjZXNzIjp7InJvbGVzIjpbImRlZmF1bHQtcm9sZXMtbWFzdGVyIiwib2ZmbGluZV9hY2Nlc3MiLCJ1bWFfYXV0aG9yaXphdGlvbiJdfSwicmVzb3VyY2VfYWNjZXNzIjp7IkhPTEFDUkFDWSI6eyJyb2xlcyI6WyJIT0xBQ1JBQ1lfVVNFUiJdfSwiYWNjb3VudCI6eyJyb2xlcyI6WyJtYW5hZ2UtYWNjb3VudCIsIm1hbmFnZS1hY2NvdW50LWxpbmtzIiwidmlldy1wcm9maWxlIl19fSwic2NvcGUiOiJwcm9maWxlIGVtYWlsIiwic2lkIjoiYmI1ZjJkMzktYTQ3ZC00MjI0LWFjZGMtZTdmNzQwNDc2OTgwIiwidGVuYW50SWQiOiJmNzFmMzU5My1hNjdhLTQwYmMtYTExYS05YTQ0NjY4YjQxMGQiLCJyZXF1ZXN0ZXJUeXBlIjoiVEVOQU5UIn0=.FXeDyHBhlG9L4_NCeSyHEaNEBVmhFpfSBqlcbhHaPaoydhKcA0BfuyHgxg_32kQk6z5S9IQ7nVKS2ybtOvwo0WyLWwLQchSq7Noa7LooHIMzmeWMQb_bLKtbaOti59zwIdS8CkfGaXut7RUQKISQVWmbUGsVJQa2JkG6Ng_QN0y5hFVksMWPZiXVsofQkJXHXV1CQ3gabhhHKo3BqlJwzpsCKLDfg1-4PmSl1Wqbw03Ef2yolroj5i8FoeHukOQPkwCUHrrNw-ilIp917nqZa89YbCMtDjWyaj8pEH7GJR5vMZPE2WcJPn5dSA1IHVunfatEB1cDAitaFjVNWNnddQ',
                        'content-type': 'application/json',
                        'origin': 'http://localhost:5173',
                        'referer': 'http://localhost:5173/'
                    },
                    body: JSON.stringify({
                        type: "TIDB",
                        definition: `WITH RECURSIVE employee_goals AS (SELECT g.goal_id, g.employee_id, g.title, g.category, g.progress_pct, DATE(g.created_at) AS goal_created_date, DATE(g.due_date) AS due_date FROM t_69a8310842abf6674cbcb943_t g WHERE g.employee_id = '${activeEmployeeId}'), goal_sessions AS (SELECT s.employee_id, s.primary_goal_id AS goal_id, DATE(s.started_at) AS session_date FROM t_69a82d5742abf6674cbcb935_t s WHERE s.employee_id = '${activeEmployeeId}' AND s.primary_goal_id IS NOT NULL), weekly_sessions AS (SELECT gs.goal_id, DATE_SUB(gs.session_date, INTERVAL WEEKDAY(gs.session_date) DAY) AS week_start, COUNT(*) AS sessions_in_week FROM goal_sessions gs GROUP BY gs.goal_id, DATE_SUB(gs.session_date, INTERVAL WEEKDAY(gs.session_date) DAY)), goal_ranges AS (SELECT eg.goal_id, eg.title, eg.progress_pct, COALESCE(MIN(ws.week_start), DATE_SUB(eg.goal_created_date, INTERVAL WEEKDAY(eg.goal_created_date) DAY)) AS start_week, DATE_SUB(CURRENT_DATE, INTERVAL WEEKDAY(CURRENT_DATE) DAY) AS end_week FROM employee_goals eg LEFT JOIN weekly_sessions ws ON eg.goal_id = ws.goal_id GROUP BY eg.goal_id, eg.title, eg.progress_pct, eg.goal_created_date), week_series AS (SELECT gr.goal_id, gr.title, gr.progress_pct, gr.start_week AS week_start, gr.end_week FROM goal_ranges gr UNION ALL SELECT ws.goal_id, ws.title, ws.progress_pct, DATE_ADD(ws.week_start, INTERVAL 7 DAY) AS week_start, ws.end_week FROM week_series ws WHERE DATE_ADD(ws.week_start, INTERVAL 7 DAY) <= ws.end_week), goal_week_grid AS (SELECT ws.goal_id, ws.title, ws.progress_pct, ws.week_start, COALESCE(wk.sessions_in_week, 0) AS sessions_in_week FROM week_series ws LEFT JOIN weekly_sessions wk ON ws.goal_id = wk.goal_id AND ws.week_start = wk.week_start), cumulative_base AS (SELECT gwg.goal_id, gwg.title, gwg.week_start, gwg.progress_pct, gwg.sessions_in_week, SUM(gwg.sessions_in_week) OVER (PARTITION BY gwg.goal_id ORDER BY gwg.week_start ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS cumulative_sessions FROM goal_week_grid gwg), goal_totals AS (SELECT goal_id, MAX(cumulative_sessions) AS total_sessions FROM cumulative_base GROUP BY goal_id) SELECT cb.goal_id, cb.title, cb.week_start, ROUND(CASE WHEN gt.total_sessions IS NULL OR gt.total_sessions = 0 THEN 0 ELSE LEAST(cb.progress_pct, (cb.cumulative_sessions * 100.0 / gt.total_sessions) * (cb.progress_pct / 100.0)) END, 2) AS chart_progress_pct FROM cumulative_base cb LEFT JOIN goal_totals gt ON cb.goal_id = gt.goal_id ORDER BY cb.goal_id, cb.week_start;`
                    })
                });

                if (response.ok) {
                    const responseData = await response.json();
                    const data = responseData.data || [];

                    if (data.length > 0) {
                        // Extract unique weeks and sort them
                        const uniqueWeeks = [...new Set(data.map(item => item.week_start))].sort();

                        // Group by title
                        const groupedByTitle = data.reduce((acc, item) => {
                            if (!acc[item.title]) acc[item.title] = {};
                            acc[item.title][item.week_start] = item.chart_progress_pct;
                            return acc;
                        }, {});

                        // Format for ECharts
                        const series = Object.keys(groupedByTitle).map((title, index) => {
                            const color = ['#5470C6', '#91CC75', '#EE6666', '#FAC858', '#73c0de', '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc'][index % 9];
                            return {
                                name: title,
                                type: 'line',
                                smooth: 0.5, // Increased smoothness for a "not sharp" look
                                showSymbol: false, // Cleaner, smoother appearance
                                triggerLineEvent: true,
                                data: uniqueWeeks.map(week => groupedByTitle[title][week] || 0),
                                itemStyle: { color },
                                lineStyle: {
                                    width: 3.5,
                                    cap: 'round',
                                    join: 'round',
                                    shadowBlur: 10,
                                    shadowColor: 'rgba(0,0,0,0.05)',
                                    shadowOffsetY: 5
                                },
                                areaStyle: {
                                    opacity: 0.4, // Increased for a clear Area Graph look
                                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                                        { offset: 0, color: color },
                                        { offset: 1, color: 'rgba(255, 255, 255, 0)' }
                                    ])
                                }
                            };
                        });

                        setChartData({
                            categories: uniqueWeeks.map(w => {
                                const d = new Date(w);
                                return `W${Math.floor(d.getDate() / 7) + 1} ${d.toLocaleDateString('en-US', { month: 'short' })}`;
                            }),
                            series
                        });
                    }
                }
            } catch (error) {
                console.error("Error fetching progress data:", error);
            }
        };

        const fetchGoalsDetails = async () => {
            try {
                const token = import.meta.env.VITE_COHORTS_AUTH_TOKEN;
                if (!token) return;

                const response = await fetch('https://ig.gov-cloud.ai/pi-cohorts-service-dbaas/v1.0/cohorts/adhoc', {
                    method: 'POST',
                    headers: {
                        'accept': 'application/json',
                        'authorization': `Bearer ${token}`,
                        'content-type': 'application/json',
                        'origin': 'http://localhost:5173',
                        'referer': 'http://localhost:5173/'
                    },
                    body: JSON.stringify({
                        type: "TIDB",
                        definition: `SELECT g.goal_id, g.title, g.description, g.category, g.primary_framework, g.progress_pct, g.status, CAST(g.created_at AS DATE) AS created_date, CAST(g.due_date AS DATE) AS due_date, p.program_name, p.status AS program_status FROM t_69a8310842abf6674cbcb943_t g LEFT JOIN t_69a833d242abf6674cbcb945_t p ON g.program_id = p.program_id WHERE g.employee_id = '${activeEmployeeId}' ORDER BY CASE WHEN LOWER(g.status) = 'active' THEN 1 WHEN LOWER(g.status) = 'completed' THEN 2 ELSE 3 END, g.created_at DESC;`
                    })
                });

                if (response.ok) {
                    const responseData = await response.json();
                    setGoals(responseData.data || []);
                }
            } catch (error) {
                console.error("Error fetching goals details:", error);
            }
        };

        const fetchActionItems = async () => {
            try {
                const token = import.meta.env.VITE_COHORTS_AUTH_TOKEN;
                if (!token) return;

                const response = await fetch('https://ig.gov-cloud.ai/pi-cohorts-service-dbaas/v1.0/cohorts/adhoc', {
                    method: 'POST',
                    headers: {
                        'accept': 'application/json',
                        'authorization': `Bearer ${token}`,
                        'content-type': 'application/json',
                        'origin': 'http://localhost:5173',
                        'referer': 'http://localhost:5173/'
                    },
                    body: JSON.stringify({
                        type: "TIDB",
                        definition: `SELECT g.goal_id, g.title AS goal_title, ci.content_id, ci.title AS action_item, ci.content_type, ci.primary_topic, COALESCE(cu.completion_pct, 0) AS completion_pct, CASE WHEN COALESCE(cu.completion_pct, 0) >= 100 THEN 'completed' WHEN COALESCE(cu.completion_pct, 0) > 0 THEN 'in_progress' ELSE 'not_started' END AS action_status FROM t_69a8310842abf6674cbcb943_t g LEFT JOIN t_69a81b1242abf6674cbcb8f1_t ci ON LOWER(ci.primary_topic) = LOWER(g.category) AND ci.is_active = 1 LEFT JOIN t_69a81bfd42abf6674cbcb8fc_t cu ON ci.content_id = cu.content_id AND cu.employee_id = g.employee_id WHERE g.employee_id = '${activeEmployeeId}' ORDER BY g.title, action_status, ci.title;`
                    })
                });

                if (response.ok) {
                    const responseData = await response.json();
                    const actionData = responseData.data || [];

                    const grouped = actionData.reduce((acc, item) => {
                        if (!acc[item.goal_id]) acc[item.goal_id] = [];
                        if (item.action_item) {
                            acc[item.goal_id].push({
                                title: item.action_item,
                                type: item.content_type,
                                status: item.action_status,
                                progress: item.completion_pct
                            });
                        }
                        return acc;
                    }, {});

                    setGoals(prev => prev.map(g => ({
                        ...g,
                        milestones: grouped[g.goal_id] || []
                    })));
                }
            } catch (error) {
                console.error("Error fetching action items:", error);
            }
        };

        const fetchAchievements = async () => {
            try {
                const token = import.meta.env.VITE_COHORTS_AUTH_TOKEN;
                if (!token) return;

                const response = await fetch('https://ig.gov-cloud.ai/pi-cohorts-service-dbaas/v1.0/cohorts/adhoc', {
                    method: 'POST',
                    headers: {
                        'accept': 'application/json',
                        'authorization': `Bearer ${token}`,
                        'content-type': 'application/json',
                        'origin': 'http://localhost:5173',
                        'referer': 'http://localhost:5173/'
                    },
                    body: JSON.stringify({
                        type: "TIDB",
                        definition: `WITH first_goal AS ( SELECT employee_id, MIN(CAST(created_at AS DATE)) AS achievement_date FROM t_69a8310842abf6674cbcb943_t WHERE employee_id = '${activeEmployeeId}' GROUP BY employee_id ), session_counts AS ( SELECT employee_id, COUNT(*) AS total_sessions, MAX(CAST(started_at AS DATE)) AS achievement_date FROM t_69a82d5742abf6674cbcb935_t WHERE employee_id = '${activeEmployeeId}' GROUP BY employee_id ), completed_goals AS ( SELECT employee_id, COUNT(*) AS completed_goal_count, MAX(CAST(due_date AS DATE)) AS achievement_date FROM t_69a8310842abf6674cbcb943_t WHERE employee_id = '${activeEmployeeId}' AND LOWER(status) = 'completed' GROUP BY employee_id ), mastery_content AS ( SELECT cu.employee_id, COUNT(*) AS mastered_content_count, MAX(CAST(cu.last_viewed_at AS DATE)) AS achievement_date FROM t_69a81bfd42abf6674cbcb8fc_t cu WHERE cu.employee_id = '${activeEmployeeId}' AND COALESCE(cu.completion_pct, 0) >= 90 GROUP BY cu.employee_id ) SELECT * FROM ( SELECT 'First Goal Set' AS achievement_title, 'Journey started' AS achievement_subtitle, fg.achievement_date FROM first_goal fg UNION ALL SELECT '10 Sessions' AS achievement_title, 'Consistency' AS achievement_subtitle, sc.achievement_date FROM session_counts sc WHERE sc.total_sessions >= 10 UNION ALL SELECT 'Goal Mastery' AS achievement_title, 'Completed goals' AS achievement_subtitle, cg.achievement_date FROM completed_goals cg WHERE cg.completed_goal_count >= 1 UNION ALL SELECT 'Learning Mastery' AS achievement_title, 'High content completion' AS achievement_subtitle, mc.achievement_date FROM mastery_content mc WHERE mc.mastered_content_count >= 3 ) a ORDER BY achievement_date LIMIT 4;`
                    })
                });

                if (response.ok) {
                    const responseData = await response.json();
                    setAchievements(responseData.data || []);
                }
            } catch (error) {
                console.error("Error fetching achievements:", error);
            }
        };

        const fetchSkillMap = async () => {
            try {
                const token = import.meta.env.VITE_COHORTS_AUTH_TOKEN;
                if (!token) return;

                const response = await fetch('https://ig.gov-cloud.ai/pi-cohorts-service-dbaas/v1.0/cohorts/adhoc', {
                    method: 'POST',
                    headers: {
                        'accept': 'application/json',
                        'authorization': `Bearer ${token}`,
                        'content-type': 'application/json',
                        'origin': 'http://localhost:5173',
                        'referer': 'http://localhost:5173/'
                    },
                    body: JSON.stringify({
                        type: "TIDB",
                        definition: `WITH goal_skill_scores AS ( SELECT g.employee_id, CASE WHEN LOWER(g.category) LIKE '%feedback%' THEN 'FEEDBACK' WHEN LOWER(g.category) LIKE '%delegation%' THEN 'DELEGATION' WHEN LOWER(g.category) LIKE '%conflict%' THEN 'CONFLICT RES.' WHEN LOWER(g.category) LIKE '%emotional%' THEN 'EQ' ELSE UPPER(g.category) END AS skill_name, AVG(g.progress_pct) AS skill_score FROM t_69a8310842abf6674cbcb943_t g WHERE g.employee_id = '${activeEmployeeId}' GROUP BY g.employee_id, CASE WHEN LOWER(g.category) LIKE '%feedback%' THEN 'FEEDBACK' WHEN LOWER(g.category) LIKE '%delegation%' THEN 'DELEGATION' WHEN LOWER(g.category) LIKE '%conflict%' THEN 'CONFLICT RES.' WHEN LOWER(g.category) LIKE '%emotional%' THEN 'EQ' ELSE UPPER(g.category) END ), content_skill_scores AS ( SELECT cu.employee_id, CASE WHEN LOWER(ci.primary_topic) LIKE '%feedback%' THEN 'FEEDBACK' WHEN LOWER(ci.primary_topic) LIKE '%delegation%' THEN 'DELEGATION' WHEN LOWER(ci.primary_topic) LIKE '%conflict%' THEN 'CONFLICT RES.' WHEN LOWER(ci.skills_tags) LIKE '%emotional%' THEN 'EQ' ELSE UPPER(ci.primary_topic) END AS skill_name, AVG(COALESCE(cu.completion_pct, 0)) AS skill_score FROM t_69a81bfd42abf6674cbcb8fc_t cu JOIN t_69a81b1242abf6674cbcb8f1_t ci ON cu.content_id = ci.content_id WHERE cu.employee_id = '${activeEmployeeId}' GROUP BY cu.employee_id, CASE WHEN LOWER(ci.primary_topic) LIKE '%feedback%' THEN 'FEEDBACK' WHEN LOWER(ci.primary_topic) LIKE '%delegation%' THEN 'DELEGATION' WHEN LOWER(ci.primary_topic) LIKE '%conflict%' THEN 'CONFLICT RES.' WHEN LOWER(ci.skills_tags) LIKE '%emotional%' THEN 'EQ' ELSE UPPER(ci.primary_topic) END ), combined AS ( SELECT employee_id, skill_name, skill_score FROM goal_skill_scores UNION ALL SELECT employee_id, skill_name, skill_score FROM content_skill_scores ) SELECT skill_name, ROUND(AVG(skill_score), 0) AS skill_pct FROM combined GROUP BY skill_name ORDER BY skill_pct DESC;`
                    })
                });

                if (response.ok) {
                    const responseData = await response.json();
                    setSkills(responseData.data || []);
                }
            } catch (error) {
                console.error("Error fetching skill map:", error);
            }
        };

        const fetchSessionsData = async () => {
            try {
                const response = await fetch('https://ig.gov-cloud.ai/pi-cohorts-service-dbaas/v1.0/cohorts/adhoc', {
                    method: 'POST',
                    headers: {
                        'accept': 'application/json',
                        'authorization': 'Bearer eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICI3Ny1NUVdFRTNHZE5adGlsWU5IYmpsa2dVSkpaWUJWVmN1UmFZdHl5ejFjIn0.eyJleHAiOjE3NDcyNTA5ODgsImlhdCI6MTcyNjE0NjMzMSwianRpIjoiOGVlZTU1MDctNGVlOC00NjE1LTg3OWUtNTVkMjViMjQ2MGFmIiwiaXNzIjoiaHR0cDovL2tleWNsb2FrLmtleWNsb2FrLnN2Yy5jbHVzdGVyLmxvY2FsOjgwODAvcmVhbG1zL21hc3RlciIsImF1ZCI6ImFjY291bnQiLCJzdWIiOiJmNzFmMzU5My1hNjdhLTQwYmMtYTExYS05YTQ0NjY4YjQxMGQiLCJ0eXAiOiJCZWFyZXIiLCJhenAiOiJIT0xBQ1JBQ1kiLCJzZXNzaW9uX3N0YXRlIjoiYmI1ZjJkMzktYTQ3ZC00MjI0LWFjZGMtZTdmNzQwNDc2OTgwIiwibmFtZSI6ImtzYW14cCBrc2FteHAiLCJnaXZlbl9uYW1lIjoia3NhbXhwIiwiZmFtaWx5X25hbWUiOiJrc2FteHAiLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJwYXNzd29yZF90ZW5hbnRfa3NhbXhwQG1vYml1c2R0YWFzLmFpIiwiZW1haWwiOiJwYXNzd29yZF90ZW5hbnRfa3NhbXhwQG1vYml1c2R0YWFzLmFpIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImFjciI6IjEiLCJhbGxvd2VkLW9yaWdpbnMiOlsiLyoiXSwicmVhbG1fYWNjZXNzIjp7InJvbGVzIjpbImRlZmF1bHQtcm9sZXMtbWFzdGVyIiwib2ZmbGluZV9hY2Nlc3MiLCJ1bWFfYXV0aG9yaXphdGlvbiJdfSwicmVzb3VyY2VfYWNjZXNzIjp7IkhPTEFDUkFDWSI6eyJyb2xlcyI6WyJIT0xBQ1JBQ1lfVVNFUiJdfSwiYWNjb3VudCI6eyJyb2xlcyI6WyJtYW5hZ2UtYWNjb3VudCIsIm1hbmFnZS1hY2NvdW50LWxpbmtzIiwidmlldy1wcm9maWxlIl19fSwic2NvcGUiOiJwcm9maWxlIGVtYWlsIiwic2lkIjoiYmI1ZjJkMzktYTQ3ZC00MjI0LWFjZGMtZTdmNzQwNDc2OTgwIiwidGVuYW50SWQiOiJmNzFmMzU5My1hNjdhLTQwYmMtYTExYS05YTQ0NjY4YjQxMGQiLCJyZXF1ZXN0ZXJUeXBlIjoiVEVOQU5UIn0=.FXeDyHBhlG9L4_NCeSyHEaNEBVmhFpfSBqlcbhHaPaoydhKcA0BfuyHgxg_32kQk6z5S9IQ7nVKS2ybtOvwo0WyLWwLQchSq7Noa7LooHIMzmeWMQb_bLKtbaOti59zwIdS8CkfGaXut7RUQKISQVWmbUGsVJQa2JkG6Ng_QN0y5hFVksMWPZiXVsofQkJXHXV1CQ3gabhhHKo3BqlJwzpsCKLDfg1-4PmSl1Wqbw03Ef2yolroj5i8FoeHukOQPkwCUHrrNw-ilIp917nqZa89YbCMtDjWyaj8pEH7GJR5vMZPE2WcJPn5dSA1IHVunfatEB1cDAitaFjVNWNnddQ',
                        'content-type': 'application/json'
                    },
                    body: JSON.stringify({
                        type: "TIDB",
                        definition: `SELECT DATE(s.started_at) AS session_date, COUNT(*) OVER (ORDER BY DATE(s.started_at)) AS cumulative_sessions FROM t_69a82d5742abf6674cbcb935_t s WHERE s.employee_id='${activeEmployeeId}' ORDER BY session_date;`
                    })
                });

                if (response.ok) {
                    const result = await response.json();
                    const data = result.data || [];
                    setSessionsData({
                        dates: data.map(item => new Date(item.session_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
                        counts: data.map(item => item.cumulative_sessions)
                    });
                }
            } catch (error) {
                console.error("Error fetching sessions cumulative data:", error);
            }
        };

        const fetchTopicsData = async () => {
            try {
                const response = await fetch('https://ig.gov-cloud.ai/pi-cohorts-service-dbaas/v1.0/cohorts/adhoc', {
                    method: 'POST',
                    headers: {
                        'accept': 'application/json',
                        'authorization': 'Bearer eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICI3Ny1NUVdFRTNHZE5adGlsWU5IYmpsa2dVSkpaWUJWVmN1UmFZdHl5ejFjIn0.eyJleHAiOjE3NDcyNTA5ODgsImlhdCI6MTcyNjE0NjMzMSwianRpIjoiOGVlZTU1MDctNGVlOC00NjE1LTg3OWUtNTVkMjViMjQ2MGFmIiwiaXNzIjoiaHR0cDovL2tleWNsb2FrLmtleWNsb2FrLnN2Yy5jbHVzdGVyLmxvY2FsOjgwODAvcmVhbG1zL21hc3RlciIsImF1ZCI6ImFjY291bnQiLCJzdWIiOiJmNzFmMzU5My1hNjdhLTQwYmMtYTExYS05YTQ0NjY4YjQxMGQiLCJ0eXAiOiJCZWFyZXIiLCJhenAiOiJIT0xBQ1JBQ1kiLCJzZXNzaW9uX3N0YXRlIjoiYmI1ZjJkMzktYTQ3ZC00MjI0LWFjZGMtZTdmNzQwNDc2OTgwIiwibmFtZSI6ImtzYW14cCBrc2FteHAiLCJnaXZlbl9uYW1lIjoia3NhbXhwIiwiZmFtaWx5X25hbWUiOiJrc2FteHAiLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJwYXNzd29yZF90ZW5hbnRfa3NhbXhwQG1vYml1c2R0YWFzLmFpIiwiZW1haWwiOiJwYXNzd29yZF90ZW5hbnRfa3NhbXhwQG1vYml1c2R0YWFzLmFpIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImFjciI6IjEiLCJhbGxvd2VkLW9yaWdpbnMiOlsiLyoiXSwicmVhbG1fYWNjZXNzIjp7InJvbGVzIjpbImRlZmF1bHQtcm9sZXMtbWFzdGVyIiwib2ZmbGluZV9hY2Nlc3MiLCJ1bWFfYXV0aG9yaXphdGlvbiJdfSwicmVzb3VyY2VfYWNjZXNzIjp7IkhPTEFDUkFDWSI6eyJyb2xlcyI6WyJIT0xBQ1JBQ1lfVVNFUiJdfSwiYWNjb3VudCI6eyJyb2xlcyI6WyJtYW5hZ2UtYWNjb3VudCIsIm1hbmFnZS1hY2NvdW50LWxpbmtzIiwidmlldy1wcm9maWxlIl19fSwic2NvcGUiOiJwcm9maWxlIGVtYWlsIiwic2lkIjoiYmI1ZjJkMzktYTQ3ZC00MjI0LWFjZGMtZTdmNzQwNDc2OTgwIiwidGVuYW50SWQiOiJmNzFmMzU5My1hNjdhLTQwYmMtYTExYS05YTQ0NjY4YjQxMGQiLCJyZXF1ZXN0ZXJUeXBlIjoiVEVOQU5UIn0=.FXeDyHBhlG9L4_NCeSyHEaNEBVmhFpfSBqlcbhHaPaoydhKcA0BfuyHgxg_32kQk6z5S9IQ7nVKS2ybtOvwo0WyLWwLQchSq7Noa7LooHIMzmeWMQb_bLKtbaOti59zwIdS8CkfGaXut7RUQKISQVWmbUGsVJQa2JkG6Ng_QN0y5hFVksMWPZiXVsofQkJXHXV1CQ3gabhhHKo3BqlJwzpsCKLDfg1-4PmSl1Wqbw03Ef2yolroj5i8FoeHukOQPkwCUHrrNw-ilIp917nqZa89YbCMtDjWyaj8pEH7GJR5vMZPE2WcJPn5dSA1IHVunfatEB1cDAitaFjVNWNnddQ',
                        'content-type': 'application/json'
                    },
                    body: JSON.stringify({
                        type: "TIDB",
                        definition: `SELECT s.primary_topic, COUNT(*) AS topic_sessions FROM t_69a82d5742abf6674cbcb935_t s WHERE s.employee_id='${activeEmployeeId}' GROUP BY s.primary_topic ORDER BY topic_sessions DESC;`
                    })
                });

                if (response.ok) {
                    const result = await response.json();
                    const data = result.data || [];
                    setTopicsData({
                        topics: data.map(item => item.primary_topic || 'Other'),
                        counts: data.map(item => item.topic_sessions)
                    });
                }
            } catch (error) {
                console.error("Error fetching sessions topics data:", error);
            }
        };

        fetchProgressData();
        fetchGoalsDetails();
        fetchActionItems();
        fetchAchievements();
        fetchSkillMap();
        fetchSessionsData();
        fetchTopicsData();
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
                    }
                } catch (err) {
                    console.error("Error fetching employees for dropdown:", err);
                }
            };
            fetchAllEmployees();
        }
    }, [role]);

    useEffect(() => {
        if (chartRef.current && chartData.categories.length > 0) {
            if (chartInstance.current) chartInstance.current.dispose()
            chartInstance.current = echarts.init(chartRef.current)

            let hoveredSeriesName = null;

            const option = {
                grid: { left: 40, right: 30, top: 40, bottom: 40 },
                tooltip: {
                    trigger: 'axis',
                    axisPointer: { type: 'none' },
                    formatter: (params) => {
                        if (!hoveredSeriesName) return null;
                        const p = params.find(item => item.seriesName === hoveredSeriesName);
                        if (!p) return null;
                        return `<div style="padding: 4px">
                            <div style="font-weight: 800; font-size: 11px; margin-bottom: 4px; color: #1e293b">${p.seriesName}</div>
                            <div style="display: flex; align-items: center; gap: 8px">
                                <div style="width: 8px; height: 8px; border-radius: 50%; background: ${p.color}"></div>
                                <span style="font-size: 10px; color: #64748b">${p.name}</span>
                                <span style="font-size: 10px; font-weight: 800; color: #0f172a; margin-left: auto">${p.value}%</span>
                            </div>
                        </div>`;
                    }
                },
                legend: { top: 0, textStyle: { fontSize: 8 }, type: 'scroll', padding: [0, 50] },
                xAxis: { type: 'category', data: chartData.categories, boundaryGap: false, axisLabel: { fontSize: 9 } },
                yAxis: { type: 'value', max: 100, axisLabel: { fontSize: 9, formatter: '{value}%' } },
                series: chartData.series.map(s => ({
                    ...s,
                    triggerLineEvent: true,
                    emphasis: {
                        focus: 'series',
                        lineStyle: { width: 4 }
                    }
                }))
            }

            chartInstance.current.setOption(option);

            chartInstance.current.on('mouseover', (params) => {
                if (params.componentType === 'series') {
                    hoveredSeriesName = params.seriesName;
                }
            });

            chartInstance.current.on('mouseout', () => {
                hoveredSeriesName = null;
            });
        }

        const handleResize = () => chartInstance.current?.resize()
        window.addEventListener('resize', handleResize)
        return () => {
            window.removeEventListener('resize', handleResize)
            chartInstance.current?.dispose()
        }
    }, [chartData])

    useEffect(() => {
        if (sessionChartRef.current && sessionsData.dates.length > 0) {
            if (sessionChartInstance.current) sessionChartInstance.current.dispose();
            sessionChartInstance.current = echarts.init(sessionChartRef.current);

            const option = {
                grid: { left: 40, right: 20, top: 40, bottom: 40 },
                tooltip: {
                    trigger: 'axis',
                    formatter: (params) => {
                        const p = params[0];
                        return `<div style="padding: 4px">
                            <div style="font-weight: 800; font-size: 11px; margin-bottom: 4px; color: #1e293b">Session Growth</div>
                            <div style="display: flex; align-items: center; gap: 8px">
                                <div style="width: 8px; height: 8px; border-radius: 50%; background: #3b82f6"></div>
                                <span style="font-size: 10px; color: #64748b">${p.name}</span>
                                <span style="font-size: 10px; font-weight: 800; color: #1e293b; margin-left: auto">${p.value} sessions</span>
                            </div>
                        </div>`;
                    }
                },
                xAxis: {
                    type: 'category',
                    data: sessionsData.dates,
                    axisLabel: { fontSize: 8, color: '#94a3b8' }
                },
                yAxis: {
                    type: 'value',
                    axisLabel: { fontSize: 8, color: '#94a3b8' },
                    splitLine: { lineStyle: { type: 'dashed', color: '#f1f5f9' } }
                },
                series: [{
                    name: 'Cumulative Sessions',
                    type: 'line',
                    data: sessionsData.counts,
                    smooth: 0.5,
                    showSymbol: false,
                    lineStyle: { width: 3, color: '#3b82f6' },
                    areaStyle: {
                        opacity: 0.2,
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: '#3b82f6' },
                            { offset: 1, color: 'transparent' }
                        ])
                    }
                }]
            };

            sessionChartInstance.current.setOption(option);
        }

        const handleRes = () => sessionChartInstance.current?.resize();
        window.addEventListener('resize', handleRes);
        return () => window.removeEventListener('resize', handleRes);
    }, [sessionsData]);

    useEffect(() => {
        if (topicChartRef.current && topicsData.topics.length > 0) {
            if (topicChartInstance.current) topicChartInstance.current.dispose();
            topicChartInstance.current = echarts.init(topicChartRef.current);

            const option = {
                grid: { left: 120, right: 30, top: 20, bottom: 20 },
                tooltip: {
                    trigger: 'axis',
                    axisPointer: { type: 'shadow' },
                    formatter: (params) => {
                        const p = params[0];
                        const formattedName = p.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                        return `<div style="padding: 4px">
                            <div style="font-weight: 800; font-size: 11px; margin-bottom: 4px; color: #1e293b">${formattedName}</div>
                            <div style="display: flex; align-items: center; gap: 8px">
                                <div style="width: 8px; height: 8px; border-radius: 2px; background: #8b5cf6"></div>
                                <span style="font-size: 10px; color: #64748b">Sessions</span>
                                <span style="font-size: 10px; font-weight: 800; color: #1e293b; margin-left: auto">${p.value}</span>
                            </div>
                        </div>`;
                    }
                },
                xAxis: { type: 'value', show: false },
                yAxis: {
                    type: 'category',
                    data: [...topicsData.topics].reverse(),
                    axisLine: { show: false },
                    axisTick: { show: false },
                    axisLabel: {
                        fontSize: 9,
                        color: '#64748b',
                        fontWeight: 600,
                        width: 100,
                        overflow: 'break',
                        lineHeight: 12,
                        formatter: (val) => val.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                    }
                },
                series: [{
                    name: 'Sessions',
                    type: 'bar',
                    data: [...topicsData.counts].reverse(),
                    itemStyle: {
                        color: new echarts.graphic.LinearGradient(1, 0, 0, 0, [
                            { offset: 0, color: '#8b5cf6' },
                            { offset: 1, color: '#c084fc' }
                        ]),
                        borderRadius: [0, 4, 4, 0]
                    },
                    barWidth: '60%',
                    label: {
                        show: true,
                        position: 'right',
                        fontSize: 9,
                        fontWeight: 800,
                        color: '#1e293b'
                    }
                }]
            };

            topicChartInstance.current.setOption(option);
        }

        const handleResTopic = () => topicChartInstance.current?.resize();
        window.addEventListener('resize', handleResTopic);
        return () => window.removeEventListener('resize', handleResTopic);
    }, [topicsData]);

    return (
        <div onClick={() => setIsDropdownOpen(false)}>
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl mb-1 flex items-center gap-3 text-gray-800 font-bold tracking-tight">
                        <i className="fas fa-chart-line text-primary-blue text-xl"></i>
                        Progress Dashboard
                    </h1>
                    <p className="text-gray-400 text-sm tracking-wide">Track your growth journey</p>
                </div>

                {role === 'admin' && allEmployees.length > 0 && (
                    <div className="relative">
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                setIsDropdownOpen(!isDropdownOpen)
                            }}
                            className="bg-white border border-gray-200 px-4 py-2 rounded-xl text-xs font-bold text-gray-700 flex items-center gap-3 hover:border-primary-blue hover:text-primary-blue transition-all shadow-sm group"
                        >
                            <span className="opacity-40 uppercase tracking-widest text-[10px]">EMPLOYEES:</span>
                            <span className="text-primary-blue">{selectedEmployeeName}</span>
                            <i className={`fas fa-chevron-${isDropdownOpen ? 'up' : 'down'} text-[10px] opacity-40 group-hover:opacity-100`}></i>
                        </button>

                        {isDropdownOpen && (
                            <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-[100] max-h-[400px] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                                <div className="p-2 sticky top-0 bg-white border-b border-gray-50">
                                    <input
                                        type="text"
                                        placeholder="Search employee..."
                                        className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary-blue/20"
                                        onChange={(e) => {
                                            const term = e.target.value.toLowerCase()
                                            const items = document.querySelectorAll('.emp-item-progress')
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
                                        className="emp-item-progress w-full text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-500 hover:bg-primary-blue/5 hover:text-primary-blue flex items-center justify-between transition-all border-b border-gray-50 last:border-0"
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
                        <div className="p-4 space-y-4 max-h-[750px] overflow-y-auto custom-scrollbar pr-2">
                            {goals.length > 0 ? (
                                goals.map((goal) => (
                                    <div key={goal.goal_id} className="pb-4 last:pb-0 border-b border-gray-50 last:border-b-0">
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="text-[13px] font-bold text-gray-800 tracking-tight">{goal.title}</h4>
                                            <span className={`text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider ${goal.status?.toLowerCase() === 'on-track' || goal.status?.toLowerCase() === 'completed' || goal.status?.toLowerCase() === 'active' ? 'bg-success/10 text-success' :
                                                goal.status?.toLowerCase() === 'at-risk' ? 'bg-danger/10 text-danger' :
                                                    'bg-warning/10 text-warning'
                                                }`}>{goal.status}</span>
                                        </div>
                                        <div className="w-full bg-gray-50 border border-gray-100 rounded-full h-1.5 mb-2 overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-1000 ${goal.progress_pct >= 70 ? 'bg-success' : goal.progress_pct >= 40 ? 'bg-warning' : 'bg-danger'
                                                    }`}
                                                style={{ width: `${goal.progress_pct}%` }}
                                            ></div>
                                        </div>
                                        <div className="flex items-center justify-between text-[10px] text-gray-400 uppercase tracking-wider">
                                            <span>{goal.progress_pct}% complete</span>
                                            <span>Due: {goal.due_date ? new Date(goal.due_date).toLocaleDateString() : 'N/A'}</span>
                                        </div>

                                        {goal.milestones && goal.milestones.length > 0 && (
                                            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 ml-2">
                                                {goal.milestones.map((m, i) => (
                                                    <div key={i} className="flex items-center gap-2 text-[11px] p-2 bg-gray-50/50 rounded-xl border border-gray-100/50 hover:border-primary-blue/20 transition-all">
                                                        <i className={`fas fa-${m.status === 'completed' ? 'check-circle text-success' :
                                                            m.status === 'in_progress' ? 'circle-notch fa-spin text-primary-blue' :
                                                                'circle text-gray-200'
                                                            } text-[10px]`}></i>
                                                        <div className="flex-1">
                                                            <div className={`${m.status === 'completed' ? 'line-through text-gray-400 font-medium' : 'text-gray-700 font-bold'} text-[11px]`}>{m.title}</div>
                                                            <div className="text-[8px] text-gray-400 uppercase font-bold tracking-tight opacity-70">
                                                                {m.type} • {m.progress}%
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {goal.program_name && (
                                            <div className="mt-2 text-[10px] text-primary-blue font-bold">
                                                <i className="fas fa-layer-group mr-1 opacity-60"></i> Program: {goal.program_name}
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-6 text-gray-400 text-xs font-medium uppercase tracking-widest bg-gray-50/50 rounded-xl border border-dashed border-gray-100 italic">
                                    No goals found
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="flex flex-col gap-4">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/20">
                            <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <i className="fas fa-tags text-primary-blue text-[10px]"></i> Top Coaching Topics
                            </h2>
                        </div>
                        <div className="p-4">
                            <div ref={topicChartRef} style={{ height: '200px', width: '100%' }}></div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/20">
                            <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <i className="fas fa-history text-primary-blue text-[10px]"></i> Session Growth
                            </h2>
                        </div>
                        <div className="p-4">
                            <div ref={sessionChartRef} style={{ height: '180px', width: '100%' }}></div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/20 flex items-center justify-between">
                            <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <i className="fas fa-trophy text-primary-blue text-[10px]"></i> Achievements
                            </h2>
                        </div>
                        <div className="p-4 space-y-3">
                            {achievements.length > 0 ? (
                                achievements.map((achievement, i) => (
                                    <div key={i} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-b-0">
                                        <div className="w-8 h-8 bg-warning/10 text-warning rounded-lg flex items-center justify-center flex-shrink-0 text-sm">
                                            <i className={`fas fa-${achievement.achievement_title?.includes('Goal') ? 'bullseye' :
                                                achievement.achievement_title?.includes('Session') ? 'comments' :
                                                    achievement.achievement_title?.includes('Learning') ? 'lightbulb' :
                                                        'star'
                                                }`}></i>
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-bold text-[12px] text-gray-800 flex justify-between gap-2 overflow-hidden">
                                                <span className="truncate">{achievement.achievement_title}</span>
                                                <span className="text-[9px] text-gray-400 uppercase mt-0.5 flex-shrink-0">
                                                    {achievement.achievement_date ? new Date(achievement.achievement_date).toLocaleDateString('en-US', { month: 'short', day: '2-digit' }) : ''}
                                                </span>
                                            </div>
                                            <div className="text-[10px] text-gray-500 mt-0.5">{achievement.achievement_subtitle}</div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-4 text-gray-400 text-[10px] italic">No achievements yet</div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/20">
                            <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <i className="fas fa-lightbulb text-primary-blue text-[10px]"></i> Skill Map
                            </h2>
                        </div>
                        <div className="p-4 space-y-4">
                            {skills.length > 0 ? (
                                skills.map((skill, i) => (
                                    <div key={i} className="last:mb-0">
                                        <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-gray-500 mb-1.5">
                                            <span className="truncate pr-2">{skill.skill_name}</span>
                                            <span className="text-gray-800 font-bold">{skill.skill_pct}%</span>
                                        </div>
                                        <div className="w-full bg-gray-50 border border-gray-100/50 rounded-full h-1.5 overflow-hidden">
                                            <div
                                                className={`bg-primary-blue h-full rounded-full transition-all duration-1000`}
                                                style={{ width: `${skill.skill_pct}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-4 text-gray-400 text-[10px] italic">No skills mapped yet</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
