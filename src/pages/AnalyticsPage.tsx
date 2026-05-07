import { useMemo, useState, useEffect } from 'react';
import { useLeads } from '@/hooks/useLeads';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { StatsCard } from '@/components/dashboard/StatsCard';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from 'recharts';
import { TrendingUp, Users, MessageSquare, Send } from 'lucide-react';

// ── Yardımcı: Son N günün tarih dizisi ──────────────────────────────────────
function lastNDays(n: number): string[] {
    return Array.from({ length: n }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (n - 1 - i));
        return d.toISOString().split('T')[0]; // YYYY-MM-DD
    });
}

// ── Yardımcı: YYYY-MM-DD → "12 May" formatı ─────────────────────────────────
function formatDateLabel(dateStr: string): string {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
}

// ── Tip tanımları ─────────────────────────────────────────────────────────────
interface WeeklyRow {
    name: string;   // "12 May"
    arama: number;
    mesaj: number;
}

interface SearchUsageRow {
    date: string;
    count: number;
}

interface SentLogRow {
    sent_at: string;
}

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

const STATUS_LABELS: Record<string, string> = {
    new: 'Yeni',
    contacted: 'İletişime Geçildi',
    interested: 'İlgilendi',
    closed: 'Kapandı',
};

const STATUS_COLORS: Record<string, string> = {
    new: '#3b82f6',
    contacted: '#f59e0b',
    interested: '#10b981',
    closed: '#8b5cf6',
};

// ─────────────────────────────────────────────────────────────────────────────

export const AnalyticsPage = () => {
    const { leads } = useLeads();
    const { user } = useAuth();

    const [weeklyData, setWeeklyData] = useState<WeeklyRow[]>([]);
    const [totalMessagesSent, setTotalMessagesSent] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    // ── Supabase'den gerçek veri çek ─────────────────────────────────────────
    useEffect(() => {
        if (!user) return;

        const fetchRealData = async () => {
            setIsLoading(true);
            const days = lastNDays(7);
            const startDate = days[0];

            // 1. Arama sayıları — search_usage tablosu
            const { data: searchRows } = await supabase
                .from('search_usage')
                .select('date, count')
                .eq('user_id', user.id)
                .gte('date', startDate) as { data: SearchUsageRow[] | null };

            const searchMap: Record<string, number> = {};
            (searchRows ?? []).forEach(row => {
                searchMap[row.date] = row.count;
            });

            // 2. Gönderilen mesajlar — whatsapp_sent_log tablosu
            const { data: sentRows } = await supabase
                .from('whatsapp_sent_log')
                .select('sent_at')
                .eq('user_id', user.id)
                .gte('sent_at', startDate + 'T00:00:00.000Z') as { data: SentLogRow[] | null };

            const sentMap: Record<string, number> = {};
            (sentRows ?? []).forEach(row => {
                const day = row.sent_at.split('T')[0];
                sentMap[day] = (sentMap[day] ?? 0) + 1;
            });

            // 3. Toplam gönderilen mesaj sayısı (tüm zamanlar)
            const { count: totalSent } = await supabase
                .from('whatsapp_sent_log')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id);

            setTotalMessagesSent(totalSent ?? 0);

            // 4. Haftalık grafik verisini birleştir
            const merged: WeeklyRow[] = days.map(date => ({
                name: formatDateLabel(date),
                arama: searchMap[date] ?? 0,
                mesaj: sentMap[date] ?? 0,
            }));

            setWeeklyData(merged);
            setIsLoading(false);
        };

        fetchRealData();
    }, [user]);

    // ── Lead istatistikleri (leads DB'den geliyor, gerçek veri) ──────────────
    const stats = useMemo(() => {
        const total = leads.length;

        const contacted = leads.filter(l =>
            l.status === 'contacted' || l.status === 'interested' || l.status === 'closed'
        ).length;

        const interested = leads.filter(l => l.status === 'interested').length;

        // Bu hafta eklenen leadler
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const thisWeekLeads = leads.filter(l => new Date(l.dateAdded) >= weekAgo).length;

        // Geçen hafta eklenen leadler (karşılaştırma için)
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
        const lastWeekLeads = leads.filter(l => {
            const d = new Date(l.dateAdded);
            return d >= twoWeeksAgo && d < weekAgo;
        }).length;

        const weekChange = lastWeekLeads > 0
            ? Math.round(((thisWeekLeads - lastWeekLeads) / lastWeekLeads) * 100)
            : thisWeekLeads > 0 ? 100 : 0;

        const contactedRate = total > 0 ? Math.round((contacted / total) * 100) : 0;
        const conversionRate = total > 0 ? Math.round((interested / total) * 100) : 0;

        return { total, thisWeekLeads, weekChange, contactedRate, conversionRate };
    }, [leads]);

    // ── Sektörel dağılım (leads tablosundan, gerçek veri) ────────────────────
    const sectorData = useMemo(() => {
        const dist: Record<string, number> = {};
        leads.forEach(lead => {
            const sector = lead.apolloSector || lead.tags?.[0] || 'Genel';
            dist[sector] = (dist[sector] ?? 0) + 1;
        });
        return Object.entries(dist)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(([name, value]) => ({ name, value }));
    }, [leads]);

    // ── Lead durumu dağılımı (leads tablosundan, gerçek veri) ────────────────
    const statusData = useMemo(() => {
        const dist: Record<string, number> = { new: 0, contacted: 0, interested: 0, closed: 0 };
        leads.forEach(lead => {
            if (lead.status in dist) dist[lead.status]++;
        });
        return Object.entries(dist).map(([status, count]) => ({
            name: STATUS_LABELS[status] ?? status,
            count,
            fill: STATUS_COLORS[status] ?? '#6b7280',
        }));
    }, [leads]);

    // ── Yükleniyor durumu ─────────────────────────────────────────────────────
    const weekChangeLabel = stats.weekChange > 0
        ? `+${stats.weekChange}% geçen haftaya göre`
        : stats.weekChange < 0
            ? `${stats.weekChange}% geçen haftaya göre`
            : 'Geçen haftayla aynı';

    const weekChangeType = stats.weekChange > 0 ? 'positive' : stats.weekChange < 0 ? 'negative' : 'neutral';

    return (
        <div className="p-6 space-y-6">
            {/* Başlık */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Analiz ve Raporlama</h1>
                    <p className="text-muted-foreground text-sm">Hesabınıza ait gerçek zamanlı veriler.</p>
                </div>
                <div className="text-sm text-muted-foreground bg-secondary/50 px-3 py-1 rounded-md">
                    Son Güncelleme: {new Date().toLocaleTimeString('tr-TR')}
                </div>
            </div>

            {/* Stat Kartları */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard
                    title="Toplam Lead"
                    value={stats.total}
                    change={`Bu hafta ${stats.thisWeekLeads} yeni`}
                    changeType="positive"
                    icon={Users}
                />
                <StatsCard
                    title="Bu Hafta Eklendi"
                    value={stats.thisWeekLeads}
                    change={weekChangeLabel}
                    changeType={weekChangeType}
                    icon={TrendingUp}
                />
                <StatsCard
                    title="Gönderilen Mesaj"
                    value={totalMessagesSent}
                    change={`${stats.contactedRate}% iletişim oranı`}
                    changeType="neutral"
                    icon={Send}
                />
                <StatsCard
                    title="Dönüşüm (İlgili)"
                    value={`%${stats.conversionRate}`}
                    change={`${leads.filter(l => l.status === 'interested').length} ilgili lead`}
                    changeType={stats.conversionRate > 0 ? 'positive' : 'neutral'}
                    icon={MessageSquare}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Haftalık Aktivite Grafiği — Gerçek Veri */}
                <div className="glass-card p-6 lg:col-span-2">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold">Son 7 Günlük Aktivite</h3>
                        {isLoading && (
                            <span className="text-xs text-muted-foreground animate-pulse">Yükleniyor...</span>
                        )}
                    </div>
                    <div className="h-[300px] w-full">
                        {!isLoading && weeklyData.every(d => d.arama === 0 && d.mesaj === 0) ? (
                            <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
                                <p className="text-sm">Henüz aktivite verisi yok.</p>
                                <p className="text-xs">Lead arama veya mesaj gönderdikçe burada görünecek.</p>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={weeklyData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                                    <XAxis dataKey="name" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                                    />
                                    <Legend />
                                    <Bar dataKey="arama" name="Lead Araması" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="mesaj" name="Gönderilen Mesaj" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Sektörel Dağılım — Gerçek Veri */}
                <div className="glass-card p-6">
                    <h3 className="text-lg font-semibold mb-4">Sektörel Dağılım</h3>
                    <div className="h-[300px] w-full flex items-center justify-center">
                        {sectorData.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Lead ekledikçe burada görünecek.</p>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={sectorData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={90}
                                        paddingAngle={4}
                                        dataKey="value"
                                    >
                                        {sectorData.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(v) => [`${v ?? 0} lead`, '']} />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Lead Durumu Dağılımı — Gerçek Veri */}
                <div className="glass-card p-6">
                    <h3 className="text-lg font-semibold mb-4">Lead Durumu</h3>
                    <div className="h-[300px] w-full">
                        {leads.length === 0 ? (
                            <div className="h-full flex items-center justify-center">
                                <p className="text-sm text-muted-foreground">Henüz lead yok.</p>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={statusData} layout="vertical" barSize={28}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                                    <XAxis type="number" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                                    <YAxis type="category" dataKey="name" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} width={120} />
                                    <Tooltip
                                        formatter={(v) => [`${v ?? 0} lead`, 'Adet']}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="count" name="Lead Sayısı" radius={[0, 4, 4, 0]}>
                                        {statusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
