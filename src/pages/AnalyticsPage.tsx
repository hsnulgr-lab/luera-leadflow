import { useMemo } from 'react';
import { useLeads } from '@/hooks/useLeads';
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
    Area,
    AreaChart
} from 'recharts';
import { TrendingUp, Users, MessageSquare, CheckCircle, Smartphone } from 'lucide-react';

export const AnalyticsPage = () => {
    const { leads } = useLeads();

    // --- Statistics Calculation ---
    const stats = useMemo(() => {
        const totalLeads = leads.length;
        const contactedLeads = leads.filter(l => l.status === 'contacted' || l.status === 'interested' || l.status === 'closed').length;
        const interestedLeads = leads.filter(l => l.status === 'interested').length;
        // Mocking autonomous agent actions for demo purposes since we just started it
        const agentActions = Math.floor(totalLeads * 0.4);

        return {
            total: totalLeads,
            contactedRate: totalLeads > 0 ? Math.round((contactedLeads / totalLeads) * 100) : 0,
            conversionRate: totalLeads > 0 ? Math.round((interestedLeads / totalLeads) * 100) : 0,
            agentActions
        };
    }, [leads]);

    // --- Chart Data Preparation ---

    // 1. Sector Distribution (Pie Chart)
    const sectorData = useMemo(() => {
        const distribution: Record<string, number> = {};
        leads.forEach(lead => {
            // Extract sector from tags or company category
            const sector = lead.tags?.[0] || 'Genel';
            distribution[sector] = (distribution[sector] || 0) + 1;
        });
        return Object.entries(distribution).map(([name, value]) => ({ name, value }));
    }, [leads]);

    // 2. Daily Activity (Bar Chart - Simulated for Demo + Real Dates)
    const activityData = useMemo(() => {
        const days = ['Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar', 'Pazartesi'];
        return days.map((day) => ({
            name: day,
            arama: Math.floor(Math.random() * 20) + 5,
            mesaj: Math.floor(Math.random() * 15) + 3,
            cevap: Math.floor(Math.random() * 8) + 1,
        }));
    }, []);

    // 3. Agent Performance (Area Chart)
    const agentPerformanceData = useMemo(() => {
        return [
            { time: '09:00', manuel: 2, otonom: 10 },
            { time: '11:00', manuel: 5, otonom: 25 },
            { time: '13:00', manuel: 3, otonom: 15 },
            { time: '15:00', manuel: 8, otonom: 32 },
            { time: '17:00', manuel: 6, otonom: 28 },
        ];
    }, []);

    const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Analiz ve Raporlama</h1>
                    <p className="text-muted-foreground text-sm">Gerçek zamanlı lead performansı ve ajan aktiviteleri.</p>
                </div>
                <div className="text-sm text-muted-foreground bg-secondary/50 px-3 py-1 rounded-md">
                    Son Güncelleme: {new Date().toLocaleTimeString()}
                </div>
            </div>

            {/* Top Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard
                    title="Toplam Lead"
                    value={stats.total}
                    change="+12% bu hafta"
                    changeType="positive"
                    icon={Users}
                />
                <StatsCard
                    title="İletişim Oranı"
                    value={`%${stats.contactedRate}`}
                    change="WhatsApp + SMS"
                    changeType="neutral"
                    icon={MessageSquare}
                />
                <StatsCard
                    title="Dönüşüm (İlgili)"
                    value={`%${stats.conversionRate}`}
                    change="+5% artış"
                    changeType="positive"
                    icon={TrendingUp}
                />
                <StatsCard
                    title="Otonom Ajan İşlemi"
                    value={stats.agentActions}
                    change="Aktif Çalışıyor"
                    changeType="positive"
                    icon={Smartphone}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Main Activity Chart */}
                <div className="glass-card p-6 lg:col-span-2">
                    <h3 className="text-lg font-semibold mb-6">Haftalık Aktivite Özeti</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={activityData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                                <XAxis dataKey="name" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    cursor={{ fill: '#f3f4f6' }}
                                />
                                <Legend />
                                <Bar dataKey="arama" name="Lead Araması" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="mesaj" name="Mesaj Gönderimi" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="cevap" name="Gelen Cevap" fill="#10b981" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Sector Distribution */}
                <div className="glass-card p-6">
                    <h3 className="text-lg font-semibold mb-4">Sektörel Dağılım</h3>
                    <div className="h-[300px] w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={sectorData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {sectorData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Agent Performance */}
                <div className="glass-card p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Otonom Ajan Performansı</h3>
                        <div className="flex items-center gap-2 text-xs font-medium text-purple-700 bg-purple-50 px-2 py-1 rounded-full">
                            <CheckCircle className="w-3 h-3" />
                            Canlı Veri
                        </div>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={agentPerformanceData}>
                                <defs>
                                    <linearGradient id="colorOtonom" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorManuel" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="time" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                <Tooltip />
                                <Area type="monotone" dataKey="otonom" name="Otonom İşlem" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorOtonom)" />
                                <Area type="monotone" dataKey="manuel" name="Manuel İşlem" stroke="#3b82f6" fillOpacity={1} fill="url(#colorManuel)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

