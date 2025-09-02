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
import { MessageCircle, MoreHorizontal, Settings, Trash, } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Button } from "./ui/button";
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
    <Sidebar>
      <SidebarHeader>
        <Link to={"/"} className="flex items-center gap-2 px-2 py-2" >
          <MessageCircle size={styles.iconSize} />
          <span className="font-semibold text-lg">TauLeChat</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Chats</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {conversations.length === 0 && <div className="px-2 py-2 text-muted-foreground">No conversations found.</div>}
              {conversations.length > 0 && conversations.map((chat) => (
                <SidebarMenuItem key={chat.id} className="flex flex-row">
                  <SidebarMenuButton
                    onClick={() => handleChatClick(chat.id)}
                    className={`w-full justify-start ${chat.id === activeChat ? "!bg-card hover:text-white" : ""}`}
                  >
                    <div className="flex flex-row gap-1 w-full items-center">
                      <div className="flex items-center justify-between w-full">
                        <span className="font-medium truncate">
                          {chat.title || "New chat"}
                        </span>
                      </div>
                    </div>
                  </SidebarMenuButton>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <SidebarMenuAction className="hover:bg-muted">
                        <MoreHorizontal className="h-4 w-4 text-white" />
                      </SidebarMenuAction>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="top" align="start">
                      <DropdownMenuItem
                        onClick={() => {
                          setChatToDelete(chat.id);
                          setDeleteDialogOpen(true);
                        }}
                        className=""
                      >
                        <span className="w-full">Delete</span>
                        <Trash className="ml-2 text-destructive" />
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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
              <Button onClick={() => { navigate("/settings") }} variant="outline" className="flex items-center gap-2">
                <Settings size={styles.iconSize} />
                <span>Settings</span>
              </Button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the chat.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button variant="destructive" onClick={() => handleChatDelete(chatToDelete)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sidebar >
  );
}
