import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Modal } from '../components/ui';
import { Search, Calendar, Image, Video, Mic, StickyNote, Filter, Plus, Loader2, Clock, User, Quote, X, ExternalLink, Heart } from 'lucide-react';
import { Language } from '../types';
import { supabase, logDbOperation } from '../services/supabase';

interface MemoriesProps {
  lang: Language;
}

const Memories: React.FC<MemoriesProps> = ({ lang }) => {
  const [memories, setMemories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'ALL' | 'PHOTO' | 'NOTE'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Detail View State
  const [selectedMemory, setSelectedMemory] = useState<any>(null);
  const [detailImages, setDetailImages] = useState<string[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);

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
              avatar_url,
              nickname
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

  const handleMemoryClick = async (memory: any) => {
    setSelectedMemory(memory);
    setDetailImages([]); // Reset images
    setLoadingImages(false);

    // If memory has images (media_url), fetch signed URLs
    if (memory.type === 'PHOTO' && memory.media_url) {
        setLoadingImages(true);
        try {
            const paths = JSON.parse(memory.media_url);
            if (Array.isArray(paths) && paths.length > 0) {
                const { data, error } = await supabase.storage
                    .from('vault_files')
                    .createSignedUrls(paths, 3600); // 1 hour

                if (error) throw error;
                if (data) {
                    setDetailImages(data.map(d => d.signedUrl).filter(url => !!url));
                }
            }
        } catch (e) {
            console.error("Error loading memory images", e);
        } finally {
            setLoadingImages(false);
        }
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'PHOTO': return <Image size={16} className="text-blue-500" />;
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
            {['ALL', 'NOTE', 'PHOTO'].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type as any)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  filterType === type 
                    ? 'bg-slate-900 text-white shadow-lg' 
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {type === 'ALL' ? 'Tất cả' : type === 'NOTE' ? 'Ghi chú' : 'Hình ảnh'}
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
              <Card 
                key={memory.id} 
                className="p-5 flex flex-col h-full hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group"
              >
                 <div onClick={() => handleMemoryClick(memory)} className="h-full flex flex-col">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 group-hover:bg-white group-hover:border-primary-100 transition-colors">
                          {getIcon(memory.type)}
                        </div>
                        <div>
                           <span className="text-xs text-slate-400 block font-medium">{memory.happened_at}</span>
                           <span className="text-[10px] font-bold text-slate-300 uppercase">{memory.type}</span>
                        </div>
                      </div>
                      {memory.sentiment_label && (
                         <div className="text-lg" title={memory.sentiment_label}>{memory.sentiment_label === 'Happy' ? '😊' : '✨'}</div>
                      )}
                    </div>
                    
                    <h3 className="font-bold text-slate-900 text-lg mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">{memory.title}</h3>
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
                 </div>
              </Card>
             );
          })}
          
          {filteredMemories.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <StickyNote size={48} className="mx-auto mb-3 opacity-20" />
              <p>Chưa có kỷ niệm nào phù hợp.</p>
            </div>
          )}
        </div>
      )}

      {/* Redesigned Detail Modal - WIDER */}
      <Modal isOpen={!!selectedMemory} onClose={() => setSelectedMemory(null)} title="" maxWidth="max-w-4xl">
         {selectedMemory && (
            <div className="relative pb-4">
                {/* 1. Gallery Section (Top) */}
                {selectedMemory.type === 'PHOTO' && (
                    <div className="mb-6 -mx-6 -mt-4 bg-slate-100">
                        {loadingImages ? (
                            <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-slate-400" /></div>
                        ) : detailImages.length > 0 ? (
                            <div className={`grid gap-1 ${detailImages.length === 1 ? 'grid-cols-1' : detailImages.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                                {detailImages.map((url, idx) => (
                                    <div key={idx} className={`relative group overflow-hidden ${detailImages.length === 1 ? 'aspect-video' : 'aspect-square'}`}>
                                        <img 
                                            src={url} 
                                            alt={`Memory ${idx}`} 
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                        />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
                                        <a 
                                            href={url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="absolute bottom-2 right-2 p-2 bg-white/90 rounded-full text-slate-800 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                            title="Mở ảnh gốc"
                                        >
                                            <ExternalLink size={14} />
                                        </a>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-40 text-slate-400 bg-slate-50 border-b border-slate-200">
                                <Image size={32} className="opacity-20 mb-2" />
                                <span className="text-xs">Không tải được ảnh</span>
                            </div>
                        )}
                    </div>
                )}

                {/* 2. Metadata & Title */}
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <div className="flex items-center gap-3 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                            <span className="flex items-center gap-1">
                                <Clock size={12} /> {selectedMemory.happened_at}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                            <span className="flex items-center gap-1 text-primary-600">
                                {selectedMemory.type === 'PHOTO' ? <Image size={12}/> : <StickyNote size={12}/>}
                                {selectedMemory.type}
                            </span>
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900 leading-tight">
                            {selectedMemory.title}
                        </h2>
                    </div>
                    {/* Sentiment Badge (if any) */}
                    {selectedMemory.sentiment_label && (
                        <div className="flex flex-col items-center justify-center w-12 h-12 bg-yellow-50 rounded-full border border-yellow-100 shadow-sm shrink-0 ml-4">
                            <span className="text-lg">{selectedMemory.sentiment_label === 'Happy' ? '😊' : '✨'}</span>
                        </div>
                    )}
                </div>

                {/* 3. Linked Person (Inline) */}
                {selectedMemory.connection_memories?.[0]?.connections && (
                    <div className="flex items-center gap-2 mb-8">
                        <div className="relative">
                            <img 
                                src={selectedMemory.connection_memories[0].connections.avatar_url} 
                                className ="w-8 h-8 rounded-full border border-slate-200" 
                            />
                            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                                <Heart size={10} className="text-red-500 fill-red-500" />
                            </div>
                        </div>
                        <span className="text-sm text-slate-600">
                            Cùng với <span className="font-bold text-slate-900">{selectedMemory.connection_memories[0].connections.name}</span>
                        </span>
                    </div>
                )}

                {/* 4. Content Body */}
                <div className="prose prose-lg prose-slate max-w-none">
                    <p className="text-slate-700 leading-8 whitespace-pre-wrap text-base">
                        {selectedMemory.content || <span className="italic text-slate-400">Chưa có nội dung mô tả chi tiết...</span>}
                    </p>
                </div>

                {/* Removed Footer Close Button */}
            </div>
         )}
      </Modal>
    </div>
  );
};

export default Memories;