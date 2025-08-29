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
import { ConversationState, useStore } from "@/utils/state";
import { MessageCircle, Settings, TestTube, User } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";

interface ChatItem {
  id: string;
  title: string;
  preview: string;
  timestamp: string;
  model?: string;
}

export default function AppSidebar() {

  const conversations: ConversationState[] = useStore<ConversationState[]>((state) => state.conversations);

  const handleChatClick = (chatId: string) => {
    const navigate = useNavigate();

    navigate(`/chat/${chatId}`);
  };

  useEffect(() => {

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
                <SidebarMenuItem key={chat.conversationId}>
                  <SidebarMenuButton
                    onClick={() => handleChatClick(chat.conversationId)}
                    className="w-full justify-start !bg-card"
                  >
                    <div className="flex flex-col items-start gap-1 w-full ">
                      <div className="flex items-center justify-between w-full">
                        <span className="font-medium truncate">
                          {chat.title}
                        </span>

                      </div>
                      {chat.modelId && (
                        <span className="text-primary font-medium">
                          {chat.modelId}
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
