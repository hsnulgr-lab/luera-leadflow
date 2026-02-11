import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

import { Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';
import { cn } from '@/utils/cn';

// Animated counter component
const AnimatedCounter = ({ target, suffix = '', duration = 2000, startAnimation }: { target: number; suffix?: string; duration?: number; startAnimation: boolean }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (!startAnimation) return;

        let startTime: number;
        let animationFrame: number;

        const animate = (currentTime: number) => {
            if (!startTime) startTime = currentTime;
            const progress = Math.min((currentTime - startTime) / duration, 1);

            // Easing function for smooth animation
            const easeOut = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(easeOut * target));

            if (progress < 1) {
                animationFrame = requestAnimationFrame(animate);
            }
        };

        animationFrame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrame);
    }, [target, duration, startAnimation]);

    return <>{count}{suffix}</>;
};

export const LoginPage = () => {
    const { user, login } = useAuth();
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [shake, setShake] = useState(false);

    // Animation states
    const [step, setStep] = useState(0);

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
        if (user) {
            navigate('/dashboard');
        }
    }, [user, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!username || !password) {
            setShake(true);
            setTimeout(() => setShake(false), 500);
            return;
        }

        setIsLoading(true);
        const result = await login(username, password);
        setIsLoading(false);

        if (result.success) {
            navigate('/dashboard');
            return;
        }

        if (!result.success) {
            setShake(true);
            setTimeout(() => setShake(false), 500);
        }
    };

    return (
        <div className="min-h-screen bg-black flex overflow-hidden">
            {/* Left Panel - Animated Brand */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-black">
                {/* Aurora Effect */}
                <div className="absolute inset-0">
                    <div className="aurora-bg absolute inset-0" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black" />
                </div>

                {/* Mesh Grid */}
                <div className="absolute inset-0 mesh-grid opacity-20" />

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-center px-16 w-full">
                    {/* Logo */}
                    <div className={cn(
                        "transition-all duration-700",
                        step >= 1 ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
                    )}>
                        <div className="mb-8">
                            <h1 className="text-4xl font-bold text-white">LUERA</h1>
                            <p className="text-[#CCFF00] text-sm tracking-[0.3em] uppercase mt-1">LeadFlow</p>
                        </div>
                    </div>

                    {/* Headline */}
                    <div className={cn(
                        "transition-all duration-700 delay-100",
                        step >= 2 ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
                    )}>
                        <h2 className="text-5xl font-bold text-white leading-tight mb-6">
                            Potansiyel müşterilerinizi
                            <br />
                            <span className="text-gradient">akıllıca yönetin.</span>
                        </h2>
                    </div>

                    {/* Features */}
                    <div className={cn(
                        "transition-all duration-700 delay-200",
                        step >= 3 ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
                    )}>
                        <div className="space-y-4">
                            {[
                                'Otomatik lead toplama',
                                'WhatsApp entegrasyonu',
                                'AI destekli mesajlaşma'
                            ].map((feature) => (
                                <div
                                    key={feature}
                                    className="flex items-center gap-3 text-gray-400"
                                >
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#CCFF00]" />
                                    <span>{feature}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Stats */}
                    <div className={cn(
                        "mt-12 flex gap-12 transition-all duration-700 delay-300",
                        step >= 4 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                    )}>
                        <div>
                            <div className="text-3xl font-bold text-[#CCFF00]">
                                <AnimatedCounter target={10} suffix="K+" duration={1500} startAnimation={step >= 4} />
                            </div>
                            <div className="text-sm text-gray-500">Lead</div>
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-[#CCFF00]">
                                <AnimatedCounter target={500} suffix="+" duration={1500} startAnimation={step >= 4} />
                            </div>
                            <div className="text-sm text-gray-500">İşletme</div>
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-[#CCFF00]">
                                %<AnimatedCounter target={98} suffix="" duration={1500} startAnimation={step >= 4} />
                            </div>
                            <div className="text-sm text-gray-500">Memnuniyet</div>
                        </div>
                    </div>
                </div>

                {/* Floating shapes */}
                <div className="absolute bottom-20 right-20 w-32 h-32 border border-[#CCFF00]/20 rounded-full animate-float" />
                <div className="absolute top-40 right-40 w-20 h-20 border border-[#CCFF00]/10 rounded-lg rotate-45 animate-float-slow" />
            </div>

            {/* Right Panel - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
                {/* Subtle glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#CCFF00]/[0.02] rounded-full blur-[100px]" />

                <div className={cn(
                    "w-full max-w-md relative transition-all duration-700",
                    step >= 2 ? "opacity-100 scale-100" : "opacity-0 scale-95"
                )}>
                    {/* Mobile Logo */}
                    <div className="lg:hidden text-center mb-10">
                        <div>
                            <span className="text-xl font-bold text-white">LUERA </span>
                            <span className="text-xl font-bold text-[#CCFF00]">LeadFlow</span>
                        </div>
                    </div>

                    {/* Header */}
                    <div className="mb-10 text-center">
                        {/* Main heading - white with glow */}
                        <div className="relative inline-block">
                            {/* Glow effect */}
                            <div className="absolute inset-0 blur-2xl bg-[#CCFF00]/20 scale-150" />
                            <h2 className="relative text-5xl font-black mb-4 tracking-tight text-white">
                                Hoş geldiniz
                            </h2>
                        </div>

                        {/* Simple subtitle */}
                        <p className="text-gray-400 text-lg">
                            Lead yönetim platformunuza giriş yapın
                        </p>
                    </div>

                    {/* Premium Card */}
                    <div className="relative">
                        {/* Card glow */}
                        <div className="absolute -inset-[1px] bg-gradient-to-b from-[#CCFF00]/30 via-[#CCFF00]/10 to-transparent rounded-2xl blur-sm" />

                        {/* Card */}
                        <div className={cn(
                            "relative bg-[#111]/90 backdrop-blur-xl rounded-2xl border border-white/10 p-8",
                            shake && "animate-shake"
                        )}>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Username */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                        <svg className="w-4 h-4 text-[#CCFF00]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        Kullanıcı Adı
                                    </label>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full h-14 px-5 bg-black/50 border border-white/10 rounded-xl text-white text-base placeholder:text-gray-600 focus:border-[#CCFF00]/50 focus:ring-2 focus:ring-[#CCFF00]/10 transition-all outline-none"
                                        placeholder="Kullanıcı adınızı girin"
                                    />
                                </div>

                                {/* Password */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                        <svg className="w-4 h-4 text-[#CCFF00]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                        Şifre
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full h-14 px-5 pr-14 bg-black/50 border border-white/10 rounded-xl text-white text-base placeholder:text-gray-600 focus:border-[#CCFF00]/50 focus:ring-2 focus:ring-[#CCFF00]/10 transition-all outline-none"
                                            placeholder="••••••••"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-[#CCFF00] transition-colors rounded-lg hover:bg-white/5"
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Forgot password */}
                                <div className="text-right">
                                    <button
                                        type="button"
                                        className="text-sm text-gray-400 hover:text-[#CCFF00] transition-colors"
                                        onClick={() => console.log('Şifre sıfırlama')}
                                    >
                                        Şifremi unuttum
                                    </button>
                                </div>

                                {/* Submit */}
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full h-14 mt-2 rounded-xl font-bold text-base bg-[#CCFF00] text-black hover:bg-[#d4ff33] transition-all hover:shadow-xl hover:shadow-[#CCFF00]/30 disabled:opacity-50 flex items-center justify-center gap-2 group relative overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                                    <span className="relative flex items-center gap-2">
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                Giriş yapılıyor...
                                            </>
                                        ) : (
                                            <>
                                                Giriş Yap
                                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </span>
                                </button>
                            </form>


                        </div>
                    </div>

                    {/* Footer */}
                    <p className="text-center text-gray-700 text-xs mt-10">
                        © 2026 LUERA. Tüm hakları saklıdır.
                    </p>
                </div>
            </div>

            {/* Styles */}
            <style>{`
                .aurora-bg {
                    background: 
                        radial-gradient(ellipse at 20% 50%, rgba(204,255,0,0.15) 0%, transparent 50%),
                        radial-gradient(ellipse at 80% 20%, rgba(204,255,0,0.1) 0%, transparent 40%),
                        radial-gradient(ellipse at 40% 80%, rgba(204,255,0,0.08) 0%, transparent 50%);
                    animation: aurora 15s ease-in-out infinite;
                }
                
                @keyframes aurora {
                    0%, 100% {
                        transform: scale(1) rotate(0deg);
                        opacity: 1;
                    }
                    33% {
                        transform: scale(1.1) rotate(5deg);
                        opacity: 0.8;
                    }
                    66% {
                        transform: scale(0.95) rotate(-3deg);
                        opacity: 1;
                    }
                }
                
                .mesh-grid {
                    background-image: 
                        linear-gradient(rgba(204,255,0,0.1) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(204,255,0,0.1) 1px, transparent 1px);
                    background-size: 50px 50px;
                    animation: meshMove 30s linear infinite;
                }
                
                @keyframes meshMove {
                    0% { background-position: 0 0; }
                    100% { background-position: 50px 50px; }
                }
                
                .text-gradient {
                    background: linear-gradient(135deg, #CCFF00 0%, #a8ff00 50%, #CCFF00 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }
                
                .header-gradient {
                    background: linear-gradient(90deg, #CCFF00, #a8ff00, #CCFF00);
                    background-size: 200% auto;
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    animation: shimmer-text 3s linear infinite;
                }
                
                @keyframes shimmer-text {
                    0% { background-position: 0% center; }
                    100% { background-position: 200% center; }
                }
                
                @keyframes float {
                    0%, 100% { transform: translateY(0) rotate(0deg); }
                    50% { transform: translateY(-20px) rotate(5deg); }
                }
                .animate-float {
                    animation: float 6s ease-in-out infinite;
                }
                
                @keyframes float-slow {
                    0%, 100% { transform: translateY(0) rotate(45deg); }
                    50% { transform: translateY(-15px) rotate(50deg); }
                }
                .animate-float-slow {
                    animation: float-slow 8s ease-in-out infinite;
                }
                
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-4px); }
                    75% { transform: translateX(4px); }
                }
                .animate-shake {
                    animation: shake 0.3s ease-in-out;
                }
            `}</style>
        </div>
    );
};
