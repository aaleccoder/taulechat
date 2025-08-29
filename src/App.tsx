import { Link, Route, Routes } from "react-router";
import "./App.css";
import { ThemeProvider } from "@/components/theme-provider";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import ChatScreen from "./components/ChatScreen";
import AppSidebar from "./components/Sidebar";
import SettingsScreen from "./components/Settings";
import TestComponent from "./components/testcomponent";
import Home from "./components/Home";
import { Pen } from "lucide-react";
import { useEffect } from "react";
import { saveModelsToStore } from "./utils/store";

function App() {


  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch("https://openrouter.ai/api/v1/models");
      if (!res.ok) {
        throw new Error("Failed to fetch models");
      }
      const data = await res.json();
      // store only the models array (data.data)
      await saveModelsToStore(data.data);
    }

    fetchData();

  }, [])


  return (
    <ThemeProvider defaultTheme="dark">
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold">TauLeChat</h1>
            </div>
            <Link to="/chat" className="ml-auto bg-primary text-black px-4 py-2 rounded hover:bg-accent/90 flex items-center gap-2">
              New Chat
              <Pen className="h-4 w-4" />
            </Link>
          </header>
          <main className="flex flex-1 flex-col gap-4 px-4 mt-4">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/chat/:id" element={<ChatScreen />} />
              <Route path="/chat" element={<ChatScreen />} />
              <Route path="/settings" element={<SettingsScreen />} />
              <Route path="/test" element={<TestComponent />} />
            </Routes>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </ThemeProvider>
  );
}

export default App;
