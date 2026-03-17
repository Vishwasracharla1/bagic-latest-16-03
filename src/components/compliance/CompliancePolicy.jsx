import { useState, useEffect } from 'react'

const POLICY_METADATA = {
    'Clinical Boundary Policy': {
        category: 'Safety',
        version: '2.1',
        description: 'Prevents AI from providing mental health diagnosis, therapy, or medical advice',
        triggers: ['depression', 'suicide', 'therapy', 'medication', 'diagnosis'],
        action: 'Block response, escalate to EAP'
    },
    'Confidentiality Policy': {
        category: 'Privacy',
        version: '1.8',
        description: 'Ensures no PII or confidential business data is logged or shared',
        triggers: ['salary details', 'personal contact', 'performance ratings'],
        action: 'Redact data, log audit event'
    },
    'BAGIC Feedback Guidelines': {
        category: 'Culture',
        version: '3.2',
        description: 'Aligns AI coaching with BAGIC leadership principles and feedback standards',
        principles: ['SBI framework', 'Growth mindset', 'Respect and empathy'],
        action: 'Guide AI responses to align with BAGIC values'
    },
    'Confidential Goal Discussions': {
        category: 'Privacy',
        version: '1.2',
        description: 'Protects the confidentiality of career and personal goal setting sessions.',
        triggers: ['goal setting', 'career path', 'personal ambition'],
        action: 'Zero-log policy for sensitive goals'
    },
    'Confidential Coaching Data': {
        category: 'Data Security',
        version: '1.5',
        description: 'Secures coaching transcripts and metadata against unauthorized access.',
        triggers: ['transcript access', 'metadata export', 'user identifying data'],
        action: 'Encryption at rest and in transit'
    },
    'Coaching Boundary Enforcement': {
        category: 'Safety',
        version: '1.4',
        description: 'Ensures the AI coach stays within professional development boundaries.',
        triggers: ['non-professional advice', 'personal relationship cues'],
        action: 'Response filtering'
    },
    'Ethical Leadership Guidance': {
        category: 'Ethics',
        version: '1.0',
        description: 'Ensures leadership coaching adheres to ethical guidelines and corporate values.',
        principles: ['Integrity', 'Fairness', 'Leadership Ethics'],
        action: 'Response auditing'
    },
    'Ethical Decision Support': {
        category: 'Ethics',
        version: '1.0',
        description: 'Guards against bias in decision-making support provided by the AI.',
        principles: ['Unbiased Logic', 'Data Transparency'],
        action: 'Bias detection flagging'
    },
    'Ethical Performance Evaluation': {
        category: 'Ethics',
        version: '1.1',
        description: 'Ensures performance evaluation discussions are fair and grounded in objective data.',
        principles: ['Objectivity', 'Meritocracy'],
        action: 'Validation check'
    },
    'Bias-Free Coaching Recommendations': {
        category: 'Ethics',
        version: '1.0',
        description: 'Prevents systemic bias in content and developmental recommendations.',
        principles: ['Algorithmic Fairness', 'Diversity'],
        action: 'Recommendation filtering'
    },
    'Fair Team Recognition Guidance': {
        category: 'Ethics',
        version: '1.0',
        description: 'Enforces fairness in how AI suggests team members for recognition or rewards.',
        principles: ['Equity', 'Balanced Recognition'],
        action: 'Reward logic audit'
    },
    'Inclusive Communication Guidance': {
        category: 'Culture',
        version: '1.2',
        description: 'Promotes inclusive language and behavior in AI coaching modules.',
        principles: ['Inclusion', 'Diversity'],
        action: 'Language model tuning'
    },
    'Coaching Transparency Requirement': {
        category: 'Transparency',
        version: '1.0',
        description: 'Requires the AI to be transparent about its limitations and data usage.',
        principles: ['Honesty', 'Clarity'],
        action: 'Disclosure injection'
    },
    'Responsible Feedback Escalation': {
        category: 'Accountability',
        version: '1.3',
        description: 'Defines rules for when negative feedback patterns should be escalated to human HR.',
        principles: ['Accountability', 'Criticality'],
        action: 'Automatic HR notification'
    },
    'Respectful Manager Communication': {
        category: 'Culture',
        version: '1.0',
        description: 'Ensures high standards of respect in AI-guided manager interactions.',
        principles: ['Respect', 'Professionalism'],
        action: 'Tone checking'
    },
    'Respectful Feedback Practices': {
        category: 'Culture',
        version: '1.1',
        description: 'Guidelines for delivering feedback that is constructive and respectful.',
        principles: ['Respect', 'Constructiveness'],
        action: 'Real-time tone correction suggestion'
    },
    'Conflict De-escalation Standard': {
        category: 'Safety',
        version: '1.5',
        description: 'Standard protocol for AI to follow when conflict is detected in coaching sessions.',
        principles: ['De-escalation', 'Peaceful Resolution'],
        action: 'Escalate to human mediator'
    },
    'Team Conflict Resolution Protocol': {
        category: 'Safety',
        version: '1.2',
        description: 'Specific steps the AI coach follows to guide managers through team conflicts.',
        principles: ['Resolution', 'Team Harmony'],
        action: 'Structured workflow guidance'
    },
    'Safe Feedback Environment': {
        category: 'Safety',
        version: '1.0',
        description: 'Ensures the digital environment is safe for expressing honest feedback.',
        principles: ['Anonymity', 'Safety'],
        action: 'Privacy shielding'
    },
    'Psychological Safety in Coaching': {
        category: 'Safety',
        version: '2.0',
        description: 'The foundation of all coaching: ensuring maximum psychological safety for the coachee.',
        principles: ['Trust', 'Safety', 'Non-judgmental Space'],
        action: 'Empathy-driven response logic'
    }
};

const DEFAULT_METADATA = {
    category: 'General',
    version: '1.0',
    description: 'General compliance policy ensuring guardrail integrity across coaching modules.',
    triggers: ['general audit', 'unspecified behavior'],
    action: 'Monitor and log'
};

export default function CompliancePolicies() {
    const [policies, setPolicies] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchPolicies = async () => {
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
                        "definition": "SELECT p.policy_id, p.policy_name, p.related_framework, p.severity, p.status, COALESCE(v.violations_found, 0) AS violations_found, COALESCE(a.total_tests, 0) AS total_tests, CASE WHEN COALESCE(v.violations_found, 0) = 0 THEN 'ACTIVE' ELSE 'REVIEW' END AS ui_policy_health FROM t_69b3f374a006f77c68dc80fc_t p LEFT JOIN ( SELECT policy_id, COUNT(DISTINCT violation_id) AS violations_found FROM t_69b3f434a006f77c68dc80fd_t GROUP BY policy_id ) v ON p.policy_id = v.policy_id LEFT JOIN ( SELECT framework_used, COUNT(DISTINCT audit_id) AS total_tests FROM t_69b3f2dba006f77c68dc80fb_t GROUP BY framework_used ) a ON p.related_framework = a.framework_used WHERE LOWER(COALESCE(p.status, 'active')) = 'active' ORDER BY p.policy_name;"
                    })
                });
                const result = await response.json();
                if (result.status === 'success') {
                    const enrichedPolicies = (result.data || []).map(p => ({
                        ...p,
                        ...(POLICY_METADATA[p.policy_name] || DEFAULT_METADATA)
                    }));
                    setPolicies(enrichedPolicies);
                }
            } catch (error) {
                console.error("Error fetching policies:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPolicies();
    }, []);

    return (
        <div className="pb-10">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl mb-1 flex items-center gap-3 text-gray-800 font-bold tracking-tight">
                        <i className="fas fa-file-contract text-primary-blue text-xl"></i>
                        Policy Management
                    </h1>
                    <p className="text-gray-400 text-sm font-medium tracking-wide">Manage guardrails and compliance rules</p>
                </div>
                {loading && (
                    <div className="text-[10px] text-primary-blue animate-pulse font-bold">
                        <i className="fas fa-sync-alt fa-spin mr-1"></i> UPDATING POLICIES...
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-4">
                {policies.map((policy, idx) => (
                    <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden group hover:border-primary-blue/30 transition-all">
                        <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/20">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-primary-blue/10 text-primary-blue rounded-lg flex items-center justify-center text-sm">
                                    <i className="fas fa-shield-alt"></i>
                                </div>
                                <div>
                                    <h2 className="text-sm font-bold text-gray-800 tracking-tight">{policy.policy_name}</h2>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="bg-primary-blue/5 text-primary-blue text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">{policy.category}</span>
                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">v{policy.version}</span>
                                    </div>
                                </div>
                            </div>
                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${policy.ui_policy_health === 'ACTIVE' ? 'bg-success/10 text-success border-success/10' : 'bg-warning/10 text-warning border-warning/10'}`}>{policy.ui_policy_health} {policy.status}</span>
                        </div>
                        <div className="p-4">
                            <p className="text-[11px] text-gray-500 mb-5 leading-relaxed font-medium">{policy.description}</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                                {/* Triggers */}
                                {policy.triggers && (
                                    <div>
                                        <h3 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                            <i className="fas fa-bolt text-warning text-[10px]"></i> AI Triggers
                                        </h3>
                                        <div className="flex flex-wrap gap-1">
                                            {policy.triggers.map((trigger, i) => (
                                                <span key={i} className="bg-warning/5 text-warning/80 text-[10px] px-2 py-0.5 rounded border border-warning/10 font-bold uppercase tracking-tight">{trigger}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Principles */}
                                {policy.principles && (
                                    <div>
                                        <h3 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                            <i className="fas fa-heart text-danger text-[10px]"></i> Principles
                                        </h3>
                                        <div className="flex flex-wrap gap-1">
                                            {policy.principles.map((principle, i) => (
                                                <span key={i} className="bg-success/5 text-success/80 text-[10px] px-2 py-0.5 rounded border border-success/10 font-bold uppercase tracking-tight">{principle}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Action Row */}
                            <div className="bg-gray-50/50 rounded-lg p-2.5 mb-5 border border-gray-100 flex items-center gap-3">
                                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Enforcement:</span>
                                <span className="text-[11px] font-bold text-gray-700 tracking-tight leading-none">{policy.action}</span>
                            </div>

                            {/* Stats & Footer */}
                            <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                <div className="flex gap-6">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-1">Success Rate</span>
                                        <strong className="text-[11px] text-success leading-none">{policy.total_tests} Tests</strong>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-1">Violations Found</span>
                                        <strong className={`text-[11px] leading-none ${policy.violations_found > 0 ? 'text-danger' : 'text-gray-800'}`}>{policy.violations_found} Found</strong>
                                    </div>
                                    <div className="flex flex-col hidden sm:flex">
                                        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-1">Severity</span>
                                        <strong className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">{policy.severity}</strong>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button className="bg-primary-blue text-white border-none px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer hover:bg-primary-dark transition-all shadow-sm">
                                        Configure
                                    </button>
                                    <button className="bg-white text-gray-400 border border-gray-100 px-3 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-gray-50 transition-all">
                                        <i className="fas fa-ellipsis-h text-[10px]"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
