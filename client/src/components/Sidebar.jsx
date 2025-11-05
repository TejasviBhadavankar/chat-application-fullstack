import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users, Search } from "lucide-react";

const formatTime = (isoString) => {
  if (!isoString) return "";
  const date = new Date(isoString);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  return isToday
    ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : date.toLocaleDateString([], { month: "short", day: "numeric" });
};

const Sidebar = () => {
  const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    getUsers();
  }, [getUsers]);

  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.fullName.toLowerCase().includes(searchTerm.toLowerCase());
    const isOnline = onlineUsers.includes(user._id);
    return (showOnlineOnly ? isOnline : true) && matchesSearch;
  });

  if (isUsersLoading) return <SidebarSkeleton />;

  return (
    <aside
      className="
        h-screen w-full lg:w-72 
        border-r border-base-300 
        flex flex-col 
        transition-all duration-300 
        bg-base-100
      "
    >
      {/* Header Section */}
      <div className="border-b border-base-300 w-full p-5 bg-base-200 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="size-6 text-primary" />
            <span className="font-semibold text-lg">
              Contacts
            </span>
          </div>
          <span className="text-xs">
            {onlineUsers.length - 1} online
          </span>
        </div>

        {/* Search Bar */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-2.5 size-4" />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input input-bordered w-full pl-9 h-9 text-sm"
          />
        </div>

        {/* Toggle for online only */}
        <label className="cursor-pointer flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showOnlineOnly}
            onChange={(e) => setShowOnlineOnly(e.target.checked)}
            className="checkbox checkbox-sm"
          />
          <span>Show online only</span>
        </label>
      </div>

      {/* User List */}
      <div className="overflow-y-auto w-full py-3 flex-1 px-2">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => {
            const isOnline = onlineUsers.includes(user._id);
            const isSelected = selectedUser?._id === user._id;

            return (
              <button
                key={user._id}
                onClick={() => setSelectedUser(user)}
                className={`w-full p-3 flex items-center gap-3 transition-all duration-150 
                  rounded-lg mb-2 hover:bg-base-200 focus:ring-2 focus:ring-primary
                  ${isSelected ? "bg-base-200 ring-1 ring-primary" : ""}`}
              >
                {/* Profile Image */}
                <div className="relative flex-shrink-0">
                  <img
                    src={user.profilePic || "/avatar.png"}
                    alt={user.fullName}
                    className="size-12 object-cover rounded-full border"
                  />
                  <span
                    className={`absolute bottom-0 right-0 size-3 rounded-full ring-2 ring-base-100 ${
                      isOnline ? "bg-green-500" : "bg-gray-400"
                    }`}
                  />
                </div>

                {/* User Info */}
                <div className="flex flex-col justify-center flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <div className="font-medium truncate">{user.fullName}</div>
                    {user.lastMessageTime && (
                      <div className="text-xs ml-2 whitespace-nowrap">
                        {formatTime(user.lastMessageTime)}
                      </div>
                    )}
                  </div>

                  <div className="text-sm truncate">
                    {user.lastMessage
                      ? user.lastMessage.length > 28
                        ? user.lastMessage.slice(0, 28) + "..."
                        : user.lastMessage
                      : "No recent messages"}
                  </div>

                  {/* Online/Offline Text */}
                  <div
                    className={`text-xs font-medium mt-0.5 ${
                      isOnline ? "text-green-500" : "text-gray-500"
                    }`}
                  >
                    ● {isOnline ? "Online" : "Offline"}
                  </div>
                </div>
              </button>
            );
          })
        ) : (
          <div className="text-center text-zinc-500 py-6">No users found</div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
