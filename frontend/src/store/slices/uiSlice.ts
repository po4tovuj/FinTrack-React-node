import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/**
 * Interface for UI state
 * Manages temporary UI states like modals, notifications, and view preferences
 */
interface UiState {
  // View preferences (not persisted)
  activeView: 'personal' | 'family';
  
  // Modal states
  modals: {
    addTransaction: { open: boolean; data?: any };
    editTransaction: { open: boolean; data?: any };
    settleUp: { open: boolean; data?: any };
    inviteMember: { open: boolean; familyId?: string };
    addBudget: { open: boolean; data?: any };
    addShoppingItem: { open: boolean; listId?: string };
  };
  
  // Notifications
  notifications: Array<{
    id: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    duration?: number;
  }>;
  
  // Loading states
  loading: {
    transactions: boolean;
    budgets: boolean;
    shoppingLists: boolean;
    analytics: boolean;
  };
  
  // Sidebar state (mobile)
  sidebarOpen: boolean;
}

const initialState: UiState = {
  activeView: 'personal',
  modals: {
    addTransaction: { open: false },
    editTransaction: { open: false },
    settleUp: { open: false },
    inviteMember: { open: false },
    addBudget: { open: false },
    addShoppingItem: { open: false },
  },
  notifications: [],
  loading: {
    transactions: false,
    budgets: false,
    shoppingLists: false,
    analytics: false,
  },
  sidebarOpen: false,
};

/**
 * UI slice for managing application UI state
 * Handles modals, notifications, loading states, and view preferences
 */
const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // View management
    setActiveView: (state, action: PayloadAction<'personal' | 'family'>) => {
      state.activeView = action.payload;
    },

    // Modal management
    openAddTransactionModal: (state, action: PayloadAction<any>) => {
      state.modals.addTransaction = { open: true, data: action.payload };
    },
    closeAddTransactionModal: (state) => {
      state.modals.addTransaction = { open: false };
    },

    openEditTransactionModal: (state, action: PayloadAction<any>) => {
      state.modals.editTransaction = { open: true, data: action.payload };
    },
    closeEditTransactionModal: (state) => {
      state.modals.editTransaction = { open: false };
    },

    openSettleUpModal: (state, action: PayloadAction<any>) => {
      state.modals.settleUp = { open: true, data: action.payload };
    },
    closeSettleUpModal: (state) => {
      state.modals.settleUp = { open: false };
    },

    openInviteMemberModal: (state, action: PayloadAction<{ familyId: string }>) => {
      state.modals.inviteMember = { open: true, familyId: action.payload.familyId };
    },
    closeInviteMemberModal: (state) => {
      state.modals.inviteMember = { open: false };
    },

    openAddBudgetModal: (state, action: PayloadAction<any>) => {
      state.modals.addBudget = { open: true, data: action.payload };
    },
    closeAddBudgetModal: (state) => {
      state.modals.addBudget = { open: false };
    },

    openAddShoppingItemModal: (state, action: PayloadAction<{ listId: string }>) => {
      state.modals.addShoppingItem = { open: true, listId: action.payload.listId };
    },
    closeAddShoppingItemModal: (state) => {
      state.modals.addShoppingItem = { open: false };
    },

    // Notification management
    addNotification: (state, action: PayloadAction<{
      message: string;
      type: 'success' | 'error' | 'warning' | 'info';
      duration?: number;
    }>) => {
      const notification = {
        id: Date.now().toString(),
        ...action.payload,
      };
      state.notifications.push(notification);
    },

    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(
        (notification) => notification.id !== action.payload
      );
    },

    clearNotifications: (state) => {
      state.notifications = [];
    },

    // Loading state management
    setTransactionsLoading: (state, action: PayloadAction<boolean>) => {
      state.loading.transactions = action.payload;
    },
    setBudgetsLoading: (state, action: PayloadAction<boolean>) => {
      state.loading.budgets = action.payload;
    },
    setShoppingListsLoading: (state, action: PayloadAction<boolean>) => {
      state.loading.shoppingLists = action.payload;
    },
    setAnalyticsLoading: (state, action: PayloadAction<boolean>) => {
      state.loading.analytics = action.payload;
    },

    // Sidebar management (mobile)
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    closeSidebar: (state) => {
      state.sidebarOpen = false;
    },
  },
});

export const {
  setActiveView,
  openAddTransactionModal,
  closeAddTransactionModal,
  openEditTransactionModal,
  closeEditTransactionModal,
  openSettleUpModal,
  closeSettleUpModal,
  openInviteMemberModal,
  closeInviteMemberModal,
  openAddBudgetModal,
  closeAddBudgetModal,
  openAddShoppingItemModal,
  closeAddShoppingItemModal,
  addNotification,
  removeNotification,
  clearNotifications,
  setTransactionsLoading,
  setBudgetsLoading,
  setShoppingListsLoading,
  setAnalyticsLoading,
  toggleSidebar,
  closeSidebar,
} = uiSlice.actions;

export default uiSlice.reducer;