
import { supabase, Message, Conversation } from './supabase';

// Créer ou récupérer une conversation entre coach et client
export async function getOrCreateConversation(coachId: string, clientId: string): Promise<Conversation | null> {
  try {
    // Vérifier si une conversation existe déjà
    const { data: existingConversation, error: searchError } = await supabase
      .from('conversations')
      .select('*')
      .eq('coach_id', coachId)
      .eq('client_id', clientId)
      .single();

    if (existingConversation) {
      return existingConversation;
    }

    // Créer une nouvelle conversation si elle n'existe pas
    const { data, error } = await supabase
      .from('conversations')
      .insert([{
        coach_id: coachId,
        client_id: clientId,
        last_message_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('Erreur création conversation:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Erreur gestion conversation:', error);
    return null;
  }
}

// Envoyer un message
export async function sendMessage(messageData: {
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  message_type?: 'text' | 'image' | 'file';
}): Promise<Message | null> {
  try {
    const { data, error } = await supabase
      .from('messages')
      .insert([{
        conversation_id: messageData.conversation_id,
        sender_id: messageData.sender_id,
        receiver_id: messageData.receiver_id,
        content: messageData.content,
        message_type: messageData.message_type || 'text',
        is_read: false
      }])
      .select()
      .single();

    if (error) {
      console.error('Erreur envoi message:', error);
      return null;
    }

    // Mettre à jour la dernière activité de la conversation
    await supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', messageData.conversation_id);

    return data;
  } catch (error) {
    console.error('Erreur envoi message:', error);
    return null;
  }
}

// Récupérer les messages d'une conversation
export async function getConversationMessages(conversationId: string): Promise<Message[]> {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Erreur récupération messages:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erreur récupération messages:', error);
    return [];
  }
}

// Récupérer toutes les conversations d'un coach
export async function getCoachConversations(coachId: string): Promise<Conversation[]> {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        profiles!conversations_client_id_fkey (
          name,
          user_id
        )
      `)
      .eq('coach_id', coachId)
      .order('last_message_at', { ascending: false });

    if (error) {
      console.error('Erreur récupération conversations coach:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erreur récupération conversations coach:', error);
    return [];
  }
}

// Récupérer toutes les conversations d'un client
export async function getClientConversations(clientId: string): Promise<Conversation[]> {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        profiles!conversations_coach_id_fkey (
          name,
          user_id
        )
      `)
      .eq('client_id', clientId)
      .order('last_message_at', { ascending: false });

    if (error) {
      console.error('Erreur récupération conversations client:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erreur récupération conversations client:', error);
    return [];
  }
}

// Marquer les messages comme lus
export async function markMessagesAsRead(conversationId: string, userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .eq('receiver_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('Erreur marquage messages lus:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erreur marquage messages lus:', error);
    return false;
  }
}

// Compter les messages non lus pour un utilisateur
export async function getUnreadMessagesCount(userId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('Erreur comptage messages non lus:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Erreur comptage messages non lus:', error);
    return 0;
  }
}

// S'abonner aux nouveaux messages en temps réel
export function subscribeToMessages(conversationId: string, callback: (message: Message) => void) {
  return supabase
    .channel(`messages:conversation_id=eq.${conversationId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `conversation_id=eq.${conversationId}`
    }, (payload) => {
      callback(payload.new as Message);
    })
    .subscribe();
}
