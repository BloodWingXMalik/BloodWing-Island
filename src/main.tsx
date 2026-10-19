import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { MotionProvider, initMotionPreference } from "./motion";

// Apply the motion preference before the first paint to avoid a flash.
initMotionPreference();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <MotionProvider>
      <App />
    </MotionProvider>
  </React.StrictMode>,
);
