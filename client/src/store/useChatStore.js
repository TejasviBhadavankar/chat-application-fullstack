import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,

  // ✅ Load users (with last message info from backend)
  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load users");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  // ✅ Load messages with a selected user
  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  // ✅ Send message + update sidebar instantly
  sendMessage: async (messageData) => {
    const { selectedUser, messages, users } = get();
    try {
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
      const currentTime = new Date().toISOString();

      const updatedUsers = users.map((u) =>
        u._id === selectedUser._id
          ? {
              ...u,
              lastMessage: messageData.text || "",
              lastMessageFile: messageData.file || null,
              lastMessageAudio: messageData.audio || null,
              lastMessageType: messageData.type || "text",
              lastMessageTime: currentTime,
            }
          : u
      );

      const reordered = [
        ...updatedUsers.filter((u) => u._id === selectedUser._id),
        ...updatedUsers.filter((u) => u._id !== selectedUser._id),
      ];

      set({
        messages: [...messages, res.data],
        users: reordered,
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send message");
    }
  },

  // ✅ Send voice note
  sendVoiceNote: async (audioBlob) => {
    const { selectedUser, messages, users } = get();
    try {
      const base64Audio = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(audioBlob);
      });

      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, {
        audio: base64Audio,
        type: "audio",
      });

      const currentTime = new Date().toISOString();

      const updatedUsers = users.map((u) =>
        u._id === selectedUser._id
          ? {
              ...u,
              lastMessage: "",
              lastMessageFile: null,
              lastMessageAudio: base64Audio,
              lastMessageType: "audio",
              lastMessageTime: currentTime,
            }
          : u
      );

      const reordered = [
        ...updatedUsers.filter((u) => u._id === selectedUser._id),
        ...updatedUsers.filter((u) => u._id !== selectedUser._id),
      ];

      set({
        messages: [...messages, res.data],
        users: reordered,
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send voice note");
    }
  },

  // ✅ Receive message via socket and update sidebar
  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;

    socket.on("newMessage", (newMessage) => {
      const { selectedUser, users, messages } = get();
      const isFromSelectedUser = newMessage.senderId === selectedUser?._id;
      const currentTime = newMessage.createdAt || new Date().toISOString();

      const updatedUsers = users.map((u) =>
        u._id === newMessage.senderId
          ? {
              ...u,
              lastMessage: newMessage.text || "",
              lastMessageFile: newMessage.file || null,
              lastMessageAudio: newMessage.audio || null,
              lastMessageType: newMessage.type || "text",
              lastMessageTime: currentTime,
            }
          : u
      );

      const reordered = [
        ...updatedUsers.filter((u) => u._id === newMessage.senderId),
        ...updatedUsers.filter((u) => u._id !== newMessage.senderId),
      ];

      set({
        users: reordered,
        messages: isFromSelectedUser ? [...messages, newMessage] : messages,
      });
    });
  },

  // ✅ Unsubscribe from socket events
  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
  },

  // ✅ Set selected user
  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));
