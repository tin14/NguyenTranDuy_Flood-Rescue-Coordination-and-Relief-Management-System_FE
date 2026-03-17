import apiClient from '../api'; // Import axios instance từ src/api.js
import { store } from './index'; // Import store 

export async function loginWithAPI(username, password) {
  try {
    // 1. Gửi request POST chứa username và password lên Backend
    const response = await apiClient.post('/auth/login', {
      username: username,
      password: password
    });

    // 2. Nếu Backend trả về thành công (HTTP 200), lưu thông tin user vào store
    // Giả sử Backend trả về JSON: { "status": "success", "data": { "id": 1, "role": "citizen", "name": "Nguyễn Văn A" } }
    store.currentUser = response.data.data; 
    
    return response.data.data; // Trả về data để xử lý ở giao diện
  } catch (error) {
    // 3. Xử lý lỗi (sai pass, server sập...)
    console.error('Lỗi khi gọi API đăng nhập:', error);
    throw error; // Ném lỗi ra để component Vue bắt được và hiện thông báo
  }
}