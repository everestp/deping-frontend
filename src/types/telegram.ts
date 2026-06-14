// Core Data Model representing the database row
export interface TelegramUser {
  id: number;
  user_id: number;
  telegram_chat_id?: number | null;
  telegram_username: string;
  verification_code?: string | null;
  is_verified: boolean;
  last_reminded_at?: string | null;
  created_at: string;
}

// The Envelope Wrapper Type requested for your API client 
export interface TelegramStatusApiResponse {
  success: boolean;
  data: TelegramUser | null; // null if database returns no rows, otherwise contains the record
}

// Response structure specifically when initializing a new link connection handshake
export interface LinkTelegramResponse {
  bot_username?: string;
  verification_code: string;
}

// Subscription Alert Node Monitor Interface
export interface Monitor {
  id: string;
  target_url: string;
  is_notifications_enabled: boolean;
}

// Credit Ledger Profile Structure
export interface CreditStatus {
  total_credits_left: number;
  free_credits_used: number;
  free_reset_date: string;
}

// Checkout Pricing Matrix System Packages
export interface PricingTier {
  id: string;
  name: string;
  credits: number;
  cost: number;
  unit: string;
  badge?: string;
  description: string;
}