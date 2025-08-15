'use client';

import { useState } from 'react';
import { Plus, Edit3, TrendingUp, TrendingDown } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

// Mock budget data matching the budget.png design
const budgetCategories = [
  {
    id: 1,
    name: 'Housing',
    budgeted: 1950,
    spent: 0,
    remaining: 1950,
    color: 'bg-green-500',
    status: 'good'
  },
  {
    id: 2,
    name: 'Food',
    budgeted: 400,
    spent: 500,
    remaining: -100,
    color: 'bg-red-500',
    status: 'overspent'
  },
  {
    id: 3,
    name: 'Transportation',
    budgeted: 300,
    spent: 0,
    remaining: 300,
    color: 'bg-green-500',
    status: 'good'
  },
  {
    id: 4,
    name: 'Entertainment',
    budgeted: 300,
    spent: 200,
    remaining: 100,
    color: 'bg-green-500',
    status: 'good'
  },
];

/**
 * Budget page component matching budget.png design
 */
export default function BudgetPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('Monthly');
  
  const totalBudget = budgetCategories.reduce((sum, cat) => sum + cat.budgeted, 0);
  const totalSpent = budgetCategories.reduce((sum, cat) => sum + cat.spent, 0);
  const totalRemaining = totalBudget - totalSpent;

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <h1 className="text-3xl font-bold text-gray-900">Budget</h1>
              <span className="text-3xl font-bold text-gray-900">${totalBudget.toLocaleString()}</span>
            </div>
          </div>

          {/* Period Toggle */}
          <div className="flex items-center space-x-1 bg-white rounded-lg p-1 border border-gray-200 w-fit">
            <button
              onClick={() => setSelectedPeriod('Monthly')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                selectedPeriod === 'Monthly'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setSelectedPeriod('Yearly')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                selectedPeriod === 'Yearly'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Yearly
            </button>
          </div>

          {/* Budget Categories */}
          <div className="space-y-6">
            {budgetCategories.map((category) => {
              const percentage = category.budgeted > 0 ? (category.spent / category.budgeted) * 100 : 0;
              const cappedPercentage = Math.min(percentage, 100);
              
              return (
                <div key={category.id} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-900">{category.name}</h3>
                    <button className="inline-flex items-center px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-700 rounded-lg hover:bg-blue-50 transition-colors">
                      <Edit3 className="h-4 w-4 mr-1" />
                      Edit
                    </button>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div
                        className={`h-4 rounded-full ${category.color} transition-all duration-300`}
                        style={{ width: `${cappedPercentage}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Budget Details */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {category.status === 'overspent' ? (
                        <>
                          <span className="text-lg font-semibold text-red-600">
                            ${category.spent} of ${category.budgeted}
                          </span>
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-800 bg-red-100 rounded-full">
                            Overspent
                          </span>
                        </>
                      ) : (
                        <span className="text-lg font-medium text-gray-700">
                          ${category.remaining} remaining
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {category.status === 'overspent' ? (
                        <TrendingDown className="h-5 w-5 text-red-500" />
                      ) : (
                        <TrendingUp className="h-5 w-5 text-green-500" />
                      )}
                      <span className="text-sm text-gray-500">
                        ${category.budgeted}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add Category Button */}
          <div className="flex justify-center pt-4">
            <button className="inline-flex items-center px-6 py-3 text-blue-600 hover:text-blue-700 font-medium rounded-lg hover:bg-blue-50 transition-colors border-2 border-dashed border-blue-300 hover:border-blue-400">
              <Plus className="h-5 w-5 mr-2" />
              Add Category
            </button>
          </div>

          {/* Budget Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">Total Budgeted</h3>
                <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">${totalBudget.toLocaleString()}</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">Total Spent</h3>
                <div className="h-8 w-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <TrendingDown className="h-4 w-4 text-red-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">${totalSpent.toLocaleString()}</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">Remaining</h3>
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                  totalRemaining >= 0 ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {totalRemaining >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                </div>
              </div>
              <p className={`text-2xl font-bold ${
                totalRemaining >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                ${Math.abs(totalRemaining).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Background Wave Decoration (matching the design) */}
          <div className="relative mt-12">
            <svg
              className="w-full h-24 text-blue-100"
              viewBox="0 0 1000 200"
              preserveAspectRatio="none"
            >
              <path
                d="M0,50 Q250,100 500,50 T1000,50 V200 H0 Z"
                fill="currentColor"
                opacity="0.3"
              />
              <path
                d="M0,80 Q250,130 500,80 T1000,80 V200 H0 Z"
                fill="currentColor"
                opacity="0.2"
              />
            </svg>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}