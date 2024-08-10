const historyModal = require("../models/ActionLog");
const userModal = require("../models/User");

class historyController {
  async getAll(req, res) {
    try {
      // Lấy tất cả các bản ghi từ bảng ActionLog
      const historyLogs = await historyModal.find().sort({ timestamp: -1 });

      // Duyệt qua từng bản ghi để tìm userId và thay thế bằng username
      const logsWithUsernames = await Promise.all(
        historyLogs.map(async (log) => {
          const user = await userModal.findById(log.userId);
          return {
            _id: log._id,
            username: user ? user.username : "Unknown User", // Nếu user không tồn tại, hiển thị 'Unknown User'
            action: log.action,
            timestamp: log.timestamp,
          };
        })
      );

      // Trả về kết quả thành công với dữ liệu lịch sử đã kết hợp username
      res.status(200).json(logsWithUsernames);
    } catch (error) {
      console.error("Error fetching history logs:", error);
      res
        .status(500)
        .json({ message: "Có lỗi xảy ra khi lấy dữ liệu lịch sử" });
    }
  }
}

module.exports = new historyController();
