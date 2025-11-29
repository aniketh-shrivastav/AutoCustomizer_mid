import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

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

export default function ManagerChat() {
  const [user, setUser] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [activeCustomer, setActiveCustomer] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loadingThread, setLoadingThread] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const bottomRef = useRef(null);
  const socketRef = useRef(null);

  const scrollToBottom = () =>
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });

  useEffect(() => {
    (async () => {
      const u = await fetchSession();
      if (!u || u.role !== "manager") {
        window.location.href = "/login";
        return;
      }
      setUser(u);
      loadCustomers();
      socketRef.current = io("/", {
        path: "/socket.io",
        transports: ["websocket"],
        withCredentials: true,
      });
      socketRef.current.on("chat:new", (msg) => {
        // If message belongs to active thread, append
        if (
          activeCustomer &&
          String(msg.customerId) === String(activeCustomer)
        ) {
          setMessages((list) => [...list, msg]);
          scrollToBottom();
        }
        // Update preview in customer list
        setCustomers((list) => {
          const existing = list.find(
            (c) => String(c.customerId) === String(msg.customerId)
          );
          if (existing) {
            existing.lastMessage = msg.text;
            existing.lastAt = msg.createdAt;
            return [...list].sort(
              (a, b) => new Date(b.lastAt) - new Date(a.lastAt)
            );
          }
          // New thread appears
          return [
            {
              customerId: msg.customerId,
              customer: { name: "Customer" },
              lastMessage: msg.text,
              lastAt: msg.createdAt,
            },
            ...list,
          ];
        });
      });
    })();
    return () => socketRef.current?.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCustomer]);

  async function loadCustomers() {
    setLoadingCustomers(true);
    try {
      const res = await fetch("/chat/customers");
      const j = await res.json();
      if (!j.success) throw new Error(j.message || "Failed customers");
      setCustomers(j.customers || []);
    } catch (e) {
      // silent
    } finally {
      setLoadingCustomers(false);
    }
  }

  async function openThread(customerId) {
    setActiveCustomer(customerId);
    setLoadingThread(true);
    try {
      socketRef.current?.emit("chat:join", { customerId });
      const res = await fetch(`/chat/customer/${customerId}/messages`);
      const j = await res.json();
      if (!j.success) throw new Error(j.message || "Failed thread");
      setMessages(j.messages || []);
      setTimeout(scrollToBottom, 50);
    } catch (e) {
      alert(e.message);
      setMessages([]);
    } finally {
      setLoadingThread(false);
    }
  }

  async function sendMessage(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || !activeCustomer) return;
    setInput("");
    try {
      const res = await fetch(`/chat/customer/${activeCustomer}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      className="manager-chat-page"
      style={{ display: "flex", minHeight: "100vh", background: "#f4f6fb" }}
    >
      <aside
        style={{
          width: 300,
          borderRight: "1px solid #ddd",
          background: "#fff",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ padding: 16, borderBottom: "1px solid #eee" }}>
          <h3 style={{ margin: 0 }}>Customer Threads</h3>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {loadingCustomers ? (
            <p style={{ padding: 16 }}>Loading...</p>
          ) : customers.length === 0 ? (
            <p style={{ padding: 16, color: "#777" }}>No conversations yet.</p>
          ) : (
            customers.map((c) => {
              const active = String(c.customerId) === String(activeCustomer);
              return (
                <button
                  key={c.customerId}
                  onClick={() => openThread(c.customerId)}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: "12px 14px",
                    border: "none",
                    borderBottom: "1px solid #f0f0f0",
                    background: active
                      ? "linear-gradient(135deg,#6a11cb,#2575fc)"
                      : "transparent",
                    color: active ? "#fff" : "#222",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: 14 }}>
                    {c.customer?.name || "Customer"}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      opacity: active ? 0.85 : 0.6,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      maxWidth: "100%",
                    }}
                  >
                    {c.lastMessage || "(no messages)"}
                  </div>
                </button>
              );
            })
          )}
        </div>
        <div style={{ padding: 12, borderTop: "1px solid #eee" }}>
          <button
            onClick={loadCustomers}
            style={{
              width: "100%",
              padding: "10px 12px",
              background: "#eee",
              border: "1px solid #ddd",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            Refresh
          </button>
        </div>
      </aside>
      <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div
          style={{
            padding: 16,
            background: "#fff",
            borderBottom: "1px solid #ddd",
          }}
        >
          <h2 style={{ margin: 0, fontSize: 20 }}>Manager Chat Console</h2>
          <small style={{ color: "#666" }}>
            {activeCustomer
              ? `Viewing customer thread: ${activeCustomer}`
              : "Select a customer thread"}
          </small>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
          {!activeCustomer ? (
            <p style={{ color: "#666" }}>Choose a customer on the left.</p>
          ) : loadingThread ? (
            <p>Loading messages...</p>
          ) : messages.length === 0 ? (
            <p style={{ color: "#777" }}>No messages yet.</p>
          ) : (
            messages.map((m) => {
              const mine = String(m.senderId) === String(user?.id);
              return (
                <div
                  key={m._id || m.createdAt + Math.random()}
                  style={{
                    marginBottom: 12,
                    display: "flex",
                    justifyContent: mine ? "flex-end" : "flex-start",
                  }}
                >
                  <div
                    style={{
                      background: mine
                        ? "linear-gradient(135deg,#6a11cb,#2575fc)"
                        : "#eef2f7",
                      color: mine ? "#fff" : "#222",
                      padding: "10px 14px",
                      borderRadius: mine
                        ? "16px 4px 16px 16px"
                        : "4px 16px 16px 16px",
                      maxWidth: "70%",
                      boxShadow: "0 2px 4px rgba(0,0,0,.08)",
                      fontSize: 14,
                      lineHeight: 1.4,
                    }}
                  >
                    <div style={{ whiteSpace: "pre-wrap" }}>{m.text}</div>
                    <div style={{ fontSize: 11, opacity: 0.7, marginTop: 6 }}>
                      {new Date(m.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {m.senderRole === "customer" && !mine && (
                        <span style={{ marginLeft: 6 }}>• Customer</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>
        <form
          onSubmit={sendMessage}
          style={{
            borderTop: "1px solid #eee",
            padding: 16,
            display: "flex",
            gap: 12,
          }}
        >
          <input
            type="text"
            placeholder={
              activeCustomer ? "Type a reply..." : "Select a customer first"
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={!activeCustomer}
            style={{
              flex: 1,
              padding: 12,
              border: "1px solid #ccc",
              borderRadius: 8,
            }}
          />
          <button
            type="submit"
            disabled={!activeCustomer || !input.trim()}
            style={{
              background: activeCustomer
                ? "linear-gradient(135deg,#6a11cb,#2575fc)"
                : "#ccc",
              color: "#fff",
              border: "none",
              padding: "12px 20px",
              borderRadius: 8,
              fontWeight: 600,
              cursor: activeCustomer ? "pointer" : "not-allowed",
              boxShadow: activeCustomer ? "0 2px 6px rgba(0,0,0,.15)" : "none",
            }}
          >
            Send
          </button>
        </form>
      </main>
    </div>
  );
}
