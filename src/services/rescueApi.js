/**
 * rescueApi.js — Kết nối với Backend Spring Boot (http://localhost:8080)
 *
 * Các endpoint hiện có:
 *   PUT /requests/verify/{id}?level=LEVEL   → Xác minh yêu cầu cứu hộ
 *   POST /assignments/assign?requestId=&teamId=&vehicleId=  → Phân công đội + phương tiện
 *   PUT /missions/complete/{assignmentId}   → Hoàn thành nhiệm vụ
 *
 * Tất cả hàm đều trả về Promise. Gọi ngoài try/catch để xử lý lỗi.
 * Nếu backend không chạy hoặc ID không tồn tại trong DB, sẽ throw lỗi — caller tự handle.
 */

import apiClient from '../api.js'

// Ánh xạ urgency (frontend) → EmergencyLevel enum (backend)
const urgencyToLevel = {
  critical: 'CRITICAL',
  high:     'HIGH',
  medium:   'MEDIUM',
  low:      'LOW',
}

/**
 * Xác minh yêu cầu cứu hộ — chuyển status PENDING → VERIFIED và gán emergency level.
 * @param {number} requestId  - ID của RescueRequest trong DB backend
 * @param {string} urgency    - Mức độ: 'critical' | 'high' | 'medium' | 'low'
 * @returns {Promise} Response chứa RescueRequest đã cập nhật
 */
export async function verifyRequestAPI(requestId, urgency) {
  const level = urgencyToLevel[urgency] || 'MEDIUM'
  return apiClient.put(`/requests/verify/${requestId}?level=${level}`)
}

/**
 * Phân công đội cứu hộ + phương tiện cho yêu cầu — VERIFIED → ASSIGNED.
 * Đội và phương tiện sẽ bị đánh dấu "không khả dụng" trong DB.
 * @param {number} requestId  - ID của RescueRequest
 * @param {number} teamId     - ID của RescueTeam
 * @param {number} vehicleId  - ID của Vehicle
 * @returns {Promise} Response chứa RescueAssignment vừa tạo (có .id để lưu lại)
 */
export async function assignTeamAPI(requestId, teamId, vehicleId) {
  return apiClient.post(
    `/assignments/assign?requestId=${requestId}&teamId=${teamId}&vehicleId=${vehicleId}`
  )
}

/**
 * Hoàn thành nhiệm vụ cứu hộ — ASSIGNED/IN_PROGRESS → COMPLETED.
 * Đội và phương tiện trở lại trạng thái "khả dụng".
 * @param {number} assignmentId - ID của RescueAssignment (trả về từ assignTeamAPI)
 * @returns {Promise} Response chứa RescueAssignment đã cập nhật
 */
export async function completeMissionAPI(assignmentId) {
  return apiClient.put(`/missions/complete/${assignmentId}`)
}
