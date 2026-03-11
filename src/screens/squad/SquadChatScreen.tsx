import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../../../lib/supabase';

interface Message {
  id: string;
  squad_id: string;
  user_id: string;
  content: string;
  type: string;
  created_at: string;
  profiles: {
    username: string;
  } | null;
}

export default function SquadChatScreen({ route }: any) {
  const { squadId, squadName } = route.params as { squadId: string; squadName: string };
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);
    await loadMessages();
    setLoading(false);
  }

  async function loadMessages() {
    const { data } = await supabase
      .from('messages')
      .select('id, squad_id, user_id, content, type, created_at, profiles(username)')
      .eq('squad_id', squadId)
      .order('created_at', { ascending: true })
      .limit(50);

    if (data) setMessages(data as Message[]);
  }

  useEffect(() => {
    const channel = supabase
      .channel('squad-chat-' + squadId)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: 'squad_id=eq.' + squadId,
        },
        async (payload) => {
          const newMsg = payload.new as Message;
          const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', newMsg.user_id)
            .single();
          const fullMsg: Message = { ...newMsg, profiles: profile };
          setMessages((prev) => [...prev, fullMsg]);
          setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [squadId]);

  async function handleSend() {
    const text = inputText.trim();
    if (!text || !currentUserId) return;

    setInputText('');
    await supabase.from('messages').insert({
      squad_id: squadId,
      user_id: currentUserId,
      content: text,
      type: 'message',
    });
  }

  function renderMessage({ item }: { item: Message }) {
    const isOwn = item.user_id === currentUserId;
    const isSOS = item.type === 'sos';

    return (
      <View style={[styles.messageWrapper, isOwn && styles.messageWrapperOwn]}>
        <View
          style={[
            styles.messageBubble,
            isOwn && styles.messageBubbleOwn,
            isSOS && styles.messageBubbleSOS,
          ]}
        >
          {!isOwn && (
            <Text style={[styles.messageAuthor, isSOS && styles.messageAuthorSOS]}>
              {item.profiles?.username?.toUpperCase() ?? 'UNKNOWN'}
            </Text>
          )}
          <Text style={[styles.messageText, isSOS && styles.messageTextSOS]}>
            {isSOS ? `🚨 ${item.content}` : item.content}
          </Text>
          <Text style={styles.messageTime}>
            {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#E85D04" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <View style={styles.squadBanner}>
        <Text style={styles.squadBannerText}>{squadName.toUpperCase()} — SECURE CHANNEL</Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>CHANNEL SILENT</Text>
            <Text style={styles.emptySubText}>SEND THE FIRST TRANSMISSION</Text>
          </View>
        }
      />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="SEND TRANSMISSION..."
          placeholderTextColor="#3A3A3A"
          multiline
          maxLength={500}
          returnKeyType="send"
          onSubmitEditing={handleSend}
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend} activeOpacity={0.85}>
          <Text style={styles.sendButtonText}>SEND</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  centered: {
    flex: 1,
    backgroundColor: '#0D0D0D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  squadBanner: {
    backgroundColor: '#1A1A1A',
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  squadBannerText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#E85D04',
    letterSpacing: 2,
  },
  messageList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexGrow: 1,
  },
  messageWrapper: {
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  messageWrapperOwn: {
    alignItems: 'flex-end',
  },
  messageBubble: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    padding: 12,
    maxWidth: '78%',
  },
  messageBubbleOwn: {
    borderColor: '#E85D04',
    backgroundColor: '#1A0A00',
  },
  messageBubbleSOS: {
    backgroundColor: '#991B1B',
    borderColor: '#DC2626',
  },
  messageAuthor: {
    fontSize: 9,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 2,
    marginBottom: 4,
  },
  messageAuthorSOS: {
    color: '#FCA5A5',
  },
  messageText: {
    fontSize: 14,
    color: '#F5F5F5',
    lineHeight: 20,
    fontWeight: '500',
  },
  messageTextSOS: {
    fontWeight: '700',
    color: '#FEF2F2',
  },
  messageTime: {
    fontSize: 9,
    color: '#6B7280',
    marginTop: 6,
    letterSpacing: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#2A2A2A',
    letterSpacing: 4,
  },
  emptySubText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#2A2A2A',
    letterSpacing: 2,
    marginTop: 8,
  },
  inputRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
    backgroundColor: '#1A1A1A',
    padding: 8,
    alignItems: 'flex-end',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#0D0D0D',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    color: '#F5F5F5',
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#E85D04',
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#F5F5F5',
    letterSpacing: 2,
  },
});
