const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const checkEmailInSheet = async (email) => {
  try {
    // Load the service account key JSON file
    const keyFile = path.resolve(__dirname, '../config/credentials.json');
    
    // Create a new JWT client using the service account key file
    const auth = new google.auth.GoogleAuth({
      keyFile,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const client = await auth.getClient();
    
    // Create a Google Sheets API instance
    const sheets = google.sheets({ version: 'v4', auth: client });
    
    // The spreadsheet ID from the URL
    const spreadsheetId = '1-hjilxc1NgD6mLJi3ki_enGXLdXTK1pk5xRiP8rybQg';
    
    // The range to get data from (E column - Gmail)
    // Assuming the data starts from row 2 (with row 1 being headers)
    const range = 'Sheet1!E2:E';
    
    // Get the values from the sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });
    
    // Extract the email values
    const emailColumn = response.data.values || [];
    const emails = emailColumn.map(row => row[0]?.toLowerCase().trim());
    
    // Check if the provided email exists in the list
    return emails.includes(email.toLowerCase().trim());
    
  } catch (error) {
    console.error('Error checking email in Google Sheet:', error);
    // In case of error, default to false for security
    return false;
  }
};

module.exports = { checkEmailInSheet };