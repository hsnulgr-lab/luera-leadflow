import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { User, Bell, Globe, Key, Webhook, Save, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

export const SettingsPage = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState("profile");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [settingsLoaded, setSettingsLoaded] = useState(false);

    // Integrations State
    const [n8nSearchUrl, setN8nSearchUrl] = useState("");
    const [n8nAgentUrl, setN8nAgentUrl] = useState("");
    const [geminiKey, setGeminiKey] = useState("");
    const [evolutionInstance, setEvolutionInstance] = useState("");

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
                setN8nSearchUrl(data.n8n_webhook_url || import.meta.env.VITE_N8N_WEBHOOK_URL || "");
                setGeminiKey(data.gemini_api_key || import.meta.env.VITE_GEMINI_API_KEY || "");
                setEvolutionInstance(data.evolution_instance_name || "");
            } else {
                // Supabase'de kayıt yoksa env değerlerini varsayılan olarak yükle
                setN8nSearchUrl(import.meta.env.VITE_N8N_WEBHOOK_URL || "");
                setGeminiKey(import.meta.env.VITE_GEMINI_API_KEY || "");
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
                    n8n_webhook_url: n8nSearchUrl || null,
                    gemini_api_key: geminiKey || null,
                    evolution_instance_name: evolutionInstance || null,
                    updated_at: new Date().toISOString(),
                }, { onConflict: 'user_id' });

            if (error) {
                console.error('Ayarlar kaydedilemedi:', error);
                alert('Ayarlar kaydedilirken bir hata oluştu.');
                return;
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
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {!settingsLoaded && (
                                    <p className="text-sm text-muted-foreground">Ayarlar yükleniyor...</p>
                                )}

                                <div>
                                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                        <Webhook className="w-5 h-5 text-[#CCFF00]" />
                                        n8n Webhook Bağlantıları
                                    </h2>

                                    <div className="space-y-6 max-w-xl">
                                        <div>
                                            <label className="text-sm font-medium mb-1.5 block">Lead Arama Webhook'u</label>
                                            <p className="text-xs text-muted-foreground mb-2">
                                                Google Maps scraping ve lead bulma workflow'u.
                                            </p>
                                            <input
                                                type="text"
                                                value={n8nSearchUrl}
                                                onChange={(e) => setN8nSearchUrl(e.target.value)}
                                                placeholder="https://.../webhook/lead-search"
                                                className="w-full px-4 py-3 rounded-lg border border-border bg-secondary/30 font-mono text-sm focus:ring-2 focus:ring-gray-200 outline-none"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-sm font-medium mb-1.5 block">AI Ajan Webhook'u</label>
                                            <p className="text-xs text-muted-foreground mb-2">
                                                Website analizi ve mesaj yazma workflow'u.
                                            </p>
                                            <input
                                                type="text"
                                                value={n8nAgentUrl}
                                                onChange={(e) => setN8nAgentUrl(e.target.value)}
                                                placeholder="https://.../webhook/lead-agent"
                                                className="w-full px-4 py-3 rounded-lg border border-border bg-secondary/30 font-mono text-sm focus:ring-2 focus:ring-gray-200 outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-border/50">
                                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                        <Key className="w-5 h-5 text-[#CCFF00]" />
                                        Google Gemini API
                                    </h2>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Mesaj ve teklif oluşturma için kullanılan AI modelinin API anahtarı.
                                    </p>
                                    <div className="max-w-xl">
                                        <input
                                            type="password"
                                            value={geminiKey}
                                            onChange={(e) => setGeminiKey(e.target.value)}
                                            placeholder="AIzaSy..."
                                            className="w-full px-4 py-3 rounded-lg border border-border bg-secondary/30 font-mono text-sm focus:ring-2 focus:ring-gray-200 outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-border/50">
                                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                        <Globe className="w-5 h-5 text-[#CCFF00]" />
                                        WhatsApp (Evolution API)
                                    </h2>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Hesabınıza ait Evolution API instance adı. Kayıt sırasında otomatik oluşturulur.
                                    </p>
                                    <div className="max-w-xl">
                                        <input
                                            type="text"
                                            value={evolutionInstance}
                                            onChange={(e) => setEvolutionInstance(e.target.value)}
                                            placeholder="user_abc123..."
                                            className="w-full px-4 py-3 rounded-lg border border-border bg-secondary/30 font-mono text-sm focus:ring-2 focus:ring-gray-200 outline-none"
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
