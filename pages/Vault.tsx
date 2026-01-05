import React, { useState } from 'react';
import { Card, Button, Modal, Input, Badge } from '../components/ui';
import { Share2, Plus, UploadCloud, FileText, Image, Music, Folder, Key, Clock, Copy, CheckCircle2 } from 'lucide-react';
import { Language } from '../types';

interface VaultProps {
  lang: Language;
}

const FILES_DATA = [
  { id: '1', name: 'Sinh nhật Mẹ 2023', type: 'folder', date: 'Oct 20, 2023', size: '12 items', icon: Folder, color: 'text-yellow-500 bg-yellow-50' },
  { id: '2', name: 'Du lịch Đà Lạt', type: 'folder', date: 'Aug 15, 2023', size: '45 items', icon: Folder, color: 'text-yellow-500 bg-yellow-50' },
  { id: '3', name: 'Voice_chuc_mung.mp3', type: 'audio', date: 'Dec 31, 2023', size: '2.4 MB', icon: Music, color: 'text-pink-500 bg-pink-50' },
  { id: '4', name: 'Gia_dinh.jpg', type: 'image', date: 'Jan 01, 2024', size: '4.1 MB', icon: Image, color: 'text-purple-500 bg-purple-50' },
  { id: '5', name: 'Letter_for_Dad.pdf', type: 'doc', date: 'Feb 14, 2024', size: '1.2 MB', icon: FileText, color: 'text-blue-500 bg-blue-50' },
];

const Vault: React.FC<VaultProps> = ({ lang }) => {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareStep, setShareStep] = useState(1);
  const [inviteCode, setInviteCode] = useState("");

  const handleGenerateShare = () => {
     setShareStep(2);
     setInviteCode("VAULT-" + Math.random().toString(36).substr(2, 6).toUpperCase());
  };

  const resetShare = () => {
    setIsShareModalOpen(false);
    setShareStep(1);
    setInviteCode("");
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kho Kỷ Niệm Chung</h1>
          <p className="text-slate-500 text-sm mt-1">Encrypted Vault • 4.2 GB used</p>
        </div>
        <div className="flex gap-3">
           <Button variant="secondary" className="gap-2" onClick={() => setIsShareModalOpen(true)}>
              <Share2 size={16} /> Share Key
           </Button>
           <Button className="gap-2 bg-red-500 hover:bg-red-600 text-white border-none shadow-lg shadow-red-500/20">
              <Plus size={16} /> Tải lên kỷ niệm
           </Button>
        </div>
      </div>

      {/* Upload Area */}
      <div className="border-2 border-dashed border-slate-300 rounded-2xl p-12 text-center hover:bg-slate-50 transition-colors cursor-pointer group">
         <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform text-slate-400">
            <UploadCloud size={32} />
         </div>
         <h3 className="text-lg font-bold text-slate-900 mb-2">Kéo thả kỷ niệm vào đây</h3>
         <p className="text-slate-500 text-sm max-w-sm mx-auto">
            Hỗ trợ ảnh, video, âm thanh. Mọi dữ liệu đều được <span className="text-green-600 font-medium">mã hóa</span> trước khi lưu trữ.
         </p>
      </div>

      {/* Recent Files Label */}
      <h3 className="font-bold text-slate-900 text-lg">Gần đây</h3>

      {/* Files Grid (Updated Aspect Ratio) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
         {FILES_DATA.map((file) => (
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
         ))}
      </div>

      {/* List View */}
      <Card className="overflow-hidden border-none shadow-sm">
         <div className="px-6 py-4 border-b border-slate-100 font-bold text-slate-900">
            Tất cả tập tin
         </div>
         <table className="w-full text-sm text-left">
            <tbody className="divide-y divide-slate-100">
               {FILES_DATA.map((file) => (
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