import React from "react";
import { MessageSquare } from "lucide-react";

const MessagesPage = () => {
    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
                <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                    <MessageSquare className="w-8 h-8 text-[#CCFF00]" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Mesajlar</h2>
                <p className="text-gray-400 max-w-md mx-auto">
                    Bu modül yapım aşamasındadır. Yakında tüm müşteri mesajlarınızı buradan yönetebileceksiniz.
                </p>
            </div>
        </div>
    );
};

export default MessagesPage;
