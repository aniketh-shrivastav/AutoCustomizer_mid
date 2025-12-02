import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import ManagerNav from "../../components/ManagerNav";

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
  const [themeMode, setThemeMode] = useState(
    () => document.documentElement.getAttribute("data-theme") || "light"
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const mode =
        document.documentElement.getAttribute("data-theme") || "light";
      setThemeMode(mode);
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  const palette =
    themeMode === "dark"
      ? {
          pageBg: "#0f131a",
          cardBg: "#111827",
          cardShadow: "0 10px 25px rgba(0,0,0,0.35)",
          divider: "#1f2937",
          textPrimary: "#e5e7eb",
          textSecondary: "#9ca3af",
          listHover: "#0b0f16",
          headerGrad: "linear-gradient(135deg,#3b82f6,#2563eb)",
          msgOtherBg: "#1f2937",
          msgOtherText: "#e5e7eb",
          msgMineGrad: "linear-gradient(135deg,#6366f1,#4f46e5)",
          inputBg: "#0b0f16",
          inputBorder: "#334155",
          sendEnabledGrad: "linear-gradient(135deg,#4f46e5,#4338ca)",
          sendDisabledBg: "#374151",
        }
      : {
          pageBg: "#eef1f5",
          cardBg: "#ffffff",
          cardShadow: "0 10px 25px rgba(0,0,0,0.12)",
          divider: "#e5e7eb",
          textPrimary: "#111",
          textSecondary: "#666",
          listHover: "#f3f4f6",
          headerGrad: "linear-gradient(135deg,#3b82f6,#2563eb)",
          msgOtherBg: "#e5e7eb",
          msgOtherText: "#111",
          msgMineGrad: "linear-gradient(135deg,#6366f1,#4f46e5)",
          inputBg: "#f9fafb",
          inputBorder: "#d1d5db",
          sendEnabledGrad: "linear-gradient(135deg,#4f46e5,#4338ca)",
          sendDisabledBg: "#ccc",
        };

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
      style={{
        minHeight: "100vh",
        background: palette.pageBg,
        paddingTop: "90px",
        paddingBottom: "40px",
      }}
    >
      <ManagerNav />
      <div
        style={{
          maxWidth: 1100,
          height: "75vh",
          margin: "0 auto",
          background: palette.cardBg,
          borderRadius: 20,
          overflow: "hidden",
          boxShadow: palette.cardShadow,
          display: "grid",
          gridTemplateColumns: "320px 1fr",
        }}
      >
        <aside
          style={{
            borderRight: `1px solid ${palette.divider}`,
            background: palette.cardBg,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              padding: 16,
              borderBottom: `1px solid ${palette.divider}`,
              background: palette.cardBg,
            }}
          >
            <h3 style={{ margin: 0, fontSize: 16, color: palette.textPrimary }}>
              Customer Threads
            </h3>
          </div>
          <div
            style={{ flex: 1, overflowY: "auto", background: palette.cardBg }}
          >
            {loadingCustomers ? (
              <p style={{ padding: 16 }}>Loading...</p>
            ) : customers.length === 0 ? (
              <p style={{ padding: 16, color: "#777" }}>
                No conversations yet.
              </p>
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
                      borderBottom: `1px solid ${palette.divider}`,
                      background: active ? palette.listHover : "transparent",
                      color: palette.textPrimary,
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: 14,
                        color: palette.textPrimary,
                      }}
                    >
                      {c.customer?.name || "Customer"}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        opacity: 0.7,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        maxWidth: "100%",
                        color: palette.textSecondary,
                      }}
                    >
                      {c.lastMessage || "(no messages)"}
                    </div>
                  </button>
                );
              })
            )}
          </div>
          <div
            style={{
              padding: 12,
              borderTop: `1px solid ${palette.divider}`,
              background: palette.cardBg,
            }}
          >
            <button
              onClick={loadCustomers}
              style={{
                width: "100%",
                padding: "10px 12px",
                background: palette.listHover,
                border: `1px solid ${palette.divider}`,
                borderRadius: 10,
                cursor: "pointer",
              }}
            >
              Refresh
            </button>
          </div>
        </aside>
        <main style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              padding: "18px 24px",
              background: palette.headerGrad,
              color: "#fff",
              fontWeight: 600,
              fontSize: 18,
              position: "sticky",
              top: 0,
              zIndex: 10,
            }}
          >
            Manager Chat Console
            <div style={{ fontSize: 13, opacity: 0.9 }}>
              {activeCustomer
                ? `Viewing customer thread: ${activeCustomer}`
                : "Select a customer thread"}
            </div>
          </div>
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "20px 24px",
              background: themeMode === "dark" ? "#0f131a" : "#f7f9fc",
            }}
          >
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
                          ? palette.msgMineGrad
                          : palette.msgOtherBg,
                        color: mine ? "#fff" : palette.msgOtherText,
                        padding: "10px 14px",
                        borderRadius: 14,
                        maxWidth: "70%",
                        boxShadow:
                          themeMode === "dark"
                            ? "0 2px 6px rgba(0,0,0,0.35)"
                            : "0 2px 6px rgba(0,0,0,0.12)",
                        fontSize: 15,
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
              display: "flex",
              padding: "14px 20px",
              borderTop: `1px solid ${palette.divider}`,
              background: palette.cardBg,
              alignItems: "center",
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
                padding: "12px 16px",
                borderRadius: 30,
                border: `1px solid ${palette.inputBorder}`,
                outline: "none",
                fontSize: 15,
                background: palette.inputBg,
                color: palette.textPrimary,
              }}
            />
            <button
              type="submit"
              disabled={!activeCustomer || !input.trim()}
              style={{
                padding: "12px 22px",
                marginLeft: 12,
                borderRadius: 30,
                background: activeCustomer
                  ? palette.sendEnabledGrad
                  : palette.sendDisabledBg,
                color: "#fff",
                fontWeight: 600,
                border: "none",
                cursor: activeCustomer ? "pointer" : "not-allowed",
                boxShadow: activeCustomer
                  ? themeMode === "dark"
                    ? "0 4px 10px rgba(0,0,0,0.35)"
                    : "0 4px 10px rgba(0,0,0,0.15)"
                  : "none",
              }}
            >
              Send
            </button>
          </form>
        </main>
      </div>
    </div>
  );
}
