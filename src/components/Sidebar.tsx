import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { styles } from "@/constants/style";
import { getAllConversations } from "@/lib/database/methods";
import { useSidebarConversation, useStore } from "@/utils/state";
import { MessageCircle, MoreHorizontal, Search, Settings, Trash, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { DialogClose } from "@radix-ui/react-dialog";
import { toast } from "sonner";


export default function AppSidebar() {

  const navigate = useNavigate();

  const conversations = useSidebarConversation((state) => state.conversations) || [];

  const activeChat = useSidebarConversation((state) => state.activeChat || null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredConversations = conversations.filter((chat) =>
    (chat.title || "New chat").toLowerCase().includes(searchQuery.toLowerCase())
  );


  const handleChatClick = (chatId: string) => {
    useSidebarConversation.getState().setActiveChat(chatId);
    navigate(`/chat/${chatId}`);
  };

  const handleChatDelete = (chatId: string | null) => {
    if (chatId) {
      if (chatId == useStore.getState().conversation?.id) {
        useStore.getState().setConversation(null);
        navigate("/");
      }
      setDeleteDialogOpen(false);
      useSidebarConversation.getState().removeConversation(chatId);
      toast("Chat has been deleted successfully.");
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const rows = await getAllConversations();
        if (mounted) useSidebarConversation.getState().addConversations(rows);
        console.log(useSidebarConversation.getState().conversations);
        if (!mounted) return;
      } catch (err) {
        console.error("Failed to load conversations:", err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (

    <Sidebar variant="inset" className="">
      <SidebarContent className="">
        <SidebarGroup>
          <SidebarGroupLabel className="sidebar-group-label">Chats</SidebarGroupLabel>
          <SidebarGroupContent>
            {/* Search input */}
            <div className="px-2 mb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input
                  placeholder="Search chats..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-chat-input pl-9 pr-9"
                  aria-label="Search conversations"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 rounded-full p-0 hover:bg-accent/10"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </Button>
                )}
              </div>
            </div>
            <SidebarMenu>
              {filteredConversations.length === 0 && conversations.length > 0 && (
                <div className="text-muted-foreground text-sm text-center select-none px-2" aria-live="polite">
                  <span className="block text-lg mb-2">🔍</span>
                  <span>No chats found.</span>
                  <span className="block text-xs mt-1 text-muted-foreground">Try a different search term.</span>
                </div>
              )}
              {conversations.length === 0 && (
                <div className="text-muted-foreground text-sm text-center select-none px-2" aria-live="polite">
                  <span className="block text-lg mb-2">🗨️</span>
                  <span>No conversations yet.</span>
                  <span className="block text-xs mt-1 text-muted-foreground">Start a new chat to see it here.</span>
                </div>
              )}
              {filteredConversations.length > 0 && filteredConversations.map((chat) => (
                <SidebarMenuItem
                  key={chat.id}
                  className="sidebar-menu-item group flex items-center gap-2"
                  aria-label={`Open chat: ${chat.title || 'New chat'}`}
                >
                  <SidebarMenuButton
                    onClick={() => handleChatClick(chat.id)}
                    className={`chat-list-btn flex-1 min-w-0 ${chat.id === activeChat ? ' chat-list-btn-active' : ''}`}
                    aria-label={chat.title || 'New chat'}
                  >
                    <span className="truncate text-foreground group-hover:text-accent motion-safe:transition-colors">
                      {chat.title || "New chat"}
                    </span>
                  </SidebarMenuButton>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <SidebarMenuAction
                        className="sidebar-action-btn opacity-0 group-hover:opacity-100 flex items-center justify-center"
                        aria-label="Chat actions"
                      >
                        <MoreHorizontal className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                      </SidebarMenuAction>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="top" align="end" className="sidebar-dropdown-content">
                      <DropdownMenuItem
                        onClick={() => {
                          setChatToDelete(chat.id);
                          setDeleteDialogOpen(true);
                        }}
                        className="sidebar-dropdown-item"
                        aria-label="Delete chat"
                      >
                        <Trash className="h-4 w-4 mr-2" aria-hidden="true" />
                        <span className="w-full">Delete</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="sidebar-footer">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Button
                onClick={() => { navigate("/settings") }}
                variant="outline"
                className="settings-btn hover:text-white hover:bg-accent/80"
                aria-label="Open settings"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6 ">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>

                <span className="text-foreground">Settings</span>
              </Button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sidebar-dialog-content">
          <DialogHeader>
            <DialogTitle className="sidebar-dialog-title">Are you sure?</DialogTitle>
            <DialogDescription className="sidebar-dialog-description">
              This action cannot be undone. This will permanently delete the chat.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sidebar-dialog-footer">
            <DialogClose asChild>
              <Button variant="outline" className="sidebar-dialog-btn" aria-label="Cancel">Cancel</Button>
            </DialogClose>
            <Button variant="destructive" className="sidebar-dialog-btn" onClick={() => handleChatDelete(chatToDelete)} aria-label="Delete chat">Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sidebar>
  );
}
