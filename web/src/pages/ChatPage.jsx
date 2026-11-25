import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Avatar from '../components/common/Avatar';
import Badge from '../components/common/Badge';
import { Skeleton } from '../components/common/Skeleton';
import {
  MessageSquare,
  Send,
  Calendar,
  Sparkles,
  Check,
  CheckCheck,
  Circle,
  Clock,
  ArrowLeft,
  Search
} from 'lucide-react';

const ChatPage = () => {
  const { user } = useAuth();
  const { socket, isConnected, isUserOnline } = useSocket();
  const { error: toastError } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [conversations, setConversations] = useState([]);
  const [activePartnerId, setActivePartnerId] = useState(searchParams.get('partner') || null);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoadingConvs, setIsLoadingConvs] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Fetch all conversation threads
  const fetchConversations = async () => {
    setIsLoadingConvs(true);
    try {
      const res = await api.get('/conversations');
      if (res.data?.success) {
        const convList = res.data.data || [];
        setConversations(convList);

        // If active partner not set, default to first conversation
        if (!activePartnerId && convList.length > 0) {
          const first = convList[0].partner._id;
          setActivePartnerId(first);
          setSearchParams({ partner: first });
        }
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setIsLoadingConvs(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  // Update active conversation object when partner changes
  useEffect(() => {
    if (activePartnerId) {
      const conv = conversations.find(
        (c) => c.partner?._id?.toString() === activePartnerId?.toString()
      );
      setActiveConversation(conv || null);
      fetchMessages(activePartnerId);
    }
  }, [activePartnerId, conversations]);

  // Fetch message history for active conversation
  const fetchMessages = async (partnerId) => {
    if (!partnerId) return;
    setIsLoadingMessages(true);
    try {
      const res = await api.get(`/conversations/${partnerId}/messages?limit=100`);
      if (res.data?.success) {
        setMessages(res.data.data || []);
        // Mark messages as read
        await api.patch(`/conversations/${partnerId}/read`).catch(() => {});
        // Update local unread count
        setConversations((prev) =>
          prev.map((c) =>
            c.partner._id.toString() === partnerId.toString() ? { ...c, unreadCount: 0 } : c
          )
        );
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isPartnerTyping]);

  // Listen for real-time socket events
  useEffect(() => {
    if (!socket) return;

    // Incoming new message event
    const handleNewMessage = (msg) => {
      const isCurrentActive =
        msg.sender?._id?.toString() === activePartnerId?.toString() ||
        msg.receiver?._id?.toString() === activePartnerId?.toString();

      if (isCurrentActive) {
        setMessages((prev) => {
          // Avoid duplicate by _id
          if (prev.some((m) => m._id === msg._id)) return prev;
          return [...prev, msg];
        });

        // If it was sent to me, mark read
        if (msg.receiver?._id?.toString() === user?._id?.toString()) {
          api.patch(`/conversations/${activePartnerId}/read`).catch(() => {});
        }
      }

      // Update last message in conversation list
      setConversations((prev) => {
        const partnerId =
          msg.sender?._id?.toString() === user?._id?.toString()
            ? msg.receiver?._id?.toString()
            : msg.sender?._id?.toString();

        return prev.map((c) => {
          if (c.partner?._id?.toString() === partnerId) {
            return {
              ...c,
              lastMessage: msg,
              unreadCount: isCurrentActive ? 0 : (c.unreadCount || 0) + 1
            };
          }
          return c;
        });
      });
    };

    // Typing status events
    const handleUserTyping = ({ senderId }) => {
      if (senderId === activePartnerId) {
        setIsPartnerTyping(true);
      }
    };

    const handleUserStopTyping = ({ senderId }) => {
      if (senderId === activePartnerId) {
        setIsPartnerTyping(false);
      }
    };

    socket.on('message:received', handleNewMessage);
    socket.on('typing:start', handleUserTyping);
    socket.on('typing:stop', handleUserStopTyping);

    return () => {
      socket.off('message:received', handleNewMessage);
      socket.off('typing:start', handleUserTyping);
      socket.off('typing:stop', handleUserStopTyping);
    };
  }, [socket, activePartnerId, user?._id]);

  // Handle typing debounce
  const handleInputChange = (e) => {
    setInputText(e.target.value);

    if (!socket || !activePartnerId) return;

    // Emit typing:start
    socket.emit('typing:start', { receiverId: activePartnerId });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing:stop', { receiverId: activePartnerId });
    }, 1500);
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    const content = inputText.trim();
    if (!content || !activePartnerId) return;

    setInputText('');
    if (socket && activePartnerId) {
      socket.emit('typing:stop', { receiverId: activePartnerId });
    }

    try {
      // 1. Try sending via Socket.io if connected
      if (socket && isConnected) {
        socket.emit('message:send', {
          receiverId: activePartnerId,
          content
        });
      } else {
        // 2. Fallback to REST API
        const res = await api.post(`/conversations/${activePartnerId}/messages`, { content });
        if (res.data?.success && res.data?.data) {
          setMessages((prev) => [...prev, res.data.data]);
        }
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to send message');
    }
  };

  const filteredConversations = conversations.filter((c) =>
    c.partner?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 h-[calc(100vh-5rem)]">
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm h-full flex overflow-hidden">
        {/* Left Sidebar: Conversations List */}
        <div
          className={`w-full md:w-80 lg:w-96 border-r border-slate-200/80 flex flex-col bg-slate-50/50 ${
            activePartnerId ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Sidebar Header */}
          <div className="p-4 border-b border-slate-200/80 bg-white">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-indigo-600" />
                Messages
              </h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {conversations.length} chats
              </span>
            </div>

            {/* Search filter */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          {/* Conversations Scroll Area */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {isLoadingConvs ? (
              <div className="p-4 space-y-4">
                <Skeleton className="h-14 w-full rounded-xl" />
                <Skeleton className="h-14 w-full rounded-xl" />
                <Skeleton className="h-14 w-full rounded-xl" />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <MessageSquare className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs font-medium">No accepted swap matches yet.</p>
                <Link to="/matches">
                  <Button variant="outline" size="sm" className="mt-2 text-xs">
                    Find Matches
                  </Button>
                </Link>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const partner = conv.partner;
                const isSelected = activePartnerId === partner._id;
                const isOnline = isUserOnline(partner._id);

                return (
                  <button
                    key={partner._id}
                    onClick={() => {
                      setActivePartnerId(partner._id);
                      setSearchParams({ partner: partner._id });
                    }}
                    className={`w-full p-4 flex items-start gap-3 text-left transition-colors relative ${
                      isSelected
                        ? 'bg-indigo-50/80 border-r-4 border-indigo-600'
                        : 'hover:bg-slate-100/70'
                    }`}
                  >
                    <Avatar
                      src={partner.photoUrl}
                      name={partner.name}
                      size="md"
                      isOnline={isOnline}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-slate-900 truncate">
                          {partner.name}
                        </h4>
                        {conv.lastMessage && (
                          <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                            {new Date(conv.lastMessage.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {conv.lastMessage?.content || (
                          <span className="italic text-slate-400">
                            Accepted match! Say hello.
                          </span>
                        )}
                      </p>

                      {conv.matchRequest?.skillRequested && (
                        <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded mt-1.5 inline-block">
                          {conv.matchRequest.skillRequested}
                        </span>
                      )}
                    </div>

                    {conv.unreadCount > 0 && (
                      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                        {conv.unreadCount}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: Active Message Thread */}
        <div
          className={`flex-1 flex flex-col bg-white ${
            !activePartnerId ? 'hidden md:flex' : 'flex'
          }`}
        >
          {activePartnerId && activeConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-slate-200/80 flex items-center justify-between bg-white z-10">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActivePartnerId(null)}
                    className="md:hidden p-1 rounded-lg text-slate-500 hover:bg-slate-100"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>

                  <Avatar
                    src={activeConversation.partner?.photoUrl}
                    name={activeConversation.partner?.name || 'Partner'}
                    size="md"
                    isOnline={isUserOnline(activeConversation.partner?._id)}
                  />

                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      {activeConversation.partner?.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isUserOnline(activeConversation.partner?._id)
                            ? 'bg-emerald-500'
                            : 'bg-slate-300'
                        }`}
                      />
                      <span>
                        {isUserOnline(activeConversation.partner?._id)
                          ? 'Online now'
                          : 'Offline'}
                      </span>
                      <span>•</span>
                      <span>{activeConversation.partner?.location?.city || 'Worldwide'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to={`/sessions?requestId=${activeConversation.matchRequest?._id}`}
                  >
                    <Button variant="secondary" size="sm" icon={Calendar}>
                      Schedule Session
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Message Feed Stream */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/30">
                {isLoadingMessages ? (
                  <div className="space-y-3">
                    <Skeleton className="h-10 w-2/3 rounded-2xl" />
                    <Skeleton className="h-10 w-1/2 ml-auto rounded-2xl" />
                    <Skeleton className="h-10 w-3/4 rounded-2xl" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 space-y-2">
                    <Sparkles className="w-8 h-8 text-indigo-400 mx-auto" />
                    <p className="text-sm font-semibold text-slate-700">
                      You are connected with {activeConversation.partner?.name}!
                    </p>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Send a message to discuss your learning goals, preferred dates, or ask questions before scheduling.
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.sender?._id === user?._id || msg.sender === user?._id;
                    const time = new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    });

                    return (
                      <div
                        key={msg._id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-md sm:max-w-lg rounded-2xl px-4 py-2.5 text-sm shadow-xs ${
                            isMe
                              ? 'bg-indigo-600 text-white rounded-br-xs'
                              : 'bg-white border border-slate-200/90 text-slate-900 rounded-bl-xs'
                          }`}
                        >
                          <p className="whitespace-pre-wrap leading-relaxed break-words">
                            {msg.content}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1 px-1">
                          <span>{time}</span>
                          {isMe && (
                            <span>
                              {msg.readAt ? (
                                <CheckCheck className="w-3.5 h-3.5 text-indigo-500" />
                              ) : (
                                <Check className="w-3.5 h-3.5 text-slate-400" />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Partner Typing Indicator */}
                {isPartnerTyping && (
                  <div className="flex items-center gap-2 text-xs text-slate-500 italic">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]" />
                    </div>
                    <span>{activeConversation.partner?.name} is typing...</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Form */}
              <div className="p-3 sm:p-4 border-t border-slate-200/80 bg-white">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={inputText}
                    onChange={handleInputChange}
                    placeholder={`Message ${activeConversation.partner?.name}...`}
                    className="flex-1 text-sm rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={!inputText.trim()}
                    className="px-4 py-2.5 rounded-xl shadow-xs"
                    icon={Send}
                  >
                    Send
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-slate-700 text-base">Select a conversation</h3>
              <p className="text-xs text-slate-500 max-w-sm">
                Pick an accepted swap partner from the left sidebar to start messaging in real-time.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
