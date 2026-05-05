import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Lock, Eye, EyeOff, CheckCircle2, Loader2 } from 'lucide-react';

export const ResetPasswordPage = () => {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState('');
    const [sessionReady, setSessionReady] = useState(false);

    useEffect(() => {
        // Supabase email linki URL hash'indeki token'ı otomatik işler.
        // PASSWORD_RECOVERY veya SIGNED_IN eventi gelince form aktif olur.
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (
                event === 'PASSWORD_RECOVERY' ||
                event === 'SIGNED_IN' ||
                (event === 'INITIAL_SESSION' && session)
            ) {
                setSessionReady(true);
            }
        });

        // Sayfa zaten auth durumundaysa (ör. aynı sekmedeyse)
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) setSessionReady(true);
        });

        return () => subscription.unsubscribe();
    }, []);

    const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
    const passwordTooShort = password.length > 0 && password.length < 6;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password.length < 6) {
            setError('Şifre en az 6 karakter olmalı');
            return;
        }
        if (password !== confirmPassword) {
            setError('Şifreler eşleşmiyor');
            return;
        }

        setIsLoading(true);
        try {
            const { error: updateError } = await supabase.auth.updateUser({ password });
            if (updateError) {
                setError(updateError.message);
                return;
            }
            setIsSuccess(true);
            toast.success('Şifren başarıyla güncellendi!');
            setTimeout(() => navigate('/'), 2500);
        } catch (err) {
            setError('Bir hata oluştu. Tekrar dene.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
            {/* Background glow */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#CCFF00]/5 rounded-full blur-3xl" />
            </div>

            <div className="relative w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 bg-[#CCFF00]/10 border border-[#CCFF00]/30 rounded-2xl mb-4">
                        <Lock className="w-7 h-7 text-[#CCFF00]" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">Yeni Şifre Belirle</h1>
                    <p className="text-gray-400 text-sm mt-1">
                        {sessionReady ? 'Hesabın için yeni bir şifre oluştur' : 'Link doğrulanıyor...'}
                    </p>
                </div>

                <div className="bg-gray-900/80 backdrop-blur border border-gray-800 rounded-2xl p-8 shadow-2xl">
                    {isSuccess ? (
                        <div className="text-center py-4">
                            <CheckCircle2 className="w-14 h-14 text-[#CCFF00] mx-auto mb-4" />
                            <h2 className="text-xl font-semibold text-white mb-2">Şifren güncellendi!</h2>
                            <p className="text-gray-400 text-sm">Dashboard'a yönlendiriliyorsun...</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl">
                                    {error}
                                </div>
                            )}

                            {/* New Password */}
                            <div>
                                <label className="block text-sm text-gray-300 mb-2 font-medium">
                                    Yeni Şifre
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="En az 6 karakter"
                                        className="w-full bg-gray-800/60 border border-gray-700 rounded-xl pl-10 pr-10 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#CCFF00]/50 focus:ring-1 focus:ring-[#CCFF00]/20 transition-all"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {passwordTooShort && (
                                    <p className="text-red-400 text-xs mt-1">En az 6 karakter gerekli</p>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className="block text-sm text-gray-300 mb-2 font-medium">
                                    Şifreyi Onayla
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                    <input
                                        type={showConfirm ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Şifreyi tekrar gir"
                                        className="w-full bg-gray-800/60 border border-gray-700 rounded-xl pl-10 pr-10 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#CCFF00]/50 focus:ring-1 focus:ring-[#CCFF00]/20 transition-all"
                                        required
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                        {passwordsMatch && <CheckCircle2 className="w-4 h-4 text-[#CCFF00]" />}
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirm(!showConfirm)}
                                            className="text-gray-500 hover:text-gray-300"
                                        >
                                            {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading || !sessionReady}
                                className="w-full bg-[#CCFF00] hover:bg-[#b8e600] text-black font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                            >
                                {isLoading ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Güncelleniyor...</>
                                ) : (
                                    'Şifremi Güncelle'
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};
