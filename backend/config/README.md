# Google Sheets API Setup Instructions

To enable the email checking in Google Sheets, follow these steps:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Sheets API for your project
4. Create a service account:
   - Go to "IAM & Admin" > "Service Accounts"
   - Click "Create Service Account"
   - Provide a name and description
   - Click "Create and Continue"
   - Select "Project" > "Editor" role
   - Click "Continue" and then "Done"

5. Create a key for your service account:
   - Click on the service account you just created
   - Go to the "Keys" tab
   - Click "Add Key" > "Create New Key"
   - Select "JSON" and click "Create"
   - The key file will be downloaded to your computer

6. Save the downloaded JSON file as `credentials.json` in this directory

7. Share your Google Sheet with the service account:
   - Open your Google Sheet: https://docs.google.com/spreadsheets/d/1-hjilxc1NgD6mLJi3ki_enGXLdXTK1pk5xRiP8rybQg/edit
   - Click the "Share" button
   - Add the service account email as an editor (found in the client_email field of your credentials.json)

The credentials.json file should look similar to this (with your actual values):

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "your-private-key-id",
  "private_key": "your-private-key",
  "client_email": "your-service-account-email@your-project-id.iam.gserviceaccount.com",
  "client_id": "your-client-id",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/your-service-account-email%40your-project-id.iam.gserviceaccount.com"
}
``` 