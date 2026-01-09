import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Modal, Input, Badge } from '../components/ui';
import { Share2, Plus, UploadCloud, FileText, Image, Music, Folder, Key, Clock, Copy, CheckCircle2, Loader2, X, Edit2, FolderPlus, ArrowLeft, Move } from 'lucide-react';
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
  
  // Folder Navigation State
  const [currentFolder, setCurrentFolder] = useState<any>(null); // null means Root
  const [isCreateFolderOpen, setCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  // Image Preview State
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({}); // Store thumbnails
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
           parent_id: f.parent_id,
           date: new Date(f.created_at).toLocaleDateString(),
           size: f.size || (f.type === 'FOLDER' ? '-' : '0 KB'),
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

  // --- LOGIC: SEPARATE FOLDERS AND PHOTOS ---
  
  // 1. Folders: Always respect hierarchy (show only folders in current directory)
  const viewFolders = files.filter(f => f.type === 'folder' && f.parent_id === (currentFolder ? currentFolder.id : null));

  // 2. Photos: 
  //    - If Root (currentFolder is null): Show ALL photos (flattened view)
  //    - If Inside Folder: Show photos SPECIFIC to that folder
  const viewPhotos = currentFolder 
      ? files.filter(f => f.type === 'image' && f.parent_id === currentFolder.id)
      : files.filter(f => f.type === 'image');

  // Load thumbnails for VIEWABLE photos
  useEffect(() => {
    const loadImages = async () => {
        // Filter out images in current view that we haven't loaded yet
        const imagesToLoad = viewPhotos.filter(f => !imageUrls[f.id]);
        
        if (imagesToLoad.length === 0) return;

        const paths = imagesToLoad.map(f => f.storage_path);
        
        // Batch create signed URLs
        const { data, error } = await supabase.storage
            .from('vault_files')
            .createSignedUrls(paths, 3600); // 1 hour validity

        if (error) {
            console.error("Error loading thumbnails:", error);
            return;
        }

        if (data) {
            const newUrls: Record<string, string> = {};
            data.forEach(item => {
                if (item.signedUrl) {
                    // Match path back to file ID
                    const file = imagesToLoad.find(f => f.storage_path === item.path);
                    if (file) {
                        newUrls[file.id] = item.signedUrl;
                    }
                }
            });
            setImageUrls(prev => ({ ...prev, ...newUrls }));
        }
    };

    loadImages();
  }, [files, currentFolder, viewPhotos.length]); // Re-run when files change or folder changes

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

  const handleCreateFolder = async () => {
      if (!newFolderName.trim()) return;

      try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error("User not authenticated");

          const { error } = await supabase.from('vault_items').insert({
              user_id: user.id,
              name: newFolderName.trim(),
              type: 'FOLDER',
              size: null,
              parent_id: currentFolder ? currentFolder.id : null
          });

          if (error) throw error;
          
          setNewFolderName("");
          setCreateFolderOpen(false);
          fetchFiles();

      } catch (err: any) {
          alert("Lỗi tạo thư mục: " + err.message);
      }
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
                    parent_id: currentFolder ? currentFolder.id : null // Upload to current folder
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
            // All success, silent refresh or toast
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

       // Optimistic update
       setFiles(prev => prev.map(f => f.id === fileToRename.id ? { ...f, name: newName.trim() } : f));
       setIsRenameModalOpen(false);
       setFileToRename(null);
       setNewName("");
    } catch (error: any) {
       logDbOperation('Vault', 'Rename Failed', null, error);
       alert("Lỗi đổi tên: " + error.message);
    }
  };

  // View Image / Enter Folder Logic
  const handleItemClick = async (file: any) => {
     if (file.type === 'folder') {
         setCurrentFolder(file);
         return;
     }

     if (file.type !== 'image') return;
     
     setLoadingPreview(true);
     setIsPreviewOpen(true);
     setPreviewUrl(null);

     try {
        // If we already have a signed URL in state, use it first to save a call, 
        // but typically we might want to refresh. For now, try to fetch fresh or use existing.
        if (imageUrls[file.id]) {
            setPreviewUrl(imageUrls[file.id]);
        } else {
             // Create Signed URL because bucket is private
            const { data, error } = await supabase.storage
                .from('vault_files')
                .createSignedUrl(file.storage_path, 3600); // Valid for 1 hour

            if (error) throw error;
            setPreviewUrl(data.signedUrl);
        }
     } catch (err: any) {
        console.error("Error signing URL:", err);
        alert("Không thể mở ảnh này.");
        setIsPreviewOpen(false);
     } finally {
        setLoadingPreview(false);
     }
  };

  // --- DRAG AND DROP LOGIC ---
  const handleDragStart = (e: React.DragEvent, file: any) => {
      e.dataTransfer.setData("fileId", file.id);
      e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault(); // Necessary to allow dropping
      e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, targetFolder: any) => {
      e.preventDefault();
      e.stopPropagation(); // Stop bubbling
      
      const fileId = e.dataTransfer.getData("fileId");
      if (!fileId) return;
      
      // Prevent dropping a folder into itself (basic check) or dropping if same ID
      if (fileId === targetFolder.id) return;

      try {
          logDbOperation('Vault', `Moving file ${fileId} to folder ${targetFolder.name}`);
          
          const { error } = await supabase
              .from('vault_items')
              .update({ parent_id: targetFolder.id })
              .eq('id', fileId);

          if (error) throw error;

          // Optimistic UI Update
          setFiles(prev => prev.map(f => f.id === fileId ? { ...f, parent_id: targetFolder.id } : f));

      } catch (err: any) {
          console.error("Move failed:", err);
          alert("Không thể di chuyển tập tin.");
      }
  };
  
  // Recent files (Global, ignoring folder structure)
  const recentFiles = files.filter(f => f.type === 'image').slice(0, 5);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kho Kỷ Niệm Chung</h1>
          <p className="text-slate-500 text-sm mt-1">Lưu trữ an toàn & bảo mật</p>
        </div>
        <div className="flex gap-2">
           <Button variant="secondary" className="gap-2" onClick={() => setCreateFolderOpen(true)}>
              <FolderPlus size={16} /> Tạo thư mục
           </Button>
           <Button 
             className="gap-2 bg-slate-900 hover:bg-slate-800 text-white" 
             onClick={handleUploadClick}
             disabled={uploading}
           >
              {uploading ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />} 
              {uploading ? 'Đang tải...' : 'Tải lên'}
           </Button>
        </div>
      </div>

      {/* Navigation Title / Breadcrumb */}
      <div className="flex items-center gap-2 mb-2">
          {currentFolder ? (
              <button 
                onClick={() => setCurrentFolder(null)} 
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
              >
                  <ArrowLeft size={20} />
              </button>
          ) : null}
          <h3 className="font-bold text-slate-900 text-lg">
              {currentFolder ? currentFolder.name : "Tổng quan"}
          </h3>
      </div>

      {/* SECTION 1: FOLDERS (Only if we have folders in this view) */}
      {(viewFolders.length > 0 || isCreateFolderOpen) && (
        <div className="space-y-3">
             <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Thư mục của bạn</h4>
             <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {viewFolders.map(file => (
                    <div
                        key={file.id}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, file)}
                        className="group flex flex-col items-center p-4 rounded-xl bg-white border border-slate-200 hover:border-primary-400 hover:bg-primary-50/20 cursor-pointer transition-all shadow-sm"
                        onClick={() => handleItemClick(file)}
                    >
                        {/* Edit Button */}
                        <button 
                            onClick={(e) => openRenameModal(e, file)}
                            className="absolute top-2 right-2 p-1.5 text-slate-300 hover:text-primary-600 hover:bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        >
                            <Edit2 size={12} />
                        </button>

                        <div className={`w-12 h-12 mb-2 rounded-2xl flex items-center justify-center ${file.color}`}>
                            <file.icon size={24} />
                        </div>
                        <p className="text-sm font-medium text-slate-700 text-center truncate w-full px-2 select-none">
                            {file.name}
                        </p>
                    </div>
                ))}
             </div>
        </div>
      )}

      {/* SECTION 2: PHOTOS (Flattened at Root, or filtered in Folder) */}
      <div className="space-y-3">
          <div className="flex justify-between items-end">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ảnh của bạn</h4>
              <span className="text-xs text-slate-400">{viewPhotos.length} ảnh</span>
          </div>

          <div className="min-h-[200px] rounded-2xl p-0"> {/* Removed dashed border */}
               {loading ? (
                   <div className="flex justify-center py-12"><Loader2 className="animate-spin text-slate-400" /></div>
               ) : viewPhotos.length > 0 ? (
                   <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                       {viewPhotos.map(file => (
                           <div
                               key={file.id}
                               draggable // Enable dragging
                               onDragStart={(e) => handleDragStart(e, file)}
                               className="relative group flex flex-col items-center p-2 rounded-xl bg-white border border-slate-200 shadow-sm transition-all aspect-[4/5] hover:shadow-md hover:-translate-y-1 cursor-pointer"
                               onClick={() => handleItemClick(file)}
                           >
                               {/* Edit Button */}
                               <button 
                                   onClick={(e) => openRenameModal(e, file)}
                                   className="absolute top-2 right-2 p-1.5 text-white/80 bg-black/20 hover:bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                               >
                                   <Edit2 size={12} />
                               </button>

                               {/* Thumbnail or Icon Area */}
                               <div className="w-full flex-1 mb-2 rounded-lg flex items-center justify-center overflow-hidden bg-slate-50 relative">
                                   {imageUrls[file.id] ? (
                                       <img 
                                          src={imageUrls[file.id]} 
                                          alt={file.name} 
                                          loading="lazy"
                                          className="w-full h-full object-cover absolute inset-0 transition-transform duration-500 group-hover:scale-105 animate-in fade-in duration-300" 
                                       />
                                   ) : (
                                        <div className="flex flex-col items-center justify-center">
                                            <Loader2 size={24} className="text-slate-300 animate-spin mb-2" />
                                            <span className="text-[10px] text-slate-400">Loading...</span>
                                        </div>
                                   )}
                               </div>

                               <div className="w-full px-1 text-center">
                                    <p className="text-xs font-bold text-slate-700 truncate select-none" title={file.name}>
                                        {file.name}
                                    </p>
                                    <span className="text-[10px] text-slate-400">
                                        {file.size}
                                    </span>
                               </div>
                           </div>
                       ))}
                   </div>
               ) : (
                   <div className="text-center py-12 text-slate-400">
                       <Image size={48} className="mx-auto mb-3 opacity-20" />
                       <p>Chưa có ảnh nào</p>
                       <p className="text-xs mt-1">Tải lên ảnh để lưu giữ kỷ niệm</p>
                   </div>
               )}
          </div>
      </div>

      {/* Create Folder Modal */}
      <Modal 
        isOpen={isCreateFolderOpen} 
        onClose={() => setCreateFolderOpen(false)} 
        title="Tạo Thư Mục Mới"
      >
         <div className="space-y-4">
            <div>
               <label className="text-xs font-bold text-slate-700 uppercase mb-1 block">Tên thư mục</label>
               <Input 
                  value={newFolderName} 
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Ví dụ: Ảnh đi biển, Kỷ niệm 2023..."
                  autoFocus
               />
            </div>
            <div className="flex gap-3 pt-2">
               <Button variant="secondary" fullWidth onClick={() => setCreateFolderOpen(false)}>Hủy</Button>
               <Button fullWidth onClick={handleCreateFolder}>Tạo</Button>
            </div>
         </div>
      </Modal>

      {/* Share Vault Modal */}
      <Modal
        isOpen={isShareModalOpen}
        onClose={resetShare}
        title="Share Secure Vault"
      >
        {shareStep === 1 ? (
            <div className="space-y-4">
               <p className="text-sm text-slate-600">
                  Create a secure access key to share this vault with family or friends.
               </p>
               <div>
                  <label className="text-xs font-bold text-slate-700 uppercase mb-1 block">Set Access Password (Optional)</label>
                  <div className="relative">
                     <Key size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                     <Input type="password" placeholder="Enter secure password" className="pl-10" />
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
        title="Đổi tên"
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

      {/* Hidden Input moved to bottom to prevent space-y styling issues */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept="image/png, image/jpeg, image/jpg"
        multiple
      />

    </div>
  );
};

export default Vault;