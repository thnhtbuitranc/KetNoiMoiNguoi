import React, { useState, useRef, useEffect } from 'react';
import { Button, Card, Badge, Modal, Input } from '../components/ui';
import { Camera, Share2, Settings, Smartphone, Mail, MapPin, Activity, QrCode, Lock, Globe, Eye, EyeOff, Save, Download, Copy, Briefcase, GraduationCap, Palette, Users, HelpCircle, ExternalLink, AlertTriangle, Key, ShieldCheck, Gamepad2, Home, Building2, BookOpen, Calendar } from 'lucide-react';
import { Language } from '../types';
import { supabase, logDbOperation } from '../services/supabase';

interface ProfileProps {
  lang: Language;
}

type PrivacyLevel = 'PUBLIC' | 'FRIENDS' | 'CLOSE_FRIENDS' | 'PRIVATE';

interface UserField {
  value: string;
  privacy: PrivacyLevel;
}

// Structure for detailed school info
interface SchoolInfo {
    name: string;
    classes: string; // "1/1, 2/1, 3/2"
    teachers: string; // "Co Lan, Thay Hung"
    years: string; // "1999-2004"
}

// Extended Profile Structure
interface DetailedInfo {
    // Education - Now Objects
    preschool?: SchoolInfo;
    primarySchool?: SchoolInfo;
    secondarySchool?: SchoolInfo;
    highSchool?: SchoolInfo;
    university?: SchoolInfo;
    
    // Legacy/Simple fields
    highSchoolStream?: string; // Ban Tự nhiên/Xã hội
    major?: string;
    
    // Work
    company?: string;
    organization?: string;
    officeBranch?: string;
    partTimeJob?: string;
    internship?: string;

    // Living
    hometown?: string;
    neighborhood?: string; // Khu phố/thôn/xóm
    dorm?: string; // Ký túc xá
    apartment?: string; // Chung cư
    rentalHouse?: string; // Nhà trọ
    
    // Hobbies / Other
    clubs?: string; // CLB
    games?: string;
}

// --- Sub-component for School Input (Moved OUTSIDE to prevent re-render focus loss) ---
const SchoolInputBlock = ({ 
    label, 
    schoolKey, 
    data,
    isEditing,
    onUpdate
}: { 
    label: string, 
    schoolKey: keyof DetailedInfo, 
    data?: SchoolInfo | string, // Legacy support for string
    isEditing: boolean,
    onUpdate: (key: keyof DetailedInfo, field: keyof SchoolInfo, val: string) => void
}) => {
    // Normalize data to object if it's a string or undefined
    const safeData: SchoolInfo = (typeof data === 'object' && data !== null) 
        ? data 
        : { name: typeof data === 'string' ? data : '', classes: '', teachers: '', years: '' };

    if (!isEditing) {
        if (!safeData.name) return null;
        return (
            <div className="mb-3 pb-3 border-b border-slate-50 last:border-0 last:pb-0 last:mb-0">
                <div className="flex justify-between items-start">
                    <span className="font-bold text-slate-800 text-sm">{label}</span>
                    {safeData.years && (
                        <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-bold">
                            {safeData.years}
                        </span>
                    )}
                </div>
                <div className="text-sm text-slate-600 font-medium mt-1">{safeData.name}</div>
                {(safeData.classes || safeData.teachers) && (
                    <div className="mt-2 text-xs text-slate-500 bg-slate-50 p-2 rounded-lg space-y-1">
                        {safeData.classes && <div><span className="font-semibold">Lớp:</span> {safeData.classes}</div>}
                        {safeData.teachers && <div><span className="font-semibold">GV:</span> {safeData.teachers}</div>}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 mb-4">
            <label className="text-xs font-bold text-slate-700 uppercase mb-2 block">{label}</label>
            <div className="space-y-2">
                <Input 
                    placeholder="Tên trường..." 
                    value={safeData.name}
                    onChange={(e) => onUpdate(schoolKey, 'name', e.target.value)}
                    className="bg-white"
                />
                <div className="grid grid-cols-2 gap-2">
                    <Input 
                        placeholder="Lớp (VD: 1/1, 2/3...)" 
                        value={safeData.classes}
                        onChange={(e) => onUpdate(schoolKey, 'classes', e.target.value)}
                        className="bg-white text-xs"
                    />
                    <Input 
                        placeholder="Niên khóa (VD: 1999-2003)" 
                        value={safeData.years}
                        onChange={(e) => onUpdate(schoolKey, 'years', e.target.value)}
                        className="bg-white text-xs"
                    />
                </div>
                <Input 
                    placeholder="Tên Giáo Viên (Cô Lan, Thầy Hùng...)" 
                    value={safeData.teachers}
                    onChange={(e) => onUpdate(schoolKey, 'teachers', e.target.value)}
                    className="bg-white text-xs"
                />
            </div>
        </div>
    );
};

const Profile: React.FC<ProfileProps> = ({ lang }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({ connections: 0, memories: 0 });
  const [currentUserId, setCurrentUserId] = useState<string>('');
  
  // File Input Refs
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Expanded User Data
  const [userInfo, setUserInfo] = useState({
    name: "User",
    role: "Member",
    location: "",
    avatar: "https://ui-avatars.com/api/?background=random",
    cover: "",
    coverIsImage: false, 
    email: { value: "", privacy: 'PRIVATE' } as UserField,
    address: { value: "", privacy: 'CLOSE_FRIENDS' } as UserField,
    job: { value: "", privacy: 'PUBLIC' } as UserField,
    education: { value: "", privacy: 'FRIENDS' } as UserField,
    skills: { value: "", privacy: 'PUBLIC' } as UserField,
    hobbies: { value: "", privacy: 'FRIENDS' } as UserField,
    bio: "",
    birthday: "",
    tags: ["MEMBER"],
    uniqueId: "",
    securityCode: "",
    
    // New Detailed Info JSONB
    detailedInfo: {} as DetailedInfo,
    
    // Detailed Section Privacy
    detailedPrivacy: {
        education: 'FRIENDS' as PrivacyLevel,
        work: 'PUBLIC' as PrivacyLevel,
        living: 'CLOSE_FRIENDS' as PrivacyLevel,
        activities: 'FRIENDS' as PrivacyLevel
    }
  });

  const [editSecurityCode, setEditSecurityCode] = useState("");

  const generateRandomId = () => {
     // Generate 8 char random string (uppercase alphanumeric)
     return Math.random().toString(36).substring(2, 10).toUpperCase();
  };

  useEffect(() => {
    const fetchProfile = async () => {
        setLoading(true);
        logDbOperation('Profile', 'Fetching profile...');
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setCurrentUserId(user.id);
                // Fetch Profile Data
                const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
                
                // Fetch Counts
                const { count: connCount } = await supabase.from('connections').select('*', { count: 'exact', head: true });
                const { count: memCount } = await supabase.from('memories').select('*', { count: 'exact', head: true });
                
                setCounts({ 
                    connections: connCount || 0, 
                    memories: memCount || 0 
                });

                // Determine Name and Avatar Fallbacks
                const initialName = data?.name || data?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || "User";
                const initialAvatar = data?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(initialName)}&background=random`;

                if (data) {
                    logDbOperation('Profile', 'Loaded', data);
                    
                    // Parse Privacy Settings
                    const ps = data.privacy_settings || {};
                    const details = data.detailed_info || {};

                    // Check if unique_id needs generation
                    let currentUniqueId = data.unique_id;
                    if (!currentUniqueId) {
                        currentUniqueId = generateRandomId();
                        // Auto-save the new ID
                        await supabase.from('profiles').update({ unique_id: currentUniqueId }).eq('id', user.id);
                    }

                    setUserInfo(prev => ({
                        ...prev,
                        name: initialName,
                        email: { value: user.email || "", privacy: ps.email || 'PRIVATE' },
                        avatar: initialAvatar,
                        bio: data.bio || '',
                        location: data.location || '',
                        role: data.role || 'Member',
                        cover: data.cover_url || "bg-gradient-to-r from-slate-200 to-slate-300",
                        coverIsImage: !!data.cover_url && !data.cover_url.startsWith('bg-'),
                        
                        job: { value: data.job || '', privacy: ps.job || 'PUBLIC' },
                        education: { value: data.education || '', privacy: ps.education || 'FRIENDS' },
                        skills: { value: data.skills || '', privacy: ps.skills || 'PUBLIC' },
                        hobbies: { value: data.hobbies || '', privacy: ps.hobbies || 'FRIENDS' },
                        address: { value: data.location || '', privacy: ps.address || 'CLOSE_FRIENDS' }, // Mapping address to location field for now
                        birthday: data.birthday || '',
                        tags: data.tags && data.tags.length > 0 ? data.tags : ['MEMBER'],
                        uniqueId: currentUniqueId,
                        securityCode: data.security_code || "",
                        detailedInfo: details,
                        detailedPrivacy: {
                            education: ps.detailed_education || 'FRIENDS',
                            work: ps.detailed_work || 'PUBLIC',
                            living: ps.detailed_living || 'CLOSE_FRIENDS',
                            activities: ps.detailed_activities || 'FRIENDS'
                        }
                    }));
                    setEditSecurityCode(data.security_code || "");
                } else {
                    // Initialize from Auth if no profile exists yet
                     setUserInfo(prev => ({
                        ...prev,
                        name: initialName,
                        email: { ...prev.email, value: user.email || "" },
                        avatar: initialAvatar,
                        detailedInfo: {}
                    }));
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
      setIsEditing(false);
      try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;
          
          logDbOperation('Profile', 'Updating...', userInfo);
          
          // Validate Security Code
          if (editSecurityCode.length > 4) {
              alert("Mã bảo mật tối đa 4 ký tự.");
              return;
          }

          // Construct Privacy Settings JSON
          const privacySettings = {
              email: userInfo.email.privacy,
              address: userInfo.address.privacy,
              job: userInfo.job.privacy,
              education: userInfo.education.privacy,
              skills: userInfo.skills.privacy,
              hobbies: userInfo.hobbies.privacy,
              
              // NEW: Section Privacy
              detailed_education: userInfo.detailedPrivacy.education,
              detailed_work: userInfo.detailedPrivacy.work,
              detailed_living: userInfo.detailedPrivacy.living,
              detailed_activities: userInfo.detailedPrivacy.activities
          };

          const updates = {
              name: userInfo.name,
              bio: userInfo.bio,
              location: userInfo.location,
              role: userInfo.role,
              birthday: userInfo.birthday,
              // Only save cover if it's a URL (image), otherwise let it be null or handle CSS classes if DB supported
              cover_url: userInfo.coverIsImage ? userInfo.cover : null,
              
              // New Fields
              job: userInfo.job.value,
              education: userInfo.education.value,
              skills: userInfo.skills.value,
              hobbies: userInfo.hobbies.value,
              tags: userInfo.tags,
              privacy_settings: privacySettings,
              
              // Detailed Info (JSONB)
              detailed_info: userInfo.detailedInfo,
              
              // Security
              security_code: editSecurityCode,
              
              updated_at: new Date().toISOString()
          };
          
          const { error } = await supabase.from('profiles').update(updates).eq('id', user.id);
          if (error) throw error;
          
          setUserInfo(prev => ({ ...prev, securityCode: editSecurityCode }));
          logDbOperation('Profile', 'Update Success');
      } catch (e: any) {
          logDbOperation('Profile', 'Update Failed', null, e);
          alert("Error updating profile: " + e.message);
      }
  };

  const handlePrivacyChange = (field: keyof typeof userInfo, level: PrivacyLevel) => {
    setUserInfo(prev => ({
      ...prev,
      [field]: { ...prev[field as keyof typeof prev] as UserField, privacy: level }
    }));
  };
  
  const handleDetailPrivacyChange = (section: keyof typeof userInfo.detailedPrivacy, level: PrivacyLevel) => {
      setUserInfo(prev => ({
          ...prev,
          detailedPrivacy: {
              ...prev.detailedPrivacy,
              [section]: level
          }
      }));
  };

  // Helper for Detailed Info Update (Generic)
  const updateDetail = (key: keyof DetailedInfo, val: any) => {
      setUserInfo(prev => ({
          ...prev,
          detailedInfo: { ...prev.detailedInfo, [key]: val }
      }));
  };

  // Helper for Updating School Object
  const updateSchool = (key: keyof DetailedInfo, field: keyof SchoolInfo, val: string) => {
      setUserInfo(prev => {
          const currentSchool = (prev.detailedInfo[key] as SchoolInfo) || { name: '', classes: '', teachers: '', years: '' };
          return {
              ...prev,
              detailedInfo: { 
                  ...prev.detailedInfo, 
                  [key]: { ...currentSchool, [field]: val } 
              }
          };
      });
  };
  
  const triggerAvatarUpload = () => {
    avatarInputRef.current?.click();
  };

  const triggerCoverUpload = () => {
    coverInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover') => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if(!user) return;

        // Upload to Storage
        const fileExt = file.name.split('.').pop();
        const filePath = `${user.id}/${type}_${Date.now()}.${fileExt}`;
        
        logDbOperation('Profile', `Uploading ${type}...`);
        
        const { error: uploadError } = await supabase.storage
            .from('avatars') // Using 'avatars' bucket for profile images
            .upload(filePath, file);
            
        if(uploadError) throw uploadError;

        // Get Public URL
        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);

        // Update Local State
        setUserInfo(prev => ({
            ...prev,
            [type]: publicUrl,
            ...(type === 'cover' ? { coverIsImage: true } : {})
        }));

        // Immediate DB Update for Avatar/Cover
        const updateField = type === 'avatar' ? 'avatar_url' : 'cover_url';
        await supabase.from('profiles').update({ [updateField]: publicUrl }).eq('id', user.id);

      } catch (err: any) {
         alert("Upload failed: " + err.message);
      }
      
      // Reset input
      e.target.value = '';
    }
  };

  const getPrivacyIcon = (level: PrivacyLevel) => {
    switch (level) {
      case 'PUBLIC': return <Globe size={14} className="text-green-500" />;
      case 'FRIENDS': return <Users size={14} className="text-blue-500" />;
      case 'CLOSE_FRIENDS': return <StarIcon size={14} className="text-purple-500" />;
      case 'PRIVATE': return <Lock size={14} className="text-red-400" />;
      default: return <Lock size={14} className="text-slate-400" />;
    }
  };

  const getPrivacyLabel = (level: PrivacyLevel) => {
    switch (level) {
      case 'PUBLIC': return 'Public';
      case 'FRIENDS': return 'Friends';
      case 'CLOSE_FRIENDS': return 'Close Friends';
      case 'PRIVATE': return 'Only Me';
      default: return '';
    }
  };
  
  const isPrivateEnv = window.location.hostname.includes('localhost') || 
                       window.location.hostname.includes('127.0.0.1') || 
                       window.location.hostname.includes('usercontent.goog') ||
                       window.location.protocol === 'file:';

  const StarIcon = ({size, className}: {size:number, className:string}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>
  );

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
      
      {/* Hidden File Inputs */}
      <input 
        type="file" 
        ref={avatarInputRef} 
        onChange={(e) => handleFileChange(e, 'avatar')} 
        className="hidden" 
        accept="image/*"
      />
      <input 
        type="file" 
        ref={coverInputRef} 
        onChange={(e) => handleFileChange(e, 'cover')} 
        className="hidden" 
        accept="image/*"
      />

      {/* Main Digital Card (Full Width) */}
      <Card className="overflow-hidden border-none shadow-lg w-full">
        {/* Cover */}
        <div 
            className={`h-48 md:h-64 relative bg-cover bg-center ${!userInfo.coverIsImage ? userInfo.cover : ''}`}
            style={userInfo.coverIsImage ? { backgroundImage: `url("${userInfo.cover}")` } : {}}
        >
            <div className="absolute inset-0 bg-black/10"></div>
            <button 
                onClick={triggerCoverUpload}
                className="absolute bottom-4 right-4 bg-white/80 backdrop-blur hover:bg-white text-slate-800 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all shadow-sm z-10"
            >
                <Camera size={14} /> Change Cover
            </button>
        </div>
        
        <div className="px-8 pb-8 text-center -mt-16 relative">
            {/* Avatar */}
            <div className="relative inline-block mb-4 group cursor-pointer" onClick={triggerAvatarUpload}>
                <img src={userInfo.avatar} className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-[6px] border-white shadow-lg group-hover:brightness-90 transition-all bg-white" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full z-10 bg-black/30">
                    <Camera size={24} className="text-white drop-shadow-md" />
                </div>
                <div className="absolute bottom-1 right-1 bg-green-500 w-6 h-6 rounded-full border-4 border-white"></div>
            </div>
            
            {/* Info */}
            {isEditing ? (
                <div className="max-w-xs mx-auto mb-4 space-y-2">
                    <Input 
                    value={userInfo.name} 
                    onChange={(e) => setUserInfo({...userInfo, name: e.target.value})} 
                    className="text-center font-bold text-lg"
                    placeholder="Your Name"
                    />
                    <Input 
                    value={userInfo.role} 
                    onChange={(e) => setUserInfo({...userInfo, role: e.target.value})} 
                    className="text-center text-sm"
                    placeholder="Role / Title"
                    />
                </div>
            ) : (
                <>
                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-1">{userInfo.name}</h1>
                <p className="text-slate-500 font-medium mb-6">{userInfo.role} • {userInfo.location || 'Unknown Location'}</p>
                </>
            )}
            
            {/* Stats */}
            <div className="flex justify-center gap-16 border-t border-b border-slate-100 py-6 mb-8 max-w-2xl mx-auto">
                <div className="text-center">
                    <span className="block text-2xl font-bold text-slate-900">{counts.connections}</span>
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Connections</span>
                </div>
                <div className="text-center">
                    <span className="block text-2xl font-bold text-slate-900">{counts.memories}</span>
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Memories</span>
                </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-center gap-4">
                <Button 
                className={`gap-2 px-6 ${isEditing ? 'bg-green-600 hover:bg-green-700' : 'bg-slate-900 hover:bg-slate-800'} text-white`}
                onClick={() => {
                    if (isEditing) handleSave();
                    else setIsEditing(true);
                }}
                >
                    {isEditing ? <Save size={16} /> : <Settings size={16} />} 
                    {isEditing ? 'Lưu Thay Đổi' : 'Chỉnh Sửa Hồ Sơ'}
                </Button>
            </div>
        </div>
      </Card>

      {/* Detailed Info Card (Full Width) */}
      <Card className="p-6 md:p-8 w-full">
        <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs">Thông Tin Chi Tiết (Cho Tìm Kiếm)</h3>
            {isEditing && <span className="text-[10px] text-green-600 font-bold bg-green-50 px-2 py-1 rounded">EDITING MODE</span>}
        </div>
        
        {isEditing ? (
            <textarea 
            className="w-full border border-slate-200 rounded-lg p-3 text-sm text-slate-600 mb-8 focus:outline-none focus:border-primary-500"
            value={userInfo.bio}
            onChange={(e) => setUserInfo({...userInfo, bio: e.target.value})}
            rows={3}
            placeholder="Giới thiệu ngắn về bản thân..."
            />
        ) : (
            <p className="text-sm text-slate-600 leading-relaxed mb-8 italic border-l-4 border-slate-200 pl-4">
                "{userInfo.bio || 'Chưa có giới thiệu.'}"
            </p>
        )}

        {/* EXPANDED DETAILS SECTION */}
        <div className="space-y-8">
            
            {/* 1. Education Group */}
            <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <GraduationCap className="text-indigo-600" size={18} />
                        <h4 className="font-bold text-slate-800 text-sm">Học Vấn & Trường Lớp</h4>
                    </div>
                    {/* Education Privacy Selector */}
                    {isEditing ? (
                        <select 
                            value={userInfo.detailedPrivacy.education}
                            onChange={(e) => handleDetailPrivacyChange('education', e.target.value as PrivacyLevel)}
                            className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:border-primary-500"
                        >
                            <option value="PUBLIC">Public</option>
                            <option value="FRIENDS">Friends</option>
                            <option value="CLOSE_FRIENDS">Close Friends</option>
                            <option value="PRIVATE">Only Me</option>
                        </select>
                    ) : (
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-white px-2 py-1 rounded">
                            {getPrivacyIcon(userInfo.detailedPrivacy.education)}
                            <span>{getPrivacyLabel(userInfo.detailedPrivacy.education)}</span>
                        </div>
                    )}
                </div>
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <p className="text-xs text-slate-400 mb-4 italic">Nhập chi tiết Tên lớp (ví dụ 1/2, 9/4) và Tên giáo viên để dễ dàng tìm thấy bạn cũ.</p>
                    </div>
                    
                    <SchoolInputBlock label="Mầm non" schoolKey="preschool" data={userInfo.detailedInfo?.preschool} isEditing={isEditing} onUpdate={updateSchool} />
                    <SchoolInputBlock label="Tiểu học (Cấp 1)" schoolKey="primarySchool" data={userInfo.detailedInfo?.primarySchool} isEditing={isEditing} onUpdate={updateSchool} />
                    <SchoolInputBlock label="Trung học cơ sở (Cấp 2)" schoolKey="secondarySchool" data={userInfo.detailedInfo?.secondarySchool} isEditing={isEditing} onUpdate={updateSchool} />
                    <SchoolInputBlock label="Trung học phổ thông (Cấp 3)" schoolKey="highSchool" data={userInfo.detailedInfo?.highSchool} isEditing={isEditing} onUpdate={updateSchool} />
                    
                    {/* High School Stream */}
                    {isEditing ? (
                        <div>
                            <label className="text-xs font-bold text-slate-700 uppercase mb-2 block">Ban học (Cấp 3)</label>
                            <Input value={userInfo.detailedInfo?.highSchoolStream || ''} onChange={e => updateDetail('highSchoolStream', e.target.value)} placeholder="VD: Ban A, Tự nhiên..." />
                        </div>
                    ) : userInfo.detailedInfo?.highSchoolStream && (
                        <div className="mb-3">
                            <span className="font-bold text-slate-800 text-sm block">Ban học</span>
                            <span className="text-sm text-slate-600">{userInfo.detailedInfo.highSchoolStream}</span>
                        </div>
                    )}

                    <SchoolInputBlock label="Đại học / Cao đẳng" schoolKey="university" data={userInfo.detailedInfo?.university} isEditing={isEditing} onUpdate={updateSchool} />
                    
                    {/* Major */}
                    {isEditing ? (
                        <div>
                            <label className="text-xs font-bold text-slate-700 uppercase mb-2 block">Chuyên ngành</label>
                            <Input value={userInfo.detailedInfo?.major || ''} onChange={e => updateDetail('major', e.target.value)} placeholder="VD: CNTT..." />
                        </div>
                    ) : userInfo.detailedInfo?.major && (
                        <div className="mb-3">
                            <span className="font-bold text-slate-800 text-sm block">Chuyên ngành</span>
                            <span className="text-sm text-slate-600">{userInfo.detailedInfo.major}</span>
                        </div>
                    )}
                    
                    {/* Empty State */}
                    {!isEditing && Object.keys(userInfo.detailedInfo || {}).length === 0 && (
                        <div className="col-span-2 text-center text-slate-400 italic text-sm">Chưa có thông tin học vấn.</div>
                    )}
                </div>
            </div>

            {/* 2. Work Group */}
            <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Briefcase className="text-blue-600" size={18} />
                        <h4 className="font-bold text-slate-800 text-sm">Công Việc & Tổ Chức</h4>
                    </div>
                    {/* Work Privacy Selector */}
                    {isEditing ? (
                        <select 
                            value={userInfo.detailedPrivacy.work}
                            onChange={(e) => handleDetailPrivacyChange('work', e.target.value as PrivacyLevel)}
                            className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:border-primary-500"
                        >
                            <option value="PUBLIC">Public</option>
                            <option value="FRIENDS">Friends</option>
                            <option value="CLOSE_FRIENDS">Close Friends</option>
                            <option value="PRIVATE">Only Me</option>
                        </select>
                    ) : (
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-white px-2 py-1 rounded">
                            {getPrivacyIcon(userInfo.detailedPrivacy.work)}
                            <span>{getPrivacyLabel(userInfo.detailedPrivacy.work)}</span>
                        </div>
                    )}
                </div>
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {isEditing ? (
                        <>
                            <div><label className="text-xs text-slate-500 block mb-1">Công ty hiện tại</label><Input value={userInfo.detailedInfo?.company || ''} onChange={e => updateDetail('company', e.target.value)} /></div>
                            <div><label className="text-xs text-slate-500 block mb-1">Văn phòng / Chi nhánh</label><Input value={userInfo.detailedInfo?.officeBranch || ''} onChange={e => updateDetail('officeBranch', e.target.value)} /></div>
                            <div><label className="text-xs text-slate-500 block mb-1">Tổ chức tham gia</label><Input value={userInfo.detailedInfo?.organization || ''} onChange={e => updateDetail('organization', e.target.value)} /></div>
                            <div><label className="text-xs text-slate-500 block mb-1">Việc làm thêm</label><Input value={userInfo.detailedInfo?.partTimeJob || ''} onChange={e => updateDetail('partTimeJob', e.target.value)} /></div>
                            <div><label className="text-xs text-slate-500 block mb-1">Nơi thực tập</label><Input value={userInfo.detailedInfo?.internship || ''} onChange={e => updateDetail('internship', e.target.value)} /></div>
                        </>
                    ) : (
                        <div className="col-span-2 text-sm text-slate-600 grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-8">
                            {userInfo.detailedInfo?.company && <div><span className="font-semibold text-slate-900">Công ty:</span> {userInfo.detailedInfo.company}</div>}
                            {userInfo.detailedInfo?.officeBranch && <div><span className="font-semibold text-slate-900">Chi nhánh:</span> {userInfo.detailedInfo.officeBranch}</div>}
                            {userInfo.detailedInfo?.organization && <div><span className="font-semibold text-slate-900">Tổ chức:</span> {userInfo.detailedInfo.organization}</div>}
                            {userInfo.detailedInfo?.partTimeJob && <div><span className="font-semibold text-slate-900">Làm thêm:</span> {userInfo.detailedInfo.partTimeJob}</div>}
                            {userInfo.detailedInfo?.internship && <div><span className="font-semibold text-slate-900">Thực tập:</span> {userInfo.detailedInfo.internship}</div>}
                        </div>
                    )}
                </div>
            </div>

            {/* 3. Living Group */}
            <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Home className="text-orange-500" size={18} />
                        <h4 className="font-bold text-slate-800 text-sm">Nơi Ở & Quê Quán</h4>
                    </div>
                    {/* Living Privacy Selector */}
                    {isEditing ? (
                        <select 
                            value={userInfo.detailedPrivacy.living}
                            onChange={(e) => handleDetailPrivacyChange('living', e.target.value as PrivacyLevel)}
                            className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:border-primary-500"
                        >
                            <option value="PUBLIC">Public</option>
                            <option value="FRIENDS">Friends</option>
                            <option value="CLOSE_FRIENDS">Close Friends</option>
                            <option value="PRIVATE">Only Me</option>
                        </select>
                    ) : (
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-white px-2 py-1 rounded">
                            {getPrivacyIcon(userInfo.detailedPrivacy.living)}
                            <span>{getPrivacyLabel(userInfo.detailedPrivacy.living)}</span>
                        </div>
                    )}
                </div>
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {isEditing ? (
                        <>
                            <div><label className="text-xs text-slate-500 block mb-1">Quê quán</label><Input value={userInfo.detailedInfo?.hometown || ''} onChange={e => updateDetail('hometown', e.target.value)} /></div>
                            <div><label className="text-xs text-slate-500 block mb-1">Khu phố / Thôn / Xóm</label><Input value={userInfo.detailedInfo?.neighborhood || ''} onChange={e => updateDetail('neighborhood', e.target.value)} /></div>
                            <div><label className="text-xs text-slate-500 block mb-1">Chung cư / Khu dân cư</label><Input value={userInfo.detailedInfo?.apartment || ''} onChange={e => updateDetail('apartment', e.target.value)} /></div>
                            <div><label className="text-xs text-slate-500 block mb-1">Ký túc xá / Nhà trọ</label><Input value={userInfo.detailedInfo?.dorm || ''} onChange={e => updateDetail('dorm', e.target.value)} placeholder="Tên KTX, số phòng..." /></div>
                        </>
                    ) : (
                        <div className="col-span-2 text-sm text-slate-600 grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-8">
                            {userInfo.detailedInfo?.hometown && <div><span className="font-semibold text-slate-900">Quê quán:</span> {userInfo.detailedInfo.hometown}</div>}
                            {userInfo.detailedInfo?.neighborhood && <div><span className="font-semibold text-slate-900">Khu vực:</span> {userInfo.detailedInfo.neighborhood}</div>}
                            {userInfo.detailedInfo?.apartment && <div><span className="font-semibold text-slate-900">Chung cư:</span> {userInfo.detailedInfo.apartment}</div>}
                            {userInfo.detailedInfo?.dorm && <div><span className="font-semibold text-slate-900">KTX/Trọ:</span> {userInfo.detailedInfo.dorm}</div>}
                        </div>
                    )}
                </div>
            </div>

                {/* 4. Activities Group */}
                <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Gamepad2 className="text-purple-500" size={18} />
                        <h4 className="font-bold text-slate-800 text-sm">Sở Thích & Cộng Đồng</h4>
                    </div>
                    {/* Activities Privacy Selector */}
                    {isEditing ? (
                        <select 
                            value={userInfo.detailedPrivacy.activities}
                            onChange={(e) => handleDetailPrivacyChange('activities', e.target.value as PrivacyLevel)}
                            className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:border-primary-500"
                        >
                            <option value="PUBLIC">Public</option>
                            <option value="FRIENDS">Friends</option>
                            <option value="CLOSE_FRIENDS">Close Friends</option>
                            <option value="PRIVATE">Only Me</option>
                        </select>
                    ) : (
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-white px-2 py-1 rounded">
                            {getPrivacyIcon(userInfo.detailedPrivacy.activities)}
                            <span>{getPrivacyLabel(userInfo.detailedPrivacy.activities)}</span>
                        </div>
                    )}
                </div>
                <div className="p-4 grid grid-cols-1 gap-4">
                    {isEditing ? (
                        <>
                            <div><label className="text-xs text-slate-500 block mb-1">Câu lạc bộ / Đội nhóm</label><Input value={userInfo.detailedInfo?.clubs || ''} onChange={e => updateDetail('clubs', e.target.value)} placeholder="CLB Guitar, Đội Tình nguyện..." /></div>
                            <div><label className="text-xs text-slate-500 block mb-1">Game đã chơi</label><Input value={userInfo.detailedInfo?.games || ''} onChange={e => updateDetail('games', e.target.value)} placeholder="LoL, PUBG, Genshin..." /></div>
                        </>
                    ) : (
                        <div className="text-sm text-slate-600 space-y-2">
                            {userInfo.detailedInfo?.clubs && <div><span className="font-semibold text-slate-900">CLB:</span> {userInfo.detailedInfo.clubs}</div>}
                            {userInfo.detailedInfo?.games && <div><span className="font-semibold text-slate-900">Game:</span> {userInfo.detailedInfo.games}</div>}
                        </div>
                    )}
                </div>
            </div>

            {/* Original Contact Section - Kept for High Level Info */}
            <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Thông Tin Cơ Bản</h4>
                <div className="space-y-4">
                    {/* User ID - Moved here from Share Card */}
                    <div className="flex items-center justify-between group">
                        <div className="flex items-center gap-3 text-sm text-slate-600 flex-1 mr-4">
                            <ShieldCheck size={18} className="text-slate-400 shrink-0" />
                            <div>
                                <span className="font-mono font-bold tracking-widest text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 select-all">
                                    {userInfo.uniqueId || "..."}
                                </span>
                                <span className="ml-2 text-xs text-slate-400">(ID Kết bạn)</span>
                            </div>
                        </div>
                        <button onClick={() => { navigator.clipboard.writeText(userInfo.uniqueId); alert('Copied ID!'); }} className="text-slate-400 hover:text-indigo-600">
                            <Copy size={16} />
                        </button>
                    </div>

                    {/* Email */}
                    <div className="flex items-center justify-between group">
                    <div className="flex items-center gap-3 text-sm text-slate-600 flex-1 mr-4">
                        <Mail size={18} className="text-slate-400 shrink-0" />
                        <span className="truncate">{userInfo.email.value}</span>
                    </div>
                    {isEditing ? (
                        <select 
                            value={userInfo.email.privacy}
                            onChange={(e) => handlePrivacyChange('email', e.target.value as PrivacyLevel)}
                            className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-slate-50 focus:outline-none focus:border-primary-500"
                        >
                            <option value="PUBLIC">Public</option>
                            <option value="FRIENDS">Friends</option>
                            <option value="CLOSE_FRIENDS">Close Friends</option>
                            <option value="PRIVATE">Only Me</option>
                        </select>
                    ) : (
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded">
                            {getPrivacyIcon(userInfo.email.privacy)}
                            <span>{getPrivacyLabel(userInfo.email.privacy)}</span>
                        </div>
                    )}
                    </div>

                    {/* Address / Location */}
                    <div className="flex items-center justify-between group">
                    <div className="flex items-center gap-3 text-sm text-slate-600 flex-1 mr-4">
                        <MapPin size={18} className="text-slate-400 shrink-0" />
                        {isEditing ? (
                            <Input 
                            value={userInfo.location} 
                            onChange={(e) => setUserInfo({...userInfo, location: e.target.value})} 
                            className="py-1.5"
                            placeholder="City, Country"
                            />
                        ) : (
                            <span className="truncate">{userInfo.location || 'No location set'}</span>
                        )}
                    </div>
                    {isEditing ? (
                        <select 
                            value={userInfo.address.privacy}
                            onChange={(e) => handlePrivacyChange('address', e.target.value as PrivacyLevel)}
                            className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-slate-50 focus:outline-none focus:border-primary-500"
                        >
                            <option value="PUBLIC">Public</option>
                            <option value="FRIENDS">Friends</option>
                            <option value="CLOSE_FRIENDS">Close Friends</option>
                            <option value="PRIVATE">Only Me</option>
                        </select>
                    ) : (
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded">
                            {getPrivacyIcon(userInfo.address.privacy)}
                            <span>{getPrivacyLabel(userInfo.address.privacy)}</span>
                        </div>
                    )}
                    </div>
                    
                    {/* Birthday */}
                    <div className="flex items-center justify-between group">
                    <div className="flex items-center gap-3 text-sm text-slate-600 flex-1 mr-4">
                        <Calendar size={18} className="text-slate-400 shrink-0" />
                        {isEditing ? (
                            <Input 
                            value={userInfo.birthday} 
                            onChange={(e) => setUserInfo({...userInfo, birthday: e.target.value})} 
                            className="py-1.5"
                            placeholder="DD/MM/YYYY"
                            />
                        ) : (
                            <span className="truncate">{userInfo.birthday || 'No birthday set'}</span>
                        )}
                    </div>
                    </div>
                    
                </div>
            </div>

        </div>

        <div className="mt-8 flex flex-wrap gap-2">
            {userInfo.tags.map(tag => <Badge key={tag}>{tag}</Badge>)}
        </div>
      </Card>

    </div>
  );
};

export default Profile;