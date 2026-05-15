import { useState } from 'react';
import { X, Calendar, Clock, Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/utils/cn';
import { createTimeflowAppointment } from '@/services/timeflowService';
import type { Lead } from '@/types/lead';

interface Props {
    lead: Lead;
    onClose: () => void;
}

const SERVICES = ['Genel Randevu', 'Konsültasyon', 'Demo', 'Tanışma', 'Teknik Görüşme', 'Teklif Sunumu'];

function addMinutes(time: string, minutes: number): string {
    const [h, m] = time.split(':').map(Number);
    const total = h * 60 + m + minutes;
    return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function todayStr(): string {
    return new Date().toISOString().split('T')[0];
}

export function CreateAppointmentModal({ lead, onClose }: Props) {
    const [date, setDate]         = useState(todayStr());
    const [startTime, setStart]   = useState('10:00');
    const [duration, setDuration] = useState(60);
    const [service, setService]   = useState(SERVICES[0]);
    const [notes, setNotes]       = useState('');
    const [loading, setLoading]   = useState(false);
    const [error, setError]       = useState<string | null>(null);
    const [done, setDone]         = useState(false);

    const endTime = addMinutes(startTime, duration);

    const handleSubmit = async () => {
        setLoading(true);
        setError(null);
        const result = await createTimeflowAppointment({
            customer_name:  lead.name || lead.company,
            customer_phone: lead.phone || '',
            customer_email: lead.email || undefined,
            date,
            start_time: startTime,
            end_time: endTime,
            service,
            notes: notes || undefined,
        });
        setLoading(false);
        if (result.success) {
            setDone(true);
            setTimeout(onClose, 1800);
        } else {
            setError(result.error ?? 'Bilinmeyen hata');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl animate-in slide-in-from-bottom-4 duration-300 overflow-hidden">
                {/* Header */}
                <div className="bg-gray-950 px-6 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#CCFF00] flex items-center justify-center">
                            <Calendar className="w-4 h-4 text-gray-900" />
                        </div>
                        <div>
                            <p className="text-white font-bold text-sm">Randevu Oluştur</p>
                            <p className="text-white/50 text-xs truncate max-w-[180px]">{lead.name || lead.company}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                        <X className="w-4 h-4 text-white/70" />
                    </button>
                </div>

                {done ? (
                    <div className="flex flex-col items-center justify-center gap-3 py-12 px-6">
                        <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center">
                            <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                        </div>
                        <p className="font-bold text-gray-900">Randevu oluşturuldu!</p>
                        <p className="text-xs text-gray-400 text-center">TimeFlow'a aktarıldı.</p>
                    </div>
                ) : (
                    <div className="p-5 space-y-4">
                        {/* Tarih */}
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Tarih</label>
                            <input
                                type="date"
                                value={date}
                                min={todayStr()}
                                onChange={e => setDate(e.target.value)}
                                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-[#CCFF00] focus:ring-2 focus:ring-[#CCFF00]/20 outline-none"
                            />
                        </div>

                        {/* Saat + Süre */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Başlangıç</label>
                                <input
                                    type="time"
                                    value={startTime}
                                    onChange={e => setStart(e.target.value)}
                                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-[#CCFF00] outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Süre</label>
                                <select
                                    value={duration}
                                    onChange={e => setDuration(Number(e.target.value))}
                                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-[#CCFF00] outline-none bg-white"
                                >
                                    {[15, 30, 45, 60, 90, 120].map(m => (
                                        <option key={m} value={m}>{m} dk</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Bitiş saati göster */}
                        <div className="flex items-center gap-2 text-xs text-gray-400 -mt-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{startTime} – {endTime}</span>
                        </div>

                        {/* Hizmet */}
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Hizmet</label>
                            <select
                                value={service}
                                onChange={e => setService(e.target.value)}
                                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-[#CCFF00] outline-none bg-white"
                            >
                                {SERVICES.map(s => <option key={s}>{s}</option>)}
                            </select>
                        </div>

                        {/* Notlar */}
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Notlar (opsiyonel)</label>
                            <textarea
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                rows={2}
                                placeholder="Lead hakkında not..."
                                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-[#CCFF00] outline-none resize-none"
                            />
                        </div>

                        {error && (
                            <p className="text-xs text-red-500 font-medium px-1">{error}</p>
                        )}

                        <button
                            onClick={handleSubmit}
                            disabled={loading || !lead.phone}
                            className={cn(
                                "w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all",
                                "bg-[#CCFF00] text-gray-900 hover:bg-[#d4ff33] disabled:opacity-50 disabled:cursor-not-allowed"
                            )}
                        >
                            {loading
                                ? <><Loader2 className="w-4 h-4 animate-spin" /> Oluşturuluyor...</>
                                : <><Calendar className="w-4 h-4" /> Randevu Oluştur</>
                            }
                        </button>

                        {!lead.phone && (
                            <p className="text-xs text-amber-500 text-center -mt-2">Bu lead'in telefon numarası yok.</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
