import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import CustomerNav from "../../components/CustomerNav";

// Lightweight session fetch
async function fetchSession() {
  try {
    const res = await fetch("/api/session", {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const j = await res.json();
    return j.authenticated ? j.user : null;
  } catch {
    return null;
  }
}

export default function CustomerChat() {
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const bottomRef = useRef(null);
  const socketRef = useRef(null);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    (async () => {
      const u = await fetchSession();
      if (!u || u.role !== "customer") {
        window.location.href = "/login";
        return;
      }

      setUser(u);

      try {
        const res = await fetch(`/chat/customer/${u.id}/messages`);
        const j = await res.json();
        if (!j.success) throw new Error(j.message || "Failed to load messages");
        setMessages(j.messages || []);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }

      // socket init
      socketRef.current = io("/", {
        path: "/socket.io",
        transports: ["websocket"],
        withCredentials: true,
      });

      socketRef.current.emit("chat:join", { customerId: u.id });

      socketRef.current.on("chat:new", (msg) => {
        if (String(msg.customerId) === String(u.id)) {
          setMessages((list) => [...list, msg]);
          scrollToBottom();
        }
      });
    })();

    return () => socketRef.current?.disconnect();
  }, []);

  async function sendMessage(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;

    setInput("");

    try {
      const res = await fetch(`/chat/customer/${user.id}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ text }),
      });

      const j = await res.json();
      if (!j.success) throw new Error(j.message || "Send failed");

      setMessages((list) => [...list, j.message]);
      scrollToBottom();
    } catch (e) {
      alert(e.message);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#eef1f5",
        paddingTop: "90px",
        paddingBottom: "40px",
      }}
    >
      <CustomerNav />

      {/* Chat Container */}
      <div
        style={{
          maxWidth: 850,
          height: "75vh",
          margin: "0 auto",
          background: "#ffffff",
          borderRadius: 20,
          overflow: "hidden",
          boxShadow: "0 10px 25px rgba(0,0,0,0.12)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "18px 24px",
            background: "linear-gradient(135deg,#3b82f6,#2563eb)",
            color: "#fff",
            fontWeight: 600,
            fontSize: 18,
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          Chat with Managers
          <div style={{ fontSize: 13, opacity: 0.9 }}>
            Managers respond as soon as possible
          </div>
        </div>

        {/* Messages Section */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px 24px",
            background: "#f7f9fc",
          }}
        >
          {loading ? (
            <p>Loading...</p>
          ) : error ? (
            <p style={{ color: "crimson" }}>{error}</p>
          ) : messages.length === 0 ? (
            <p style={{ color: "#888" }}>No messages yet. Say hello!</p>
          ) : (
            messages.map((m) => {
              const mine = String(m.senderId) === String(user.id);
              return (
                <div
                  key={m._id || m.createdAt + Math.random()}
                  style={{
                    display: "flex",
                    justifyContent: mine ? "flex-end" : "flex-start",
                    marginBottom: 12,
                  }}
                >
                  <div
                    style={{
                      padding: "10px 14px",
                      borderRadius: 14,
                      maxWidth: "70%",
                      background: mine
                        ? "linear-gradient(135deg,#6366f1,#4f46e5)"
                        : "#e5e7eb",
                      color: mine ? "#fff" : "#111",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
                      fontSize: 15,
                      lineHeight: 1.4,
                    }}
                  >
                    {m.text}
                    <div
                      style={{
                        fontSize: 11,
                        opacity: 0.7,
                        marginTop: 6,
                        textAlign: mine ? "right" : "left",
                      }}
                    >
                      {new Date(m.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {!mine && m.senderRole === "manager" && (
                        <span style={{ marginLeft: 6 }}>• Manager</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input Section */}
        <form
          onSubmit={sendMessage}
          style={{
            display: "flex",
            padding: "14px 20px",
            borderTop: "1px solid #e5e7eb",
            background: "#ffffff",
          }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            style={{
              flex: 1,
              padding: "12px 16px",
              borderRadius: 30,
              border: "1px solid #d1d5db",
              outline: "none",
              fontSize: 15,
              background: "#f9fafb",
            }}
          />

          <button
            type="submit"
            style={{
              padding: "12px 22px",
              marginLeft: 12,
              borderRadius: 30,
              background: "linear-gradient(135deg,#4f46e5,#4338ca)",
              color: "#fff",
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
              boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
            }}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
