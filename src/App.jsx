import { io } from "socket.io-client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search, Plus, MoreHorizontal, Phone, Video, Info, Paperclip, Smile,
  Send, CheckCheck, Check, MessageCircle, Users, Archive, Settings,
  ChevronDown, ArrowLeft, X, Sparkles, CircleHelp
} from "lucide-react";
import { quickReplies } from "./data/mockChats";
import Login from "./Login";

function App() {
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [draft, setDraft] = useState("");
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [newContact, setNewContact] = useState("");
  const [toast, setToast] = useState("");
  const messagesEndRef = useRef(null);
  const [currentUser, setCurrentUser] = useState(() => {
    const user = localStorage.getItem("chatlyUser");
    return user ? JSON.parse(user) : null;
  });

  const [token, setToken] = useState(
    () => localStorage.getItem("chatlyToken")
  );

  const socketRef = useRef(null);

  const currentUserId = currentUser?.id;

  const activeChatIdRef = useRef(activeChatId);
  activeChatIdRef.current = activeChatId;
  // const token = localStorage.getItem("chatlyToken");

  useEffect(() => {
    if (!token) return;

    const socket = io("http://localhost:3000",
      {
        auth: {
          token,
        },
      }
    );

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Connected to chat server:", socket.id);
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection failed:", error.message);
    });

    socket.on("message:recieved", (data) => {
      console.log("message recieved === ", data, "===chatid===", activeChatId)

      const time = new Date(data.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      const newMessage = {
        id: data.id,
        sender:
          data.senderId === currentUserId ? "me" : "them",
        text: data.text,
        time,
        status: "delivered",
      };

      setChats((current) =>
        current.map((chat) => {
          if (chat.id !== data.chatId) return chat;

          const isActive = activeChatIdRef.current === chat.id;
          const isOwnMessage = data.senderId === currentUserId;
          const updatedMessages = [...chat.messages, newMessage];
          const latestMessage = updatedMessages.at(-1);

          return {
            ...chat,
            messages: updatedMessages,
            preview: latestMessage.text,
            time: latestMessage.time,
            unread: isOwnMessage || isActive ? 0 : chat.unread + 1,
          };
        })
      );
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token]);

  useEffect(() => {
    const socket = socketRef.current;

    if (!socket || !activeChatId) return;

    const joinActiveChat = () => {
      socket.emit(
        "chat:join",
        {
          chatId: activeChatId,
        },
        (response) => {
          if (!response?.success) {
            showToast(response?.error || "Could not join conversation");
            return;
          }

          console.log("Joined chat room:", activeChatId);
        }
      );
    };

    if (socket.connected) {
      joinActiveChat();
    } else {
      socket.once("connect", joinActiveChat);
    }

    return () => {
      socket.off("connect", joinActiveChat);
    };
  }, [activeChatId]);

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const response = await fetch(
          `http://localhost:3000/api/chats?userId=1`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch conversations");
        }

        const data = await response.json();

        const formattedChats = data.chats.map((chat) => {
          const otherParticipants = chat.participants.filter(
            (participant) => participant.id !== 1
          );

          return {
            id: chat.id,
            name: chat.name,
            type: chat.type,
            participants: chat.participants,
            messages: [],
            preview: "No messages yet",
            time: "",
            unread: 0,
            avatar: chat.name
              .split(" ")
              .map((word) => word[0])
              .join("")
              .slice(0, 2)
              .toUpperCase(),
            online: otherParticipants.some(
              (participant) => participant.isOnline
            ),
          };
        });

        setChats(formattedChats);

        if (formattedChats.length > 0) {
          setActiveChatId((currentId) =>
            formattedChats.some((chat) => chat.id === currentId)
              ? currentId
              : formattedChats[0].id
          );
        }
      } catch (error) {
        console.error("Error fetching chats:", error);
      } finally {
        setIsLoadingChats(false);
      }
    };

    fetchChats();
  }, []);


  useEffect(() => {
    let cancelled = false;

    async function loadMessages() {
      if (!activeChatId) return;

      try {
        const response = await fetch(
          `http://localhost:3000/api/chats/${encodeURIComponent(activeChatId)}/messages`
        );

        if (!response.ok) {
          throw new Error("Failed to load messages");
        }

        const data = await response.json();

        if (cancelled) return;

        const messages = data.messages.map((message) => ({
          id: message.id,
          sender:
            String(message.senderId) === String(currentUserId)
              ? "me"
              : "them",
          text: message.text,
          time: new Date(message.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          status: "delivered",
        }));

        setChats((current) =>
          current.map((chat) => {
            if (chat.id !== activeChatId) return chat;

            const latestMessage = messages.at(-1);

            return {
              ...chat,
              messages,
              preview: latestMessage?.text ?? "No messages yet",
              time: latestMessage?.time ?? "",
            };
          })
        );
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load messages:", error);
          showToast("Could not load message history");
        }
      }
    }

    loadMessages();

    return () => {
      cancelled = true;
    };
  }, [activeChatId]);


  const activeChat = chats.find((chat) => chat.id === activeChatId) || chats[0];

  const filteredChats = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return chats.filter((chat) => {
      const matchesSearch = chat.name.toLowerCase().includes(normalized) ||
        chat.preview.toLowerCase().includes(normalized);
      return matchesSearch && (filter === "all" || chat.unread > 0);
    });
  }, [chats, search, filter]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [activeChat?.messages.length, activeChatId]);

  const handleSignup = async (name, email, password) => {
    try {
      const response = await fetch(
        "http://localhost:3000/api/auth/signup",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name, email, password }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Signup failed");
      }

      showToast("Account created! Please log in.");
      return true;
    } catch (error) {
      showToast(error.message);
      return false;
    }
  };

  const handleLogin = async (email, password) => {
    try {
      const response = await fetch(
        "http://localhost:3000/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      localStorage.setItem("chatlyToken", data.token);
      localStorage.setItem("chatlyUser", JSON.stringify(data.user));

      setToken(data.token);
      setCurrentUser(data.user);

      return true;
    } catch (error) {
      showToast(error.message);
      return false;
    }
  };

  function showToast(message) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2200);
  }

  function selectChat(chatId) {
    setActiveChatId(chatId);
    setMobileChatOpen(true);
    setChats((current) => current.map((chat) =>
      chat.id === chatId ? { ...chat, unread: 0 } : chat
    ));
    setShowDetails(false);
  }

  function sendMessage(event, textOverride) {
    event?.preventDefault();

    const text = (textOverride ?? draft).trim();
    console.log("===chat id===", activeChatId)

    if (!text || !activeChat) return;

    const socket = socketRef.current;

    if (!socket?.connected) {
      showToast("Not connected to chat server");
      return;
    }

    console.log("===currentUserId===", currentUserId)

    socket.emit(
      "message:sent",
      {
        chatId: activeChatId,
        senderId: currentUserId,
        text,
      },
      (response) => {
        console.log("response send message event")

        if (!response?.success) {
          showToast(response?.error || "Message could not be saved");
        }
      }
    );

    setDraft("");
  }

  function handleComposerKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }

  function createChat(event) {
    event.preventDefault();
    const name = newContact.trim();
    if (!name) return;
    const id = `contact-${Date.now()}`;
    const initials = name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
    const newChat = {
      id, name, avatar: initials, color: "purple", online: false,
      lastSeen: "New conversation", preview: "Say hello 👋", time: "Now", unread: 0,
      messages: []
    };
    setChats((current) => [newChat, ...current]);
    setActiveChatId(id);
    setMobileChatOpen(true);
    setNewContact("");
    setShowNewChat(false);
  }

  function simulateIncoming() {
    if (!activeChat) return;
    const replies = [
      "Sounds great! 😊",
      "I'll get back to you shortly.",
      "Thanks for letting me know!",
      "Perfect, talk soon."
    ];
    const text = replies[Math.floor(Math.random() * replies.length)];
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const message = { id: `mock-${Date.now()}`, sender: "them", text, time };
    setChats((current) => current.map((chat) => chat.id === activeChatId ? {
      ...chat, messages: [...chat.messages, message], preview: text, time
    } : chat));
    showToast("Mock incoming message added");
  }

  return (
    <>
      {!token || !currentUser ? (
        <Login
          onLogin={handleLogin}
          onSignup={handleSignup}
        />
      ) : (
        <main className="app-shell">
          <aside className={`sidebar ${mobileChatOpen ? "sidebar-hidden-mobile" : ""}`}>
            <div className="brand-row">
              <div className="brand-mark"><MessageCircle size={21} strokeWidth={2.4} /></div>
              <span className="brand-name">chatly<span>.</span></span>
              <button className="icon-button subtle brand-menu" aria-label="More options" onClick={() => showToast("More options coming soon")}><MoreHorizontal size={20} /></button>
            </div>

            <div className="profile-row">
              <div className="avatar avatar-me">MK<span className="online-dot" /></div>
              <div className="profile-copy"><strong>Manoj Kumar</strong><span><span className="status-dot" /> Available</span></div>
              <button className="icon-button subtle" aria-label="Profile settings" onClick={() => showToast("Profile settings coming soon")}><ChevronDown size={17} /></button>
            </div>

            <button className="new-chat-button" onClick={() => setShowNewChat(true)}><Plus size={18} /> New message <span>⌘ K</span></button>

            <div className="search-box">
              <Search size={17} />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search messages..." aria-label="Search conversations" />
              {search && <button className="clear-search" onClick={() => setSearch("")} aria-label="Clear search"><X size={15} /></button>}
            </div>

            <div className="list-heading">
              <span>MESSAGES</span>
              <button className="icon-button subtle" aria-label="Conversation options" onClick={() => showToast("Conversation options coming soon")}><MoreHorizontal size={18} /></button>
            </div>
            <div className="filter-tabs">
              <button className={filter === "all" ? "filter-tab active" : "filter-tab"} onClick={() => setFilter("all")}>All chats <span>{chats.length}</span></button>
              <button className={filter === "unread" ? "filter-tab active" : "filter-tab"} onClick={() => setFilter("unread")}>Unread <span>{chats.filter((chat) => chat.unread > 0).length}</span></button>
            </div>

            <div className="conversation-list">
              {filteredChats.map((chat) => {
                const lastMessage = chat.messages[chat.messages.length - 1];
                return (
                  <button key={chat.id} className={`conversation ${chat.id === activeChatId ? "selected" : ""}`} onClick={() => selectChat(chat.id)}>
                    <div className={`avatar avatar-${chat.color}`}>{chat.avatar}{chat.online && <span className="online-dot" />}</div>
                    <div className="conversation-main">
                      <div className="conversation-top"><strong>{chat.name}</strong><time>{chat.time}</time></div>
                      <div className="conversation-bottom"><span>{lastMessage?.text || chat.preview}</span>{chat.unread > 0 && <b className="unread-count">{chat.unread}</b>}</div>
                    </div>
                  </button>
                );
              })}
              {filteredChats.length === 0 && <div className="empty-search"><Search size={22} /><strong>No conversations found</strong><span>Try a different search or filter.</span></div>}
            </div>

            <div className="sidebar-footer">
              <button onClick={() => showToast("Archived chats coming soon")}><Archive size={17} /> <span>Archived</span></button>
              <button onClick={() => showToast("Settings coming soon")}><Settings size={17} /> <span>Settings</span></button>
              <button onClick={() => showToast("Help center coming soon")}><CircleHelp size={17} /> <span>Help</span></button>
            </div>
          </aside>

          <section className={`chat-panel ${!mobileChatOpen ? "" : "chat-panel-mobile"}`}>
            {activeChat ? (
              <>
                <header className="chat-header">
                  <button className="icon-button back-button" aria-label="Back to conversations" onClick={() => setMobileChatOpen(false)}><ArrowLeft size={20} /></button>
                  <div className={`avatar avatar-${activeChat.color} header-avatar`}>{activeChat.avatar}{activeChat.online && <span className="online-dot" />}</div>
                  <div className="header-contact"><h1>{activeChat.name}</h1><span>{activeChat.online ? <><span className="status-dot" /> Active now</> : activeChat.lastSeen}</span></div>
                  <div className="header-actions">
                    <button className="icon-button" aria-label="Start audio call" onClick={() => showToast("Audio calls will be added later")}><Phone size={19} /></button>
                    <button className="icon-button" aria-label="Start video call" onClick={() => showToast("Video calls will be added later")}><Video size={20} /></button>
                    <span className="action-divider" />
                    <button className={`icon-button ${showDetails ? "action-active" : ""}`} aria-label="Conversation details" onClick={() => setShowDetails((value) => !value)}><Info size={20} /></button>
                  </div>
                </header>

                <div className="message-area">
                  <div className="date-divider"><span /> <p>TODAY</p> <span /></div>
                  <div className="messages">
                    {activeChat.messages.map((message, index) => {
                      const previous = activeChat.messages[index - 1];
                      const grouped = previous && previous.sender === message.sender;
                      return (
                        <div key={message.id} className={`message-row ${message.sender === "me" ? "message-mine" : "message-theirs"} ${grouped ? "message-grouped" : ""}`}>
                          {message.sender === "them" && !grouped && <div className={`avatar avatar-small avatar-${activeChat.color}`}>{activeChat.avatar}</div>}
                          {message.sender === "them" && grouped && <div className="avatar-spacer" />}
                          <div className="message-content">
                            {!grouped && message.sender === "them" && <span className="message-author">{activeChat.name}</span>}
                            <div className="message-bubble">{message.text}</div>
                            <div className="message-meta"><time>{message.time}</time>{message.sender === "me" && (message.status === "read" ? <CheckCheck size={14} className="read-check" /> : message.status === "delivered" ? <CheckCheck size={14} /> : <Check size={14} />)}</div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                  <div className="demo-hint"><Sparkles size={14} /><span>Messages are synced in real time and stored in the database.</span></div>
                </div>

                <div className="composer-wrap">
                  <div className="quick-replies">
                    <span>Quick reply</span>
                    {quickReplies.map((reply) => <button key={reply} onClick={() => sendMessage(undefined, reply)}>{reply}</button>)}
                  </div>
                  <form className="composer" onSubmit={(event) => sendMessage(event)}>
                    <textarea value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={handleComposerKeyDown} placeholder={`Message ${activeChat.name.split(" ")[0]}...`} rows={1} aria-label="Write a message" />
                    <div className="composer-actions">
                      <div className="composer-tools">
                        <button type="button" className="icon-button" aria-label="Attach file" onClick={() => showToast("File attachments will be added later")}><Paperclip size={18} /></button>
                        <button type="button" className="icon-button" aria-label="Add emoji" onClick={() => setDraft((value) => value + " 😊")}><Smile size={18} /></button>
                      </div>
                      <div className="send-area"><span>Enter to send</span><button className="send-button" type="submit" disabled={!draft.trim()} aria-label="Send message"><Send size={17} /></button></div>
                    </div>
                  </form>
                  <div className="composer-footnote">Be kind, keep it thoughtful <span>·</span> <kbd>Shift</kbd> + <kbd>Enter</kbd> for a new line</div>
                </div>
              </>
            ) : <div className="no-chat">Choose a conversation to get started.</div>}
          </section>

          {showDetails && activeChat && (
            <aside className="details-panel">
              <div className="details-heading"><strong>Chat details</strong><button className="icon-button" onClick={() => setShowDetails(false)} aria-label="Close details"><X size={18} /></button></div>
              <div className={`avatar avatar-${activeChat.color} details-avatar`}>{activeChat.avatar}</div>
              <h2>{activeChat.name}</h2>
              <p>{activeChat.online ? "Online now" : activeChat.lastSeen}</p>
              <div className="details-separator" />
              <div className="detail-item"><span>Messages</span><strong>{activeChat.messages.length}</strong></div>
              <div className="detail-item"><span>Conversation type</span><strong>{activeChat.id === "design" ? "Group" : "Direct message"}</strong></div>
              <button className="details-action" onClick={() => showToast("Search in chat coming soon")}><Search size={16} /> Search in conversation</button>
            </aside>
          )}

          {showNewChat && (
            <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowNewChat(false); }}>
              <form className="new-chat-modal" onSubmit={createChat}>
                <div className="modal-header"><div><h2>Start a conversation</h2><p>Add a contact to your chat list.</p></div><button type="button" className="icon-button" onClick={() => setShowNewChat(false)} aria-label="Close modal"><X size={19} /></button></div>
                <label htmlFor="contact-name">Contact name</label>
                <input id="contact-name" autoFocus value={newContact} onChange={(event) => setNewContact(event.target.value)} placeholder="e.g. Jamie Parker" />
                <div className="modal-actions"><button type="button" className="cancel-button" onClick={() => setShowNewChat(false)}>Cancel</button><button className="create-button" type="submit" disabled={!newContact.trim()}>Create chat</button></div>
              </form>
            </div>
          )}

          {toast && <div className="toast"><span className="toast-check">✓</span>{toast}</div>}
        </main>
      )}
    </>
  );
}

export default App;
