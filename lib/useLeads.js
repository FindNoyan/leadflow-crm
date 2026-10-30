'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { demoLeads } from './demoData';

function cloneDemoLeads() {
  return demoLeads.map((lead) => ({ ...lead, notes: [...lead.notes] }));
}

// One hook for all pages. Mode is:
// - 'loading' while auth state is being resolved
// - 'live' when Supabase is configured and a user is signed in (real CRUD)
// - 'demo' when logged out or when Supabase is not configured (labelled demo data)
export function useLeads() {
  const [user, setUser] = useState(null);
  const [mode, setMode] = useState('loading');
  const [leads, setLeads] = useState([]);

  const fetchLiveLeads = useCallback(async () => {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) {
      setLeads((data || []).map((lead) => ({ ...lead, notes: [] })));
    }
    setMode('live');
  }, []);

  const useDemoLeads = useCallback(() => {
    setLeads(cloneDemoLeads());
    setMode('demo');
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      useDemoLeads();
      return undefined;
    }
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setUser(data.session.user);
        fetchLiveLeads();
      } else {
        useDemoLeads();
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        fetchLiveLeads();
      } else {
        setUser(null);
        useDemoLeads();
      }
    });
    return () => listener.subscription.unsubscribe();
  }, [fetchLiveLeads, useDemoLeads]);

  async function createLead(fields) {
    if (mode === 'live' && supabase && user) {
      const { data, error } = await supabase
        .from('leads')
        .insert({ ...fields, owner_id: user.id })
        .select()
        .single();
      if (!error && data) {
        setLeads((prev) => [{ ...data, notes: [] }, ...prev]);
        return data;
      }
      throw new Error(error?.message || 'Could not create lead.');
    }
    const lead = {
      ...fields,
      id: `demo-${Date.now()}`,
      created_at: new Date().toISOString(),
      notes: [],
    };
    setLeads((prev) => [lead, ...prev]);
    return lead;
  }

  async function updateLead(id, patch) {
    if (mode === 'live' && supabase) {
      const { error } = await supabase.from('leads').update(patch).eq('id', id);
      if (error) throw new Error(error.message);
    }
    setLeads((prev) => prev.map((lead) => (lead.id === id ? { ...lead, ...patch } : lead)));
  }

  async function deleteLead(id) {
    if (mode === 'live' && supabase) {
      const { error } = await supabase.from('leads').delete().eq('id', id);
      if (error) throw new Error(error.message);
    }
    setLeads((prev) => prev.filter((lead) => lead.id !== id));
  }

  async function addNote(leadId, body) {
    if (mode === 'live' && supabase && user) {
      const { data, error } = await supabase
        .from('lead_notes')
        .insert({ lead_id: leadId, owner_id: user.id, body })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    }
    const note = { id: `demo-n-${Date.now()}`, body, created_at: new Date().toISOString() };
    setLeads((prev) =>
      prev.map((lead) =>
        lead.id === leadId ? { ...lead, notes: [...(lead.notes || []), note] } : lead,
      ),
    );
    return note;
  }

  async function getNotes(leadId) {
    if (mode === 'live' && supabase) {
      const { data, error } = await supabase
        .from('lead_notes')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: true });
      if (error) throw new Error(error.message);
      return data || [];
    }
    const lead = leads.find((item) => item.id === leadId);
    return lead?.notes || [];
  }

  return {
    user,
    mode,
    loading: mode === 'loading',
    leads,
    createLead,
    updateLead,
    deleteLead,
    addNote,
    getNotes,
  };
}
