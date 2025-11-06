// /types/tables.ts

export type StoreRow = {
  id: string;
  name: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  wilaya: number | null;
  created_at: string | null;
};

export type VoucherRow = {
  id: string;
  code: string;
  buyer_name: string | null;
  buyer_phone?: string | null;
  initial_amount: number;
  balance: number;
  status: 'blank' | 'active' | 'redeemed' | 'expired' | 'void';
  expires_at: string | null;
  activated_at?: string | null;
  created_at: string;
};
