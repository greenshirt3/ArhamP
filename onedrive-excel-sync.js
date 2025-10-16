// onedrive-excel-sync.js - Complete Excel Sync System (Optimized for Error Handling)

// --- External dependencies (must be defined in index.html for this to work) ---
// async function getOneDriveAccessToken()
// let isOneDriveOnline = false;
// let currentOneDriveUser = null;
// const excelSync = new OneDriveExcelSync();
// --------------------------------------------------------------------------------

class OneDriveExcelSync {
    constructor() {
        this.excelFileId = null;
        this.excelFileName = 'Arham_Printers_Database.xlsx';
        this.excelFilePath = `/ArhamPrinters/${this.excelFileName}`;
        this.sheets = {
            ITEMS: 'Calculator_Items',
            INVOICES: 'Invoices',
            CUSTOMERS: 'Customers',
            SETTINGS: 'Settings',
            HISTORY: 'Calculation_History'
        };
        if (typeof getOneDriveAccessToken !== 'function') {
            console.error("Dependency Error: getOneDriveAccessToken is not defined. OneDrive sync will fail.");
        }
    }

    // =============================================
    // EXCEL FILE MANAGEMENT
    // =============================================

    async ensureExcelFile() {
        const MAX_RETRIES = 3;
        const INITIAL_DELAY = 5000; // 5 seconds

        for (let i = 0; i < MAX_RETRIES; i++) {
            try {
                let fileInfo = await this.getExcelFileInfo();
                if (fileInfo) {
                    this.excelFileId = fileInfo.id;
                    return true;
                }

                // If file does not exist, attempt to create it.
                if (i === 0) {
                    console.log('Excel file not found. Attempting creation...');
                    const createSuccess = await this.createExcelFile();
                    if (createSuccess) {
                        fileInfo = await this.getExcelFileInfo();
                        this.excelFileId = fileInfo.id;
                    }
                }

                if (!this.excelFileId) {
                    throw new Error('File ID still not available after creation attempt.');
                }
                
                // Wait for Excel Online to process the file before initializing sheets
                await new Promise(resolve => setTimeout(resolve, INITIAL_DELAY * (i + 1)));

                // Initialize sheets. If this fails, the file may still be corrupt/unrecognized.
                await this.initializeSheets();
                
                // If initialization succeeds, the file is good.
                return true;

            } catch (error) {
                console.warn(`Attempt ${i + 1} failed to ensure Excel file.`, error.message);
                if (i === MAX_RETRIES - 1) {
                    console.error('Max retries reached. Failed to ensure Excel file.', error);
                    return false;
                }
            }
        }
        return false;
    }

    async getExcelFileInfo() {
        const accessToken = await getOneDriveAccessToken();
        if (!accessToken) return null;

        try {
            const response = await fetch(
                `https://graph.microsoft.com/v1.0/me/drive/root:${this.excelFilePath}`,
                {
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                }
            );

            if (response.ok) {
                return await response.json();
            }
            return null;
        } catch (error) {
            console.log('Error getting Excel file info (expected for 404):', error);
            return null;
        }
    }

    async createExcelFile() {
        const accessToken = await getOneDriveAccessToken();
        if (!accessToken) return false;

        try {
            // Ensure folder exists first
            await this.ensureOneDriveFolder('/ArhamPrinters');

            // The PUT request is the most reliable way to create the file at a specific path.
            // Using a minimal valid XLSX file content (a minimal zip archive).
            const emptyXLSXBlob = new Uint8Array([
                0x50, 0x4b, 0x05, 0x06, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
                0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
                0x00, 0x00
            ]).buffer;

            const response = await fetch(
                `https://graph.microsoft.com/v1.0/me/drive/root:/ArhamPrinters/${this.excelFileName}:/content`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                    },
                    body: emptyXLSXBlob
                }
            );

            if (response.ok || response.status === 201) {
                const fileInfo = await response.json();
                this.excelFileId = fileInfo.id;
                console.log('Excel file created successfully via PUT.');
                return true;
            }
            console.error('Failed to create Excel file. Status:', response.status);
            return false;

        } catch (error) {
            console.error('Error creating Excel file:', error);
            return false;
        }
    }

    async ensureOneDriveFolder(folderPath) {
        const accessToken = await getOneDriveAccessToken();
        if (!accessToken) return;

        try {
            const checkResponse = await fetch(
                `https://graph.microsoft.com/v1.0/me/drive/root:${folderPath}`,
                {
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                }
            );

            if (checkResponse.ok) {
                return;
            }

            await fetch(
                `https://graph.microsoft.com/v1.0/me/drive/root/children`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        name: folderPath.substring(folderPath.lastIndexOf('/') + 1),
                        folder: {},
                        '@microsoft.graph.conflictBehavior': 'ignore' // Use ignore for robustness
                    })
                }
            );
        } catch (error) {
            console.error(`Error ensuring folder ${folderPath}:`, error);
        }
    }

    async initializeSheets() {
        if (!this.excelFileId) return;
        
        console.log('Initializing Excel sheet headers...');
        // Note: Graph API automatically creates a 'Sheet1' on new file creation.
        // We ensure all target sheets exist by attempting to write to them.

        const sheetPromises = [
            this.updateSheetHeaders(this.sheets.ITEMS, [
                'Main Category', 'Subcategory', 'Item Name', 'Price', 'Type', 
                'Design Charges', 'Paper Cost', 'Binding Cost', 'Color Cost', 'Last Updated'
            ]),
            this.updateSheetHeaders(this.sheets.INVOICES, [
                'Invoice Number', 'Date', 'Due Date', 'Customer Name', 'Customer Phone', 
                'Customer Address', 'Items Count', 'Subtotal', 'Tax', 'Total Amount',
                'Previous Balance', 'Payment Received', 'Remaining Balance', 'Status', 'Created Date'
            ]),
            this.updateSheetHeaders(this.sheets.CUSTOMERS, [
                'Customer Name', 'Phone', 'Address', 'Total Invoices', 
                'Current Balance', 'Last Invoice Date', 'Created Date'
            ]),
            this.updateSheetHeaders(this.sheets.SETTINGS, [
                'Setting Name', 'Value', 'Last Updated'
            ]),
            this.updateSheetHeaders(this.sheets.HISTORY, [
                'Date', 'Main Category', 'Subcategory', 'Item Name', 
                'Quantity', 'Design Charges', 'Total Price', 'Calculated By'
            ])
        ];

        await Promise.allSettled(sheetPromises);
        console.log('Sheet header initialization complete.');
    }

    // =============================================
    // EXCEL DATA SYNC FUNCTIONS (sync* functions remain the same)
    // =============================================

    async syncAllDataToExcel(calculatorData, invoices, customers, history) {
        if (!await this.ensureExcelFile()) {
            console.error('Cannot sync: Excel file not available');
            return false;
        }

        try {
            // Sync all data to respective sheets
            const itemSync = this.syncCalculatorItems(calculatorData.items);
            const invoiceSync = this.syncInvoices(invoices);
            const customerSync = this.syncCustomers(customers);
            const settingSync = this.syncSettings(calculatorData.settings);
            const historySync = this.syncHistory(history);

            await Promise.all([itemSync, invoiceSync, customerSync, settingSync, historySync]);
            
            console.log('All data synced to Excel successfully');
            return true;
        } catch (error) {
            console.error('Error syncing all data to Excel:', error);
            return false;
        }
    }

    async syncCalculatorItems(items) {
        const rows = items.map(item => [
            item.mainCategory || '', item.subcategory || '', item.itemName || '',
            item.price || 0, item.type || 'fixed', item.designCharges || 0, 
            item.paperCost || 0, item.bindingCost || 0, item.colorCost || 0,
            new Date().toISOString()
        ]);
        await this.updateSheetData(this.sheets.ITEMS, rows);
    }

    async syncInvoices(invoices) {
        const rows = invoices.map(invoice => [
            invoice.invoiceNo || '', invoice.date || '', invoice.dueDate || '',
            invoice.customerName || 'N/A', invoice.customerPhone || '', invoice.customerAddress || '',
            invoice.items?.length || 0, invoice.subtotal || 0, invoice.taxAmount || 0, 
            invoice.total || 0, invoice.previousBalance || 0, invoice.payment || 0, 
            invoice.remainingBalance || 0, invoice.status || 'pending', invoice.created || new Date().toISOString()
        ]);
        await this.updateSheetData(this.sheets.INVOICES, rows);
    }

    async syncCustomers(customers) {
        const rows = customers.map(customer => [
            customer.name || '', customer.phone || '', customer.address || '',
            customer.invoicesCount || 0, customer.balance || 0,
            customer.lastInvoiceDate || '', customer.created || new Date().toISOString()
        ]);
        await this.updateSheetData(this.sheets.CUSTOMERS, rows);
    }

    async syncSettings(settings) {
        const rows = Object.entries(settings).map(([key, value]) => [
            key, value, new Date().toISOString()
        ]);
        await this.updateSheetData(this.sheets.SETTINGS, rows);
    }

    async syncHistory(history) {
        const rows = history.map(record => [
            record.timestamp || new Date().toLocaleString(), record.mainCategory || '', 
            record.subcategory || '', record.itemName || '', record.quantity || 1, 
            record.designCharges || 0, record.total || 0, 'Admin'
        ]);
        await this.updateSheetData(this.sheets.HISTORY, rows);
    }

    // =============================================
    // EXCEL API FUNCTIONS
    // =============================================

    async updateSheetHeaders(sheetName, headers) {
        const accessToken = await getOneDriveAccessToken();
        if (!accessToken || !this.excelFileId) return;

        try {
            // Check if sheet exists; create it if it doesn't (or rely on Graph to create on first write)
            // The Graph API is usually resilient enough to create a sheet implicitly on first write if needed.
            const headerRange = `A1:${String.fromCharCode(64 + headers.length)}1`;
            const endpoint = `https://graph.microsoft.com/v1.0/me/drive/items/${this.excelFileId}/workbook/worksheets('${sheetName}')/range(address='${headerRange}')`;

            const response = await fetch(endpoint, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    values: [headers]
                })
            });

            if (!response.ok) {
                 // Attempt to add the worksheet explicitly if it fails
                 await this.addWorksheet(sheetName);
                 // Retry writing headers after creating the sheet
                 await fetch(endpoint, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        values: [headers]
                    })
                });
            }

        } catch (error) {
            console.error(`Error updating/creating headers for ${sheetName}:`, error);
            throw error; // Re-throw to signal failure in ensureExcelFile loop
        }
    }
    
    async addWorksheet(sheetName) {
        const accessToken = await getOneDriveAccessToken();
        if (!accessToken || !this.excelFileId) return;

        try {
            const endpoint = `https://graph.microsoft.com/v1.0/me/drive/items/${this.excelFileId}/workbook/worksheets`;

            await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: sheetName
                })
            });
            console.log(`Worksheet ${sheetName} created successfully.`);
        } catch (error) {
            console.warn(`Could not explicitly add worksheet ${sheetName}:`, error);
        }
    }

    async updateSheetData(sheetName, rows) {
        const accessToken = await getOneDriveAccessToken();
        if (!accessToken || !this.excelFileId) return;

        try {
            await this.clearSheetData(sheetName);

            if (rows.length > 0) {
                const startCell = 'A2';
                const endCell = `${String.fromCharCode(64 + rows[0].length)}${rows.length + 1}`;
                const dataRange = `${startCell}:${endCell}`;
                const endpoint = `https://graph.microsoft.com/v1.0/me/drive/items/${this.excelFileId}/workbook/worksheets('${sheetName}')/range(address='${dataRange}')`;

                await fetch(endpoint, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        values: rows
                    })
                });
            }
        } catch (error) {
            console.error(`Error updating data for ${sheetName}:`, error);
        }
    }

    async clearSheetData(sheetName) {
        const accessToken = await getOneDriveAccessToken();
        if (!accessToken || !this.excelFileId) return;

        try {
            const endpoint = `https://graph.microsoft.com/v1.0/me/drive/items/${this.excelFileId}/workbook/worksheets('${sheetName}')/range(address='A2:Z5000')/clear`;
            
            await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    applyTo: 'contents'
                })
            });
        } catch (error) {
            console.warn(`Could not clear sheet ${sheetName}, possibly empty or doesn't exist.`, error);
        }
    }

    async getExcelFileLink() {
        if (!this.excelFileId) return null;
        
        const accessToken = await getOneDriveAccessToken();
        if (!accessToken) return null;

        try {
            const response = await fetch(
                `https://graph.microsoft.com/v1.0/me/drive/items/${this.excelFileId}/createLink`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        type: 'view',
                        scope: 'anonymous'
                    })
                }
            );

            if (response.ok) {
                const linkInfo = await response.json();
                return linkInfo.link?.webUrl || null;
            }
            return null;
        } catch (error) {
            console.error('Error getting Excel file link:', error);
            return null;
        }
    }
}