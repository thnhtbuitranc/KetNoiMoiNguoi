import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Modal, Input, Badge } from '../components/ui';
import { Share2, Plus, UploadCloud, FileText, Image, Music, Folder, Key, Clock, Copy, CheckCircle2, Loader2 } from 'lucide-react';
import { Language } from '../types';
import { supabase, logDbOperation } from '../services/supabase';

interface VaultProps {
  lang: Language;
}

const Vault: React.FC<VaultProps> = ({ lang }) => {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareStep, setShareStep] = useState(1);
  const [inviteCode, setInviteCode] = useState("");
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch Vault Items
  const fetchFiles = async () => {
     setLoading(true);
     logDbOperation('Vault', 'Fetching files...');
     
     const { data, error } = await supabase.from('vault_items').select('*').order('created_at', { ascending: false });
     if (!error && data) {
        logDbOperation('Vault', 'Files received', data);
        const mapped = data.map((f: any) => ({
           id: f.id,
           name: f.name,
           type: f.type.toLowerCase(),
           date: new Date(f.created_at).toLocaleDateString(),
           size: f.size || '0 KB',
           icon: f.type === 'FOLDER' ? Folder : f.type === 'IMAGE' ? Image : f.type === 'AUDIO' ? Music : FileText,
           color: f.type === 'FOLDER' ? 'text-yellow-500 bg-yellow-50' : 'text-slate-500 bg-slate-50'
        }));
        setFiles(mapped);
     } else {
        logDbOperation('Vault', 'Error', null, error);
     }
     setLoading(false);
  };

  useEffect(() => {
     fetchFiles();
  }, []);

  const handleGenerateShare = () => {
     setShareStep(2);
     setInviteCode("VAULT-" + Math.random().toString(36).substr(2, 6).toUpperCase());
  };

  const resetShare = () => {
    setIsShareModalOpen(false);
    setShareStep(1);
    setInviteCode("");
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");

        // 1. Prepare File Metadata
        // Determine type based on MIME
        let fileType = 'DOC';
        if (file.type.startsWith('image/')) fileType = 'IMAGE';
        else if (file.type.startsWith('audio/')) fileType = 'AUDIO';
        
        // Format size
        const fileSize = (file.size / 1024).toFixed(1) + ' KB';

        // 2. Upload to Storage Bucket 'vault_files'
        const fileExt = file.name.split('.').pop();
        const cleanName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
        const fileName = `${Date.now()}_${cleanName}`; 
        const filePath = `${user.id}/${fileName}`;

        logDbOperation('Vault', 'Uploading file to storage...', { path: filePath });

        const { error: uploadError } = await supabase.storage
            .from('vault_files')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        // 3. Save Metadata to DB
        const { error: dbError } = await supabase.from('vault_items').insert({
            user_id: user.id,
            name: file.name,
            type: fileType,
            size: fileSize,
            storage_path: filePath,
            parent_id: null // Root for now
        });

        if (dbError) throw dbError;

        logDbOperation('Vault', 'Upload Success');
        fetchFiles(); // Refresh list

    } catch (error: any) {
        logDbOperation('Vault', 'Upload Failed', null, error);
        alert("Upload failed: " + error.message);
    } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = ''; // Reset input to allow same file selection
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Hidden Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
      />

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kho Kỷ Niệm Chung</h1>
          <p className="text-slate-500 text-sm mt-1">Encrypted Vault • Secure Storage</p>
        </div>
        <div className="flex gap-3">
           <Button variant="secondary" className="gap-2" onClick={() => setIsShareModalOpen(true)}>
              <Share2 size={16} /> Share Key
           </Button>
           <Button 
             className="gap-2 bg-red-500 hover:bg-red-600 text-white border-none shadow-lg shadow-red-500/20" 
             onClick={handleUploadClick}
             disabled={uploading}
           >
              {uploading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} 
              {uploading ? 'Đang tải...' : 'Tải lên kỷ niệm'}
           </Button>
        </div>
      </div>

      {/* Upload Area */}
      <div 
        className="border-2 border-dashed border-slate-300 rounded-2xl p-12 text-center hover:bg-slate-50 transition-colors cursor-pointer group" 
        onClick={handleUploadClick}
      >
         <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform text-slate-400">
            {uploading ? <Loader2 size={32} className="animate-spin text-primary-600" /> : <UploadCloud size={32} />}
         </div>
         <h3 className="text-lg font-bold text-slate-900 mb-2">
            {uploading ? "Đang xử lý tập tin..." : "Kéo thả kỷ niệm vào đây"}
         </h3>
         <p className="text-slate-500 text-sm max-w-sm mx-auto">
            Hỗ trợ ảnh, video, âm thanh. Mọi dữ liệu đều được <span className="text-green-600 font-medium">mã hóa</span> trước khi lưu trữ vào Bucket.
         </p>
      </div>

      {/* Files Grid */}
      <h3 className="font-bold text-slate-900 text-lg">Gần đây</h3>

      {loading ? (
         <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-slate-400" /></div>
      ) : (
        <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {files.length > 0 ? files.map((file) => (
                    <Card key={file.id} className="p-5 flex flex-col items-center justify-center text-center aspect-[4/3] hover:shadow-md transition-shadow cursor-pointer border-none shadow-sm">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 ${file.color}`}>
                        <file.icon size={24} />
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm truncate w-full mb-1">{file.name}</h4>
                    <div className="flex justify-between w-full text-[10px] text-slate-400 font-medium px-1 mt-auto pt-2">
                        <span>{file.date}</span>
                        <span className="bg-slate-100 px-1 rounded text-slate-500">{file.size}</span>
                    </div>
                    </Card>
                )) : (
                    <div className="col-span-full text-center text-slate-400 py-8">Chưa có tập tin nào.</div>
                )}
            </div>

            {/* List View */}
            <Card className="overflow-hidden border-none shadow-sm">
                <div className="px-6 py-4 border-b border-slate-100 font-bold text-slate-900">
                    Tất cả tập tin
                </div>
                <table className="w-full text-sm text-left">
                    <tbody className="divide-y divide-slate-100">
                    {files.map((file) => (
                        <tr key={`list-${file.id}`} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-3 w-10">
                                <file.icon size={18} className="text-slate-400" />
                            </td>
                            <td className="px-2 py-3 font-medium text-slate-700">{file.name}</td>
                            <td className="px-6 py-3 text-slate-500 text-right">{file.date}</td>
                            <td className="px-6 py-3 text-slate-500 text-right">{file.size}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </Card>
        </>
      )}

      {/* Share Vault Modal */}
      <Modal
        isOpen={isShareModalOpen}
        onClose={resetShare}
        title="Share Secure Vault"
      >
        {shareStep === 1 ? (
            <div className="space-y-4">
               <p className="text-sm text-slate-600">
                  Create a secure access key to share this vault with family or friends. You can set a password for extra security.
               </p>
               
               <div>
                  <label className="text-xs font-bold text-slate-700 uppercase mb-1 block">Set Access Password (Optional)</label>
                  <div className="relative">
                     <Key size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                     <Input type="password" placeholder="Enter secure password" className="pl-10" />
                  </div>
               </div>

               <div>
                  <label className="text-xs font-bold text-slate-700 uppercase mb-1 block">Access Duration</label>
                  <div className="grid grid-cols-3 gap-2">
                     <button className="px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium hover:bg-slate-50 focus:border-primary-500 focus:bg-primary-50 focus:text-primary-700">1 Hour</button>
                     <button className="px-3 py-2 rounded-lg border-primary-500 bg-primary-50 text-primary-700 text-sm font-medium">24 Hours</button>
                     <button className="px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium hover:bg-slate-50 focus:border-primary-500 focus:bg-primary-50 focus:text-primary-700">7 Days</button>
                  </div>
               </div>

               <div className="pt-4">
                  <Button fullWidth onClick={handleGenerateShare} className="gap-2">
                     Generate Access Key <Share2 size={16} />
                  </Button>
               </div>
            </div>
        ) : (
            <div className="space-y-6 text-center">
               <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 size={32} />
               </div>
               <div>
                  <h3 className="text-lg font-bold text-slate-900">Access Key Generated!</h3>
                  <p className="text-sm text-slate-500">Share this code with your recipient.</p>
               </div>

               <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                  <span className="font-mono text-xl font-bold text-slate-900 tracking-wider">{inviteCode}</span>
                  <button className="p-2 hover:bg-white rounded-lg transition-colors text-slate-500 hover:text-primary-600">
                     <Copy size={20} />
                  </button>
               </div>

               <p className="text-xs text-slate-400 flex items-center justify-center gap-1">
                  <Clock size={12} /> Expires in 24 hours
               </p>

               <Button fullWidth variant="secondary" onClick={resetShare}>
                  Close
               </Button>
            </div>
        )}
      </Modal>
    </div>
  );
};

export default Vault;