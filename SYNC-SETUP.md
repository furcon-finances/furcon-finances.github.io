# Friends sync setup (free, about 10 minutes)

You only do this once. Friends who join through your invite link don't need to do anything.

## 1. Create a Supabase project
1. Go to supabase.com and sign up (free plan).
2. Click **New project**. Pick any name and a database password, choose the region closest to you (e.g. Frankfurt or Stockholm).
3. Wait a minute while it starts.

## 2. Create the tables
1. In your project, open **SQL Editor** → **New query**.
2. Paste everything from `supabase-setup.sql` and press **Run**. It should say "Success".

## 3. Allow joining with just a code
1. Open **Authentication** → **Sign In / Providers**.
2. Turn on **Allow anonymous sign-ins** and save.

That's it: nobody needs an email or password. Everyone shows up with the nickname they typed when they first opened the app.

## 4. Connect the app (once, for everyone)
1. In Supabase, open **Project Settings** → **API**.
2. Copy the **Project URL** and the **anon public** key.
3. Open `sync-config.js` in your GitHub repo, paste them between the quotes, and commit.

```js
window.CON_SYNC = {
  url: 'https://xxxx.supabase.co',
  key: 'eyJhbGciOi...'
};
```

## 5. Invite friends
Create a group (Room, Car, Dinner…) on the Friends tab and send the code (like G-7Q2K4M) in Telegram or Discord. Friends open the app, go to Friends, type the code and tap **Join**.

Good to know: a code-only account lives on that one phone. If someone changes phones, they just join their groups again with the codes.

Notes
- The anon key is meant to be public; your data is protected by the rules in the SQL file (only group members can see a group).
- The free plan pauses a project after a week with no activity. Opening the app wakes it up again (it can take a minute).
- Everyone in a group should use the same currency.
