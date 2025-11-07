import { useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { Send, X, Smile, Image, Mic, Square } from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import toast from "react-hot-toast";

const MessageInput = () => {
  const [text, setText] = useState("");
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);

  const mediaInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

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

  // Start Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        audioChunksRef.current = [];
        setAudioBlob(blob);
      };

      mediaRecorderRef.current.start();
      setRecording(true);
      toast.success("Recording started 🎙");
    } catch (error) {
      console.error("Microphone access denied:", error);
      toast.error("Please allow microphone access");
    }
  };

  // Stop Recording
  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      toast("Recording stopped ⏹");
    }
  };

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !mediaPreview && !audioBlob) return;

    try {
      let audioBase64 = null;

      // Convert audio blob to base64 if exists
      if (audioBlob) {
        const reader = new FileReader();
        reader.onloadend = async () => {
          audioBase64 = reader.result;
          await sendMessage({
            text: text.trim(),
            file: mediaPreview || null,
            audio: audioBase64,
            type: audioBase64 ? "audio" : mediaType || "text",
          });
          resetForm();
        };
        reader.readAsDataURL(audioBlob);
        return;
      }

      await sendMessage({
        text: text.trim(),
        file: mediaPreview,
        type: mediaType || "text",
      });

      resetForm();
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message");
    }
  };

  const resetForm = () => {
    setText("");
    setMediaPreview(null);
    setMediaType(null);
    setAudioBlob(null);
    setShowEmojiPicker(false);
    if (mediaInputRef.current) mediaInputRef.current.value = "";
  };

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

          {/* MEDIA UPLOAD */}
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

          {/* 🎙 VOICE NOTE BUTTON */}
          <button
            type="button"
            className={`flex btn btn-circle ${
              recording ? "text-red-500" : "text-zinc-400"
            }`}
            onClick={recording ? stopRecording : startRecording}
          >
            {recording ? <Square size={20} /> : <Mic size={20} />}
          </button>
        </div>

        {/* SEND BUTTON */}
        <button
          type="submit"
          className="btn btn-sm btn-circle ml-auto"
          disabled={!text.trim() && !mediaPreview && !audioBlob}
        >
          <Send size={22} />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
