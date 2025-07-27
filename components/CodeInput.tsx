import React, { useEffect } from 'react';
import { LANGUAGES, REVIEW_FOCUS_OPTIONS } from '../constants';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { FaSun, FaMoon } from 'react-icons/fa';

interface CodeInputProps {
  code: string;
  setCode: (code: string) => void;
  language: string;
  setLanguage: (lang: string) => void;
  onReview: () => void;
  onExplain: () => void;
  onGenerateCommit: () => void;
  isLoading: boolean;
  reviewType: 'file' | 'diff';
  setReviewType: (type: 'file' | 'diff') => void;
  framework: string;
  setFramework: (f: string) => void;
  projectContext: string;
  setProjectContext: (c: string) => void;
  focusAreas: Set<string>;
  onFocusChange: (area: string) => void;
}

const LoadingSpinner = () => (
  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const ToggleSwitch: React.FC<{enabled: boolean, onChange: (enabled: boolean) => void, enabledLabel: string, disabledLabel: string}> = ({ enabled, onChange, enabledLabel, disabledLabel }) => (
    <div className="flex items-center justify-center">
        <span className={`mr-3 text-sm font-medium ${!enabled ? 'text-white' : 'text-gray-400'}`}>{disabledLabel}</span>
        <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={enabled} onChange={(e) => onChange(e.target.checked)} className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-4 peer-focus:ring-cyan-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
        </label>
        <span className={`ml-3 text-sm font-medium ${enabled ? 'text-white' : 'text-gray-400'}`}>{enabledLabel}</span>
    </div>
);


export const CodeInput: React.FC<CodeInputProps & { theme?: 'dark' | 'light', onToggleTheme?: () => void }> = (props) => {
  const { 
    code, setCode, language, setLanguage, onReview, onExplain, onGenerateCommit, isLoading,
    reviewType, setReviewType, framework, setFramework, projectContext, setProjectContext,
    focusAreas, onFocusChange, theme = 'dark', onToggleTheme
  } = props;
    
  const handleReviewTypeChange = (isDiff: boolean) => {
      const newType = isDiff ? 'diff' : 'file';
      setReviewType(newType);
      if (newType === 'diff') {
          setLanguage('diff');
      } else {
          setLanguage('auto'); // Reset to auto-detect when switching back to file mode
      }
  };

  useEffect(() => {
    if (language === 'auto' && code.trim().startsWith('curl')) {
      setLanguage('bash');
    }
  }, [code, language, setLanguage]);

  const handleClear = () => {
    setCode('');
    setFramework('');
    setProjectContext('');
    setLanguage('auto');
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-2xl p-6 flex flex-col h-full space-y-4">
      
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-semibold text-gray-200 mb-4">Your Code</h2>
        {onToggleTheme && (
          <button
            onClick={onToggleTheme}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="ml-2 p-2 rounded-full bg-gray-700 hover:bg-gray-600 text-cyan-400"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <FaSun /> : <FaMoon />}
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block w-full p-2.5 transition"
              disabled={reviewType === 'diff'}
              title={reviewType === 'diff' ? 'Language is set to Git Diff' : ''}
            >
              {LANGUAGES.map(lang => (
                <option key={lang.value} value={lang.value}>{lang.label}</option>
              ))}
            </select>
            <input
                type="text"
                value={framework}
                onChange={(e) => setFramework(e.target.value)}
                placeholder="Framework/Library (e.g. React)"
                className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block w-full p-2.5 transition"
            />
        </div>
        <textarea
            value={projectContext}
            onChange={(e) => setProjectContext(e.target.value)}
            placeholder="Optional: Provide project context (e.g., 'This is a user authentication service in a microservices architecture.')"
            rows={2}
            className="mt-4 w-full bg-gray-700 border border-gray-600 rounded-md p-2.5 font-sans text-sm text-gray-300 resize-y focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
        />

      <div className="border-t border-gray-700 pt-4">
         <h3 className="text-lg font-semibold text-gray-300 mb-3">Review Configuration</h3>
         <div className="flex justify-between items-center bg-gray-700/50 p-3 rounded-lg">
            <label className="font-medium text-gray-300">Review Type</label>
             <ToggleSwitch 
                enabled={reviewType === 'diff'}
                onChange={handleReviewTypeChange}
                disabledLabel="File Content"
                enabledLabel="Git Diff"
             />
         </div>
      </div>
        
      <div className="border-t border-gray-700 pt-4">
        <h3 className="text-lg font-semibold text-gray-300 mb-3">Review Focus</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {REVIEW_FOCUS_OPTIONS.map(area => (
            <label key={area} className="flex items-center space-x-2 cursor-pointer bg-gray-700/50 p-2 rounded-md hover:bg-gray-700 transition">
              <input
                type="checkbox"
                checked={focusAreas.has(area)}
                onChange={() => onFocusChange(area)}
                className="w-4 h-4 text-cyan-600 bg-gray-600 border-gray-500 rounded focus:ring-cyan-500"
              />
              <span className="text-sm font-medium text-gray-300">{area}</span>
            </label>
          ))}
        </div>
      </div>
      
      <div className="flex-grow flex flex-col">
        <div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={reviewType === 'diff' ? 'Paste your git diff here...' : 'Paste your code here...'}
            className="flex-grow bg-gray-900 border border-gray-700 rounded-md p-4 font-mono text-sm text-gray-300 resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500 transition w-full min-h-[300px] lg:min-h-0 mb-2"
            style={{ fontFamily: 'Fira Mono, Menlo, monospace', background: theme === 'dark' ? '#18181b' : '#f3f4f6', color: theme === 'dark' ? '#e5e7eb' : '#222' }}
          />
          {/* Syntax highlighted preview below textarea */}
          {code && (
            <div className="mt-2 rounded-lg overflow-hidden border border-gray-700 bg-gray-900">
              <SyntaxHighlighter language={language === 'auto' ? 'javascript' : language} style={atomDark} customStyle={{ margin: 0, borderRadius: 8, fontSize: '1em' }}>
                {code}
              </SyntaxHighlighter>
            </div>
          )}
        </div>
      </div>
      
      <div className="space-y-3">
        <button
          onClick={onReview}
          disabled={isLoading}
          title="Run a full code review"
          className="w-full flex items-center justify-center bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-800 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out shadow-lg transform hover:scale-105 disabled:scale-100"
        >
          {isLoading ? <LoadingSpinner /> : null}
          {isLoading ? 'Auditing Code...' : 'Review My Code'}
        </button>
        <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onExplain}
              disabled={isLoading}
              title="Get a plain-English explanation of your code"
              className="w-full flex items-center justify-center bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg transition"
            >
              Explain Code
            </button>
            <button
              onClick={onGenerateCommit}
              disabled={isLoading || reviewType !== 'diff'}
              title={reviewType !== 'diff' ? 'Only available for Git Diffs' : 'Generate a commit message for this diff'}
              className="w-full flex items-center justify-center bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg transition"
            >
              Generate Commit
            </button>
        </div>
        <button
          onClick={handleClear}
          disabled={isLoading}
          title="Clear all fields"
          className="w-full mt-2 flex items-center justify-center bg-gray-700 hover:bg-gray-800 disabled:bg-gray-900 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg transition"
        >
          Clear
        </button>
      </div>

    </div>
  );
};