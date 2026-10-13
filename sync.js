// ConSync: group syncing for Con Budget Planner. Live (Supabase) or Demo (in-memory).
(function () {
  const rid = () => 'd' + Math.random().toString(36).slice(2, 9);
  const iso = (minsAgo) => new Date(Date.now() - (minsAgo || 0) * 60000).toISOString();

  function demo() {
    const me = { id: 'me', email: 'you@example.com', name: 'You' };
    const groups = [
      { id: 'g1', name: 'Room 412', con: 'NordicFuzzCon 2027', code: 'G-7Q2K4M' },
      { id: 'g2', name: 'Car', con: 'NordicFuzzCon 2027', code: 'G-CAR9XB' }];
    const db = {
      g1: {
        members: [{ user_id: 'me', name: 'You', saved: 0, goal: 0 }, { user_id: 'kai', name: 'Kai', saved: 640, goal: 1500 }, { user_id: 'mira', name: 'Mira', saved: 910, goal: 1350 }, { user_id: 'fen', name: 'Fen', saved: 220, goal: 1200 }],
        costs: [
          { id: 'c1', label: 'Hotel room, 6 nights', amount: 774, paid_by: 'kai', split: ['me', 'kai', 'mira', 'fen'], created_at: iso(3000) },
          { id: 'c2', label: 'Group dinner Saturday', amount: 160, paid_by: null, split: ['me', 'kai', 'mira', 'fen'], created_at: iso(900) },
          { id: 'c3', label: 'Room snacks', amount: 36, paid_by: 'me', split: ['me', 'kai', 'mira', 'fen'], created_at: iso(300) }],
        settlements: [],
        events: [
          { id: 'e3', user_id: 'me', name: 'You', kind: 'cost', text: 'added Room snacks, €36.00', created_at: iso(300) },
          { id: 'e2', user_id: 'mira', name: 'Mira', kind: 'cost', text: 'added Group dinner Saturday, €160.00', created_at: iso(900) },
          { id: 'e1', user_id: 'kai', name: 'Kai', kind: 'paid', text: 'paid Hotel room, 6 nights', created_at: iso(3000) },
          { id: 'e0', user_id: 'fen', name: 'Fen', kind: 'joined', text: 'joined the group', created_at: iso(4000) }]
      },
      g2: {
        members: [{ user_id: 'me', name: 'You', saved: 0, goal: 0 }, { user_id: 'kai', name: 'Kai', saved: 640, goal: 1500 }],
        costs: [
          { id: 'c4', label: 'Fuel, round trip', amount: 90, paid_by: 'kai', split: ['me', 'kai'], created_at: iso(2000) },
          { id: 'c5', label: 'Øresund Bridge toll', amount: 125, paid_by: 'me', split: ['me', 'kai'], created_at: iso(1900) }],
        settlements: [],
        events: [{ id: 'e5', user_id: 'kai', name: 'Kai', kind: 'cost', text: 'added Fuel, round trip, €90.00', created_at: iso(2000) }]
      }
    };
    const subs = {};
    const emit = gid => (subs[gid] || []).forEach(f => f());
    const ev = (gid, kind, text) => { db[gid].events.unshift({ id: rid(), user_id: me.id, name: me.name, kind, text, created_at: iso() }); emit(gid); };
    const copy = x => JSON.parse(JSON.stringify(x));
    return {
      mode: 'demo',
      async init() { return me; },
      me() { return me; },
      async signOut() {},
      async setName(name) { me.name = name; Object.values(db).forEach(g => g.members.forEach(m => { if (m.user_id === me.id) m.name = name; })); },
      async listGroups() { return copy(groups); },
      async createGroup(g) { const id = rid(); const ng = { id, name: g.name, con: g.con, code: 'G-' + Math.random().toString(36).slice(2, 8).toUpperCase() }; groups.push(ng); db[id] = { members: [{ user_id: me.id, name: me.name, saved: 0, goal: 0 }], costs: [], settlements: [], events: [] }; ev(id, 'joined', 'started the group'); return ng; },
      async joinGroup(code) { const g = groups.find(x => x.code === code.trim().toUpperCase()); if (!g) throw new Error('No group with that code. In the demo, try G-7Q2K4M.'); return g; },
      async loadGroup(gid) { return copy(db[gid]); },
      async addCost(gid, c, text) { db[gid].costs.push(Object.assign({ id: rid(), created_at: iso() }, c)); ev(gid, 'cost', text || 'added ' + c.label); },
      async updateCost(gid, id, patch) { const c = db[gid].costs.find(x => x.id === id); Object.assign(c, patch); emit(gid); },
      async deleteCost(gid, id) { db[gid].costs = db[gid].costs.filter(x => x.id !== id); emit(gid); },
      async markPaid(gid, id) { const c = db[gid].costs.find(x => x.id === id); c.paid_by = me.id; ev(gid, 'paid', 'paid ' + c.label); },
      async settle(gid, from, to, amount, text) { db[gid].settlements.push({ id: rid(), from_user: from, to_user: to, amount, created_at: iso() }); ev(gid, 'settled', text); },
      async updateProgress(saved, goal) { Object.values(db).forEach(g => g.members.forEach(m => { if (m.user_id === me.id) { m.saved = saved; m.goal = goal; } })); },
      subscribe(gid, cb) { (subs[gid] = subs[gid] || []).push(cb); return () => { subs[gid] = (subs[gid] || []).filter(f => f !== cb); }; }
    };
  }

  function live(url, key) {
    if (!window.supabase || !window.supabase.createClient) throw new Error('Sync library failed to load. Check your connection.');
    const sb = window.supabase.createClient(url, key, { auth: { persistSession: true, storageKey: 'conBudgetPlanner.auth' } });
    let user = null, name = '';
    const chk = r => { if (r.error) throw r.error; return r.data; };
    const ev = (gid, kind, text) => sb.from('events').insert({ group_id: gid, user_id: user.id, name, kind, text });
    const api = {
      mode: 'live',
      async init() { const s = chk(await sb.auth.getSession()); user = s.session ? s.session.user : null; if (user) await api._profile(); return api.me(); },
      me() { return user ? { id: user.id, email: user.email, name } : null; },
      async _profile() { const d = chk(await sb.from('profiles').select('name').eq('id', user.id).maybeSingle()); name = d ? d.name || '' : ''; },
      async signIn(email, password) { const d = chk(await sb.auth.signInWithPassword({ email, password })); user = d.user; await api._profile(); return api.me(); },
      async signUp(email, password) {
        const d = chk(await sb.auth.signUp({ email, password }));
        if (!d.session) throw new Error('Account created, but Supabase wants email confirmation. In Supabase go to Authentication > Sign In / Providers > Email and turn off Confirm email, then tap Sign in.');
        user = d.user; await api._profile(); return api.me();
      },
      async signOut() { await sb.auth.signOut(); user = null; name = ''; },
      async setName(n) { chk(await sb.from('profiles').upsert({ id: user.id, name: n })); name = n; await sb.from('members').update({ name: n }).eq('user_id', user.id); },
      async listGroups() { return chk(await sb.from('members').select('group:groups(id,name,con,code)').eq('user_id', user.id)).map(r => r.group).filter(Boolean); },
      async createGroup(g) { return chk(await sb.rpc('create_group', { p_name: g.name, p_con: g.con, p_member_name: name })); },
      async joinGroup(code) { return chk(await sb.rpc('join_group', { p_code: code.trim().toUpperCase(), p_member_name: name })); },
      async loadGroup(gid) {
        const [m, c, s, e] = await Promise.all([
          sb.from('members').select('*').eq('group_id', gid),
          sb.from('costs').select('*').eq('group_id', gid).order('created_at'),
          sb.from('settlements').select('*').eq('group_id', gid),
          sb.from('events').select('*').eq('group_id', gid).order('created_at', { ascending: false }).limit(50)]);
        return { members: chk(m), costs: chk(c).map(x => Object.assign(x, { amount: Number(x.amount) })), settlements: chk(s).map(x => Object.assign(x, { amount: Number(x.amount) })), events: chk(e) };
      },
      async addCost(gid, c, text) { chk(await sb.from('costs').insert(Object.assign({ group_id: gid, created_by: user.id }, c))); await ev(gid, 'cost', text || 'added ' + c.label); },
      async updateCost(gid, id, patch) { chk(await sb.from('costs').update(patch).eq('id', id)); },
      async deleteCost(gid, id) { chk(await sb.from('costs').delete().eq('id', id)); },
      async markPaid(gid, id, label) { chk(await sb.from('costs').update({ paid_by: user.id }).eq('id', id)); await ev(gid, 'paid', 'paid ' + label); },
      async settle(gid, from, to, amount, text) { chk(await sb.from('settlements').insert({ group_id: gid, from_user: from, to_user: to, amount })); await ev(gid, 'settled', text); },
      async updateProgress(saved, goal) { if (user) await sb.from('members').update({ saved, goal }).eq('user_id', user.id); },
      subscribe(gid, cb) {
        const ch = sb.channel('group-' + gid);
        ['members', 'costs', 'settlements', 'events'].forEach(t => ch.on('postgres_changes', { event: '*', schema: 'public', table: t, filter: 'group_id=eq.' + gid }, () => cb()));
        ch.subscribe();
        return () => sb.removeChannel(ch);
      }
    };
    return api;
  }

  window.ConSync = { demo, live };
})();
