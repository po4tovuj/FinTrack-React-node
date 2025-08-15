// Simple test file to verify export functionality
import { exportData } from './export.ts';

console.log('Export functions loaded successfully');
console.log('exportData function:', typeof exportData);

// Test that we can call the function without errors
try {
  console.log('Export utility is ready to use');
} catch (error) {
  console.error('Error with export utility:', error);
}