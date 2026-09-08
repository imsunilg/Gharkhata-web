export interface NavItem {
  path: string;
  label: string;
  icon: string;
  primary?: boolean;
}

export const NAV: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: '◉', primary: true },
  { path: '/expenses', label: 'Expenses', icon: '≡', primary: true },
  { path: '/income', label: 'Income', icon: '↑' },
  { path: '/budgets', label: 'Budgets', icon: '◑' },
  { path: '/bills', label: 'Bills', icon: '🗓' },
  { path: '/subscriptions', label: 'Subscriptions', icon: '↻' },
  { path: '/goals', label: 'Savings Goals', icon: '◎' },
  { path: '/debts', label: 'Debts & Loans', icon: '⚖' },
  { path: '/reports', label: 'Reports', icon: '▤', primary: true },
  { path: '/family', label: 'Family', icon: '👪' },
  { path: '/settings', label: 'Settings', icon: '⚙' },
];
