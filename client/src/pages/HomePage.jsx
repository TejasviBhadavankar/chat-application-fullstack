import { useChatStore } from "../store/useChatStore";
import Sidebar from "../components/Sidebar";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";
import { ArrowLeft } from "lucide-react";

const HomePage = () => {
  const { selectedUser, setSelectedUser } = useChatStore();

  return (
    <div className="w-screen h-screen min-h-screen bg-base-200 flex justify-center items-center overflow-hidden">
      {/* Outer Wrapper */}
      <div
        className="
          w-full h-full lg:h-[calc(100vh-6rem)] 
          lg:max-w-6xl md:max-w-4xl sm:max-w-full
          bg-base-100 rounded-none lg:rounded-lg 
          shadow-none lg:shadow-lg flex overflow-hidden relative
        "
      >
        {/* Sidebar */}
        <div
          className={`
            absolute lg:relative z-20 
            flex flex-col w-full lg:w-72 border-r border-base-300 
            h-screen lg:h-full overflow-y-auto transition-transform duration-300
            bg-base-100
            ${selectedUser ? "-translate-x-full lg:translate-x-0" : "translate-x-0"}
          `}
        >
          <Sidebar />
        </div>

        {/* Chat Container */}
        <div
          className={`
            absolute lg:relative z-10 w-full lg:flex-1 flex flex-col h-screen lg:h-full 
            bg-base-100 transition-transform duration-300 overflow-hidden
            ${selectedUser ? "translate-x-0" : "translate-x-full lg:translate-x-0"}
          `}
        >
          {selectedUser ? (
            <>
              {/* Mobile Header */}
              <div className="lg:hidden flex items-center gap-2 p-3 border-b border-base-300 bg-base-200">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="btn btn-sm btn-ghost flex items-center gap-1"
                >
                  <ArrowLeft className="size-4" />
                  <span>Back</span>
                </button>

                {/* User Avatar and Name */}
                <div className="flex items-center gap-2 ml-2">
                  <img
                    src={selectedUser.profilePic || "/default-avatar.png"}
                    alt="User"
                    className="w-8 h-8 rounded-full object-cover border border-base-300"
                  />
                  <div className="font-semibold text-sm truncate">
                    {selectedUser.fullName}
                  </div>
                </div>
              </div>

              <ChatContainer />
            </>
          ) : (
            <NoChatSelected />
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
