import React, { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    if (email && password) {
      localStorage.setItem("user", JSON.stringify({ email }));
      window.location.href = "/dashboard";
    } else {
      alert("请输入邮箱和密码");
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "10%" }}>
      <h2>登录 EventFloX AI</h2>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="邮箱"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ margin: "8px", padding: "8px" }}
        />
        <br />
        <input
          type="password"
          placeholder="密码"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ margin: "8px", padding: "8px" }}
        />
        <br />
        <button type="submit">登录</button>
      </form>
    </div>
  );
}
