import { Route, Routes } from "react-router";
import "./App.css";
import { ThemeProvider } from "@/components/theme-provider";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import ChatScreen from "./components/ChatScreen";
import AppSidebar from "./components/Sidebar";

function App() {
  return (
    <ThemeProvider defaultTheme="dark">
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1 !bg-primary" />
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold">TauLeChat</h1>
            </div>
          </header>
          <main className="flex flex-1 flex-col gap-4 px-4 mt-4">
            <Routes>
              <Route path="/" element={<ChatScreen />} />
            </Routes>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </ThemeProvider>
  );
}

export default App;
