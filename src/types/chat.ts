export type StatusType = 'online' | 'away' | 'busy' | 'offline';

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  bio: string;
  status: StatusType;
  customStatus?: string;
  isVerified?: boolean;
  phone?: string;
  email?: string;
}

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read';

export interface Reaction {
  emoji: string;
  count: number;
  users: string[]; // usernames
}

export interface Attachment {
  id: string;
  name: string;
  type: 'image' | 'code' | 'document' | 'audio';
  url: string;
  size?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  timestamp: string; // ISO or formatted
  status: MessageStatus;
  isOutgoing: boolean;
  reactions?: Reaction[];
  attachments?: Attachment[];
  replyTo?: {
    id: string;
    senderName: string;
    text: string;
  };
}

export interface Conversation {
  id: string;
  title: string;
  avatar: string;
  type: 'direct' | 'group' | 'channel';
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isOnline?: boolean;
  isTyping?: boolean;
  pinned?: boolean;
  statusText?: string;
  memberCount?: number;
  members?: UserProfile[];
}

export interface StoryItem {
  id: string;
  mediaUrl: string;
  caption?: string;
  timestamp: string;
  durationSeconds?: number;
}

export interface Story {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  userHandle: string;
  items: StoryItem[];
  hasUnread: boolean;
  lastUpdated: string;
}

export type ConversationFilter = 'all' | 'direct' | 'groups' | 'unread';

export type ActiveScreen = 'welcome' | 'signup' | 'app';

export type AppView = 'chat' | 'arcade';
