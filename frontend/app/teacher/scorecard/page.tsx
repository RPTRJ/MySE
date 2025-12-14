'use client';
import  { useState } from 'react';
import { Bell, HelpCircle, ChevronDown, CheckCircle, Plus, X, Save } from 'lucide-react';

interface ScoreCriteria {
  id: number;
  criteriaName: string;
  maxScore: number;
  score: number;
  weightPercent: number;
  comment: string;
  orderIndex: number;
}

interface SectionFeedback {
  id: number;
  sectionId: string;
  comment: string;
  location: string;
  isResolved: boolean;
}

interface Feedback {
  overallComment: string;
  strengths: string;
  areasForImprovement: string;
  sectionFeedbacks: SectionFeedback[];
}

interface Scorecard {
  totalScore: number;
  maxScore: number;
  generalComment: string;
  criteria: ScoreCriteria[];
}

interface PortfolioSubmission {
  id: number;
  version: number;
  status: string;
  submittedAt: string;
  reviewedAt?: string;
  approvedAt?: string;
  submitter: {
    name: string;
    role: string;
  };
  reviewer?: {
    name: string;
  };
}
interface Portfolio {
    id: number;
    portfolioname: string;  
}

const PortfolioReview = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [activeSection, setActiveSection] = useState('introduction');
  const [status, setStatus] = useState('revision_requested');
  
  // Sample data
  const [submission] = useState<PortfolioSubmission>({
    id: 1,
    version: 1,
    status: 'under_review',
    submittedAt: '2023-10-26',
    submitter: {
      name: 'Amelia Harper',
      role: 'Design Student'
    }
  });

  const [feedback, setFeedback] = useState<Feedback>({
    overallComment: '',
    strengths: '',
    areasForImprovement: '',
    sectionFeedbacks: [
      {
        id: 1,
        sectionId: 'introduction',
        comment: 'Excellent use of imagery here to set the tone.',
        location: 'Introduction Image',
        isResolved: false
      },
      {
        id: 2,
        sectionId: 'introduction',
        comment: "Could you expand on what you mean by 'impactful solutions'?",
        location: 'Introduction, Paragraph 1',
        isResolved: false
      }
    ]
  });

  const [scorecard, setScorecard] = useState<Scorecard>({
    totalScore: 0,
    maxScore: 100,
    generalComment: '',
    criteria: [
      {
        id: 1,
        criteriaName: 'Research & Analysis',
        maxScore: 25,
        score: 0,
        weightPercent: 25,
        comment: '',
        orderIndex: 1
      },
      {
        id: 2,
        criteriaName: 'Design Quality',
        maxScore: 30,
        score: 0,
        weightPercent: 30,
        comment: '',
        orderIndex: 2
      },
      {
        id: 3,
        criteriaName: 'User Experience',
        maxScore: 25,
        score: 0,
        weightPercent: 25,
        comment: '',
        orderIndex: 3
      },
      {
        id: 4,
        criteriaName: 'Presentation & Documentation',
        maxScore: 20,
        score: 0,
        weightPercent: 20,
        comment: '',
        orderIndex: 4
      }
    ]
  });

  const [portfolio] = useState<Portfolio>({
    id: 1,
    portfolioname: 'คณะวิศวกรรมศาสตร์',
});

  const [newCommentText, setNewCommentText] = useState('');
  const [newCommentLocation, setNewCommentLocation] = useState('');
  const [showAddComment, setShowAddComment] = useState(false);

  const sections = [
    { id: 'introduction', label: 'ข้อมูลส่วนตัว', icon: '📄' },
    { id: 'project-a', label: 'Project A: Case Study', icon: '📋' },
    { id: 'project-b', label: 'Project B: Redesign', icon: '🎨' },
    { id: 'reflection', label: 'Reflection', icon: '💭' }
  ];

  const calculateTotalScore = () => {
    const total = scorecard.criteria.reduce((sum, criteria) => {
      return sum + (criteria.score * (criteria.weightPercent / 100));
    }, 0);
    setScorecard(prev => ({ ...prev, totalScore: Number(total.toFixed(2)) }));
  };

  const updateCriteriaScore = (id: number, score: number) => {
    setScorecard(prev => ({
      ...prev,
      criteria: prev.criteria.map(c => 
        c.id === id ? { ...c, score: Math.min(score, c.maxScore) } : c
      )
    }));
    setTimeout(calculateTotalScore, 0);
  };

  const updateCriteriaComment = (id: number, comment: string) => {
    setScorecard(prev => ({
      ...prev,
      criteria: prev.criteria.map(c => 
        c.id === id ? { ...c, comment } : c
      )
    }));
  };

  const addSectionComment = () => {
    if (newCommentText && newCommentLocation) {
      const newComment: SectionFeedback = {
        id: Date.now(),
        sectionId: activeSection,
        comment: newCommentText,
        location: newCommentLocation,
        isResolved: false
      };
      setFeedback(prev => ({
        ...prev,
        sectionFeedbacks: [...prev.sectionFeedbacks, newComment]
      }));
      setNewCommentText('');
      setNewCommentLocation('');
      setShowAddComment(false);
    }
  };

  const removeSectionComment = (id: number) => {
    setFeedback(prev => ({
      ...prev,
      sectionFeedbacks: prev.sectionFeedbacks.filter(c => c.id !== id)
    }));
  };

  const handleApprove = () => {
    setStatus('approved');
    alert('Portfolio approved successfully!');
  };

  const handleRequestRevision = () => {
    setStatus('revision_requested');
    alert('Revision requested. Student will be notified.');
  };

  const handlePublish = () => {
    alert('Portfolio published and student notified!');
  };

  return (
    
    <div className="min-h-screen bg-gray-100 flex flex-col ">
      <header className="bg-white border-b border-gray-200 px-6 py-3 sticky top-0 z-10">
        <nav className="flex items-center gap-2 overflow-x-auto">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeSection === section.id
                  ? 'bg-orange-50 text-orange-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span>{section.icon}</span>
              <span>{section.label}</span>
            </button>
          ))}
        </nav>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden mr-96">
        {/*  Content */}
        <main className="flex-1 p-8 overflow-y-auto ">
          <div className="max-w-3xl">
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Reviewing: {portfolio.portfolioname}
              </h2>
              <p className="text-gray-600">
                By {submission.submitter.name} - Submitted on {new Date(submission.submittedAt).toLocaleDateString()} - version {submission.version}    
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4 cursor-pointer">Introduction</h3>
            </div>
          </div>
        </main>
      
        {/* Right Sidebar */}
         <aside className=" fixed right-8 top-[155px] bottom-4 w-96 bg-white border-l border-gray-200 flex flex-col overflow-y-auto">
          <div className=" flex gap-4 px-6 pt-6 pb-3 border-b border-gray-200 bg-white flex-shrink-0">
            <button
              onClick={() => setActiveTab('general')}
              className={`pb-3 px-1 font-medium transition-colors  ${
                activeTab === 'general'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              General Feedback
            </button>
            <button
              onClick={() => setActiveTab('scorecard')}
              className={`pb-3 px-1 font-medium transition-colors  ${
                activeTab === 'scorecard'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Scorecard
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`pb-3 px-1 font-medium transition-colors  ${
                activeTab === 'history'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              History
            </button>
          </div> 

          
          <div className="flex-1 p-4 overflow-y-auto ">
            {activeTab === 'general' && (
              <>
                
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Status
                  </label>
                  <div className="relative">
                    <select 
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg appearance-none bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="draft">Draft</option>
                      <option value="submitted">Submitted</option>
                      <option value="under_review">Under Review</option>
                      <option value="revision_requested">Revision Requested</option>
                      <option value="approved">Approved</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-900 mb-2 h-auto">
                    Overall Comment
                  </label>
                  <textarea
                    value={feedback.overallComment}
                    onChange={(e) => setFeedback(prev => ({ ...prev, overallComment: e.target.value }))}
                    placeholder="Provide general comments on the portfolio as a whole..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-24"
                  />
                </div>

                
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Strengths
                  </label>
                  <textarea
                    value={feedback.strengths}
                    onChange={(e) => setFeedback(prev => ({ ...prev, strengths: e.target.value }))}
                    placeholder="What did the student do well?"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-20"
                  />
                </div>

               
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Areas for Improvement
                  </label>
                  <textarea
                    value={feedback.areasForImprovement}
                    onChange={(e) => setFeedback(prev => ({ ...prev, areasForImprovement: e.target.value }))}
                    placeholder="What could be improved?"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-20"
                  />
                </div>
              </>
            )}

             {activeTab === 'scorecard' && (
              <>
                
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-6">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Total Score</p>
                      <p className="text-4xl font-bold text-gray-900">
                        {scorecard.totalScore.toFixed(1)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-semibold text-gray-600">
                        / {scorecard.maxScore}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {((scorecard.totalScore / scorecard.maxScore) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>

                
                 <div className="space-y-6">
                  {scorecard.criteria.map((criteria) => (
                    <div key={criteria.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900">{criteria.criteriaName}</h4>
                        <span className="text-sm text-gray-600">{criteria.weightPercent}%</span>
                      </div>
                      
                      <div className="mb-3">
                        <label className="block text-xs text-gray-600 mb-2">
                          Score (max: {criteria.maxScore})
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={criteria.maxScore}
                          step="0.5"
                          value={criteria.score}
                          onChange={(e) => updateCriteriaScore(criteria.id, Number(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-gray-600 mb-2">
                          Comment
                        </label>
                        <textarea
                          value={criteria.comment}
                          onChange={(e) => updateCriteriaComment(criteria.id, e.target.value)}
                          placeholder="Add feedback for this criterion..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-20"
                        />
                      </div>
                    </div>
                  ))}
                </div> 

                
                 
              </>
            )}

            {activeTab === 'history' && (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Version 1 Submitted</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {submission.submitter.name} submitted the portfolio for review
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(submission.submittedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
                
                {submission.reviewedAt && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-amber-600 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">Review Started</p>
                        <p className="text-sm text-gray-600 mt-1">
                          Review process initiated by {submission.reviewer?.name || 'Reviewer'}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(submission.reviewedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div> 

          
           <div className="border-t border-gray-200 p-6 space-y-3 bg-white flex-shrink-0">
            <button 
              onClick={handleApprove}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <CheckCircle className="w-5 h-5" />
              Approve
            </button>
            <button 
              onClick={handleRequestRevision}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <span>▶</span>
              Request Revision
            </button>
          </div> 
        </aside>  
      </div> 
    </div>
  );
};

export default PortfolioReview;