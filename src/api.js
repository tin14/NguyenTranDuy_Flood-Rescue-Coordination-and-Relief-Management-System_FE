import axios from 'axios';

// Tạo một instance của axios với các cấu hình mặc định
const apiClient = axios.create({
  baseURL: 'http://localhost:8080', // Backend Spring Boot chạy ở port 8080
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000, // Thời gian chờ tối đa 10s
});

export default apiClient;