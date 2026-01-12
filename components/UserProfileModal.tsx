import React, { useEffect, useState } from 'react';
import { Modal, Button, Badge, Card, Input } from './ui';
import { supabase, logDbOperation } from '../services/supabase';
import { Mail, MapPin, Briefcase, GraduationCap, Home, Gamepad2, Calendar, ShieldCheck, Copy, Loader2, HeartHandshake, Link as LinkIcon, CheckCircle2 } from 'lucide-react';
import { Connection } from '../types';

interface UserProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    connection?: Connection | null;
    userId?: string | null; // Allow direct lookup by User ID
    onUpdate?: () => void; // Callback to refresh parent list
}

// Structure for detailed school info (Read Only)
interface SchoolInfo {
    name: string;
    classes: string;
    teachers: string;
    years: string;
}

interface DetailedInfo {
    preschool?: SchoolInfo;
    primarySchool?: SchoolInfo;
    secondarySchool?: SchoolInfo;
    highSchool?: SchoolInfo;
    university?: SchoolInfo;
    highSchoolStream?: string;
    major?: string;
    company?: string;
    organization?: string;
    officeBranch?: string;
    partTimeJob?: string;
    internship?: string;
    hometown?: string;
    neighborhood?: string;
    dorm?: string;
    apartment?: string;
    rentalHouse?: string;
    clubs?: string;
    games?: string;
}

const ReadOnlySchoolBlock = ({ label, data }: { label: string, data?: SchoolInfo | string }) => {
    // Normalize data
    const safeData: SchoolInfo = (typeof data === 'object' && data !== null) 
        ? data 
        : { name: typeof data === 'string' ? data : '', classes: '', teachers: '', years: '' };

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
};

const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose, connection, userId, onUpdate }) => {
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Link Profile State
    const [linkId, setLinkId] = useState("");
    const [linking, setLinking] = useState(false);

    useEffect(() => {
        if (isOpen) {
            initialize();
        } else {
            setProfile(null);
            setError(null);
            setLinkId("");
        }
    }, [isOpen, connection, userId]);

    const initialize = async () => {
        setLoading(true);
        let targetId = userId;

        // If no direct User ID, try to get it from Connection
        if (!targetId && connection) {
            targetId = connection.linked_user_id;

            // CRITICAL FIX: If frontend data is stale (null) but DB might have it, fetch fresh
            if (!targetId && connection.id) {
                try {
                    const { data } = await supabase
                        .from('connections')
                        .select('linked_user_id')
                        .eq('id', connection.id)
                        .single();
                    
                    if (data?.linked_user_id) {
                        targetId = data.linked_user_id;
                    }
                } catch (e) {
                    console.error("Error refreshing connection link:", e);
                }
            }
        }

        if (targetId) {
            await fetchProfile(targetId);
        } else {
            // Not linked
            setProfile(null);
            setLoading(false);
            setError(null);
        }
    };

    const fetchProfile = async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            logDbOperation('UserProfile', 'Fetching profile...', { target_id: id });
            
            // 1. Get Current User
            const { data: { user } } = await supabase.auth.getUser();
            const viewerId = user?.id;

            // 2. Fetch Profile Directly
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', id)
                .single();

            if (profileError) throw profileError;
            if (!profileData) {
                setError("Không tìm thấy thông tin người dùng.");
                setLoading(false);
                return;
            }

            // 3. Determine Relationship Tier
            let tier = 0;
            if (viewerId && viewerId !== id) {
                const { data: connData } = await supabase
                    .from('connections')
                    .select('tier')
                    .eq('user_id', viewerId)
                    .eq('linked_user_id', id)
                    .single();
                
                if (connData) tier = connData.tier;
            } else if (viewerId === id) {
                tier = 999; // Owner
            }

            // 4. Apply Privacy Filtering (Client Side)
            const privacy = profileData.privacy_settings || {};
            const rawDetails = profileData.detailed_info || {};
            
            // Helper to check access
            const canView = (settingKey: string, defaultVal: string) => {
                const level = privacy[settingKey] || defaultVal;
                if (viewerId === id) return true; // Owner always sees
                if (level === 'PUBLIC') return true;
                if (level === 'FRIENDS' && tier >= 1) return true;
                if (level === 'CLOSE_FRIENDS' && tier >= 3) return true;
                // PRIVATE is false
                return false;
            };

            // Construct safe profile object
            const safeProfile: any = {
                id: profileData.id,
                name: profileData.name, // Name always public
                avatar_url: profileData.avatar_url, // Avatar always public
                cover_url: profileData.cover_url, // Cover always public
                role: profileData.role, // Role usually public or basic info
                bio: profileData.bio, // Bio explicitly public per requirement
                unique_id: profileData.unique_id, // ID is public for connection
                detailed_info: {} 
            };

            // Basic Fields
            if (canView('email', 'PRIVATE')) safeProfile.email = profileData.email;
            if (canView('job', 'PUBLIC')) safeProfile.job = profileData.job;
            if (canView('education', 'FRIENDS')) safeProfile.education = profileData.education;
            if (canView('skills', 'PUBLIC')) safeProfile.skills = profileData.skills;
            if (canView('hobbies', 'FRIENDS')) safeProfile.hobbies = profileData.hobbies;
            if (canView('address', 'CLOSE_FRIENDS')) safeProfile.location = profileData.location; // Mapping address -> location
            
            // Birthday: Default to FRIENDS (Tier 1+)
            if (viewerId === id || tier >= 1) safeProfile.birthday = profileData.birthday;

            // Detailed Info reconstruction
            const allowedDetails: any = {};

            // Education
            if (canView('detailed_education', 'FRIENDS')) {
                ['preschool', 'primarySchool', 'secondarySchool', 'highSchool', 'university', 'highSchoolStream', 'major'].forEach(k => {
                    if (rawDetails[k]) allowedDetails[k] = rawDetails[k];
                });
            }
            
            // Work
            if (canView('detailed_work', 'PUBLIC')) {
                ['company', 'organization', 'officeBranch', 'partTimeJob', 'internship'].forEach(k => {
                    if (rawDetails[k]) allowedDetails[k] = rawDetails[k];
                });
            }

            // Living
            if (canView('detailed_living', 'CLOSE_FRIENDS')) {
                ['hometown', 'neighborhood', 'dorm', 'apartment', 'rentalHouse'].forEach(k => {
                    if (rawDetails[k]) allowedDetails[k] = rawDetails[k];
                });
            }

            // Activities
            if (canView('detailed_activities', 'FRIENDS')) {
                ['clubs', 'games'].forEach(k => {
                    if (rawDetails[k]) allowedDetails[k] = rawDetails[k];
                });
            }

            safeProfile.detailed_info = allowedDetails;
            setProfile(safeProfile);

        } catch (err: any) {
            console.error("Fetch Profile Error:", err);
            setError("Không thể tải thông tin chi tiết.");
        } finally {
            setLoading(false);
        }
    };

    const handleLinkProfile = async () => {
        if (!linkId.trim() || !connection) return;
        setLinking(true);
        try {
            // 1. Find profile by Unique ID
            const { data: targetProfile, error: findError } = await supabase
                .from('profiles')
                .select('id, name')
                .eq('unique_id', linkId.trim().toUpperCase())
                .single();

            if (findError || !targetProfile) {
                alert("Không tìm thấy người dùng với ID này.");
                setLinking(false);
                return;
            }

            // 2. Update Connection
            const { error: updateError } = await supabase
                .from('connections')
                .update({ 
                    linked_user_id: targetProfile.id,
                    source: 'APP'
                })
                .eq('id', connection.id);

            if (updateError) throw updateError;

            // 3. Refresh Profile View & Parent List
            alert(`Đã liên kết thành công với ${targetProfile.name}!`);
            
            // Call parent update if provided
            if (onUpdate) onUpdate();
            
            // Fetch immediately to show data
            fetchProfile(targetProfile.id);

        } catch (err: any) {
            alert("Lỗi liên kết: " + err.message);
        } finally {
            setLinking(false);
        }
    };

    if (!isOpen) return null;

    // Helper to render simple row
    const InfoRow = ({ icon: Icon, value, label }: { icon: any, value?: string, label?: string }) => {
        if (!value) return null;
        return (
            <div className="flex items-center gap-3 text-sm text-slate-600 mb-3 last:mb-0">
                <Icon size={18} className="text-slate-400 shrink-0" />
                <div className="flex flex-col">
                    <span className="font-medium text-slate-800">{value}</span>
                    {label && <span className="text-xs text-slate-400">{label}</span>}
                </div>
            </div>
        );
    };

    const detailedInfo = (profile?.detailed_info || {}) as DetailedInfo;
    
    // Construct display data with fallbacks
    // Priority: Profile (Fetched) > Connection (Local) > Defaults
    const displayData = {
        name: profile?.name || connection?.name || 'Unknown',
        role: profile?.role || connection?.role || 'User',
        location: profile?.location || connection?.location,
        avatar: profile?.avatar_url || connection?.avatar || `https://ui-avatars.com/api/?background=random`,
        cover: profile?.cover_url,
        bio: profile?.bio,
        unique_id: profile?.unique_id,
        email: profile?.email,
        job: profile?.job,
        birthday: profile?.birthday || connection?.birthday,
        skills: profile?.skills,
        hobbies: profile?.hobbies
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Hồ sơ người dùng" maxWidth="max-w-4xl">
            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary-600" size={32} /></div>
            ) : (
                <div className="space-y-6">
                    {/* Header Card */}
                    <div className="relative">
                        {/* Cover */}
                        <div 
                            className={`h-32 md:h-48 rounded-xl relative bg-cover bg-center ${!displayData.cover ? 'bg-gradient-to-r from-slate-200 to-slate-300' : ''}`}
                            style={displayData.cover ? { backgroundImage: `url("${displayData.cover}")` } : {}}
                        ></div>
                        
                        <div className="px-6 relative -mt-12 flex flex-col md:flex-row items-center md:items-end gap-4 text-center md:text-left">
                            <div className="relative">
                                <img 
                                    src={displayData.avatar} 
                                    className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-[4px] border-white shadow-lg bg-white" 
                                />
                            </div>
                            <div className="mb-2 flex-1">
                                <h2 className="text-2xl font-bold text-slate-900">{displayData.name}</h2>
                                <p className="text-slate-500 text-sm font-medium">{displayData.role} {displayData.location ? `• ${displayData.location}` : ''}</p>
                            </div>
                        </div>
                    </div>

                    {/* Bio */}
                    {displayData.bio && (
                        <div className="px-2">
                            <p className="text-sm text-slate-600 italic border-l-4 border-primary-200 pl-4 py-1 bg-slate-50 rounded-r-lg">
                                "{displayData.bio}"
                            </p>
                        </div>
                    )}
                    
                    {error && (
                        <div className="mx-2 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-center gap-2">
                            <ShieldCheck size={16} /> {error}
                        </div>
                    )}

                    {/* FIX: Link Profile Section (Visible only if no profile loaded and viewing a connection) */}
                    {!profile && connection && (
                        <div className="mx-2 p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
                            <div className="flex-1">
                                <h4 className="font-bold text-indigo-800 text-sm flex items-center gap-2">
                                    <LinkIcon size={16} /> Chưa liên kết hồ sơ
                                </h4>
                                <p className="text-xs text-indigo-600 mt-1">
                                    Người liên hệ này chưa được liên kết với tài khoản người dùng thực tế. Nhập <strong>ID Kết Bạn</strong> của họ để xem đầy đủ thông tin chi tiết.
                                </p>
                            </div>
                            <div className="flex items-center gap-2 w-full md:w-auto">
                                <Input 
                                    placeholder="ID (VD: 2WQP7GY3)" 
                                    value={linkId}
                                    onChange={(e) => setLinkId(e.target.value.toUpperCase())}
                                    className="bg-white text-sm h-9 uppercase font-mono"
                                    maxLength={8}
                                />
                                <Button size="sm" onClick={handleLinkProfile} disabled={linking} className="whitespace-nowrap h-9 bg-indigo-600 hover:bg-indigo-700">
                                    {linking ? <Loader2 className="animate-spin" size={14} /> : 'Liên kết'}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Main Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* Column 1: Basic & Contact */}
                        <div className="space-y-6">
                            <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
                                <h4 className="text-xs font-bold text-slate-400 uppercase mb-4 flex items-center gap-2">
                                    <HeartHandshake size={14} /> Thông tin liên hệ
                                </h4>
                                <div className="space-y-1">
                                    {/* ID (Only if profile loaded) */}
                                    {displayData.unique_id && (
                                        <div className="flex items-center justify-between mb-3 bg-indigo-50 p-2 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-indigo-500 uppercase">ID</span>
                                                <span className="font-mono font-bold text-indigo-700">{displayData.unique_id}</span>
                                            </div>
                                            <button onClick={() => { navigator.clipboard.writeText(displayData.unique_id!); alert('Copied ID!'); }} className="text-indigo-400 hover:text-indigo-600">
                                                <Copy size={14} />
                                            </button>
                                        </div>
                                    )}

                                    <InfoRow icon={Mail} value={displayData.email} label="Email" />
                                    <InfoRow icon={Briefcase} value={displayData.job} label="Công việc" />
                                    <InfoRow icon={MapPin} value={displayData.location} label="Địa chỉ" />
                                    <InfoRow icon={Calendar} value={displayData.birthday} label="Sinh nhật" />
                                    
                                    {/* Fallback phone from connection if private */}
                                    {!displayData.email && connection?.phone && (
                                        <InfoRow icon={Mail} value={connection.phone} label="Điện thoại (Đã lưu)" />
                                    )}
                                </div>
                                
                                {!displayData.email && !displayData.job && !displayData.location && !displayData.birthday && !connection?.phone && (
                                    <p className="text-xs text-slate-400 italic text-center py-2">Không có thông tin hiển thị.</p>
                                )}
                            </div>

                            {/* Skills & Hobbies */}
                            <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
                                <h4 className="text-xs font-bold text-slate-400 uppercase mb-4">Sở thích & Kỹ năng</h4>
                                {displayData.skills && (
                                    <div className="mb-4">
                                        <span className="text-xs font-semibold text-slate-500 block mb-1">Kỹ năng:</span>
                                        <p className="text-sm text-slate-700">{displayData.skills}</p>
                                    </div>
                                )}
                                {displayData.hobbies && (
                                    <div>
                                        <span className="text-xs font-semibold text-slate-500 block mb-1">Sở thích:</span>
                                        <p className="text-sm text-slate-700">{displayData.hobbies}</p>
                                    </div>
                                )}
                                {!displayData.skills && !displayData.hobbies && (
                                    <p className="text-xs text-slate-400 italic text-center">Trống</p>
                                )}
                            </div>
                        </div>

                        {/* Column 2: Detailed Info */}
                        <div className="space-y-6">
                            
                            {/* Education */}
                            <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
                                <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex items-center gap-2">
                                    <GraduationCap className="text-indigo-600" size={16} />
                                    <h4 className="font-bold text-slate-800 text-xs uppercase">Học Vấn</h4>
                                </div>
                                <div className="p-4 space-y-2">
                                    <ReadOnlySchoolBlock label="Đại học" data={detailedInfo.university} />
                                    <ReadOnlySchoolBlock label="Cấp 3" data={detailedInfo.highSchool} />
                                    <ReadOnlySchoolBlock label="Cấp 2" data={detailedInfo.secondarySchool} />
                                    <ReadOnlySchoolBlock label="Cấp 1" data={detailedInfo.primarySchool} />
                                    {detailedInfo.major && <div className="text-sm"><span className="font-semibold text-slate-700">Chuyên ngành:</span> {detailedInfo.major}</div>}
                                    
                                    {!detailedInfo.university && !detailedInfo.highSchool && !detailedInfo.major && (
                                        <p className="text-xs text-slate-400 italic text-center">Chưa cập nhật thông tin.</p>
                                    )}
                                </div>
                            </div>

                            {/* Work & Organization - NEW SECTION */}
                            <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
                                <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex items-center gap-2">
                                    <Briefcase className="text-blue-600" size={16} />
                                    <h4 className="font-bold text-slate-800 text-xs uppercase">Công Việc & Tổ Chức</h4>
                                </div>
                                <div className="p-4 grid grid-cols-1 gap-2 text-sm">
                                    {detailedInfo.company && <div><span className="font-semibold text-slate-700">Công ty:</span> {detailedInfo.company}</div>}
                                    {detailedInfo.officeBranch && <div><span className="font-semibold text-slate-700">Chi nhánh:</span> {detailedInfo.officeBranch}</div>}
                                    {detailedInfo.organization && <div><span className="font-semibold text-slate-700">Tổ chức:</span> {detailedInfo.organization}</div>}
                                    {detailedInfo.partTimeJob && <div><span className="font-semibold text-slate-700">Làm thêm:</span> {detailedInfo.partTimeJob}</div>}
                                    {detailedInfo.internship && <div><span className="font-semibold text-slate-700">Thực tập:</span> {detailedInfo.internship}</div>}
                                    
                                    {!detailedInfo.company && !detailedInfo.officeBranch && !detailedInfo.organization && !detailedInfo.partTimeJob && !detailedInfo.internship && (
                                        <p className="text-xs text-slate-400 italic text-center">Chưa cập nhật thông tin.</p>
                                    )}
                                </div>
                            </div>

                            {/* Living & Hometown - SEPARATED */}
                            <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
                                <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex items-center gap-2">
                                    <Home className="text-orange-500" size={16} />
                                    <h4 className="font-bold text-slate-800 text-xs uppercase">Nơi Ở & Quê Quán</h4>
                                </div>
                                <div className="p-4 grid grid-cols-1 gap-2 text-sm">
                                    {detailedInfo.hometown && <div><span className="font-semibold text-slate-700">Quê quán:</span> {detailedInfo.hometown}</div>}
                                    {detailedInfo.neighborhood && <div><span className="font-semibold text-slate-700">Khu vực:</span> {detailedInfo.neighborhood}</div>}
                                    {detailedInfo.apartment && <div><span className="font-semibold text-slate-700">Chung cư:</span> {detailedInfo.apartment}</div>}
                                    {detailedInfo.dorm && <div><span className="font-semibold text-slate-700">KTX/Trọ:</span> {detailedInfo.dorm}</div>}
                                    
                                    {!detailedInfo.hometown && !detailedInfo.neighborhood && !detailedInfo.apartment && !detailedInfo.dorm && (
                                        <p className="text-xs text-slate-400 italic text-center">Chưa cập nhật thông tin.</p>
                                    )}
                                </div>
                            </div>

                             {/* Activities */}
                             <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
                                <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex items-center gap-2">
                                    <Gamepad2 className="text-purple-500" size={16} />
                                    <h4 className="font-bold text-slate-800 text-xs uppercase">Hoạt động</h4>
                                </div>
                                <div className="p-4 grid grid-cols-1 gap-2 text-sm">
                                    {detailedInfo.clubs && <div><span className="font-semibold text-slate-700">CLB:</span> {detailedInfo.clubs}</div>}
                                    {detailedInfo.games && <div><span className="font-semibold text-slate-700">Game:</span> {detailedInfo.games}</div>}
                                    
                                    {!detailedInfo.clubs && !detailedInfo.games && (
                                        <p className="text-xs text-slate-400 italic text-center">Chưa cập nhật thông tin.</p>
                                    )}
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            )}
        </Modal>
    );
};

export default UserProfileModal;