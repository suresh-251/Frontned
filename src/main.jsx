import React from "react";
import ErrorBoundary from "./ErrorBoundary";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./social.css";

import App from "./App";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <ErrorBoundary>
    <App />
  </ErrorBoundary>
  </BrowserRouter>
);
