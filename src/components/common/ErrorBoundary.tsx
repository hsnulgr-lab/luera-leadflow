
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    private handleReload = () => {
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
                    <div className="max-w-md w-full bg-gray-900 border border-gray-800 rounded-lg p-6 text-center shadow-xl">
                        <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="w-8 h-8 text-red-500" />
                        </div>

                        <h1 className="text-xl font-bold text-white mb-2">
                            Bir şeyler ters gitti
                        </h1>

                        <p className="text-gray-400 mb-6 text-sm">
                            Uygulama çalışırken beklenmedik bir hata oluştu. Lütfen sayfayı yenilemeyi deneyin.
                        </p>

                        <div className="bg-black/40 rounded p-3 mb-6 text-left overflow-auto max-h-32">
                            <code className="text-xs text-red-400 font-mono">
                                {this.state.error?.message || "Unknown Error"}
                            </code>
                        </div>

                        <Button
                            onClick={this.handleReload}
                            className="w-full bg-[#CCFF00] text-black hover:bg-[#b3e600]"
                        >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Sayfayı Yenile
                        </Button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
