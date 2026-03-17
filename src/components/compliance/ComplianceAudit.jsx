import { useState, useEffect } from 'react'

export default function ComplianceAudit() {
    const [reports, setReports] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchAuditReports = async () => {
            try {
                const response = await fetch(import.meta.env.VITE_COHORTS_API_URL, {
                    method: 'POST',
                    headers: {
                        'accept': 'application/json',
                        'authorization': `Bearer ${import.meta.env.VITE_COHORTS_AUTH_TOKEN}`,
                        'content-type': 'application/json'
                    },
                    body: JSON.stringify({
                        "type": "TIDB",
                        "definition": "SELECT q.year_num AS year, q.quarter_num AS quarter, q.generated_date, q.total_events, q.violations, q.escalations, CASE WHEN (100 - q.weighted_penalty) < 0 THEN 0 ELSE (100 - q.weighted_penalty) END AS policy_score, CASE WHEN q.violations = 0 THEN 'PASS STATUS' ELSE 'REVIEW REQUIRED' END AS report_status FROM ( SELECT a.year_num, a.quarter_num, a.generated_date, a.total_events, COALESCE(v.violations, 0) AS violations, COALESCE(v.weighted_penalty, 0) AS weighted_penalty, COALESCE(e.escalations, 0) AS escalations FROM ( SELECT SUBSTR(audit_created_at, 1, 4) AS year_num, CASE WHEN SUBSTR(audit_created_at, 6, 2) IN ('01', '02', '03') THEN '1' WHEN SUBSTR(audit_created_at, 6, 2) IN ('04', '05', '06') THEN '2' WHEN SUBSTR(audit_created_at, 6, 2) IN ('07', '08', '09') THEN '3' WHEN SUBSTR(audit_created_at, 6, 2) IN ('10', '11', '12') THEN '4' END AS quarter_num, MAX(SUBSTR(audit_created_at, 1, 10)) AS generated_date, COUNT(*) AS total_events FROM t_69b3f2dba006f77c68dc80fb_t GROUP BY SUBSTR(audit_created_at, 1, 4), CASE WHEN SUBSTR(audit_created_at, 6, 2) IN ('01', '02', '03') THEN '1' WHEN SUBSTR(audit_created_at, 6, 2) IN ('04', '05', '06') THEN '2' WHEN SUBSTR(audit_created_at, 6, 2) IN ('07', '08', '09') THEN '3' WHEN SUBSTR(audit_created_at, 6, 2) IN ('10', '11', '12') THEN '4' END ) a LEFT JOIN ( SELECT SUBSTR(created_at, 1, 4) AS year_num, CASE WHEN SUBSTR(created_at, 6, 2) IN ('01', '02', '03') THEN '1' WHEN SUBSTR(created_at, 6, 2) IN ('04', '05', '06') THEN '2' WHEN SUBSTR(created_at, 6, 2) IN ('07', '08', '09') THEN '3' WHEN SUBSTR(created_at, 6, 2) IN ('10', '11', '12') THEN '4' END AS quarter_num, COUNT(*) AS violations, SUM( CASE WHEN LOWER(COALESCE(severity, '')) = 'critical' THEN 25 WHEN LOWER(COALESCE(severity, '')) = 'high' THEN 15 WHEN LOWER(COALESCE(severity, '')) = 'medium' THEN 8 WHEN LOWER(COALESCE(severity, '')) = 'low' THEN 3 ELSE 5 END ) / 100.0 AS weighted_penalty FROM t_69b3f434a006f77c68dc80fd_t GROUP BY SUBSTR(created_at, 1, 4), CASE WHEN SUBSTR(created_at, 6, 2) IN ('01', '02', '03') THEN '1' WHEN SUBSTR(created_at, 6, 2) IN ('04', '05', '06') THEN '2' WHEN SUBSTR(created_at, 6, 2) IN ('07', '08', '09') THEN '3' WHEN SUBSTR(created_at, 6, 2) IN ('10', '11', '12') THEN '4' END ) v ON a.year_num = v.year_num AND a.quarter_num = v.quarter_num LEFT JOIN ( SELECT SUBSTR(created_at, 1, 4) AS year_num, CASE WHEN SUBSTR(created_at, 6, 2) IN ('01', '02', '03') THEN '1' WHEN SUBSTR(created_at, 6, 2) IN ('04', '05', '06') THEN '2' WHEN SUBSTR(created_at, 6, 2) IN ('07', '08', '09') THEN '3' WHEN SUBSTR(created_at, 6, 2) IN ('10', '11', '12') THEN '4' END AS quarter_num, COUNT(*) AS escalations FROM t_69b3f503a006f77c68dc80fe_t GROUP BY SUBSTR(created_at, 1, 4), CASE WHEN SUBSTR(created_at, 6, 2) IN ('01', '02', '03') THEN '1' WHEN SUBSTR(created_at, 6, 2) IN ('04', '05', '06') THEN '2' WHEN SUBSTR(created_at, 6, 2) IN ('07', '08', '09') THEN '3' WHEN SUBSTR(created_at, 6, 2) IN ('10', '11', '12') THEN '4' END ) e ON a.year_num = e.year_num AND a.quarter_num = e.quarter_num ) q ORDER BY q.year_num DESC, q.quarter_num DESC;"
                    })
                });
                const result = await response.json();
                if (result.status === 'success') {
                    setReports(result.data || []);
                }
            } catch (error) {
                console.error("Error fetching audit reports:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAuditReports();
    }, []);

    return (
        <div className="pb-10">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl mb-1 flex items-center gap-3 text-gray-800 font-bold tracking-tight">
                        <i className="fas fa-clipboard-check text-primary-blue text-xl"></i>
                        Audit Reports
                    </h1>
                    <p className="text-gray-400 text-sm font-medium tracking-wide">Quarterly compliance documentation</p>
                </div>
                {loading && (
                    <div className="text-[10px] text-primary-blue animate-pulse font-bold">
                        <i className="fas fa-sync-alt fa-spin mr-1"></i> UPDATING REPOSITORY...
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-4">
                {reports.length === 0 && !loading ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-400">
                        No audit reports found in the repository.
                    </div>
                ) : (
                    reports.map((report, idx) => (
                        <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:border-primary-blue/30 transition-all">
                            <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/10">
                                <div>
                                    <h2 className="text-sm font-bold text-gray-800 tracking-tight flex items-center gap-2">
                                        <i className="fas fa-file-alt text-primary-blue/50 text-xs"></i>
                                        Audit Report - Q{report.quarter} {report.year}
                                    </h2>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Generated: {new Date(report.generated_date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                </div>
                                <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${report.report_status === 'PASS STATUS' ? 'bg-success/10 text-success border-success/10' : 'bg-warning/10 text-warning border-warning/10'
                                    }`}>{report.report_status}</span>
                            </div>
                            <div className="p-4">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
                                    <div className="bg-gray-50/50 p-3 rounded-lg border border-gray-100/50 text-center md:text-left">
                                        <div className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">Total Events</div>
                                        <div className="text-lg font-bold text-gray-800 leading-none tracking-tight">{report.total_events.toLocaleString()}</div>
                                    </div>
                                    <div className={`p-3 rounded-lg border text-center md:text-left ${report.violations > 0 ? 'bg-danger/5 border-danger/10 text-danger' : 'bg-success/5 border-success/10 text-success'}`}>
                                        <div className="text-[9px] font-bold uppercase tracking-widest mb-1.5 opacity-70">Violations</div>
                                        <div className="text-lg font-bold leading-none tracking-tight">{report.violations}</div>
                                    </div>
                                    <div className="bg-gray-50/50 p-3 rounded-lg border border-gray-100/50 text-center md:text-left">
                                        <div className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">Escalations</div>
                                        <div className="text-lg font-bold text-gray-800 leading-none tracking-tight">{report.escalations}</div>
                                    </div>
                                    <div className="bg-primary-blue/5 p-3 rounded-lg border border-primary-blue/10 text-center md:text-left">
                                        <div className="text-[9px] text-primary-blue/60 font-bold uppercase tracking-widest mb-1.5">Policy Score</div>
                                        <div className="text-lg font-bold text-primary-blue leading-none tracking-tight">{(Number(report.policy_score)).toFixed(1)}%</div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex gap-2">
                                        <button className="bg-primary-blue text-white border-none px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer hover:bg-primary-dark transition-all shadow-sm">
                                            <i className="fas fa-download mr-1.5 text-[9px]"></i> Download PDF
                                        </button>
                                        <button className="bg-white text-gray-400 border border-gray-100 px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer hover:bg-gray-50 hover:text-gray-600 transition-all">
                                            <i className="fas fa-file-csv mr-1.5 text-[9px]"></i> CSV Export
                                        </button>
                                    </div>
                                    <button className="text-gray-300 bg-transparent border-none text-[10px] font-bold cursor-pointer hover:text-primary-blue transition-colors uppercase tracking-widest">
                                        View Full Logs
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
