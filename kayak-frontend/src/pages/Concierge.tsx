import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Bot,
  User,
  Plane,
  Hotel,
  Car,
  Sparkles,
  Star,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { Button, Card, Badge } from '../components/ui';
import styles from './Concierge.module.css';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  recommendations?: Recommendation[];
}

interface Recommendation {
  id: string;
  type: 'flight' | 'hotel' | 'car' | 'bundle';
  title: string;
  subtitle: string;
  price: number;
  originalPrice?: number;
  rating: number;
  tags: string[];
  whyThis: string;
  whatToWatch?: string;
  image?: string;
}

const initialMessages: Message[] = [
  {
    id: '1',
    role: 'assistant',
    content: "Hi! I'm your AI travel concierge. I can help you find the best flights, hotels, and car rentals tailored to your preferences. Tell me about your travel plans - where do you want to go, when, and what's your budget?",
    timestamp: new Date(),
  },
];

const sampleRecommendations: Recommendation[] = [
  {
    id: 'r1',
    type: 'bundle',
    title: 'NYC Weekend Getaway',
    subtitle: 'Flight + Hotel Package',
    price: 849,
    originalPrice: 1050,
    rating: 4.7,
    tags: ['Best Value', 'Free Cancellation'],
    whyThis: 'This bundle saves you $200 compared to booking separately, and includes a 4-star hotel in Manhattan.',
    whatToWatch: 'Only 3 rooms left at this price!',
    image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=300',
  },
  {
    id: 'r2',
    type: 'flight',
    title: 'SFO → JFK Direct',
    subtitle: 'United Airlines, Economy',
    price: 299,
    rating: 4.5,
    tags: ['Non-stop', 'Morning Flight'],
    whyThis: 'Direct flight at your preferred morning departure time with great reviews.',
  },
  {
    id: 'r3',
    type: 'hotel',
    title: 'The Standard High Line',
    subtitle: '4-star, Meatpacking District',
    price: 279,
    originalPrice: 349,
    rating: 4.6,
    tags: ['Pet-friendly', 'Near Transit'],
    whyThis: 'Trendy location, pet-friendly as you requested, and 20% off this week.',
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=300',
  },
];

export const Concierge = () => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Great choice! I found some excellent options for your trip to New York. Based on your preferences for a weekend getaway with a budget around $1000, here are my top recommendations:",
        timestamp: new Date(),
        recommendations: sampleRecommendations,
      };
      setMessages((prev) => [...prev, aiResponse]);
      setIsTyping(false);
    }, 2000);
  };

  const quickPrompts = [
    "Weekend trip to NYC under $1000",
    "Pet-friendly hotels in Miami",
    "Cheapest flights to LA next month",
    "Family vacation packages",
  ];

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.botAvatar}>
              <Sparkles size={28} />
            </div>
            <div>
              <h1 className={styles.title}>AI Travel Concierge</h1>
              <p className={styles.subtitle}>
                Your personal travel assistant powered by AI
              </p>
            </div>
          </div>
        </div>

        {/* Chat Container */}
        <div className={styles.chatContainer}>
          {/* Messages */}
          <div className={styles.messages}>
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`${styles.message} ${styles[message.role]}`}
                >
                  <div className={styles.messageAvatar}>
                    {message.role === 'assistant' ? (
                      <Bot size={20} />
                    ) : (
                      <User size={20} />
                    )}
                  </div>
                  <div className={styles.messageContent}>
                    <p className={styles.messageText}>{message.content}</p>

                    {/* Recommendations */}
                    {message.recommendations && (
                      <div className={styles.recommendations}>
                        {message.recommendations.map((rec) => (
                          <Card
                            key={rec.id}
                            variant="bordered"
                            hover
                            className={styles.recCard}
                          >
                            {rec.image && (
                              <div className={styles.recImage}>
                                <img src={rec.image} alt={rec.title} />
                              </div>
                            )}
                            <div className={styles.recContent}>
                              <div className={styles.recHeader}>
                                <div className={styles.recType}>
                                  {rec.type === 'flight' && <Plane size={14} />}
                                  {rec.type === 'hotel' && <Hotel size={14} />}
                                  {rec.type === 'car' && <Car size={14} />}
                                  {rec.type === 'bundle' && <Sparkles size={14} />}
                                  <span>{rec.type}</span>
                                </div>
                                <div className={styles.recRating}>
                                  <Star size={12} fill="currentColor" />
                                  {rec.rating}
                                </div>
                              </div>

                              <h4 className={styles.recTitle}>{rec.title}</h4>
                              <p className={styles.recSubtitle}>{rec.subtitle}</p>

                              <div className={styles.recTags}>
                                {rec.tags.map((tag) => (
                                  <Badge key={tag} variant="info" size="sm">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>

                              <div className={styles.recWhyThis}>
                                <strong>Why this?</strong> {rec.whyThis}
                              </div>

                              {rec.whatToWatch && (
                                <div className={styles.recWatch}>
                                  ⚠️ {rec.whatToWatch}
                                </div>
                              )}

                              <div className={styles.recFooter}>
                                <div className={styles.recPrice}>
                                  {rec.originalPrice && (
                                    <span className={styles.originalPrice}>
                                      ${rec.originalPrice}
                                    </span>
                                  )}
                                  <span className={styles.price}>${rec.price}</span>
                                </div>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  rightIcon={<ArrowRight size={14} />}
                                >
                                  View Deal
                                </Button>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}

                    <span className={styles.messageTime}>
                      {message.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isTyping && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`${styles.message} ${styles.assistant}`}
              >
                <div className={styles.messageAvatar}>
                  <Bot size={20} />
                </div>
                <div className={styles.typingIndicator}>
                  <Loader2 size={16} className={styles.spinner} />
                  <span>AI is thinking...</span>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          {messages.length === 1 && (
            <div className={styles.quickPrompts}>
              <p className={styles.quickPromptsLabel}>Try asking:</p>
              <div className={styles.promptButtons}>
                {quickPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    className={styles.promptBtn}
                    onClick={() => setInput(prompt)}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className={styles.inputArea}>
            <div className={styles.inputWrapper}>
              <input
                type="text"
                placeholder="Tell me about your travel plans..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                className={styles.input}
              />
              <Button
                variant="primary"
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className={styles.sendBtn}
              >
                <Send size={18} />
              </Button>
            </div>
            <p className={styles.disclaimer}>
              AI recommendations are based on real-time data and your preferences.
              Prices may vary.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

