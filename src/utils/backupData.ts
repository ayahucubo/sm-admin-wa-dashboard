// Backup data for when Google Sheets is unavailable
export const ccBenefitBackupData = [
  {
    id: "1",
    Company_Code: "GOLD001",
    Benefit_Name: "Cashback 2%",
    Description: "Cashback 2% untuk semua transaksi online dan offline",
    Category: "Reward",
    Status: "Active",
    Created_Date: "2024-01-15",
    Bank: "Bank ABC",
    Card_Type: "Gold"
  },
  {
    id: "2",
    Company_Code: "PLAT001", 
    Benefit_Name: "Airport Lounge Access",
    Description: "Akses gratis ke lounge bandara internasional",
    Category: "Travel",
    Status: "Active",
    Created_Date: "2024-01-10",
    Bank: "Bank ABC",
    Card_Type: "Platinum"
  },
  {
    id: "3",
    Company_Code: "SILV001",
    Benefit_Name: "Shopping Discount 10%",
    Description: "Diskon 10% untuk belanja di merchant partner",
    Category: "Shopping", 
    Status: "Active",
    Created_Date: "2024-01-20",
    Bank: "Bank ABC",
    Card_Type: "Silver"
  },
  {
    id: "4",
    Company_Code: "GOLD002",
    Benefit_Name: "Travel Insurance",
    Description: "Asuransi perjalanan gratis hingga $100,000",
    Category: "Insurance",
    Status: "Active", 
    Created_Date: "2024-01-25",
    Bank: "Bank XYZ",
    Card_Type: "Gold"
  },
  {
    id: "5",
    Company_Code: "PLAT002",
    Benefit_Name: "Concierge Service",
    Description: "Layanan concierge 24/7 untuk berbagai kebutuhan",
    Category: "Service",
    Status: "Active",
    Created_Date: "2024-02-01",
    Bank: "Bank XYZ", 
    Card_Type: "Platinum"
  }
];

export const ccPpBackupData = [
  {
    id: "1",
    Company_Code: "PP001",
    Product_Name: "Credit Card Gold",
    Description: "Kartu kredit dengan benefit premium",
    Interest_Rate: "2.5%",
    Annual_Fee: "500000",
    Status: "Active",
    Created_Date: "2024-01-15"
  },
  {
    id: "2", 
    Company_Code: "PP002",
    Product_Name: "Credit Card Platinum",
    Description: "Kartu kredit dengan benefit eksklusif",
    Interest_Rate: "2.0%",
    Annual_Fee: "1000000", 
    Status: "Active",
    Created_Date: "2024-01-20"
  }
];

export const menuMasterBackupData = [
  {
    id: "1",
    Menu_Name: "Dashboard",
    Menu_URL: "/dashboard",
    Icon: "dashboard",
    Parent_ID: null,
    Order_Number: "1",
    Status: "Active",
    Created_Date: "2024-01-01"
  },
  {
    id: "2",
    Menu_Name: "Admin",
    Menu_URL: "/admin", 
    Icon: "admin",
    Parent_ID: null,
    Order_Number: "2",
    Status: "Active",
    Created_Date: "2024-01-01"
  },
  {
    id: "3",
    Menu_Name: "CC Benefit Mapping",
    Menu_URL: "/admin/mapping-cc-benefit",
    Icon: "credit-card",
    Parent_ID: "2",
    Order_Number: "1",
    Status: "Active", 
    Created_Date: "2024-01-01"
  }
];

// Helper function to get backup data based on sheet type
export function getBackupData(sheetType: string) {
  switch (sheetType) {
    case 'cc-benefit':
      return ccBenefitBackupData;
    case 'cc-pp':
      return ccPpBackupData;
    case 'menu-master':
      return menuMasterBackupData;
    default:
      return [];
  }
}

// Convert backup data to the same format as Google Sheets (array of arrays)
export function convertBackupDataToRows(data: any[]): string[][] {
  if (data.length === 0) return [];
  
  // Get headers from the first object
  const headers = Object.keys(data[0]);
  
  // Create rows array with headers as first row
  const rows: string[][] = [headers];
  
  // Add data rows
  data.forEach(item => {
    const row = headers.map(header => String(item[header] || ''));
    rows.push(row);
  });
  
  return rows;
}
