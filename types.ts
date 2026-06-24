export type Frequency = 'daily' | 'weekdays' | 'weekly' | 'monthly' | 'by-deadline';

export interface Kid {
  id: string;
  name: string;
  avatar: string;
  stars: number;
  color: string;
  createdAt: string;
  isNonReader?: boolean;
  stickerValue?: number;
  order: number;
}

export interface Chore {
  id: string;
  title: string;
  description: string;
  points: number;
  icon: string;
  category?: string;
  frequency: Frequency;
  days?: number[]; // 0-6 for weekly, [1, 15] for monthly, etc.
  assignedTo: string[]; // Kid IDs
  active: boolean;
  createdAt: string;
  order: number;
  isBonus?: boolean;
}

export interface TaskInstance {
  id: string;
  choreId: string;
  kidId: string;
  status: 'pending' | 'completed';
  dueDate: string; // YYYY-MM-DD
  completedAt?: string | null;
  pointsValue: number;
  isBonus?: boolean;
  choreTitle?: string;
  choreIcon?: string;
  choreCategory?: string;
}

export interface Reward {
  id: string;
  title: string;
  description: string;
  cost: number;
  icon: string;
  active: boolean;
  type: 'kid' | 'family';
  allowedKids?: string[]; // For kid rewards, which kids can see it
  order: number;
}

export interface CategoryOrder {
  id: string;
  categories: string[];
}

export interface Transaction {
  id: string;
  kidId: string;
  amount: number;
  type: 'earn' | 'spend' | 'bonus' | 'penalty';
  description: string;
  timestamp: unknown; // Using unknown for Firestore FieldValue compatibility in various states
}

export interface Fulfillment {
  id: string;
  kidId: string | 'family';
  rewardId: string;
  rewardTitle: string;
  rewardIcon: string;
  cost: number;
  type: 'kid' | 'family';
  status: 'pending' | 'filled';
  purchasedAt: string;
  filledAt?: string | null;
}
