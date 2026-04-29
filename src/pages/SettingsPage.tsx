import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { User, Bell, Globe, Save, CheckCircle2, MessageSquare, Radio } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

export const SettingsPage = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState("profile");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [settingsLoaded, setSettingsLoaded] = useState(false);

    // Integrations State
    const [evolutionInstance, setEvolutionInstance] = useState("");
    const [callflowApiKey, setCallflowApiKey] = useState("");

    // General State
    const [profileName, setProfileName] = useState(user?.name || "");
    const [email, setEmail] = useState(user?.email || "");
    const [theme, setTheme] = useState("light");

    // Notifications State
    const [notifications, setNotifications] = useState({
        email: true,
        push: true,
        sms: false,
        leadFound: true,
        agentAction: true
    });

    // Kullanıcıya özel ayarları Supabase'den yükle
    useEffect(() => {
        if (!user) return;

        const loadSettings = async () => {
            const { data, error } = await supabase
                .from('user_settings')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (!error && data) {
                setEvolutionInstance(data.evolution_instance_name || "");
                setCallflowApiKey(data.callflow_api_key || "");

                // localStorage'ı senkronize et — callflowService oradan okuyor
                if (data.callflow_api_key) localStorage.setItem("callflow_api_key", data.callflow_api_key);
            }

            setProfileName(user.name || "");
            setEmail(user.email || "");
            setSettingsLoaded(true);
        };

        loadSettings();
    }, [user]);

    const handleSave = async () => {
        if (!user) return;

        setLoading(true);
        setSuccess(false);

        try {
            const { error } = await supabase
                .from('user_settings')
                .upsert({
                    user_id: user.id,
                    evolution_instance_name: evolutionInstance || null,
                    callflow_api_key: callflowApiKey || null,
                    updated_at: new Date().toISOString(),
                }, { onConflict: 'user_id' });

            if (error) {
                console.error('Ayarlar kaydedilemedi:', error);
                alert('Ayarlar kaydedilirken bir hata oluştu.');
                return;
            }

            // localStorage'a da yaz — callflowService oradan okuyor
            if (callflowApiKey) {
                localStorage.setItem("callflow_api_key", callflowApiKey);
            } else {
                localStorage.removeItem("callflow_api_key");
            }

            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            console.error('Beklenmeyen hata:', err);
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { id: "profile", label: "Profil", icon: User },
        { id: "integrations", label: "Entegrasyonlar", icon: Globe },
        { id: "notifications", label: "Bildirimler", icon: Bell },
    ];

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <h1 className="text-3xl font-bold mb-2">Ayarlar</h1>
            <p className="text-muted-foreground mb-8">Uygulama tercihlerinizi ve bağlantılarınızı yönetin.</p>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar Navigation */}
                <div className="w-full md:w-64 flex-shrink-0">
                    <nav className="space-y-1">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id
                                        ? "bg-[#CCFF00]/15 text-gray-900"
                                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Content Area */}
                <div className="flex-1">
                    <div className="glass-card p-8 min-h-[500px]">
                        {/* PROFILE TAB */}
                        {activeTab === "profile" && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div>
                                    <h2 className="text-xl font-semibold mb-4">Profil Bilgileri</h2>
                                    <div className="grid gap-4 max-w-lg">
                                        <div>
                                            <label className="text-sm font-medium mb-1 block">İsim Soyisim</label>
                                            <input
                                                type="text"
                                                value={profileName}
                                                onChange={(e) => setProfileName(e.target.value)}
                                                className="w-full px-3 py-2 rounded-md border border-border bg-background/50 focus:ring-2 focus:ring-gray-200 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium mb-1 block">E-posta</label>
                                            <input
                                                type="email"
                                                value={email}
                                                disabled
                                                className="w-full px-3 py-2 rounded-md border border-border bg-background/50 opacity-60 cursor-not-allowed"
                                            />
                                            <p className="text-xs text-muted-foreground mt-1">E-posta değiştirilemez.</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-border/50">
                                    <h2 className="text-xl font-semibold mb-4">Görünüm</h2>
                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => setTheme("light")}
                                            className={`p-4 rounded-lg border-2 ${theme === "light" ? "border-[#CCFF00] bg-[#CCFF00]/10" : "border-border hover:border-border/80"} transition-all`}
                                        >
                                            <div className="w-24 h-16 bg-white rounded border border-gray-200 mb-2 shadow-sm"></div>
                                            <span className="text-sm font-medium">Aydınlık</span>
                                        </button>
                                        <button
                                            onClick={() => setTheme("dark")}
                                            className={`p-4 rounded-lg border-2 ${theme === "dark" ? "border-[#CCFF00] bg-[#CCFF00]/10" : "border-border hover:border-border/80"} transition-all`}
                                        >
                                            <div className="w-24 h-16 bg-gray-900 rounded border border-gray-700 mb-2 shadow-sm"></div>
                                            <span className="text-sm font-medium">Karanlık</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* INTEGRATIONS TAB */}
                        {activeTab === "integrations" && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {!settingsLoaded && (
                                    <p className="text-sm text-muted-foreground">Ayarlar yükleniyor...</p>
                                )}

                                {/* LUERA CallFlow */}
                                <div className={`rounded-2xl border-2 p-5 transition-colors ${callflowApiKey ? "border-[#CCFF00]/60 bg-[#CCFF00]/5" : "border-border bg-background/50"}`}>
                                    <div className="flex items-start gap-3 mb-4">
                                        <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center flex-shrink-0">
                                            <Radio className="w-4 h-4 text-[#CCFF00]" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-semibold text-gray-900">LUERA CallFlow</p>
                                            <p className="text-xs text-muted-foreground">Bulunan leadler otomatik CallFlow kampanyalarına aktarılır.</p>
                                        </div>
                                        {callflowApiKey && (
                                            <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                Bağlı
                                            </span>
                                        )}
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Bağlantı Anahtarı</label>
                                        <p className="text-xs text-muted-foreground mb-2">CallFlow → Ayarlar → Entegrasyonlar sayfasından kopyala.</p>
                                        <input
                                            type="text"
                                            value={callflowApiKey}
                                            onChange={(e) => setCallflowApiKey(e.target.value)}
                                            placeholder="86f5f4b2-8cfb-4b16-8d1e-..."
                                            className="w-full px-4 py-3 rounded-xl border border-border bg-white font-mono text-sm focus:ring-2 focus:ring-[#CCFF00]/30 focus:border-[#CCFF00]/50 outline-none"
                                        />
                                    </div>
                                </div>

                                {/* WhatsApp */}
                                <div className="rounded-2xl border border-border bg-background/50 p-5">
                                    <div className="flex items-start gap-3 mb-4">
                                        <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                                            <MessageSquare className="w-4 h-4 text-emerald-500" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900">WhatsApp</p>
                                            <p className="text-xs text-muted-foreground">Evolution API bağlantısı. Kayıt sırasında otomatik oluşturulur.</p>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Instance Adı</label>
                                        <input
                                            type="text"
                                            value={evolutionInstance}
                                            onChange={(e) => setEvolutionInstance(e.target.value)}
                                            placeholder="user_abc123..."
                                            className="w-full px-4 py-3 rounded-xl border border-border bg-white font-mono text-sm focus:ring-2 focus:ring-gray-200 outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* NOTIFICATIONS TAB */}
                        {activeTab === "notifications" && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div>
                                    <h2 className="text-xl font-semibold mb-6">Bildirim Tercihleri</h2>

                                    <div className="space-y-4 max-w-lg">
                                        <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-background/50">
                                            <div>
                                                <h3 className="font-medium">E-posta Bildirimleri</h3>
                                                <p className="text-xs text-muted-foreground">Önemli güncellemeleri mail olarak al.</p>
                                            </div>
                                            <div
                                                className={`w-11 h-6 rounded-full transition-colors cursor-pointer relative ${notifications.email ? 'bg-[#CCFF00]' : 'bg-gray-200'}`}
                                                onClick={() => setNotifications(prev => ({ ...prev, email: !prev.email }))}
                                            >
                                                <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${notifications.email ? 'translate-x-5' : ''}`}></div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-background/50">
                                            <div>
                                                <h3 className="font-medium">Yeni Lead Bulunduğunda</h3>
                                                <p className="text-xs text-muted-foreground">Otomatik arama yeni sonuçlar bulduğunda haber ver.</p>
                                            </div>
                                            <div
                                                className={`w-11 h-6 rounded-full transition-colors cursor-pointer relative ${notifications.leadFound ? 'bg-[#CCFF00]' : 'bg-gray-200'}`}
                                                onClick={() => setNotifications(prev => ({ ...prev, leadFound: !prev.leadFound }))}
                                            >
                                                <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${notifications.leadFound ? 'translate-x-5' : ''}`}></div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-background/50">
                                            <div>
                                                <h3 className="font-medium">Ajan Hareketleri</h3>
                                                <p className="text-xs text-muted-foreground">Otonom ajan mesaj gönderdiğinde bildirim gönder.</p>
                                            </div>
                                            <div
                                                className={`w-11 h-6 rounded-full transition-colors cursor-pointer relative ${notifications.agentAction ? 'bg-[#CCFF00]' : 'bg-gray-200'}`}
                                                onClick={() => setNotifications(prev => ({ ...prev, agentAction: !prev.agentAction }))}
                                            >
                                                <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${notifications.agentAction ? 'translate-x-5' : ''}`}></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Save Actions */}
                        <div className="mt-12 pt-6 border-t border-border flex justify-end gap-3">
                            <Button
                                variant="outline"
                                onClick={() => window.location.reload()}
                                disabled={loading}
                            >
                                İptal
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={loading}
                                className={success ? "bg-green-600 hover:bg-green-700" : "bg-[#CCFF00] hover:bg-[#b8e600] text-gray-900"}
                            >
                                {loading ? (
                                    "Kaydediliyor..."
                                ) : success ? (
                                    <>
                                        <CheckCircle2 className="w-4 h-4 mr-2" />
                                        Kaydedildi
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        Değişiklikleri Kaydet
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
