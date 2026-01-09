import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Modal, Input, Badge } from '../components/ui';
import { Share2, Plus, UploadCloud, FileText, Image, Music, Folder, Key, Clock, Copy, CheckCircle2, Loader2, X, Edit2 } from 'lucide-react';
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
  
  // Image Preview State
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Rename State
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [fileToRename, setFileToRename] = useState<any>(null);
  const [newName, setNewName] = useState("");

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
           storage_path: f.storage_path, // Keep path for signing URLs
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
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    setUploading(true);
    
    const MAX_SIZE_MB = 3;
    const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    
    let successCount = 0;
    let errors: string[] = [];

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");

        // Convert FileList to Array for iteration
        const files: File[] = Array.from(fileList);

        for (const file of files) {
            // 1. Validate Type
            if (!allowedTypes.includes(file.type)) {
                errors.push(`${file.name}: Sai định dạng (chỉ PNG, JPG, JPEG).`);
                continue;
            }

            // 2. Validate Size
            if (file.size > MAX_SIZE_BYTES) {
                errors.push(`${file.name}: Quá lớn (>3MB).`);
                continue;
            }

            try {
                // 3. Prepare File Metadata
                const fileType = 'IMAGE'; 
                const fileSize = (file.size / 1024).toFixed(1) + ' KB';
                const cleanName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
                // Use timestamp + random to avoid collision in loop
                const fileName = `${Date.now()}_${Math.floor(Math.random() * 1000)}_${cleanName}`; 
                const filePath = `${user.id}/${fileName}`;

                logDbOperation('Vault', `Uploading ${file.name}...`);

                // 4. Upload to Storage Bucket 'vault_files'
                const { error: uploadError } = await supabase.storage
                    .from('vault_files')
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                // 5. Save Metadata to DB
                const { error: dbError } = await supabase.from('vault_items').insert({
                    user_id: user.id,
                    name: file.name,
                    type: fileType,
                    size: fileSize,
                    storage_path: filePath,
                    parent_id: null 
                });

                if (dbError) throw dbError;
                successCount++;

            } catch (err: any) {
                console.error(err);
                errors.push(`${file.name}: Lỗi tải lên (${err.message})`);
            }
        }

        logDbOperation('Vault', `Batch Upload Finished. Success: ${successCount}, Errors: ${errors.length}`);
        
        if (successCount > 0) {
            fetchFiles(); // Refresh list
        }

        if (errors.length > 0) {
            alert(`Kết quả tải lên:\n- Thành công: ${successCount}\n- Lỗi:\n${errors.join('\n')}`);
        } else if (successCount > 0) {
            // All success, maybe show a toast? For now silent refresh is fine or simple alert if user uploaded many
            if (successCount > 1) alert(`Đã tải lên thành công ${successCount} ảnh!`);
        }

    } catch (error: any) {
        logDbOperation('Vault', 'Global Upload Error', null, error);
        alert("Lỗi hệ thống: " + error.message);
    } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = ''; // Reset input
    }
  };

  // Rename Logic
  const openRenameModal = (e: React.MouseEvent, file: any) => {
    e.stopPropagation();
    setFileToRename(file);
    setNewName(file.name);
    setIsRenameModalOpen(true);
  };

  const performRename = async () => {
    if (!fileToRename || !newName.trim()) return;
    
    try {
       logDbOperation('Vault', 'Renaming file...', { id: fileToRename.id, newName });
       const { error } = await supabase
          .from('vault_items')
          .update({ name: newName.trim() })
          .eq('id', fileToRename.id);

       if (error) throw error;

       // Optimistic update or refresh
       setFiles(prev => prev.map(f => f.id === fileToRename.id ? { ...f, name: newName.trim() } : f));
       setIsRenameModalOpen(false);
       setFileToRename(null);
       setNewName("");
    } catch (error: any) {
       logDbOperation('Vault', 'Rename Failed', null, error);
       alert("Lỗi đổi tên: " + error.message);
    }
  };

  // View Image Logic
  const handleViewFile = async (file: any) => {
     if (file.type !== 'image') return;
     
     setLoadingPreview(true);
     setIsPreviewOpen(true);
     setPreviewUrl(null);

     try {
        // Create Signed URL because bucket is private
        const { data, error } = await supabase.storage
           .from('vault_files')
           .createSignedUrl(file.storage_path, 3600); // Valid for 1 hour

        if (error) throw error;
        setPreviewUrl(data.signedUrl);
     } catch (err: any) {
        console.error("Error signing URL:", err);
        alert("Không thể mở ảnh này.");
        setIsPreviewOpen(false);
     } finally {
        setLoadingPreview(false);
     }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Hidden Input - Restricted to Images, Multiple allowed */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept="image/png, image/jpeg, image/jpg"
        multiple
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
              {uploading ? 'Đang tải...' : 'Tải lên ảnh'}
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
            {uploading ? "Đang xử lý hình ảnh..." : "Kéo thả ảnh vào đây"}
         </h3>
         <p className="text-slate-500 text-sm max-w-sm mx-auto">
            Chỉ hỗ trợ định dạng <span className="text-slate-900 font-bold">PNG, JPG, JPEG</span> (Tối đa 3MB/ảnh).
         </p>
      </div>

      {/* Files Grid */}
      <h3 className="font-bold text-slate-900 text-lg">Gần đây</h3>

      {loading ? (
         <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-slate-400" /></div>
      ) : (
        <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {files.length > 0 ? files.slice(0, 5).map((file) => (
                    <div
                        key={file.id} 
                        className={`bg-white rounded-2xl border border-slate-200/60 shadow-card p-5 flex flex-col items-center justify-center text-center aspect-[4/3] relative group transition-all duration-300 ${file.type === 'image' ? 'cursor-pointer hover:shadow-lg hover:-translate-y-1 hover:bg-slate-50' : 'cursor-default'}`}
                        onClick={() => handleViewFile(file)}
                    >
                        {/* Edit/Rename Button */}
                        <button 
                           onClick={(e) => openRenameModal(e, file)}
                           className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-primary-600 hover:bg-slate-100 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                           title="Đổi tên"
                        >
                           <Edit2 size={14} />
                        </button>

                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 ${file.color}`}>
                            <file.icon size={24} />
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm truncate w-full mb-1 px-2">{file.name}</h4>
                        <div className="flex justify-between w-full text-[10px] text-slate-400 font-medium px-1 mt-auto pt-2">
                            <span>{file.date}</span>
                            <span className="bg-slate-100 px-1 rounded text-slate-500">{file.size}</span>
                        </div>
                    </div>
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
                        <tr 
                            key={`list-${file.id}`} 
                            className={`hover:bg-slate-50 transition-colors group ${file.type === 'image' ? 'cursor-pointer' : ''}`}
                            onClick={() => handleViewFile(file)}
                        >
                            <td className="px-6 py-3 w-10">
                                <file.icon size={18} className="text-slate-400" />
                            </td>
                            <td className="px-2 py-3 font-medium text-slate-700">{file.name}</td>
                            <td className="px-6 py-3 text-slate-500 text-right">{file.date}</td>
                            <td className="px-6 py-3 text-slate-500 text-right">{file.size}</td>
                            <td className="px-6 py-3 text-right w-12 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={(e) => openRenameModal(e, file)}
                                    className="p-2 text-slate-400 hover:text-primary-600 hover:bg-slate-100 rounded-lg"
                                    title="Đổi tên"
                                >
                                    <Edit2 size={16} />
                                </button>
                            </td>
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

      {/* Rename Modal */}
      <Modal 
        isOpen={isRenameModalOpen} 
        onClose={() => setIsRenameModalOpen(false)} 
        title="Đổi tên tập tin"
      >
         <div className="space-y-4">
            <div>
               <label className="text-xs font-bold text-slate-700 uppercase mb-1 block">Tên mới</label>
               <Input 
                  value={newName} 
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Nhập tên mới..."
                  autoFocus
               />
               <p className="text-xs text-slate-400 mt-1">Lưu ý: Đổi tên không ảnh hưởng đến nội dung tập tin.</p>
            </div>
            <div className="flex gap-3 pt-2">
               <Button variant="secondary" fullWidth onClick={() => setIsRenameModalOpen(false)}>Hủy</Button>
               <Button fullWidth onClick={performRename}>Lưu</Button>
            </div>
         </div>
      </Modal>

      {/* Image Preview Modal */}
      {isPreviewOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsPreviewOpen(false)}>
              <button className="absolute top-4 right-4 text-white/70 hover:text-white" onClick={() => setIsPreviewOpen(false)}>
                  <X size={32} />
              </button>
              
              <div className="relative max-w-4xl w-full max-h-[90vh] flex items-center justify-center" onClick={e => e.stopPropagation()}>
                  {loadingPreview ? (
                      <Loader2 size={48} className="animate-spin text-white" />
                  ) : previewUrl ? (
                      <img 
                          src={previewUrl} 
                          alt="Preview" 
                          className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                      />
                  ) : (
                      <div className="text-white">Không thể tải ảnh.</div>
                  )}
              </div>
          </div>
      )}

    </div>
  );
};

export default Vault;