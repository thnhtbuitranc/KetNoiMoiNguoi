import React, { useState } from 'react';
import { Card, Button, Badge, Modal, Input } from '../components/ui';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Cake, Heart, Flame, Clock, MoreHorizontal, Star, Briefcase, User } from 'lucide-react';
import { Language } from '../types';

interface CalendarProps {
  lang: Language;
}

enum EventType {
  BIRTHDAY = 'BIRTHDAY',
  ANNIVERSARY = 'ANNIVERSARY',
  MEMORIAL = 'MEMORIAL', // Đám giỗ
  OTHER = 'OTHER'
}

interface EventItem {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  displayDate: string; // DD/MM
  type: EventType;
  connectionName: string;
  daysLeft: number;
  isFavorite?: boolean;
}

// Mock Connection Data for Autocomplete
const MOCK_CONNECTIONS = [
  { id: '1', name: 'Nguyễn Văn A', nickname: 'Tèo' },
  { id: '2', name: 'Trần Thị B', nickname: 'Mẹ' },
  { id: '3', name: 'Lê Văn C', nickname: '' },
  { id: '4', name: 'Phạm Thu D', nickname: 'Hana' },
  { id: '5', name: 'Hoàng Văn E', nickname: '' },
  { id: '6', name: 'Nguyễn Nam', nickname: 'Nam' },
  { id: '7', name: 'Thành Nguyên', nickname: '' },
];

// Mock Data
const EVENTS: EventItem[] = [
  { id: '1', title: 'Sinh nhật Mẹ', date: '2023-10-20', displayDate: '20/10', type: EventType.BIRTHDAY, connectionName: 'Trần Thị B', daysLeft: 0, isFavorite: true },
  { id: '2', title: 'Kỷ niệm ngày cưới', date: '2023-10-25', displayDate: '25/10', type: EventType.ANNIVERSARY, connectionName: 'Vợ', daysLeft: 5, isFavorite: true },
  { id: '3', title: 'Giỗ Ông Nội', date: '2023-11-02', displayDate: '02/11 (ÂL)', type: EventType.MEMORIAL, connectionName: 'Gia đình', daysLeft: 13 },
  { id: '4', title: 'Sinh nhật Sếp', date: '2023-11-10', displayDate: '10/11', type: EventType.BIRTHDAY, connectionName: 'Nguyễn Văn A', daysLeft: 21 },
  { id: '5', title: 'Họp lớp C3', date: '2023-11-20', displayDate: '20/11', type: EventType.OTHER, connectionName: 'Nhóm Lớp 12A1', daysLeft: 31 },
];

const EventIcon: React.FC<{ type: EventType }> = ({ type }) => {
  switch (type) {
    case EventType.BIRTHDAY:
      return <div className="p-2 bg-pink-50 text-pink-500 rounded-lg"><Cake size={18} /></div>;
    case EventType.ANNIVERSARY:
      return <div className="p-2 bg-purple-50 text-purple-500 rounded-lg"><Heart size={18} /></div>;
    case EventType.MEMORIAL:
      return <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><Flame size={18} /></div>;
    default:
      return <div className="p-2 bg-slate-50 text-slate-500 rounded-lg"><Briefcase size={18} /></div>;
  }
};

const CalendarPage: React.FC<CalendarProps> = ({ lang }) => {
  const [currentMonth, setCurrentMonth] = useState('Tháng 10, 2023');
  const [selectedType, setSelectedType] = useState<EventType | 'ALL' | 'FAVORITES'>('ALL');
  const [eventsList, setEventsList] = useState(EVENTS);
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
  const [newEvent, setNewEvent] = useState<Partial<EventItem>>({ type: EventType.OTHER });
  
  // Autocomplete State
  const [showSuggestions, setShowSuggestions] = useState(false);

  const toggleFavorite = (id: string) => {
    setEventsList(prev => prev.map(e => e.id === id ? { ...e, isFavorite: !e.isFavorite } : e));
  };

  const handleAddEvent = () => {
    if (!newEvent.title || !newEvent.date) return;
    
    const d = new Date(newEvent.date);
    const displayDate = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
    
    const daysLeft = Math.floor(Math.random() * 30) + 1; 

    const event: EventItem = {
       id: Date.now().toString(),
       title: newEvent.title,
       date: newEvent.date,
       displayDate: displayDate,
       type: newEvent.type || EventType.OTHER,
       connectionName: newEvent.connectionName || 'Cá nhân',
       daysLeft: daysLeft,
       isFavorite: false
    };

    setEventsList([...eventsList, event]);
    setIsAddEventModalOpen(false);
    setNewEvent({ type: EventType.OTHER });
  };

  const filteredEvents = selectedType === 'ALL' 
    ? eventsList 
    : selectedType === 'FAVORITES' 
    ? eventsList.filter(e => e.isFavorite)
    : eventsList.filter(e => e.type === selectedType);
    
  // Filter suggestions based on input
  const filteredSuggestions = MOCK_CONNECTIONS.filter(c => {
     if (!newEvent.connectionName) return false;
     const search = newEvent.connectionName.toLowerCase();
     return c.name.toLowerCase().includes(search) || (c.nickname && c.nickname.toLowerCase().includes(search));
  });

  const selectSuggestion = (name: string) => {
     setNewEvent({...newEvent, connectionName: name});
     setShowSuggestions(false);
  };

  // Helper to generate a simple grid for the calendar visual
  const renderCalendarGrid = () => {
    const days = [];
    for (let i = 1; i <= 31; i++) {
       const dayEvents = eventsList.filter(e => parseInt(e.date.split('-')[2]) === i);
       const hasEvent = dayEvents.length > 0;
       const isToday = i === 20; // Mock today
       
       days.push(
          <div key={i} className="group relative">
             <div className={`
                h-10 w-10 flex items-center justify-center rounded-full text-sm font-medium cursor-pointer transition-all
                ${isToday ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30' : 'text-slate-700 hover:bg-slate-100'}
                ${hasEvent && !isToday ? 'bg-slate-50 font-bold border border-slate-200' : ''}
             `}>
                {i}
                {hasEvent && !isToday && <div className="absolute bottom-1 w-1 h-1 bg-primary-500 rounded-full"></div>}
             </div>
             
             {hasEvent && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-max max-w-[200px] bg-slate-900 text-white text-xs rounded-lg py-2 px-3 shadow-xl z-10 animate-in fade-in zoom-in-95 duration-200">
                   {dayEvents.map(e => (
                      <div key={e.id} className="mb-1 last:mb-0 border-b border-slate-700 last:border-0 pb-1 last:pb-0">
                         <span className="font-bold block">{e.title}</span>
                         <span className="text-slate-400">{e.connectionName}</span>
                      </div>
                   ))}
                   <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900"></div>
                </div>
             )}
          </div>
       );
    }
    return days;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Lịch & Sự Kiện</h1>
          <p className="text-slate-500 text-sm mt-1">Theo dõi sinh nhật, kỷ niệm và các ngày quan trọng.</p>
        </div>
        <Button className="gap-2 shadow-lg shadow-primary-500/20" onClick={() => setIsAddEventModalOpen(true)}>
           <Plus size={18} /> Thêm sự kiện
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Left Column: Calendar & Filters */}
         <div className="space-y-6">
            {/* Visual Calendar */}
            <Card className="p-6">
               <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-slate-900">{currentMonth}</h3>
                  <div className="flex gap-1">
                     <button className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded"><ChevronLeft size={20} /></button>
                     <button className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded"><ChevronRight size={20} /></button>
                  </div>
               </div>
               
               <div className="grid grid-cols-7 gap-2 mb-2 text-center">
                  {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(d => (
                     <div key={d} className="text-xs font-bold text-slate-400 uppercase">{d}</div>
                  ))}
               </div>
               <div className="grid grid-cols-7 gap-y-2 justify-items-center">
                  <div className="h-10 w-10"></div>
                  <div className="h-10 w-10"></div>
                  {renderCalendarGrid()}
               </div>
            </Card>

            {/* Quick Filters */}
            <Card className="p-4">
               <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider mb-3">Lọc theo loại</h4>
               <div className="space-y-1">
                  <button 
                     onClick={() => setSelectedType('ALL')}
                     className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${selectedType === 'ALL' ? 'bg-slate-100 text-slate-900 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                     <span>Tất cả</span>
                     <span className="bg-white px-2 py-0.5 rounded text-xs text-slate-400 border border-slate-100">{eventsList.length}</span>
                  </button>
                  <button 
                     onClick={() => setSelectedType('FAVORITES')}
                     className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${selectedType === 'FAVORITES' ? 'bg-yellow-50 text-yellow-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                     <div className="flex items-center gap-2"><Star size={14} className="text-yellow-500 fill-yellow-500"/> Yêu thích</div>
                     <span className="bg-white px-2 py-0.5 rounded text-xs text-slate-400 border border-slate-100">{eventsList.filter(e => e.isFavorite).length}</span>
                  </button>
                  <div className="h-px bg-slate-100 my-2"></div>
                  <button 
                     onClick={() => setSelectedType(EventType.BIRTHDAY)}
                     className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${selectedType === EventType.BIRTHDAY ? 'bg-pink-50 text-pink-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                     <div className="flex items-center gap-2"><Cake size={14} className="text-pink-500"/> Sinh nhật</div>
                     <span className="bg-white px-2 py-0.5 rounded text-xs text-slate-400 border border-slate-100">{eventsList.filter(e => e.type === EventType.BIRTHDAY).length}</span>
                  </button>
                  <button 
                     onClick={() => setSelectedType(EventType.ANNIVERSARY)}
                     className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${selectedType === EventType.ANNIVERSARY ? 'bg-purple-50 text-purple-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                     <div className="flex items-center gap-2"><Heart size={14} className="text-purple-500"/> Kỷ niệm</div>
                     <span className="bg-white px-2 py-0.5 rounded text-xs text-slate-400 border border-slate-100">{eventsList.filter(e => e.type === EventType.ANNIVERSARY).length}</span>
                  </button>
                  <button 
                     onClick={() => setSelectedType(EventType.MEMORIAL)}
                     className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${selectedType === EventType.MEMORIAL ? 'bg-amber-50 text-amber-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                     <div className="flex items-center gap-2"><Flame size={14} className="text-amber-600"/> Đám giỗ / Tưởng niệm</div>
                     <span className="bg-white px-2 py-0.5 rounded text-xs text-slate-400 border border-slate-100">{eventsList.filter(e => e.type === EventType.MEMORIAL).length}</span>
                  </button>
               </div>
            </Card>
         </div>

         {/* Right Column: Events Feed */}
         <div className="lg:col-span-2 space-y-4">
            <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
               {selectedType === 'FAVORITES' ? 'Sự kiện đã ghim' : 'Sắp diễn ra'} 
               <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                  {selectedType === 'FAVORITES' ? 'Favorites' : 'Coming Up'}
               </span>
            </h3>

            {filteredEvents.map((event) => (
               <div key={event.id} className="bg-white rounded-xl p-4 border border-slate-100 hover:border-primary-200 hover:shadow-md transition-all group cursor-pointer relative overflow-hidden">
                  {/* Left accent bar based on type */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                     event.type === EventType.BIRTHDAY ? 'bg-pink-500' : 
                     event.type === EventType.ANNIVERSARY ? 'bg-purple-500' :
                     event.type === EventType.MEMORIAL ? 'bg-amber-500' : 'bg-slate-300'
                  }`}></div>

                  <div className="flex items-center gap-4 pl-3">
                     {/* Date Box */}
                     <div className="flex flex-col items-center justify-center w-14 h-14 bg-slate-50 rounded-lg border border-slate-100">
                        <span className="text-[10px] uppercase font-bold text-slate-400">{event.date.split('-')[1] === '11' ? 'NOV' : 'OCT'}</span>
                        <span className="text-xl font-bold text-slate-900">{event.displayDate.split('/')[0]}</span>
                     </div>

                     {/* Info */}
                     <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                           <h4 className="font-bold text-slate-900 text-lg">{event.title}</h4>
                           {event.daysLeft === 0 && <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">HÔM NAY</span>}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                           <EventIcon type={event.type} />
                           <span>Liên quan: <span className="font-medium text-slate-700">{event.connectionName}</span></span>
                        </div>
                     </div>

                     {/* Countdown & Action */}
                     <div className="text-right flex flex-col items-end gap-2">
                        {event.daysLeft > 0 ? (
                           <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full">
                              <Clock size={12} /> Còn {event.daysLeft} ngày
                           </div>
                        ) : (
                           <Button size="sm" className="h-8 text-xs bg-pink-600 hover:bg-pink-700 border-none shadow-none">
                              Gửi lời chúc
                           </Button>
                        )}
                        <div className="flex gap-2">
                           <button 
                              onClick={(e) => { e.stopPropagation(); toggleFavorite(event.id); }}
                              className={`p-2 rounded-full transition-colors ${event.isFavorite ? 'text-yellow-400 hover:text-yellow-500 bg-yellow-50' : 'text-slate-300 hover:text-yellow-400 hover:bg-slate-50'}`}
                              title="Mark as Favorite"
                           >
                              <Star size={20} fill={event.isFavorite ? "currentColor" : "none"} />
                           </button>
                        </div>
                     </div>
                  </div>
               </div>
            ))}

            {filteredEvents.length === 0 && (
               <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <p className="text-slate-400">Không có sự kiện nào trong danh mục này.</p>
               </div>
            )}
         </div>
      </div>

      {/* Add Event Modal */}
      <Modal isOpen={isAddEventModalOpen} onClose={() => setIsAddEventModalOpen(false)} title="Thêm Sự Kiện Mới">
         <div className="space-y-4">
            <div>
               <label className="text-xs font-bold text-slate-700 uppercase mb-1 block">Tên sự kiện</label>
               <Input 
                  value={newEvent.title} 
                  onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                  placeholder="Ví dụ: Sinh nhật Bố..."
               />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="text-xs font-bold text-slate-700 uppercase mb-1 block">Ngày</label>
                  <Input 
                     type="date"
                     value={newEvent.date} 
                     onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                  />
               </div>
               <div>
                  <label className="text-xs font-bold text-slate-700 uppercase mb-1 block">Loại sự kiện</label>
                  <select 
                     value={newEvent.type}
                     onChange={(e) => setNewEvent({...newEvent, type: e.target.value as EventType})}
                     className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-primary-500"
                  >
                     <option value={EventType.BIRTHDAY}>Sinh nhật</option>
                     <option value={EventType.ANNIVERSARY}>Kỷ niệm</option>
                     <option value={EventType.MEMORIAL}>Đám giỗ / Tưởng niệm</option>
                     <option value={EventType.OTHER}>Khác</option>
                  </select>
               </div>
            </div>

            <div className="relative">
               <label className="text-xs font-bold text-slate-700 uppercase mb-1 block">Liên quan đến (Người)</label>
               <Input 
                  value={newEvent.connectionName} 
                  onChange={(e) => {
                     setNewEvent({...newEvent, connectionName: e.target.value});
                     setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  // onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} // Delay to allow click
                  placeholder="Nhập tên người liên quan..."
                  className="w-full"
               />
               
               {/* Autocomplete Dropdown */}
               {showSuggestions && newEvent.connectionName && (
                  <div className="absolute z-50 w-full bg-white mt-1 border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                     {filteredSuggestions.length > 0 ? (
                        filteredSuggestions.map(conn => (
                           <div 
                              key={conn.id}
                              onClick={() => selectSuggestion(conn.name)}
                              className="px-4 py-2 hover:bg-slate-50 cursor-pointer flex items-center gap-2 text-sm text-slate-700"
                           >
                              <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                 <User size={14} />
                              </div>
                              <span className="font-medium">{conn.name}</span>
                              {conn.nickname && <span className="text-slate-400 text-xs">({conn.nickname})</span>}
                           </div>
                        ))
                     ) : (
                        <div className="px-4 py-2 text-sm text-slate-400 italic">Không tìm thấy người phù hợp</div>
                     )}
                  </div>
               )}
            </div>

            <div className="pt-4">
               <Button fullWidth onClick={handleAddEvent}>Lưu Sự Kiện</Button>
            </div>
         </div>
      </Modal>

    </div>
  );
};

export default CalendarPage;