import { useState, useEffect } from "react";
import { Search, Send, Plus, MoreVertical, Phone, Video, Paperclip, MessageSquare, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// Mock Data Interfaces
interface Message {
    id: string;
    text: string;
    sender: "user" | "lead";
    timestamp: Date;
    status: "sent" | "delivered" | "read";
}

interface Conversation {
    id: string;
    leadId: string;
    leadName: string;
    avatar?: string;
    lastMessage: string;
    unreadCount: number;
    messages: Message[];
    online: boolean;
}

interface Template {
    id: string;
    title: string;
    content: string;
}

const MessagesPage = () => {
    // ... component code ...
};

export default MessagesPage;
