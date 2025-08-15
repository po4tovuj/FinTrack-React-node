import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

/**
 * Sample user data for export functionality
 * In a real application, this would come from your GraphQL API or state management
 */
const getSampleUserData = () => ({
  profile: {
    name: 'John Doe',
    email: 'john.doe@example.com',
    joinDate: '2024-01-15',
    defaultView: 'personal',
  },
  transactions: [
    { date: '2024-08-01', description: 'Grocery Store', category: 'Food', amount: -85.50 },
    { date: '2024-08-02', description: 'Gas Station', category: 'Transportation', amount: -45.00 },
    { date: '2024-08-03', description: 'Salary', category: 'Income', amount: 3500.00 },
    { date: '2024-08-04', description: 'Restaurant', category: 'Dining', amount: -32.75 },
    { date: '2024-08-05', description: 'Utilities', category: 'Bills', amount: -125.00 },
  ],
  budgets: [
    { category: 'Food', budgeted: 400, spent: 285.50, remaining: 114.50 },
    { category: 'Transportation', budgeted: 200, spent: 145.00, remaining: 55.00 },
    { category: 'Entertainment', budgeted: 150, spent: 89.25, remaining: 60.75 },
    { category: 'Bills', budgeted: 500, spent: 425.00, remaining: 75.00 },
  ],
  summary: {
    totalIncome: 3500.00,
    totalExpenses: 288.25,
    netBalance: 3211.75,
    savingsRate: 91.8,
  }
});

/**
 * Export user financial data as PDF
 */
export const exportDataAsPDF = async (): Promise<void> => {
  try {
    const data = getSampleUserData();
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPosition = 20;
    
    // Helper function to add text with automatic page breaks
    const addText = (text: string, x: number, y: number, options?: any) => {
      if (y > 280) { // Near bottom of page
        doc.addPage();
        y = 20;
        yPosition = 20;
      }
      doc.text(text, x, y, options);
      return y;
    };

    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    yPosition = addText('FinTrack - Financial Data Export', 20, yPosition);
    
    // Date
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    yPosition += 10;
    yPosition = addText(`Generated on: ${new Date().toLocaleDateString()}`, 20, yPosition);
    
    // Profile Section
    yPosition += 20;
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    yPosition = addText('Profile Information', 20, yPosition);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    yPosition += 10;
    yPosition = addText(`Name: ${data.profile.name}`, 20, yPosition);
    yPosition += 8;
    yPosition = addText(`Email: ${data.profile.email}`, 20, yPosition);
    yPosition += 8;
    yPosition = addText(`Member Since: ${data.profile.joinDate}`, 20, yPosition);
    yPosition += 8;
    yPosition = addText(`Default View: ${data.profile.defaultView}`, 20, yPosition);

    // Summary Section
    yPosition += 20;
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    yPosition = addText('Financial Summary', 20, yPosition);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    yPosition += 10;
    yPosition = addText(`Total Income: $${data.summary.totalIncome.toFixed(2)}`, 20, yPosition);
    yPosition += 8;
    yPosition = addText(`Total Expenses: $${data.summary.totalExpenses.toFixed(2)}`, 20, yPosition);
    yPosition += 8;
    yPosition = addText(`Net Balance: $${data.summary.netBalance.toFixed(2)}`, 20, yPosition);
    yPosition += 8;
    yPosition = addText(`Savings Rate: ${data.summary.savingsRate}%`, 20, yPosition);

    // Recent Transactions Section
    yPosition += 20;
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    yPosition = addText('Recent Transactions', 20, yPosition);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    yPosition += 15;
    
    // Table headers
    yPosition = addText('Date', 20, yPosition);
    addText('Description', 60, yPosition);
    addText('Category', 120, yPosition);
    addText('Amount', 160, yPosition);
    
    // Underline headers
    doc.line(20, yPosition + 2, 190, yPosition + 2);
    
    doc.setFont('helvetica', 'normal');
    data.transactions.forEach((transaction) => {
      yPosition += 10;
      yPosition = addText(transaction.date, 20, yPosition);
      addText(transaction.description, 60, yPosition);
      addText(transaction.category, 120, yPosition);
      addText(`$${transaction.amount.toFixed(2)}`, 160, yPosition);
    });

    // Budget Overview Section
    yPosition += 20;
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    yPosition = addText('Budget Overview', 20, yPosition);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    yPosition += 15;
    
    // Budget table headers
    yPosition = addText('Category', 20, yPosition);
    addText('Budgeted', 70, yPosition);
    addText('Spent', 110, yPosition);
    addText('Remaining', 150, yPosition);
    
    // Underline headers
    doc.line(20, yPosition + 2, 190, yPosition + 2);
    
    doc.setFont('helvetica', 'normal');
    data.budgets.forEach((budget) => {
      yPosition += 10;
      yPosition = addText(budget.category, 20, yPosition);
      addText(`$${budget.budgeted.toFixed(2)}`, 70, yPosition);
      addText(`$${budget.spent.toFixed(2)}`, 110, yPosition);
      addText(`$${budget.remaining.toFixed(2)}`, 150, yPosition);
    });

    // Save the PDF
    doc.save('fintrack-financial-data.pdf');
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF export');
  }
};

/**
 * Export user financial data as Excel
 */
export const exportDataAsExcel = async (): Promise<void> => {
  try {
    const data = getSampleUserData();
    
    // Create a new workbook
    const workbook = XLSX.utils.book_new();
    
    // Profile worksheet
    const profileData = [
      ['Profile Information', ''],
      ['Name', data.profile.name],
      ['Email', data.profile.email],
      ['Member Since', data.profile.joinDate],
      ['Default View', data.profile.defaultView],
      [''],
      ['Financial Summary', ''],
      ['Total Income', data.summary.totalIncome],
      ['Total Expenses', data.summary.totalExpenses],
      ['Net Balance', data.summary.netBalance],
      ['Savings Rate (%)', data.summary.savingsRate],
    ];
    
    const profileSheet = XLSX.utils.aoa_to_sheet(profileData);
    XLSX.utils.book_append_sheet(workbook, profileSheet, 'Profile');
    
    // Transactions worksheet
    const transactionData = [
      ['Date', 'Description', 'Category', 'Amount'],
      ...data.transactions.map(t => [t.date, t.description, t.category, t.amount])
    ];
    
    const transactionSheet = XLSX.utils.aoa_to_sheet(transactionData);
    XLSX.utils.book_append_sheet(workbook, transactionSheet, 'Transactions');
    
    // Budget worksheet
    const budgetData = [
      ['Category', 'Budgeted', 'Spent', 'Remaining'],
      ...data.budgets.map(b => [b.category, b.budgeted, b.spent, b.remaining])
    ];
    
    const budgetSheet = XLSX.utils.aoa_to_sheet(budgetData);
    XLSX.utils.book_append_sheet(workbook, budgetSheet, 'Budget');
    
    // Generate and download the file
    XLSX.writeFile(workbook, 'fintrack-financial-data.xlsx');
  } catch (error) {
    console.error('Error generating Excel file:', error);
    throw new Error('Failed to generate Excel export');
  }
};

/**
 * Generic export function that handles both formats
 */
export const exportData = async (format: 'pdf' | 'excel'): Promise<void> => {
  if (format === 'pdf') {
    await exportDataAsPDF();
  } else if (format === 'excel') {
    await exportDataAsExcel();
  } else {
    throw new Error('Unsupported export format');
  }
};