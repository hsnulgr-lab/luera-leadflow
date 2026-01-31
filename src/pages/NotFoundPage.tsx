import { Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const NotFoundPage = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6">
            <div className="max-w-md w-full text-center">
                {/* 404 Illustration */}
                <div className="mb-8">
                    <div className="text-9xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
                        404
                    </div>
                    <div className="w-24 h-1 bg-gradient-to-r from-purple-600 to-blue-500 mx-auto mt-4 rounded-full" />
                </div>

                {/* Message */}
                <h1 className="text-2xl font-bold text-gray-800 mb-3">
                    Sayfa Bulunamadı
                </h1>
                <p className="text-gray-500 mb-8">
                    Aradığınız sayfa mevcut değil veya taşınmış olabilir.
                </p>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                        onClick={() => window.history.back()}
                        variant="outline"
                        className="gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Geri Dön
                    </Button>
                    <Button
                        onClick={() => window.location.href = '/'}
                        className="gap-2 bg-purple-600 hover:bg-purple-700"
                    >
                        <Home className="w-4 h-4" />
                        Ana Sayfa
                    </Button>
                </div>

                {/* LUERA Branding */}
                <div className="mt-12 text-sm text-gray-400">
                    <span className="font-semibold">LUERA</span> LeadFlow
                </div>
            </div>
        </div>
    );
};
