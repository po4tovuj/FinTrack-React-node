'use client';

import { useState } from 'react';
import { Plus, Share, MoreHorizontal, Check, X } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

// Mock shopping list data matching the designs
const mockShoppingItems = [
  {
    id: 1,
    name: 'Laptop',
    estimatedPrice: 1200.00,
    category: 'Electronics',
    priority: 'must-have',
    purchased: true,
    status: 'Purchased'
  },
  {
    id: 2,
    name: 'Bread',
    estimatedPrice: 3.00,
    category: 'Groceries',
    priority: 'must-have',
    purchased: false,
    status: 'Not purchased'
  },
  {
    id: 3,
    name: 'Coffee Maker',
    estimatedPrice: 80.00,
    category: 'Home',
    priority: 'nice-to-have',
    purchased: false,
    status: 'Not purchased'
  },
  {
    id: 4,
    name: 'Vacuum Cleaner',
    estimatedPrice: 150.00,
    category: 'Home',
    priority: 'nice-to-have',
    purchased: true,
    status: 'Purchased'
  },
  {
    id: 5,
    name: 'Eggs',
    estimatedPrice: 5.00,
    category: 'Groceries',
    priority: 'must-have',
    purchased: true,
    status: 'Purchased'
  },
  {
    id: 6,
    name: 'Headphones',
    estimatedPrice: 150.00,
    category: 'Electronics',
    priority: 'nice-to-have',
    purchased: false,
    status: 'Not purchased'
  },
  {
    id: 7,
    name: 'Picture Frame',
    estimatedPrice: 25.00,
    category: 'Home',
    priority: 'optional',
    purchased: false,
    status: 'Not purchased'
  },
  {
    id: 8,
    name: 'Gasoline',
    estimatedPrice: 60.00,
    category: 'Transport',
    priority: 'must-have',
    purchased: false,
    status: 'Not purchased'
  },
];

/**
 * Shopping List page component matching the UI designs
 */
export default function ShoppingListPage() {
  const [items, setItems] = useState(mockShoppingItems);
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'Electronics', 'Groceries', 'Home', 'Transport'];

  const togglePurchased = (itemId: number) => {
    setItems(items.map(item => 
      item.id === itemId 
        ? { 
            ...item, 
            purchased: !item.purchased,
            status: !item.purchased ? 'Purchased' : 'Not purchased'
          }
        : item
    ));
  };

  const filteredItems = items.filter(item => 
    selectedCategory === 'All' || item.category === selectedCategory
  );

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'must-have':
        return 'bg-orange-100 text-orange-800';
      case 'nice-to-have':
        return 'bg-blue-100 text-blue-800';
      case 'optional':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Electronics':
        return 'bg-blue-100 text-blue-800';
      case 'Groceries':
        return 'bg-green-100 text-green-800';
      case 'Home':
        return 'bg-purple-100 text-purple-800';
      case 'Transport':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Shopping List</h1>
            <div className="flex items-center space-x-3">
              <button className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
                <Share className="h-4 w-4 mr-1" />
                Share
              </button>
            </div>
          </div>

          {/* Add Item Button */}
          <div className="flex justify-start">
            <button className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors text-sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    selectedCategory === category
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {category}
                </button>
              ))}
            </nav>
          </div>

          {/* Shopping List Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                      Item
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                      Estimated Price
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                      Category
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">
                      
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filteredItems.map((item) => (
                    <tr key={item.id} className={`hover:bg-gray-50 ${item.purchased ? 'opacity-75' : ''}`}>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => togglePurchased(item.id)}
                            className={`flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                              item.purchased
                                ? 'bg-blue-600 border-blue-600 text-white'
                                : 'border-gray-300 hover:border-blue-500'
                            }`}
                          >
                            {item.purchased && <Check className="h-2.5 w-2.5" />}
                          </button>
                          <div className="flex flex-col">
                            <span className={`text-sm font-medium ${
                              item.purchased ? 'text-gray-500 line-through' : 'text-gray-900'
                            }`}>
                              {item.name}
                            </span>
                            {item.priority !== 'must-have' && (
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1 w-fit ${getPriorityColor(item.priority)}`}>
                                {item.priority.charAt(0).toUpperCase() + item.priority.slice(1).replace('-', ' ')}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm text-gray-900">${item.estimatedPrice.toFixed(2)}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(item.category)}`}>
                          {item.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`text-sm ${item.purchased ? 'text-green-600' : 'text-gray-600'}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                        <button className="text-gray-400 hover:text-gray-600">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Total Items</h3>
              <p className="text-2xl font-bold text-gray-900">{items.length}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Purchased</h3>
              <p className="text-2xl font-bold text-green-600">
                {items.filter(item => item.purchased).length}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Remaining</h3>
              <p className="text-2xl font-bold text-blue-600">
                {items.filter(item => !item.purchased).length}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Total Estimated</h3>
              <p className="text-2xl font-bold text-gray-900">
                ${items.reduce((sum, item) => sum + item.estimatedPrice, 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}