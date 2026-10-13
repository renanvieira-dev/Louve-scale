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

  // Obter usuário e perfil atuais com fallback para o avatar do Google
  async getCurrentUser() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;

    const profile = await this.getProfile(session.user.id);
    const googleAvatar = session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture;

    return {
      user: session.user,
      profile: {
        ...(profile || {}),
        role: profile?.role || 'member',
        full_name: profile?.full_name || session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
        avatar_url: profile?.avatar_url || googleAvatar || null,
        roles: profile?.roles || ['Vocal / Ministro(a)']
      }
    };
  },

  // Ouvinte contínuo de sessão (garante a persistência e restaura dados do Google)
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const profile = await this.getProfile(session.user.id);
        const googleAvatar = session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture;

        callback({
          user: session.user,
          profile: {
            ...(profile || {}),
            role: profile?.role || 'member',
            full_name: profile?.full_name || session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
            avatar_url: profile?.avatar_url || googleAvatar || null,
            roles: profile?.roles || ['Vocal / Ministro(a)']
          }
        });
      } else {
        callback(null);
      }
    });
  },

  // Upload e atualização do avatar no Storage e na tabela profiles
  async uploadAvatar(userId, file) {
    const fileExt = file.name.split('.').pop();
    const filePath = `${userId}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      console.error('Erro no upload do avatar:', uploadError);
      throw uploadError;
    }

    const { data: publicUrlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    const publicUrl = publicUrlData.publicUrl;

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', userId);

    if (profileError) {
      console.error('Erro ao atualizar avatar no perfil:', profileError);
      throw profileError;
    }

    return publicUrl;
  },

  // Atualizar cargo (admin / member)
  async updateUserRole(userId, newRole) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar cargo:', error);
      throw error;
    }
    return data;
  },

  // Atualizar array de instrumentos/funções
  async updateUserRolesList(userId, roles) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ roles: roles })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar instrumentos:', error);
      throw error;
    }
    return data;
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
    if (error) console.error('Erro ao atualizar funções pendentes:', error);
  },

  async getAllProfiles() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name', { ascending: true });

    if (error) {
      console.error('Erro ao buscar lista de membros:', error);
      return [];
    }
    return data || [];
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }
};