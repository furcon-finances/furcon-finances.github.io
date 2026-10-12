# Friends sync setup (free, about 10 minutes)

You only do this once. Friends who join through your invite link don't need to do anything.

## 1. Create a Supabase project
1. Go to supabase.com and sign up (free plan).
2. Click **New project**. Pick any name and a database password, choose the region closest to you (e.g. Frankfurt or Stockholm).
3. Wait a minute while it starts.

## 2. Create the tables
1. In your project, open **SQL Editor** → **New query**.
2. Paste everything from `supabase-setup.sql` and press **Run**. It should say "Success".

## 3. Turn on email sign-in codes
Sign-in links open in Safari instead of the Home Screen app on iPhone, so the app uses a 6-digit code instead.
1. Open **Authentication** → **Emails** (or **Email Templates**) → **Magic Link**.
2. Replace the message body with something like:
   `Your Con Budget code is {{ .Token }}`
3. Save. Do the same for **Confirm signup** so first-time sign-ins also get a code.
4. Under **Authentication** → **URL Configuration**, set **Site URL** to your GitHub Pages address.

## 4. Connect the app
1. In Supabase, open **Project Settings** → **API**.
2. Copy the **Project URL** and the **anon public** key.
3. In the planner, open **Friends** → **Set up sync**, paste both, tap **Connect**.
4. Sign in with your email and the code you receive.

## 5. Invite friends
Create a group (Room, Car, Dinner…) and tap **Invite**. Send the link in Telegram or Discord, or just tell them the code. The link includes your connection details, so they only need to sign in.

Notes
- The anon key is meant to be public; your data is protected by the rules in the SQL file (only group members can see a group).
- The free plan pauses a project after a week with no activity. Opening the app wakes it up again (it can take a minute).
- Everyone in a group should use the same currency.
