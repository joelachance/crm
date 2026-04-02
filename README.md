# Basic CRM

A minimal CRM built with Next.js, TypeScript, Tailwind, and Neon.

## Features

- Create and edit people with email, phone number, and social profiles
- Archive or unarchive contacts
- Manage product tags and assign them per person
- Mark whether a person is in the ICP for each product
- Save turn-by-turn outreach history with response tracking
- Capture visible LinkedIn or Twitter/X profile text from a browser extension and add contacts directly with OpenAI extraction

## Setup

1. Copy `.env.example` to `.env.local`
2. Set `DATABASE_URL` to your Neon connection string
3. Optionally set `OPENAI_API_KEY` to enable LinkedIn AI prefill
4. Install dependencies with `bun install` or `npm install`
5. Start the app with `bun run dev`

The app automatically creates its tables on first use.

## LinkedIn Browser Capture

The reliable social-profile import flow is browser-assisted rather than server-side fetching.

1. Load the unpacked Chrome extension from `extension/linkedin-capture`
2. Open a signed-in LinkedIn or Twitter/X profile page
3. Run the extension popup
4. Click **Add to CRM**
5. The extension sends the visible profile text to the CRM app
6. The CRM backend uses OpenAI to extract contact fields, creates the person immediately, and opens the new CRM record
