
import React, { useState, useRef, Suspense } from 'react';
import { GradeLevel, SubjectType, SearchParams, LessonPlan } from './types';
import { generateLessonPlan } from './services/geminiService';
import { LoadingState } from './components/LoadingState';
import { ScenarioCard } from './components/ScenarioCard';
import { TTSToolbar } from './components/TTSToolbar';
import { Search, Sparkles, HelpCircle, Map, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Lazy load heavy D3 components
const D3MindMap = React.lazy(() => import('./components/D3MindMap').then(module => ({ default: module.D3MindMap })));
const D3FlowChart = React.lazy(() => import('./components/D3FlowChart').then(module => ({ default: module.D3FlowChart })));
const D3ScienceSimulator = React.lazy(() => import('./components/D3ScienceSimulator').then(module => ({ default: module.D3ScienceSimulator })));

const App: React.FC = () => {
  const [params, setParams] = useState<SearchParams>({
    grade: GradeLevel.MIDDLE,
    subject: SubjectType.SCIENCE,
    concept: ''
  });
  const [lessonPlan, setLessonPlan] = useState<LessonPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<number>(0);

  const resultsRef = useRef<HTMLDivElement>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!params.concept.trim()) return;

    setLoading(true);
    setError(null);
    setLessonPlan(null);
    setActiveStep(0);

    try {
      const data = await generateLessonPlan(params);
      setLessonPlan(data);
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      setError("生成失败，请重试。");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderVisualSection = (step: any) => {
    const isScience = params.subject === SubjectType.SCIENCE;

    const ChartLoader = () => (
        <div className="h-[300px] w-full flex items-center justify-center bg-slate-50/50 rounded-xl border border-slate-100 text-slate-400 text-sm">
            加载可视化组件...
        </div>
    );

    if (isScience) {
      // Science: Only Logic Flowchart in steps now
      return (
        <div className="space-y-3">
           <div className="flex items-center gap-2 text-blue-600 font-semibold text-sm">
             <Activity size={18}/>
             <span>逻辑结构 (Logic Flow)</span>
           </div>
           <Suspense fallback={<ChartLoader />}>
              <D3FlowChart data={step.visualData} />
           </Suspense>
        </div>
      );
    } else {
      // Arts: Scenario + MindMap
      return (
        <div className="space-y-8">
           {/* Module 1: Scenario Text */}
           {step.scenario && <ScenarioCard content={step.scenario} />}

           {/* Module 2: Structural MindMap */}
           <div className="space-y-3">
              <div className="flex items-center gap-2 text-purple-600 font-semibold text-sm">
                <Map size={18}/>
                <span>知识结构 (Mind Map)</span>
              </div>
              <Suspense fallback={<ChartLoader />}>
                 <D3MindMap data={step.visualData} />
              </Suspense>
           </div>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="w-full p-4 flex items-center justify-between bg-white border-b border-slate-100 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center space-x-2 text-blue-600">
          <Activity size={28} />
          <span className="font-bold text-xl tracking-tight text-slate-800">CogniScaffold</span>
        </div>
        <div className="hidden md:block text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full font-medium">
          Vygotsky Scaffolding Assistant
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto p-6">
        <div className={`transition-all duration-500 ease-in-out ${lessonPlan ? 'py-4' : 'py-20 md:py-32'}`}>
          <div className="text-center mb-8">
             {!lessonPlan && (
               <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                 {/* ADDED School Title */}
                 <p className="text-slate-500 font-semibold text-sm tracking-wider mb-2 uppercase">
                   北京市161附属小学-Stem支架
                 </p>

                 <h1 className="text-3xl md:text-5xl font-extrabold text-slate-800 mb-4 tracking-tight">
                   让教学更有<span className="text-blue-600">逻辑</span>
                 </h1>
                 <p className="text-slate-500 text-lg max-w-2xl mx-auto">
                   输入学科概念，AI 自动生成符合认知心理学的“问题支架”与可视化教案。
                 </p>
               </motion.div>
             )}
          </div>

          <form onSubmit={handleSearch} className="max-w-3xl mx-auto space-y-4">
            <div className="flex flex-col md:flex-row gap-3 p-2 bg-white rounded-2xl shadow-xl shadow-blue-100/50 border border-slate-200">
              <select 
                className="bg-slate-50 text-slate-700 text-sm rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 border-r-0 md:border-r border-slate-100"
                value={params.grade}
                onChange={(e) => setParams({...params, grade: e.target.value as GradeLevel})}
              >
                {Object.values(GradeLevel).map(g => <option key={g} value={g}>{g}</option>)}
              </select>

              <select 
                className="bg-slate-50 text-slate-700 text-sm rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 border-r-0 md:border-r border-slate-100"
                value={params.subject}
                onChange={(e) => setParams({...params, subject: e.target.value as SubjectType})}
              >
                {Object.values(SubjectType).map(s => <option key={s} value={s}>{s}</option>)}
              </select>

              <div className="flex-1 relative">
                <input 
                  type="text" 
                  placeholder="输入概念点 (例如: 浮力、比喻句...)"
                  className="w-full h-full pl-4 pr-12 py-3 bg-transparent text-slate-800 placeholder-slate-400 focus:outline-none font-medium"
                  value={params.concept}
                  onChange={(e) => setParams({...params, concept: e.target.value})}
                />
                {params.concept && (
                  <button 
                    type="button" 
                    onClick={() => setParams({...params, concept: ''})}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
                  >
                    ✕
                  </button>
                )}
              </div>

              <button 
                type="submit"
                disabled={loading || !params.concept}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px]"
              >
                <Search size={18} strokeWidth={2.5} />
                <span>{loading ? '生成中...' : '生成支架'}</span>
              </button>
            </div>
          </form>
        </div>

        {loading && <LoadingState />}
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 text-center mt-8">
            {error}
          </div>
        )}

        <div ref={resultsRef}>
          {lessonPlan && (
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-8 pb-20"
            >
              {/* Section 1: Lesson Summary Card */}
              <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4 relative z-10">
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                        <div>
                             <h2 className="text-2xl font-bold text-slate-800">{lessonPlan.topic}</h2>
                             <p className="text-slate-500 text-sm mt-1 font-medium">{lessonPlan.grade} • {lessonPlan.subject}</p>
                        </div>
                        {/* INTEGRATED TTS TOOLBAR */}
                        <div className="hidden md:block">
                            <TTSToolbar textToRead={`${lessonPlan.topic}. ${lessonPlan.summary}`} />
                        </div>
                    </div>
                  </div>
                </div>
                
                {/* Mobile TTS Toolbar */}
                <div className="block md:hidden mb-4 relative z-10">
                     <TTSToolbar textToRead={`${lessonPlan.topic}. ${lessonPlan.summary}`} />
                </div>

                <p className="text-slate-700 leading-relaxed relative z-10">{lessonPlan.summary}</p>
              </div>

              {/* Section 2: Science Simulation Module (Standalone) */}
              {lessonPlan.simulationData && (
                 <Suspense fallback={<div className="w-full h-64 bg-slate-100 rounded-xl animate-pulse" />}>
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }} 
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                       <D3ScienceSimulator data={lessonPlan.simulationData} />
                    </motion.div>
                 </Suspense>
              )}

              {/* Section 3: Scaffolding Steps Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Navigation List */}
                <div className="lg:col-span-1 space-y-3">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 mb-2 flex justify-between">
                    <span>教学环节引导</span>
                    <span className="text-blue-200">STEP BY STEP</span>
                  </h3>
                  {lessonPlan.steps.map((step, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveStep(idx)}
                      className={`w-full text-left p-4 rounded-xl transition-all duration-200 border flex items-start gap-3 group relative overflow-hidden ${
                        activeStep === idx 
                          ? 'bg-slate-800 text-white border-slate-800 shadow-lg scale-[1.02]' 
                          : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:bg-blue-50'
                      }`}
                    >
                      <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 ${
                        activeStep === idx ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-blue-600'
                      }`}>
                        {step.stepNumber}
                      </div>
                      <div className="relative z-10">
                        <div className="font-bold text-sm">{step.phaseName}</div>
                        <div className={`text-xs mt-1 line-clamp-1 ${activeStep === idx ? 'text-slate-300' : 'text-slate-400'}`}>
                          {step.cognitiveGoal}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Detail Content */}
                <div className="lg:col-span-2">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeStep}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                      className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[500px]"
                    >
                      <div className="bg-slate-50 p-4 border-b border-slate-100 flex items-center gap-2">
                        <Sparkles className="text-amber-500" size={18} fill="currentColor" fillOpacity={0.2} />
                        <span className="font-bold text-slate-700">
                          {lessonPlan.steps[activeStep].phaseName} - 实操指导
                        </span>
                      </div>

                      <div className="p-6 md:p-8 space-y-8">
                        
                        {/* Dialog Section */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-2 text-blue-600 font-semibold text-sm">
                             <div className="flex items-center gap-2">
                                <HelpCircle size={16} /> 
                                <span>关键提问 (Teacher Script)</span>
                             </div>
                             <TTSToolbar textToRead={lessonPlan.steps[activeStep].teacherScript} />
                          </div>
                          <div className="bg-blue-50/30 border-l-4 border-blue-500 p-5 rounded-r-xl">
                            <p className="text-lg text-slate-800 font-medium leading-relaxed">
                              "{lessonPlan.steps[activeStep].teacherScript}"
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">预设回答</div>
                          <p className="text-slate-600 italic pl-4 border-l-2 border-slate-100">
                            {lessonPlan.steps[activeStep].studentExpectedResponse}
                          </p>
                        </div>

                        <div className="border-t border-slate-100 pt-8">
                           {renderVisualSection(lessonPlan.steps[activeStep])}
                        </div>

                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </main>
      
      <footer className="py-6 text-center text-slate-400 text-sm bg-white border-t border-slate-100">
        <p>© {new Date().getFullYear()} CogniScaffold. AI 驱动的认知心理学备课助手。</p>
      </footer>
    </div>
  );
};

export default App;
