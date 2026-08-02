export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      admin_users: {
        Row: {
          active: boolean
          created_at: string
          created_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_users_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      aftercare_instructions: {
        Row: {
          active: boolean | null
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          title: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      availability_slots: {
        Row: {
          active: boolean
          created_at: string
          created_by: string | null
          deactivated_at: string | null
          deactivated_by: string | null
          deactivation_reason: string | null
          ends_at: string | null
          google_calendar_event_id: string | null
          google_calendar_sync_error: string | null
          google_calendar_synced_at: string | null
          id: string
          notes: string | null
          public_access_at: string
          regulars_first: boolean
          starts_at: string
          status: Database["public"]["Enums"]["slot_status"]
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          deactivated_at?: string | null
          deactivated_by?: string | null
          deactivation_reason?: string | null
          ends_at?: string | null
          google_calendar_event_id?: string | null
          google_calendar_sync_error?: string | null
          google_calendar_synced_at?: string | null
          id?: string
          notes?: string | null
          public_access_at?: string
          regulars_first?: boolean
          starts_at: string
          status?: Database["public"]["Enums"]["slot_status"]
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          deactivated_at?: string | null
          deactivated_by?: string | null
          deactivation_reason?: string | null
          ends_at?: string | null
          google_calendar_event_id?: string | null
          google_calendar_sync_error?: string | null
          google_calendar_synced_at?: string | null
          id?: string
          notes?: string | null
          public_access_at?: string
          regulars_first?: boolean
          starts_at?: string
          status?: Database["public"]["Enums"]["slot_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "availability_slots_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "availability_slots_deactivated_by_fkey"
            columns: ["deactivated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_events: {
        Row: {
          actor_type: Database["public"]["Enums"]["booking_actor_type"]
          actor_user_id: string | null
          booking_id: string | null
          created_at: string
          event_type: string
          id: string
          message: string | null
          metadata: Json
        }
        Insert: {
          actor_type?: Database["public"]["Enums"]["booking_actor_type"]
          actor_user_id?: string | null
          booking_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          message?: string | null
          metadata?: Json
        }
        Update: {
          actor_type?: Database["public"]["Enums"]["booking_actor_type"]
          actor_user_id?: string | null
          booking_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          message?: string | null
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: "booking_events_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_events_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_totals_view"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "booking_events_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_inspo_prompts: {
        Row: {
          booking_id: string
          copied_at: string | null
          created_at: string
          id: string
          inspo_sent_at: string | null
          instagram_url: string | null
          message_text: string
          opened_at: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["booking_inspo_status"]
          user_id: string
        }
        Insert: {
          booking_id: string
          copied_at?: string | null
          created_at?: string
          id?: string
          inspo_sent_at?: string | null
          instagram_url?: string | null
          message_text: string
          opened_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["booking_inspo_status"]
          user_id: string
        }
        Update: {
          booking_id?: string
          copied_at?: string | null
          created_at?: string
          id?: string
          inspo_sent_at?: string | null
          instagram_url?: string | null
          message_text?: string
          opened_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["booking_inspo_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_inspo_prompts_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_totals_view"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "booking_inspo_prompts_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_inspo_prompts_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_inspo_prompts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_line_items: {
        Row: {
          active: boolean
          added_by: string | null
          booking_id: string
          created_at: string
          description_snapshot: string | null
          id: string
          item_type: Database["public"]["Enums"]["booking_line_item_type"]
          label_snapshot: string
          line_total: number | null
          quantity: number
          removed_at: string | null
          removed_by: string | null
          source_id: string | null
          source_table: string | null
          unit_price: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          added_by?: string | null
          booking_id: string
          created_at?: string
          description_snapshot?: string | null
          id?: string
          item_type: Database["public"]["Enums"]["booking_line_item_type"]
          label_snapshot: string
          line_total?: number | null
          quantity?: number
          removed_at?: string | null
          removed_by?: string | null
          source_id?: string | null
          source_table?: string | null
          unit_price?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          added_by?: string | null
          booking_id?: string
          created_at?: string
          description_snapshot?: string | null
          id?: string
          item_type?: Database["public"]["Enums"]["booking_line_item_type"]
          label_snapshot?: string
          line_total?: number | null
          quantity?: number
          removed_at?: string | null
          removed_by?: string | null
          source_id?: string | null
          source_table?: string | null
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_line_items_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_line_items_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_totals_view"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "booking_line_items_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_line_items_removed_by_fkey"
            columns: ["removed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_payment_audit_log: {
        Row: {
          actor_user_id: string | null
          changed_at: string
          database_role: string
          id: number
          new_record: Json | null
          old_record: Json | null
          operation: string
          payment_id: string | null
          transaction_id: number
        }
        Insert: {
          actor_user_id?: string | null
          changed_at?: string
          database_role: string
          id?: never
          new_record?: Json | null
          old_record?: Json | null
          operation: string
          payment_id?: string | null
          transaction_id: number
        }
        Update: {
          actor_user_id?: string | null
          changed_at?: string
          database_role?: string
          id?: never
          new_record?: Json | null
          old_record?: Json | null
          operation?: string
          payment_id?: string | null
          transaction_id?: number
        }
        Relationships: []
      }
      booking_payments: {
        Row: {
          amount: number
          booking_id: string
          created_at: string
          id: string
          marked_by: string | null
          method: Database["public"]["Enums"]["payment_method"]
          notes: string | null
          paid_at: string | null
          payment_type: Database["public"]["Enums"]["payment_type"]
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount: number
          booking_id: string
          created_at?: string
          id?: string
          marked_by?: string | null
          method?: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          paid_at?: string | null
          payment_type: Database["public"]["Enums"]["payment_type"]
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          booking_id?: string
          created_at?: string
          id?: string
          marked_by?: string | null
          method?: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          paid_at?: string | null
          payment_type?: Database["public"]["Enums"]["payment_type"]
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_totals_view"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "booking_payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_payments_marked_by_fkey"
            columns: ["marked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_policy_acceptances: {
        Row: {
          accepted_at: string
          booking_id: string
          created_at: string
          description_snapshot: string
          id: string
          policy_id: string | null
          title_snapshot: string
        }
        Insert: {
          accepted_at?: string
          booking_id: string
          created_at?: string
          description_snapshot: string
          id?: string
          policy_id?: string | null
          title_snapshot: string
        }
        Update: {
          accepted_at?: string
          booking_id?: string
          created_at?: string
          description_snapshot?: string
          id?: string
          policy_id?: string | null
          title_snapshot?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_policy_acceptances_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_totals_view"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "booking_policy_acceptances_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_policy_acceptances_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policies"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_settings: {
        Row: {
          active: boolean
          booking_fee_mode: Database["public"]["Enums"]["fee_mode"]
          booking_fee_rate: number
          created_at: string
          deposit_amount: number
          etransfer_email: string | null
          hold_minutes: number
          id: number
          instagram_url: string | null
          regular_early_access_hours: number
          studio_address: string | null
          studio_buzzer_code: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          booking_fee_mode?: Database["public"]["Enums"]["fee_mode"]
          booking_fee_rate?: number
          created_at?: string
          deposit_amount?: number
          etransfer_email?: string | null
          hold_minutes?: number
          id?: number
          instagram_url?: string | null
          regular_early_access_hours?: number
          studio_address?: string | null
          studio_buzzer_code?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          booking_fee_mode?: Database["public"]["Enums"]["fee_mode"]
          booking_fee_rate?: number
          created_at?: string
          deposit_amount?: number
          etransfer_email?: string | null
          hold_minutes?: number
          id?: number
          instagram_url?: string | null
          regular_early_access_hours?: number
          studio_address?: string | null
          studio_buzzer_code?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          admin_notes: string | null
          amount_due: number
          amount_paid: number
          booking_fee_amount: number
          booking_fee_mode: Database["public"]["Enums"]["fee_mode"]
          booking_fee_rate: number
          booking_reference: string
          cancelled_at: string | null
          client_display_name: string | null
          client_email: string | null
          client_instagram_handle: string | null
          client_notes: string | null
          client_preferred_contact_method: string | null
          completed_at: string | null
          created_at: string
          deposit_amount: number
          deposit_status: Database["public"]["Enums"]["deposit_status"]
          estimated_total: number
          final_total: number
          google_calendar_event_id: string | null
          google_calendar_sync_error: string | null
          google_calendar_synced_at: string | null
          hold_expires_at: string | null
          id: string
          slot_id: string | null
          status: Database["public"]["Enums"]["booking_status"]
          subtotal_amount: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          amount_due?: number
          amount_paid?: number
          booking_fee_amount?: number
          booking_fee_mode?: Database["public"]["Enums"]["fee_mode"]
          booking_fee_rate?: number
          booking_reference: string
          cancelled_at?: string | null
          client_display_name?: string | null
          client_email?: string | null
          client_instagram_handle?: string | null
          client_notes?: string | null
          client_preferred_contact_method?: string | null
          completed_at?: string | null
          created_at?: string
          deposit_amount?: number
          deposit_status?: Database["public"]["Enums"]["deposit_status"]
          estimated_total?: number
          final_total?: number
          google_calendar_event_id?: string | null
          google_calendar_sync_error?: string | null
          google_calendar_synced_at?: string | null
          hold_expires_at?: string | null
          id?: string
          slot_id?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          subtotal_amount?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          amount_due?: number
          amount_paid?: number
          booking_fee_amount?: number
          booking_fee_mode?: Database["public"]["Enums"]["fee_mode"]
          booking_fee_rate?: number
          booking_reference?: string
          cancelled_at?: string | null
          client_display_name?: string | null
          client_email?: string | null
          client_instagram_handle?: string | null
          client_notes?: string | null
          client_preferred_contact_method?: string | null
          completed_at?: string | null
          created_at?: string
          deposit_amount?: number
          deposit_status?: Database["public"]["Enums"]["deposit_status"]
          estimated_total?: number
          final_total?: number
          google_calendar_event_id?: string | null
          google_calendar_sync_error?: string | null
          google_calendar_synced_at?: string | null
          hold_expires_at?: string | null
          id?: string
          slot_id?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          subtotal_amount?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "availability_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cancellation_requests: {
        Row: {
          admin_decision: string | null
          admin_reason: string | null
          booking_id: string
          created_at: string
          id: string
          reason: string
          requested_refund_method: Database["public"]["Enums"]["refund_method"]
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["cancellation_request_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_decision?: string | null
          admin_reason?: string | null
          booking_id: string
          created_at?: string
          id?: string
          reason: string
          requested_refund_method?: Database["public"]["Enums"]["refund_method"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["cancellation_request_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_decision?: string | null
          admin_reason?: string | null
          booking_id?: string
          created_at?: string
          id?: string
          reason?: string
          requested_refund_method?: Database["public"]["Enums"]["refund_method"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["cancellation_request_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cancellation_requests_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_totals_view"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "cancellation_requests_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cancellation_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cancellation_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_redemptions: {
        Row: {
          booking_id: string | null
          deal_id: string
          id: string
          redeemed_at: string
          status: Database["public"]["Enums"]["deal_redemption_status"]
          user_id: string
        }
        Insert: {
          booking_id?: string | null
          deal_id: string
          id?: string
          redeemed_at?: string
          status?: Database["public"]["Enums"]["deal_redemption_status"]
          user_id: string
        }
        Update: {
          booking_id?: string | null
          deal_id?: string
          id?: string
          redeemed_at?: string
          status?: Database["public"]["Enums"]["deal_redemption_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_redemptions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_totals_view"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "deal_redemptions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_redemptions_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_redemptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          active: boolean
          code: string
          created_at: string
          description: string | null
          discount_type: Database["public"]["Enums"]["discount_type"]
          discount_value: number | null
          ends_at: string | null
          id: string
          max_uses: number | null
          starts_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          description?: string | null
          discount_type?: Database["public"]["Enums"]["discount_type"]
          discount_value?: number | null
          ends_at?: string | null
          id?: string
          max_uses?: number | null
          starts_at?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          description?: string | null
          discount_type?: Database["public"]["Enums"]["discount_type"]
          discount_value?: number | null
          ends_at?: string | null
          id?: string
          max_uses?: number | null
          starts_at?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      design_tier_images: {
        Row: {
          active: boolean
          alt_text: string | null
          created_at: string
          design_tier_id: string
          display_order: number
          id: string
          image_url: string
        }
        Insert: {
          active?: boolean
          alt_text?: string | null
          created_at?: string
          design_tier_id: string
          display_order?: number
          id?: string
          image_url: string
        }
        Update: {
          active?: boolean
          alt_text?: string | null
          created_at?: string
          design_tier_id?: string
          display_order?: number
          id?: string
          image_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "design_tier_images_design_tier_id_fkey"
            columns: ["design_tier_id"]
            isOneToOne: false
            referencedRelation: "design_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      design_tiers: {
        Row: {
          active: boolean
          created_at: string
          description: string
          display_order: number
          id: string
          name: string
          price: number
          slug: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description: string
          display_order?: number
          id?: string
          name: string
          price: number
          slug: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string
          display_order?: number
          id?: string
          name?: string
          price?: number
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      faqs: {
        Row: {
          active: boolean
          answer: string
          created_at: string
          display_order: number
          id: string
          question: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          answer: string
          created_at?: string
          display_order?: number
          id?: string
          question: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          answer?: string
          created_at?: string
          display_order?: number
          id?: string
          question?: string
          updated_at?: string
        }
        Relationships: []
      }
      gallery_groups: {
        Row: {
          active: boolean | null
          background: string
          created_at: string
          description: string
          display_order: number
          id: string
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          background?: string
          created_at?: string
          description: string
          display_order?: number
          id?: string
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          background?: string
          created_at?: string
          description?: string
          display_order?: number
          id?: string
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      gallery_images: {
        Row: {
          active: boolean
          alt: string
          created_at: string
          display_order: number
          group_id: string
          id: string
          src: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          alt: string
          created_at?: string
          display_order?: number
          group_id: string
          id?: string
          src: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          alt?: string
          created_at?: string
          display_order?: number
          group_id?: string
          id?: string
          src?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gallery_images_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "gallery_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      google_calendar_integrations: {
        Row: {
          admin_user_id: string
          calendar_id: string
          calendar_name: string
          connected_at: string
          created_at: string
          encrypted_refresh_token: string
          google_email: string | null
          id: string
          is_active: boolean
          last_sync_at: string | null
          last_sync_error: string | null
          needs_reconnect: boolean
          updated_at: string
        }
        Insert: {
          admin_user_id: string
          calendar_id?: string
          calendar_name?: string
          connected_at?: string
          created_at?: string
          encrypted_refresh_token: string
          google_email?: string | null
          id?: string
          is_active?: boolean
          last_sync_at?: string | null
          last_sync_error?: string | null
          needs_reconnect?: boolean
          updated_at?: string
        }
        Update: {
          admin_user_id?: string
          calendar_id?: string
          calendar_name?: string
          connected_at?: string
          created_at?: string
          encrypted_refresh_token?: string
          google_email?: string | null
          id?: string
          is_active?: boolean
          last_sync_at?: string | null
          last_sync_error?: string | null
          needs_reconnect?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "google_calendar_integrations_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_logs: {
        Row: {
          booking_id: string | null
          created_at: string
          deduplication_key: string | null
          error_message: string | null
          id: string
          notification_type: string
          provider: string | null
          provider_message_id: string | null
          recipient_email: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["notification_status"]
          subject: string | null
          user_id: string | null
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          deduplication_key?: string | null
          error_message?: string | null
          id?: string
          notification_type: string
          provider?: string | null
          provider_message_id?: string | null
          recipient_email?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          subject?: string | null
          user_id?: string | null
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          deduplication_key?: string | null
          error_message?: string | null
          id?: string
          notification_type?: string
          provider?: string | null
          provider_message_id?: string | null
          recipient_email?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          subject?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_logs_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_totals_view"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "notification_logs_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      policies: {
        Row: {
          active: boolean
          created_at: string
          description: string
          display_order: number
          id: string
          policy_type: string
          required_acknowledgement: boolean
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description: string
          display_order?: number
          id?: string
          policy_type?: string
          required_acknowledgement?: boolean
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string
          display_order?: number
          id?: string
          policy_type?: string
          required_acknowledgement?: boolean
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      pricing_groups: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          display_order: number
          id: string
          service_description: string | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          service_description?: string | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          service_description?: string | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      pricing_items: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          display_order: number
          group_id: string
          id: string
          name: string
          requires_design_tier: boolean
          slug: string
          standalone_booking_allowed: boolean
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          display_order?: number
          group_id: string
          id?: string
          name: string
          requires_design_tier?: boolean
          slug: string
          standalone_booking_allowed?: boolean
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          display_order?: number
          group_id?: string
          id?: string
          name?: string
          requires_design_tier?: boolean
          slug?: string
          standalone_booking_allowed?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pricing_items_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "pricing_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_variants: {
        Row: {
          active: boolean
          created_at: string
          display_order: number
          duration_minutes: number | null
          id: string
          item_id: string
          label: string
          note: string | null
          price: number
          slug: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          display_order?: number
          duration_minutes?: number | null
          id?: string
          item_id: string
          label: string
          note?: string | null
          price: number
          slug: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          display_order?: number
          duration_minutes?: number | null
          id?: string
          item_id?: string
          label?: string
          note?: string | null
          price?: number
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pricing_variants_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "pricing_items"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string
          email: string
          id: string
          instagram_handle: string | null
          is_regular: boolean
          legal_version: string | null
          phone: string | null
          preferred_contact_method: Database["public"]["Enums"]["preferred_contact_method"]
          privacy_accepted_at: string | null
          profile_completed_at: string | null
          regular_since: string | null
          terms_accepted_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name: string
          email: string
          id: string
          instagram_handle?: string | null
          is_regular?: boolean
          legal_version?: string | null
          phone?: string | null
          preferred_contact_method?: Database["public"]["Enums"]["preferred_contact_method"]
          privacy_accepted_at?: string | null
          profile_completed_at?: string | null
          regular_since?: string | null
          terms_accepted_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string
          email?: string
          id?: string
          instagram_handle?: string | null
          is_regular?: boolean
          legal_version?: string | null
          phone?: string | null
          preferred_contact_method?: Database["public"]["Enums"]["preferred_contact_method"]
          privacy_accepted_at?: string | null
          profile_completed_at?: string | null
          regular_since?: string | null
          terms_accepted_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          active: boolean
          client_name: string
          created_at: string
          display_order: number
          featured: boolean
          id: string
          image_url: string | null
          review: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          client_name: string
          created_at?: string
          display_order?: number
          featured?: boolean
          id?: string
          image_url?: string | null
          review: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          client_name?: string
          created_at?: string
          display_order?: number
          featured?: boolean
          id?: string
          image_url?: string | null
          review?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_credits: {
        Row: {
          active: boolean
          amount: number
          created_at: string
          expires_at: string | null
          id: string
          reason: string | null
          source_booking_id: string | null
          used_at: string | null
          user_id: string
        }
        Insert: {
          active?: boolean
          amount: number
          created_at?: string
          expires_at?: string | null
          id?: string
          reason?: string | null
          source_booking_id?: string | null
          used_at?: string | null
          user_id: string
        }
        Update: {
          active?: boolean
          amount?: number
          created_at?: string
          expires_at?: string | null
          id?: string
          reason?: string | null
          source_booking_id?: string | null
          used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_credits_source_booking_id_fkey"
            columns: ["source_booking_id"]
            isOneToOne: false
            referencedRelation: "booking_totals_view"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "user_credits_source_booking_id_fkey"
            columns: ["source_booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_credits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      website_fee_invoice_lines: {
        Row: {
          booking_id: string
          booking_reference_snapshot: string
          calculated_fee_unrounded: number | null
          created_at: string
          eligible_net_amount_snapshot: number
          fee_rate_percent_snapshot: number
          id: string
          invoice_id: string
          paid_at_snapshot: string
          payment_method_snapshot: string
          payment_status_snapshot: string
          payment_type_snapshot: string
          recorded_amount_snapshot: number
          source_billing_month: string
          source_payment_id: string
        }
        Insert: {
          booking_id: string
          booking_reference_snapshot: string
          calculated_fee_unrounded?: number | null
          created_at?: string
          eligible_net_amount_snapshot: number
          fee_rate_percent_snapshot?: number
          id?: string
          invoice_id: string
          paid_at_snapshot: string
          payment_method_snapshot: string
          payment_status_snapshot: string
          payment_type_snapshot: string
          recorded_amount_snapshot: number
          source_billing_month: string
          source_payment_id: string
        }
        Update: {
          booking_id?: string
          booking_reference_snapshot?: string
          calculated_fee_unrounded?: number | null
          created_at?: string
          eligible_net_amount_snapshot?: number
          fee_rate_percent_snapshot?: number
          id?: string
          invoice_id?: string
          paid_at_snapshot?: string
          payment_method_snapshot?: string
          payment_status_snapshot?: string
          payment_type_snapshot?: string
          recorded_amount_snapshot?: number
          source_billing_month?: string
          source_payment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "website_fee_invoice_lines_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_totals_view"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "website_fee_invoice_lines_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "website_fee_invoice_lines_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "website_fee_invoice_register"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "website_fee_invoice_lines_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "website_fee_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "website_fee_invoice_lines_source_payment_id_fkey"
            columns: ["source_payment_id"]
            isOneToOne: false
            referencedRelation: "booking_payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "website_fee_invoice_lines_source_payment_id_fkey"
            columns: ["source_payment_id"]
            isOneToOne: false
            referencedRelation: "website_fee_payment_details"
            referencedColumns: ["payment_id"]
          },
          {
            foreignKeyName: "website_fee_invoice_lines_source_payment_id_fkey"
            columns: ["source_payment_id"]
            isOneToOne: false
            referencedRelation: "website_fee_payment_exceptions"
            referencedColumns: ["payment_id"]
          },
        ]
      }
      website_fee_invoices: {
        Row: {
          billing_month: string
          booking_count: number
          created_at: string
          currency: string
          due_date: string | null
          eligible_net_revenue: number
          fee_rate_percent: number
          fee_total: number
          id: string
          invoice_number: string
          issued_at: string | null
          issued_by: string | null
          notes: string | null
          paid_at: string | null
          period_end: string
          period_start: string
          source_line_count: number
          status: string
          updated_at: string
          void_reason: string | null
          voided_at: string | null
        }
        Insert: {
          billing_month: string
          booking_count?: number
          created_at?: string
          currency?: string
          due_date?: string | null
          eligible_net_revenue?: number
          fee_rate_percent?: number
          fee_total?: number
          id?: string
          invoice_number: string
          issued_at?: string | null
          issued_by?: string | null
          notes?: string | null
          paid_at?: string | null
          period_end: string
          period_start: string
          source_line_count?: number
          status?: string
          updated_at?: string
          void_reason?: string | null
          voided_at?: string | null
        }
        Update: {
          billing_month?: string
          booking_count?: number
          created_at?: string
          currency?: string
          due_date?: string | null
          eligible_net_revenue?: number
          fee_rate_percent?: number
          fee_total?: number
          id?: string
          invoice_number?: string
          issued_at?: string | null
          issued_by?: string | null
          notes?: string | null
          paid_at?: string | null
          period_end?: string
          period_start?: string
          source_line_count?: number
          status?: string
          updated_at?: string
          void_reason?: string | null
          voided_at?: string | null
        }
        Relationships: []
      }
      website_fee_workflow_runs: {
        Row: {
          admin_alert_sent_at: string | null
          billing_month: string
          check_details: Json
          created_at: string
          id: string
          invoice_emailed_at: string | null
          invoice_id: string | null
          issue_attempts: number
          last_checked_at: string | null
          last_error: string | null
          review_token_nonce: string
          status: string
          updated_at: string
        }
        Insert: {
          admin_alert_sent_at?: string | null
          billing_month: string
          check_details?: Json
          created_at?: string
          id?: string
          invoice_emailed_at?: string | null
          invoice_id?: string | null
          issue_attempts?: number
          last_checked_at?: string | null
          last_error?: string | null
          review_token_nonce?: string
          status?: string
          updated_at?: string
        }
        Update: {
          admin_alert_sent_at?: string | null
          billing_month?: string
          check_details?: Json
          created_at?: string
          id?: string
          invoice_emailed_at?: string | null
          invoice_id?: string | null
          issue_attempts?: number
          last_checked_at?: string | null
          last_error?: string | null
          review_token_nonce?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "website_fee_workflow_runs_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "website_fee_invoice_register"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "website_fee_workflow_runs_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "website_fee_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      booking_totals_view: {
        Row: {
          booking_id: string | null
          calculated_amount_due: number | null
          calculated_amount_paid: number | null
          calculated_booking_fee_amount: number | null
          calculated_estimated_total: number | null
          calculated_subtotal_amount: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_website_fee_totals: {
        Row: {
          billing_month: string | null
          booking_count: number | null
          eligible_net_revenue: number | null
          fee_rate_percent: number | null
          invoice_amount: number | null
          receipt_count: number | null
        }
        Relationships: []
      }
      website_fee_invoice_due_now: {
        Row: {
          billing_month: string | null
          booking_count: number | null
          eligible_net_revenue: number | null
          fee_rate_percent: number | null
          invoice_amount: number | null
          receipt_count: number | null
        }
        Relationships: []
      }
      website_fee_invoice_evidence: {
        Row: {
          booking_id: string | null
          booking_reference_snapshot: string | null
          calculated_fee_unrounded: number | null
          created_at: string | null
          eligible_net_amount_snapshot: number | null
          fee_rate_percent_snapshot: number | null
          id: string | null
          invoice_billing_month: string | null
          invoice_id: string | null
          invoice_number: string | null
          invoice_status: string | null
          issued_at: string | null
          paid_at_snapshot: string | null
          payment_method_snapshot: string | null
          payment_status_snapshot: string | null
          payment_type_snapshot: string | null
          recorded_amount_snapshot: number | null
          source_billing_month: string | null
          source_payment_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "website_fee_invoice_lines_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_totals_view"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "website_fee_invoice_lines_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "website_fee_invoice_lines_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "website_fee_invoice_register"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "website_fee_invoice_lines_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "website_fee_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "website_fee_invoice_lines_source_payment_id_fkey"
            columns: ["source_payment_id"]
            isOneToOne: false
            referencedRelation: "booking_payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "website_fee_invoice_lines_source_payment_id_fkey"
            columns: ["source_payment_id"]
            isOneToOne: false
            referencedRelation: "website_fee_payment_details"
            referencedColumns: ["payment_id"]
          },
          {
            foreignKeyName: "website_fee_invoice_lines_source_payment_id_fkey"
            columns: ["source_payment_id"]
            isOneToOne: false
            referencedRelation: "website_fee_payment_exceptions"
            referencedColumns: ["payment_id"]
          },
        ]
      }
      website_fee_invoice_register: {
        Row: {
          actual_booking_count: number | null
          actual_line_count: number | null
          billing_month: string | null
          booking_count: number | null
          created_at: string | null
          currency: string | null
          due_date: string | null
          eligible_net_revenue: number | null
          fee_difference: number | null
          fee_rate_percent: number | null
          fee_total: number | null
          id: string | null
          invoice_number: string | null
          issued_at: string | null
          issued_by: string | null
          line_net_revenue: number | null
          notes: string | null
          paid_at: string | null
          period_end: string | null
          period_start: string | null
          recalculated_fee_total: number | null
          source_line_count: number | null
          status: string | null
          updated_at: string | null
          void_reason: string | null
          voided_at: string | null
        }
        Relationships: []
      }
      website_fee_invoice_source_drift: {
        Row: {
          booking_reference_snapshot: string | null
          drift_reason: string | null
          invoice_billing_month: string | null
          invoice_number: string | null
          source_payment_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "website_fee_invoice_lines_source_payment_id_fkey"
            columns: ["source_payment_id"]
            isOneToOne: false
            referencedRelation: "booking_payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "website_fee_invoice_lines_source_payment_id_fkey"
            columns: ["source_payment_id"]
            isOneToOne: false
            referencedRelation: "website_fee_payment_details"
            referencedColumns: ["payment_id"]
          },
          {
            foreignKeyName: "website_fee_invoice_lines_source_payment_id_fkey"
            columns: ["source_payment_id"]
            isOneToOne: false
            referencedRelation: "website_fee_payment_exceptions"
            referencedColumns: ["payment_id"]
          },
        ]
      }
      website_fee_payment_details: {
        Row: {
          billing_month: string | null
          booking_id: string | null
          booking_reference: string | null
          eligible_net_amount: number | null
          fee_rate_percent: number | null
          method: Database["public"]["Enums"]["payment_method"] | null
          paid_at: string | null
          payment_id: string | null
          payment_type: Database["public"]["Enums"]["payment_type"] | null
          recorded_amount: number | null
          status: Database["public"]["Enums"]["payment_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_totals_view"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "booking_payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      website_fee_payment_exceptions: {
        Row: {
          amount: number | null
          booking_id: string | null
          booking_reference: string | null
          created_at: string | null
          exception_code: string | null
          method: Database["public"]["Enums"]["payment_method"] | null
          paid_at: string | null
          payment_id: string | null
          payment_type: Database["public"]["Enums"]["payment_type"] | null
          status: Database["public"]["Enums"]["payment_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_totals_view"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "booking_payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      website_fee_ready_to_issue: {
        Row: {
          billing_month: string | null
          booking_count: number | null
          eligible_net_revenue: number | null
          fee_rate_percent: number | null
          invoice_already_exists: boolean | null
          late_source_count: number | null
          period_end: string | null
          period_start: string | null
          proposed_invoice_total: number | null
          source_drift_count: number | null
          uninvoiced_source_count: number | null
          unresolved_exception_count: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      issue_website_fee_invoice: {
        Args: {
          p_billing_month: string
          p_issued_by?: string
          p_notes?: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "owner" | "admin"
      booking_actor_type: "client" | "admin" | "system"
      booking_inspo_status: "pending" | "sent" | "reviewed"
      booking_line_item_type:
        | "service"
        | "design_tier"
        | "removal"
        | "addon"
        | "adjustment"
        | "discount"
        | "fee"
      booking_status:
        | "held"
        | "requested"
        | "confirmed"
        | "cancellation_requested"
        | "cancelled"
        | "rejected"
        | "completed"
        | "no_show"
        | "expired"
      cancellation_request_status:
        | "pending"
        | "approved"
        | "rejected"
        | "resolved"
      deal_redemption_status: "claimed" | "applied" | "expired" | "cancelled"
      deposit_status:
        | "pending"
        | "marked_sent"
        | "received"
        | "rejected"
        | "refunded"
        | "credited"
        | "forfeited"
      discount_type: "fixed_amount" | "percentage" | "custom"
      fee_mode: "added_on_top" | "included_in_price"
      notification_status: "pending" | "sent" | "failed" | "skipped"
      payment_method: "etransfer" | "cash" | "account_credit" | "other"
      payment_status:
        | "pending"
        | "marked_sent"
        | "received"
        | "rejected"
        | "refunded"
        | "credited"
        | "forfeited"
        | "completed"
        | "failed"
      payment_type:
        | "deposit"
        | "final_payment"
        | "refund"
        | "credit"
        | "forfeit"
      preferred_contact_method: "email" | "phone" | "instagram"
      refund_method: "no_refund" | "refund_etransfer" | "account_credit"
      slot_status:
        | "available"
        | "blocked"
        | "held"
        | "requested"
        | "confirmed"
        | "cancelled"
        | "expired"
      website_fee_status: "unbilled" | "invoiced" | "paid" | "waived"
      website_invoice_status: "draft" | "sent" | "paid" | "waived" | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["owner", "admin"],
      booking_actor_type: ["client", "admin", "system"],
      booking_inspo_status: ["pending", "sent", "reviewed"],
      booking_line_item_type: [
        "service",
        "design_tier",
        "removal",
        "addon",
        "adjustment",
        "discount",
        "fee",
      ],
      booking_status: [
        "held",
        "requested",
        "confirmed",
        "cancellation_requested",
        "cancelled",
        "rejected",
        "completed",
        "no_show",
        "expired",
      ],
      cancellation_request_status: [
        "pending",
        "approved",
        "rejected",
        "resolved",
      ],
      deal_redemption_status: ["claimed", "applied", "expired", "cancelled"],
      deposit_status: [
        "pending",
        "marked_sent",
        "received",
        "rejected",
        "refunded",
        "credited",
        "forfeited",
      ],
      discount_type: ["fixed_amount", "percentage", "custom"],
      fee_mode: ["added_on_top", "included_in_price"],
      notification_status: ["pending", "sent", "failed", "skipped"],
      payment_method: ["etransfer", "cash", "account_credit", "other"],
      payment_status: [
        "pending",
        "marked_sent",
        "received",
        "rejected",
        "refunded",
        "credited",
        "forfeited",
        "completed",
        "failed",
      ],
      payment_type: ["deposit", "final_payment", "refund", "credit", "forfeit"],
      preferred_contact_method: ["email", "phone", "instagram"],
      refund_method: ["no_refund", "refund_etransfer", "account_credit"],
      slot_status: [
        "available",
        "blocked",
        "held",
        "requested",
        "confirmed",
        "cancelled",
        "expired",
      ],
      website_fee_status: ["unbilled", "invoiced", "paid", "waived"],
      website_invoice_status: ["draft", "sent", "paid", "waived", "cancelled"],
    },
  },
} as const

