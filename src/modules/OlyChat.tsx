import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2 } from 'lucide-react';
import { GlassCard } from '@/components/GlassCard';
import { ModuleHeader } from '@/components/ModuleHeader';
import { Oly } from '@/components/Oly';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAI } from '@/hooks/useAI';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface OlyChatProps {
  onBack: () => void;
}

export function OlyChat({ onBack }: OlyChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hey! 👋 I'm Oly, your ADHD buddy. How are you feeling today? I'm here to chat, help you through rough patches, or just be a friendly presence! 🌟",
    },
  ]);
  const [input, setInput] = useState('');
  const { isLoading, chatWithOly } = useAI();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');

    const response = await chatWithOly(input);

    if (response) {
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response,
      };
      setMessages(prev => [...prev, assistantMessage]);
    }
  };

  return (
    <div className="min-h-screen p-4 flex flex-col">
      <ModuleHeader
        title="Chat with Oly"
        description="Your ADHD buddy is here to chat"
        onBack={onBack}
      />

      <div className="flex justify-center mb-4">
        <Oly state={isLoading ? 'working' : 'neutral'} size={80} />
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-3 max-h-[50vh]">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'glass-card'
                }`}
              >
                <p className="text-sm">{message.content}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="glass-card p-3 rounded-lg">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <GlassCard hover={false} className="mt-auto">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="bg-background/50 border-border"
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            disabled={isLoading}
          />
          <Button
            onClick={sendMessage}
            size="icon"
            disabled={!input.trim() || isLoading}
            className="shrink-0"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </Button>
        </div>
      </GlassCard>
    </div>
  );
}
