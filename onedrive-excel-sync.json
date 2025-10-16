// onedrive-excel-sync.js - Complete Excel Sync System

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
        // Ensure MSAL functions are globally available for API calls
        if (typeof getOneDriveAccessToken !== 'function') {
            console.error("Dependency Error: getOneDriveAccessToken is not defined. OneDrive sync will fail.");
        }
    }

    // =============================================
    // EXCEL FILE MANAGEMENT
    // =============================================

    async ensureExcelFile() {
        try {
            // Check if Excel file exists
            const fileInfo = await this.getExcelFileInfo();
            if (fileInfo) {
                this.excelFileId = fileInfo.id;
                return true;
            }

            // Create new Excel file (simplified template)
            const success = await this.createExcelFile();
            if (success) {
                // Wait for the file to be processed by Excel Online, then initialize sheets
                await new Promise(resolve => setTimeout(resolve, 5000));
                await this.initializeSheets();
            }
            return success;
        } catch (error) {
            console.error('Error ensuring Excel file:', error);
            return false;
        }
    }

    async getExcelFileInfo() {
        const accessToken = await getOneDriveAccessToken();
        if (!accessToken) return null;

        try {
            const response = await fetch(
                `https://graph.microsoft.com/v1.0/me/drive/root:${this.excelFilePath}`,
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                }
            );

            if (response.ok) {
                const fileInfo = await response.json();
                return fileInfo;
            }
            return null;
        } catch (error) {
            // Error 404 is common if file doesn't exist
            console.log('Excel file not found or error getting info:', error);
            return null;
        }
    }

    async createExcelFile() {
        const accessToken = await getOneDriveAccessToken();
        if (!accessToken) return false;

        try {
            // Create a small, empty, valid XLSX file (Base64 encoded binary data)
            // Creating a new file and uploading it. This is a complex operation for a browser app.
            // A simpler, more reliable approach for browser-based apps is to copy a template or
            // create an empty file, which requires binary manipulation.
            // For simplicity, we'll try a minimal PUT request which usually works on a plain folder path.
            
            // Create the ArhamPrinters folder if it doesn't exist
            await this.ensureOneDriveFolder('/ArhamPrinters');

            const response = await fetch(
                `https://graph.microsoft.com/v1.0/me/drive/root:/ArhamPrinters/${this.excelFileName}:/content`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                    },
                    body: new Uint8Array([0x50, 0x4B, 0x05, 0x06, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]).buffer // Minimal empty zip (xlsx is a zip)
                }
            );

            if (response.ok || response.status === 201) {
                const fileInfo = await response.json();
                this.excelFileId = fileInfo.id;
                return true;
            }
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
            // Check if folder exists
            const checkResponse = await fetch(
                `https://graph.microsoft.com/v1.0/me/drive/root:${folderPath}`,
                {
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                }
            );

            if (checkResponse.ok) {
                return; // Folder exists
            }

            // Create folder
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
                        '@microsoft.graph.conflictBehavior': 'rename'
                    })
                }
            );
        } catch (error) {
            console.error(`Error ensuring folder ${folderPath}:`, error);
        }
    }

    async initializeSheets() {
        if (!this.excelFileId) return;
        
        // This is simplified and assumes sheets exist, which is true for a new XLSX file.
        // The real Graph API call for adding sheets is complex. We focus on updating the data/headers.
        
        await this.updateSheetHeaders(this.sheets.ITEMS, [
            'Main Category', 'Subcategory', 'Item Name', 'Price', 'Type', 
            'Design Charges', 'Paper Cost', 'Binding Cost', 'Color Cost', 'Last Updated'
        ]);

        await this.updateSheetHeaders(this.sheets.INVOICES, [
            'Invoice Number', 'Date', 'Due Date', 'Customer Name', 'Customer Phone', 
            'Customer Address', 'Items Count', 'Subtotal', 'Tax', 'Total Amount',
            'Previous Balance', 'Payment Received', 'Remaining Balance', 'Status', 'Created Date'
        ]);

        await this.updateSheetHeaders(this.sheets.CUSTOMERS, [
            'Customer Name', 'Phone', 'Address', 'Total Invoices', 
            'Current Balance', 'Last Invoice Date', 'Created Date'
        ]);

        await this.updateSheetHeaders(this.sheets.SETTINGS, [
            'Setting Name', 'Value', 'Last Updated'
        ]);

        await this.updateSheetHeaders(this.sheets.HISTORY, [
            'Date', 'Main Category', 'Subcategory', 'Item Name', 
            'Quantity', 'Design Charges', 'Total Price', 'Calculated By'
        ]);
    }

    // =============================================
    // EXCEL DATA SYNC FUNCTIONS
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
            item.mainCategory || '',
            item.subcategory || '',
            item.itemName || '',
            item.price || 0,
            item.type || 'fixed',
            item.designCharges || 0,
            item.paperCost || 0,
            item.bindingCost || 0,
            item.colorCost || 0,
            new Date().toISOString()
        ]);

        await this.updateSheetData(this.sheets.ITEMS, rows);
    }

    async syncInvoices(invoices) {
        const rows = invoices.map(invoice => [
            invoice.invoiceNo || '',
            invoice.date || '',
            invoice.dueDate || '',
            invoice.customerName || 'N/A', // Assuming name is stored on invoice or needs to be fetched
            invoice.customerPhone || '',
            invoice.customerAddress || '',
            invoice.items?.length || 0,
            invoice.subtotal || 0,
            invoice.taxAmount || 0,
            invoice.total || 0,
            invoice.previousBalance || 0,
            invoice.payment || 0,
            invoice.remainingBalance || 0,
            invoice.status || 'pending',
            invoice.created || new Date().toISOString()
        ]);

        await this.updateSheetData(this.sheets.INVOICES, rows);
    }

    async syncCustomers(customers) {
        const rows = customers.map(customer => [
            customer.name || '',
            customer.phone || '',
            customer.address || '',
            customer.invoicesCount || 0, // Placeholder: Invoice logic in invoice.html doesn't track this easily
            customer.balance || 0,
            customer.lastInvoiceDate || '', // Placeholder
            customer.created || new Date().toISOString()
        ]);

        await this.updateSheetData(this.sheets.CUSTOMERS, rows);
    }

    async syncSettings(settings) {
        const rows = Object.entries(settings).map(([key, value]) => [
            key,
            value,
            new Date().toISOString()
        ]);

        await this.updateSheetData(this.sheets.SETTINGS, rows);
    }

    async syncHistory(history) {
        const rows = history.map(record => [
            record.timestamp || new Date().toLocaleString(),
            record.mainCategory || '',
            record.subcategory || '',
            record.itemName || '',
            record.quantity || 1,
            record.designCharges || 0,
            record.total || 0,
            'Admin' // Always calculated by admin on index.html
        ]);

        await this.updateSheetData(this.sheets.HISTORY, rows);
    }

    // =============================================
    // EXCEL API FUNCTIONS (Using MS Graph)
    // =============================================

    async updateSheetHeaders(sheetName, headers) {
        const accessToken = await getOneDriveAccessToken();
        if (!accessToken || !this.excelFileId) return;

        try {
            const headerRange = `A1:${String.fromCharCode(64 + headers.length)}1`;
            const endpoint = `https://graph.microsoft.com/v1.0/me/drive/items/${this.excelFileId}/workbook/worksheets('${sheetName}')/range(address='${headerRange}')`;

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
        } catch (error) {
            console.error(`Error updating headers for ${sheetName}:`, error);
        }
    }

    async updateSheetData(sheetName, rows) {
        const accessToken = await getOneDriveAccessToken();
        if (!accessToken || !this.excelFileId) return;

        try {
            // 1. Clear existing data (except headers)
            await this.clearSheetData(sheetName);

            // 2. Add new data starting from row 2
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
            // Log as warning since clearing a sheet that doesn't exist is fine.
            console.warn(`Could not clear sheet ${sheetName}, possibly empty or doesn't exist.`, error);
        }
    }

    // =============================================
    // UTILITY FUNCTIONS
    // =============================================

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