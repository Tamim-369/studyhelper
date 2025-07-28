'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Camera,
    Brain,
    MousePointer,
    Square,
    Zap,
    CheckCircle,
    Info,
    ChevronDown,
    ChevronUp,
    Lightbulb,
    Target,
    Sparkles
} from 'lucide-react';

interface ScreenshotGuideProps {
    isExpanded?: boolean;
    onToggle?: () => void;
}

export default function ScreenshotGuide({ isExpanded = false, onToggle }: ScreenshotGuideProps) {
    const [internalExpanded, setInternalExpanded] = useState(isExpanded);

    const expanded = onToggle ? isExpanded : internalExpanded;
    const handleToggle = onToggle || (() => setInternalExpanded(!internalExpanded));

    const features = [
        {
            icon: <Target className="h-4 w-4" />,
            title: "Full-Page Selection",
            description: "Drag anywhere on the browser tab - PDF, UI, or any content"
        },
        {
            icon: <Camera className="h-4 w-4" />,
            title: "High-Quality Capture",
            description: "html2canvas technology for crisp, accurate screenshots"
        },
        {
            icon: <Brain className="h-4 w-4" />,
            title: "Smart Text Extraction",
            description: "Advanced OCR extracts text from any visual content"
        },
        {
            icon: <Sparkles className="h-4 w-4" />,
            title: "AI Explanations",
            description: "Context-aware explanations for any selected content"
        }
    ];

    const tips = [
        "Screenshot anywhere - PDF content, browser UI, or any page element",
        "Select larger areas for better OCR text extraction accuracy",
        "Works with formulas, diagrams, charts, and mixed content",
        "Can capture multiple elements together in one selection",
        "Screenshots are automatically saved for future reference"
    ];

    return (
        <Card className="border-blue-100 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20 dark:border-blue-800/50">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center">
                        <Camera className="h-4 w-4 mr-2 text-blue-600" />
                        AI Screenshot Feature
                    </CardTitle>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleToggle}
                        className="h-6 w-6 p-0"
                    >
                        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                    Screenshot anywhere on the page and get instant AI explanations
                </p>
            </CardHeader>

            {expanded && (
                <CardContent className="pt-0 space-y-4">
                    {/* How it works */}
                    <div>
                        <h4 className="text-xs font-medium mb-2 flex items-center">
                            <Info className="h-3 w-3 mr-1" />
                            How it works:
                        </h4>
                        <div className="space-y-2">
                            <div className="flex items-start space-x-2 text-xs">
                                <Square className="h-3 w-3 mt-0.5 text-blue-500 flex-shrink-0" />
                                <span>Click "AI Screenshot" to activate selection mode</span>
                            </div>
                            <div className="flex items-start space-x-2 text-xs">
                                <MousePointer className="h-3 w-3 mt-0.5 text-green-500 flex-shrink-0" />
                                <span>Drag anywhere on the page to select content</span>
                            </div>
                            <div className="flex items-start space-x-2 text-xs">
                                <Camera className="h-3 w-3 mt-0.5 text-purple-500 flex-shrink-0" />
                                <span>System captures screenshot and extracts text</span>
                            </div>
                            <div className="flex items-start space-x-2 text-xs">
                                <Brain className="h-3 w-3 mt-0.5 text-orange-500 flex-shrink-0" />
                                <span>AI analyzes content and provides explanations</span>
                            </div>
                        </div>
                    </div>

                    {/* Features */}
                    <div>
                        <h4 className="text-xs font-medium mb-2 flex items-center">
                            <Zap className="h-3 w-3 mr-1" />
                            Key Features:
                        </h4>
                        <div className="grid grid-cols-1 gap-2">
                            {features.map((feature, index) => (
                                <div key={index} className="flex items-start space-x-2 text-xs">
                                    <div className="text-blue-600 mt-0.5 flex-shrink-0">
                                        {feature.icon}
                                    </div>
                                    <div>
                                        <span className="font-medium">{feature.title}:</span>
                                        <span className="text-muted-foreground ml-1">{feature.description}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Tips */}
                    <div>
                        <h4 className="text-xs font-medium mb-2 flex items-center">
                            <Lightbulb className="h-3 w-3 mr-1" />
                            Pro Tips:
                        </h4>
                        <div className="space-y-1">
                            {tips.map((tip, index) => (
                                <div key={index} className="flex items-start space-x-2 text-xs">
                                    <CheckCircle className="h-3 w-3 mt-0.5 text-green-500 flex-shrink-0" />
                                    <span className="text-muted-foreground">{tip}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Status */}
                    <div className="pt-2 border-t border-blue-200/50">
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Status:</span>
                            <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Ready to use
                            </Badge>
                        </div>
                    </div>
                </CardContent>
            )}
        </Card>
    );
}