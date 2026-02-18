import AppRouter from "./router/AppRouter";
import { Toaster } from "react-hot-toast";

export default function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#1f2937",
            color: "#fff",
            borderRadius: "12px",
            padding: "12px 16px"
          }
        }}
      />
      <AppRouter />
    </>
  );
}
