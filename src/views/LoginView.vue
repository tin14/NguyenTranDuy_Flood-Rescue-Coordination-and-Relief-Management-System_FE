<template>
  <!-- Toàn trang: căn giữa theo chiều dọc và ngang, nền gradient xanh -->
  <div class="min-vh-100 d-flex align-items-center justify-content-center bg-login">
    <div class="container">
      <div class="row justify-content-center">
        <!-- Card đăng nhập chiếm 5/12 cột trên màn hình md trở lên -->
        <div class="col-md-5">
          <div class="card shadow-lg border-0 rounded-4">
            <div class="card-body p-5">

              <!-- Phần header: icon nước + tên hệ thống -->
              <div class="text-center mb-4">
                <i class="bi bi-water text-primary" style="font-size:3rem"></i>
                <h3 class="fw-bold mt-2 text-primary">Hệ Thống Cứu Hộ Lũ Lụt</h3>
                <p class="text-muted small">Phần mềm điều phối cứu hộ và quản lý cứu trợ</p>
              </div>

              <!-- Thông báo lỗi — chỉ hiện khi biến error có giá trị -->
              <div v-if="error" class="alert alert-danger py-2">
                <i class="bi bi-exclamation-triangle me-2"></i>{{ error }}
              </div>

              <!-- Form đăng nhập — @submit.prevent ngăn reload trang, gọi handleLogin() -->
              <form @submit.prevent="handleLogin">
                <!-- Trường username -->
                <div class="mb-3">
                  <label class="form-label fw-semibold">Tên đăng nhập</label>
                  <div class="input-group">
                    <span class="input-group-text"><i class="bi bi-person"></i></span>
                    <!-- v-model="username" liên kết hai chiều với biến username trong script -->
                    <input v-model="username" type="text" class="form-control" placeholder="Nhập tên đăng nhập" required />
                  </div>
                </div>

                <!-- Trường mật khẩu + nút toggle hiện/ẩn -->
                <div class="mb-4">
                  <label class="form-label fw-semibold">Mật khẩu</label>
                  <div class="input-group">
                    <span class="input-group-text"><i class="bi bi-lock"></i></span>
                    <!-- :type binding động — showPwd=true thì hiện text, false thì ẩn (password) -->
                    <input v-model="password" :type="showPwd ? 'text' : 'password'" class="form-control" placeholder="Nhập mật khẩu" required />
                    <!-- Nút mắt — click để toggle showPwd -->
                    <button type="button" class="btn btn-outline-secondary" @click="showPwd = !showPwd">
                      <i :class="showPwd ? 'bi-eye-slash' : 'bi-eye'" class="bi"></i>
                    </button>
                  </div>
                </div>

                <!-- Nút submit form -->
                <button type="submit" class="btn btn-primary w-100 py-2 fw-semibold">
                  <i class="bi bi-box-arrow-in-right me-2"></i>Đăng nhập
                </button>
              </form>

              <!-- Panel tài khoản demo — giúp test nhanh không cần gõ tay -->
              <div class="mt-4 pt-3 border-top">
                <p class="text-muted small text-center mb-2">Tài khoản demo:</p>
                <div class="row g-1">
                  <!-- v-for render một nút cho mỗi tài khoản demo -->
                  <!-- @click="fillDemo(acc)" tự điền username+password vào form -->
                  <div v-for="acc in demoAccounts" :key="acc.username" class="col-6">
                    <button class="btn btn-outline-secondary btn-sm w-100 text-start" @click="fillDemo(acc)">
                      <i :class="acc.icon + ' me-1'"></i>{{ acc.label }}
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// ref() tạo biến reactive — khi giá trị thay đổi, Vue tự cập nhật UI
import { ref } from 'vue'
import { useRouter } from 'vue-router'
// Hàm login từ store để xác thực người dùng
import { login } from '../store/index.js'
// roleRoutes để biết redirect về URL nào sau khi đăng nhập thành công
import { roleRoutes } from '../router/index.js'

const router = useRouter() // Dùng để điều hướng trang (router.push)

// Các biến reactive liên kết với input trên form
const username = ref('')    // Giá trị ô nhập username
const password = ref('')    // Giá trị ô nhập password
const error = ref('')       // Thông báo lỗi (rỗng = không hiện)
const showPwd = ref(false)  // true = hiện mật khẩu dạng text, false = ẩn

// Danh sách tài khoản demo hiển thị dưới form để click tự điền
const demoAccounts = [
  { username: 'citizen1', password: '123456',   label: 'Người dân',       icon: 'bi bi-person'      },
  { username: 'team1',    password: '123456',   label: 'Đội cứu hộ',      icon: 'bi bi-people'      },
  { username: 'coord1',   password: '123456',   label: 'Điều phối viên',  icon: 'bi bi-diagram-3'   },
  { username: 'manager1', password: '123456',   label: 'Quản lý kho',     icon: 'bi bi-box-seam'    },
  { username: 'admin',    password: 'admin123', label: 'Admin',           icon: 'bi bi-shield-lock' },
]

// Điền sẵn username và password khi click vào nút tài khoản demo
function fillDemo(acc) {
  username.value = acc.username
  password.value = acc.password
}

// Xử lý khi nhấn nút "Đăng nhập"
function handleLogin() {
  error.value = ''  // Xóa thông báo lỗi cũ

  // Gọi hàm login từ store — trả về object user nếu thành công, null nếu thất bại
  const user = login(username.value, password.value)

  if (user) {
    // Đăng nhập thành công → redirect tới trang tương ứng với role của user
    router.push(roleRoutes[user.role] || '/login')
  } else {
    // Đăng nhập thất bại → hiển thị thông báo lỗi
    error.value = 'Tên đăng nhập hoặc mật khẩu không đúng!'
  }
}
</script>

<style scoped>
/* Nền trang đăng nhập — gradient từ xanh dương nhạt → đậm */
.bg-login {
  background: linear-gradient(135deg, #1a6fc4 0%, #0d47a1 50%, #1565c0 100%);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%231a6fc4'/%3E%3Cstop offset='100%25' stop-color='%230d47a1'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill='url(%23g)' width='100%25' height='100%25'/%3E%3C/svg%3E");
}
</style>
