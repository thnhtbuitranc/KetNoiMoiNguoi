import React from 'react';
import { Button, Card } from '../components/ui';
import { HeartHandshake, Shield, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  lang: 'VI' | 'EN';
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, lang }) => {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Navbar */}
      <nav className="flex justify-between items-center px-6 py-6 max-w-7xl mx-auto w-full">
         <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white">
               <HeartHandshake size={18} />
            </div>
            <span className="font-bold text-xl text-slate-900 tracking-tight">Kết Nối Mọi Người</span>
         </div>
         <div className="flex items-center gap-4">
            <button className="text-sm font-medium text-slate-600 hover:text-slate-900">Tính năng</button>
            <button className="text-sm font-medium text-slate-600 hover:text-slate-900">Về chúng tôi</button>
            <Button variant="outline" size="sm" onClick={onGetStarted}>Đăng nhập</Button>
         </div>
      </nav>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20 max-w-5xl mx-auto">
         <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 rounded-full text-sm font-medium mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Sparkles size={16} />
            <span>Trí tuệ nhân tạo hỗ trợ kết nối</span>
         </div>
         
         <h1 className="text-5xl md:text-7xl font-bold text-slate-900 tracking-tight mb-8 leading-[1.1]">
            Lưu giữ những mối quan hệ <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-indigo-500">
               quan trọng nhất.
            </span>
         </h1>
         
         <p className="text-lg md:text-xl text-slate-500 max-w-2xl mb-12 leading-relaxed">
            Một không gian riêng tư, chuyên nghiệp để quản lý và nuôi dưỡng các mối quan hệ quý giá của bạn. Không ồn ào, chỉ có sự kết nối thực sự.
         </p>

         <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
            <Button size="lg" onClick={onGetStarted} className="px-8 shadow-glow">
               Bắt đầu ngay <ArrowRight size={18} className="ml-2" />
            </Button>
            <Button size="lg" variant="secondary" className="px-8">
               Tìm hiểu thêm
            </Button>
         </div>
      </div>

      {/* Feature Grid */}
      <div className="bg-slate-50 py-24 px-4">
         <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
               <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                  <Shield size={24} />
               </div>
               <h3 className="text-xl font-bold text-slate-900 mb-3">Riêng tư tuyệt đối</h3>
               <p className="text-slate-500 leading-relaxed">Dữ liệu của bạn được mã hóa và chỉ thuộc về bạn. Chúng tôi không bán dữ liệu hay sử dụng cho quảng cáo.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
               <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-6">
                  <HeartHandshake size={24} />
               </div>
               <h3 className="text-xl font-bold text-slate-900 mb-3">Kết nối sâu sắc</h3>
               <p className="text-slate-500 leading-relaxed">Các công cụ được thiết kế để làm sâu sắc thêm mối quan hệ, ghi nhớ những chi tiết quan trọng và giữ liên lạc ý nghĩa.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
               <div className="w-12 h-12 bg-violet-50 text-violet-600 rounded-xl flex items-center justify-center mb-6">
                  <Sparkles size={24} />
               </div>
               <h3 className="text-xl font-bold text-slate-900 mb-3">Trợ lý AI</h3>
               <p className="text-slate-500 leading-relaxed">Nhận lời khuyên cá nhân hóa về cách kết nối lại hoặc củng cố mối quan hệ từ AI thông minh của chúng tôi.</p>
            </div>
         </div>
      </div>
      
      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-12 text-center text-slate-400 text-sm">
         <p>© 2024 Kết Nối Mọi Người. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPage;