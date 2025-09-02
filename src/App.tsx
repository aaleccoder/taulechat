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
import { Pen, Plus } from "lucide-react";
import { useEffect } from "react";
import { saveOpenRouterModelsToStore, saveGeminiModelsToStore } from "./utils/store";
import { fetch } from "@tauri-apps/plugin-http";
import { Toaster } from "./components/ui/sonner";
import { ProviderName } from "./components/Settings";
import { getAPIKeyFromStore } from "./utils/store";
import { Button } from "@/components/ui/button";
import { useUIVisibility } from "./utils/state";

function App() {
  const { isHeaderVisible, isChatExpanded } = useUIVisibility();

  useEffect(() => {
    const fetchData = async () => {

      const geminiApiKey = await getAPIKeyFromStore(ProviderName.Gemini);
      const [openRouterModelsRes, geminiModelsRes] = await Promise.all([fetch("https://openrouter.ai/api/v1/models"), fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${geminiApiKey}`)]);
      if (!openRouterModelsRes.ok || !geminiModelsRes.ok) {
        throw new Error("Failed to fetch models");
      }
      const [openRouterData, geminiData] = await Promise.all([openRouterModelsRes.json(), geminiModelsRes.json()]);

      await saveGeminiModelsToStore(geminiData.models);
      await saveOpenRouterModelsToStore(openRouterData.data);
    };

    fetchData();
  }, []);

  return (
    <ThemeProvider defaultTheme="dark">
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className={`app-header transition-all duration-300 ${isHeaderVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
            }`}>
            <SidebarTrigger className="sidebar-trigger-button" />

            <div className="absolute left-1/2 transform -translate-x-1/2">
              <Link to="/" className="">
                <span className="">TauLeChat</span>
              </Link>
            </div>

            <Button asChild variant="ghost" size="sm" className="new-chat-btn">
              <Link to="/chat">
                <Pen className="h-5 w-5" />
                <span className="sr-only">New Chat</span>
              </Link>
            </Button>
          </header>

          <main className={`flex flex-1 flex-col gap-4 overflow-hidden transition-all duration-300 ${isChatExpanded ? 'h-screen' : ''
            }`}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/chat/:id" element={<ChatScreen />} />
              <Route path="/chat" element={<ChatScreen />} />
              <Route path="/settings" element={<SettingsScreen />} />
              <Route path="/test" element={<TestComponent />} />
            </Routes>
          </main>
          <Toaster position="top-center" />
        </SidebarInset>
      </SidebarProvider>
    </ThemeProvider >
  );
}

export default App;
