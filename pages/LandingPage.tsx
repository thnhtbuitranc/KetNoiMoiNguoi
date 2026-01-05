import React, { useState } from 'react';
import { Button } from '../components/ui';
import { HeartHandshake, Shield, Sparkles, ArrowRight, Lock, Heart, Users, Zap, Globe, FolderHeart, Star, Bell, Image, Music, Calendar } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  lang: 'VI' | 'EN';
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, lang }) => {
  const [activeFeature, setActiveFeature] = useState(0);

  const features = [
    {
      id: 0,
      title: "Vũ Trụ Quan Hệ",
      desc: "Trực quan hóa mạng lưới quan hệ của bạn dưới dạng một thiên hà sống động. Nhìn thấy ai là 'mặt trời' của bạn và ai đang trôi xa dần.",
      icon: Globe,
      color: "text-blue-600",
      bg: "bg-blue-50"
    },
    {
      id: 1,
      title: "Kho Kỷ Niệm Số",
      desc: "Lưu giữ an toàn hình ảnh, ghi âm và những lá thư tay. Tạo ra một dòng thời gian vĩnh cửu cho từng người thân yêu.",
      icon: FolderHeart,
      color: "text-pink-600",
      bg: "bg-pink-50"
    },
    {
      id: 2,
      title: "Nhắc Nhở Tinh Tế",
      desc: "Không chỉ là sinh nhật. Hệ thống nhắc bạn 'giữ lửa' dựa trên tần suất tương tác, giúp bạn luôn là người chu đáo nhất.",
      icon: Bell,
      color: "text-amber-600",
      bg: "bg-amber-50"
    }
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans overflow-x-hidden selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Decorative Background Blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
         <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-50/50 rounded-full blur-3xl opacity-60 translate-x-1/3 -translate-y-1/4"></div>
         <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-pink-50/50 rounded-full blur-3xl opacity-60 -translate-x-1/3 translate-y-1/4"></div>
      </div>

      {/* Navbar - Widen to max-w-[1600px] */}
      <nav className="relative z-50 flex justify-between items-center px-6 md:px-12 py-6 max-w-[1600px] mx-auto w-full">
         <div className="flex items-center gap-2 group cursor-pointer">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary-500/20 group-hover:scale-105 transition-transform duration-300">
               <HeartHandshake size={22} />
            </div>
            <span className="font-bold text-xl text-slate-900 tracking-tight group-hover:text-primary-600 transition-colors">Kết Nối Mọi Người</span>
         </div>
         <div className="hidden md:flex items-center gap-8">
            <button className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Tính năng</button>
            <button className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Về chúng tôi</button>
            <button className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Blog</button>
         </div>
         <div className="flex items-center gap-4">
             <button className="hidden md:block text-sm font-bold text-slate-600 hover:text-primary-600 transition-colors" onClick={onGetStarted}>
               Đăng nhập
             </button>
            <Button onClick={onGetStarted} className="rounded-full px-6 shadow-lg shadow-primary-500/20 hover:scale-105 transition-transform">
               Bắt đầu ngay
            </Button>
         </div>
      </nav>

      {/* Hero Section - Widen and add more gap */}
      <div className="relative z-10 flex-1 flex flex-col lg:flex-row items-center justify-between px-6 md:px-12 pt-12 pb-24 max-w-[1600px] mx-auto w-full gap-16 lg:gap-24">
         
         {/* Left: Text Content */}
         <div className="flex-1 text-center lg:text-left space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-100 rounded-full text-xs font-bold text-slate-600 shadow-sm hover:shadow-md transition-shadow cursor-default">
               <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
               </span>
               Nền tảng Quản lý Mối quan hệ Cá nhân (PRM)
            </div>
            
            <h1 className="text-5xl md:text-7xl xl:text-8xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
               Kết nối sâu sắc.<br />
               <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 via-purple-500 to-pink-500">
                  Không bao giờ quên.
               </span>
            </h1>
            
            <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
               Nền tảng đầu tiên giúp bạn nuôi dưỡng tình cảm, lưu giữ kỷ niệm và thấu hiểu người thân yêu một cách trọn vẹn và tinh tế nhất.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center lg:justify-start">
               <Button size="lg" onClick={onGetStarted} className="px-8 py-6 text-base rounded-2xl shadow-xl shadow-indigo-500/20 hover:translate-y-[-2px] transition-transform">
                  Tạo tài khoản miễn phí <ArrowRight size={18} className="ml-2" />
               </Button>
               <Button size="lg" variant="secondary" className="px-8 py-6 text-base rounded-2xl border-slate-200 hover:bg-slate-50 hover:text-slate-900">
                  Xem Demo
               </Button>
            </div>

            <div className="pt-8 flex items-center justify-center lg:justify-start gap-6 text-slate-400 grayscale opacity-70">
               <div className="flex -space-x-3">
                  {[1,2,3,4].map(i => (
                     <img key={i} src={`https://i.pravatar.cc/100?img=${i + 10}`} className="w-10 h-10 rounded-full border-2 border-white" alt="User" />
                  ))}
                  <div className="w-10 h-10 rounded-full border-2 border-white bg-slate-50 flex items-center justify-center text-xs font-bold text-slate-600">+2k</div>
               </div>
               <div className="text-sm">
                  <div className="flex text-yellow-400 mb-0.5">
                     <Star size={12} fill="currentColor" />
                     <Star size={12} fill="currentColor" />
                     <Star size={12} fill="currentColor" />
                     <Star size={12} fill="currentColor" />
                     <Star size={12} fill="currentColor" />
                  </div>
                  <span className="font-medium text-slate-600">Loved by users</span>
               </div>
            </div>
         </div>

         {/* Right: Visual Animation */}
         <div className="flex-1 w-full max-w-lg lg:max-w-xl xl:max-w-2xl relative animate-in fade-in zoom-in-95 duration-1000 delay-200">
            {/* Main Central Card */}
            <div className="relative z-20 bg-white p-6 rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] border border-slate-100">
               <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-yellow-300 to-orange-400 p-1">
                     <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200" className="w-full h-full rounded-full object-cover border-2 border-white" alt="You" />
                  </div>
                  <div>
                     <h3 className="text-xl font-bold text-slate-900">Nguyễn An</h3>
                     <p className="text-slate-500 text-sm">@an.nguyen • Product Designer</p>
                  </div>
                  <div className="ml-auto bg-green-50 text-green-600 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                     <Zap size={12} fill="currentColor" /> High Energy
                  </div>
               </div>
               
               {/* Connected Nodes */}
               <div className="space-y-3">
                  {[
                     { name: 'Mẹ Yêu', role: 'Family', tier: 'Tier 5', color: 'bg-red-50 text-red-600', img: 5 },
                     { name: 'Hoàng Long', role: 'Best Friend', tier: 'Tier 4', color: 'bg-purple-50 text-purple-600', img: 3 },
                     { name: 'Sarah J.', role: 'Mentor', tier: 'Tier 3', color: 'bg-blue-50 text-blue-600', img: 9 },
                  ].map((item, idx) => (
                     <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-white hover:shadow-md transition-all cursor-default group border border-transparent hover:border-slate-100">
                        <div className="flex items-center gap-3">
                           <img src={`https://i.pravatar.cc/100?img=${item.img}`} className="w-10 h-10 rounded-full" alt={item.name} />
                           <div>
                              <p className="font-bold text-slate-900 text-sm">{item.name}</p>
                              <p className="text-xs text-slate-500">{item.role}</p>
                           </div>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${item.color}`}>{item.tier}</span>
                     </div>
                  ))}
               </div>

               {/* Floating Elements */}
               <div className="absolute -top-6 -right-6 bg-white p-3 rounded-2xl shadow-xl border border-slate-50 animate-bounce" style={{ animationDuration: '3s' }}>
                  <Heart className="text-red-500 fill-red-500" size={24} />
               </div>
               <div className="absolute -bottom-6 -left-6 bg-white p-3 rounded-2xl shadow-xl border border-slate-50 animate-bounce" style={{ animationDuration: '4s' }}>
                  <Shield className="text-indigo-500 fill-indigo-500" size={24} />
               </div>
            </div>

            {/* Background Rings */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] border border-slate-200/60 rounded-full -z-10"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] border border-slate-100/60 rounded-full -z-20"></div>
         </div>
      </div>

      {/* NEW Interactive Feature Showcase - Widen to max-w-[1600px] */}
      <div className="py-24 px-6 md:px-12 bg-slate-50 relative overflow-hidden">
         <div className="max-w-[1600px] mx-auto relative z-10">
            <div className="text-center mb-16">
               <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6 tracking-tight">Mọi công cụ bạn cần để <br/><span className="text-primary-600">yêu thương tốt hơn</span></h2>
               <p className="text-slate-500 max-w-2xl mx-auto text-lg">Đơn giản hóa việc quản lý mối quan hệ, để bạn có thể tập trung vào những khoảnh khắc thật sự ý nghĩa.</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-12 items-center">
               
               {/* Left Column: Navigation Tabs */}
               <div className="w-full lg:w-1/3 space-y-4">
                  {features.map((feature, idx) => (
                     <div 
                        key={idx}
                        onClick={() => setActiveFeature(idx)}
                        className={`p-6 rounded-2xl cursor-pointer transition-all duration-300 border ${
                           activeFeature === idx 
                              ? 'bg-white shadow-lg border-primary-100 scale-105' 
                              : 'bg-transparent border-transparent hover:bg-white/50 hover:border-slate-200'
                        }`}
                     >
                        <div className="flex items-center gap-4 mb-2">
                           <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${activeFeature === idx ? feature.bg + ' ' + feature.color : 'bg-slate-100 text-slate-400'}`}>
                              <feature.icon size={20} />
                           </div>
                           <h3 className={`font-bold text-lg ${activeFeature === idx ? 'text-slate-900' : 'text-slate-500'}`}>{feature.title}</h3>
                        </div>
                        <p className={`text-sm leading-relaxed ${activeFeature === idx ? 'text-slate-600' : 'text-slate-400 hidden md:block'}`}>
                           {feature.desc}
                        </p>
                     </div>
                  ))}
               </div>

               {/* Right Column: Visual Preview - Increase Height */}
               <div className="w-full lg:w-2/3 h-[600px] relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-[3rem] transform rotate-1 opacity-50"></div>
                  <div className="absolute inset-0 bg-white/40 backdrop-blur-3xl rounded-[3rem] border border-white/50 shadow-2xl flex items-center justify-center p-8 overflow-hidden transition-all duration-500">
                     
                     {/* Feature 0: Galaxy View Visual */}
                     {activeFeature === 0 && (
                        <div className="relative w-full h-full flex items-center justify-center animate-in fade-in zoom-in-95 duration-500">
                           <div className="absolute w-[400px] h-[400px] border border-blue-200 rounded-full animate-[spin_20s_linear_infinite]"></div>
                           <div className="absolute w-[250px] h-[250px] border border-blue-300 rounded-full animate-[spin_15s_linear_infinite_reverse]"></div>
                           <div className="w-20 h-20 bg-yellow-400 rounded-full shadow-[0_0_50px_rgba(250,204,21,0.6)] z-10 border-4 border-white"></div>
                           
                           {/* Orbiting Elements */}
                           <div className="absolute top-1/4 left-1/4 bg-white p-2 rounded-2xl shadow-lg flex items-center gap-2 animate-bounce">
                              <img src="https://i.pravatar.cc/100?img=5" className="w-8 h-8 rounded-full" alt="Mom" />
                              <span className="text-xs font-bold text-slate-700">Mẹ Yêu</span>
                              <Heart size={12} className="text-red-500 fill-red-500" />
                           </div>
                           <div className="absolute bottom-1/3 right-1/4 bg-white p-2 rounded-2xl shadow-lg flex items-center gap-2 animate-bounce" style={{ animationDelay: '1s' }}>
                              <img src="https://i.pravatar.cc/100?img=12" className="w-8 h-8 rounded-full" alt="BFF" />
                              <span className="text-xs font-bold text-slate-700">Bestie</span>
                              <Star size={12} className="text-yellow-500 fill-yellow-500" />
                           </div>
                        </div>
                     )}

                     {/* Feature 1: Memories Visual */}
                     {activeFeature === 1 && (
                        <div className="relative w-full h-full flex items-center justify-center animate-in fade-in slide-in-from-right-8 duration-500">
                           <div className="absolute w-72 h-96 bg-white p-4 pb-12 shadow-xl rotate-[-6deg] rounded-lg border border-slate-100 transition-transform hover:rotate-[-12deg] z-10">
                              <div className="w-full h-56 bg-slate-100 rounded overflow-hidden mb-3">
                                 <img src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600" className="w-full h-full object-cover" />
                              </div>
                              <div className="h-2 w-2/3 bg-slate-100 rounded mb-2"></div>
                              <div className="h-2 w-1/2 bg-slate-100 rounded"></div>
                              <div className="absolute bottom-4 right-4 text-slate-300"><Image size={24}/></div>
                           </div>
                           <div className="absolute w-72 h-96 bg-white p-4 pb-12 shadow-xl rotate-[6deg] rounded-lg border border-slate-100 transition-transform hover:rotate-[12deg] z-20">
                              <div className="w-full h-56 bg-pink-50 rounded overflow-hidden mb-3 flex items-center justify-center text-pink-300">
                                 <Music size={64} />
                              </div>
                              <p className="font-handwriting text-slate-600 text-sm">"Voice chúc mừng sinh nhật..."</p>
                              <div className="absolute bottom-4 right-4 text-pink-300"><Music size={24}/></div>
                           </div>
                        </div>
                     )}

                     {/* Feature 2: Reminders Visual */}
                     {activeFeature === 2 && (
                        <div className="w-full max-w-sm space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-500">
                           <div className="bg-white p-5 rounded-2xl shadow-lg border-l-4 border-pink-500 flex items-center gap-4">
                              <div className="w-12 h-12 bg-pink-50 rounded-full flex items-center justify-center text-pink-500">
                                 <Calendar size={20} />
                              </div>
                              <div>
                                 <h4 className="font-bold text-slate-800 text-lg">Sinh nhật Mẹ</h4>
                                 <p className="text-sm text-slate-500">Còn 2 ngày nữa • Đã chuẩn bị quà chưa?</p>
                              </div>
                           </div>
                           <div className="bg-white p-5 rounded-2xl shadow-lg border-l-4 border-amber-500 flex items-center gap-4 opacity-80 scale-95">
                              <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center text-amber-500">
                                 <Zap size={20} />
                              </div>
                              <div>
                                 <h4 className="font-bold text-slate-800 text-lg">Tương tác thấp</h4>
                                 <p className="text-sm text-slate-500">Đã 2 tháng chưa gọi cho anh Nam.</p>
                              </div>
                           </div>
                           <div className="bg-white p-5 rounded-2xl shadow-lg border-l-4 border-blue-500 flex items-center gap-4 opacity-60 scale-90">
                              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-500">
                                 <HeartHandshake size={20} />
                              </div>
                              <div>
                                 <h4 className="font-bold text-slate-800 text-lg">Kỷ niệm 5 năm bạn bè</h4>
                                 <p className="text-sm text-slate-500">Với nhóm Đại học.</p>
                              </div>
                           </div>
                        </div>
                     )}

                  </div>
               </div>
            </div>
         </div>
      </div>
      
      {/* CTA Section - Widen */}
      <div className="py-24 px-6 md:px-12">
         <div className="max-w-[1600px] mx-auto bg-gradient-to-r from-indigo-600 to-purple-600 rounded-[2.5rem] p-12 md:p-24 text-center text-white relative overflow-hidden shadow-2xl">
             <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
             <div className="relative z-10">
                <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">Sẵn sàng nuôi dưỡng các mối quan hệ?</h2>
                <p className="text-indigo-100 text-lg md:text-xl max-w-2xl mx-auto mb-10">Tham gia cùng hàng nghìn người đang xây dựng những kết nối ý nghĩa hơn mỗi ngày.</p>
                <Button 
                   size="lg" 
                   variant="secondary"
                   onClick={onGetStarted} 
                   className="bg-white text-indigo-600 hover:text-indigo-700 hover:bg-slate-50 border-none px-10 py-4 h-auto text-lg rounded-xl font-bold shadow-lg"
                >
                   Bắt đầu miễn phí ngay
                </Button>
                <p className="mt-6 text-sm text-indigo-200 opacity-80">Không cần thẻ tín dụng • Hủy bất kỳ lúc nào</p>
             </div>
         </div>
      </div>

      {/* Footer - Widen */}
      <footer className="bg-white border-t border-slate-100 pt-16 pb-8 px-6 md:px-12">
         <div className="max-w-[1600px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
               <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white">
                     <HeartHandshake size={16} />
                  </div>
                  <span className="font-bold text-lg text-slate-900">Kết Nối Mọi Người</span>
               </div>
               <p className="text-slate-500 text-sm mb-4">
                  Nền tảng giúp bạn trở thành một người bạn, người thân tốt hơn thông qua công nghệ.
               </p>
            </div>
            <div>
               <h4 className="font-bold text-slate-900 mb-4">Sản phẩm</h4>
               <ul className="space-y-2 text-sm text-slate-500">
                  <li><a href="#" className="hover:text-primary-600">Tính năng</a></li>
                  <li><a href="#" className="hover:text-primary-600">Bảo mật</a></li>
                  <li><a href="#" className="hover:text-primary-600">Download App</a></li>
               </ul>
            </div>
            <div>
               <h4 className="font-bold text-slate-900 mb-4">Công ty</h4>
               <ul className="space-y-2 text-sm text-slate-500">
                  <li><a href="#" className="hover:text-primary-600">Về chúng tôi</a></li>
                  <li><a href="#" className="hover:text-primary-600">Blog</a></li>
                  <li><a href="#" className="hover:text-primary-600">Liên hệ</a></li>
               </ul>
            </div>
            <div>
               <h4 className="font-bold text-slate-900 mb-4">Pháp lý</h4>
               <ul className="space-y-2 text-sm text-slate-500">
                  <li><a href="#" className="hover:text-primary-600">Điều khoản</a></li>
                  <li><a href="#" className="hover:text-primary-600">Chính sách riêng tư</a></li>
               </ul>
            </div>
         </div>
         <div className="max-w-[1600px] mx-auto border-t border-slate-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-400">
            <p>© 2024 Kết Nối Mọi Người. All rights reserved.</p>
            <div className="flex gap-4">
               <span>Made with ❤️ in Vietnam</span>
            </div>
         </div>
      </footer>
    </div>
  );
};

export default LandingPage;