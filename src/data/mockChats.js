export const initialChats = [
  {
    id: "sarah", name: "Sarah Chen", avatar: "SC", color: "rose", online: true,
    lastSeen: "Active now", preview: "That sounds perfect. Let's do it!", time: "10:42 AM", unread: 2,
    messages: [
      { id: "s1", sender: "them", text: "Hey! How's the new project coming along?", time: "10:31 AM" },
      { id: "s2", sender: "me", text: "Pretty well! I've been working on the chat interface today.", time: "10:33 AM", status: "read" },
      { id: "s3", sender: "them", text: "Nice, I love a clean UI. Have you settled on the layout?", time: "10:36 AM" },
      { id: "s4", sender: "me", text: "Yes — a simple sidebar and a focused conversation view.", time: "10:38 AM", status: "read" },
      { id: "s5", sender: "them", text: "That sounds perfect. Let's do it!", time: "10:42 AM" }
    ]
  },
  {
    id: "marcus", name: "Marcus Johnson", avatar: "MJ", color: "blue", online: true,
    lastSeen: "Active now", preview: "Sent you the design files", time: "9:58 AM", unread: 0,
    messages: [
      { id: "m1", sender: "them", text: "I finished the first pass on the design system.", time: "9:45 AM" },
      { id: "m2", sender: "them", text: "Sent you the design files", time: "9:58 AM" },
      { id: "m3", sender: "me", text: "Awesome, I'll take a look this afternoon.", time: "10:01 AM", status: "delivered" }
    ]
  },
  {
    id: "priya", name: "Priya Sharma", avatar: "PS", color: "purple", online: false,
    lastSeen: "Active 20 minutes ago", preview: "Thanks for the quick update 🙌", time: "Yesterday", unread: 0,
    messages: [
      { id: "p1", sender: "me", text: "The API contract is ready for review.", time: "Yesterday", status: "read" },
      { id: "p2", sender: "them", text: "Thanks for the quick update 🙌", time: "Yesterday" }
    ]
  },
  {
    id: "alex", name: "Alex Rivera", avatar: "AR", color: "green", online: false,
    lastSeen: "Active 1 hour ago", preview: "Are we still on for Thursday?", time: "Yesterday", unread: 0,
    messages: [
      { id: "a1", sender: "them", text: "Are we still on for Thursday?", time: "Yesterday" },
      { id: "a2", sender: "me", text: "Absolutely — I'll send over the details.", time: "Yesterday", status: "read" }
    ]
  },
  {
    id: "design", name: "Design Team", avatar: "DT", color: "amber", online: false,
    lastSeen: "5 members", preview: "Olivia: The new mockups are ready", time: "Mon", unread: 0,
    messages: [
      { id: "d1", sender: "them", text: "Olivia: The new mockups are ready for feedback.", time: "Mon" },
      { id: "d2", sender: "me", text: "Great work! I'll leave comments today.", time: "Mon", status: "read" }
    ]
  }
];

export const quickReplies = ["Sounds good!", "I'll take a look 👍", "Thanks for the update!"];
