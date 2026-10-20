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
import {
  currentUser as initialCurrentUser,
  sampleConversations,
  sampleMessages,
  sampleStories,
} from '../data/mockData';

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';

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
  const [conversations, setConversations] = useState<Conversation[]>(sampleConversations);
  const [messages, setMessages] = useState<Record<string, Message[]>>(sampleMessages);
  const [activeStoryId, setActiveStoryId] = useState<string | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isNewChatOpen, setIsNewChatOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<ConversationFilter>('all');
  const [currentUser, setCurrentUser] = useState<UserProfile>(initialCurrentUser);
  const [stories, setStories] = useState<Story[]>(sampleStories);
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
  // Helper: Fetch Profile for user
  // ----------------------------------------------------------------------------
  const fetchUserProfile = useCallback(async (userId: string, email?: string): Promise<UserProfile> => {
    if (!supabase) return initialCurrentUser;

    const { data, error } = await (supabase.from('profiles') as any)
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
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
          };
        })
        .filter((c): c is Conversation => c !== null);

      setConversations(mapped);

      // Auto-select first conversation if none active
      setActiveConversationId((currentActive) => {
        if (!currentActive && mapped.length > 0) {
          return mapped[0].id;
        }
        return currentActive;
      });
    } catch (err) {
      console.error('Error refreshing conversations:', err);
    }
  }, []);

  // ----------------------------------------------------------------------------
  // Fetch Messages for Conversation
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
        } | null;
      }>;

      const formattedMessages: Message[] = rawMsgs.map((m) => {
        const isOut = m.sender_id === uid;
        const senderName = isOut ? 'You' : m.profiles?.full_name || m.profiles?.username || 'Peer';
        const senderAvatar = m.profiles?.avatar_url || DEFAULT_AVATAR;

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
  // Realtime WebSocket Subscription
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
          setConversations((prev) =>
            prev.map((c) =>
              c.id === convId
                ? {
                    ...c,
                    lastMessage: newRow.content,
                    lastMessageTime: 'Just now',
                  }
                : c
            )
          );
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
        setCurrentUser(initialCurrentUser);
        setConversations(sampleConversations);
        setMessages(sampleMessages);
        setActiveConversationId('conv_1');
        setActiveScreen('welcome');
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserProfile, refreshConversations]);

  // ----------------------------------------------------------------------------
  // Actions: Sign In, Sign Up, Sign Out
  // ----------------------------------------------------------------------------
  const signInWithEmail = async (email: string, password: string): Promise<{ error: string | null }> => {
    if (!supabase) {
      return { error: 'Supabase client is not configured. Check .env.local.' };
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
    if (!supabase) {
      return { error: 'Supabase client is not configured. Check .env.local.' };
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
    if (supabase && isSupabaseActive) {
      await supabase.auth.signOut();
    }
    setSupabaseSession(null);
    setSupabaseUser(null);
    setCurrentUser(initialCurrentUser);
    setConversations(sampleConversations);
    setMessages(sampleMessages);
    setActiveConversationId('conv_1');
    setActiveScreen('welcome');
  };

  // ----------------------------------------------------------------------------
  // Actions: User Search & Starting 1-on-1 Direct Chat
  // ----------------------------------------------------------------------------
  const searchUsers = useCallback(async (queryStr: string): Promise<UserProfile[]> => {
    if (!supabase || !isSupabaseActiveRef.current) {
      // Return demo users for preview
      const q = queryStr.toLowerCase();
      const mockProfiles: UserProfile[] = [
        {
          id: 'mock_1',
          username: 'lyra.vance',
          displayName: 'Lyra Vance',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          bio: 'Quantum Cryptography Architect',
          status: 'online',
          isVerified: true,
        },
        {
          id: 'mock_2',
          username: 'zenith.pulse',
          displayName: 'Zenith',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
          bio: 'Mesh Security operative',
          status: 'away',
        },
        {
          id: 'mock_3',
          username: 'kael.solis',
          displayName: 'Kael Solis',
          avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
          bio: 'Cyber Drift Champion',
          status: 'online',
          isVerified: true,
        },
      ];
      if (!q.trim()) return mockProfiles;
      return mockProfiles.filter(
        (u) => u.displayName.toLowerCase().includes(q) || u.username.toLowerCase().includes(q)
      );
    }

    const uid = currentUserIdRef.current;
    let req = (supabase.from('profiles') as any)
      .select('id, username, full_name, avatar_url, bio, status_indicator, is_verified')
      .limit(20);

    if (uid) {
      req = req.neq('id', uid);
    }

    if (queryStr.trim()) {
      req = req.or(`username.ilike.%${queryStr.trim()}%,full_name.ilike.%${queryStr.trim()}%`);
    }

    const { data, error } = await req;
    if (error) {
      console.error('Search users error:', error);
      throw new Error(error.message);
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
      if (!supabase || !isSupabaseActiveRef.current) {
        // Fallback for demo mode
        const demoConvId = `conv_demo_${Date.now()}`;
        const newDemoConv: Conversation = {
          id: demoConvId,
          title: `Peer ${otherUserId.slice(0, 4)}`,
          avatar: DEFAULT_AVATAR,
          type: 'direct',
          lastMessage: 'Direct encrypted channel opened',
          lastMessageTime: 'Just now',
          unreadCount: 0,
          isOnline: true,
          statusText: 'Online on mesh',
        };
        setConversations((prev) => [newDemoConv, ...prev]);
        setActiveConversationId(demoConvId);
        setMobileShowChat(true);
        return demoConvId;
      }

      // Call atomic RPC get_or_create_direct_conversation
      const { data: convId, error } = await (supabase.rpc as any)(
        'get_or_create_direct_conversation',
        { other_user_id: otherUserId }
      );

      if (error || !convId) {
        console.error('Failed to get/create direct conversation:', error);
        throw new Error(error?.message || 'Could not start conversation');
      }

      const cleanConvId = String(convId);

      // Refresh conversations list to include new conversation
      await refreshConversations();

      // Set as active
      setActiveConversationId(cleanConvId);
      setMobileShowChat(true);

      return cleanConvId;
    },
    [refreshConversations]
  );

  // ----------------------------------------------------------------------------
  // Action: Send Message
  // ----------------------------------------------------------------------------
  const sendMessage = async (
    conversationId: string,
    content: string,
    attachments?: Attachment[]
  ) => {
    if (!content.trim() && (!attachments || attachments.length === 0)) return;

    const trimmedContent = content.trim();
    const now = new Date();
    const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;

    const optimisticMessage: Message = {
      id: tempId,
      conversationId,
      senderId: currentUser.id,
      senderName: currentUser.displayName,
      senderAvatar: currentUser.avatar,
      content: trimmedContent,
      timestamp: timeFormatted,
      status: 'sending',
      isOutgoing: true,
      attachments,
    };

    // Optimistically append message to state
    setMessages((prev) => ({
      ...prev,
      [conversationId]: [...(prev[conversationId] || []), optimisticMessage],
    }));

    // Optimistically update conversation in list
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

    // If Supabase is active, persist to PostgreSQL
    if (isSupabaseActive && supabase) {
      try {
        const { data, error } = await (supabase.from('messages') as any)
          .insert({
            conversation_id: conversationId,
            sender_id: currentUser.id,
            content: trimmedContent,
            attachments: attachments || [],
          })
          .select('id, created_at')
          .single();

        if (error) {
          console.error('Error inserting message into Supabase:', error);
          setMessages((prev) => ({
            ...prev,
            [conversationId]: (prev[conversationId] || []).map((m) =>
              m.id === tempId ? { ...m, status: 'sent' } : m
            ),
          }));
          return;
        }

        const realRow = data as { id: string; created_at: string };

        // Replace tempId with real UUID from PostgreSQL
        setMessages((prev) => ({
          ...prev,
          [conversationId]: (prev[conversationId] || []).map((m) =>
            m.id === tempId
              ? {
                  ...m,
                  id: realRow.id,
                  status: 'delivered',
                  timestamp: formatMessageTime(realRow.created_at),
                }
              : m
          ),
        }));
      } catch (err) {
        console.error('Send message exception:', err);
      }
    } else {
      // Demo mode: mark as delivered
      setTimeout(() => {
        setMessages((prev) => ({
          ...prev,
          [conversationId]: (prev[conversationId] || []).map((m) =>
            m.id === tempId ? { ...m, status: 'delivered' } : m
          ),
        }));
      }, 300);
    }
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
