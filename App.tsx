
import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { CodeInput } from './components/CodeInput';
import { ReviewOutput } from './components/ReviewOutput';
import { reviewCode, generateCommitMessage, explainCode, detectLanguage } from './services/geminiService';
import { ReviewResult } from './types';
import { LANGUAGES, REVIEW_FOCUS_OPTIONS } from './constants';

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
          focus: Array.from(focusAreas),
      };

      const result = await reviewCode(code, effectiveLanguage, reviewOptions);
      setReview(result);
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
  }, [code, reviewType]);


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
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
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
        <ReviewOutput
          review={review}
          explanation={explanation}
          commitMessage={commitMessage}
          isLoading={isLoading}
          error={error}
        />
      </main>
    </div>
  );
}

export default App;