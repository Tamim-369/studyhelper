'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Camera,
    Loader2,
    CheckCircle,
    Square,
    X
} from 'lucide-react';

interface ScreenshotCaptureProps {
    isActive: boolean;
    isProcessing: boolean;
    onToggle: () => void;
    onCancel: () => void;
    className?: string;
}

export default function ScreenshotCapture({
    isActive,
    isProcessing,
    onToggle,
    onCancel,
    className = ''
}: ScreenshotCaptureProps) {
    const [lastCaptureTime, setLastCaptureTime] = useState<Date | null>(null);

    const handleToggle = useCallback((e?: React.MouseEvent) => {
        // Prevent any default behavior that might cause scrolling
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        // Store scroll position before any state changes
        const scrollX = window.scrollX;
        const scrollY = window.scrollY;
        console.log('🔘 Button clicked - storing scroll position:', scrollX, scrollY);

        if (isActive) {
            onCancel();
        } else {
            onToggle();
            setLastCaptureTime(new Date());

            // Immediately restore scroll position
            requestAnimationFrame(() => {
                console.log('🔄 Button - restoring scroll position:', scrollX, scrollY);
                window.scrollTo(scrollX, scrollY);
            });
        }
    }, [isActive, onToggle, onCancel]);

    if (isProcessing) {
        return (
            <div className={`flex items-center space-x-2 ${className}`}>
                <Button
                    variant="default"
                    size="sm"
                    disabled
                    className="bg-blue-600 hover:bg-blue-700"
                >
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Processing...
                </Button>
                <Badge variant="secondary" className="text-xs">
                    AI Analysis
                </Badge>
            </div>
        );
    }

    if (isActive) {
        return (
            <div className={`flex items-center space-x-2 ${className}`}>
                <Button
                    variant="destructive"
                    size="sm"
                    onClick={(e) => handleToggle(e)}
                    className="animate-pulse"
                >
                    <X className="h-4 w-4 mr-2" />
                    Cancel Selection
                </Button>
                <Badge variant="default" className="text-xs bg-blue-600">
                    <Camera className="h-3 w-3 mr-1" />
                    Active
                </Badge>
            </div>
        );
    }

    return (
        <div className={`flex items-center space-x-2 ${className}`}>
            <Button
                variant="outline"
                size="sm"
                onClick={(e) => handleToggle(e)}
                className="hover:bg-blue-50 hover:border-blue-300 transition-colors"
            >
                <Square className="h-4 w-4 mr-2" />
                AI Screenshot
            </Button>
            {lastCaptureTime && (
                <Badge variant="secondary" className="text-xs">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Ready
                </Badge>
            )}
        </div>
    );
}