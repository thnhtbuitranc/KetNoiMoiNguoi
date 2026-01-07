import React, { useState, useMemo, useEffect } from 'react';
import { Card, Button, Badge, Input, Modal } from '../components/ui';
import { Search, Filter, Plus, Grid as GridIcon, List as ListIcon, MoreHorizontal, Phone, MapPin, Star, Calendar, RefreshCw, Check, Edit2, UserPlus, Globe, Tag, X, Activity, Zap, Sun, Loader2, Camera, StickyNote } from 'lucide-react';
import { Language, RelationshipTier, Connection } from '../types';
import { supabase, logDbOperation } from '../services/supabase';

interface ConnectionsProps {
  lang: Language;
}

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
  return str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase() : "";
};

const Connections: React.FC<ConnectionsProps> = ({ lang }) => {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
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
  
  // --- MEMORY MODAL STATE ---
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);
  const [selectedConnectionForMemory, setSelectedConnectionForMemory] = useState<Connection | null>(null);
  const [memoryForm, setMemoryForm] = useState({
      title: '',
      content: '',
      date: new Date().toISOString().split('T')[0],
      type: 'NOTE'
  });

  // Form State
  const [newConnection, setNewConnection] = useState<Partial<Connection> & { tagsString: string }>({
    name: '', nickname: '', role: '', phone: '', birthday: '', location: '', tier: RelationshipTier.ACQUAINTANCE, source: 'MANUAL', tagsString: ''
  });
  const [editingConnection, setEditingConnection] = useState<(Connection & { tagsString: string }) | null>(null);

  // --- 1. FETCH DATA ---
  const fetchConnections = async () => {
    setLoading(true);
    logDbOperation('Connections', 'Fetching data...');
    try {
       const { data, error } = await supabase.from('connections').select('*').order('created_at', { ascending: false });
       
       if (error) throw error;
       
       logDbOperation('Connections', 'Data received', data);

       const formattedData: Connection[] = data.map((item: any) => ({
          id: item.id,
          name: item.name,
          nickname: item.nickname,
          role: item.role,
          phone: item.phone,
          location: item.location,
          birthday: item.birthday,
          tier: item.tier,
          avatar: item.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&background=random`,
          lastInteraction: item.last_interaction_date,
          source: item.source || 'MANUAL',
          memoriesCount: 0, // Need join for real count
          tags: item.tags || []
       }));

       setConnections(formattedData);
    } catch (err: any) {
       logDbOperation('Connections', 'Fetch Failed', null, err);
       alert("Lỗi tải danh bạ: " + err.message);
    } finally {
       setLoading(false);
    }
  };

  useEffect(() => {
     fetchConnections();
  }, []);

  // --- 2. ADD DATA ---
  const handleAddNew = async () => {
    if (!newConnection.name) return;
    
    try {
       const { data: { user } } = await supabase.auth.getUser();
       if (!user) throw new Error("No authenticated user");

       const payload = {
          user_id: user.id,
          name: newConnection.name,
          nickname: newConnection.nickname,
          role: newConnection.role,
          phone: newConnection.phone,
          location: newConnection.location,
          birthday: newConnection.birthday,
          tier: newConnection.tier || 1,
          tags: newConnection.tagsString ? newConnection.tagsString.split(',').map(t => t.trim()).filter(t => t) : [],
          source: 'MANUAL',
          avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(newConnection.name)}&background=random`,
          last_interaction_date: new Date().toISOString().split('T')[0]
       };

       logDbOperation('Connections', 'Insert Request', payload);

       const { data, error } = await supabase.from('connections').insert(payload).select();
       
       if (error) throw error;
       
       logDbOperation('Connections', 'Insert Success', data);
       fetchConnections(); // Refresh
       setIsAddModalOpen(false);
       setNewConnection({ name: '', nickname: '', role: '', phone: '', birthday: '', location: '', tier: RelationshipTier.ACQUAINTANCE, source: 'MANUAL', tagsString: '' });

    } catch (err: any) {
       logDbOperation('Connections', 'Insert Failed', null, err);
       alert("Lỗi thêm mới: " + err.message);
    }
  };

  // --- 3. EDIT DATA ---
  const startEdit = (conn: Connection) => {
    setEditingConnection({ ...conn, tagsString: conn.tags ? conn.tags.join(', ') : '' });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingConnection) return;
    try {
       const payload = {
          name: editingConnection.name,
          nickname: editingConnection.nickname,
          role: editingConnection.role,
          phone: editingConnection.phone,
          location: editingConnection.location,
          birthday: editingConnection.birthday,
          tier: editingConnection.tier,
          tags: editingConnection.tagsString ? editingConnection.tagsString.split(',').map(t => t.trim()).filter(t => t) : []
       };

       logDbOperation('Connections', 'Update Request', { id: editingConnection.id, ...payload });

       const { error } = await supabase.from('connections').update(payload).eq('id', editingConnection.id);

       if (error) throw error;
       
       logDbOperation('Connections', 'Update Success');
       fetchConnections(); // Refresh
       setIsEditModalOpen(false);
       setEditingConnection(null);

    } catch (err: any) {
       logDbOperation('Connections', 'Update Failed', null, err);
       alert("Lỗi cập nhật: " + err.message);
    }
  };

  // --- 4. MEMORY LOGIC ---
  const openMemoryModal = (conn: Connection) => {
     setSelectedConnectionForMemory(conn);
     setMemoryForm({
        title: '',
        content: '',
        date: new Date().toISOString().split('T')[0],
        type: 'NOTE'
     });
     setIsMemoryModalOpen(true);
  };

  const handleSubmitMemory = async () => {
     if (!selectedConnectionForMemory || !memoryForm.title) return;

     try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("No authenticated user");

        // 1. Insert into 'memories' table
        logDbOperation('Memory', 'Creating Memory...', memoryForm);
        const { data: memoryData, error: memError } = await supabase
           .from('memories')
           .insert({
              user_id: user.id,
              title: memoryForm.title,
              content: memoryForm.content,
              happened_at: memoryForm.date,
              type: memoryForm.type
           })
           .select()
           .single();

        if (memError) throw memError;

        // 2. Insert into 'connection_memories' junction table
        logDbOperation('Memory', 'Linking to Connection...', { memory_id: memoryData.id, connection_id: selectedConnectionForMemory.id });
        const { error: linkError } = await supabase
           .from('connection_memories')
           .insert({
              memory_id: memoryData.id,
              connection_id: selectedConnectionForMemory.id
           });

        if (linkError) throw linkError;

        logDbOperation('Memory', 'Success');
        alert("Đã thêm kỷ niệm thành công!");
        setIsMemoryModalOpen(false);
        // Optionally update the connection's interaction date
        await supabase.from('connections').update({ last_interaction_date: memoryForm.date }).eq('id', selectedConnectionForMemory.id);
        fetchConnections();

     } catch (err: any) {
        logDbOperation('Memory', 'Failed', null, err);
        alert("Lỗi thêm kỷ niệm: " + err.message);
     }
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
        const parts = c.birthday.includes('-') ? c.birthday.split('-') : c.birthday.split('/');
        // Handle YYYY-MM-DD or DD/MM
        let bDay, bMonth;
        if (parts.length === 3) {
            bDay = parseInt(parts[2]);
            bMonth = parseInt(parts[1]);
        } else {
            bDay = parseInt(parts[0]);
            bMonth = parseInt(parts[1]);
        }

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
                         // Avatar sizes
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

      {/* Loading State */}
      {loading && (
          <div className="flex justify-center items-center py-20">
             <Loader2 size={40} className="animate-spin text-primary-600" />
          </div>
      )}

      {/* Galaxy View */}
      {!loading && viewMode === 'galaxy' && (
         <GalaxyView data={filteredConnections} onEdit={startEdit} />
      )}

      {/* Grid View */}
      {!loading && viewMode === 'grid' && (
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
                   {/* Add Memory Button in Grid */}
                   <button 
                     onClick={() => openMemoryModal(conn)}
                     className="mt-3 w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-medium rounded-lg flex items-center justify-center gap-2 transition-colors"
                  >
                     <Camera size={14} /> Thêm Kỷ Niệm
                  </button>
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
      {!loading && viewMode === 'list' && (
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
                              <div className="flex justify-end items-center gap-3">
                                 <button 
                                    onClick={() => openMemoryModal(conn)}
                                    className="text-slate-400 hover:text-green-600 font-medium text-xs transition-colors flex items-center gap-1"
                                    title="Thêm Kỷ Niệm"
                                 >
                                    <Camera size={14} /> Kỷ niệm
                                 </button>
                                 <button 
                                    onClick={() => startEdit(conn)}
                                    className="text-slate-400 hover:text-primary-600 font-medium text-xs transition-colors flex items-center gap-1"
                                 >
                                    <Edit2 size={14} /> Sửa
                                 </button>
                              </div>
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

      {/* NEW: Add Memory Modal */}
      <Modal isOpen={isMemoryModalOpen} onClose={() => setIsMemoryModalOpen(false)} title="Lưu Kỷ Niệm Mới">
        <div className="space-y-4">
           {selectedConnectionForMemory && (
              <div className="bg-slate-50 p-3 rounded-lg flex items-center gap-3 mb-2">
                 <img src={selectedConnectionForMemory.avatar} className="w-8 h-8 rounded-full" />
                 <span className="text-sm font-bold text-slate-700">Với: {selectedConnectionForMemory.name}</span>
              </div>
           )}

           <div>
              <label className="text-xs font-bold text-slate-700 uppercase mb-1 block">Tiêu đề kỷ niệm</label>
              <Input 
                 value={memoryForm.title} 
                 onChange={(e) => setMemoryForm({...memoryForm, title: e.target.value})}
                 placeholder="Ví dụ: Đi cà phê cuối tuần..." 
              />
           </div>

           <div>
              <label className="text-xs font-bold text-slate-700 uppercase mb-1 block">Nội dung chi tiết</label>
              <textarea 
                 value={memoryForm.content}
                 onChange={(e) => setMemoryForm({...memoryForm, content: e.target.value})}
                 className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-primary-500 h-24"
                 placeholder="Ghi lại những điều đáng nhớ..."
              />
           </div>

           <div className="grid grid-cols-2 gap-4">
              <div>
                 <label className="text-xs font-bold text-slate-700 uppercase mb-1 block">Ngày xảy ra</label>
                 <Input 
                    type="date"
                    value={memoryForm.date} 
                    onChange={(e) => setMemoryForm({...memoryForm, date: e.target.value})}
                 />
              </div>
              <div>
                 <label className="text-xs font-bold text-slate-700 uppercase mb-1 block">Loại</label>
                 <select 
                    value={memoryForm.type}
                    onChange={(e) => setMemoryForm({...memoryForm, type: e.target.value})}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-primary-500"
                 >
                    <option value="NOTE">Ghi chú</option>
                    <option value="PHOTO">Hình ảnh</option>
                    <option value="VIDEO">Video</option>
                    <option value="VOICE">Ghi âm</option>
                 </select>
              </div>
           </div>

           <div className="pt-4">
              <Button fullWidth onClick={handleSubmitMemory}>Lưu Kỷ Niệm</Button>
           </div>
        </div>
      </Modal>

    </div>
  );
};

export default Connections;