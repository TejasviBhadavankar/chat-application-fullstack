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

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      // Initialize optional fields
      const usersWithLast = res.data.map((u) => ({
        ...u,
        lastMessage: "",
        lastMessageTime: "",
      }));
      set({ users: usersWithLast });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load users");
    } finally {
      set({ isUsersLoading: false });
    }
  },

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

  // ✅ Send message + update preview and time
  sendMessage: async (messageData) => {
    const { selectedUser, messages, users } = get();
    try {
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
      const currentTime = new Date().toISOString();

      const updatedUsers = users.map((u) =>
        u._id === selectedUser._id
          ? { ...u, lastMessage: messageData.text, lastMessageTime: currentTime }
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

  // ✅ Receive message + update preview and time
  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;

    socket.on("newMessage", (newMessage) => {
      const { selectedUser, users, messages } = get();
      const isFromSelectedUser = newMessage.senderId === selectedUser?._id;
      const currentTime = newMessage.createdAt || new Date().toISOString();

      const updatedUsers = users.map((u) =>
        u._id === newMessage.senderId
          ? { ...u, lastMessage: newMessage.text, lastMessageTime: currentTime }
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

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));
