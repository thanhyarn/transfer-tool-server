const moment = require("moment");
const jwt = require("jsonwebtoken");
const transferModal = require("../models/Transfer");
const userModal = require("../models/User");
const ActionLog = require("../models/ActionLog");

const SECRET_KEY = "Nextwaves@2023";
// Hàm tạo mã phiếu điều chuyển theo định dạng YYMMDDHHmmss
const generateTransferId = (date, time) => {
  const datePart = moment(date).format("YYMMDD");
  const timePart = moment(time, "HH:mm:ss").format("HHmmss");
  return `TS-${datePart}${timePart}`;
};

class Transfer {
  async createTransferSlip(req, res) {
    try {
      const {
        time,
        date,
        transport_type,
        receiver_name,
        notes,
        selectedProducts,
      } = req.body;

      console.log(selectedProducts);

      // Giải mã token từ header
      const token = req.header("Authorization").replace("Bearer ", "");

      let userId;

      try {
        const decoded = jwt.verify(token, SECRET_KEY);
        userId = decoded.userId;
      } catch (error) {
        return res.status(401).json({ message: "Token không hợp lệ" });
      }

      // Truy vấn bảng User để tìm fullName tương ứng với userId
      const user = await userModal.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "Không tìm thấy người dùng" });
      }
      const responsiblePerson = user.fullName;

      // Kiểm tra transport_type và thiết lập kho nguồn và kho đích
      let fromWarehouse, toWarehouse;
      if (transport_type === "lanh_vat_tu_san_xuat") {
        fromWarehouse = "Kho đường 10";
        toWarehouse = "Kho đường 8";
      } else if (transport_type === "tra_vat_tu_dang_do") {
        fromWarehouse = "Kho đường 8";
        toWarehouse = "Kho đường 10";
      } else {
        return res
          .status(400)
          .json({ message: "Loại vận chuyển không hợp lệ" });
      }

      // Tạo mã phiếu điều chuyển
      const transferId = generateTransferId(date, time);

      // Dữ liệu chuyển phiếu
      const transferSlip = {
        transferId,
        time,
        date,
        transport_type,
        fromWarehouse,
        toWarehouse,
        responsiblePerson, // Sử dụng fullName từ bảng User
        notes,
        products: selectedProducts,
        status: "pending",
        createdBy: userId, // Sử dụng _id từ token đã giải mã
        approvedBy: null,
        transferNotes: notes,
        transferMethod: "truck", // Mặc định hoặc lấy từ form
        timestamp: new Date().toISOString(),
      };

      // Lưu dữ liệu vào cơ sở dữ liệu
      await transferModal.create(transferSlip);

      const actionLog = new ActionLog({
        userId: userId,
        action: `Tạo phiếu ${transferId}`,
        timestamp: Date.now(), // Thời gian đã được điều chỉnh +7 giờ
      });

      await actionLog.save();

      res.status(200).json({
        message: "Xuất phiếu điều chuyển thành công!",
        transferId,
      });
    } catch (error) {
      console.error("Error creating transfer slip:", error);
      res
        .status(500)
        .json({ message: "Có lỗi xảy ra khi xuất phiếu điều chuyển" });
    }
  }

  async updateStatusTransfer(req, res) {
    try {
      const { transferId, status } = req.body;

      // Giải mã token từ header để lấy userId
      const token = req.header("Authorization").replace("Bearer ", "");

      let userId;

      try {
        const decoded = jwt.verify(token, SECRET_KEY);
        userId = decoded.userId;
      } catch (error) {
        return res.status(401).json({ message: "Token không hợp lệ" });
      }

      // Kiểm tra nếu status hợp lệ
      const validStatuses = ["pending", "completed", "cancelled"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      // Tìm và cập nhật Transfer với transferId tương ứng
      const updatedTransfer = await transferModal.findOneAndUpdate(
        { transferId },
        { status },
        { new: true } // Tùy chọn này trả về tài liệu đã được cập nhật
      );

      if (!updatedTransfer) {
        return res.status(404).json({ error: "Transfer not found" });
      }

      // Lưu hành động của người dùng vào bảng ActionLog với thời gian đã điều chỉnh
      const actionLog = new ActionLog({
        userId: userId,
        action: `Cập nhật trạng thái phiếu ${transferId} thành ${status}`,
        timestamp: Date.now(), // Thời gian đã được điều chỉnh +7 giờ
      });

      await actionLog.save();

      // Trả về kết quả thành công
      res.status(200).json({
        message: "Transfer status updated successfully",
        transfer: updatedTransfer,
      });
    } catch (error) {
      console.error("Error updating transfer status:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async getAllTransferSlip(req, res) {
    try {
      // Sử dụng model để lấy tất cả các phiếu điều chuyển và sắp xếp theo timestamp mới nhất
      const transfers = await transferModal.find().sort({ timestamp: -1 });

      // Trả về kết quả dưới dạng JSON
      res.status(200).json({
        success: true,
        data: transfers,
      });
    } catch (error) {
      // Xử lý lỗi nếu có
      console.error("Error retrieving transfer slips:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy dữ liệu phiếu điều chuyển.",
      });
    }
  }

  async getDataById(req, res) {
    const { id } = req.params;

    try {
      const transferData = await transferModal.findOne({ transferId: id });

      if (!transferData) {
        return res.status(404).json({ message: "Transfer not found" });
      }

      const userData = await userModal.findById(transferData.createdBy);
      if (!userData) {
        return res.status(404).json({ message: "User not found" });
      }

      const formattedData = {
        ...transferData._doc, // Lấy toàn bộ dữ liệu của transferData
        createdByFullName: userData.fullName, // Thêm giá trị fullName vào
      };

      return res.status(200).json(formattedData);
    } catch (error) {
      console.error("Error fetching transfer data:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
}

module.exports = new Transfer();
