'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    X,
    CheckCircle,
    Send,
    Brain,
    MessageSquare,
    Loader2,
    Image as ImageIcon
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ExtractedText } from '@/lib/pdf/text-extraction';

interface AIExplanationModalProps {
    isOpen: boolean;
    extractedText: ExtractedText | null;
    onClose: () => void;
    onUnderstand: () => void;
    bookId: string;
}

export default function AIExplanationModal({
    isOpen,
    extractedText,
    onClose,
    onUnderstand,
    bookId
}: AIExplanationModalProps) {
    const [question, setQuestion] = useState('');
    const [isAsking, setIsAsking] = useState(false);
    const [followUpResponse, setFollowUpResponse] = useState<string | null>(null);
    const followUpRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to follow-up response when it appears
    useEffect(() => {
        if (followUpResponse && followUpRef.current) {
            // Small delay to ensure the content is rendered
            setTimeout(() => {
                followUpRef.current?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                    inline: 'nearest'
                });
            }, 100);
        }
    }, [followUpResponse]);

    if (!isOpen || !extractedText) return null;

    const handleAskQuestion = async () => {
        if (!question.trim() || isAsking) return;

        setIsAsking(true);
        const currentQuestion = question.trim();
        setQuestion(''); // Clear input field immediately

        try {
            // Send follow-up question to AI
            const response = await fetch('/api/ai/question', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question: currentQuestion,
                    context: extractedText.selectedText,
                    bookId,
                    pageNumber: extractedText.pageNumber
                })
            });

            if (response.ok) {
                const data = await response.json();
                setFollowUpResponse(data.answer || data.data?.answer || 'I received your question but had trouble generating a response. Could you try rephrasing it?');
            } else {
                setFollowUpResponse('I had trouble processing your question. Please try again or rephrase it differently.');
            }
        } catch (error) {
            console.error('Error asking follow-up question:', error);
            setFollowUpResponse('There was an error processing your question. Please try again.');
        } finally {
            setIsAsking(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleAskQuestion();
        }
    };

    const handleUnderstand = () => {
        setQuestion('');
        setFollowUpResponse(null);
        onUnderstand();
    };

    const handleClose = () => {
        setQuestion('');
        setFollowUpResponse(null);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[10000] p-4">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl border-blue-200">
                {/* Header */}
                <CardHeader className="">
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center text-lg">
                            <Brain className="h-5 w-5 mr-2 text-blue-600" />
                            AI Explanation
                            <Badge className="ml-2 bg-blue-600">
                                Page {extractedText.pageNumber}
                            </Badge>
                        </CardTitle>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleClose}
                            className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </CardHeader>

                <CardContent className="p-0 flex flex-col max-h-[calc(90vh-120px)]">
                    {/* Main Content Area */}
                    <div className="flex-1 overflow-y-auto">
                        {/* AI Explanation */}
                        <div className="p-6">
                            <div className="prose prose-sm max-w-none dark:prose-invert text-gray-800 dark:text-gray-200 leading-tight">
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                        // Custom styling for markdown elements with tighter spacing
                                        h1: ({ children }) => <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">{children}</h1>,
                                        h2: ({ children }) => <h2 className="text-base font-semibold  text-gray-900 dark:text-gray-100">{children}</h2>,
                                        h3: ({ children }) => <h3 className="text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">{children}</h3>,
                                        p: ({ children }) => <p className="text-gray-800 dark:text-gray-200 leading-normal">{children}</p>,
                                        ul: ({ children }) => <ul className="list-disc list-inside  space-y-0.5 text-gray-800 dark:text-gray-200">{children}</ul>,
                                        ol: ({ children }) => <ol className="list-decimal list-inside  space-y-0.5 text-gray-800 dark:text-gray-200">{children}</ol>,
                                        li: ({ children }) => <li className="text-gray-800 dark:text-gray-200">{children}</li>,
                                        code: ({ children }) => <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm font-mono text-gray-900 dark:text-gray-100">{children}</code>,
                                        pre: ({ children }) => <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded-lg overflow-x-auto mb-1.5">{children}</pre>,
                                        blockquote: ({ children }) => <blockquote className="border-l-4 border-blue-500 pl-3 italic text-gray-700 dark:text-gray-300 mb-1.5">{children}</blockquote>,
                                        strong: ({ children }) => <strong className="font-semibold text-gray-900 dark:text-gray-100">{children}</strong>,
                                        em: ({ children }) => <em className="italic text-gray-800 dark:text-gray-200">{children}</em>
                                    }}
                                >
                                    {extractedText.selectedText}
                                </ReactMarkdown>
                            </div>
                        </div>

                        {/* Follow-up Response */}
                        {followUpResponse && (
                            <div ref={followUpRef} className="px-6 pb-4">
                                <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                                    <div className="flex items-start space-x-2">
                                        <Brain className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                                        <div className="flex-1">
                                            <div className="text-sm font-medium text-purple-800 dark:text-purple-200 mb-2">
                                                Follow-up Answer:
                                            </div>
                                            <div className="text-sm text-purple-700 dark:text-purple-300 whitespace-pre-wrap">
                                                <ReactMarkdown
                                                    remarkPlugins={[remarkGfm]}
                                                    components={{
                                                        // Custom styling for follow-up response markdown with tighter spacing
                                                        h1: ({ children }) => <h1 className="text-base font-bold mb-1.5 text-purple-800 dark:text-purple-200">{children}</h1>,
                                                        h2: ({ children }) => <h2 className="text-sm font-semibold mb-1 text-purple-800 dark:text-purple-200">{children}</h2>,
                                                        h3: ({ children }) => <h3 className="text-sm font-medium mb-0.5 text-purple-800 dark:text-purple-200">{children}</h3>,
                                                        p: ({ children }) => <p className="mb-1 text-purple-700 dark:text-purple-300 leading-normal">{children}</p>,
                                                        ul: ({ children }) => <ul className="list-disc list-inside mb-1 space-y-0.5 text-purple-700 dark:text-purple-300">{children}</ul>,
                                                        ol: ({ children }) => <ol className="list-decimal list-inside mb-1 space-y-0.5 text-purple-700 dark:text-purple-300">{children}</ol>,
                                                        li: ({ children }) => <li className="text-purple-700 dark:text-purple-300">{children}</li>,
                                                        code: ({ children }) => <code className="bg-purple-100 dark:bg-purple-900 px-1 py-0.5 rounded text-xs font-mono text-purple-900 dark:text-purple-100">{children}</code>,
                                                        pre: ({ children }) => <pre className="bg-purple-100 dark:bg-purple-900 p-2 rounded overflow-x-auto mb-1 text-xs">{children}</pre>,
                                                        blockquote: ({ children }) => <blockquote className="border-l-2 border-purple-400 pl-2 italic text-purple-600 dark:text-purple-400 mb-1">{children}</blockquote>,
                                                        strong: ({ children }) => <strong className="font-semibold text-purple-800 dark:text-purple-200">{children}</strong>,
                                                        em: ({ children }) => <em className="italic text-purple-700 dark:text-purple-300">{children}</em>
                                                    }}
                                                >
                                                    {followUpResponse}
                                                </ReactMarkdown>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Bottom Actions */}
                    <div className="border-t bg-white dark:bg-gray-900 p-4">
                        {/* Question Input */}
                        <div className="mb-4">
                            <div className="flex items-center space-x-2">
                                <MessageSquare className="h-4 w-4 text-gray-500" />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Ask a follow-up question:
                                </span>
                            </div>
                            <div className="flex space-x-2 mt-2">
                                <Input
                                    value={question}
                                    onChange={(e) => setQuestion(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="e.g., Can you explain this in simpler terms?"
                                    className="flex-1"
                                    disabled={isAsking}
                                />
                                <Button
                                    onClick={handleAskQuestion}
                                    disabled={!question.trim() || isAsking}
                                    size="sm"
                                    className="px-4"
                                >
                                    {isAsking ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Send className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-between">
                            <div className="text-xs text-gray-500">
                                Press Enter to ask • Click buttons to close
                            </div>
                            <div className="flex space-x-2">
                                <Button
                                    variant="outline"
                                    onClick={handleClose}
                                    className="px-6"
                                >
                                    <X className="h-4 w-4 mr-2" />
                                    Close
                                </Button>
                                <Button
                                    onClick={handleUnderstand}
                                    className="px-6 bg-green-600 hover:bg-green-700"
                                >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Understand
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}