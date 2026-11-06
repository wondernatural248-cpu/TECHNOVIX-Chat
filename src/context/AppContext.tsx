import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import {
  ActiveScreen,
  AppView,
  Attachment,
  Conversation,
  ConversationFilter,
  Message,
  Story,
  UserProfile,
} from '../types/chat';
import { initialStories } from '../data/stories';

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';

const defaultEmptyUser: UserProfile = {
  id: '',
  username: '',
  displayName: '',
  avatar: DEFAULT_AVATAR,
  bio: '',
  status: 'offline',
};

const formatMessageTime = (isoString?: string): string => {
  if (!isoString) return 'Just now';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return 'Just now';
  }
};

const formatRelativeTime = (isoString?: string): string => {
  if (!isoString) return 'Just now';
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch {
    return 'Recently';
  }
};

interface RawConversation {
  id: string;
  title: string | null;
  type: 'direct' | 'group' | 'channel';
  avatar_url: string | null;
  last_message_at: string;
  created_at: string;
  updated_at: string;
}

interface RawParticipant {
  conversation_id: string;
  profile_id: string;
  role: 'owner' | 'admin' | 'member';
  profiles: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string | null;
    bio: string | null;
    status_indicator: string;
  } | null;
}

interface AppContextType {
  activeScreen: ActiveScreen;
  setActiveScreen: (screen: ActiveScreen) => void;
  activeView: AppView;
  setActiveView: (view: AppView) => void;
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
  conversations: Conversation[];
  messages: Record<string, Message[]>;
  sendMessage: (conversationId: string, content: string, attachments?: Attachment[]) => Promise<void>;
  activeStoryId: string | null;
  setActiveStoryId: (id: string | null) => void;
  isProfileOpen: boolean;
  setIsProfileOpen: (open: boolean) => void;
  isNewChatOpen: boolean;
  setIsNewChatOpen: (open: boolean) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  activeFilter: ConversationFilter;
  setActiveFilter: (filter: ConversationFilter) => void;
  currentUser: UserProfile;
  setCurrentUser: React.Dispatch<React.SetStateAction<UserProfile>>;
  stories: Story[];
  markStoryAsRead: (storyId: string) => void;
  mobileShowChat: boolean;
  setMobileShowChat: (show: boolean) => void;

  // Real Supabase Auth & Realtime states
  isSupabaseConfigured: boolean;
  isSupabaseActive: boolean;
  isAuthLoading: boolean;
  isMessagesLoading: boolean;
  supabaseUser: User | null;
  supabaseSession: Session | null;
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signUpWithEmail: (
    email: string,
    password: string,
    displayName: string,
    username: string,
    avatarUrl?: string
  ) => Promise<{ error: string | null; needsEmailConfirmation?: boolean }>;
  signOut: () => Promise<void>;
  searchUsers: (query: string) => Promise<UserProfile[]>;
  startDirectChat: (otherUserId: string) => Promise<string>;
  refreshConversations: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('welcome');
  const [activeView, setActiveView] = useState<AppView>('chat');
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [activeStoryId, setActiveStoryId] = useState<string | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isNewChatOpen, setIsNewChatOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<ConversationFilter>('all');
  const [currentUser, setCurrentUser] = useState<UserProfile>(defaultEmptyUser);
  const [stories, setStories] = useState<Story[]>(initialStories);
  const [mobileShowChat, setMobileShowChat] = useState<boolean>(false);

  // Supabase state
  const [supabaseSession, setSupabaseSession] = useState<Session | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [isMessagesLoading, setIsMessagesLoading] = useState<boolean>(false);

  const isSupabaseActive = Boolean(isSupabaseConfigured && supabase && supabaseUser);
  const isSupabaseActiveRef = useRef(isSupabaseActive);
  isSupabaseActiveRef.current = isSupabaseActive;

  const currentUserIdRef = useRef<string | null>(supabaseUser?.id || null);
  currentUserIdRef.current = supabaseUser?.id || null;

  // ----------------------------------------------------------------------------
  // Helper: Fetch Profile for user from Supabase PostgreSQL
  // ----------------------------------------------------------------------------
  const fetchUserProfile = useCallback(async (userId: string, email?: string): Promise<UserProfile> => {
    if (!supabase) return defaultEmptyUser;

    const { data, error } = await (supabase.from('profiles') as any)
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile from Supabase:', error);
    }

    const profile = data as {
      id: string;
      username: string;
      full_name: string;
      avatar_url: string | null;
      bio: string | null;
      status_indicator: string;
      custom_status: string | null;
      is_verified: boolean;
    } | null;

    if (profile) {
      return {
        id: profile.id,
        username: profile.username,
        displayName: profile.full_name,
        avatar: profile.avatar_url || DEFAULT_AVATAR,
        bio: profile.bio || 'Cruising the TECHNOVIX neural grid',
        status: (profile.status_indicator as UserProfile['status']) || 'online',
        customStatus: profile.custom_status || undefined,
        isVerified: profile.is_verified,
        email: email || undefined,
      };
    }

    // Fallback if profile row is not yet created by trigger
    const defaultName = email ? email.split('@')[0] : 'Operative';
    const fallbackProfile: UserProfile = {
      id: userId,
      username: defaultName.toLowerCase().replace(/[^a-z0-9]/g, '_'),
      displayName: defaultName,
      avatar: DEFAULT_AVATAR,
      bio: 'Cruising the TECHNOVIX neural grid',
      status: 'online',
      email: email || undefined,
    };

    // Auto-upsert profile if missing
    try {
      await (supabase.from('profiles') as any).upsert({
        id: userId,
        username: fallbackProfile.username,
        full_name: fallbackProfile.displayName,
        avatar_url: fallbackProfile.avatar,
      });
    } catch (e) {
      console.warn('Auto-upsert profile warning:', e);
    }

    return fallbackProfile;
  }, []);

  // ----------------------------------------------------------------------------
  // Fetch Real Conversations from Supabase
  // ----------------------------------------------------------------------------
  const refreshConversations = useCallback(async () => {
    if (!supabase || !currentUserIdRef.current) return;
    const uid = currentUserIdRef.current;

    try {
      // 1. Get all conversation memberships for current user
      const { data: participationsData, error: partErr } = await (supabase
        .from('conversation_participants') as any)
        .select(`
          conversation_id,
          role,
          last_read_at,
          conversations (
            id,
            title,
            type,
            avatar_url,
            last_message_at,
            created_at,
            updated_at
          )
        `)
        .eq('profile_id', uid);

      if (partErr || !participationsData) {
        console.error('Error fetching conversations:', partErr);
        return;
      }

      const participations = participationsData as Array<{
        conversation_id: string;
        role: string;
        last_read_at: string;
        conversations: RawConversation | null;
      }>;

      const convIds = participations.map((p) => p.conversation_id);
      if (convIds.length === 0) {
        setConversations([]);
        return;
      }

      // 2. Fetch all participants for these conversations to resolve contacts
      const { data: allPartsData, error: allPartErr } = await (supabase
        .from('conversation_participants') as any)
        .select(`
          conversation_id,
          profile_id,
          role,
          profiles (
            id,
            username,
            full_name,
            avatar_url,
            bio,
            status_indicator
          )
        `)
        .in('conversation_id', convIds);

      if (allPartErr) {
        console.error('Error fetching participants:', allPartErr);
      }

      const allParticipants = (allPartsData || []) as RawParticipant[];

      // 3. Fetch latest messages for snippet preview
      const { data: latestMsgsData, error: msgErr } = await (supabase
        .from('messages') as any)
        .select('conversation_id, content, created_at, sender_id')
        .in('conversation_id', convIds)
        .order('created_at', { ascending: false });

      if (msgErr) {
        console.error('Error fetching latest messages:', msgErr);
      }

      const latestMsgs = (latestMsgsData || []) as Array<{
        conversation_id: string;
        content: string;
        created_at: string;
        sender_id: string;
      }>;

      // Map to Conversation model
      const mapped: Conversation[] = participations
        .map((p): Conversation | null => {
          const rawConv = p.conversations;
          if (!rawConv) return null;

          const convId = rawConv.id;
          const convParts = allParticipants.filter((ap) => ap.conversation_id === convId);
          const otherPart = convParts.find((ap) => ap.profile_id !== uid);
          const otherProfile = otherPart?.profiles;

          // Find the latest message in this conversation
          const lastMsgObj = latestMsgs.find((m) => m.conversation_id === convId);

          let displayTitle = rawConv.title;
          let displayAvatar = rawConv.avatar_url;
          let isOnline = false;
          let statusText = 'Offline';

          if (rawConv.type === 'direct') {
            displayTitle = otherProfile ? otherProfile.full_name || otherProfile.username : 'Encrypted Peer';
            displayAvatar = otherProfile?.avatar_url || DEFAULT_AVATAR;
            isOnline = otherProfile?.status_indicator === 'online';
            statusText = isOnline ? 'Online on mesh' : 'Encrypted Direct Link';
          } else {
            displayTitle = displayTitle || 'Team Neural Channel';
            displayAvatar = displayAvatar || DEFAULT_AVATAR;
          }

          const convMembers: UserProfile[] = convParts.map((cp) => ({
            id: cp.profile_id,
            username: cp.profiles?.username || '',
            displayName: cp.profiles?.full_name || cp.profiles?.username || 'Operative',
            avatar: cp.profiles?.avatar_url || DEFAULT_AVATAR,
            bio: cp.profiles?.bio || '',
            status: (cp.profiles?.status_indicator as UserProfile['status']) || 'offline',
          }));

          return {
            id: convId,
            title: displayTitle || 'Encrypted Channel',
            avatar: displayAvatar || DEFAULT_AVATAR,
            type: rawConv.type,
            lastMessage: lastMsgObj ? lastMsgObj.content : 'Channel established',
            lastMessageTime: lastMsgObj ? formatRelativeTime(lastMsgObj.created_at) : formatRelativeTime(rawConv.created_at),
            unreadCount: 0,
            isOnline,
            statusText,
            memberCount: convParts.length,
            members: convMembers,
          };
        })
        .filter((c): c is Conversation => c !== null);

      setConversations(mapped);
    } catch (err) {
      console.error('Error refreshing conversations:', err);
    }
  }, []);

  // ----------------------------------------------------------------------------
  // Fetch Messages for Conversation from Supabase PostgreSQL
  // ----------------------------------------------------------------------------
  const fetchMessagesForConversation = useCallback(async (convId: string) => {
    if (!supabase) return;
    setIsMessagesLoading(true);

    try {
      const { data, error } = await (supabase.from('messages') as any)
        .select(`
          id,
          conversation_id,
          sender_id,
          content,
          message_type,
          attachments,
          created_at,
          profiles (
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading messages for conversation:', error);
        setIsMessagesLoading(false);
        return;
      }

      const uid = currentUserIdRef.current;
      const rawMsgs = (data || []) as Array<{
        id: string;
        conversation_id: string;
        sender_id: string;
        content: string;
        message_type: string;
        attachments: unknown;
        created_at: string;
        profiles: {
          id: string;
          username: string;
          full_name: string;
          avatar_url: string | null;
        } | Array<{
          id: string;
          username: string;
          full_name: string;
          avatar_url: string | null;
        }> | null;
      }>;

      const formattedMessages: Message[] = rawMsgs.map((m) => {
        const isOut = m.sender_id === uid;
        const senderProfile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
        const senderName = isOut ? 'You' : senderProfile?.full_name || senderProfile?.username || 'Peer';
        const senderAvatar = senderProfile?.avatar_url || DEFAULT_AVATAR;

        return {
          id: m.id,
          conversationId: m.conversation_id,
          senderId: m.sender_id,
          senderName,
          senderAvatar,
          content: m.content,
          timestamp: formatMessageTime(m.created_at),
          status: 'delivered',
          isOutgoing: isOut,
          attachments: (m.attachments as unknown as Attachment[]) || [],
        };
      });

      setMessages((prev) => ({
        ...prev,
        [convId]: formattedMessages,
      }));
    } catch (err) {
      console.error('Fetch messages exception:', err);
    } finally {
      setIsMessagesLoading(false);
    }
  }, []);

  // Trigger loading messages whenever activeConversationId changes
  useEffect(() => {
    if (isSupabaseActive && activeConversationId) {
      fetchMessagesForConversation(activeConversationId);
    }
  }, [isSupabaseActive, activeConversationId, fetchMessagesForConversation]);

  // ----------------------------------------------------------------------------
  // Realtime WebSocket Subscription (Supabase Realtime)
  // ----------------------------------------------------------------------------
  useEffect(() => {
    const client = supabase;
    if (!isSupabaseConfigured || !client || !supabaseUser) return;

    const channel = client
      .channel('technovix-chat-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        async (payload) => {
          const newRow = payload.new as {
            id: string;
            conversation_id: string;
            sender_id: string;
            content: string;
            message_type: string;
            attachments: unknown;
            created_at: string;
          };

          const convId = newRow.conversation_id;
          const uid = currentUserIdRef.current;
          const isOut = newRow.sender_id === uid;

          let senderName = isOut ? 'You' : 'Peer';
          let senderAvatar = DEFAULT_AVATAR;

          if (!isOut) {
            const { data: p } = await (client.from('profiles') as any)
              .select('full_name, username, avatar_url')
              .eq('id', newRow.sender_id)
              .maybeSingle();

            if (p) {
              senderName = p.full_name || p.username;
              senderAvatar = p.avatar_url || DEFAULT_AVATAR;
            }
          }

          const incomingMsg: Message = {
            id: newRow.id,
            conversationId: convId,
            senderId: newRow.sender_id,
            senderName,
            senderAvatar,
            content: newRow.content,
            timestamp: formatMessageTime(newRow.created_at),
            status: 'delivered',
            isOutgoing: isOut,
            attachments: (newRow.attachments as unknown as Attachment[]) || [],
          };

          // Append to message feed if not already present
          setMessages((prev) => {
            const existing = prev[convId] || [];
            if (existing.some((m) => m.id === newRow.id)) {
              return prev;
            }
            return {
              ...prev,
              [convId]: [...existing, incomingMsg],
            };
          });

          // Update conversation lastMessage & lastMessageTime
          setConversations((prev) => {
            const exists = prev.some((c) => c.id === convId);
            if (!exists) {
              refreshConversations();
              return prev;
            }
            return prev.map((c) =>
              c.id === convId
                ? {
                    ...c,
                    lastMessage: newRow.content,
                    lastMessageTime: 'Just now',
                  }
                : c
            );
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
        },
        () => {
          refreshConversations();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversation_participants',
        },
        () => {
          refreshConversations();
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [supabaseUser, refreshConversations]);

  // ----------------------------------------------------------------------------
  // Supabase Auth Listener & Session Initialization
  // ----------------------------------------------------------------------------
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setIsAuthLoading(false);
      return;
    }

    let isMounted = true;

    // Check existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!isMounted) return;
      if (error) {
        console.error('Error fetching session:', error);
      }
      if (session) {
        setSupabaseSession(session);
        setSupabaseUser(session.user);
        fetchUserProfile(session.user.id, session.user.email).then((prof) => {
          if (isMounted) {
            setCurrentUser(prof);
            setActiveScreen('app');
          }
        });
      }
      setIsAuthLoading(false);
    });

    // Listen to Auth State Changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      if (event === 'SIGNED_IN' && session) {
        setSupabaseSession(session);
        setSupabaseUser(session.user);
        const prof = await fetchUserProfile(session.user.id, session.user.email);
        if (isMounted) {
          setCurrentUser(prof);
          setActiveScreen('app');
          refreshConversations();
        }
      } else if (event === 'SIGNED_OUT') {
        setSupabaseSession(null);
        setSupabaseUser(null);
        setCurrentUser(defaultEmptyUser);
        setConversations([]);
        setMessages({});
        setActiveConversationId(null);
        setActiveScreen('welcome');
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserProfile, refreshConversations]);

  // ----------------------------------------------------------------------------
  // Actions: Sign In, Sign Up, Sign Out (Real Supabase Auth Only)
  // ----------------------------------------------------------------------------
  const signInWithEmail = async (email: string, password: string): Promise<{ error: string | null }> => {
    if (!supabase || !isSupabaseConfigured) {
      return { error: 'Supabase backend is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env.local file.' };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      return { error: error.message };
    }

    if (data.session) {
      setSupabaseSession(data.session);
      setSupabaseUser(data.session.user);
      const prof = await fetchUserProfile(data.session.user.id, data.session.user.email);
      setCurrentUser(prof);
      setActiveScreen('app');
      refreshConversations();
    }

    return { error: null };
  };

  const signUpWithEmail = async (
    email: string,
    password: string,
    displayName: string,
    username: string,
    avatarUrl?: string
  ): Promise<{ error: string | null; needsEmailConfirmation?: boolean }> => {
    if (!supabase || !isSupabaseConfigured) {
      return { error: 'Supabase backend is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env.local file.' };
    }

    const cleanUsername = username.trim() || displayName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const cleanDisplayName = displayName.trim() || cleanUsername;
    const cleanAvatar = avatarUrl || DEFAULT_AVATAR;

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          username: cleanUsername,
          full_name: cleanDisplayName,
          display_name: cleanDisplayName,
          avatar_url: cleanAvatar,
        },
      },
    });

    if (error) {
      return { error: error.message };
    }

    if (data.session) {
      setSupabaseSession(data.session);
      setSupabaseUser(data.session.user);
      const prof = await fetchUserProfile(data.session.user.id, data.session.user.email);
      setCurrentUser(prof);
      setActiveScreen('app');
      refreshConversations();
      return { error: null, needsEmailConfirmation: false };
    }

    // If confirmation email is required by Supabase project settings
    if (data.user && !data.session) {
      return { error: null, needsEmailConfirmation: true };
    }

    return { error: null };
  };

  const signOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setSupabaseSession(null);
    setSupabaseUser(null);
    setCurrentUser(defaultEmptyUser);
    setConversations([]);
    setMessages({});
    setActiveConversationId(null);
    setActiveScreen('welcome');
  };

  // ----------------------------------------------------------------------------
  // Actions: User Search & Starting 1-on-1 Direct Chat (Real Supabase Only)
  // ----------------------------------------------------------------------------
  const searchUsers = useCallback(async (queryStr: string): Promise<UserProfile[]> => {
    const uid = currentUserIdRef.current;
    if (!supabase || !uid) {
      throw new Error('You must be signed in to search registered identities.');
    }

    let req = (supabase.from('profiles') as any)
      .select('id, username, full_name, avatar_url, bio, status_indicator, is_verified')
      .neq('id', uid)
      .limit(30);

    if (queryStr.trim()) {
      req = req.or(`username.ilike.%${queryStr.trim()}%,full_name.ilike.%${queryStr.trim()}%`);
    }

    const { data, error } = await req;
    if (error) {
      console.error('Search users error:', error);
      throw new Error(error.message || 'Failed to search users in Supabase');
    }

    const profiles = (data || []) as Array<{
      id: string;
      username: string;
      full_name: string;
      avatar_url: string | null;
      bio: string | null;
      status_indicator: string;
      is_verified: boolean;
    }>;

    return profiles.map((p) => ({
      id: p.id,
      username: p.username,
      displayName: p.full_name,
      avatar: p.avatar_url || DEFAULT_AVATAR,
      bio: p.bio || '',
      status: (p.status_indicator as UserProfile['status']) || 'online',
      isVerified: p.is_verified,
    }));
  }, []);

  const startDirectChat = useCallback(
    async (otherUserId: string): Promise<string> => {
      const uid = currentUserIdRef.current;
      if (!supabase || !uid) {
        throw new Error('Authentication required to start a conversation.');
      }

      // Check if conversation already exists in active local state
      const existingConv = conversations.find(
        (c) => c.type === 'direct' && c.members?.some((m) => m.id === otherUserId)
      );

      // Call atomic RPC get_or_create_direct_conversation to guarantee database record exists
      const { data: convId, error } = await (supabase.rpc as any)(
        'get_or_create_direct_conversation',
        { other_user_id: otherUserId }
      );

      if (error || !convId) {
        if (existingConv) {
          setActiveConversationId(existingConv.id);
          setMobileShowChat(true);
          return existingConv.id;
        }
        console.error('Failed to get/create direct conversation in Supabase:', error);
        throw new Error(error?.message || 'Could not start conversation in Supabase');
      }

      const cleanConvId = String(convId);

      // Refresh conversations list to include new conversation
      await refreshConversations();

      // Set as active
      setActiveConversationId(cleanConvId);
      setMobileShowChat(true);

      return cleanConvId;
    },
    [conversations, refreshConversations]
  );

  // ----------------------------------------------------------------------------
  // Action: Send Message (Real Supabase PostgreSQL Insert Only)
  // ----------------------------------------------------------------------------
  const sendMessage = async (
    conversationId: string,
    content: string,
    attachments?: Attachment[]
  ) => {
    if (!content.trim() && (!attachments || attachments.length === 0)) return;

    const trimmedContent = content.trim();
    const uid = currentUserIdRef.current;

    if (!supabase || !uid) {
      throw new Error('You must be signed in to Supabase to transmit messages.');
    }

    // Persist to Supabase PostgreSQL table 'messages'
    const { data, error } = await (supabase.from('messages') as any)
      .insert({
        conversation_id: conversationId,
        sender_id: uid,
        content: trimmedContent,
        attachments: attachments || [],
      })
      .select(`
        id,
        conversation_id,
        sender_id,
        content,
        message_type,
        attachments,
        created_at
      `)
      .single();

    if (error || !data) {
      console.error('Error inserting message into Supabase:', error);
      throw new Error(error?.message || 'Failed to transmit message to Supabase.');
    }

    const savedRow = data as {
      id: string;
      conversation_id: string;
      sender_id: string;
      content: string;
      attachments: Attachment[];
      created_at: string;
    };

    const savedMessage: Message = {
      id: savedRow.id,
      conversationId: savedRow.conversation_id,
      senderId: savedRow.sender_id,
      senderName: currentUser.displayName || 'You',
      senderAvatar: currentUser.avatar || DEFAULT_AVATAR,
      content: savedRow.content,
      timestamp: formatMessageTime(savedRow.created_at),
      status: 'delivered',
      isOutgoing: true,
      attachments: (savedRow.attachments as Attachment[]) || [],
    };

    // Append verified saved message to state
    setMessages((prev) => {
      const existing = prev[conversationId] || [];
      if (existing.some((m) => m.id === savedRow.id)) {
        return prev;
      }
      return {
        ...prev,
        [conversationId]: [...existing, savedMessage],
      };
    });

    // Update conversation lastMessage & lastMessageTime
    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId
          ? {
              ...c,
              lastMessage: trimmedContent || 'Sent an attachment',
              lastMessageTime: 'Just now',
            }
          : c
      )
    );
  };

  const markStoryAsRead = (storyId: string) => {
    setStories((prev) =>
      prev.map((s) => (s.id === storyId ? { ...s, hasUnread: false } : s))
    );
  };

  const handleSelectConversation = (id: string | null) => {
    setActiveConversationId(id);
    if (id) {
      setMobileShowChat(true);
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c))
      );
    }
  };

  return (
    <AppContext.Provider
      value={{
        activeScreen,
        setActiveScreen,
        activeView,
        setActiveView,
        activeConversationId,
        setActiveConversationId: handleSelectConversation,
        conversations,
        messages,
        sendMessage,
        activeStoryId,
        setActiveStoryId,
        isProfileOpen,
        setIsProfileOpen,
        isNewChatOpen,
        setIsNewChatOpen,
        searchQuery,
        setSearchQuery,
        activeFilter,
        setActiveFilter,
        currentUser,
        setCurrentUser,
        stories,
        markStoryAsRead,
        mobileShowChat,
        setMobileShowChat,

        // Supabase Auth & Realtime
        isSupabaseConfigured,
        isSupabaseActive,
        isAuthLoading,
        isMessagesLoading,
        supabaseUser,
        supabaseSession,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        searchUsers,
        startDirectChat,
        refreshConversations,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
