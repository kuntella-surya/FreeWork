import React, { useEffect, useState } from "react";
import { Spinner, Alert, ListGroup, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
const socket = io("${process.env.REACT_APP_API_URL}");
export default function Notifications({ setNotificationCount }) {
  const [notif, setNotif] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchNotifications() {
      const res = await fetch("${process.env.REACT_APP_API_URL}/api/notifications", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setNotif(data);
        setNotificationCount(0);
        await fetch("/api/notifications/mark-all-read", {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      setLoading(false);
    }
    fetchNotifications();

    // Realtime listening
    socket.on("newNotification", (notification) => {
      setNotificationCount(prev => prev + 1);
      setNotif(prev => [notification, ...prev]);
    });

    return () => socket.off("newNotification");
  }, [token, setNotificationCount]);
  console.log(notif)

  if (!notif.length) {
    return <Alert variant="info" className="m-4">No notifications</Alert>;
  }

  return (
    <div className="container mt-4">
      <h3 className="mb-3">🔔 Notifications</h3>
      <ListGroup>
        {notif.map(n => (
          <ListGroup.Item key={n._id}>
            <div><strong>{new Date(n.createdAt).toLocaleString()}</strong></div>
            <p>{n.message}</p>
            {n.projectId && (
              <Button variant="primary" size="sm" onClick={() => navigate(`/project/${n.projectId}`)}>
                View Project
              </Button>
            )}
          </ListGroup.Item>
        ))}
      </ListGroup>
    </div>
  );
}
