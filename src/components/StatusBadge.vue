<template>
  <!-- Badge đơn giản — class và label được tính động từ props -->
  <span class="badge" :class="badgeClass">{{ label }}</span>
</template>

<script setup>
import { computed } from 'vue'

// Props nhận vào:
//   status: chuỗi trạng thái, ví dụ 'pending', 'completed', 'critical', 'high'...
//   type:   'status' (mặc định) hoặc 'urgency' — xác định dùng bảng màu nào
const props = defineProps({
  status: String,
  type: { type: String, default: 'status' }, // Mặc định là 'status'
})

// Bảng màu cho trạng thái yêu cầu cứu hộ
const statusMap = {
  pending:     { cls: 'bg-warning text-dark', label: 'Chờ xác minh' }, // Vàng — chờ coordinator xem
  verified:    { cls: 'bg-info text-dark',    label: 'Đã xác minh'  }, // Xanh lam nhạt — đã xác nhận
  assigned:    { cls: 'bg-primary',           label: 'Đã phân công' }, // Xanh — đã có đội nhận
  in_progress: { cls: 'bg-warning text-dark', label: 'Đang xử lý'   }, // Vàng — đang cứu hộ
  completed:   { cls: 'bg-success',           label: 'Hoàn thành'   }, // Xanh lá — xong
  cancelled:   { cls: 'bg-secondary',         label: 'Đã hủy'       }, // Xám — đã hủy
}

// Bảng màu cho mức độ khẩn cấp
const urgencyMap = {
  critical: { cls: 'bg-danger',          label: 'Khẩn cấp'   }, // Đỏ — nguy hiểm tính mạng
  high:     { cls: 'bg-warning text-dark',label: 'Cao'        }, // Vàng — cần hỗ trợ ngay
  medium:   { cls: 'bg-info text-dark',   label: 'Trung bình' }, // Xanh nhạt
  low:      { cls: 'bg-success',          label: 'Thấp'       }, // Xanh lá — ít khẩn cấp
}

// Chọn bảng màu dựa trên prop type
const map = computed(() => props.type === 'urgency' ? urgencyMap : statusMap)

// Tìm thông tin badge theo status — nếu không có trong map thì dùng màu xám + hiện raw value
const info = computed(() => map.value[props.status] || { cls: 'bg-secondary', label: props.status })

// Các computed trả về class Bootstrap và nhãn tiếng Việt
const badgeClass = computed(() => info.value.cls)
const label      = computed(() => info.value.label)
</script>
