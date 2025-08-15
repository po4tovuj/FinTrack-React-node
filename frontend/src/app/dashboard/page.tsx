'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Plus, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

// Mock data matching the dashboard design
const expensesByCategory = [
  { name: 'Housing', value: 35, color: '#06b6d4' },
  { name: 'Food', value: 25, color: '#f59e0b' },
  { name: 'Transportation', value: 20, color: '#8b5cf6' },
  { name: 'Entertainment', value: 20, color: '#ef4444' },
];

const monthlyExpenses = [
  { month: 'Jan', expenses: 2100 },
  { month: 'Feb', expenses: 2300 },
  { month: 'Mar', expenses: 2200 },
  { month: 'Apr', expenses: 2400 },
  { month: 'May', expenses: 2250 },
  { month: 'Jun', expenses: 2350 },
  { month: 'Jul', expenses: 2500 },
  { month: 'Aug', expenses: 2300 },
  { month: 'Sep', expenses: 2400 },
  { month: 'Oct', expenses: 2200 },
  { month: 'Nov', expenses: 2300 },
  { month: 'Dec', expenses: 2250 },
];

const recentTransactions = [
  { id: 1, date: 'Mar 1', description: 'Rent', category: 'Housing', amount: -1200.00, type: 'expense' },
  { id: 2, date: 'Feb 25', description: 'Grocery Store', category: 'Food', amount: -150.00, type: 'expense' },
  { id: 3, date: 'Feb 15', description: 'Restaurant', category: 'Dining', amount: -45.00, type: 'expense' },
  { id: 4, date: 'Feb 1', description: 'Salary', category: 'Income', amount: 5000.00, type: 'income' },
  { id: 5, date: 'Jan 30', description: 'Gym Membership', category: 'Fitness', amount: -50.00, type: 'expense' },
];

/**
 * Dashboard page component matching Personal Finance Dashboard Overview.png design
 */
export default function DashboardPage() {
  const currentDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long' 
  });

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Personal Finance Dashboard</h1>
          </div>

          {/* Overview Cards - Exact positioning like image */}
          <div className="grid grid-cols-3 gap-8">
            {/* Balance Card */}
            <div>
              <div className="text-sm font-medium text-gray-600 mb-2">Balance</div>
              <div className="text-3xl font-bold text-gray-900 mb-1">$7,500.00</div>
              <div className="text-sm text-green-600">+$2400 this month</div>
            </div>

            {/* Income Card */}
            <div>
              <div className="text-sm font-medium text-gray-600 mb-2">Income</div>
              <div className="text-3xl font-bold text-gray-900 mb-1">$5,200.00</div>
              <div className="text-sm text-green-600">+$2400 this month</div>
            </div>

            {/* Expenses Card */}
            <div>
              <div className="text-sm font-medium text-gray-600 mb-2">Expenses</div>
              <div className="text-3xl font-bold text-gray-900 mb-1">$2,800.00</div>
              <div className="text-sm text-red-600">+$200 this month</div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Budget Progress */}
            <div className="space-y-6">
              {/* Budget Section */}
              <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-semibold text-gray-900">Budget</h2>
                  <span className="text-xl font-bold text-gray-900">$3,000</span>
                </div>
                
                {/* Current Month Expenses */}
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-600">Current Month Expenses</span>
                    <span className="text-xs text-gray-900">$2,250</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-cyan-400 h-2 rounded-full" style={{ width: '75%' }}></div>
                  </div>
                </div>

                {/* Budget Categories */}
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-700">Groceries</span>
                      <span className="text-xs text-gray-900">$500 of</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div className="bg-cyan-400 h-1.5 rounded-full" style={{ width: '60%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-700">Entertainment</span>
                      <span className="text-xs text-gray-900">$300 of</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div className="bg-cyan-400 h-1.5 rounded-full" style={{ width: '75%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-700">Transportation</span>
                      <span className="text-xs text-gray-900">$150 of</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div className="bg-cyan-400 h-1.5 rounded-full" style={{ width: '40%' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Expenses Chart */}
              <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100">
                <h2 className="text-base font-semibold text-gray-900 mb-4">Expenses</h2>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyExpenses}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis dataKey="month" stroke="#6b7280" fontSize={10} />
                      <YAxis stroke="#6b7280" fontSize={10} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          fontSize: '12px'
                        }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="expenses" 
                        stroke="#06b6d4" 
                        strokeWidth={2}
                        dot={{ fill: '#06b6d4', strokeWidth: 2, r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Middle Column - Analytics */}
            <div className="space-y-6">
              {/* Expenses by Category */}
              <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100">
                <h2 className="text-base font-semibold text-gray-900 mb-4">Analytics</h2>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Expenses by Category</h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expensesByCategory}
                        cx="50%"
                        cy="50%"
                        innerRadius={35}
                        outerRadius={70}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {expensesByCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  {expensesByCategory.map((item, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className="text-xs text-gray-700">{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Recent Transactions */}
            <div className="space-y-6">
              {/* Recent Transactions */}
              <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-semibold text-gray-900">Recent Transactions</h2>
                  <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                    View all
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-4 gap-2 text-xs font-medium text-gray-500 pb-2 border-b border-gray-100">
                    <div>Date</div>
                    <div>Payee</div>
                    <div>Category</div>
                    <div className="text-right">Amount</div>
                  </div>
                  {recentTransactions.slice(0, 4).map((transaction) => (
                    <div key={transaction.id} className="grid grid-cols-4 gap-2 text-xs py-2 hover:bg-gray-50">
                      <div className="text-gray-600">{transaction.date}</div>
                      <div className="text-gray-900 font-medium">{transaction.description}</div>
                      <div className="text-gray-600">{transaction.category}</div>
                      <div className={`text-right font-medium ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-gray-900'
                      }`}>
                        {transaction.type === 'income' ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Transaction Button */}
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <button className="w-full flex items-center justify-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md transition-colors">
                    Add Transaction
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}