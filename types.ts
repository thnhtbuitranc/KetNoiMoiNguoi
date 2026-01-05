export enum Language {
  VI = 'VI',
  EN = 'EN'
}

export enum Theme {
  LIGHT = 'light',
  DARK = 'dark'
}

export enum RelationshipTier {
  ACQUAINTANCE = 1, // Biết - quen
  CASUAL = 2,       // Bạn xã giao
  FRIEND = 3,       // Bạn thân
  FAMILY = 4,       // Gia đình / Người quan trọng
  SOULMATE = 5      // Tri kỷ / Inner Circle
}

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  qrCode: string; // Base64 or URL
  publicInfo: {
    email?: string;
    socials?: string[];
  };
  privateInfo: {
    phone?: string;
    address?: string;
    notes?: string;
  };
}

export interface Connection {
  id: string;
  name: string;
  nickname?: string; // Added nickname
  avatar: string;
  tier: RelationshipTier;
  tags?: string[]; // Added tags
  lastInteraction: string; // ISO Date
  birthday?: string;
  memoriesCount: number;
  source: 'APP' | 'MANUAL';
  role?: string;
  phone?: string;
  location?: string;
}

export interface Memory {
  id: string;
  title: string;
  date: string;
  type: 'PHOTO' | 'VIDEO' | 'NOTE' | 'VOICE';
  url?: string;
  content?: string;
}

export interface DriveItem {
  id: string;
  name: string;
  type: 'FOLDER' | 'IMAGE' | 'DOC';
  size: string;
  sharedWith: string[]; // User IDs
}