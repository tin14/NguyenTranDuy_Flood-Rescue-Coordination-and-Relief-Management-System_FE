<template>
  <!-- Thanh điều hướng chính — màu primary (xanh), có bóng đổ -->
  <nav class="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm">
    <div class="container-fluid">

      <!-- Logo / tên hệ thống bên trái -->
      <a class="navbar-brand fw-bold" href="#">
        <i class="bi bi-water me-2"></i>Hệ Thống Cứu Hộ Lũ Lụt
      </a>

      <!-- Nút hamburger — hiện trên màn hình nhỏ (< lg) để mở/đóng menu -->
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarMain">
        <span class="navbar-toggler-icon"></span>
      </button>

      <!-- Phần collapse: chứa nav links và thông tin user -->
      <div class="collapse navbar-collapse" id="navbarMain">

        <!-- Danh sách link điều hướng — thay đổi theo role của user -->
        <ul class="navbar-nav me-auto">
          <!-- v-for render một <li> cho mỗi link trong navLinks (computed từ role) -->
          <li v-for="link in navLinks" :key="link.to" class="nav-item">
            <!-- router-link tự thêm class "router-link-active" khi đang ở trang đó -->
            <router-link :to="link.to" class="nav-link">
              <i :class="link.icon + ' me-1'"></i>{{ link.label }}
            </router-link>
          </li>
        </ul>

        <!-- Phần phải: tên user + badge role + nút đăng xuất -->
        <div class="d-flex align-items-center text-white">
          <i class="bi bi-person-circle me-2"></i>
          <!-- user?.name dùng optional chaining — an toàn khi user chưa có giá trị -->
          <span class="me-3">
            {{ user?.name }}
            <!-- badge hiển thị tên role bằng tiếng Việt -->
            <span class="badge bg-light text-primary ms-1">{{ roleLabel }}</span>
          </span>
          <!-- Nút đăng xuất — emit sự kiện 'logout' lên component cha để xử lý -->
          <button class="btn btn-outline-light btn-sm" @click="$emit('logout')">
            <i class="bi bi-box-arrow-right me-1"></i>Đăng xuất
          </button>
        </div>

      </div>
    </div>
  </nav>
</template>

<script setup>
import { computed } from 'vue'

// Nhận prop 'user' từ component cha (layout của từng trang)
const props = defineProps({
  user: Object, // Object user đang đăng nhập hoặc null
})

// Khai báo sự kiện 'logout' để component cha lắng nghe và xử lý
defineEmits(['logout'])

// Mapping từ role code → tên tiếng Việt hiển thị trong badge
const roleLabels = {
  citizen:      'Người dân',
  rescue_team:  'Đội cứu hộ',
  coordinator:  'Điều phối viên',
  manager:      'Quản lý',
  admin:        'Quản trị viên',
}

// computed tự tính lại khi props.user thay đổi
const roleLabel = computed(() => roleLabels[props.user?.role] || '')

// Định nghĩa nav links cho từng role
// Mỗi role chỉ thấy đúng các trang của mình
const navsByRole = {
  citizen:      [{ to: '/citizen',     icon: 'bi-house-fill',       label: 'Trang chủ' }],
  rescue_team:  [{ to: '/team',        icon: 'bi-people-fill',      label: 'Nhiệm vụ'  }],
  coordinator:  [{ to: '/coordinator', icon: 'bi-diagram-3-fill',   label: 'Điều phối' }],
  manager:      [{ to: '/manager',     icon: 'bi-box-seam-fill',    label: 'Kho hàng'  }],
  admin:        [{ to: '/admin',       icon: 'bi-shield-lock-fill', label: 'Quản trị'  }],
}

// Lấy danh sách nav links tương ứng với role hiện tại
// Trả về mảng rỗng [] nếu không xác định được role (tránh lỗi undefined)
const navLinks = computed(() => navsByRole[props.user?.role] || [])
</script>
