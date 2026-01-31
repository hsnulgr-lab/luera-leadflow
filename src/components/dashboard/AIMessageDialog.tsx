
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Lead } from "@/types/lead";
import { aiService } from "@/services/aiService";
import { Loader2, Wand2, Send, Copy } from "lucide-react";
import { toast } from "sonner"; // Assuming sonner is used for toasts

interface AIMessageDialogProps {
    lead: Lead | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const AIMessageDialog = ({ lead, open, onOpenChange }: AIMessageDialogProps) => {
    const [message, setMessage] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [tone, setTone] = useState<'professional' | 'friendly' | 'urgent'>('professional');

    const handleGenerate = async () => {
        if (!lead) return;

        setIsGenerating(true);
        try {
            const generatedMsg = await aiService.generateMessage({
                leadName: lead.name,
                company: lead.company,
                sector: lead.tags?.[0], // Assuming first tag is sector or using undefined
                tone: tone
            });
            setMessage(generatedMsg);
        } catch (error) {
            toast.error("Mesaj oluşturulamadı");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(message);
        toast.success("Mesaj kopyalandı");
    };

    const handleSendWhatsApp = () => {
        if (!lead) return;
        const phone = lead.phone.replace(/\D/g, '');
        const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Wand2 className="w-5 h-5 text-purple-600" />
                        AI Mesaj Oluşturucu
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="flex gap-2">
                        {(['professional', 'friendly', 'urgent'] as const).map((t) => (
                            <Button
                                key={t}
                                variant={tone === t ? "default" : "outline"}
                                size="sm"
                                onClick={() => setTone(t)}
                                className="capitalize"
                            >
                                {t === 'professional' ? 'Profesyonel' : t === 'friendly' ? 'Samimi' : 'Acil'}
                            </Button>
                        ))}
                    </div>

                    <div className="relative">
                        <Textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="AI tarafından oluşturulan mesaj burada görünecek..."
                            className="min-h-[150px] resize-none pr-10"
                        />
                        <Button
                            size="icon"
                            variant="ghost"
                            className="absolute right-2 top-2 h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={handleCopy}
                            disabled={!message}
                        >
                            <Copy className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <DialogFooter className="flex justify-between sm:justify-between items-center w-full">
                    <Button
                        variant="ghost"
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Oluşturuluyor...
                            </>
                        ) : (
                            <>
                                <Wand2 className="mr-2 h-4 w-4" />
                                {message ? "Yeniden Oluştur" : "Mesaj Oluştur"}
                            </>
                        )}
                    </Button>

                    <Button
                        onClick={handleSendWhatsApp}
                        disabled={!message}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        <Send className="mr-2 h-4 w-4" />
                        WhatsApp'ta Aç
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
