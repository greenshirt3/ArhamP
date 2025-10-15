// MSAL configuration for OneDrive integration
const msalConfig = {
    auth: {
        clientId: "26b3dde9-366f-487b-a485-79d1bf1ab857", // Replace with your Azure AD app client ID
        authority: "https://login.microsoftonline.com/common",
        redirectUri: window.location.origin
    },
    cache: {
        cacheLocation: "localStorage",
        storeAuthStateInCookie: false
    }
};

// Create MSAL instance
const msalInstance = new msal.PublicClientApplication(msalConfig);

// OneDrive Excel file details
const EXCEL_FILE_PATH = "/ArhamPrinters/PricingData.xlsx";
const EXCEL_FILE_NAME = "PricingData.xlsx";

// Check if user is signed in
async function checkSignedIn() {
    const accounts = msalInstance.getAllAccounts();
    return accounts.length > 0;
}

// Get access token for Microsoft Graph
async function getAccessToken() {
    try {
        const accounts = msalInstance.getAllAccounts();
        if (accounts.length === 0) {
            throw new Error("No user signed in");
        }
        
        const silentRequest = {
            scopes: ["https://graph.microsoft.com/Files.ReadWrite.All"],
            account: accounts[0]
        };
        
        const response = await msalInstance.acquireTokenSilent(silentRequest);
        return response.accessToken;
    } catch (error) {
        console.error("Token acquisition failed:", error);
        throw error;
    }
}

// Search for file in OneDrive
async function findFileInOneDrive(fileName, accessToken) {
    try {
        const response = await fetch(`https://graph.microsoft.com/v1.0/me/drive/root/search(q='${fileName}')`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`Failed to search for file: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.value.find(file => file.name === fileName);
    } catch (error) {
        console.error("Error searching for file:", error);
        return null;
    }
}

// Create Excel file in OneDrive
async function createExcelFile(accessToken) {
    try {
        // Create basic Excel file structure
        const excelData = {
            categories: [
                { mainCategory: "Offset Paper Printing", subcategory: "LetterPads" },
                { mainCategory: "Offset Paper Printing", subcategory: "Ishtihars" },
                { mainCategory: "Offset Paper Printing", subcategory: "Envelops" },
                { mainCategory: "Offset Paper Printing", subcategory: "Visiting Cards" },
                { mainCategory: "Offset Paper Printing", subcategory: "Stickers" },
                { mainCategory: "Offset Paper Printing", subcategory: "Bill Books" },
                { mainCategory: "Panaflex", subcategory: "China" },
                { mainCategory: "Social Media Posts", subcategory: "Design Only" }
            ],
            items: [
                { mainCategory: "Offset Paper Printing", subcategory: "Visiting Cards", itemName: "Shine", price: 1800, type: "fixed", designCharges: 0, paperCost: 0, bindingCost: 0, colorCost: 0 },
                { mainCategory: "Offset Paper Printing", subcategory: "Visiting Cards", itemName: "Mat Single Side", price: 1900, type: "fixed", designCharges: 0, paperCost: 0, bindingCost: 0, colorCost: 0 },
                { mainCategory: "Offset Paper Printing", subcategory: "Visiting Cards", itemName: "Mat Double Side", price: 2500, type: "fixed", designCharges: 0, paperCost: 0, bindingCost: 0, colorCost: 0 },
                { mainCategory: "Panaflex", subcategory: "China", itemName: "2x2", price: 140, type: "fixed", designCharges: 0, paperCost: 0, bindingCost: 0, colorCost: 0 },
                { mainCategory: "Panaflex", subcategory: "China", itemName: "2x3", price: 210, type: "fixed", designCharges: 0, paperCost: 0, bindingCost: 0, colorCost: 0 },
                { mainCategory: "Panaflex", subcategory: "China", itemName: "2x4", price: 280, type: "fixed", designCharges: 0, paperCost: 0, bindingCost: 0, colorCost: 0 },
                { mainCategory: "Social Media Posts", subcategory: "Design Only", itemName: "Facebook Post", price: 300, type: "fixed", designCharges: 0, paperCost: 0, bindingCost: 0, colorCost: 0 },
                { mainCategory: "Social Media Posts", subcategory: "Design Only", itemName: "Instagram Post", price: 400, type: "fixed", designCharges: 0, paperCost: 0, bindingCost: 0, colorCost: 0 }
            ],
            sizes: {
                "A4/2 68g": 625,
                "A4 68g": 1250,
                "A4/4 68g": 312.5,
                "Legal 100g": 3600
            },
            colors: {
                "1": 700,
                "2": 1400,
                "3": 2100,
                "4": 2800
            },
            settings: {
                rent: 200,
                profitMargin: 25,
                defaultBinding: 40
            },
            lastUpdated: new Date().toISOString()
        };

        // Convert data to JSON string
        const jsonData = JSON.stringify(excelData, null, 2);
        
        // Create file in OneDrive
        const response = await fetch(`https://graph.microsoft.com/v1.0/me/drive/root:/${EXCEL_FILE_NAME}:/content`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: jsonData
        });
        
        if (!response.ok) {
            throw new Error(`Failed to create file: ${response.statusText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error("Error creating Excel file:", error);
        throw error;
    }
}

// Read data from Excel file
async function readExcelData(accessToken, fileId) {
    try {
        const response = await fetch(`https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/content`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`Failed to read file: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error reading Excel data:", error);
        throw error;
    }
}

// Write data to Excel file
async function writeExcelData(accessToken, fileId, data) {
    try {
        // Update lastUpdated timestamp
        data.lastUpdated = new Date().toISOString();
        
        const jsonData = JSON.stringify(data, null, 2);
        
        const response = await fetch(`https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/content`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: jsonData
        });
        
        if (!response.ok) {
            throw new Error(`Failed to write file: ${response.statusText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error("Error writing Excel data:", error);
        throw error;
    }
}

// Main sync function
async function syncWithExcel() {
    try {
        if (!await checkSignedIn()) {
            showNotification("Please sign in first to sync with Excel", "error");
            return;
        }
        
        const accessToken = await getAccessToken();
        
        // Look for existing file
        let file = await findFileInOneDrive(EXCEL_FILE_NAME, accessToken);
        
        if (!file) {
            // Create new file if it doesn't exist
            showNotification("Creating new Excel file in OneDrive...", "info");
            file = await createExcelFile(accessToken);
            showNotification("Excel file created successfully!", "success");
        }
        
        // Read current data from Excel
        const excelData = await readExcelData(accessToken, file.id);
        
        // Update local data
        if (excelData && typeof excelData === 'object') {
            data = excelData;
            refreshAllDisplays();
            showNotification("Data synced from Excel successfully!", "success");
        } else {
            showNotification("No valid data found in Excel file", "warning");
        }
        
    } catch (error) {
        console.error("Sync failed:", error);
        showNotification("Sync failed: " + error.message, "error");
    }
}

// Upload current data to Excel
async function uploadToExcel() {
    try {
        if (!await checkSignedIn()) {
            showNotification("Please sign in first to upload to Excel", "error");
            return;
        }
        
        const accessToken = await getAccessToken();
        
        // Look for existing file
        let file = await findFileInOneDrive(EXCEL_FILE_NAME, accessToken);
        
        if (!file) {
            // Create new file if it doesn't exist
            file = await createExcelFile(accessToken);
        }
        
        // Write current data to Excel
        await writeExcelData(accessToken, file.id, data);
        
        showNotification("Data uploaded to Excel successfully!", "success");
        
    } catch (error) {
        console.error("Upload failed:", error);
        showNotification("Upload failed: " + error.message, "error");
    }
}

// Open Excel file in browser
async function openExcelFile() {
    try {
        if (!await checkSignedIn()) {
            showNotification("Please sign in first to open Excel file", "error");
            return;
        }
        
        const accessToken = await getAccessToken();
        const file = await findFileInOneDrive(EXCEL_FILE_NAME, accessToken);
        
        if (file) {
            window.open(file.webUrl, '_blank');
        } else {
            showNotification("Excel file not found in OneDrive", "error");
        }
        
    } catch (error) {
        console.error("Error opening Excel file:", error);
        showNotification("Error opening Excel file: " + error.message, "error");
    }
}

// Upload data to GitHub (for customer-facing calculator)
async function uploadToGitHub() {
    try {
        // Update timestamp
        data.lastUpdated = new Date().toISOString();
        
        // Convert to JSON
        const jsonData = JSON.stringify(data, null, 2);
        
        // Note: This would require GitHub API integration
        // For now, we'll just show a notification
        showNotification("GitHub upload would require additional setup", "info");
        
        // In a real implementation, you would:
        // 1. Get GitHub access token
        // 2. Make a PUT request to update the file
        // 3. Handle the response
        
        console.log("Data ready for GitHub upload:", data);
        
    } catch (error) {
        console.error("GitHub upload failed:", error);
        showNotification("GitHub upload failed: " + error.message, "error");
    }
}

// Auto-sync every 5 minutes if signed in
setInterval(async () => {
    if (await checkSignedIn()) {
        try {
            await syncWithExcel();
            console.log("Auto-sync completed");
        } catch (error) {
            console.log("Auto-sync failed:", error);
        }
    }
}, 300000); // 5 minutes

// Initialize MSAL on page load
msalInstance.initialize().then(() => {
    console.log("MSAL initialized");
}).catch(error => {
    console.error("MSAL initialization failed:", error);
});