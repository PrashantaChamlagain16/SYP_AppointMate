import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./styles.css";
import { AuthProvider } from "./state/AuthContext.jsx";
import { UiFeedbackProvider } from "./state/UiFeedbackContext.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <UiFeedbackProvider>
          <App />
        </UiFeedbackProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
