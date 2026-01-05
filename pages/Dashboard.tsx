import React, { useState } from 'react';
import { Card, Button, Badge } from '../components/ui';
import { Sparkles, Calendar, Clock, Activity, Shield, ChevronRight, Heart, Cake, Flame, Filter, Image as ImageIcon, Music, MapPin } from 'lucide-react';
import { Language } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, Tooltip } from 'recharts';

interface DashboardProps {
  lang: Language;
}

// Mock Data for Charts
const HEALTH_DATA = [
  { name: 'Tri kỷ', value: 15, color: '#6366f1' }, // Indigo
  { name: 'Gia đình', value: 25, color: '#3b82f6' }, // Blue
  { name: 'Bạn thân', value: 30, color: '#10b981' }, // Emerald
  { name: 'Xã giao', value: 30, color: '#94a3b8' }, // Slate
];

// Mock Upcoming Events
const UPCOMING_EVENTS = [
  { id: '1', title: 'Sinh nhật Mẹ', date: '2023-10-22', displayDate: '22/10', type: 'BIRTHDAY', daysLeft: 2, isFavorite: true },
  { id: '2', title: 'Kỷ niệm ngày cưới', date: '2023-10-25', displayDate: '25/10', type: 'ANNIVERSARY', daysLeft: 5, isFavorite: false },
  { id: '3', title: 'Giỗ Ông Nội', date: '2023-11-02', displayDate: '02/11', type: 'MEMORIAL', daysLeft: 13, isFavorite: false },
  { id: '4', title: 'Sinh nhật Sếp', date: '2023-11-10', displayDate: '10/11', type: 'BIRTHDAY', daysLeft: 21, isFavorite: false },
];

const Dashboard: React.FC<DashboardProps> = ({ lang }) => {
  const [eventFilter, setEventFilter] = useState<'7D' | '1M' | '3M'>('7D');
  const [events, setEvents] = useState(UPCOMING_EVENTS);

  const toggleFavorite = (id: string) => {
     setEvents(prev => prev.map(e => e.id === id ? { ...e, isFavorite: !e.isFavorite } : e));
  };

  const filteredEvents = events.filter(e => {
     if (eventFilter === '7D') return e.daysLeft <= 7;
     if (eventFilter === '1M') return e.daysLeft <= 30;
     if (eventFilter === '3M') return e.daysLeft <= 90;
     return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Welcome Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Chào buổi sáng, Minh.</h1>
          <p className="text-slate-500 mt-1">Đây là tổng quan các mối quan hệ của bạn hôm nay.</p>
        </div>
        {/* System Stable badge removed */}
      </div>

      {/* Main Grid - 2 Columns Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         
         {/* Column 1: Stats */}
         <Card className="p-6 flex flex-col h-full min-h-[350px]">
            <div className="flex justify-between items-start mb-4">
               <h3 className="font-bold text-slate-900">Sức khỏe quan hệ</h3>
               <Heart size={18} className="text-slate-400" />
            </div>
            
            <div className="flex-1 relative">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                     <Pie
                        data={HEALTH_DATA}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        startAngle={90}
                        endAngle={-270}
                     >
                        {HEALTH_DATA.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                        ))}
                     </Pie>
                  </PieChart>
               </ResponsiveContainer>
               {/* Center Text */}
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                  <span className="text-3xl font-bold text-slate-900 block">128</span>
                  <span className="text-xs text-slate-400 uppercase tracking-wide">Connections</span>
               </div>
            </div>

            <div className="flex flex-wrap justify-center gap-3 mt-4">
               {HEALTH_DATA.map(item => (
                  <div key={item.name} className="flex items-center gap-1.5">
                     <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                     <span className="text-[10px] text-slate-500 font-medium">{item.name}</span>
                  </div>
               ))}
            </div>
         </Card>

         {/* Column 2: Upcoming Events */}
         <Card className="p-6 flex flex-col h-full min-h-[350px]">
            <div className="flex flex-col justify-between items-start mb-4 gap-2">
               <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <Calendar size={18} className="text-primary-600" />
                  Sự kiện sắp tới
               </h3>
               
               {/* Small Filters */}
               <div className="flex bg-slate-100 p-1 rounded-lg w-full">
                  <button onClick={() => setEventFilter('7D')} className={`flex-1 py-1 rounded text-[10px] font-medium transition-all ${eventFilter === '7D' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500'}`}>7 ngày</button>
                  <button onClick={() => setEventFilter('1M')} className={`flex-1 py-1 rounded text-[10px] font-medium transition-all ${eventFilter === '1M' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500'}`}>1 tháng</button>
                  <button onClick={() => setEventFilter('3M')} className={`flex-1 py-1 rounded text-[10px] font-medium transition-all ${eventFilter === '3M' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500'}`}>3 tháng</button>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
               {filteredEvents.length > 0 ? (
                  filteredEvents.map(event => (
                     <div key={event.id} className="group flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-primary-100 hover:bg-primary-50/30 transition-all cursor-pointer">
                        <div className="flex items-center gap-3">
                           <div className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center border font-bold shrink-0 ${
                              event.type === 'BIRTHDAY' ? 'bg-pink-50 text-pink-600 border-pink-100' :
                              event.type === 'MEMORIAL' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                              'bg-indigo-50 text-indigo-600 border-indigo-100'
                           }`}>
                              <span className="text-[9px] uppercase opacity-70 leading-none mb-0.5">{event.displayDate.split('/')[1]}</span>
                              <span className="text-sm leading-none">{event.displayDate.split('/')[0]}</span>
                           </div>
                           <div className="min-w-0">
                              <h4 className="font-bold text-slate-900 text-xs truncate">{event.title}</h4>
                              <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                                 {event.daysLeft <= 3 ? (
                                    <span className="text-red-500 font-bold flex items-center gap-1">
                                       <Clock size={10} /> {event.daysLeft} ngày
                                    </span>
                                 ) : (
                                    <span>Còn {event.daysLeft} ngày</span>
                                 )}
                              </div>
                           </div>
                        </div>
                        <button 
                           onClick={(e) => { e.stopPropagation(); toggleFavorite(event.id); }}
                           className={`p-1.5 rounded-full transition-colors ${event.isFavorite ? 'text-red-500 bg-red-50' : 'text-slate-300 hover:text-red-400 hover:bg-slate-50'}`}
                        >
                           <Heart size={14} fill={event.isFavorite ? "currentColor" : "none"} />
                        </button>
                     </div>
                  ))
               ) : (
                  <div className="text-center py-10 text-slate-400">
                     <p className="text-xs">Không có sự kiện.</p>
                  </div>
               )}
            </div>
         </Card>
      </div>

    </div>
  );
};

export default Dashboard;