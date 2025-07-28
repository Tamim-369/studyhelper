'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Camera,
    Brain,
    Zap,
    Target,
    FileText,
    Calculator,
    BarChart3,
    Image,
    CheckCircle,
    Sparkles
} from 'lucide-react';

const contentTypes = [
    {
        icon: <FileText className="h-5 w-5" />,
        title: "Text Content",
        description: "Paragraphs, sentences, and written content",
        examples: ["Research papers", "Book chapters", "Articles", "Documentation"],
        color: "bg-blue-500"
    },
    {
        icon: <Calculator className="h-5 w-5" />,
        title: "Mathematical Formulas",
        description: "Equations, expressions, and mathematical notation",
        examples: ["E = mc²", "∫ f(x)dx", "Σ(x-μ)²", "Complex equations"],
        color: "bg-green-500"
    },
    {
        icon: <BarChart3 className="h-5 w-5" />,
        title: "Charts & Diagrams",
        description: "Visual data representations and illustrations",
        examples: ["Bar charts", "Flow diagrams", "Graphs", "Technical drawings"],
        color: "bg-purple-500"
    },
    {
        icon: <Image className="h-5 w-5" />,
        title: "Images & Figures",
        description: "Photos, illustrations, and visual content",
        examples: ["Scientific images", "Illustrations", "Screenshots", "Artwork"],
        color: "bg-orange-500"
    }
];

const aiCapabilities = [
    "Explains complex concepts in simple terms",
    "Provides context from surrounding pages",
    "Identifies key terms and definitions",
    "Breaks down mathematical formulas",
    "Describes visual content and diagrams",
    "Answers follow-up questions",
    "Connects ideas across the document",
    "Offers additional learning resources"
];

export default function ScreenshotFeatures() {
    return (
        <div className="space-y-6">
            {/* Main Feature Card */}
            <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
                <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                        <Camera className="h-5 w-5 mr-2 text-blue-600" />
                        AI-Powered Screenshot Analysis
                        <Badge className="ml-2 bg-blue-600">New</Badge>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Select any part of your PDF and get instant AI explanations with context-aware analysis
                    </p>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center space-x-4 text-sm">
                        <div className="flex items-center space-x-1">
                            <Target className="h-4 w-4 text-green-500" />
                            <span>Precise Selection</span>
                        </div>
                        <div className="flex items-center space-x-1">
                            <Zap className="h-4 w-4 text-yellow-500" />
                            <span>Instant Analysis</span>
                        </div>
                        <div className="flex items-center space-x-1">
                            <Brain className="h-4 w-4 text-purple-500" />
                            <span>Smart Explanations</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Content Types */}
            <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Sparkles className="h-5 w-5 mr-2 text-blue-600" />
                    What You Can Capture & Analyze
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                    {contentTypes.map((type, index) => (
                        <Card key={index} className="border-gray-200 hover:border-gray-300 transition-colors">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm flex items-center">
                                    <div className={`${type.color} text-white rounded-full p-2 mr-3`}>
                                        {type.icon}
                                    </div>
                                    {type.title}
                                </CardTitle>
                                <p className="text-xs text-muted-foreground">{type.description}</p>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <div className="space-y-1">
                                    {type.examples.map((example, idx) => (
                                        <div key={idx} className="flex items-center space-x-2 text-xs">
                                            <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                                            <span className="text-muted-foreground">{example}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* AI Capabilities */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                        <Brain className="h-5 w-5 mr-2 text-purple-600" />
                        AI Analysis Capabilities
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Our AI doesn't just extract text - it provides intelligent explanations and insights
                    </p>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-2 gap-3">
                        {aiCapabilities.map((capability, index) => (
                            <div key={index} className="flex items-start space-x-2 text-sm">
                                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                                <span>{capability}</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Technical Details */}
            <Card className="border-gray-200">
                <CardHeader>
                    <CardTitle className="text-sm">How It Works</CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground space-y-2">
                    <div className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
                        <span><strong>Direct PDF Rendering:</strong> Uses PDF.js to render pages at high resolution for crisp screenshots</span>
                    </div>
                    <div className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 flex-shrink-0" />
                        <span><strong>Smart Text Extraction:</strong> Combines PDF text data with OCR for maximum accuracy</span>
                    </div>
                    <div className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mt-1.5 flex-shrink-0" />
                        <span><strong>Context-Aware AI:</strong> Analyzes surrounding pages to provide comprehensive explanations</span>
                    </div>
                    <div className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full mt-1.5 flex-shrink-0" />
                        <span><strong>Persistent Storage:</strong> Screenshots are saved for future reference and sharing</span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}