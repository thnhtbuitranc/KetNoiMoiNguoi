import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Modal } from '../components/ui';
import { Search, Calendar, Image, Video, Mic, StickyNote, Filter, Plus, Loader2 } from 'lucide-react';
import { Language } from '../types';
import { supabase, logDbOperation } from '../services/supabase';

interface MemoriesProps {
  lang: Language;
}

const Memories: React.FC<MemoriesProps> = ({ lang }) => {
  const [memories, setMemories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'ALL' | 'PHOTO' | 'VIDEO' | 'NOTE' | 'VOICE'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchMemories = async () => {
    setLoading(true);
    logDbOperation('Memories', 'Fetching all memories...');
    try {
      // Fetch memories and join with connections via connection_memories
      const { data, error } = await supabase
        .from('memories')
        .select(`
          *,
          connection_memories (
            connections (
              id,
              name,
              avatar_url
            )
          )
        `)
        .order('happened_at', { ascending: false });

      if (error) throw error;
      logDbOperation('Memories', 'Data received', data);
      setMemories(data || []);
    } catch (err: any) {
      console.error(err);
      logDbOperation('Memories', 'Error', null, err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemories();
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'PHOTO': return <Image size={16} className="text-blue-500" />;
      case 'VIDEO': return <Video size={16} className="text-red-500" />;
      case 'VOICE': return <Mic size={16} className="text-purple-500" />;
      default: return <StickyNote size={16} className="text-yellow-500" />;
    }
  };

  const filteredMemories = memories.filter(m => {
    if (filterType !== 'ALL' && m.type !== filterType) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const titleMatch = m.title?.toLowerCase().includes(term);
      const contentMatch = m.content?.toLowerCase().includes(term);
      const connName = m.connection_memories?.[0]?.connections?.name?.toLowerCase();
      const connMatch = connName?.includes(term);
      return titleMatch || contentMatch || connMatch;
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kỷ Niệm</h1>
          <p className="text-slate-500 text-sm mt-1">Lưu giữ những khoảnh khắc đáng nhớ với mọi người.</p>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-96">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
             <Input 
                placeholder="Tìm kiếm kỷ niệm..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
             />
          </div>
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            {['ALL', 'NOTE', 'PHOTO', 'VIDEO', 'VOICE'].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type as any)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  filterType === type 
                    ? 'bg-slate-900 text-white shadow-lg' 
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {type === 'ALL' ? 'Tất cả' : type}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary-600" size={40} /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMemories.map((memory) => {
             const linkedConn = memory.connection_memories?.[0]?.connections;
             return (
              <Card key={memory.id} className="p-5 flex flex-col h-full hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                      {getIcon(memory.type)}
                    </div>
                    <div>
                       <span className="text-xs text-slate-400 block font-medium">{memory.happened_at}</span>
                       <span className="text-[10px] font-bold text-slate-300 uppercase">{memory.type}</span>
                    </div>
                  </div>
                  {/* Sentiment or Feeling Emoji if available */}
                  {memory.sentiment_label && (
                     <div className="text-lg" title={memory.sentiment_label}>{memory.sentiment_label === 'Happy' ? '😊' : '✨'}</div>
                  )}
                </div>
                
                <h3 className="font-bold text-slate-900 text-lg mb-2 line-clamp-2">{memory.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-4 line-clamp-3 flex-1">
                  {memory.content || "Không có nội dung chi tiết."}
                </p>

                {/* Linked Connection Footer */}
                {linkedConn && (
                   <div className="mt-auto pt-4 border-t border-slate-100 flex items-center gap-2">
                      <img src={linkedConn.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(linkedConn.name)}`} className="w-6 h-6 rounded-full object-cover" />
                      <span className="text-xs font-medium text-slate-600">Với <span className="font-bold text-slate-800">{linkedConn.name}</span></span>
                   </div>
                )}
              </Card>
             );
          })}
          
          {filteredMemories.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <StickyNote size={48} className="mx-auto mb-3 opacity-20" />
              <p>Chưa có kỷ niệm nào.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Memories;