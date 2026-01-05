import React, { useState, useMemo } from 'react';
import { Card, Button, Badge, Input, Modal } from '../components/ui';
import { Search, Filter, Plus, Grid as GridIcon, List as ListIcon, MoreHorizontal, Phone, MapPin, Star, Calendar, RefreshCw, Check, Edit2, UserPlus, Globe, Tag, X, Activity, Zap, Sun } from 'lucide-react';
import { Language, RelationshipTier, Connection } from '../types';

interface ConnectionsProps {
  lang: Language;
}

// EXPANDED MOCK DATA (20 USERS)
const INITIAL_CONNECTIONS: Connection[] = [
  // TIER 5 - SOULMATE (3)
  { id: '1', name: 'Nguyễn Văn A', nickname: 'Chồng Yêu', role: 'Chồng', tier: RelationshipTier.SOULMATE, tags: ['Gia đình', 'Nhà'], phone: '0909123456', location: 'Hà Nội', lastInteraction: '2023-10-25', memoriesCount: 124, birthday: '15/08', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&fit=crop', source: 'APP' },
  { id: '2', name: 'Trần Thị Mai', nickname: 'BFF', role: 'Bạn thân 20 năm', tier: RelationshipTier.SOULMATE, tags: ['Cấp 2', 'Du lịch'], phone: '0912345678', location: 'TP.HCM', lastInteraction: '2023-10-20', memoriesCount: 89, birthday: '20/10', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&fit=crop', source: 'MANUAL' },
  { id: '3', name: 'Lê Thu Hà', nickname: 'Sis', role: 'Em gái', tier: RelationshipTier.SOULMATE, tags: ['Gia đình'], phone: '0987654321', location: 'Đà Nẵng', lastInteraction: '2023-10-24', memoriesCount: 200, birthday: '05/05', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&fit=crop', source: 'APP' },

  // TIER 4 - FAMILY/IMPORTANT (4)
  { id: '4', name: 'Phạm Văn Hùng', role: 'Bố', tier: RelationshipTier.FAMILY, tags: ['Gia đình'], phone: '', location: 'Hải Phòng', lastInteraction: '2023-10-15', memoriesCount: 45, birthday: '02/01', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&fit=crop', source: 'APP' },
  { id: '5', name: 'Hoàng Thị Lan', role: 'Mẹ', tier: RelationshipTier.FAMILY, tags: ['Gia đình'], phone: '', location: 'Hải Phòng', lastInteraction: '2023-10-15', memoriesCount: 50, birthday: '12/12', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&fit=crop', source: 'MANUAL' },
  { id: '6', name: 'Nguyễn Quốc Bảo', role: 'Anh trai', tier: RelationshipTier.FAMILY, tags: ['Gia đình'], phone: '', location: 'Sài Gòn', lastInteraction: '2023-09-30', memoriesCount: 12, birthday: '', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&fit=crop', source: 'MANUAL' },
  { id: '7', name: 'Sarah Jenkins', role: 'Mentor', tier: RelationshipTier.FAMILY, tags: ['Công việc', 'Mentor'], phone: '', location: 'USA', lastInteraction: '2023-09-01', memoriesCount: 30, birthday: '', avatar: 'https://images.unsplash.com/photo-1554151228-14d9def656ec?w=400&fit=crop', source: 'APP' },

  // TIER 3 - CLOSE FRIEND (5)
  { id: '8', name: 'Trương Minh Tuấn', nickname: 'Tuấn Còi', role: 'Đồng nghiệp cũ', tier: RelationshipTier.FRIEND, tags: ['Công ty A'], phone: '', location: 'Hà Nội', lastInteraction: '2023-08-10', memoriesCount: 5, birthday: '11/11', avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=400&fit=crop', source: 'MANUAL' },
  { id: '9', name: 'Vũ Thị Ngọc', role: 'Hội sách', tier: RelationshipTier.FRIEND, tags: ['Sách', 'Cafe'], phone: '', location: 'Hà Nội', lastInteraction: '2023-09-20', memoriesCount: 8, birthday: '', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&fit=crop', source: 'APP' },
  { id: '10', name: 'Kevin Durant', role: 'Đối tác', tier: RelationshipTier.FRIEND, tags: ['Bóng rổ'], phone: '', location: 'HCMC', lastInteraction: '2023-10-01', memoriesCount: 2, birthday: '', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&fit=crop', source: 'MANUAL' },
  { id: '11', name: 'Lâm Xung', role: 'Bạn Gym', tier: RelationshipTier.FRIEND, tags: ['Gym'], phone: '', location: '', lastInteraction: '2023-10-22', memoriesCount: 0, birthday: '', avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=400&fit=crop', source: 'APP' },
  { id: '12', name: 'Jessica Jung', role: 'Bạn du học', tier: RelationshipTier.FRIEND, tags: ['Úc'], phone: '', location: 'Melbourne', lastInteraction: '2023-06-15', memoriesCount: 15, birthday: '', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&fit=crop', source: 'APP' },

  // TIER 2 - CASUAL (4)
  { id: '13', name: 'Phan Hải', role: 'Sale BĐS', tier: RelationshipTier.CASUAL, tags: ['Công việc'], phone: '', location: '', lastInteraction: '2023-05-20', memoriesCount: 0, birthday: '', avatar: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400&fit=crop', source: 'MANUAL' },
  { id: '14', name: 'Đỗ Mỹ Linh', role: 'Hàng xóm', tier: RelationshipTier.CASUAL, tags: ['Khu phố'], phone: '', location: '', lastInteraction: '2023-10-10', memoriesCount: 1, birthday: '', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&fit=crop', source: 'MANUAL' },
  { id: '15', name: 'Trần Văn Quyết', role: 'Thợ sửa xe', tier: RelationshipTier.CASUAL, tags: ['Dịch vụ'], phone: '', location: '', lastInteraction: '2023-01-01', memoriesCount: 0, birthday: '', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&fit=crop', source: 'MANUAL' },
  { id: '16', name: 'Ngô Thanh Vân', role: 'Khách hàng', tier: RelationshipTier.CASUAL, tags: ['Dự án X'], phone: '', location: '', lastInteraction: '2023-04-12', memoriesCount: 3, birthday: '', avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&fit=crop', source: 'APP' },

  // TIER 1 - ACQUAINTANCE (4)
  { id: '17', name: 'Bác Bảo vệ', role: 'Chung cư', tier: RelationshipTier.ACQUAINTANCE, tags: [], phone: '', location: '', lastInteraction: '2023-10-25', memoriesCount: 0, birthday: '', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&fit=crop', source: 'MANUAL' },
  { id: '18', name: 'Shipper GHTK', role: 'Giao hàng', tier: RelationshipTier.ACQUAINTANCE, tags: [], phone: '', location: '', lastInteraction: '2023-10-23', memoriesCount: 0, birthday: '', avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=400&fit=crop', source: 'MANUAL' },
  { id: '19', name: 'Chị Bán Rau', role: 'Chợ', tier: RelationshipTier.ACQUAINTANCE, tags: [], phone: '', location: '', lastInteraction: '2023-10-21', memoriesCount: 0, birthday: '', avatar: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&fit=crop', source: 'MANUAL' },
  { id: '20', name: 'Nhân viên Ngân hàng', role: 'VCB', tier: RelationshipTier.ACQUAINTANCE, tags: [], phone: '', location: '', lastInteraction: '2022-12-12', memoriesCount: 0, birthday: '', avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&fit=crop', source: 'MANUAL' },
];

const TierBadge: React.FC<{ tier: RelationshipTier }> = ({ tier }) => {
   const config = {
      [RelationshipTier.SOULMATE]: { label: 'TRI KỶ', color: 'bg-red-50 text-red-600' },
      [RelationshipTier.FAMILY]: { label: 'GIA ĐÌNH', color: 'bg-purple-50 text-purple-600' },
      [RelationshipTier.FRIEND]: { label: 'BẠN THÂN', color: 'bg-green-50 text-green-600' },
      [RelationshipTier.CASUAL]: { label: 'XÃ GIAO', color: 'bg-blue-50 text-blue-600' },
      [RelationshipTier.ACQUAINTANCE]: { label: 'NGƯỜI QUEN', color: 'bg-slate-100 text-slate-600' },
   }[tier];

   return <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${config.color}`}>{config.label}</span>;
};

const SourceBadge: React.FC<{ source: 'APP' | 'MANUAL' }> = ({ source }) => {
  return source === 'APP' ? (
    <span className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
      <Globe size={10} /> Từ App
    </span>
  ) : (
    <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
      <UserPlus size={10} /> Từ Thêm mới
    </span>
  );
};

// Helper function to remove accents for better searching
const normalizeString = (str: string) => {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();
};

const Connections: React.FC<ConnectionsProps> = ({ lang }) => {
  const [connections, setConnections] = useState<Connection[]>(INITIAL_CONNECTIONS);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'galaxy'>('list');
  const [filter, setFilter] = useState('');
  
  // Advanced Filters
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [tierFilter, setTierFilter] = useState<number | 'ALL'>('ALL');
  const [sourceFilter, setSourceFilter] = useState<'ALL' | 'APP' | 'MANUAL'>('ALL');
  const [birthdayFilter, setBirthdayFilter] = useState<'ALL' | 'TODAY' | 'WEEK'>('ALL');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Form State
  const [newConnection, setNewConnection] = useState<Partial<Connection> & { tagsString: string }>({
    name: '', nickname: '', role: '', phone: '', birthday: '', location: '', tier: RelationshipTier.ACQUAINTANCE, source: 'MANUAL', tagsString: ''
  });
  const [editingConnection, setEditingConnection] = useState<(Connection & { tagsString: string }) | null>(null);

  const handleAddNew = () => {
    if (!newConnection.name) return;
    const newId = (connections.length + 1).toString();
    const conn: Connection = {
      id: newId,
      name: newConnection.name || 'Unknown',
      nickname: newConnection.nickname,
      role: newConnection.role || '',
      phone: newConnection.phone || '',
      birthday: newConnection.birthday || '',
      location: newConnection.location || '',
      tier: newConnection.tier || RelationshipTier.ACQUAINTANCE,
      source: 'MANUAL',
      avatar: `https://ui-avatars.com/api/?name=${newConnection.name}&background=random`,
      lastInteraction: new Date().toISOString().split('T')[0],
      memoriesCount: 0,
      tags: newConnection.tagsString ? newConnection.tagsString.split(',').map(t => t.trim()).filter(t => t) : []
    };
    setConnections([conn, ...connections]);
    setIsAddModalOpen(false);
    setNewConnection({ name: '', nickname: '', role: '', phone: '', birthday: '', location: '', tier: RelationshipTier.ACQUAINTANCE, source: 'MANUAL', tagsString: '' });
  };

  const startEdit = (conn: Connection) => {
    setEditingConnection({ ...conn, tagsString: conn.tags ? conn.tags.join(', ') : '' });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingConnection) return;
    const updatedConn: Connection = {
      ...editingConnection,
      tags: editingConnection.tagsString ? editingConnection.tagsString.split(',').map(t => t.trim()).filter(t => t) : []
    };
    setConnections(connections.map(c => c.id === updatedConn.id ? updatedConn : c));
    setIsEditModalOpen(false);
    setEditingConnection(null);
  };

  const clearFilters = () => {
     setFilter('');
     setTierFilter('ALL');
     setSourceFilter('ALL');
     setBirthdayFilter('ALL');
  };

  // Enhanced Filter Logic
  const filteredConnections = connections.filter(c => {
    if (tierFilter !== 'ALL' && c.tier !== tierFilter) return false;
    if (sourceFilter !== 'ALL' && c.source !== sourceFilter) return false;
    if (birthdayFilter !== 'ALL') {
        if (!c.birthday) return false;
        const today = new Date();
        today.setHours(0,0,0,0);
        const currentYear = today.getFullYear();
        const [bDay, bMonth] = c.birthday.split('/').map(num => parseInt(num, 10));
        let bDate = new Date(currentYear, bMonth - 1, bDay);
        if (birthdayFilter === 'TODAY') {
            if (bDate.getDate() !== today.getDate() || bDate.getMonth() !== today.getMonth()) return false;
        }
        if (birthdayFilter === 'WEEK') {
             if (bDate < today) bDate.setFullYear(currentYear + 1);
             const diffTime = bDate.getTime() - today.getTime();
             const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
             if (diffDays < 0 || diffDays > 7) return false;
        }
    }
    if (!filter) return true;
    const search = normalizeString(filter);
    const check = (val?: string) => val ? normalizeString(val).includes(search) : false;
    if (check(c.name)) return true;
    if (check(c.nickname)) return true;
    if (check(c.role)) return true;
    if (check(c.phone)) return true;
    if (check(c.location)) return true;
    if (check(c.birthday)) return true;
    if (c.tags && c.tags.some(t => check(t))) return true;
    return false;
  });

  // --- Galaxy View Component & Logic ---
  const GalaxyView = ({ data, onEdit }: { data: Connection[], onEdit: (c: Connection) => void }) => {
     
     // Orbit Configuration: [Tier]: { radius: %, duration: sec, color: string }
     // We will calculate exact px based on container size, but here we use % for responsive
     // UPDATED: Tighter orbits (narrower gaps)
     const orbits = {
        5: { radius: 13, duration: 45, color: 'border-pink-500/30 shadow-[0_0_15px_rgba(236,72,153,0.2)]', zIndex: 50 },
        4: { radius: 21, duration: 65, color: 'border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.2)]', zIndex: 40 },
        3: { radius: 29, duration: 95, color: 'border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.1)]', zIndex: 30 },
        2: { radius: 37, duration: 135, color: 'border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]', zIndex: 20 },
        1: { radius: 45, duration: 190, color: 'border-slate-500/20', zIndex: 10 },
     };

     const groupedData = useMemo(() => {
        const groups: Record<number, Connection[]> = { 1: [], 2: [], 3: [], 4: [], 5: [] };
        data.forEach(c => {
           if (groups[c.tier]) groups[c.tier].push(c);
        });
        return groups;
     }, [data]);

     return (
        <div className="relative w-full h-[800px] bg-[#050810] rounded-3xl overflow-hidden shadow-2xl border border-slate-800 flex items-center justify-center group/galaxy">
           
           {/* Deep Space Background */}
           <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900/50 via-[#050810] to-black opacity-100"></div>
           
           {/* Stars (Static for now, could be animated) */}
           {Array.from({ length: 50 }).map((_, i) => (
             <div 
               key={i}
               className="absolute rounded-full bg-white opacity-40 animate-pulse"
               style={{
                 width: Math.random() * 2 + 'px',
                 height: Math.random() * 2 + 'px',
                 top: Math.random() * 100 + '%',
                 left: Math.random() * 100 + '%',
                 animationDuration: Math.random() * 3 + 2 + 's'
               }}
             />
           ))}

           {/* The Earth (You) */}
           <div className="absolute z-[100] group cursor-default">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 via-blue-600 to-emerald-400 shadow-[0_0_30px_rgba(37,99,235,0.6)] flex items-center justify-center border-4 border-white/30 relative">
                 <Globe size={32} className="text-white" strokeWidth={1.5} />
              </div>
           </div>

           {/* Orbits & Planets */}
           {Object.keys(orbits).map((tierKey) => {
              const tier = Number(tierKey);
              // @ts-ignore
              const config = orbits[tier];
              const connections = groupedData[tier];
              const count = connections.length;
              const angleStep = 360 / (count || 1);

              if (count === 0) return null;

              return (
                 <div 
                    key={`orbit-${tier}`}
                    className={`absolute rounded-full border ${config.color} flex items-center justify-center pointer-events-none transition-all duration-500`}
                    style={{ 
                      width: `${config.radius * 2}%`, 
                      height: `${config.radius * 2}%`,
                      zIndex: config.zIndex,
                    }}
                 >
                    {/* Rotating Ring Container */}
                    <div 
                      className="absolute w-full h-full animate-spin-slow group-hover/galaxy:paused"
                      style={{ 
                        animation: `orbit ${config.duration}s linear infinite`,
                      }}
                    >
                      {connections.map((conn, index) => {
                         const startAngle = index * angleStep;
                         // UPDATED: Avatar sizes reduced by 20%
                         const size = tier === 5 ? 70 : tier === 4 ? 58 : tier === 3 ? 48 : tier === 2 ? 38 : 32;
                         
                         return (
                            <div 
                              key={conn.id}
                              className="absolute top-0 left-1/2 w-0 h-[50%]"
                              style={{ 
                                transformOrigin: 'bottom center',
                                transform: `rotate(${startAngle}deg)`,
                              }}
                            >
                               {/* Planet Wrapper - Positioned at top of spoke (perimeter) */}
                               <div 
                                 className="absolute pointer-events-auto cursor-pointer group/planet"
                                 style={{
                                    width: size,
                                    height: size,
                                    top: -size / 2, // Center on orbit line
                                    left: -size / 2, // Center on spoke
                                 }}
                                 onClick={() => onEdit(conn)}
                               >
                                  {/* 1. Counter-rotate STATICALLY to negate startAngle (Upright Orientation Step 1) */}
                                  <div 
                                    className="w-full h-full"
                                    style={{ transform: `rotate(-${startAngle}deg)` }}
                                  >
                                      {/* 2. Counter-rotate ANIMATED to negate orbit rotation (Upright Orientation Step 2) */}
                                      <div 
                                        className="w-full h-full relative group-hover/galaxy:paused"
                                        style={{ animation: `counter-orbit ${config.duration}s linear infinite` }}
                                      >
                                          {/* Avatar */}
                                          <div className={`
                                            w-full h-full rounded-full p-[3px] shadow-lg transition-transform duration-300 hover:scale-125 relative
                                            ${tier === 5 ? 'bg-gradient-to-tr from-pink-500 to-rose-500' : 
                                              tier === 4 ? 'bg-gradient-to-tr from-purple-500 to-indigo-500' : 
                                              tier === 3 ? 'bg-gradient-to-tr from-teal-400 to-emerald-500' : 
                                              tier === 2 ? 'bg-slate-400' : 'bg-slate-600'}
                                          `}>
                                              <img 
                                                src={conn.avatar} 
                                                alt={conn.name}
                                                className="w-full h-full rounded-full object-cover border-2 border-slate-900 bg-slate-900"
                                              />
                                              
                                              {/* Label on Hover */}
                                              <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 opacity-0 group-hover/planet:opacity-100 transition-opacity bg-slate-900/90 text-white text-[10px] px-2 py-1 rounded border border-white/10 whitespace-nowrap z-[100] pointer-events-none">
                                                <p className="font-bold">{conn.name}</p>
                                                <p className="text-slate-400">{conn.role}</p>
                                              </div>
                                          </div>
                                      </div>
                                  </div>
                               </div>
                            </div>
                         );
                      })}
                    </div>
                 </div>
              );
           })}

           {/* CSS Keyframes for Orbit */}
           <style>{`
             @keyframes orbit {
               from { transform: rotate(0deg); }
               to { transform: rotate(360deg); }
             }
             @keyframes counter-orbit {
               from { transform: rotate(0deg); }
               to { transform: rotate(-360deg); }
             }
             .group-hover\\/galaxy\\:paused {
                animation-play-state: paused;
             }
           `}</style>
           
           {/* Legend overlay */}
           <div className="absolute bottom-6 right-6 bg-slate-900/80 backdrop-blur border border-slate-700 p-4 rounded-2xl text-xs text-slate-300 pointer-events-none">
              <div className="font-bold mb-2 uppercase tracking-widest text-slate-500">Orbits</div>
              <div className="flex items-center gap-2 mb-1"><div className="w-2 h-2 rounded-full bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,1)]"></div> Soulmate</div>
              <div className="flex items-center gap-2 mb-1"><div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,1)]"></div> Family</div>
              <div className="flex items-center gap-2 mb-1"><div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,1)]"></div> Friend</div>
              <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-slate-500"></div> Casual</div>
           </div>

        </div>
     );
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h1 className="text-2xl font-bold text-slate-900">Danh bạ & Mối quan hệ</h1>
           <p className="text-slate-500 text-sm mt-1">Quản lý {filteredConnections.length} người kết nối</p>
        </div>
        <div className="flex gap-2">
           <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1">
              <button 
                 onClick={() => setViewMode('list')}
                 className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-slate-900 text-white shadow-glow' : 'text-slate-400 hover:text-slate-600'}`}
              >
                 <ListIcon size={18} />
              </button>
              <div className="w-px h-6 bg-slate-200 mx-1"></div>
              <button 
                 onClick={() => setViewMode('grid')}
                 className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-slate-900 text-white shadow-glow' : 'text-slate-400 hover:text-slate-600'}`}
              >
                 <GridIcon size={18} />
              </button>
              <div className="w-px h-6 bg-slate-200 mx-1"></div>
              <button 
                 onClick={() => setViewMode('galaxy')}
                 className={`p-2 rounded-md transition-all ${viewMode === 'galaxy' ? 'bg-slate-900 text-white shadow-glow' : 'text-slate-400 hover:text-slate-600'}`}
                 title="Galaxy View"
              >
                 <Globe size={18} />
              </button>
           </div>
        </div>
      </div>

      {/* Toolbar */}
      <Card className="p-4 space-y-4">
         <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
               <input 
                  type="text" 
                  placeholder="Tìm theo tên, nickname, tag, vai trò..." 
                  className="w-full pl-10 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
               />
               {filter && (
                  <button onClick={() => setFilter('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                     <X size={14} />
                  </button>
               )}
            </div>
            <div className="flex gap-3 w-full md:w-auto">
               <Button 
                  variant={showAdvancedFilters ? "primary" : "secondary"} 
                  className="gap-2 flex-1 md:flex-none"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
               >
                  <Filter size={18} /> Lọc
               </Button>
               <Button className="gap-2 flex-1 md:flex-none bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-500/20" onClick={() => setIsAddModalOpen(true)}>
                  <Plus size={18} /> Thêm mới
               </Button>
            </div>
         </div>

         {/* Advanced Filters Panel */}
         {showAdvancedFilters && (
            <div className="pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2">
               <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Phân loại (Tier)</label>
                  <select 
                     value={tierFilter}
                     onChange={(e) => setTierFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                     className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
                  >
                     <option value="ALL">Tất cả phân loại</option>
                     <option value={5}>Tri kỷ (Tier 5)</option>
                     <option value={4}>Gia đình (Tier 4)</option>
                     <option value={3}>Bạn thân (Tier 3)</option>
                     <option value={2}>Xã giao (Tier 2)</option>
                     <option value={1}>Người quen (Tier 1)</option>
                  </select>
               </div>
               <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Nguồn</label>
                  <select 
                     value={sourceFilter}
                     onChange={(e) => setSourceFilter(e.target.value as any)}
                     className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
                  >
                     <option value="ALL">Tất cả nguồn</option>
                     <option value="APP">Từ App</option>
                     <option value="MANUAL">Thêm thủ công</option>
                  </select>
               </div>
               <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Sinh nhật</label>
                  <select 
                     value={birthdayFilter}
                     onChange={(e) => setBirthdayFilter(e.target.value as any)}
                     className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
                  >
                     <option value="ALL">Tất cả</option>
                     <option value="TODAY">Hôm nay</option>
                     <option value="WEEK">7 ngày tới</option>
                  </select>
               </div>
               <div className="flex items-end">
                  <button 
                     onClick={clearFilters}
                     className="text-sm text-slate-500 hover:text-red-500 font-medium underline px-2 py-2"
                  >
                     Xóa bộ lọc
                  </button>
               </div>
            </div>
         )}
      </Card>

      {/* Galaxy View */}
      {viewMode === 'galaxy' && (
         <GalaxyView data={filteredConnections} onEdit={startEdit} />
      )}

      {/* Grid View */}
      {viewMode === 'grid' && (
         <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {filteredConnections.map(conn => (
               <Card key={conn.id} className="p-6 flex flex-col items-center text-center relative group hover:-translate-y-1 transition-all duration-300">
                  <button className="absolute top-4 right-4 text-slate-300 hover:text-slate-600" onClick={() => startEdit(conn)}>
                     <Edit2 size={16} />
                  </button>
                  <div className="relative mb-4">
                     <img src={conn.avatar} className="w-20 h-20 rounded-full object-cover border-4 border-slate-50 shadow-sm" />
                     {conn.tier === RelationshipTier.SOULMATE && (
                        <div className="absolute -bottom-1 -right-1 bg-yellow-400 p-1 rounded-full border-2 border-white">
                           <Star size={10} className="text-white fill-white" />
                        </div>
                     )}
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg">
                    {conn.name} 
                    {conn.nickname && <span className="block text-sm font-normal text-slate-500">({conn.nickname})</span>}
                  </h3>
                  <p className="text-xs text-slate-500 mb-3">{conn.role}</p>
                  
                  <div className="mb-4 flex flex-wrap justify-center gap-1.5">
                     <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        conn.tier === RelationshipTier.SOULMATE ? 'bg-green-50 text-green-600' : 
                        conn.tier === RelationshipTier.FAMILY ? 'bg-green-50 text-green-600' : 
                        'bg-blue-50 text-blue-600'
                     }`}>
                        TIER {conn.tier}
                     </span>
                     {conn.tags?.map(tag => (
                        <span key={tag} className="px-2 py-1 rounded-full text-[10px] bg-slate-100 text-slate-600 border border-slate-200">
                           {tag}
                        </span>
                     ))}
                  </div>
                  <SourceBadge source={conn.source} />

                  <div className="flex items-center justify-between w-full border-t border-slate-100 pt-4 mt-4">
                     <div>
                        <span className="block font-bold text-slate-900 text-sm">{conn.memoriesCount}</span>
                        <span className="text-[10px] text-slate-400 uppercase font-medium">Memories</span>
                     </div>
                     <div className="text-right">
                        <span className="block font-bold text-slate-900 text-sm">{conn.lastInteraction}</span>
                        <span className="text-[10px] text-slate-400 uppercase font-medium">Last Seen</span>
                     </div>
                  </div>
               </Card>
            ))}
            {filteredConnections.length === 0 && (
               <div className="col-span-full py-12 text-center text-slate-400">
                  <p>Không tìm thấy kết nối nào phù hợp với bộ lọc.</p>
                  <Button variant="outline" size="sm" className="mt-4" onClick={clearFilters}>Xóa bộ lọc</Button>
               </div>
            )}
         </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
         <Card className="overflow-hidden border-none shadow-sm">
            <div className="overflow-x-auto">
               <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                     <tr>
                        <th className="px-6 py-4 font-semibold">HỌ VÀ TÊN (TÊN GỢI NHỚ)</th>
                        <th className="px-6 py-4 font-semibold">Phân loại & Tag phụ</th>
                        <th className="px-6 py-4 font-semibold">Thông tin</th>
                        <th className="px-6 py-4 font-semibold">Tương tác cuối</th>
                        <th className="px-6 py-4 font-semibold text-center">Nguồn</th>
                        <th className="px-6 py-4 font-semibold text-right">Hành động</th>
                     </tr>
                  </thead>
                  <tbody>
                     {filteredConnections.length > 0 ? filteredConnections.map((conn) => (
                        <tr key={conn.id} className="bg-white border-b border-slate-100 hover:bg-slate-50 transition-colors group">
                           <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                 <img src={conn.avatar} className="w-10 h-10 rounded-full object-cover" />
                                 <div>
                                    <div className="font-semibold text-slate-900">
                                       {conn.name} 
                                       {conn.nickname && <span className="text-slate-500 font-normal ml-1">({conn.nickname})</span>}
                                    </div>
                                    <div className="text-xs text-slate-500">{conn.role}</div>
                                 </div>
                              </div>
                           </td>
                           <td className="px-6 py-4">
                              <div className="flex flex-col items-start gap-1.5">
                                 <TierBadge tier={conn.tier} />
                                 {conn.tags && conn.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                       {conn.tags.map(tag => (
                                          <span key={tag} className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 flex items-center gap-1">
                                             <Tag size={8} /> {tag}
                                          </span>
                                       ))}
                                    </div>
                                 )}
                              </div>
                           </td>
                           <td className="px-6 py-4">
                              <div className="space-y-1">
                                 {conn.phone && (
                                    <div className="flex items-center gap-2 text-slate-600 text-xs">
                                       <Phone size={12} /> {conn.phone}
                                    </div>
                                 )}
                                 {conn.birthday && (
                                    <div className="flex items-center gap-2 text-slate-600 text-xs">
                                       <Calendar size={12} className="text-orange-400" /> {conn.birthday}
                                    </div>
                                 )}
                              </div>
                           </td>
                           <td className="px-6 py-4 text-slate-500">
                              {conn.lastInteraction}
                           </td>
                           <td className="px-6 py-4 text-center">
                              <div className="flex justify-center">
                                 <SourceBadge source={conn.source} />
                              </div>
                           </td>
                           <td className="px-6 py-4 text-right">
                              <button 
                                onClick={() => startEdit(conn)}
                                className="text-slate-400 hover:text-primary-600 font-medium text-xs transition-colors flex items-center justify-end gap-1 ml-auto"
                              >
                                 <Edit2 size={14} /> Chỉnh sửa
                              </button>
                           </td>
                        </tr>
                     )) : (
                        <tr>
                           <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                              <p>Không tìm thấy kết nối nào phù hợp với bộ lọc.</p>
                              <Button variant="outline" size="sm" className="mt-4" onClick={clearFilters}>Xóa bộ lọc</Button>
                           </td>
                        </tr>
                     )}
                  </tbody>
               </table>
            </div>
         </Card>
      )}

      {/* Add New Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Thêm Kết Nối Mới">
        <div className="space-y-4">
         <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="text-xs font-bold text-slate-700 uppercase mb-1 block">Họ và tên *</label>
               <Input 
                 value={newConnection.name} 
                 onChange={(e) => setNewConnection({...newConnection, name: e.target.value})}
                 placeholder="Nguyễn Văn A" 
               />
             </div>
             <div>
               <label className="text-xs font-bold text-slate-700 uppercase mb-1 block">Tên gợi nhớ (Nickname)</label>
               <Input 
                 value={newConnection.nickname} 
                 onChange={(e) => setNewConnection({...newConnection, nickname: e.target.value})}
                 placeholder="Bo, Tèo..." 
               />
             </div>
         </div>

          <div>
            <label className="text-xs font-bold text-slate-700 uppercase mb-1 block">Mối quan hệ (Role)</label>
            <Input 
              value={newConnection.role} 
              onChange={(e) => setNewConnection({...newConnection, role: e.target.value})}
              placeholder="Ví dụ: Bạn học, Đồng nghiệp..." 
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase mb-1 block">Số điện thoại</label>
              <Input 
                value={newConnection.phone} 
                onChange={(e) => setNewConnection({...newConnection, phone: e.target.value})}
                placeholder="09..." 
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase mb-1 block">Sinh nhật</label>
              <Input 
                value={newConnection.birthday} 
                onChange={(e) => setNewConnection({...newConnection, birthday: e.target.value})}
                placeholder="DD/MM" 
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase mb-1 block">Địa chỉ / Vị trí</label>
            <Input 
              value={newConnection.location} 
              onChange={(e) => setNewConnection({...newConnection, location: e.target.value})}
              placeholder="Hà Nội..." 
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase mb-1 block">Phân loại (Tier)</label>
            <select 
              value={newConnection.tier} 
              onChange={(e) => setNewConnection({...newConnection, tier: Number(e.target.value)})}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-primary-500"
            >
               <option value={1}>1 - Acquaintance (Người quen)</option>
               <option value={2}>2 - Casual (Xã giao)</option>
               <option value={3}>3 - Friend (Bạn bè)</option>
               <option value={4}>4 - Family (Gia đình)</option>
               <option value={5}>5 - Soulmate (Tri kỷ)</option>
            </select>
          </div>
          <div>
             <label className="text-xs font-bold text-slate-700 uppercase mb-1 block">Tag phụ (Phân cách bằng dấu phẩy)</label>
             <Input 
                value={newConnection.tagsString} 
                onChange={(e) => setNewConnection({...newConnection, tagsString: e.target.value})}
                placeholder="Ví dụ: Công ty A, CLB Sách..." 
             />
          </div>
          <div className="pt-4">
             <Button fullWidth onClick={handleAddNew}>Lưu Liên Hệ</Button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Chỉnh Sửa Kết Nối">
        {editingConnection && (
          <div className="space-y-4">
             <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="text-xs font-bold text-slate-700 uppercase mb-1 block">Họ và tên</label>
                   <Input 
                     value={editingConnection.name} 
                     onChange={(e) => setEditingConnection({...editingConnection, name: e.target.value})}
                   />
                </div>
                <div>
                   <label className="text-xs font-bold text-slate-700 uppercase mb-1 block">Tên gợi nhớ</label>
                   <Input 
                     value={editingConnection.nickname || ''} 
                     onChange={(e) => setEditingConnection({...editingConnection, nickname: e.target.value})}
                   />
                </div>
             </div>
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase mb-1 block">Phân loại (Tier)</label>
              <select 
                value={editingConnection.tier} 
                onChange={(e) => setEditingConnection({...editingConnection, tier: Number(e.target.value)})}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-primary-500"
              >
                 <option value={1}>1 - Acquaintance (Người quen)</option>
                 <option value={2}>2 - Casual (Xã giao)</option>
                 <option value={3}>3 - Friend (Bạn bè)</option>
                 <option value={4}>4 - Family (Gia đình)</option>
                 <option value={5}>5 - Soulmate (Tri kỷ)</option>
              </select>
            </div>
            <div>
               <label className="text-xs font-bold text-slate-700 uppercase mb-1 block">Tag phụ</label>
               <Input 
                  value={editingConnection.tagsString} 
                  onChange={(e) => setEditingConnection({...editingConnection, tagsString: e.target.value})}
               />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase mb-1 block">Mối quan hệ (Role)</label>
              <Input 
                value={editingConnection.role} 
                onChange={(e) => setEditingConnection({...editingConnection, role: e.target.value})}
              />
            </div>
             <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase mb-1 block">Số điện thoại</label>
                <Input 
                  value={editingConnection.phone} 
                  onChange={(e) => setEditingConnection({...editingConnection, phone: e.target.value})}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase mb-1 block">Sinh nhật</label>
                <Input 
                  value={editingConnection.birthday} 
                  onChange={(e) => setEditingConnection({...editingConnection, birthday: e.target.value})}
                />
              </div>
            </div>
            <div className="pt-4 flex gap-3">
               <Button variant="secondary" fullWidth onClick={() => setIsEditModalOpen(false)}>Hủy</Button>
               <Button fullWidth onClick={handleSaveEdit}>Cập nhật</Button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
};

export default Connections;