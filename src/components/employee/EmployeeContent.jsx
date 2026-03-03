import { MOCK_DATA } from '../../data/mockData'
import { getContentIcon } from '../../utils/helpers'

export default function EmployeeContent() {
    const employee = MOCK_DATA.employee

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl mb-1 flex items-center gap-3 text-gray-800 font-bold tracking-tight">
                    <i className="fas fa-book text-primary-blue text-xl"></i>
                    Content Feed
                </h1>
                <p className="text-gray-400 text-sm tracking-wide">Personalized content recommendations based on your goals</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {employee.contentRecommendations.map((content) => (
                    <div key={content.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden group hover:border-primary-blue/30 transition-all duration-300">
                        <div className="bg-gray-50 p-4 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 bg-primary-blue/10 text-primary-blue rounded-lg flex items-center justify-center text-[10px]">
                                    <i className={`fas fa-${getContentIcon(content.type)}`}></i>
                                </div>
                                <span className="text-[10px] text-gray-400 uppercase tracking-widest">{content.type}</span>
                            </div>
                            <span className="bg-white text-gray-400 border border-gray-100 px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider">
                                {content.duration} min
                            </span>
                        </div>
                        <div className="p-4">
                            <h3 className="text-sm font-bold text-gray-800 mb-2 leading-snug group-hover:text-primary-blue transition-colors line-clamp-1">{content.title}</h3>
                            <p className="text-[11px] text-gray-500 mb-4 leading-relaxed line-clamp-2">{content.description}</p>

                            <div className="flex items-center gap-3 mb-4">
                                <div className="flex-1 flex items-center gap-2">
                                    <div className="flex-1 bg-gray-50 rounded-full h-1 border border-gray-100 overflow-hidden">
                                        <div
                                            className="bg-success h-full rounded-full transition-all duration-1000"
                                            style={{ width: `${content.relevance}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-[10px] text-success uppercase tracking-tighter">{content.relevance}% Match</span>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-1.5 mb-4">
                                {content.topics.slice(0, 3).map((skill, i) => (
                                    <span key={i} className="bg-primary-blue/5 text-primary-blue text-[9px] px-2 py-0.5 rounded-md uppercase tracking-wider border border-primary-blue/5">
                                        {skill}
                                    </span>
                                ))}
                            </div>

                            <div className="flex items-center justify-between text-[10px] text-gray-400 uppercase tracking-wider mb-4 border-t border-gray-50 pt-3">
                                <span><i className="fas fa-users mr-1"></i>{content.completionRate}% Popularity</span>
                                <span><i className="fas fa-star mr-1 text-warning"></i>{content.rating || 'N/A'}</span>
                            </div>

                            <div className="flex gap-2">
                                <button className="flex-1 bg-primary-blue text-white border-none py-1.5 rounded-lg text-[10px] uppercase tracking-wider cursor-pointer hover:bg-primary-dark transition-all shadow-sm">
                                    {content.completed ? 'Completed' : content.viewed ? 'Continue' : 'Start Now'}
                                </button>
                                <button className="bg-gray-50 text-gray-400 border border-gray-100 px-2.5 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-gray-100 hover:text-gray-600 transition-all">
                                    <i className="fas fa-info-circle"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
