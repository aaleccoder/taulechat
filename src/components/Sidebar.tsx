import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { getAllConversations } from "@/lib/database/methods";
import { useSidebarConversation, useStore } from "@/utils/state";
import { MessageCircle, MoreHorizontal, Search, Trash, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "./ui/dialog";
import { toast } from "sonner";
import { useLongPress } from "@/hooks/useLongPress";
import { Checkbox } from "./ui/checkbox";

type SidebarChatItemProps = {
  chat: Omit<import("@/utils/state").ConversationState, "messages">;
  isMultiSelectMode: boolean;
  isSelected: boolean;
  onToggleSelection: (chatId: string) => void;
  onLongPress: (chatId: string) => void;
  onClick: (chatId: string, event: React.MouseEvent | React.TouchEvent) => void;
  onDelete: (chatId: string) => void;
};

const SidebarChatItem: React.FC<SidebarChatItemProps> = ({
  chat,
  isMultiSelectMode,
  isSelected,
  onToggleSelection,
  onLongPress,
  onClick,
  onDelete,
}) => {
  const longPressProps = useLongPress({
    onLongPress: () => onLongPress(chat.id),
    onClick: (e) => onClick(chat.id, e),
  });

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete(chat.id);
  };

  const isActiveChat =
    useSidebarConversation((state) => state.activeChat) === chat.id;

  return (
    <SidebarMenuItem
      key={chat.id}
      className={`flex items-center gap-2 rounded-md transition-colors hover:bg-accent/20 ${isActiveChat ? "bg-accent/10" : ""}`}
      aria-label={`Chat: ${chat.title || "New chat"}`}
      {...longPressProps}
    >
      {isMultiSelectMode && (
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggleSelection(chat.id)}
          className="mr-2"
          aria-label={`Select chat: ${chat.title || "New chat"}`}
        />
      )}
      <div className="flex-1 min-w-0 flex items-center">
        <span className="truncate text-foreground select-none px-2">
          {chat.title || "New chat"}
        </span>
      </div>
      {!isMultiSelectMode && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 rounded-full p-0 motion-safe:transition-all motion-safe:duration-150 hover:bg-accent/10 active:scale-95 focus-visible:ring-2 focus-visible:ring-accent/50"
              onClick={(e) => e.stopPropagation()}
              aria-label="Chat actions"
            >
              <MoreHorizontal
                className="h-4 w-4 text-muted-foreground"
                aria-hidden="true"
              />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="right"
            align="start"
            className="sidebar-dropdown-content"
          >
            <DropdownMenuItem
              onClick={handleDelete}
              className="sidebar-dropdown-item"
              aria-label="Delete chat"
            >
              <Trash className="h-4 w-4 mr-2" aria-hidden="true" />
              <span className="w-full">Delete</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </SidebarMenuItem>
  );
};

export default function AppSidebar() {
  const { setOpenMobile } = useSidebar();
  const navigate = useNavigate();

  const conversations =
    useSidebarConversation((state) => state.conversations) || [];

  const [multiDeleteDialogOpen, setMultiDeleteDialogOpen] = useState(false);
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [multiSelectedChats, setMultiSelectedChats] = useState<string[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  const filteredConversations = conversations.filter((chat) =>
    (chat.title || "New chat")
      .toLowerCase()
      .includes(searchQuery.toLowerCase()),
  );

  const handleChatClick = (chatId: string) => {
    if (multiSelectMode) {
      toggleMultiChatSelection(chatId);
    } else {
      useSidebarConversation.getState().setActiveChat(chatId);
      navigate(`/chat/${chatId}`);
      setOpenMobile(false); // Close the sidebar on mobile when a chat is clicked
    }
  };

  const handleDeleteClick = (chatId: string) => {
    setMultiSelectMode(true);
    setMultiSelectedChats([chatId]);
  };

  const handleDeleteMultipleChats = () => {
    const activeConversation = useStore.getState().conversation;
    if (
      activeConversation &&
      multiSelectedChats.includes(activeConversation.id)
    ) {
      useStore.getState().setConversation(null);
      navigate("/");
    }
    useSidebarConversation.getState().removeConversations(multiSelectedChats);
    toast(
      `${multiSelectedChats.length} chat(s) have been deleted successfully.`,
    );
    setMultiSelectMode(false);
    setMultiSelectedChats([]);
    setMultiDeleteDialogOpen(false);
  };

  const toggleMultiChatSelection = (chatId: string) => {
    setMultiSelectedChats((prev) =>
      prev.includes(chatId)
        ? prev.filter((id) => id !== chatId)
        : [...prev, chatId],
    );
  };

  const handleLongPress = (chatId: string) => {
    if (!multiSelectMode) {
      setMultiSelectMode(true);
      setMultiSelectedChats([chatId]);
    }
  };

  const handleItemClick = (
    chatId: string,
    event: React.MouseEvent | React.TouchEvent,
  ) => {
    if (event.type === "click" && (event as React.MouseEvent).ctrlKey) {
      if (!multiSelectMode) {
        setMultiSelectMode(true);
      }
      toggleMultiChatSelection(chatId);
    } else if (!multiSelectMode) {
      handleChatClick(chatId);
    } else {
      toggleMultiChatSelection(chatId);
    }
  };

  useEffect(() => {
    if (multiSelectedChats.length === 0 && multiSelectMode) {
      setMultiSelectMode(false);
    }
  }, [multiSelectedChats, multiSelectMode]);

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
          <SidebarGroupLabel className="sidebar-group-label px-2">
            {multiSelectMode
              ? `${multiSelectedChats.length} selected`
              : "Chats"}
          </SidebarGroupLabel>
          <SidebarGroupContent className="pt-[env(safe-area-inset-top)]">
            <div className="px-2 mb-3 relative h-10">
              {/* App header with bubble icon - disappears when search is expanded */}
              <div
                className={`flex items-center justify-between motion-safe:transition-all motion-safe:duration-300 ${isSearchExpanded ? "opacity-0 pointer-events-none -translate-y-2" : "opacity-100 translate-y-0"}`}
              >
                <div className="flex items-center gap-2">
                  <MessageCircle
                    className="h-5 w-5 text-accent-foreground"
                    aria-hidden="true"
                  />
                  <h1 className="text-lg font-semibold text-foreground select-none">
                    TauleChat
                  </h1>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-full motion-safe:transition-all motion-safe:duration-150 hover:bg-accent/10 active:scale-95"
                  onClick={() => setIsSearchExpanded(true)}
                  title="Search chats"
                  aria-label="Search chats"
                >
                  <Search className="w-5 h-5" />
                </Button>
              </div>
              <div
                className={`absolute inset-0 flex items-center motion-safe:transition-all motion-safe:duration-300 ${isSearchExpanded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"}`}
              >
                <Search
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  placeholder="Search chats..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-chat-input pl-9 pr-9 w-full"
                  aria-label="Search conversations"
                  onBlur={() => {
                    if (!searchQuery.trim()) {
                      setIsSearchExpanded(false);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setSearchQuery("");
                      setIsSearchExpanded(false);
                    }
                  }}
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchQuery("");
                      setIsSearchExpanded(false);
                    }}
                    className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 rounded-full p-0 hover:bg-accent/10"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </Button>
                )}
              </div>
            </div>
            <SidebarMenu className="flex flex-col gap-1 px-2">
              {filteredConversations.length === 0 &&
                conversations.length > 0 && (
                  <div
                    className="text-muted-foreground text-sm text-center select-none px-2"
                    aria-live="polite"
                  >
                    <span className="block text-lg mb-2">🔍</span>
                    <span>No chats found.</span>
                    <span className="block text-xs mt-1 text-muted-foreground">
                      Try a different search term.
                    </span>
                  </div>
                )}
              {conversations.length === 0 && (
                <div
                  className="text-muted-foreground text-sm text-center select-none px-2"
                  aria-live="polite"
                >
                  <span className="block text-lg mb-2">🗨️</span>
                  <span>No conversations yet.</span>
                  <span className="block text-xs mt-1 text-muted-foreground">
                    Start a new chat to see it here.
                  </span>
                </div>
              )}
              {filteredConversations.length > 0 &&
                filteredConversations.map((chat) => (
                  <SidebarChatItem
                    key={chat.id}
                    chat={chat}
                    isMultiSelectMode={multiSelectMode}
                    isSelected={multiSelectedChats.includes(chat.id)}
                    onToggleSelection={toggleMultiChatSelection}
                    onLongPress={handleLongPress}
                    onClick={handleItemClick}
                    onDelete={handleDeleteClick}
                  />
                ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="sidebar-footer">
        {multiSelectMode && multiSelectedChats.length > 0 && (
          <div className="p-2 flex flex-col gap-2">
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => setMultiDeleteDialogOpen(true)}
            >
              <Trash className="h-4 w-4 mr-2" />
              Delete ({multiSelectedChats.length})
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => {
                setMultiSelectMode(false);
                setMultiSelectedChats([]);
              }}
            >
              Cancel
            </Button>
          </div>
        )}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Button
                onClick={() => {
                  setOpenMobile(false);
                  navigate("/settings");
                }}
                variant="outline"
                className="settings-btn hover:text-white hover:bg-accent/80"
                aria-label="Open settings"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="size-6 "
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                  />
                </svg>

                <span className="text-foreground">Settings</span>
              </Button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <Dialog
        open={multiDeleteDialogOpen}
        onOpenChange={setMultiDeleteDialogOpen}
      >
        <DialogContent className="sidebar-dialog-content">
          <DialogHeader>
            <DialogTitle className="sidebar-dialog-title">
              Are you sure?
            </DialogTitle>
            <DialogDescription className="sidebar-dialog-description">
              This will permanently delete the {multiSelectedChats.length}{" "}
              selected chat(s).
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sidebar-dialog-footer">
            <DialogClose asChild>
              <Button
                variant="outline"
                className="sidebar-dialog-btn"
                aria-label="Cancel"
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              variant="destructive"
              className="sidebar-dialog-btn"
              onClick={handleDeleteMultipleChats}
              aria-label="Delete"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sidebar>
  );
}
