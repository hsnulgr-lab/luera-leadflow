import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { User, Globe, Save, CheckCircle2, MessageSquare, Radio, Building2, Instagram, Link, Sparkles, Info } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

interface SettingsData {
    evolutionInstance: string;
    callflowApiKey: string;
    businessName: string;
    businessSector: string;
    businessOffer: string;
    senderName: string;
    businessWebsite: string;
    businessInstagram: string;
}

const DEFAULT_DATA: SettingsData = {
    evolutionInstance: "",
    callflowApiKey: "",
    businessName: "",
    businessSector: "",
    businessOffer: "",
    senderName: "",
    businessWebsite: "",
    businessInstagram: "",
};

export const SettingsPage = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState("profile");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [settingsLoaded, setSettingsLoaded] = useState(false);

    // Single source of truth — saved state from DB
    const [saved, setSaved] = useState<SettingsData>(DEFAULT_DATA);
    // Working copy — what user is editing
    const [draft, setDraft] = useState<SettingsData>(DEFAULT_DATA);

    const profileName = user?.name || "";
    const email = user?.email || "";

    // Load settings from Supabase
    useEffect(() => {
        if (!user) return;

        const loadSettings = async () => {
            const { data, error } = await supabase
                .from('user_settings')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (!error && data) {
                const loaded: SettingsData = {
                    evolutionInstance: data.evolution_instance_name || "",
                    callflowApiKey: data.callflow_api_key || "",
                    businessName: data.business_name || "",
                    businessSector: data.business_sector || "",
                    businessOffer: data.business_offer || "",
                    senderName: data.sender_name || "",
                    businessWebsite: data.business_website || "",
                    businessInstagram: data.business_instagram || "",
                };
                setSaved(loaded);
                setDraft(loaded);

                if (data.callflow_api_key) localStorage.setItem("callflow_api_key", data.callflow_api_key);
            }

            setSettingsLoaded(true);
        };

        loadSettings();
    }, [user]);

    const isDirty = JSON.stringify(draft) !== JSON.stringify(saved);

    const handleSave = async () => {
        if (!user) return;

        setLoading(true);
        setSuccess(false);

        try {
            const { error } = await supabase
                .from('user_settings')
                .upsert({
                    user_id: user.id,
                    evolution_instance_name: draft.evolutionInstance || null,
                    callflow_api_key: draft.callflowApiKey || null,
                    business_name: draft.businessName || null,
                    business_sector: draft.businessSector || null,
                    business_offer: draft.businessOffer || null,
                    sender_name: draft.senderName || null,
                    business_website: draft.businessWebsite || null,
                    business_instagram: draft.businessInstagram || null,
                    updated_at: new Date().toISOString(),
                }, { onConflict: 'user_id' });

            if (error) {
                console.error('Ayarlar kaydedilemedi:', error);
                alert('Ayarlar kaydedilirken bir hata oluştu.');
                return;
            }

            if (draft.callflowApiKey) {
                localStorage.setItem("callflow_api_key", draft.callflowApiKey);
            } else {
                localStorage.removeItem("callflow_api_key");
            }

            setSaved({ ...draft });
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            console.error('Beklenmeyen hata:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setDraft({ ...saved });
    };

    const update = (field: keyof SettingsData, value: string) => {
        setDraft(prev => ({ ...prev, [field]: value }));
    };

    const tabs = [
        { id: "profile", label: "Profil", icon: User },
        { id: "business", label: "İşletme", icon: Building2 },
        { id: "integrations", label: "Entegrasyonlar", icon: Globe },
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
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div>
                                    <h2 className="text-xl font-semibold mb-4">Profil Bilgileri</h2>
                                    <div className="grid gap-4 max-w-lg">
                                        <div>
                                            <label className="text-sm font-medium mb-1 block">İsim Soyisim</label>
                                            <input
                                                type="text"
                                                value={profileName}
                                                disabled
                                                className="w-full px-3 py-2 rounded-md border border-border bg-background/50 opacity-60 cursor-not-allowed"
                                            />
                                            <p className="text-xs text-muted-foreground mt-1">İsim değiştirme özelliği yakında gelecek.</p>
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

                                {/* Account info */}
                                <div className="max-w-lg p-4 rounded-xl bg-slate-50 border border-slate-100">
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-full bg-[#CCFF00] flex items-center justify-center text-slate-900 font-bold flex-shrink-0">
                                            {profileName.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900">{profileName}</p>
                                            <p className="text-sm text-gray-500">{email}</p>
                                            <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-[#CCFF00]/20 text-xs font-semibold text-gray-700">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                Premium
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* BUSINESS TAB */}
                        {activeTab === "business" && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div>
                                    <h2 className="text-xl font-semibold mb-1">İşletme Bilgileri</h2>
                                    <p className="text-sm text-muted-foreground mb-6">Bu bilgiler WhatsApp mesajlarını kişiselleştirmek için kullanılır.</p>

                                    {/* Önizleme kutusu */}
                                    <div className="mb-6 p-4 rounded-2xl bg-slate-900 border border-slate-700">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Sparkles className="w-4 h-4 text-[#CCFF00]" />
                                            <span className="text-xs font-bold text-[#CCFF00] uppercase tracking-wider">Mesaj Önizleme</span>
                                        </div>
                                        <p className="text-sm text-slate-300 leading-relaxed">
                                            "Merhaba! Ben <span className="text-[#CCFF00] font-semibold">{draft.senderName || "Furkan"}</span>,{" "}
                                            <span className="text-[#CCFF00] font-semibold">{draft.businessName || "Luera Ajans"}</span>'dan ulaşıyorum.{" "}
                                            {draft.businessSector && <span className="text-slate-400">[{draft.businessSector}]</span>}{" "}
                                            {draft.businessOffer ? draft.businessOffer.slice(0, 60) + "..." : "Sizin için özel bir teklifimiz var."}"
                                        </p>
                                    </div>

                                    <div className="grid gap-5 max-w-lg">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-sm font-medium mb-1.5 block">Gönderen Adı</label>
                                                <input
                                                    type="text"
                                                    value={draft.senderName}
                                                    onChange={(e) => update("senderName", e.target.value)}
                                                    placeholder="Furkan"
                                                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background/50 focus:ring-2 focus:ring-[#CCFF00]/30 focus:border-[#CCFF00]/50 outline-none text-sm"
                                                />
                                                <p className="text-[11px] text-muted-foreground mt-1">Mesajda "Ben X'ten..." diye geçer</p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium mb-1.5 block">Şirket / Marka Adı</label>
                                                <input
                                                    type="text"
                                                    value={draft.businessName}
                                                    onChange={(e) => update("businessName", e.target.value)}
                                                    placeholder="Luera Ajans"
                                                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background/50 focus:ring-2 focus:ring-[#CCFF00]/30 focus:border-[#CCFF00]/50 outline-none text-sm"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-sm font-medium mb-1.5 block">Sektör / Uzmanlık Alanı</label>
                                            <input
                                                type="text"
                                                value={draft.businessSector}
                                                onChange={(e) => update("businessSector", e.target.value)}
                                                placeholder="örn: Dijital Pazarlama, Web Tasarım, CRM..."
                                                className="w-full px-3 py-2.5 rounded-xl border border-border bg-background/50 focus:ring-2 focus:ring-[#CCFF00]/30 focus:border-[#CCFF00]/50 outline-none text-sm"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-sm font-medium mb-1.5 flex items-center gap-1.5">
                                                Değer Öneriniz
                                                <span className="text-[10px] font-normal text-muted-foreground bg-slate-100 px-2 py-0.5 rounded-full">AI bunu kullanır</span>
                                            </label>
                                            <textarea
                                                value={draft.businessOffer}
                                                onChange={(e) => update("businessOffer", e.target.value)}
                                                placeholder="Müşterilere ne sunuyorsunuz? Kısaca yazın...&#10;örn: Google ve Instagram reklamlarıyla işletmelere yeni müşteri buluyoruz."
                                                rows={3}
                                                className="w-full px-3 py-2.5 rounded-xl border border-border bg-background/50 focus:ring-2 focus:ring-[#CCFF00]/30 focus:border-[#CCFF00]/50 outline-none text-sm resize-none"
                                            />
                                            <p className="text-[11px] text-muted-foreground mt-1">AI bu metni kullanarak her müşteriye özel teklif mesajı yazar.</p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-sm font-medium mb-1.5 flex items-center gap-1.5">
                                                    <Link className="w-3.5 h-3.5" /> Website
                                                </label>
                                                <input
                                                    type="text"
                                                    value={draft.businessWebsite}
                                                    onChange={(e) => update("businessWebsite", e.target.value)}
                                                    placeholder="lueratech.com"
                                                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background/50 focus:ring-2 focus:ring-[#CCFF00]/30 focus:border-[#CCFF00]/50 outline-none text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium mb-1.5 flex items-center gap-1.5">
                                                    <Instagram className="w-3.5 h-3.5" /> Instagram
                                                </label>
                                                <input
                                                    type="text"
                                                    value={draft.businessInstagram}
                                                    onChange={(e) => update("businessInstagram", e.target.value)}
                                                    placeholder="@lueratech"
                                                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background/50 focus:ring-2 focus:ring-[#CCFF00]/30 focus:border-[#CCFF00]/50 outline-none text-sm"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-2.5 p-3 bg-blue-50 rounded-xl border border-blue-100">
                                            <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                                            <p className="text-xs text-blue-700 leading-relaxed">
                                                Bu bilgiler WhatsApp mesajlarını oluşturan AI'a aktarılır. Ne kadar detaylı doldurursan mesajlar o kadar kişisel görünür.
                                            </p>
                                        </div>
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
                                <div className={`rounded-2xl border-2 p-5 transition-colors ${draft.callflowApiKey ? "border-[#CCFF00]/60 bg-[#CCFF00]/5" : "border-border bg-background/50"}`}>
                                    <div className="flex items-start gap-3 mb-4">
                                        <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center flex-shrink-0">
                                            <Radio className="w-4 h-4 text-[#CCFF00]" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-semibold text-gray-900">LUERA CallFlow</p>
                                            <p className="text-xs text-muted-foreground">Bulunan leadler otomatik CallFlow kampanyalarına aktarılır.</p>
                                        </div>
                                        {draft.callflowApiKey && (
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
                                            value={draft.callflowApiKey}
                                            onChange={(e) => update("callflowApiKey", e.target.value)}
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
                                            value={draft.evolutionInstance}
                                            onChange={(e) => update("evolutionInstance", e.target.value)}
                                            placeholder="user_abc123..."
                                            className="w-full px-4 py-3 rounded-xl border border-border bg-white font-mono text-sm focus:ring-2 focus:ring-gray-200 outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Save Actions */}
                        <div className="mt-12 pt-6 border-t border-border flex justify-end gap-3">
                            <Button
                                variant="outline"
                                onClick={handleCancel}
                                disabled={loading || !isDirty}
                            >
                                İptal
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={loading || !isDirty}
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
