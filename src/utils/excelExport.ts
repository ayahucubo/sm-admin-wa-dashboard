import * as XLSX from 'xlsx';

// Utility function to export data to Excel
export const exportToExcel = (data: any[], filename: string, sheetName: string = 'Sheet1') => {
  try {
    // Create a new workbook
    const workbook = XLSX.utils.book_new();
    
    // Convert data to worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    
    // Generate Excel file and trigger download
    XLSX.writeFile(workbook, `${filename}.xlsx`);
    
    return true;
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    return false;
  }
};

// Format Chat Volume Monitoring data for Excel
export const formatChatVolumeForExcel = (chartData: any[]) => {
  const excelData: any[] = [];
  
  chartData.forEach(item => {
    const date = new Date(item.date).toLocaleDateString('id-ID');
    const menuCounts = item.menuCounts || {};
    
    // Add a row for each menu type on this date
    Object.entries(menuCounts).forEach(([menuType, count]) => {
      excelData.push({
        'Tanggal': date,
        'Menu': menuType,
        'Jumlah Chat': count,
        'Total Hari Ini': item.total
      });
    });
    
    // If no menu data, add a summary row
    if (Object.keys(menuCounts).length === 0) {
      excelData.push({
        'Tanggal': date,
        'Menu': 'Total',
        'Jumlah Chat': item.total,
        'Total Hari Ini': item.total
      });
    }
  });
  
  return excelData;
};

// Format Unique Contacts data for Excel
export const formatUniqueContactsForExcel = (chartData: any[]) => {
  return chartData.map(item => ({
    'Tanggal': new Date(item.date).toLocaleDateString('id-ID'),
    'Unique Contacts': item.uniqueContacts
  }));
};

// Format Detailed Chat History data for Excel
export const formatChatHistoryForExcel = (chatHistory: any[]) => {
  return chatHistory.map((item, index) => ({
    'No': index + 1,
    'Execution ID': item.executionId,
    'Tanggal': new Date(item.startedAt).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }),
    'Kontak': item.contact || 'Unknown',
    'No. HP': item.phoneNumber || '-',
    'Current Menu': item.currentMenu || '-',
    'Pesan Masuk': item.chat || '-',
    'Jawaban': item.chatResponse || '-',
    'Workflow ID': item.workflowId,
    'Workflow Name': item.workflowName
  }));
};

// Format Contact Details data for Excel (for Unique Contacts drill-down)
export const formatContactDetailsForExcel = (contactDetails: any[], selectedDate: string) => {
  return contactDetails.map((contact, index) => ({
    'No': index + 1,
    'Tanggal': new Date(selectedDate).toLocaleDateString('id-ID'),
    'Contact ID': contact.contactId,
    'Contact Name': contact.contactName || 'Unknown',
    'Jumlah Chat': contact.chatCount
  }));
};

// Export multiple sheets to one Excel file
export const exportMultiSheetExcel = (
  sheets: Array<{
    data: any[];
    sheetName: string;
  }>,
  filename: string
) => {
  try {
    // Create a new workbook
    const workbook = XLSX.utils.book_new();
    
    // Add each sheet
    sheets.forEach(({ data, sheetName }) => {
      const worksheet = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    });
    
    // Generate Excel file and trigger download
    XLSX.writeFile(workbook, `${filename}.xlsx`);
    
    return true;
  } catch (error) {
    console.error('Error exporting multi-sheet Excel:', error);
    return false;
  }
};