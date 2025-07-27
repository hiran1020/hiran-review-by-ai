
import React, { useState } from 'react';
import { ReviewResult, FeedbackItem } from '../types';

interface ReviewOutputProps {
  review: ReviewResult | null;
  explanation: string | null;
  commitMessage: string | null;
  isLoading: boolean;
  error: string | null;
}

const BugIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 8l2-2m0 0l2 2m-2-2v4m-4-4H8m4 0L8 4m0 0L6 6m2-2v4m0 0H4m16 8l-2 2m0 0l-2-2m2 2v-4m4 4h-4m-4 0l-2-2m0 0l-2 2m2-2v-4m0 0H4" /></svg>;
const SuggestionIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>;
const StyleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>;
const SecurityIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>;
const PerformanceIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
const DocsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const ArchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400" viewBox="0 0 20 20" fill="currentColor"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg>;
const SmellIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-7.536 5.879a1 1 0 011.415 0 3 3 0 004.242 0 1 1 0 011.415-1.415 5 5 0 01-7.072 0 1 1 0 010-1.415z" clipRule="evenodd" /></svg>;
const SparklesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-300" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.25a.75.75 0 0 1 .75.75v.518a10.476 10.476 0 0 1 5.992 2.055.75.75 0 0 1-.588 1.336 9.006 9.006 0 0 0-11.808 0 .75.75 0 0 1-.588-1.336A10.476 10.476 0 0 1 11.25 3.518V3a.75.75 0 0 1 .75-.75Zm0 19.5a.75.75 0 0 1-.75-.75v-.518a10.476 10.476 0 0 1-5.992-2.055.75.75 0 0 1 .588-1.336 9.006 9.006 0 0 0 11.808 0 .75.75 0 0 1 .588 1.336 10.476 10.476 0 0 1-5.992 2.055v.518a.75.75 0 0 1-.75-.75ZM3.518 11.25H3a.75.75 0 0 1-.75-.75 10.476 10.476 0 0 1 2.055-5.992.75.75 0 0 1 1.336.588 9.006 9.006 0 0 0 0 11.808.75.75 0 0 1-1.336.588A10.476 10.476 0 0 1 2.25 12.75H3.518a.75.75 0 0 1 0-1.5ZM20.482 12.75H21a.75.75 0 0 1 .75.75 10.476 10.476 0 0 1-2.055 5.992.75.75 0 0 1-1.336-.588 9.006 9.006 0 0 0 0-11.808.75.75 0 0 1 1.336-.588A10.476 10.476 0 0 1 21.75 11.25h-1.268a.75.75 0 0 1 0 1.5Z"/></svg>;


const SkeletonLoader: React.FC = () => (
  <div className="animate-pulse space-y-6">
    <div className="h-6 bg-gray-700 rounded w-1/3"></div>
    <div className="h-16 bg-gray-700 rounded"></div>
    <div className="space-y-4">
      <div className="h-5 bg-gray-700 rounded w-1/4"></div>
      <div className="h-24 bg-gray-700 rounded"></div>
    </div>
  </div>
);

const CopyButton: React.FC<{ text: string, label?:string }> = ({ text, label = 'Copy' }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        const textToCopy = text.replace(/```[a-z]*\n?|```/g, '').trim();
        navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button 
            onClick={handleCopy} 
            className="absolute top-2 right-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold py-1 px-2 rounded transition-colors"
            aria-label="Copy"
        >
            {copied ? 'Copied!' : label}
        </button>
    );
};

const CodeComparison: React.FC<{ problemCode: string, solutionCode: string }> = ({ problemCode, solutionCode }) => {
    const formatCode = (code: string) => code.replace(/```[a-z]*\n?|```/g, '').trim();

    return (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Problem Code */}
            <div className="bg-red-900/20 border border-red-700/30 rounded-lg">
                <div className="flex justify-between items-center bg-red-900/30 px-3 py-1 rounded-t-lg">
                    <h4 className="text-sm font-semibold text-red-300">Problem</h4>
                </div>
                <div className="relative">
                    <pre className="p-3 overflow-x-auto">
                        <code className="text-sm text-red-300/80 font-mono">
                            {formatCode(problemCode)}
                        </code>
                    </pre>
                    <CopyButton text={problemCode} />
                </div>
            </div>

            {/* Solution Code */}
            <div className="bg-green-900/20 border border-green-700/30 rounded-lg">
                 <div className="flex justify-between items-center bg-green-900/30 px-3 py-1 rounded-t-lg">
                    <h4 className="text-sm font-semibold text-green-300">Solution</h4>
                </div>
                <div className="relative">
                     <pre className="p-3 overflow-x-auto">
                        <code className="text-sm text-green-300/90 font-mono">
                            {formatCode(solutionCode)}
                        </code>
                    </pre>
                    <CopyButton text={solutionCode} />
                </div>
            </div>
        </div>
    )
};


const FeedbackCard: React.FC<{ item: FeedbackItem }> = ({ item }) => (
    <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
        <p className="font-mono text-sm text-cyan-400 mb-2">Line: {item.line}</p>
        <p className="text-gray-300 mb-2"><strong className="text-gray-100">Issue:</strong> {item.issue}</p>
        <p className="text-gray-400"><strong className="text-gray-100">Recommendation:</strong> {item.recommendation}</p>
        {item.problemCode && item.codeExample ? (
            <CodeComparison problemCode={item.problemCode} solutionCode={item.codeExample} />
        ) : item.codeExample && (
            <div className="mt-3 relative">
                <strong className="text-gray-100 text-sm">Example:</strong>
                <div className="relative bg-gray-900 rounded-md mt-1">
                    <pre className="p-3 pt-8 overflow-x-auto">
                        <code className="text-sm text-yellow-300 font-mono">
                            {item.codeExample.replace(/```[a-z]*\n?|```/g, '').trim()}
                        </code>
                    </pre>
                    <CopyButton text={item.codeExample} />
                </div>
            </div>
        )}
    </div>
);

const FeedbackSection: React.FC<{ title: string; items: FeedbackItem[] | undefined; icon: React.ReactNode }> = ({ title, items, icon }) => {
    if (!items || items.length === 0) return null;
    return (
        <div>
            <h3 className="text-lg font-semibold text-gray-200 mb-3 flex items-center gap-2">
                {icon}
                {title} ({items.length})
            </h3>
            <div className="space-y-4">
                {items.map((item, index) => <FeedbackCard key={index} item={item} />)}
            </div>
        </div>
    );
}

const renderContent = (props: ReviewOutputProps) => {
    const { review, explanation, commitMessage, isLoading, error } = props;
    
    if (isLoading) return <SkeletonLoader />;
    if (error) return <div className="bg-red-900/50 border border-red-500 text-red-300 p-4 rounded-lg">{error}</div>;

    if (review) {
        return (
            <div className="space-y-8">
                <div>
                    <h3 className="text-lg font-semibold text-gray-200 mb-2">Overall Summary</h3>
                    <p className="text-gray-300 whitespace-pre-wrap">{review.overallSummary}</p>
                </div>
                <FeedbackSection title="Potential Bugs" items={review.bugs} icon={<BugIcon />} />
                <FeedbackSection title="Security Vulnerabilities" items={review.security} icon={<SecurityIcon />} />
                <FeedbackSection title="Performance Improvements" items={review.performance} icon={<PerformanceIcon />} />
                <FeedbackSection title="Architecture" items={review.architecture} icon={<ArchIcon />} />
                <FeedbackSection title="Code Smells" items={review.codeSmells} icon={<SmellIcon />} />
                <FeedbackSection title="Improvements & Best Practices" items={review.improvementsAndBestPractices} icon={<SuggestionIcon />} />
                <FeedbackSection title="Clarity & Style Issues" items={review.clarityAndStyle} icon={<StyleIcon />} />
                <FeedbackSection title="Documentation Suggestions" items={review.documentation} icon={<DocsIcon />} />

                {review.fullRefactoredCode && (
                     <div className="border-t border-gray-700/50 pt-8">
                        <h3 className="text-lg font-semibold text-gray-200 mb-3 flex items-center gap-2">
                            <SparklesIcon />
                            Fully Enhanced Code
                        </h3>
                         <p className="text-sm text-gray-400 mb-4">This is the complete code with all suggestions applied.</p>
                        <div className="relative bg-gray-900 rounded-md border border-gray-700">
                            <pre className="p-4 pt-10 overflow-x-auto">
                                <code className="text-sm text-gray-300 font-mono">
                                    {review.fullRefactoredCode.trim()}
                                </code>
                            </pre>
                            <CopyButton text={review.fullRefactoredCode} label="Copy Full Code" />
                        </div>
                    </div>
                )}
            </div>
        )
    }

    if (explanation) {
        return (
             <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-200">Code Explanation</h3>
                <div className="prose prose-invert prose-sm max-w-none text-gray-300" dangerouslySetInnerHTML={{ __html: explanation.replace(/\n/g, '<br />') }} />
             </div>
        )
    }
    
    if (commitMessage) {
        return (
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-200">Generated Commit Message</h3>
                <div className="relative">
                    <pre className="bg-gray-900 rounded-md p-4 overflow-x-auto text-gray-300 whitespace-pre-wrap">
                        {commitMessage}
                    </pre>
                    <CopyButton text={commitMessage} label="Copy Commit"/>
                </div>
            </div>
        )
    }

    return (
        <div className="text-center text-gray-500 py-16">
            <p className="text-lg">Your results will appear here.</p>
            <p>Select a tool and provide your code to get started.</p>
        </div>
    );
}


export const ReviewOutput: React.FC<ReviewOutputProps> = (props) => {
  const getTitle = () => {
    if (props.review) return "Code Review Feedback";
    if (props.explanation) return "Code Explanation";
    if (props.commitMessage) return "Generated Commit Message";
    if (props.isLoading) return "Analyzing...";
    return "AI Assistant";
  }
  
  return (
    <div className="bg-gray-800 rounded-lg shadow-2xl p-6 overflow-y-auto h-full max-h-[80vh] lg:max-h-full">
      <h2 className="text-xl font-semibold text-gray-200 mb-4 sticky top-0 bg-gray-800 py-2 -mt-6 pt-6 z-10">{getTitle()}</h2>
      <div className="mt-4">
        {renderContent(props)}
      </div>
    </div>
  );
};