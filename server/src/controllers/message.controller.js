import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    const users = await User.aggregate([
      { $match: { _id: { $ne: loggedInUserId } } },
      {
        $lookup: {
          from: "messages",
          let: { userId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    { $and: [{ $eq: ["$senderId", "$$userId"] }, { $eq: ["$receiverId", loggedInUserId] }] },
                    { $and: [{ $eq: ["$senderId", loggedInUserId] }, { $eq: ["$receiverId", "$$userId"] }] },
                  ],
                },
              },
            },
            { $sort: { createdAt: -1 } },
            { $limit: 1 },
          ],
          as: "lastMessage",
        },
      },
      {
        $addFields: {
          lastMessage: { $arrayElemAt: ["$lastMessage.text", 0] },
          lastMessageFile: { $arrayElemAt: ["$lastMessage.file", 0] },
          lastMessageAudio: { $arrayElemAt: ["$lastMessage.audio", 0] },
          lastMessageType: { $arrayElemAt: ["$lastMessage.type", 0] },
          lastMessageTime: { $arrayElemAt: ["$lastMessage.createdAt", 0] },
        },
      },
      { $sort: { lastMessageTime: -1 } },
      { $project: { password: 0 } },
    ]);

    res.status(200).json(users);
  } catch (error) {
    console.error("Error in getUsersForSidebar:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    });

    res.status(200).json(messages);
  } catch (error) {
    console.error("Error in getMessages controller:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ✅ sendMessage with voice note support
export const sendMessage = async (req, res) => {
  try {
    const { text, file, audio, type } = req.body; // <-- added audio here
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      file,
      audio, // 🎙 stores voice note base64 or file URL
      type, // 'text' | 'image' | 'video' | 'audio'
    });

    await newMessage.save();

    // Send message to receiver in real-time via socket.io
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error in sendMessage controller:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
