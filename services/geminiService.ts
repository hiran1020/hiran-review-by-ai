
import { GoogleGenAI, Type } from "@google/genai";
import { ReviewResult } from '../types';
import { GEMINI_MODEL, LANGUAGES } from '../constants';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const feedbackItemSchema = {
    type: Type.OBJECT,
    properties: {
        line: { type: Type.STRING, description: "The line number or range for the feedback (e.g., '15' or '23-25'). Use 'N/A' if not applicable to a specific line." },
        issue: { type: Type.STRING, description: "A concise description of the issue or area for improvement." },
        recommendation: { type: Type.STRING, description: "The suggested fix or improvement." },
        problemCode: {
            type: Type.STRING,
            description: "A snippet of the original code that has the issue. Use markdown format. Omit if not applicable."
        },
        codeExample: { 
            type: Type.STRING, 
            description: "A brief code snippet demonstrating the recommended change. Use markdown format. This should be the 'after' to the 'problemCode's 'before'. Omit if not applicable." 
        }
    },
    required: ["line", "issue", "recommendation"]
};

const reviewSchema = {
    type: Type.OBJECT,
    properties: {
        overallSummary: { 
            type: Type.STRING,
            description: "A brief, high-level summary of the code quality and key findings, written in a professional and constructive tone."
        },
        bugs: { type: Type.ARRAY, description: "A list of potential bugs, logic errors, or correctness issues.", items: feedbackItemSchema },
        security: { type: Type.ARRAY, description: "A list of security vulnerabilities (e.g., XSS, injection flaws, insecure secrets handling).", items: feedbackItemSchema },
        performance: { type: Type.ARRAY, description: "A list of performance issues or suggestions for optimization (e.g., inefficient algorithms, memory leaks).", items: feedbackItemSchema },
        improvementsAndBestPractices: { type: Type.ARRAY, description: "Suggestions for modern best practices (e.g., newer language features, detecting redundant or dead code).", items: feedbackItemSchema },
        clarityAndStyle: { type: Type.ARRAY, description: "Issues related to code style, formatting, naming, and readability.", items: feedbackItemSchema },
        documentation: { type: Type.ARRAY, description: "Suggestions for adding or improving documentation.", items: feedbackItemSchema },
        architecture: { type: Type.ARRAY, description: "High-level feedback on software architecture, design patterns, and structural improvements.", items: feedbackItemSchema },
        codeSmells: { type: Type.ARRAY, description: "A list of code smells, which are indicators of deeper problems in the code (e.g., long methods, large classes, inappropriate intimacy).", items: feedbackItemSchema },
        fullRefactoredCode: {
            type: Type.STRING,
            description: "The complete, refactored code with all suggestions applied. This should be the full file, enhanced for correctness, clarity, performance, and security. It must be a valid, runnable code block."
        }
    },
    required: ["overallSummary", "bugs", "security", "performance", "improvementsAndBestPractices", "clarityAndStyle", "documentation", "architecture", "codeSmells", "fullRefactoredCode"]
};


const buildSystemInstruction = (options: {
    isDiff?: boolean;
    framework?: string;
    context?: string;
    focus?: string[];
}) => {
    let instruction = `You are a world-class senior software engineer providing an expert code review. Your goal is to give constructive, actionable feedback to help developers improve their code.
    - Analyze the code for correctness, security, performance, style, architecture, code smells, and best practices.
    - Be concise and clear in your feedback.
    - For all suggestions, if it makes sense, provide BOTH the problematic code snippet ('problemCode') and the corrected code snippet ('codeExample'). This creates a clear 'before and after' comparison.
    - After providing detailed feedback, generate a complete, fully refactored version of the original code in the 'fullRefactoredCode' field. This new version should incorporate all your suggestions for bugs, performance, clarity, security, and best practices.
    - Structure your entire response according to the provided JSON schema. Do not add any text, markdown, or special characters outside of the valid JSON structure.`;

    if (options.isDiff) {
        instruction += "\n- You are reviewing a git diff. Focus on the changes indicated by '+' and '-' lines. Provide context-aware feedback based on these changes. The 'fullRefactoredCode' field should represent what the file would look like after applying the diff and your suggestions.";
    }
    if (options.framework) {
        instruction += `\n- The code uses the ${options.framework} framework/library. Apply specific best practices and conventions for ${options.framework}.`;
    }
    if (options.context) {
        instruction += `\n- Here is additional context about the project: "${options.context}". Keep this in mind during your review.`;
    }
    if (options.focus && options.focus.length > 0) {
        instruction += `\n- Pay special attention to the following areas: ${options.focus.join(', ')}. Prioritize feedback related to these points. This includes detailed security analysis for vulnerabilities, performance bottleneck detection, architectural soundness, code smell identification, and adherence to modern best practices.`;
    }
    return instruction;
};

export const detectLanguage = async (code: string): Promise<string> => {
    // Exclude special-purpose 'auto' and 'diff' from the list for detection
    const languageOptions = LANGUAGES
        .filter(l => l.value !== 'auto' && l.value !== 'diff')
        .map(l => l.value)
        .join(', ');

    const systemInstruction = `You are a programming language detection tool.
    - Analyze the provided code snippet.
    - Identify the programming language from the following list: ${languageOptions}.
    - Respond with ONLY the lowercase value for the language (e.g., 'javascript', 'python').
    - If the language is not in the list or cannot be determined, respond with 'unknown'.`;
    
    const prompt = `\`\`\`\n${code.substring(0, 2000)}\n\`\`\``; // Use a substring to be efficient

    try {
        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: prompt,
            config: { systemInstruction }
        });
        const detectedLang = response.text.trim().toLowerCase();
        
        if (detectedLang === 'unknown' || !LANGUAGES.some(l => l.value === detectedLang)) {
            throw new Error("Could not automatically detect the language. Please select it manually.");
        }
        
        return detectedLang;

    } catch (error) {
        console.error("Error detecting language:", error);
        if (error instanceof Error) throw error;
        throw new Error("Failed to auto-detect language due to an API error.");
    }
};


export const reviewCode = async (code: string, language: string, options: {
    isDiff?: boolean;
    framework?: string;
    context?: string;
    focus?: string[];
}): Promise<ReviewResult> => {
    const systemInstruction = buildSystemInstruction(options);
    const effectiveLanguage = options.isDiff ? 'diff' : language;
    const prompt = `Please review the following ${effectiveLanguage} code:\n\n\`\`\`${effectiveLanguage}\n${code}\n\`\`\``;

    try {
        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: prompt,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: reviewSchema
            }
        });
        
        const jsonText = response.text.trim();
        const parsedResult = JSON.parse(jsonText);

        const requiredKeys: (keyof ReviewResult)[] = ["overallSummary", "bugs", "security", "performance", "improvementsAndBestPractices", "clarityAndStyle", "documentation", "architecture", "codeSmells", "fullRefactoredCode"];
        for (const key of requiredKeys) {
            if (parsedResult[key] === undefined) {
                 throw new Error(`API response missing required key: ${key}`);
            }
        }

        return parsedResult as ReviewResult;
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        if (error instanceof Error) {
             throw new Error(`Failed to get review from Gemini: ${error.message}`);
        }
        throw new Error("An unknown error occurred while fetching the review.");
    }
};

export const generateCommitMessage = async (diff: string): Promise<string> => {
    const systemInstruction = `You are an expert programmer who writes concise and professional commit messages.
    - Analyze the provided git diff.
    - Generate a commit message following the Conventional Commits specification (e.g., 'feat: ...', 'fix: ...', 'docs: ...', 'refactor: ...').
    - The commit message should have a subject line of 50 characters or less.
    - After the subject line, include a blank line followed by a more detailed description of the changes if necessary.
    - Respond with only the raw text of the commit message. Do not include any markdown or extra formatting.`;
    const prompt = `Generate a conventional commit message for the following diff:\n\n\`\`\`diff\n${diff}\n\`\`\``;

    try {
        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: prompt,
            config: { systemInstruction }
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error generating commit message:", error);
        throw new Error("Failed to generate commit message.");
    }
};

export const explainCode = async (code: string, language: string, context: string): Promise<string> => {
    const systemInstruction = `You are a helpful programming assistant who explains code clearly and concisely.
    - Analyze the provided code snippet.
    - Explain its purpose, how it works, and any key algorithms or patterns used.
    - If there is context provided, use it to tailor your explanation.
    - Format your response using markdown for readability.`;
    const prompt = `Here is the project context: "${context || 'No context provided.'}"

    Please explain the following ${language} code:\n\n\`\`\`${language}\n${code}\n\`\`\``;

    try {
        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: prompt,
            config: { systemInstruction }
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error explaining code:", error);
        throw new Error("Failed to explain code.");
    }
};