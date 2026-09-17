import React, { useState } from 'react';
import { 
  Sparkles, 
  Send, 
  Bot, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  HelpCircle,
  FileSpreadsheet,
  AlertTriangle,
  Building2
} from 'lucide-react';
import { askAIPerformanceAnalyst, AIAnalysisResponse } from '../services/aiService';

export const AIPerformanceAnalyst: React.FC = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<AIAnalysisResponse | null>(null);

  const sampleQuestions = [
    'Which public entities currently require urgent management attention?',
    'Which agreed KPIs are showing declining performance trends?',
    'Analyse funding expenditure versus service delivery output variance',
    'Synthesize an executive briefing memo on current Q3 reporting compliance',
  ];

  const handleAsk = async (questionText: string) => {
    setLoading(true);
    setQuery(questionText);
    try {
      const result = await askAIPerformanceAnalyst(questionText);
      setResponse(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 text-white rounded-xl p-6 shadow-md border border-slate-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded border border-emerald-700/60 w-fit">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Grounded Government Intelligence Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-2 font-['Cabinet_Grotesk'] tracking-tight">
              AI Performance Analyst
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl">
              Strictly grounded inquiry assistant designed for DSAC Executive Management and Oversight Directors. Analyzes verified entity returns without hallucinations or unsupported claims.
            </p>
          </div>

          <div className="p-3 bg-slate-800/80 border border-slate-700 rounded-lg text-xs text-slate-300 max-w-xs">
            <strong className="text-emerald-400">Responsible AI:</strong> All outputs cite verified departmental datasets and serve as advisory decision-support.
          </div>
        </div>

        {/* Input Bar */}
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            if (query.trim()) handleAsk(query.trim());
          }}
          className="mt-6 flex gap-2"
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask anything about entity delivery, KPI delays, budgets, or audit findings..."
            className="flex-1 px-4 py-3 bg-slate-950/80 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-bold shadow transition-colors flex items-center gap-2"
          >
            {loading ? (
              <span className="animate-spin">⏳</span>
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">Analyse</span>
          </button>
        </form>

        {/* Sample Quick Prompts */}
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="text-slate-400 self-center text-[11px] font-semibold">Suggested Inquiries:</span>
          {sampleQuestions.map((q, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleAsk(q)}
              className="bg-slate-800/80 hover:bg-slate-750 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg border border-slate-700 transition-colors text-left"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* AI Response Card */}
      {response && (
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
              <Bot className="w-4 h-4 text-emerald-600" />
              <span>Grounded Performance Intelligence Output</span>
            </div>
            <span className="text-[11px] text-slate-400">Timestamp: {new Date().toLocaleTimeString()}</span>
          </div>

          {/* Key Grounded Metrics Chips */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {response.groundedMetrics.map((m, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                <div className="text-slate-500 text-[11px]">{m.label}</div>
                <div className="font-bold text-slate-900 mt-0.5 text-sm">{m.value}</div>
              </div>
            ))}
          </div>

          {/* Core Response Markdown-like block */}
          <div className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line bg-slate-50/60 p-5 rounded-xl border border-slate-200">
            {response.answer}
          </div>

          {/* Grounded Source Citations */}
          <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 text-xs space-y-2">
            <div className="font-bold text-emerald-900 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-emerald-700" />
              <span>Verified Departmental Data Sources Grounding this Synthesis:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {response.sourceEntities.map((ent, i) => (
                <span key={i} className="px-2.5 py-1 bg-white rounded border border-emerald-300 text-emerald-800 font-semibold text-[11px]">
                  {ent}
                </span>
              ))}
            </div>
          </div>

          {/* Actionable Recommendations */}
          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Recommended Management Actions:
            </div>
            <div className="space-y-1.5">
              {response.recommendedActions.map((act, i) => (
                <div key={i} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-800 flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span>{act}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Responsible AI Disclaimer */}
          <div className="pt-4 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{response.responsibleAIDisclaimer}</span>
          </div>
        </div>
      )}
    </div>
  );
};
