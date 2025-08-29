import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import type { Conversation } from "@/lib/database/methods";
import { getAllConversations } from "@/lib/database/methods";
import { MessageCircle, Settings, TestTube, User } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";


export default function AppSidebar() {

  const navigate = useNavigate();

  const [conversations, setConversations] = useState<Conversation[]>([]);

  const handleChatClick = (chatId: string) => {
    navigate(`/chat/${chatId}`);
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const rows = await getAllConversations();
        if (!mounted) return;
        setConversations(rows || []);
      } catch (err) {
        console.error("Failed to load conversations:", err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <Sidebar>
      <SidebarHeader>
        <Link to={"/"} className="flex items-center gap-2 px-2 py-2" >
          <MessageCircle className="h-6 w-6" />
          <span className="font-semibold text-lg">TauLeChat</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Chats</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {conversations.map((chat) => (
                <SidebarMenuItem key={chat.id}>
                  <SidebarMenuButton
                    onClick={() => handleChatClick(chat.id)}
                    className="w-full justify-start !bg-card"
                  >
                    <div className="flex flex-col items-start gap-1 w-full ">
                      <div className="flex items-center justify-between w-full">
                        <span className="font-medium truncate">
                          {chat.title || "New chat"}
                        </span>

                      </div>
                      {chat.model_id && (
                        <span className="text-primary font-medium">
                          {chat.model_id}
                        </span>
                      )}
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link to="/profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>Profile</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link to="/settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link to="/test" className="flex items-center gap-2">
                <TestTube className="h-4 w-4" />
                <span>Test</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
