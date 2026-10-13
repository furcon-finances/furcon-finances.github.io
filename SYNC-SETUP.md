# Friends sync setup (free, about 10 minutes)

You only do this once. Friends who join through your invite link don't need to do anything.

## 1. Create a Supabase project
1. Go to supabase.com and sign up (free plan).
2. Click **New project**. Pick any name and a database password, choose the region closest to you (e.g. Frankfurt or Stockholm).
3. Wait a minute while it starts.

## 2. Create the tables
1. In your project, open **SQL Editor** → **New query**.
2. Paste everything from `supabase-setup.sql` and press **Run**. It should say "Success".

## 3. Turn off email confirmation
The app signs in with email + password, so no emails are needed.
1. Open **Authentication** → **Sign In / Providers** → **Email**.
2. Make sure **Enable Email provider** is on.
3. Turn **Confirm email** off and save.
4. Under **Authentication** → **URL Configuration**, set **Site URL** to your GitHub Pages address.

## 4. Connect the app
1. In Supabase, open **Project Settings** → **API**.
2. Copy the **Project URL** and the **anon public** key.
3. In the planner, open **Friends** → **Set up sync**, paste both, tap **Connect**.
4. Tap **Create account** with your email and a password. Next time, use **Sign in**.

## 5. Invite friends
Create a group (Room, Car, Dinner…) and tap **Invite**. Send the link in Telegram or Discord, or just tell them the code. The link includes your connection details, so they only need to sign in.

Notes
- The anon key is meant to be public; your data is protected by the rules in the SQL file (only group members can see a group).
- The free plan pauses a project after a week with no activity. Opening the app wakes it up again (it can take a minute).
- Everyone in a group should use the same currency.
