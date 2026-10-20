/**
 * Supabase Database TypeScript Definitions for TECHNOVIX Chat
 * Synchronized with supabase/schema.sql and Supabase JS v2
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          full_name: string;
          avatar_url: string | null;
          bio: string | null;
          status_indicator: 'online' | 'busy' | 'away' | 'offline';
          custom_status: string | null;
          is_verified: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          full_name: string;
          avatar_url?: string | null;
          bio?: string | null;
          status_indicator?: 'online' | 'busy' | 'away' | 'offline';
          custom_status?: string | null;
          is_verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          full_name?: string;
          avatar_url?: string | null;
          bio?: string | null;
          status_indicator?: 'online' | 'busy' | 'away' | 'offline';
          custom_status?: string | null;
          is_verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      conversations: {
        Row: {
          id: string;
          title: string | null;
          type: 'direct' | 'group' | 'channel';
          avatar_url: string | null;
          created_by: string | null;
          direct_key: string | null;
          last_message_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title?: string | null;
          type?: 'direct' | 'group' | 'channel';
          avatar_url?: string | null;
          created_by?: string | null;
          direct_key?: string | null;
          last_message_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string | null;
          type?: 'direct' | 'group' | 'channel';
          avatar_url?: string | null;
          created_by?: string | null;
          direct_key?: string | null;
          last_message_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      conversation_participants: {
        Row: {
          conversation_id: string;
          profile_id: string;
          role: 'owner' | 'admin' | 'member';
          last_read_at: string;
          joined_at: string;
        };
        Insert: {
          conversation_id: string;
          profile_id: string;
          role?: 'owner' | 'admin' | 'member';
          last_read_at?: string;
          joined_at?: string;
        };
        Update: {
          conversation_id?: string;
          profile_id?: string;
          role?: 'owner' | 'admin' | 'member';
          last_read_at?: string;
          joined_at?: string;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          message_type: 'text' | 'image' | 'file' | 'audio' | 'system';
          attachments: Json;
          is_edited: boolean;
          deleted_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          message_type?: 'text' | 'image' | 'file' | 'audio' | 'system';
          attachments?: Json;
          is_edited?: boolean;
          deleted_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          sender_id?: string;
          content?: string;
          message_type?: 'text' | 'image' | 'file' | 'audio' | 'system';
          attachments?: Json;
          is_edited?: boolean;
          deleted_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_or_create_direct_conversation: {
        Args: {
          other_user_id: string;
        };
        Returns: string;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
