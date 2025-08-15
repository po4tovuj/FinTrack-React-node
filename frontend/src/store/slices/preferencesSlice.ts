import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/**
 * Interface for user preferences
 * These settings are persisted across sessions
 */
interface PreferencesState {
  // Theme preferences
  theme: 'light' | 'dark' | 'system';
  
  // Default view preference
  defaultView: 'personal' | 'family';
  
  // Currency and localization
  defaultCurrency: string;
  locale: string;
  
  // Notification preferences
  notifications: {
    budgetAlerts: boolean;
    expenseReminders: boolean;
    familyUpdates: boolean;
    emailNotifications: boolean;
    pushNotifications: boolean;
  };
  
  // Display preferences
  display: {
    compactMode: boolean;
    showCategoryColors: boolean;
    chartAnimations: boolean;
    showBalance: boolean; // Hide/show balance for privacy
  };
  
  // Dashboard preferences
  dashboard: {
    defaultPeriod: 'week' | 'month' | 'year';
    hiddenCards: string[];
    cardOrder: string[];
  };
}

const initialState: PreferencesState = {
  theme: 'system',
  defaultView: 'personal',
  defaultCurrency: 'USD',
  locale: 'en-US',
  notifications: {
    budgetAlerts: true,
    expenseReminders: false,
    familyUpdates: true,
    emailNotifications: true,
    pushNotifications: false,
  },
  display: {
    compactMode: false,
    showCategoryColors: true,
    chartAnimations: true,
    showBalance: true,
  },
  dashboard: {
    defaultPeriod: 'month',
    hiddenCards: [],
    cardOrder: ['balance', 'income', 'expenses', 'budget', 'transactions', 'charts'],
  },
};

/**
 * Preferences slice for managing user settings and preferences
 * All settings in this slice are persisted to localStorage
 */
const preferencesSlice = createSlice({
  name: 'preferences',
  initialState,
  reducers: {
    // Theme management
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'system'>) => {
      state.theme = action.payload;
    },

    // View preferences
    setDefaultView: (state, action: PayloadAction<'personal' | 'family'>) => {
      state.defaultView = action.payload;
    },

    // Currency and localization
    setDefaultCurrency: (state, action: PayloadAction<string>) => {
      state.defaultCurrency = action.payload;
    },
    setLocale: (state, action: PayloadAction<string>) => {
      state.locale = action.payload;
    },

    // Notification preferences
    setBudgetAlerts: (state, action: PayloadAction<boolean>) => {
      state.notifications.budgetAlerts = action.payload;
    },
    setExpenseReminders: (state, action: PayloadAction<boolean>) => {
      state.notifications.expenseReminders = action.payload;
    },
    setFamilyUpdates: (state, action: PayloadAction<boolean>) => {
      state.notifications.familyUpdates = action.payload;
    },
    setEmailNotifications: (state, action: PayloadAction<boolean>) => {
      state.notifications.emailNotifications = action.payload;
    },
    setPushNotifications: (state, action: PayloadAction<boolean>) => {
      state.notifications.pushNotifications = action.payload;
    },

    // Display preferences
    setCompactMode: (state, action: PayloadAction<boolean>) => {
      state.display.compactMode = action.payload;
    },
    setShowCategoryColors: (state, action: PayloadAction<boolean>) => {
      state.display.showCategoryColors = action.payload;
    },
    setChartAnimations: (state, action: PayloadAction<boolean>) => {
      state.display.chartAnimations = action.payload;
    },
    setShowBalance: (state, action: PayloadAction<boolean>) => {
      state.display.showBalance = action.payload;
    },

    // Dashboard preferences
    setDefaultPeriod: (state, action: PayloadAction<'week' | 'month' | 'year'>) => {
      state.dashboard.defaultPeriod = action.payload;
    },
    setHiddenCards: (state, action: PayloadAction<string[]>) => {
      state.dashboard.hiddenCards = action.payload;
    },
    setCardOrder: (state, action: PayloadAction<string[]>) => {
      state.dashboard.cardOrder = action.payload;
    },

    // Bulk update preferences
    updatePreferences: (state, action: PayloadAction<Partial<PreferencesState>>) => {
      return { ...state, ...action.payload };
    },

    // Reset to defaults
    resetPreferences: () => initialState,
  },
});

export const {
  setTheme,
  setDefaultView,
  setDefaultCurrency,
  setLocale,
  setBudgetAlerts,
  setExpenseReminders,
  setFamilyUpdates,
  setEmailNotifications,
  setPushNotifications,
  setCompactMode,
  setShowCategoryColors,
  setChartAnimations,
  setShowBalance,
  setDefaultPeriod,
  setHiddenCards,
  setCardOrder,
  updatePreferences,
  resetPreferences,
} = preferencesSlice.actions;

export default preferencesSlice.reducer;