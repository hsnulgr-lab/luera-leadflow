import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Sparkles, Loader2, Bot, CheckCircle2 } from 'lucide-react';
import { Lead } from '@/types/lead';
import { aiService } from '@/services/aiService';
import { n8nService } from '@/services/n8nService';

interface AIOfferDialogProps {
    lead: Lead | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AIOfferDialog({ lead, open, onOpenChange }: AIOfferDialogProps) {
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [startingAgent, setStartingAgent] = useState(false);

    // Generate offer when dialog opens
    const handleOpenChange = async (newOpen: boolean) => {
        onOpenChange(newOpen);

        if (newOpen && lead) {
            await generateOffer();
        } else {
            // Reset on close
            setMessage('');
            setLoading(false);
            setStartingAgent(false);
        }
    };

    const generateOffer = async () => {
        if (!lead) return;

        setLoading(true);
        try {
            const generatedMessage = await aiService.generateMessage({
                leadName: lead.name,
                company: lead.company,
                sector: lead.tags?.[0],
                tone: 'offer'
            });
            setMessage(generatedMessage);
        } catch (error) {
            console.error('Failed to generate offer:', error);
            setMessage('Teklif oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.');
        } finally {
            setLoading(false);
        }
    };

    const handleStartAgent = async () => {
        if (!lead || !message) return;

        setStartingAgent(true);
        try {
            await n8nService.startAutonomousAgent(lead);
            alert(`${lead.name} için otonom ajan ve kişiselleştirilmiş teklif başlatıldı!`);
            onOpenChange(false);
        } catch (error) {
            alert(`Hata: ${error}`);
        } finally {
            setStartingAgent(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[600px] border-purple-200">
                <DialogHeader className="bg-purple-50/50 -mx-6 -mt-6 p-6 border-b border-purple-100">
                    <DialogTitle className="flex items-center gap-2 text-purple-900">
                        <Sparkles className="w-5 h-5 text-purple-600" />
                        AI Teklif Hazırlayıcı
                    </DialogTitle>
                    {lead && (
                        <p className="text-sm text-purple-700/80">
                            {lead.name} - {lead.company} için stratejik teklif
                        </p>
                    )}
                </DialogHeader>

                <div className="space-y-4 mt-4">
                    {/* Message Preview/Edit */}
                    <div>
                        <Label className="text-sm font-medium mb-2 block flex items-center justify-between">
                            <span>Oluşturulan Teklif Metni</span>
                            <span className="text-xs text-muted-foreground font-normal">AI tarafından analiz edilip yazıldı</span>
                        </Label>
                        <div className="relative">
                            <Textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                disabled={loading || startingAgent}
                                className="min-h-[250px] pr-4 font-normal leading-relaxed resize-none focus-visible:ring-purple-500"
                                placeholder="AI teklifi hazırlıyor..."
                            />
                            {loading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-md backdrop-blur-[1px]">
                                    <div className="flex flex-col items-center gap-2">
                                        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                                        <p className="text-sm font-medium text-purple-600">Teklif Oluşturuluyor...</p>
                                    </div>
                                </div>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                            <Bot className="w-3 h-3" />
                            Bu metni düzenleyebilirsiniz. Ajan bu metni kullanarak iletişimi başlatacaktır.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={startingAgent}
                            className="flex-1"
                        >
                            İptal
                        </Button>
                        <Button
                            onClick={generateOffer}
                            disabled={loading || startingAgent || !lead}
                            variant="secondary"
                            className="flex-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200"
                        >
                            {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                'Yeniden Yaz'
                            )}
                        </Button>
                        <Button
                            onClick={handleStartAgent}
                            disabled={!message || loading || startingAgent}
                            className="flex-[2] bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-200"
                        >
                            {startingAgent ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Ajan Başlatılıyor...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                    Ajanı Başlat ve Gönder
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
