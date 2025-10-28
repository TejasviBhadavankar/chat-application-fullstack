import { useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { Send, X, Smile, Image } from "lucide-react"; // using Image icon for both
import EmojiPicker from "emoji-picker-react";
import toast from "react-hot-toast";

const MessageInput = () => {
  const [text, setText] = useState("");
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaType, setMediaType] = useState(null); // "image" or "video"
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const mediaInputRef = useRef(null);
  const { sendMessage } = useChatStore();

  // Handle file upload (image or video)
  const handleMediaChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileType = file.type.startsWith("image/")
      ? "image"
      : file.type.startsWith("video/")
      ? "video"
      : null;

    if (!fileType) {
      toast.error("Please select an image or video file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setMediaPreview(reader.result);
      setMediaType(fileType);
    };
    reader.readAsDataURL(file);
  };

  // Remove preview
  const removeMedia = () => {
    setMediaPreview(null);
    setMediaType(null);
    if (mediaInputRef.current) mediaInputRef.current.value = "";
  };

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !mediaPreview) return;

    try {
      await sendMessage({
        text: text.trim(),
        file: mediaPreview,
        type: mediaType || "text",
      });

      setText("");
      setMediaPreview(null);
      setMediaType(null);
      setShowEmojiPicker(false);
      if (mediaInputRef.current) mediaInputRef.current.value = "";
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  // Emoji picker
  const handleEmojiClick = (emojiData) => {
    setText((prev) => prev + emojiData.emoji);
  };

  return (
    <div className="p-3 w-full relative bg-base-100 rounded-t-lg">
      {/* MEDIA PREVIEW */}
      {mediaPreview && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            {mediaType === "image" && (
              <img
                src={mediaPreview}
                alt="Preview"
                className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-lg border border-zinc-700"
              />
            )}
            {mediaType === "video" && (
              <video
                src={mediaPreview}
                controls
                className="w-28 h-24 sm:w-36 sm:h-28 rounded-lg border border-zinc-700"
              />
            )}
            <button
              onClick={removeMedia}
              type="button"
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300 flex items-center justify-center"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      {/* MAIN FORM */}
      <form
        onSubmit={handleSendMessage}
        className="flex items-center gap-2 flex-wrap sm:flex-nowrap"
      >
        <div className="flex flex-1 items-center gap-2">
          {/* EMOJI BUTTON */}
          <button
            type="button"
            className="btn btn-circle btn-sm text-zinc-400 hover:text-amber-500"
            onClick={() => setShowEmojiPicker((prev) => !prev)}
          >
            <Smile size={22} />
          </button>

          {/* EMOJI PICKER */}
          {showEmojiPicker && (
            <div className="absolute bottom-16 left-4 z-20">
              <EmojiPicker
                onEmojiClick={handleEmojiClick}
                theme="light"
                searchDisabled
                skinTonesDisabled
                width={300}
                height={400}
              />
            </div>
          )}

          {/* TEXT INPUT */}
          <input
            type="text"
            className="flex-1 input input-bordered rounded-lg input-sm sm:input-md"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          {/* MEDIA UPLOAD (image or video) */}
          <input
            type="file"
            accept="image/*,video/*"
            className="hidden"
            ref={mediaInputRef}
            onChange={handleMediaChange}
          />
          <button
            type="button"
            className={`flex btn btn-circle ${
              mediaPreview ? "text-emerald-500" : "text-zinc-400"
            }`}
            onClick={() => mediaInputRef.current?.click()}
          >
            <Image size={20} />
          </button>
        </div>

        {/* SEND BUTTON */}
        <button
          type="submit"
          className="btn btn-sm btn-circle ml-auto"
          disabled={!text.trim() && !mediaPreview}
        >
          <Send size={22} />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
