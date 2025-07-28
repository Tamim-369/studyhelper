'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Camera,
    Brain,
    Zap,
    CheckCircle,
    ArrowRight,
    Square,
    MousePointer,
    Sparkles
} from 'lucide-react';

interface ScreenshotDemoProps {
    onStartDemo: () => void;
    isActive?: boolean;
}

export default function ScreenshotDemo({ onStartDemo, isActive = false }: ScreenshotDemoProps) {
    const [currentStep, setCurrentStep] = useState(0);

    const steps = [
        {
            icon: <Square className="h-5 w-5" />,
            title: "Click AI Screenshot",
            description: "Activate the selection tool to start capturing any area of the PDF",
            color: "bg-blue-500"
        },
        {
            icon: <MousePointer className="h-5 w-5" />,
            title: "Drag to Select",
            description: "Draw a rectangle around text, diagrams, formulas, or any content you want explained",
            color: "bg-green-500"
        },
        {
            icon: <Camera className="h-5 w-5" />,
            title: "Auto Capture",
            description: "The system captures a high-quality screenshot and extracts text using OCR",
            color: "bg-purple-500"
        },
        {
            icon: <Brain className="h-5 w-5" />,
            title: "AI Analysis",
            description: "AI analyzes the content and provides detailed explanations with context",
            color: "bg-orange-500"
        }
    ];

    if (isActive) {
        return (
            <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/50">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center">
                        <Sparkles className="h-4 w-4 mr-2 text-blue-600" />
                        Screenshot Mode Active
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                    <div className="space-y-3">
                        <div className="flex items-center space-x-2 text-sm">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                            <span>Drag anywhere on the PDF to select content</span>
                        </div>
                        <div className="text-xs text-muted-foreground space-y-1">
                            <div>• Works with text, formulas, diagrams, and images</div>
                            <div>• AI will extract and explain the selected content</div>
                            <div>• Press Escape to cancel selection</div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-gray-200 dark:border-gray-700">
            <CardHeader>
                <CardTitle className="text-lg flex items-center">
                    <Camera className="h-5 w-5 mr-2 text-blue-600" />
                    AI-Powered Screenshot Analysis
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                    Select any part of the PDF and get instant AI explanations
                </p>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Steps */}
                <div className="space-y-3">
                    {steps.map((step, index) => (
                        <div key={index} className="flex items-start space-x-3">
                            <div className={`${step.color} text-white rounded-full p-2 flex-shrink-0`}>
                                {step.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium">{step.title}</h4>
                                <p className="text-xs text-muted-foreground mt-1">{step.description}</p>
                            </div>
                            {index < steps.length - 1 && (
                                <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                            )}
                        </div>
                    ))}
                </div>

                {/* Features */}
                <div className="border-t pt-4">
                    <h4 className="text-sm font-medium mb-2">What you can capture:</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center space-x-2">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            <span>Text paragraphs</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            <span>Mathematical formulas</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            <span>Diagrams & charts</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            <span>Tables & data</span>
                        </div>
                    </div>
                </div>

                {/* CTA */}
                <Button onClick={onStartDemo} className="w-full" size="sm">
                    <Square className="h-4 w-4 mr-2" />
                    Try AI Screenshot
                </Button>
            </CardContent>
        </Card>
    );
}