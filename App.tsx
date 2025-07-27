
import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { CodeInput } from './components/CodeInput';
import { ReviewOutput } from './components/ReviewOutput';
import { reviewCode, generateCommitMessage, explainCode, detectLanguage } from './services/geminiService';
import { ReviewResult } from './types';
import { LANGUAGES, REVIEW_FOCUS_OPTIONS } from './constants';

interface ReviewHistoryItem {
  code: string;
  language: string;
  review: ReviewResult | null;
  explanation: string | null;
  commitMessage: string | null;
  timestamp: number;
}

function App() {
  const [code, setCode] = useState<string>('');
  const [language, setLanguage] = useState<string>('auto'); // Default to auto-detect
  const [review, setReview] = useState<ReviewResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // State for new features
  const [explanation, setExplanation] = useState<string | null>(null);
  const [commitMessage, setCommitMessage] = useState<string | null>(null);

  const [reviewType, setReviewType] = useState<'file' | 'diff'>('file');
  const [framework, setFramework] = useState<string>('');
  const [projectContext, setProjectContext] = useState<string>('');
  const [focusAreas, setFocusAreas] = useState<Set<string>>(
    new Set(REVIEW_FOCUS_OPTIONS) // Default to all areas enabled
  );

  const [reviewHistory, setReviewHistory] = useState<ReviewHistoryItem[]>([]);
  const [selectedHistory, setSelectedHistory] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const clearResults = () => {
    setReview(null);
    setExplanation(null);
    setCommitMessage(null);
    setError(null);
  }

  const handleReview = useCallback(async () => {
    if (!code.trim()) {
      setError("Please enter some code or a diff to review.");
      return;
    }
    setIsLoading(true);
    clearResults();

    try {
      let effectiveLanguage = language;
      if (language === 'auto' && reviewType === 'file') {
        const detectedLang = await detectLanguage(code);
        setLanguage(detectedLang); // Update the UI
        effectiveLanguage = detectedLang;
      }
      
      const reviewOptions = {
          isDiff: reviewType === 'diff',
          framework,
          context: projectContext,
          focus: Array.from(focusAreas) as string[],
      };

      const result = await reviewCode(code, effectiveLanguage, reviewOptions);
      setReview(result);
      setReviewHistory((prev: ReviewHistoryItem[]) => [
        {
          code,
          language: effectiveLanguage,
          review: result,
          explanation: null,
          commitMessage: null,
          timestamp: Date.now(),
        },
        ...prev
      ]);
      setSelectedHistory(null);
    } catch (e) {
        if (e instanceof Error) {
            setError(`An error occurred: ${e.message}. Please check your API key and try again.`);
        } else {
            setError("An unknown error occurred.");
        }
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [code, language, reviewType, framework, projectContext, focusAreas]);
  
  const handleExplain = useCallback(async () => {
    if (!code.trim()) {
      setError("Please enter some code to explain.");
      return;
    }
    setIsLoading(true);
    clearResults();
    
    try {
      let effectiveLanguage = language;
      if (language === 'auto') {
        const detectedLang = await detectLanguage(code);
        setLanguage(detectedLang); // Update the UI
        effectiveLanguage = detectedLang;
      }
      const result = await explainCode(code, effectiveLanguage, projectContext);
      setExplanation(result);
      setReviewHistory((prev: ReviewHistoryItem[]) => [
        {
          code,
          language: effectiveLanguage,
          review: null,
          explanation: result,
          commitMessage: null,
          timestamp: Date.now(),
        },
        ...prev
      ]);
      setSelectedHistory(null);
    } catch (e) {
      if (e instanceof Error) {
          setError(`An error occurred: ${e.message}.`);
      } else {
          setError("An unknown error occurred.");
      }
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [code, language, projectContext]);

  const handleGenerateCommit = useCallback(async () => {
    if (reviewType !== 'diff' || !code.trim()) {
      setError("Please provide a git diff to generate a commit message.");
      return;
    }
    setIsLoading(true);
    clearResults();

    try {
      const result = await generateCommitMessage(code);
      setCommitMessage(result);
      setReviewHistory((prev: ReviewHistoryItem[]) => [
        {
          code,
          language,
          review: null,
          explanation: null,
          commitMessage: result,
          timestamp: Date.now(),
        },
        ...prev
      ]);
      setSelectedHistory(null);
    } catch (e) {
      if (e instanceof Error) {
          setError(`An error occurred: ${e.message}.`);
      } else {
          setError("An unknown error occurred.");
      }
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [code, reviewType, language]);

  // Download feedback as Markdown
  const handleDownloadMarkdown = () => {
    let content = '';
    if (review) {
      content += `# Code Review Feedback\n\n`;
      content += `**Language:** ${language}\n\n`;
      content += `\n\n## Overall Summary\n${review.overallSummary}\n`;
      // Add more sections as needed
    }
    if (explanation) {
      content += `# Code Explanation\n\n${explanation}\n`;
    }
    if (commitMessage) {
      content += `# Commit Message\n\n${commitMessage}\n`;
    }
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ai-feedback.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Show detected language badge
  const DetectedLanguageBadge = () => (
    <span style={{
      background: '#222',
      color: '#0ff',
      borderRadius: '6px',
      padding: '2px 8px',
      fontSize: '0.9em',
      marginLeft: '8px',
      border: '1px solid #0ff',
    }}>{language !== 'auto' ? language : ''}</span>
  );

  const handleFocusChange = (area: string) => {
    setFocusAreas(prev => {
        const newFocus = new Set(prev);
        if (newFocus.has(area)) {
            newFocus.delete(area);
        } else {
            newFocus.add(area);
        }
        return newFocus;
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans flex flex-row">
      {/* Sidebar Navigation */}
      <aside className={`bg-gray-900/90 border-r border-gray-800 p-4 flex flex-col transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-14'} min-h-screen sticky top-0 z-20`}
        style={{ minWidth: sidebarOpen ? 220 : 56 }}>
        <button
          className="mb-4 p-2 rounded bg-gray-800 hover:bg-gray-700 text-cyan-400 focus:outline-none"
          onClick={() => setSidebarOpen((open) => !open)}
          aria-label={sidebarOpen ? 'Collapse history sidebar' : 'Expand history sidebar'}
          title={sidebarOpen ? 'Collapse history sidebar' : 'Expand history sidebar'}
        >
          {sidebarOpen ? '<' : '>'}
        </button>
        {sidebarOpen && (
          <>
            <h3 className="text-lg font-semibold text-cyan-400 mb-2">Review History</h3>
            {reviewHistory.length === 0 ? <div className="text-gray-500">No history yet.</div> : (
              <ul className="space-y-2">
                {reviewHistory.map((item, idx) => (
                  <li key={item.timestamp}>
                    <button
                      className={`w-full text-left px-2 py-1 rounded ${selectedHistory === idx ? 'bg-cyan-700 text-white' : 'bg-gray-800 text-cyan-200 hover:bg-cyan-900'}`}
                      onClick={() => {
                        setSelectedHistory(idx);
                        setCode(item.code);
                        setLanguage(item.language);
                        setReview(item.review);
                        setExplanation(item.explanation);
                        setCommitMessage(item.commitMessage);
                      }}
                    >
                      {item.language.toUpperCase()} @ {new Date(item.timestamp).toLocaleTimeString()}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </aside>
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow w-full flex flex-col lg:flex-row gap-8 px-4 py-8">
          {/* Code Input on the left/top */}
          <div className="w-full lg:w-1/2 flex flex-col gap-4">
            <CodeInput
              code={code}
              setCode={setCode}
              language={language}
              setLanguage={setLanguage}
              onReview={handleReview}
              onExplain={handleExplain}
              onGenerateCommit={handleGenerateCommit}
              isLoading={isLoading}
              reviewType={reviewType}
              setReviewType={setReviewType}
              framework={framework}
              setFramework={setFramework}
              projectContext={projectContext}
              setProjectContext={setProjectContext}
              focusAreas={focusAreas}
              onFocusChange={handleFocusChange}
            />
          </div>
          {/* Review Output on the right/bottom */}
          <div className="w-full lg:w-1/2 flex flex-col gap-4">
            <div className="flex items-center gap-4 mb-4">
              {language !== 'auto' && <DetectedLanguageBadge />}
              <button onClick={handleDownloadMarkdown} style={{ background: '#0ff', color: '#222', border: 'none', borderRadius: 6, padding: '6px 12px', fontWeight: 600, cursor: 'pointer' }}>Download Feedback</button>
            </div>
            <ReviewOutput
              review={review}
              explanation={explanation}
              commitMessage={commitMessage}
              isLoading={isLoading}
              error={error}
              code={code}
              language={language}
            />
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;