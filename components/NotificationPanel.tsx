import React, { useEffect, useState } from 'react';
import { Bell, Check, Trash2, X, Cake, Calendar, Info, Zap, Plus, UserPlus, XCircle, CheckCircle } from 'lucide-react';
import { Notification } from '../types';
import { fetchNotifications, markNotificationAsRead, markAllNotificationsAsRead, createTestNotification, supabase } from '../services/supabase';
import { Button } from './ui';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateUnreadCount: (count: number) => void;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ isOpen, onClose, onUpdateUnreadCount }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    const data = await fetchNotifications();
    setNotifications(data);
    // Cast n to any to access is_read which might come from DB but isn't in type
    const unread = data.filter(n => !n.isRead && !(n as any).is_read).length; 
    onUpdateUnreadCount(unread);
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    } else {
        // Also load initially to get count
        loadData(); 
    }
  }, [isOpen]);

  const handleMarkRead = async (id: string) => {
    // Optimistic update
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true, isRead: true } : n));
    // Cast n to any to access is_read which might come from DB but isn't in type
    const unread = notifications.filter(n => n.id !== id && !(n as any).is_read && !n.isRead).length;
    onUpdateUnreadCount(unread);
    
    await markNotificationAsRead(id);
  };

  const handleMarkAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true, isRead: true })));
    onUpdateUnreadCount(0);
    await markAllNotificationsAsRead();
  };

  const handleCreateTest = async () => {
    await createTestNotification();
    loadData();
  };

  const handleAcceptRequest = async (e: React.MouseEvent, notifId: string) => {
      e.stopPropagation();
      setProcessingId(notifId);
      try {
          const { data, error } = await supabase.rpc('accept_friend_request', { notification_id: notifId });
          
          if (error) throw error;

          if (data.status === 'SUCCESS') {
              // Update local state to show accepted
              setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, is_read: true, message: 'Đã đồng ý kết bạn thành công.' } : n));
              alert("Đã thêm vào danh bạ thành công!");
          } else {
              alert(data.message);
          }
      } catch (err: any) {
          alert("Lỗi: " + err.message);
      } finally {
          setProcessingId(null);
      }
  };

  const handleDeclineRequest = async (e: React.MouseEvent, notifId: string) => {
      e.stopPropagation();
      // Update local state to hide buttons immediately
      setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, is_read: true, message: 'Đã từ chối lời mời.' } : n));
      await handleMarkRead(notifId);
  };

  if (!isOpen) return null;

  return (
    <div className="absolute right-0 top-full mt-2 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <h3 className="font-bold text-slate-900">Thông báo</h3>
        <div className="flex gap-2">
            <button onClick={handleMarkAllRead} className="text-xs text-primary-600 font-medium hover:underline" title="Đọc tất cả">
                Đọc tất cả
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
            </button>
        </div>
      </div>
      
      <div className="max-h-[400px] overflow-y-auto">
        {loading ? (
            <div className="p-8 text-center text-slate-400 text-sm">Đang tải...</div>
        ) : notifications.length > 0 ? (
            <div className="divide-y divide-slate-50">
                {notifications.map((notif: any) => {
                    // Logic to show buttons: Type is FRIEND_REQ AND Message doesn't indicate it's been handled
                    // Note: 'accept_friend_request' RPC updates message to "Bạn đã đồng ý..."
                    // 'handleDeclineRequest' locally updates message to "Đã từ chối..."
                    const isHandled = notif.message?.toLowerCase().includes('đã đồng ý') || notif.message?.toLowerCase().includes('đã từ chối');
                    const showActions = notif.type === 'FRIEND_REQ' && !isHandled;

                    return (
                    <div 
                        key={notif.id} 
                        className={`p-4 hover:bg-slate-50 transition-colors ${!notif.is_read ? 'bg-primary-50/30' : ''}`}
                        onClick={() => handleMarkRead(notif.id)}
                    >
                        <div className="flex gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                                notif.type === 'BIRTHDAY' ? 'bg-pink-100 text-pink-600' :
                                notif.type === 'REMINDER' ? 'bg-amber-100 text-amber-600' :
                                notif.type === 'FRIEND_REQ' ? 'bg-green-100 text-green-600' :
                                notif.type === 'SYSTEM' ? 'bg-slate-100 text-slate-600' :
                                'bg-indigo-100 text-indigo-600'
                            }`}>
                                {notif.type === 'BIRTHDAY' ? <Cake size={18} /> :
                                notif.type === 'REMINDER' ? <Calendar size={18} /> :
                                notif.type === 'FRIEND_REQ' ? <UserPlus size={18} /> :
                                notif.type === 'SYSTEM' ? <Info size={18} /> :
                                <Zap size={18} />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                    <p className={`text-sm ${!notif.is_read ? 'font-bold text-slate-900' : 'font-medium text-slate-600'}`}>
                                        {notif.title}
                                    </p>
                                    {!notif.is_read && <span className="w-2 h-2 bg-primary-500 rounded-full mt-1.5 shrink-0"></span>}
                                </div>
                                <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{notif.message}</p>
                                <p className="text-[10px] text-slate-400 mt-2">
                                    {new Date(notif.created_at).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                </p>

                                {/* Action Buttons for Friend Request */}
                                {showActions && (
                                    <div className="flex gap-2 mt-3">
                                        <button 
                                            onClick={(e) => handleAcceptRequest(e, notif.id)}
                                            disabled={processingId === notif.id}
                                            className="flex-1 flex items-center justify-center gap-1 bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-1.5 rounded-lg transition-colors disabled:opacity-50"
                                        >
                                            {processingId === notif.id ? 'Đang xử lý...' : <><CheckCircle size={14} /> Đồng ý</>}
                                        </button>
                                        <button 
                                            onClick={(e) => handleDeclineRequest(e, notif.id)}
                                            disabled={processingId === notif.id}
                                            className="flex-1 flex items-center justify-center gap-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold py-1.5 rounded-lg transition-colors"
                                        >
                                            <XCircle size={14} /> Từ chối
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )})}
            </div>
        ) : (
            <div className="p-8 text-center">
                <Bell size={32} className="mx-auto text-slate-200 mb-2" />
                <p className="text-sm text-slate-500">Bạn chưa có thông báo nào.</p>
            </div>
        )}
      </div>

      <div className="p-3 border-t border-slate-100 bg-slate-50">
        <Button 
            variant="secondary" 
            size="sm" 
            fullWidth 
            onClick={handleCreateTest}
            className="text-xs gap-2 h-8 border-dashed"
        >
            <Plus size={14} /> Tạo thông báo thử nghiệm
        </Button>
      </div>
    </div>
  );
};

export default NotificationPanel;