import { supabase } from './supabase';

export const authService = {
  async getCurrentUser() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    return {
      user: session.user,
      profile: profile || { 
        role: 'member', 
        full_name: session.user.email,
        roles: ['Vocal / Ministro(a)']
      }
    };
  },

  async signUp(email, password, fullName, roles, birthDate) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: 'member',
          roles: roles && roles.length > 0 ? roles : ['Vocal / Ministro(a)'],
          birth_date: birthDate || null
        }
      }
    });
    if (error) throw error;
    return data;
  },

  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
    return data;
  },

  async signInWithGoogle(roles) {
    if (roles && roles.length > 0) {
      localStorage.setItem('pending_roles', JSON.stringify(roles));
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    });
    if (error) throw error;
    return data;
  },

  async updateRoles(userId, roles) {
    const { error } = await supabase
      .from('profiles')
      .update({ roles: roles })
      .eq('id', userId);
    if (error) console.error('Erro ao atualizar funções:', error);
  },

  async getAllProfiles() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name', { ascending: true });
    if (error) {
      console.error('Erro ao buscar membros:', error);
      return [];
    }
    return data || [];
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }
};