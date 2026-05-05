import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, Loader2, ArrowRight, CheckCircle2, Mail } from 'lucide-react';
import { cn } from '@/utils/cn';

type Mode = 'login' | 'signup' | 'forgot';

const AnimatedCounter = ({ target, suffix = '', duration = 2000, startAnimation }: {
    target: number; suffix?: string; duration?: number; startAnimation: boolean;
}) => {
    const [count, setCount] = useState(0);
    useEffect(() => {
        if (!startAnimation) return;
        let startTime: number;
        let af: number;
        const animate = (t: number) => {
            if (!startTime) startTime = t;
            const p = Math.min((t - startTime) / duration, 1);
            setCount(Math.floor((1 - Math.pow(1 - p, 3)) * target));
            if (p < 1) af = requestAnimationFrame(animate);
        };
        af = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(af);
    }, [target, duration, startAnimation]);
    return <>{count}{suffix}</>;
};

export const LoginPage = () => {
    const { user, login, signup, forgotPassword } = useAuth();
    const navigate = useNavigate();

    const [mode, setMode] = useState<Mode>('login');
    const [step, setStep] = useState(0);
    const [shake, setShake] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [forgotSuccess, setForgotSuccess] = useState(false);
    const [signupDone, setSignupDone] = useState(false); // email confirmation bekleniyor

    // Login fields
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Signup extra fields
    const [name, setName] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showConfirm, setShowConfirm] = useState(false);

    useEffect(() => {
        const timers = [
            setTimeout(() => setStep(1), 200),
            setTimeout(() => setStep(2), 500),
            setTimeout(() => setStep(3), 800),
            setTimeout(() => setStep(4), 1100),
        ];
        return () => timers.forEach(clearTimeout);
    }, []);

    useEffect(() => {
        if (user) navigate('/');
    }, [user, navigate]);

    const switchMode = (next: Mode) => {
        setError('');
        setForgotSuccess(false);
        setSignupDone(false);
        setMode(next);
    };

    const triggerShake = () => {
        setShake(true);
        setTimeout(() => setShake(false), 400);
    };

    // ── LOGIN ──────────────────────────────────────────────────────────
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!email || !password) { triggerShake(); return; }
        setIsLoading(true);
        const res = await login(email, password);
        setIsLoading(false);
        if (res.success) { navigate('/'); return; }
        setError(res.error || 'Giriş başarısız.');
        triggerShake();
    };

    // ── SIGNUP ─────────────────────────────────────────────────────────
    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!name || !email || !password || !confirmPassword) { triggerShake(); setError('Tüm alanları doldurun.'); return; }
        if (password !== confirmPassword) { triggerShake(); setError('Şifreler eşleşmiyor.'); return; }
        if (password.length < 6) { triggerShake(); setError('Şifre en az 6 karakter olmalı.'); return; }
        setIsLoading(true);
        const res = await signup(email, password, name);
        setIsLoading(false);
        if (res.success) {
            // Eğer session açıldıysa useEffect('/') yönlendirecek
            // Email onayı gerekliyse → login modunda bilgi banner'ı göster
            setError('');
            setMode('login');
            setSignupDone(true); // login modunda yeşil banner
            return;
        }
        setError(res.error || 'Kayıt başarısız.');
        triggerShake();
    };

    // ── FORGOT PASSWORD ────────────────────────────────────────────────
    const handleForgot = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!email) { triggerShake(); setError('E-posta adresinizi girin.'); return; }
        setIsLoading(true);
        const res = await forgotPassword(email);
        setIsLoading(false);
        if (res.success) { setForgotSuccess(true); return; }
        setError(res.error || 'Bir hata oluştu.');
        triggerShake();
    };

    // ── Heading copy per mode ──────────────────────────────────────────
    const heading = { login: 'Hoş geldiniz', signup: 'Hesap oluştur', forgot: 'Şifre sıfırla' };
    const subheading = {
        login: 'Lead yönetim platformunuza giriş yapın',
        signup: 'Ücretsiz hesabınızı hemen oluşturun',
        forgot: 'Sıfırlama bağlantısı e-postanıza gönderilecek',
    };

    const inputClass = "w-full h-14 px-5 bg-black/50 border border-white/10 rounded-xl text-white text-base placeholder:text-gray-600 focus:border-[#CCFF00]/50 focus:ring-2 focus:ring-[#CCFF00]/10 transition-all outline-none";

    return (
        <div className="min-h-screen bg-black flex overflow-hidden">

            {/* ── Left panel ──────────────────────────────────────────── */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-black">
                <div className="absolute inset-0">
                    <div className="aurora-bg absolute inset-0" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black" />
                </div>
                <div className="absolute inset-0 mesh-grid opacity-20" />
                <div className="relative z-10 flex flex-col justify-center px-16 w-full">
                    <div className={cn("transition-all duration-700", step >= 1 ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8")}>
                        <div className="mb-8">
                            <h1 className="text-4xl font-bold text-white">LUERA</h1>
                            <p className="text-[#CCFF00] text-sm tracking-[0.3em] uppercase mt-1">LeadFlow</p>
                        </div>
                    </div>
                    <div className={cn("transition-all duration-700 delay-100", step >= 2 ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8")}>
                        <h2 className="text-5xl font-bold text-white leading-tight mb-6">
                            Potansiyel müşterilerinizi<br />
                            <span className="text-gradient">akıllıca yönetin.</span>
                        </h2>
                    </div>
                    <div className={cn("transition-all duration-700 delay-200", step >= 3 ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8")}>
                        <div className="space-y-4">
                            {['Otomatik lead toplama', 'WhatsApp entegrasyonu', 'AI destekli mesajlaşma'].map(f => (
                                <div key={f} className="flex items-center gap-3 text-gray-400">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#CCFF00]" />
                                    <span>{f}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className={cn("mt-12 flex gap-12 transition-all duration-700 delay-300", step >= 4 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8")}>
                        {[{ val: 10, s: 'K+', l: 'Lead' }, { val: 500, s: '+', l: 'İşletme' }, { val: 98, s: '%', l: 'Memnuniyet', pre: '%' }].map(({ val, s, l, pre }) => (
                            <div key={l}>
                                <div className="text-3xl font-bold text-[#CCFF00]">
                                    {pre}{!pre && <AnimatedCounter target={val} suffix={s} duration={1500} startAnimation={step >= 4} />}
                                    {pre && <AnimatedCounter target={val} suffix="" duration={1500} startAnimation={step >= 4} />}
                                </div>
                                <div className="text-sm text-gray-500">{l}</div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="absolute bottom-20 right-20 w-32 h-32 border border-[#CCFF00]/20 rounded-full animate-float" />
                <div className="absolute top-40 right-40 w-20 h-20 border border-[#CCFF00]/10 rounded-lg rotate-45 animate-float-slow" />
            </div>

            {/* ── Right panel ─────────────────────────────────────────── */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#CCFF00]/[0.02] rounded-full blur-[100px]" />

                <div className={cn("w-full max-w-md relative transition-all duration-700", step >= 2 ? "opacity-100 scale-100" : "opacity-0 scale-95")}>

                    {/* Mobile logo */}
                    <div className="lg:hidden text-center mb-10">
                        <span className="text-xl font-bold text-white">LUERA </span>
                        <span className="text-xl font-bold text-[#CCFF00]">LeadFlow</span>
                    </div>

                    {/* Heading — animates on mode change */}
                    <div className="mb-8 text-center">
                        <div className="relative inline-block">
                            <div className="absolute inset-0 blur-2xl bg-[#CCFF00]/20 scale-150" />
                            <h2 className="relative text-4xl font-black mb-3 tracking-tight text-white transition-all duration-300">
                                {heading[mode]}
                            </h2>
                        </div>
                        <p className="text-gray-400 text-base transition-all duration-300">{subheading[mode]}</p>
                    </div>

                    {/* Card */}
                    <div className="relative">
                        <div className="absolute -inset-[1px] bg-gradient-to-b from-[#CCFF00]/30 via-[#CCFF00]/10 to-transparent rounded-2xl blur-sm" />
                        <div className={cn("relative bg-[#111]/90 backdrop-blur-xl rounded-2xl border border-white/10 p-8", shake && "animate-shake")}>

                            {/* ── Signup success banner ── */}
                            {signupDone && mode === 'login' && (
                                <div className="mb-4 px-4 py-3 rounded-xl bg-[#CCFF00]/10 border border-[#CCFF00]/30 text-[#CCFF00] text-sm text-center flex items-center justify-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                                    Hesabınız oluşturuldu! E-postanızı doğrulayın veya giriş yapın.
                                </div>
                            )}

                            {/* ── Error banner ── */}
                            {error && (
                                <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                                    {error}
                                </div>
                            )}

                            {/* ── FORGOT SUCCESS ── */}
                            {mode === 'forgot' && forgotSuccess ? (
                                <div className="text-center py-6">
                                    <div className="w-16 h-16 rounded-full bg-[#CCFF00]/10 flex items-center justify-center mx-auto mb-4">
                                        <CheckCircle2 className="w-8 h-8 text-[#CCFF00]" />
                                    </div>
                                    <h3 className="text-white font-bold text-lg mb-2">E-posta Gönderildi!</h3>
                                    <p className="text-gray-400 text-sm mb-6">
                                        <span className="text-[#CCFF00]">{email}</span> adresine şifre sıfırlama bağlantısı gönderildi. Gelen kutunuzu kontrol edin.
                                    </p>
                                    <button onClick={() => switchMode('login')} className="text-sm text-[#CCFF00] hover:underline">
                                        Giriş sayfasına dön
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {/* ── LOGIN FORM ── */}
                                    {mode === 'login' && (
                                        <form onSubmit={handleLogin} className="space-y-5">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                                    <Mail className="w-4 h-4 text-[#CCFF00]" /> E-posta
                                                </label>
                                                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                                                    className={inputClass} placeholder="ornek@mail.com" autoComplete="email" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                                    <svg className="w-4 h-4 text-[#CCFF00]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                    </svg>
                                                    Şifre
                                                </label>
                                                <div className="relative">
                                                    <input type={showPassword ? 'text' : 'password'} value={password}
                                                        onChange={e => setPassword(e.target.value)}
                                                        className={cn(inputClass, "pr-14")} placeholder="••••••••" autoComplete="current-password" />
                                                    <button type="button" onClick={() => setShowPassword(v => !v)}
                                                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-[#CCFF00] transition-colors rounded-lg hover:bg-white/5">
                                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <button type="button" onClick={() => switchMode('forgot')}
                                                    className="text-sm text-gray-400 hover:text-[#CCFF00] transition-colors">
                                                    Şifremi unuttum
                                                </button>
                                            </div>
                                            <button type="submit" disabled={isLoading}
                                                className="w-full h-14 mt-1 rounded-xl font-bold text-base bg-[#CCFF00] text-black hover:bg-[#d4ff33] transition-all hover:shadow-xl hover:shadow-[#CCFF00]/30 disabled:opacity-50 flex items-center justify-center gap-2 group relative overflow-hidden">
                                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                                                <span className="relative flex items-center gap-2">
                                                    {isLoading ? <><Loader2 className="w-5 h-5 animate-spin" />Giriş yapılıyor...</> : <>Giriş Yap <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>}
                                                </span>
                                            </button>
                                            <p className="text-center text-gray-500 text-sm pt-1">
                                                Hesabın yok mu?{' '}
                                                <button type="button" onClick={() => switchMode('signup')}
                                                    className="text-[#CCFF00] hover:underline font-medium">
                                                    Ücretsiz kaydol
                                                </button>
                                            </p>
                                        </form>
                                    )}

                                    {/* ── SIGNUP FORM ── */}
                                    {mode === 'signup' && (
                                        <form onSubmit={handleSignup} className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-gray-300">Ad Soyad</label>
                                                <input type="text" value={name} onChange={e => setName(e.target.value)}
                                                    className={inputClass} placeholder="Furkan Ülger" autoComplete="name" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-gray-300">E-posta</label>
                                                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                                                    className={inputClass} placeholder="ornek@mail.com" autoComplete="email" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-gray-300">Şifre</label>
                                                <div className="relative">
                                                    <input type={showPassword ? 'text' : 'password'} value={password}
                                                        onChange={e => setPassword(e.target.value)}
                                                        className={cn(inputClass, "pr-14")} placeholder="En az 6 karakter" autoComplete="new-password" />
                                                    <button type="button" onClick={() => setShowPassword(v => !v)}
                                                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-[#CCFF00] transition-colors rounded-lg hover:bg-white/5">
                                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-gray-300">Şifreyi Onayla</label>
                                                <div className="relative">
                                                    <input type={showConfirm ? 'text' : 'password'} value={confirmPassword}
                                                        onChange={e => setConfirmPassword(e.target.value)}
                                                        className={cn(inputClass, "pr-14", confirmPassword && password !== confirmPassword ? "border-red-500/50" : "")}
                                                        placeholder="Şifreyi tekrar girin" autoComplete="new-password" />
                                                    <button type="button" onClick={() => setShowConfirm(v => !v)}
                                                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-[#CCFF00] transition-colors rounded-lg hover:bg-white/5">
                                                        {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                                    </button>
                                                    {confirmPassword && password === confirmPassword && (
                                                        <CheckCircle2 className="absolute right-12 top-1/2 -translate-y-1/2 w-4 h-4 text-[#CCFF00]" />
                                                    )}
                                                </div>
                                            </div>
                                            <button type="submit" disabled={isLoading}
                                                className="w-full h-14 mt-1 rounded-xl font-bold text-base bg-[#CCFF00] text-black hover:bg-[#d4ff33] transition-all hover:shadow-xl hover:shadow-[#CCFF00]/30 disabled:opacity-50 flex items-center justify-center gap-2 group relative overflow-hidden">
                                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                                                <span className="relative flex items-center gap-2">
                                                    {isLoading ? <><Loader2 className="w-5 h-5 animate-spin" />Hesap oluşturuluyor...</> : <>Hesap Oluştur <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>}
                                                </span>
                                            </button>
                                            <p className="text-center text-gray-500 text-sm pt-1">
                                                Zaten hesabın var mı?{' '}
                                                <button type="button" onClick={() => switchMode('login')}
                                                    className="text-[#CCFF00] hover:underline font-medium">
                                                    Giriş yap
                                                </button>
                                            </p>
                                        </form>
                                    )}

                                    {/* ── FORGOT PASSWORD FORM ── */}
                                    {mode === 'forgot' && (
                                        <form onSubmit={handleForgot} className="space-y-5">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                                    <Mail className="w-4 h-4 text-[#CCFF00]" /> E-posta adresi
                                                </label>
                                                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                                                    className={inputClass} placeholder="ornek@mail.com" autoComplete="email" />
                                            </div>
                                            <p className="text-gray-500 text-xs leading-relaxed">
                                                Hesabınıza kayıtlı e-posta adresini girin. Şifre sıfırlama bağlantısı birkaç saniye içinde iletilecek.
                                            </p>
                                            <button type="submit" disabled={isLoading}
                                                className="w-full h-14 rounded-xl font-bold text-base bg-[#CCFF00] text-black hover:bg-[#d4ff33] transition-all hover:shadow-xl hover:shadow-[#CCFF00]/30 disabled:opacity-50 flex items-center justify-center gap-2 group relative overflow-hidden">
                                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                                                <span className="relative flex items-center gap-2">
                                                    {isLoading ? <><Loader2 className="w-5 h-5 animate-spin" />Gönderiliyor...</> : <>Sıfırlama Linki Gönder <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>}
                                                </span>
                                            </button>
                                            <p className="text-center text-gray-500 text-sm pt-1">
                                                <button type="button" onClick={() => switchMode('login')}
                                                    className="text-[#CCFF00] hover:underline font-medium">
                                                    ← Giriş sayfasına dön
                                                </button>
                                            </p>
                                        </form>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    <p className="text-center text-gray-700 text-xs mt-8">© 2026 LUERA. Tüm hakları saklıdır.</p>
                </div>
            </div>

            <style>{`
                .aurora-bg {
                    background: radial-gradient(ellipse at 20% 50%, rgba(204,255,0,0.15) 0%, transparent 50%),
                                radial-gradient(ellipse at 80% 20%, rgba(204,255,0,0.1) 0%, transparent 40%),
                                radial-gradient(ellipse at 40% 80%, rgba(204,255,0,0.08) 0%, transparent 50%);
                    animation: aurora 15s ease-in-out infinite;
                }
                @keyframes aurora {
                    0%,100% { transform: scale(1) rotate(0deg); opacity: 1; }
                    33% { transform: scale(1.1) rotate(5deg); opacity: 0.8; }
                    66% { transform: scale(0.95) rotate(-3deg); opacity: 1; }
                }
                .mesh-grid {
                    background-image: linear-gradient(rgba(204,255,0,0.1) 1px, transparent 1px),
                                      linear-gradient(90deg, rgba(204,255,0,0.1) 1px, transparent 1px);
                    background-size: 50px 50px;
                    animation: meshMove 30s linear infinite;
                }
                @keyframes meshMove { 0% { background-position: 0 0; } 100% { background-position: 50px 50px; } }
                .text-gradient {
                    background: linear-gradient(135deg, #CCFF00 0%, #a8ff00 50%, #CCFF00 100%);
                    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
                }
                @keyframes float { 0%,100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-20px) rotate(5deg); } }
                .animate-float { animation: float 6s ease-in-out infinite; }
                @keyframes float-slow { 0%,100% { transform: translateY(0) rotate(45deg); } 50% { transform: translateY(-15px) rotate(50deg); } }
                .animate-float-slow { animation: float-slow 8s ease-in-out infinite; }
                @keyframes shake { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
                .animate-shake { animation: shake 0.3s ease-in-out; }
            `}</style>
        </div>
    );
};
