import React, { useEffect, useState, useRef } from "react";
import { useParams, useLocation } from "react-router-dom";
import io from "socket.io-client";
import Picker from "emoji-picker-react";
import "./ChatPage.css";

const socket = io("${process.env.REACT_APP_API_URL}");

export default function ChatPage({ currentUser }) {
  const { otherUserId } = useParams();
  const location = useLocation();
  const otherUserName = location.state?.otherUserName || "User";
  const otherUserPic = location.state?.profilePicUrl || null;
  const projectId = location.state?.projectId || "";
  const token = localStorage.getItem("token");
  const roomId = [currentUser._id, otherUserId].sort().join("_");
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef(null);

  // 1️⃣ Fetch chat messages
  useEffect(() => {
    if (!token || !roomId) return;
    (async () => {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/messages/${roomId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const msgs = await res.json();
      setMessages(msgs);
    })();
  }, [roomId, token]);

  // 2️⃣ Join socket for real-time chat
  useEffect(() => {
    socket.emit("joinRoom", { roomId });
    socket.on("receiveMessage", (msg) => setMessages((prev) => [...prev, msg]));
    return () => socket.off("receiveMessage");
  }, [roomId]);

  // 3️⃣ Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 4️⃣ Mark messages as read when chat opens or new arrive
  useEffect(() => {
    if (!currentUser?._id || !roomId) return;
    fetch("${process.env.REACT_APP_API_URL}/api/messages/mark-read", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ roomId, userId: currentUser._id }),
    });
  }, [messages, currentUser?._id, roomId, token]);

  const handleEmojiClick = (_, emojiObj) => setNewMessage(prev => prev + emojiObj.emoji);

  const sendMessage = async () => {
    const trimmed = newMessage.trim();
    if (!trimmed) return;
    const message = {
      roomId,
      senderId: currentUser._id,
      receiverId:otherUserId,
      senderName: currentUser.uname,
      content: trimmed,
      timestamp: new Date().toISOString(),
    };
    await fetch("${process.env.REACT_APP_API_URL}/api/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(message),
    });
    socket.emit("sendMessage", { roomId, message });
    setMessages(prev => [...prev, message]);
    setNewMessage("");
  };

  return (
    <div className="chat-wrapper">
      <div className="chat-header">
        <img
          src={
            otherUserPic?.startsWith("http")
              ? otherUserPic
              : `${process.env.REACT_APP_API_URL}/uploads/${otherUserPic}`
          }
          alt="profile"
          className="chat-profile-pic"
        />
        <h5>{otherUserName}</h5>
      </div>
      <div className="chat-body">
        {messages.map((msg, i) => (
          <div key={i} className={`chat-bubble ${msg.senderId === currentUser._id ? "own" : "other"}`}>
            <div className="chat-text">{msg.content}</div>
            <div className="chat-meta">
              <small>{new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</small>
              {msg.senderId === currentUser._id && <span>✓✓</span>}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      {showEmojiPicker && (
        <div className="emoji-picker-container">
          <Picker onEmojiClick={handleEmojiClick} />
        </div>
      )}
      <div className="chat-input">
        <button className="btn emoji-btn" onClick={() => setShowEmojiPicker(v => !v)}>😊</button>
        <input
          type="text"
          className="form-control chat-input-box"
          placeholder="Type a message..."
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendMessage()}
        />
        <button className="btn btn-primary send-btn" onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}
