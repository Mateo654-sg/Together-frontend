// ─── Generic ────────────────────────────────────────────────
export interface ApiResponse<T> { success: boolean; message?: string; data?: T; errors?: ApiError[]; }
export interface ApiError { field: string; message: string; }
export interface PaginationInfo { page: number; limit: number; total: number; total_pages: number; }
export interface PaginatedList<T> { data: T[]; pagination: PaginationInfo; }
export interface PaginationParams { page?: number; limit?: number; }

// ─── Auth ───────────────────────────────────────────────────
export interface LoginInput { email: string; password: string; }
export interface RegisterInput { first_name: string; last_name: string; email: string; password: string; }
export interface ChangePasswordInput { current_password: string; new_password: string; }
export interface TokenResponse { access_token: string; refresh_token?: string; token_type: string; verification_token?: string; }

// ─── User ───────────────────────────────────────────────────
export interface User {
  id: string; first_name: string; last_name: string; email: string;
  avatar_url: string | null; birth_date: string | null; phone: string | null;
  language: string; currency: string; timezone: string;
  is_verified: boolean; last_login: string | null; created_at: string;
}

// ─── Categories ─────────────────────────────────────────────
export interface Category { id: string; name: string; icon: string | null; color: string | null; type: string; created_at: string; }
export interface CreateCategoryInput { name: string; icon?: string; color?: string; type?: 'expense' | 'income'; }
export interface UpdateCategoryInput { name?: string; icon?: string; color?: string; type?: 'expense' | 'income'; }

// ─── Expenses ───────────────────────────────────────────────
export interface Expense {
  id: string; user_id: string; category_id: string | null; amount: number;
  description: string; notes: string | null; payment_method: string | null;
  location: string | null; attachment_url: string | null;
  expense_date: string; is_favorite: boolean; created_at: string; updated_at: string;
  tags: Tag[];
}
export interface CreateExpenseInput {
  amount: number; description: string; expense_date: string;
  category_id?: string; notes?: string; payment_method?: string; location?: string;
  attachment_url?: string;
  tag_ids?: string[];
}
export interface UpdateExpenseInput extends Partial<Omit<CreateExpenseInput, 'amount' | 'description' | 'expense_date'>> {
  amount?: number; description?: string; expense_date?: string;
}

// ─── Tags ───────────────────────────────────────────────────
export interface Tag {
  id: string; user_id: string; name: string; color: string | null;
  created_at: string; updated_at: string;
}
export interface CreateTagInput { name: string; color?: string; }
export interface UpdateTagInput { name?: string; color?: string; }

// ─── Incomes ────────────────────────────────────────────────
export interface Income {
  id: string; user_id: string; category_id: string | null; amount: number;
  description: string; notes: string | null;
  income_date: string; created_at: string; updated_at: string;
}
export interface CreateIncomeInput {
  amount: number; description: string; income_date: string;
  category_id?: string; notes?: string;
}

// ─── Transfers ───────────────────────────────────────────────
export interface Transfer {
  id: string; user_id: string; from_method: string; to_method: string;
  amount: number; description: string | null; transfer_date: string;
  created_at: string; updated_at: string;
}
export interface CreateTransferInput {
  from_method: string; to_method: string; amount: number;
  description?: string; transfer_date: string;
}
export type UpdateTransferInput = Partial<CreateTransferInput>;

// ─── Recurring Transactions ──────────────────────────────────
export interface RecurringTransaction {
  id: string; user_id: string; category_id: string | null;
  type: 'expense' | 'income';
  frequency: 'daily' | 'weekly' | 'monthly' | 'annual';
  amount: number; description: string; next_execution: string;
  last_executed: string | null; active: boolean;
  created_at: string; updated_at: string;
}
export interface CreateRecurringTransactionInput {
  type: 'expense' | 'income';
  frequency: 'daily' | 'weekly' | 'monthly' | 'annual';
  amount: number; description: string;
  category_id?: string; next_execution?: string;
}
export interface UpdateRecurringTransactionInput extends Partial<CreateRecurringTransactionInput> {
  active?: boolean;
}
export interface ProcessRecurringResponse {
  executed: number; details: Array<Record<string, unknown>>;
}

// ─── Sessions ────────────────────────────────────────────────
export interface SessionHistoryItem {
  id: string; device: string | null; ip: string | null;
  is_revoked: boolean; created_at: string; expires_at: string;
}
export interface SessionHistory { data: SessionHistoryItem[]; }

// ─── User Statistics (GET /users/statistics) ─────────────────
export interface UserStatistics {
  total_income: number; total_expenses: number; balance: number;
  total_categories_used: number; total_expenses_count: number; total_incomes_count: number;
}
export interface UpdateUserInput {
  first_name?: string; last_name?: string; birth_date?: string; phone?: string;
  language?: string; currency?: string; timezone?: string;
}

// ─── Goals ──────────────────────────────────────────────────
export interface Goal {
  id: string; couple_id: string | null; user_id: string | null;
  title: string; description: string | null; image: string | null;
  target_amount: number; current_amount: number; target_date: string | null;
  status: 'active' | 'completed' | 'cancelled';
  progress_percentage: number | null; days_remaining: number | null;
  predicted_completion_date: string | null; created_at: string; updated_at: string;
}
export interface CreateGoalInput { title: string; description?: string; image?: string; target_amount: number; target_date?: string; }
export interface GoalContribution { id: string; goal_id: string; user_id: string; amount: number; contribution_date: string; created_at: string | null; }
export interface GoalStatistics {
  total_goals: number; active_goals: number; completed_goals: number;
  total_saved: number; total_target: number;
  overall_progress_percentage: number; goals_on_track: number; goals_behind: number;
}

// ─── Budgets ────────────────────────────────────────────────
export interface Budget {
  id: string; user_id: string; category_id: string | null; category_name: string | null; amount: number;
  spent: number; month: number; year: number;
  percentage_consumed: number | null; created_at: string; updated_at: string;
}
export interface CreateBudgetInput { category_id?: string; amount: number; month: number; year: number; }
export interface BudgetAlert {
  budget_id: string; category_id: string | null; category_name: string | null; amount: number;
  spent: number; percentage: number; level: string; month: number; year: number;
}

// ─── Reminders ──────────────────────────────────────────────
export interface Reminder {
  id: string; user_id: string; title: string; description: string | null;
  due_date: string; repeat_type: string; is_completed: boolean;
  amount: string | null; notification_sent: boolean;
  created_at: string; updated_at: string;
}
export interface CreateReminderInput {
  title: string; description?: string; due_date: string;
  repeat_type?: string; amount?: string;
}

// ─── Dashboard ──────────────────────────────────────────────
export interface DashboardGoalSummary {
  id: string; title: string; target_amount: number; current_amount: number;
  progress_percentage: number | null; target_date: string | null; status: string;
}
export interface DashboardRecentActivity {
  id: string; type: string; description: string; amount: number;
  date: string; category: string | null;
}
export interface DashboardUpcomingPayment {
  id: string; type: string; description: string; amount: number;
  due_date: string; status: string;
}
export interface DashboardStatistics {
  monthly_breakdown: Array<{ month: string; income: number; expense: number }>;
  top_categories: Array<{ category_name: string; total_amount: number; percentage_of_total?: number }>;
}

export interface Dashboard {
  balance: number; income: number; expense: number; saving: number;
  cash_flow: number; goals: DashboardGoalSummary[];
  statistics: DashboardStatistics;
  recent_activity: DashboardRecentActivity[];
  upcoming_payments: DashboardUpcomingPayment[];
  ai_recommendations: string[];
}

// ─── Reports ────────────────────────────────────────────────
export interface Report {
  id: string; user_id: string; report_type: string; format: string;
  status: string; file_path: string | null; parameters: string | null;
  generated_at: string | null; created_at: string; updated_at: string;
}
export interface GenerateReportInput { report_type: string; format?: string; month?: number; year?: number; category_id?: string; }
export interface MonthlyStatistics {
  month: number; year: number; total_income: number; total_expense: number;
  balance: number; savings_rate: number;
  top_categories: CategoryStatistics[]; daily_average_expense: number;
}
export interface MonthlyBreakdownItem {
  month: number; income: number; expense: number; balance: number;
}

export interface YearlyStatistics {
  year: number; total_income: number; total_expense: number;
  balance: number; savings_rate: number;
  monthly_breakdown: MonthlyBreakdownItem[]; top_categories: CategoryStatistics[];
}
export interface CategoryStatistics {
  category_id: string; category_name: string; total_amount: number;
  percentage_of_total: number; transaction_count: number;
}
export interface PersonalStatistics {
  total_income: number; total_expense: number; balance: number;
  savings_rate: number;
  top_expense_categories: CategoryStatistics[];
  top_income_categories: CategoryStatistics[];
  monthly_trend: MonthlyBreakdownItem[];
}
export interface CoupleStatistics {
  personal_income: number; personal_expense: number;
  shared_income: number; shared_expense: number;
  total_income: number; total_expense: number;
  balance: number; savings_rate: number;
  partner_contribution: { [partner: string]: number };
}

// ─── Exports ───────────────────────────────────────────────
export interface ExportRecord {
  id: string; format: string;
  date_from: string | null; date_to: string | null;
  file_size: number; generated_at: string;
}
export interface ExportHistory { data: ExportRecord[]; pagination: PaginationInfo; }

// ─── Couples ────────────────────────────────────────────────
export interface Couple {
  id: string; status: string; invitation_code: string;
  partner_one_id: string; partner_two_id: string | null;
  created_at: string;
}
export interface CoupleInvite { id: string; status: string; invitation_code: string; partner_one_id: string; partner_two_id: string | null; created_at: string; }
export interface CoupleStatusResponse { status: string; couple: Couple | null; partner: User | null; }

// ─── Shared Finance ─────────────────────────────────────────
export interface SharedExpense {
  id: string; couple_id: string; category_id: string | null; paid_by: string;
  amount: number; description: string; notes: string | null;
  split_type: string; split_details: string | null; expense_date: string;
  attachment_url: string | null; created_at: string; updated_at: string;
}
export interface CreateSharedExpenseInput {
  amount: number; description: string; expense_date: string;
  category_id?: string; notes?: string;
  split_type?: 'equal' | 'percentage' | 'custom'; split_details?: string;
}
export interface SharedIncome {
  id: string; couple_id: string; received_by: string;
  amount: number; description: string; notes: string | null;
  income_date: string; created_at: string;
}
export interface CreateSharedIncomeInput {
  amount: number; description: string; income_date: string; notes?: string;
}
export interface Debt {
  id: string; debtor_id: string; creditor_id: string;
  shared_expense_id: string | null; amount: number;
  status: string; description: string | null; created_at: string;
}
export interface CoupleBalance {
  total_shared_expenses: number; total_shared_incomes: number; balance: number;
  partner_one_paid: number; partner_two_paid: number;
}

// ─── AI ─────────────────────────────────────────────────────
export interface AIChatResponse { answer: string; tokens_used: number; provider: string; }
export interface AIAnalysis {
  analysis_type: string; result: Record<string, unknown>; insights: string[];
}
export interface AIPredictions {
  prediction_type: string; predictions: Record<string, unknown>[];
  confidence: number; recommendations: string[];
}
export interface AIScore {
  score: number; grade: string;
  factors: { name: string; value: number; description: string }[];
  recommendations: string[];
}
export interface AIInsight {
  type: string; title: string; description: string; severity: string;
}
export interface AIRecommendation {
  type: string; title: string; description: string;
  potential_savings: number; priority: string;
}
export interface AISummary {
  period: string; summary: string; highlights: string[];
  kpis: Record<string, unknown>;
}
export interface AIFinancialHealth {
  status: string; score: number; indicators: Record<string, unknown>;
  recommendations: string[];
}
export interface AISimulator {
  scenario: string; current_projection: Record<string, unknown>;
  simulated_projection: Record<string, unknown>;
  difference: Record<string, unknown>; recommendation: string;
}
export interface AIHistoryEntry {
  id: string; question: string; answer: string; endpoint: string;
  tokens_input: number; tokens_output: number; cost_usd: number;
  provider: string; model: string; response_time_ms: number;
  feedback: number | null; created_at: string;
}

// ─── Chat ───────────────────────────────────────────────────
export interface ChatMessage {
  id: string; sender_id: string; receiver_id: string;
  message_type: string; content: string;
  shared_entity_id: string | null; shared_entity_type: string | null;
  is_read: boolean; attachment_url: string | null;
  created_at: string; updated_at: string;
}

// ─── Notifications ──────────────────────────────────────────
export interface Notification {
  id: string; user_id: string; notification_type: string; title: string;
  message: string; is_read: boolean; link: string | null;
  created_at: string; updated_at: string;
}

// ─── User Settings ──────────────────────────────────────────
export interface UserSettings {
  theme: string;
  biometric_enabled: boolean;
  notifications_enabled: boolean;
  reminder_enabled: boolean;
  ai_enabled: boolean;
  default_home_screen: string;
}
