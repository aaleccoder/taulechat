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
import { MessageCircle, Settings, User } from "lucide-react";

interface ChatItem {
  id: string;
  title: string;
  preview: string;
  timestamp: string;
  model?: string;
}

const chatItems: ChatItem[] = [
  {
    id: "1",
    title: "Help with React hooks",
    preview: "Can you explain useEffect and useState?",
    timestamp: "2m ago",
    model: "GPT-4",
  },
  {
    id: "2",
    title: "Python data analysis",
    preview: "How do I create a pandas DataFrame?",
    timestamp: "1h ago",
    model: "GPT-3.5",
  },
  {
    id: "3",
    title: "CSS Grid layout tutorial",
    preview: "Show me how to create a responsive grid",
    timestamp: "3h ago",
    model: "GPT-4",
  },
  {
    id: "4",
    title: "Database optimization",
    preview: "Best practices for indexing in PostgreSQL",
    timestamp: "5h ago",
    model: "GPT-4",
  },
  {
    id: "5",
    title: "API design patterns",
    preview: "REST vs GraphQL comparison",
    timestamp: "1d ago",
    model: "GPT-3.5",
  },
];

export default function AppSidebar() {
  const handleChatClick = (chatId: string) => {
    // TODO: Handle chat selection
    console.log(`Chat clicked: ${chatId}`);
  };

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          <MessageCircle className="h-6 w-6" />
          <span className="font-semibold text-lg">TauLeChat</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Chats</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {chatItems.map((chat) => (
                <SidebarMenuItem key={chat.id}>
                  <SidebarMenuButton
                    onClick={() => handleChatClick(chat.id)}
                    className="w-full justify-start !bg-card"
                  >
                    <div className="flex flex-col items-start gap-1 w-full ">
                      <div className="flex items-center justify-between w-full">
                        <span className="font-medium truncate">
                          {chat.title}
                        </span>
                        <span className="text-muted-foreground">
                          {chat.timestamp}
                        </span>
                      </div>
                      <span className="text-muted-foreground truncate w-full">
                        {chat.preview}
                      </span>
                      {chat.model && (
                        <span className="text-primary font-medium">
                          {chat.model}
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
              <a href="#" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>Profile</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a href="#" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
