import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./MessagesList.css";
import { useUnread } from "./UnreadContext";

export default function MessagesList({ currentUser }) {
  const [conversations, setConversations] = useState([]);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const { setUnreadTotal } = useUnread();
  console.log(conversations)
  useEffect(() => {
    if (!token || !currentUser?._id) return;
    (async () => {
      const res = await fetch(
        `/api/conversations/${currentUser._id}`, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      setConversations(data);
      setUnreadTotal(data.reduce((s, c) => s + (c.unreadCount || 0), 0));
    })();
  }, [token, currentUser?._id, setUnreadTotal]);
  
  const openChat = (conv) =>
    navigate(`/chat/${conv.otherUserId}`, {
      state: {
        otherUserName: conv.otherUserName,
        profilePicUrl: conv.profilePicUrl,
        projectId: conv.projectId || "",
      },
    });

  return (
    <div className="messages-list-container">
      <h4 className="ml-title">Messages</h4>
      {conversations.length === 0 ? (
        <p className="ml-empty">You don’t have any conversations yet.</p>
      ) : (
        <ul className="ml-list">
          {conversations.map((conv) => (
            <li
              key={conv.otherUserId}
              className="ml-item"
              onClick={() => openChat(conv)}
            >
              <img
                className="ml-avatar"
                src={
                  conv.profilePicUrl?.startsWith("http")
                    ? conv.profilePicUrl
                    : `/uploads/${conv.profilePicUrl}`
                }
                alt={conv.otherUserName}
              />
              <div className="ml-content">
                <span className="ml-name">{conv.otherUserName}</span>
                <span className="ml-snippet">
                  {conv.lastMessage?.length > 28
                    ? conv.lastMessage.slice(0, 28) + "…"
                    : conv.lastMessage}
                </span>
              </div>
              <div className="ml-meta">
                <span className="ml-time">
                  {new Date(conv.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                {conv.unreadCount > 0 && (
                  <span className="ml-badge">{conv.unreadCount}</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
