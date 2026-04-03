# CRM Social Capture Extension

This Chrome extension reads the visible LinkedIn or Twitter/X profile text from the current browser tab, sends it to the CRM app, creates the person immediately, and opens the new CRM record.

## Load it locally

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select this folder: `extension/linkedin-capture`

## Use it

1. Start the CRM app locally
2. Open a LinkedIn or Twitter/X profile while signed in
3. Click the extension icon
4. Confirm the CRM URL, usually `http://localhost:3000`
5. Click **Add to CRM**

The extension sends the visible profile text to `/api/linkedin-captures`, the CRM backend runs the OpenAI extraction, creates the person in Neon, and opens the new contact record.
