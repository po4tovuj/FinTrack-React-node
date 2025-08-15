'use client';

import { useState } from 'react';
import { Plus, Search, Filter, Calendar, ArrowUpDown } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

// Mock transaction data
const mockTransactions = [
  { id: 1, date: '2024-03-01', description: 'Rent Payment', category: 'Housing', amount: -1200.00, type: 'expense' },
  { id: 2, date: '2024-02-28', description: 'Salary Deposit', category: 'Income', amount: 5000.00, type: 'income' },
  { id: 3, date: '2024-02-25', description: 'Grocery Shopping', category: 'Food', amount: -150.00, type: 'expense' },
  { id: 4, date: '2024-02-22', description: 'Gas Station', category: 'Transportation', amount: -45.00, type: 'expense' },
  { id: 5, date: '2024-02-20', description: 'Movie Theater', category: 'Entertainment', amount: -25.00, type: 'expense' },
  { id: 6, date: '2024-02-18', description: 'Coffee Shop', category: 'Food', amount: -8.50, type: 'expense' },
  { id: 7, date: '2024-02-15', description: 'Electric Bill', category: 'Utilities', amount: -120.00, type: 'expense' },
  { id: 8, date: '2024-02-12', description: 'Freelance Payment', category: 'Income', amount: 800.00, type: 'income' },
  { id: 9, date: '2024-02-10', description: 'Restaurant', category: 'Dining', amount: -65.00, type: 'expense' },
  { id: 10, date: '2024-02-08', description: 'Gym Membership', category: 'Fitness', amount: -50.00, type: 'expense' },
];

/**
 * Transactions page component
 */
export default function TransactionsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  const categories = ['All', 'Income', 'Housing', 'Food', 'Transportation', 'Entertainment', 'Utilities', 'Dining', 'Fitness'];

  const filteredTransactions = mockTransactions
    .filter(transaction => {
      const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || transaction.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'date') {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortBy === 'amount') {
        comparison = Math.abs(a.amount) - Math.abs(b.amount);
      } else if (sortBy === 'description') {
        comparison = a.description.localeCompare(b.description);
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
              <p className="text-gray-600 mt-1">Track and manage your financial transactions</p>
            </div>
            <button className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
              <Plus className="h-4 w-4 mr-2" />
              Add Transaction
            </button>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Category Filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white min-w-[150px]"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Range */}
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white min-w-[120px]">
                  <option>This Month</option>
                  <option>Last Month</option>
                  <option>Last 3 Months</option>
                  <option>This Year</option>
                </select>
              </div>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('date')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Date</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('description')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Description</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th 
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('amount')}
                    >
                      <div className="flex items-center justify-end space-x-1">
                        <span>Amount</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTransactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(transaction.date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{transaction.description}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          transaction.type === 'income'
                            ? 'bg-green-100 text-green-800'
                            : transaction.category === 'Housing'
                            ? 'bg-blue-100 text-blue-800'
                            : transaction.category === 'Food'
                            ? 'bg-orange-100 text-orange-800'
                            : transaction.category === 'Transportation'
                            ? 'bg-purple-100 text-purple-800'
                            : transaction.category === 'Entertainment'
                            ? 'bg-pink-100 text-pink-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {transaction.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className={`text-sm font-medium ${
                          transaction.type === 'income'
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}>
                          {transaction.type === 'income' ? '+' : '-'}${Math.abs(transaction.amount).toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredTransactions.length === 0 && (
              <div className="px-6 py-12 text-center">
                <p className="text-gray-500">No transactions found matching your criteria.</p>
              </div>
            )}
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Total Income</h3>
              <p className="text-2xl font-bold text-green-600">
                +${mockTransactions
                  .filter(t => t.type === 'income')
                  .reduce((sum, t) => sum + t.amount, 0)
                  .toFixed(2)}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Total Expenses</h3>
              <p className="text-2xl font-bold text-red-600">
                -${Math.abs(mockTransactions
                  .filter(t => t.type === 'expense')
                  .reduce((sum, t) => sum + t.amount, 0))
                  .toFixed(2)}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Net Balance</h3>
              <p className="text-2xl font-bold text-blue-600">
                ${mockTransactions
                  .reduce((sum, t) => sum + t.amount, 0)
                  .toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}