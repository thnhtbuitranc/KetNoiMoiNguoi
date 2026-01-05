import React, { useState } from 'react';
import { Button, Input, Card } from '../components/ui';
import { HeartHandshake, Mail, Lock, User, ArrowRight, Sparkles, Heart } from 'lucide-react';

interface AuthProps {
  onLogin: () => void;
  onBack: () => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin, onBack }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Mock handle submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate network request
    setTimeout(() => {
      setIsLoading(false);
      onLogin();
    }, 1500);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 relative overflow-hidden">
      
      {/* Decorative Background Elements */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-32 h-32 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" style={{ animationDelay: '1s' }}></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-100 rounded-full mix-blend-multiply filter blur-2xl opacity-50"></div>

      <Card className="w-full max-w-md bg-white/80 backdrop-blur-xl shadow-xl border-white/50 relative z-10 overflow-hidden">
        
        {/* Top Decorative Line */}
        <div className="h-2 w-full bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400"></div>

        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-200 mb-4 transform hover:-rotate-6 transition-transform duration-300">
               <HeartHandshake className="text-white" size={32} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
              {isLogin ? "Chào mừng trở lại!" : "Tham gia cùng chúng tôi"}
            </h2>
            <p className="text-slate-500 text-sm mt-2">
              {isLogin ? "Kết nối lại với những người thân yêu." : "Bắt đầu hành trình lưu giữ kỷ niệm."}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-1 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <label className="text-xs font-bold text-slate-600 uppercase ml-1">Tên của bạn</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <Input 
                    placeholder="Ví dụ: Minh An" 
                    className="pl-10 bg-slate-50/50 border-slate-200 focus:bg-white transition-all rounded-xl py-3" 
                    required 
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 uppercase ml-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <Input 
                  type="email" 
                  placeholder="name@example.com" 
                  className="pl-10 bg-slate-50/50 border-slate-200 focus:bg-white transition-all rounded-xl py-3" 
                  required 
                />
              </div>
            </div>

            <div className="space-y-1">
               <div className="flex justify-between items-center ml-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Mật khẩu</label>
                  {isLogin && <a href="#" className="text-xs text-indigo-500 hover:text-indigo-700 font-medium">Quên mật khẩu?</a>}
               </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <Input 
                  type="password" 
                  placeholder="••••••••" 
                  className="pl-10 bg-slate-50/50 border-slate-200 focus:bg-white transition-all rounded-xl py-3" 
                  required 
                />
              </div>
            </div>

            <Button 
              fullWidth 
              size="lg" 
              className={`mt-6 rounded-xl shadow-lg shadow-indigo-500/30 transition-all duration-300 ${isLoading ? 'opacity-80' : 'hover:scale-[1.02]'}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Sparkles className="animate-spin" size={18} /> Đang xử lý...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  {isLogin ? "Đăng Nhập" : "Đăng Ký Ngay"} <ArrowRight size={18} />
                </span>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-400 font-medium">Hoặc tiếp tục với</span>
            </div>
          </div>

          {/* Social Buttons */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button className="flex items-center justify-center py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
            </button>
            <button className="flex items-center justify-center py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
              <img src="https://www.svgrepo.com/show/475647/facebook-color.svg" className="w-5 h-5" alt="Facebook" />
            </button>
          </div>

          {/* Toggle View */}
          <div className="text-center">
            <p className="text-slate-500 text-sm">
              {isLogin ? "Chưa có tài khoản?" : "Đã có tài khoản?"}{" "}
              <button 
                onClick={() => setIsLogin(!isLogin)} 
                className="text-indigo-600 font-bold hover:text-indigo-800 transition-colors"
              >
                {isLogin ? "Đăng ký miễn phí" : "Đăng nhập ngay"}
              </button>
            </p>
          </div>
          
          <div className="mt-6 text-center">
             <button onClick={onBack} className="text-xs text-slate-400 hover:text-slate-600 flex items-center justify-center gap-1 w-full">
                Quay lại trang chủ
             </button>
          </div>

        </div>
      </Card>
      
      {/* Footer Text */}
      <div className="absolute bottom-6 text-slate-400 text-xs font-medium">
         © 2024 Kết Nối Mọi Người. Secure & Private.
      </div>
    </div>
  );
};

export default Auth;
