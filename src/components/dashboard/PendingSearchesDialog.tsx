import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Clock, Calendar } from "lucide-react";
import { useLeads } from "@/hooks/useLeads";

interface PendingSearchesDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function PendingSearchesDialog({ open, onOpenChange }: PendingSearchesDialogProps) {
    const { pendingSearches } = useLeads();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-primary" />
                        Bekleyen Aramalar
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {pendingSearches.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p>Planlanmış bir arama bulunmuyor.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {pendingSearches.map((job) => (
                                <div key={job.id} className="flex items-center justify-between p-3 bg-secondary/30 border border-border rounded-lg">
                                    <div className="flex gap-3 items-center">
                                        <div className="bg-primary/10 p-2 rounded-full">
                                            <Calendar className="w-4 h-4 text-primary" />
                                        </div>
                                        <div>
                                            <div className="font-medium">{job.config.sector} - {job.config.city}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {new Date(job.scheduledTime).toLocaleString('tr-TR')}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="px-2 py-1 bg-yellow-500/10 text-yellow-600 text-xs rounded-full font-medium border border-yellow-200 dark:border-yellow-900">
                                        Planlandı
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
