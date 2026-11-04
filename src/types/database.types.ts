export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string;
          after: Json | null;
          actor_id: string | null;
          before: Json | null;
          created_at: string;
          entity_id: string | null;
          entity_type: string;
          id: number;
          org_id: string;
          reason: string | null;
        };
        Insert: {
          action: string;
          after?: Json | null;
          actor_id?: string | null;
          before?: Json | null;
          created_at?: string;
          entity_id?: string | null;
          entity_type: string;
          id?: never;
          org_id: string;
          reason?: string | null;
        };
        Update: {
          action?: string;
          after?: Json | null;
          actor_id?: string | null;
          before?: Json | null;
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string;
          id?: never;
          org_id?: string;
          reason?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "audit_log_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "audit_log_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      invitations: {
        Row: {
          accepted_at: string | null;
          accepted_by: string | null;
          created_at: string;
          email: string;
          expires_at: string;
          id: string;
          invited_by: string;
          org_id: string;
          revoked_at: string | null;
          role: Database["public"]["Enums"]["member_role"];
          token_hash: string;
        };
        Insert: {
          accepted_at?: string | null;
          accepted_by?: string | null;
          created_at?: string;
          email: string;
          expires_at?: string;
          id?: string;
          invited_by: string;
          org_id: string;
          revoked_at?: string | null;
          role?: Database["public"]["Enums"]["member_role"];
          token_hash: string;
        };
        Update: {
          accepted_at?: string | null;
          accepted_by?: string | null;
          created_at?: string;
          email?: string;
          expires_at?: string;
          id?: string;
          invited_by?: string;
          org_id?: string;
          revoked_at?: string | null;
          role?: Database["public"]["Enums"]["member_role"];
          token_hash?: string;
        };
        Relationships: [
          {
            foreignKeyName: "invitations_accepted_by_fkey";
            columns: ["accepted_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invitations_invited_by_fkey";
            columns: ["invited_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invitations_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      leave_types: {
        Row: {
          color_token: string;
          created_at: string;
          id: string;
          is_active: boolean;
          is_paid: boolean;
          name: string;
          org_id: string;
          updated_at: string;
          yearly_quota_days: number | null;
        };
        Insert: {
          color_token?: string;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          is_paid?: boolean;
          name: string;
          org_id: string;
          updated_at?: string;
          yearly_quota_days?: number | null;
        };
        Update: {
          color_token?: string;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          is_paid?: boolean;
          name?: string;
          org_id?: string;
          updated_at?: string;
          yearly_quota_days?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "leave_types_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      organization_members: {
        Row: {
          created_at: string;
          id: string;
          job_title: string | null;
          joined_at: string;
          org_id: string;
          role: Database["public"]["Enums"]["member_role"];
          schedule_id: string | null;
          status: Database["public"]["Enums"]["member_status"];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          job_title?: string | null;
          joined_at?: string;
          org_id: string;
          role?: Database["public"]["Enums"]["member_role"];
          schedule_id?: string | null;
          status?: Database["public"]["Enums"]["member_status"];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          job_title?: string | null;
          joined_at?: string;
          org_id?: string;
          role?: Database["public"]["Enums"]["member_role"];
          schedule_id?: string | null;
          status?: Database["public"]["Enums"]["member_status"];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "organization_members_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "organization_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      organizations: {
        Row: {
          created_at: string;
          created_by: string;
          deleted_at: string | null;
          id: string;
          name: string;
          slug: string;
          timezone: string;
          updated_at: string;
          week_starts_on: number;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          deleted_at?: string | null;
          id?: string;
          name: string;
          slug: string;
          timezone: string;
          updated_at?: string;
          week_starts_on?: number;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          deleted_at?: string | null;
          id?: string;
          name?: string;
          slug?: string;
          timezone?: string;
          updated_at?: string;
          week_starts_on?: number;
        };
        Relationships: [
          {
            foreignKeyName: "organizations_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          email: string;
          full_name: string | null;
          id: string;
          last_org_id: string | null;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          email: string;
          full_name?: string | null;
          id: string;
          last_org_id?: string | null;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          email?: string;
          full_name?: string | null;
          id?: string;
          last_org_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_last_org_id_fkey";
            columns: ["last_org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      work_schedule_days: {
        Row: {
          end_time: string | null;
          is_working_day: boolean;
          required_minutes: number;
          schedule_id: string;
          start_time: string | null;
          weekday: number;
        };
        Insert: {
          end_time?: string | null;
          is_working_day: boolean;
          required_minutes?: number;
          schedule_id: string;
          start_time?: string | null;
          weekday: number;
        };
        Update: {
          end_time?: string | null;
          is_working_day?: boolean;
          required_minutes?: number;
          schedule_id?: string;
          start_time?: string | null;
          weekday?: number;
        };
        Relationships: [
          {
            foreignKeyName: "work_schedule_days_schedule_id_fkey";
            columns: ["schedule_id"];
            isOneToOne: false;
            referencedRelation: "work_schedules";
            referencedColumns: ["id"];
          },
        ];
      };
      work_schedules: {
        Row: {
          created_at: string;
          created_by: string;
          effective_from: string;
          grace_minutes: number;
          id: string;
          org_id: string;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          effective_from: string;
          grace_minutes?: number;
          id?: string;
          org_id: string;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          effective_from?: string;
          grace_minutes?: number;
          id?: string;
          org_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "work_schedules_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "work_schedules_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      accept_invitation: {
        Args: { p_token: string };
        Returns: {
          created_at: string;
          created_by: string;
          deleted_at: string | null;
          id: string;
          name: string;
          slug: string;
          timezone: string;
          updated_at: string;
          week_starts_on: number;
        };
      };
      change_member_role: {
        Args: {
          p_org_id: string;
          p_role: Database["public"]["Enums"]["member_role"];
          p_user_id: string;
        };
        Returns: {
          created_at: string;
          id: string;
          job_title: string | null;
          joined_at: string;
          org_id: string;
          role: Database["public"]["Enums"]["member_role"];
          schedule_id: string | null;
          status: Database["public"]["Enums"]["member_status"];
          updated_at: string;
          user_id: string;
        };
      };
      create_invitation: {
        Args: {
          p_email: string;
          p_org_id: string;
          p_role: Database["public"]["Enums"]["member_role"];
          p_token_hash: string;
        };
        Returns: {
          accepted_at: string | null;
          accepted_by: string | null;
          created_at: string;
          email: string;
          expires_at: string;
          id: string;
          invited_by: string;
          org_id: string;
          revoked_at: string | null;
          role: Database["public"]["Enums"]["member_role"];
          token_hash: string;
        };
      };
      create_organization: {
        Args: {
          p_name: string;
          p_schedule: Json;
          p_slug: string;
          p_timezone: string;
        };
        Returns: {
          created_at: string;
          created_by: string;
          deleted_at: string | null;
          id: string;
          name: string;
          slug: string;
          timezone: string;
          updated_at: string;
          week_starts_on: number;
        };
      };
      deactivate_member: {
        Args: { p_org_id: string; p_user_id: string };
        Returns: {
          created_at: string;
          id: string;
          job_title: string | null;
          joined_at: string;
          org_id: string;
          role: Database["public"]["Enums"]["member_role"];
          schedule_id: string | null;
          status: Database["public"]["Enums"]["member_status"];
          updated_at: string;
          user_id: string;
        };
      };
      preview_invitation: {
        Args: { p_token: string };
        Returns: {
          invitation_state: string;
          invited_role: Database["public"]["Enums"]["member_role"] | null;
          organization_name: string | null;
          organization_slug: string | null;
        }[];
      };
      revoke_invitation: {
        Args: { p_invitation_id: string };
        Returns: undefined;
      };
    };
    Enums: {
      member_role: "owner" | "admin" | "member";
      member_status: "active" | "deactivated";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DefaultSchema = Database["public"];

export type Tables<TableName extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][TableName]["Row"];

export type TablesInsert<TableName extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][TableName]["Insert"];

export type TablesUpdate<TableName extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][TableName]["Update"];

export type Enums<EnumName extends keyof DefaultSchema["Enums"]> =
  DefaultSchema["Enums"][EnumName];

export const Constants = {
  public: {
    Enums: {
      member_role: ["owner", "admin", "member"],
      member_status: ["active", "deactivated"],
    },
  },
} as const;
