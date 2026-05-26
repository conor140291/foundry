export type OperatorTier = 'scout' | 'operator' | 'strategist' | 'partner' | 'syndicate'
export type OperatorStatus = 'pending_review' | 'active' | 'suspended' | 'rejected' | 'inactive'
export type PlayStatus = 'proposed' | 'active' | 'completed' | 'loss' | 'abandoned' | 'disputed'
export type MessageRole = 'operator' | 'admin'

export interface Operator {
  id: string
  user_id: string
  handle: string
  full_name: string
  email: string
  age: number | null
  location: string | null
  tier: OperatorTier
  status: OperatorStatus
  current_allocation: number
  total_capital_in: number
  total_capital_out: number
  play_count: number
  reliability_score: number
  id_verified: boolean
  created_at: string
}

export interface Application {
  id: string
  operator_id: string
  q_100_plan: string | null
  q_inefficiency: string | null
  q_value_story: string | null
  q_best_at: string | null
  q_10k_plan: string | null
  q_edge: string | null
  id_photo_path: string | null
  selfie_path: string | null
  status: 'pending' | 'approved' | 'rejected'
  review_notes: string | null
  created_at: string
}

export interface Play {
  id: string
  operator_id: string
  play_number: string
  title: string
  description: string | null
  platform: string | null
  category: string | null
  capital_in: number
  capital_out: number | null
  net_profit: number | null
  operator_cut: number | null
  foundry_cut: number | null
  status: PlayStatus
  started_at: string | null
  completed_at: string | null
  created_at: string
}

export interface Message {
  id: string
  play_id: string
  operator_id: string
  from_role: MessageRole
  body: string
  attachment_path: string | null
  attachment_type: string | null
  created_at: string
}