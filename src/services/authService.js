import { supabase } from './supabase';

export const authService = {
  // Buscar perfil pelo ID
  async getProfile(userId) {
    if (!userId) return null;
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Erro ao buscar perfil:', error);
      return null;
    }
    return profile;
  },

  // Obter usuário e perfil atuais
  async getCurrentUser() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;

    const profile = await this.getProfile(session.user.id);

    return {
      user: session.user,
      profile: profile || { 
        role: 'member', 
        full_name: session.user.email,
        roles: ['Vocal / Ministro(a)']
      }
    };
  },

  // Ouvinte em tempo real da sessão do Supabase (garante a persistência)
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const profile = await this.getProfile(session.user.id);
        callback({
          user: session.user,
          profile: profile || { 
            role: 'member', 
            full_name: session.user.email,
            roles: ['Vocal / Ministro(a)']
          }
        });
      } else {
        callback(null);
      }
    });
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