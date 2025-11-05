import { X } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";

const ChatHeader = () => {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { onlineUsers } = useAuthStore();

  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Left: Avatar + Info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0">
            <img
              src={selectedUser?.profilePic || "/avatar.png"}
              alt={selectedUser?.fullName}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="truncate">
            <h3 className="font-semibold  truncate">
              {selectedUser?.fullName}
            </h3>
            <p className="text-sm">
              {onlineUsers?.includes(selectedUser?._id) ? "Online" : "Offline"}
            </p>
          </div>
        </div>

        {/* Right: Close button */}
        <button
          onClick={() => setSelectedUser(null)}
          className="p-1 rounded-full hover:bg-gray-100 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;
