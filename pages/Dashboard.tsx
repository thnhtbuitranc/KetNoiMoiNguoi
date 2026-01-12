import React, { useState, useEffect } from 'react';
import { Card, Button, Badge } from '../components/ui';
import { Sparkles, Calendar, Clock, Activity, Shield, ChevronRight, Heart, Cake, Flame, Filter, Image as ImageIcon, Music, MapPin, UserPlus, CheckCircle } from 'lucide-react';
import { Language } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { supabase, logDbOperation } from '../services/supabase';
import UserProfileModal from '../components/UserProfileModal';

interface DashboardProps {
  lang: Language;
}

interface Suggestion {
    id: string;
    name: string;
    avatar: string;
    score: number;
    reasons: string[];
}

const Dashboard: React.FC<DashboardProps> = ({ lang }) => {
  const [eventFilter, setEventFilter] = useState<'7D' | '1M' | '3M'>('7D');
  const [events, setEvents] = useState<any[]>([]);
  const [stats, setStats] = useState<any[]>([]);
  const [totalConnections, setTotalConnections] = useState(0);
  
  // Suggestion State
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());

  // View Profile State
  const [viewingProfileId, setViewingProfileId] = useState<string | null>(null);

  // Helper to normalize strings for comparison (remove accents, lowercase)
  const normalize = (str: string) => {
      if (!str) return "";
      return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  };

  // Fetch Dashboard Data
  useEffect(() => {
     const fetchData = async () => {
        logDbOperation('Dashboard', 'Fetching stats & events...');
        
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 1. Fetch Stats (Tier Distribution)
        const { data: connData, error: connError } = await supabase.from('connections').select('tier, tags');
        let connectedIds: string[] = []; // Track who is already connected

        if (!connError && connData) {
            setTotalConnections(connData.length);
            const tiers = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
            connData.forEach((c: any) => {
               if (tiers[c.tier as keyof typeof tiers] !== undefined) tiers[c.tier as keyof typeof tiers]++;
               // Extract linked IDs if available in tags or just assume we fetch connections with linked_user_id (if schema supported, but here we use manual match)
               // For suggestions, we really need the profile IDs of people we are connected to.
               // Currently 'connections' table stores 'user_id' (me) and 'name', not necessarily linking to another profile ID unless 'tags' has LINKED_ID.
               if (c.tags) {
                   c.tags.forEach((t: string) => {
                       if (t.startsWith('LINKED_ID:')) connectedIds.push(t.split(':')[1]);
                   });
               }
            });
            
            const chartData = [
               { name: 'Tri kỷ', value: tiers[5], color: '#6366f1' }, // Indigo
               { name: 'Gia đình', value: tiers[4], color: '#3b82f6' }, // Blue
               { name: 'Bạn thân', value: tiers[3], color: '#10b981' }, // Emerald
               { name: 'Xã giao', value: tiers[2] + tiers[1], color: '#94a3b8' }, // Slate
            ].filter(d => d.value > 0);
            
            setStats(chartData);
        }

        // 2. Fetch Events
        const { data: eventData, error: eventError } = await supabase
            .from('events')
            .select('*')
            .order('event_date', { ascending: true })
            .limit(10);
            
        if (!eventError && eventData) {
            logDbOperation('Dashboard', 'Events received', eventData);
            
            const today = new Date();
            const formattedEvents = eventData.map((e: any) => {
               const eDate = new Date(e.event_date);
               const diffTime = eDate.getTime() - today.getTime();
               const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
               
               return {
                  id: e.id,
                  title: e.title,
                  date: e.event_date,
                  displayDate: `${eDate.getDate()}/${eDate.getMonth() + 1}`,
                  type: e.type,
                  daysLeft: daysLeft,
                  isFavorite: e.is_favorite
               };
            }).filter((e: any) => e.daysLeft >= 0); // Only future events

            setEvents(formattedEvents);
        }

        // 3. Find Suggestions (People You May Know)
        findSuggestions(user.id, connectedIds);
     };

     fetchData();
  }, []);

  const findSuggestions = async (myId: string, connectedIds: string[]) => {
      setLoadingSuggestions(true);
      try {
          // A. Get My Detailed Info
          const { data: myProfile } = await supabase.from('profiles').select('detailed_info, location').eq('id', myId).single();
          const myInfo = myProfile?.detailed_info || {};
          const myLocation = myProfile?.location || "";

          // B. Get Candidates (Limit 50 to avoid heavy load)
          // Exclude self. We will filter connectedIds in JS.
          const { data: candidates } = await supabase
            .from('profiles')
            .select('id, name, avatar_url, detailed_info, location')
            .neq('id', myId)
            .limit(50);

          if (!candidates) return;

          const results: Suggestion[] = [];

          candidates.forEach(candidate => {
              // Skip if already connected
              if (connectedIds.includes(candidate.id)) return;

              let score = 0;
              const reasons: string[] = [];
              const candInfo = candidate.detailed_info || {};

              // Helper to compare fields
              const checkMatch = (field: string, label: string) => {
                  const myVal = myInfo[field];
                  const candVal = candInfo[field];
                  
                  // Handle if value is Object (SchoolInfo) or String
                  const myStr = typeof myVal === 'object' ? myVal?.name : myVal;
                  const candStr = typeof candVal === 'object' ? candVal?.name : candVal;

                  if (myStr && candStr && typeof myStr === 'string' && typeof candStr === 'string') {
                      // Use normalize for better matching (Phu Dong == Phù Đổng)
                      if (normalize(myStr) === normalize(candStr)) {
                          score++;
                          reasons.push(`Cùng ${label}: ${myStr}`);
                          
                          // Bonus: Check Class/Years if object
                          if (typeof myVal === 'object' && typeof candVal === 'object') {
                              if (myVal.classes && candVal.classes) {
                                  // Simple substring check for class overlap
                                  const myClasses = myVal.classes.split(/[,;]/).map((s: string) => normalize(s));
                                  const candClasses = candVal.classes.split(/[,;]/).map((s: string) => normalize(s));
                                  const commonClass = myClasses.find((c: string) => candClasses.includes(c));
                                  if (commonClass) {
                                      score++;
                                      reasons.push(`Cùng lớp: ${myVal.classes}`);
                                  }
                              }
                          }
                      }
                  }
              };

              // 1. Check Schools
              checkMatch('preschool', 'Mầm non');
              checkMatch('primarySchool', 'Tiểu học');
              checkMatch('secondarySchool', 'THCS');
              checkMatch('highSchool', 'THPT');
              checkMatch('university', 'Đại học');
              
              // 1.1 Check Academic Details
              checkMatch('highSchoolStream', 'Ban học');
              checkMatch('major', 'Chuyên ngành');

              // 2. Check Work
              checkMatch('company', 'Công ty');
              checkMatch('organization', 'Tổ chức');

              // 3. Check Living
              checkMatch('hometown', 'Quê quán');
              checkMatch('neighborhood', 'Khu vực');
              
              // 4. Check Location (Main Profile Field)
              if (myLocation && candidate.location && normalize(myLocation).includes(normalize(candidate.location))) {
                  score++;
                  reasons.push(`Cùng sống tại: ${candidate.location}`);
              }

              if (score >= 2) {
                  results.push({
                      id: candidate.id,
                      name: candidate.name,
                      avatar: candidate.avatar_url,
                      score: score,
                      reasons: reasons.slice(0, 3) // Top 3 reasons
                  });
              }
          });

          // Sort by score desc
          results.sort((a, b) => b.score - a.score);
          setSuggestions(results);

      } catch (e) {
          console.error("Error finding suggestions", e);
      } finally {
          setLoadingSuggestions(false);
      }
  };

  const handleSendRequest = async (targetId: string, targetName: string) => {
      try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          // Fetch my profile name
          const { data: myProfile } = await supabase.from('profiles').select('name').eq('id', user.id).single();
          const myName = myProfile?.name || "Một người bạn";

          // Insert Notification for Target
          const { error } = await supabase.from('notifications').insert({
              user_id: targetId,
              type: 'FRIEND_REQ',
              title: `${myName} gửi lời mời kết bạn`,
              message: `Chúng ta có điểm chung! ${myName} muốn kết nối với bạn.`,
              related_entity_id: user.id,
              related_entity_type: 'PROFILE',
              is_read: false
          });

          if (error) throw error;

          setSentRequests(prev => new Set(prev).add(targetId));
          alert(`Đã gửi lời mời đến ${targetName}!`);

      } catch (err: any) {
          alert("Lỗi gửi lời mời: " + err.message);
      }
  };

  const toggleFavorite = async (id: string, currentVal: boolean) => {
     // Optimistic update
     setEvents(prev => prev.map(e => e.id === id ? { ...e, isFavorite: !currentVal } : e));
     await supabase.from('events').update({ is_favorite: !currentVal }).eq('id', id);
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
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Chào buổi sáng.</h1>
          <p className="text-slate-500 mt-1">Đây là tổng quan các mối quan hệ của bạn hôm nay.</p>
        </div>
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
                        data={stats.length > 0 ? stats : [{name: 'Empty', value: 1, color: '#f1f5f9'}]}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        startAngle={90}
                        endAngle={-270}
                     >
                        {stats.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                        ))}
                     </Pie>
                  </PieChart>
               </ResponsiveContainer>
               {/* Center Text */}
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                  <span className="text-3xl font-bold text-slate-900 block">{totalConnections}</span>
                  <span className="text-xs text-slate-400 uppercase tracking-wide">Connections</span>
               </div>
            </div>

            <div className="flex flex-wrap justify-center gap-3 mt-4">
               {stats.map(item => (
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
                           onClick={(e) => { e.stopPropagation(); toggleFavorite(event.id, event.isFavorite); }}
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

      {/* NEW SECTION: People You May Know */}
      {suggestions.length > 0 && (
          <div className="mt-8">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Sparkles size={20} className="text-yellow-500 fill-yellow-500" /> Có thể bạn quen biết
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {suggestions.map(person => (
                      <Card 
                        key={person.id} 
                        className="p-4 flex gap-4 items-center hover:bg-slate-50 transition-colors cursor-pointer group"
                        onClick={() => setViewingProfileId(person.id)} // View Profile on Click
                      >
                          <img src={person.avatar} className="w-14 h-14 rounded-full object-cover border border-slate-100 group-hover:scale-105 transition-transform" />
                          <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-slate-900 text-sm group-hover:text-primary-600 transition-colors">{person.name}</h4>
                              <div className="mt-1 space-y-0.5">
                                  {person.reasons.map((reason, idx) => (
                                      <p key={idx} className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                                          <div className="w-1 h-1 rounded-full bg-indigo-400"></div> {reason}
                                      </p>
                                  ))}
                              </div>
                          </div>
                          <div>
                              {sentRequests.has(person.id) ? (
                                  <Button size="sm" disabled className="bg-green-50 text-green-600 border-none shadow-none px-3">
                                      <CheckCircle size={16} />
                                  </Button>
                              ) : (
                                  <Button 
                                    size="sm" 
                                    className="px-3" 
                                    onClick={(e) => { e.stopPropagation(); handleSendRequest(person.id, person.name); }} 
                                    title="Gửi lời mời kết bạn"
                                  >
                                      <UserPlus size={16} />
                                  </Button>
                              )}
                          </div>
                      </Card>
                  ))}
              </div>
          </div>
      )}

      {/* Profile Viewer Modal */}
      <UserProfileModal 
        isOpen={!!viewingProfileId} 
        onClose={() => setViewingProfileId(null)}
        userId={viewingProfileId}
      />

    </div>
  );
};

export default Dashboard;