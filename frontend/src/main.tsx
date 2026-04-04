import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ConfigProvider } from "antd";
import App from "./App";
import "./index.css";
import "./core/layouts/css/style.css";
import { AuthProvider } from "./context/authContext";
const theme = {
  token: {
    colorPrimary: "#667eea",
    borderRadius: 9999,
    colorBgContainer: "#ffffff",
    colorBgElevated: "#ffffff",
    colorBorder: "#e2e8f0",
    colorText: "#334155",
    colorTextSecondary: "#64748b",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  components: {
    Table: {
      headerBg: "#f8fafc",
      headerColor: "#334155",
      headerSortActiveBg: "#f1f5f9",
      headerSortHoverBg: "#f1f5f9",
      rowHoverBg: "#f8fafc",
      rowSelectedBg: "#eff6ff",
      rowSelectedHoverBg: "#dbeafe",
      borderColor: "#e2e8f0",
      colorBgContainer: "#ffffff",
      headerBorderRadius: 0,
      cellPaddingInline: 16,
      cellPaddingBlock: 12,
    },
  },
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ConfigProvider theme={theme}>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </ConfigProvider>
  </React.StrictMode>,
);