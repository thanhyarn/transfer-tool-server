# Sử dụng Node.js image chính thức từ Docker Hub
FROM node:18

# Đặt biến môi trường
ENV NODE_ENV=production

# Thiết lập thư mục làm việc trong container
WORKDIR /app

# Sao chép tệp package.json và package-lock.json (nếu có) vào container
COPY package*.json ./

# Cài đặt các dependencies
RUN npm install --production

# Sao chép toàn bộ mã nguồn của bạn vào container
COPY . .

# Mở port mà ứng dụng của bạn sẽ chạy
EXPOSE 3000

# Khởi động ứng dụng
CMD ["node", "server.js"]
# docker build -t thanhgiang1306/transfer-tool:dev ./ && docker push thanhgiang1306/transfer-tool:dev 