'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
    MessageSquare,
    Send,
    Loader2,
    Brain,
    User,
    Sparkles,
    X,
    Copy,
    Check
} from 'lucide-react';
import { ExtractedText } from '@/lib/pdf/text-extraction';

interface Message {
    id: string;
    type: 'explanation' | 'question' | 'answer';
    content: string;
    timestamp: Date;
    isLoading?: boolean;
}

interface AIChatProps {
    selectedText: ExtractedText | null;
    bookId: string;
    onClear: () => void;
}

export default function AIChat({ selectedText, bookId, onClear }: AIChatProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [currentQuestion, setCurrentQuestion] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [explanationId, setExplanationId] = useState<string | null>(null);
    const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Generate explanation when new text is selected
    useEffect(() => {
        if (selectedText && selectedText.selectedText.trim()) {
            generateExplanation();
        }
    }, [selectedText]);

    const generateExplanation = async () => {
        if (!selectedText) return;

        setIsLoading(true);

        // Add loading message
        const loadingMessage: Message = {
            id: Date.now().toString(),
            type: 'explanation',
            content: '',
            timestamp: new Date(),
            isLoading: true
        };

        setMessages([loadingMessage]);

        try {
            // First create a highlight (simplified - you might want to enhance this)
            const highlightResponse = await fetch('/api/highlights', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bookId,
                    pageNumber: selectedText.pageNumber,
                    selectedText: selectedText.selectedText,
                    position: { x: 0, y: 0, width: 100, height: 20 } // Simplified position
                })
            });

            if (!highlightResponse.ok) {
                throw new Error('Failed to create highlight');
            }

            const highlightData = await highlightResponse.json();
            const highlightId = highlightData.data._id;

            // Generate AI explanation
            const explanationResponse = await fetch('/api/ai/explain', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    highlightId,
                    bookId,
                    userId: 'anonymous',
                    highlightedText: selectedText.selectedText,
                    contextText: selectedText.contextText
                })
            });

            if (!explanationResponse.ok) {
                const errorText = await explanationResponse.text();
                console.error('API Error:', explanationResponse.status, errorText);
                throw new Error(`Failed to generate explanation: ${explanationResponse.status} - ${errorText}`);
            }

            const explanationData = await explanationResponse.json();
            setExplanationId(explanationData.data._id);

            // Update message with explanation
            const explanationMessage: Message = {
                id: Date.now().toString(),
                type: 'explanation',
                content: explanationData.data.explanation,
                timestamp: new Date()
            };

            setMessages([explanationMessage]);
        } catch (error) {
            console.error('Error generating explanation:', error);

            // Fallback: Generate a demo explanation
            const fallbackExplanation = generateFallbackExplanation(selectedText.selectedText);

            const explanationMessage: Message = {
                id: Date.now().toString(),
                type: 'explanation',
                content: fallbackExplanation,
                timestamp: new Date()
            };

            setMessages([explanationMessage]);
            setExplanationId('fallback-' + Date.now()); // Set a fallback ID for questions
        } finally {
            setIsLoading(false);
        }
    };

    const generateFallbackExplanation = (text: string): string => {
        return `**AI Explanation (Demo Mode)**

I can see you've selected the following text: "${text.substring(0, 100)}${text.length > 100 ? '...' : ''}"

This is a demonstration of how the AI explanation feature works. In a fully configured environment, I would:

1. **Analyze the selected text** in the context of the surrounding pages
2. **Provide detailed explanations** of complex concepts, terminology, or ideas
3. **Offer relevant background information** to help you understand the content better
4. **Connect ideas** to broader themes in the document

**To enable full AI functionality:**
- Ensure your Groq API key is properly configured
- Check that the database connection is working
- Verify all API endpoints are accessible

You can still ask follow-up questions, and I'll provide helpful responses based on the selected content!`;
    };

    const generateFallbackAnswer = (question: string, selectedText: string): string => {
        return `**Demo Response**

You asked: "${question}"

This is a demonstration of the follow-up question feature. In a fully configured environment, I would provide a detailed answer based on:

- Your specific question about the selected text
- The context from surrounding pages
- The broader themes and concepts in the document
- Previous conversation history

**Selected text context:** "${selectedText.substring(0, 150)}${selectedText.length > 150 ? '...' : ''}"

To enable full AI functionality, please ensure your API configuration is complete. You can continue asking questions to see how the interface works!`;
    };

    const handleQuestionSubmit = async () => {
        if (!currentQuestion.trim() || !explanationId || isLoading) return;

        const question = currentQuestion.trim();
        setCurrentQuestion('');
        setIsLoading(true);

        // Add user question to messages
        const questionMessage: Message = {
            id: Date.now().toString(),
            type: 'question',
            content: question,
            timestamp: new Date()
        };

        // Add loading answer message
        const loadingAnswerMessage: Message = {
            id: (Date.now() + 1).toString(),
            type: 'answer',
            content: '',
            timestamp: new Date(),
            isLoading: true
        };

        setMessages(prev => [...prev, questionMessage, loadingAnswerMessage]);

        try {
            const response = await fetch('/api/ai/question', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    explanationId,
                    userId: 'anonymous',
                    question
                })
            });

            if (!response.ok) {
                throw new Error('Failed to get answer');
            }

            const data = await response.json();

            // Update the loading message with the actual answer
            setMessages(prev =>
                prev.map(msg =>
                    msg.isLoading && msg.type === 'answer'
                        ? { ...msg, content: data.data.answer, isLoading: false }
                        : msg
                )
            );
        } catch (error) {
            console.error('Error getting answer:', error);

            // Fallback: Generate a demo answer
            const fallbackAnswer = generateFallbackAnswer(question, selectedText?.selectedText || '');

            setMessages(prev =>
                prev.map(msg =>
                    msg.isLoading && msg.type === 'answer'
                        ? { ...msg, content: fallbackAnswer, isLoading: false }
                        : msg
                )
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleQuestionSubmit();
        }
    };

    const copyToClipboard = async (content: string, messageId: string) => {
        try {
            await navigator.clipboard.writeText(content);
            setCopiedMessageId(messageId);
            setTimeout(() => setCopiedMessageId(null), 2000);
        } catch (error) {
            console.error('Failed to copy:', error);
        }
    };

    const handleClear = () => {
        setMessages([]);
        setExplanationId(null);
        setCurrentQuestion('');
        onClear();
    };

    if (!selectedText) {
        return (
            <div className="h-full flex flex-col">
                <div className="p-4 border-b">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium flex items-center">
                            <Brain className="h-4 w-4 mr-2" />
                            AI Assistant
                        </h3>
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </div>
                </div>

                <div className="flex-1 flex items-center justify-center p-6">
                    <div className="text-center">
                        <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-sm text-muted-foreground mb-2">
                            Select text in the PDF to get AI explanations
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Use the selection tool to highlight any part of the document
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium flex items-center">
                        <Brain className="h-4 w-4 mr-2" />
                        AI Assistant
                    </h3>
                    <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className="text-xs">
                            Page {selectedText.pageNumber}
                        </Badge>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleClear}
                            className="h-6 w-6 p-0"
                        >
                            <X className="h-3 w-3" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Selected Text Preview */}
            <div className="p-4 border-b bg-muted/50">
                <div className="text-xs text-muted-foreground mb-2">Selected Content:</div>

                {/* Screenshot Preview */}
                {selectedText.screenshot && (
                    <div className="mb-3">
                        <div className="relative group">
                            <img
                                src={selectedText.screenshotUrl || selectedText.screenshot}
                                alt="Selected area screenshot"
                                className="max-w-full h-auto rounded border bg-white shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                                style={{ maxHeight: '120px' }}
                                onClick={() => {
                                    // Open screenshot in new tab for better viewing
                                    const newWindow = window.open();
                                    if (newWindow) {
                                        newWindow.document.write(`
                                            <html>
                                                <head><title>PDF Screenshot - Page ${selectedText.pageNumber}</title></head>
                                                <body style="margin:0;background:#f0f0f0;display:flex;justify-content:center;align-items:center;min-height:100vh;">
                                                    <img src="${selectedText.screenshotUrl || selectedText.screenshot}" style="max-width:100%;max-height:100%;box-shadow:0 4px 12px rgba(0,0,0,0.15);" />
                                                </body>
                                            </html>
                                        `);
                                    }
                                }}
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <div className="bg-white/90 text-black text-xs px-2 py-1 rounded">
                                    Click to enlarge
                                </div>
                            </div>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 flex items-center justify-between">
                            <span>
                                {selectedText.screenshotUrl ? '✓ Screenshot saved to server' : 'Screenshot captured locally'}
                            </span>
                            <Badge variant="outline" className="text-xs">
                                Page {selectedText.pageNumber}
                            </Badge>
                        </div>
                    </div>
                )}

                {/* Extracted Text */}
                <div className="text-sm bg-background p-3 rounded-lg border max-h-20 overflow-y-auto">
                    {selectedText.selectedText}
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                    <div key={message.id} className="space-y-2">
                        {message.type === 'explanation' && (
                            <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/50">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm flex items-center">
                                        <Brain className="h-4 w-4 mr-2 text-blue-600" />
                                        AI Explanation
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    {message.isLoading ? (
                                        <div className="flex items-center space-x-2">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            <span className="text-sm text-muted-foreground">
                                                Analyzing and explaining...
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <div className="text-sm whitespace-pre-wrap">
                                                {message.content}
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => copyToClipboard(message.content, message.id)}
                                                className="h-6 text-xs"
                                            >
                                                {copiedMessageId === message.id ? (
                                                    <Check className="h-3 w-3 mr-1" />
                                                ) : (
                                                    <Copy className="h-3 w-3 mr-1" />
                                                )}
                                                {copiedMessageId === message.id ? 'Copied!' : 'Copy'}
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {message.type === 'question' && (
                            <div className="flex justify-end">
                                <Card className="max-w-[80%] border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/50">
                                    <CardContent className="p-3">
                                        <div className="flex items-start space-x-2">
                                            <User className="h-4 w-4 mt-0.5 text-green-600" />
                                            <div className="text-sm">{message.content}</div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {message.type === 'answer' && (
                            <Card className="border-purple-200 bg-purple-50/50 dark:border-purple-800 dark:bg-purple-950/50">
                                <CardContent className="p-3">
                                    {message.isLoading ? (
                                        <div className="flex items-center space-x-2">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            <span className="text-sm text-muted-foreground">
                                                Thinking...
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <div className="flex items-start space-x-2">
                                                <Brain className="h-4 w-4 mt-0.5 text-purple-600" />
                                                <div className="text-sm whitespace-pre-wrap flex-1">
                                                    {message.content}
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => copyToClipboard(message.content, message.id)}
                                                className="h-6 text-xs"
                                            >
                                                {copiedMessageId === message.id ? (
                                                    <Check className="h-3 w-3 mr-1" />
                                                ) : (
                                                    <Copy className="h-3 w-3 mr-1" />
                                                )}
                                                {copiedMessageId === message.id ? 'Copied!' : 'Copy'}
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Question Input */}
            {messages.length > 0 && !messages.some(m => m.isLoading) && (
                <div className="p-4 border-t">
                    <div className="flex space-x-2">
                        <Textarea
                            ref={textareaRef}
                            value={currentQuestion}
                            onChange={(e) => setCurrentQuestion(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Ask a follow-up question..."
                            className="flex-1 min-h-[40px] max-h-[120px] resize-none"
                            rows={1}
                        />
                        <Button
                            onClick={handleQuestionSubmit}
                            disabled={!currentQuestion.trim() || isLoading}
                            size="sm"
                            className="px-3"
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                        Press Enter to send, Shift+Enter for new line
                    </div>
                </div>
            )}
        </div>
    );
}