<template>
  <div class="min-vh-100 d-flex align-items-center justify-content-center bg-login">
    <div class="container">
      <div class="row justify-content-center">
        <div class="col-md-5">
          <div class="card shadow-lg border-0 rounded-4">
            <div class="card-body p-5">

              <!-- Header -->
              <div class="text-center mb-4">
                <i class="bi bi-water text-primary" style="font-size:3rem"></i>
                <h3 class="fw-bold mt-2 text-primary">Hệ Thống Cứu Hộ Lũ Lụt</h3>
                <p class="text-muted small">Phần mềm điều phối cứu hộ và quản lý cứu trợ</p>
              </div>

              <!-- Tab: Đăng nhập / Đăng ký -->
              <ul class="nav nav-pills nav-fill mb-4">
                <li class="nav-item">
                  <button class="nav-link" :class="{ active: mode === 'login' }" @click="switchMode('login')">
                    <i class="bi bi-box-arrow-in-right me-1"></i>Đăng nhập
                  </button>
                </li>
                <li class="nav-item">
                  <button class="nav-link" :class="{ active: mode === 'register' }" @click="switchMode('register')">
                    <i class="bi bi-person-plus me-1"></i>Đăng ký
                  </button>
                </li>
              </ul>

              <!-- ═══ FORM ĐĂNG NHẬP ═══════════════════════════════════════════ -->
              <div v-if="mode === 'login'">
                <div v-if="error" class="alert alert-danger py-2">
                  <i class="bi bi-exclamation-triangle me-2"></i>{{ error }}
                </div>

                <form @submit.prevent="handleLogin">

                  <!-- Dropdown chọn vai trò -->
                  <div class="mb-3">
                    <label class="form-label fw-semibold">Vai trò</label>
                    <div class="input-group">
                      <span class="input-group-text"><i class="bi bi-shield-lock"></i></span>
                      <select v-model="loginRole" class="form-select">
                        <option value="">-- Chọn vai trò --</option>
                        <option v-for="r in roleOptions" :key="r.value" :value="r.value">
                          {{ r.label }}
                        </option>
                      </select>
                    </div>
                  </div>

                  <!-- Username -->
                  <div class="mb-3">
                    <label class="form-label fw-semibold">Tên đăng nhập</label>
                    <div class="input-group">
                      <span class="input-group-text"><i class="bi bi-person"></i></span>
                      <input v-model="username" type="text" class="form-control" placeholder="Nhập tên đăng nhập" required />
                    </div>
                  </div>

                  <!-- Password -->
                  <div class="mb-4">
                    <label class="form-label fw-semibold">Mật khẩu</label>
                    <div class="input-group">
                      <span class="input-group-text"><i class="bi bi-lock"></i></span>
                      <input v-model="password" :type="showPwd ? 'text' : 'password'" class="form-control" placeholder="Nhập mật khẩu" required />
                      <button type="button" class="btn btn-outline-secondary" @click="showPwd = !showPwd">
                        <i :class="showPwd ? 'bi-eye-slash' : 'bi-eye'" class="bi"></i>
                      </button>
                    </div>
                  </div>

                  <button type="submit" class="btn btn-primary w-100 py-2 fw-semibold">
                    <i class="bi bi-box-arrow-in-right me-2"></i>Đăng nhập
                  </button>
                </form>

                <!-- Tài khoản demo -->
                <div class="mt-4 pt-3 border-top">
                  <p class="text-muted small text-center mb-2">Tài khoản demo (click để điền nhanh):</p>
                  <div class="row g-1">
                    <div v-for="acc in demoAccounts" :key="acc.username" class="col-6">
                      <button class="btn btn-outline-secondary btn-sm w-100 text-start" @click="fillDemo(acc)">
                        <i :class="acc.icon + ' me-1'"></i>{{ acc.label }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- ═══ FORM ĐĂNG KÝ ════════════════════════════════════════════ -->
              <div v-if="mode === 'register'">
                <div v-if="regError" class="alert alert-danger py-2">
                  <i class="bi bi-exclamation-triangle me-2"></i>{{ regError }}
                </div>
                <div v-if="regSuccess" class="alert alert-success py-2">
                  <i class="bi bi-check-circle me-2"></i>{{ regSuccess }}
                </div>

                <form @submit.prevent="handleRegister">

                  <!-- Họ tên -->
                  <div class="mb-3">
                    <label class="form-label fw-semibold">Họ và tên</label>
                    <div class="input-group">
                      <span class="input-group-text"><i class="bi bi-person-badge"></i></span>
                      <input v-model="regForm.name" type="text" class="form-control" placeholder="Nhập họ và tên" required />
                    </div>
                  </div>

                  <!-- Vai trò -->
                  <div class="mb-3">
                    <label class="form-label fw-semibold">Vai trò</label>
                    <div class="input-group">
                      <span class="input-group-text"><i class="bi bi-shield-lock"></i></span>
                      <select v-model="regForm.role" class="form-select">
                        <option v-for="r in registerRoleOptions" :key="r.value" :value="r.value">
                          {{ r.label }}
                        </option>
                      </select>
                    </div>
                  </div>

                  <!-- Username -->
                  <div class="mb-3">
                    <label class="form-label fw-semibold">Tên đăng nhập</label>
                    <div class="input-group">
                      <span class="input-group-text"><i class="bi bi-person"></i></span>
                      <input v-model="regForm.username" type="text" class="form-control" placeholder="Tạo tên đăng nhập" required />
                    </div>
                  </div>

                  <!-- Password -->
                  <div class="mb-3">
                    <label class="form-label fw-semibold">Mật khẩu</label>
                    <div class="input-group">
                      <span class="input-group-text"><i class="bi bi-lock"></i></span>
                      <input v-model="regForm.password" :type="showRegPwd ? 'text' : 'password'" class="form-control" placeholder="Tạo mật khẩu (tối thiểu 6 ký tự)" required />
                      <button type="button" class="btn btn-outline-secondary" @click="showRegPwd = !showRegPwd">
                        <i :class="showRegPwd ? 'bi-eye-slash' : 'bi-eye'" class="bi"></i>
                      </button>
                    </div>
                  </div>

                  <!-- Số điện thoại -->
                  <div class="mb-4">
                    <label class="form-label fw-semibold">Số điện thoại</label>
                    <div class="input-group">
                      <span class="input-group-text"><i class="bi bi-telephone"></i></span>
                      <input v-model="regForm.phone" type="tel" class="form-control" placeholder="Số điện thoại liên lạc" />
                    </div>
                  </div>

                  <button type="submit" class="btn btn-success w-100 py-2 fw-semibold">
                    <i class="bi bi-person-plus me-2"></i>Tạo tài khoản
                  </button>
                </form>

                <div class="text-center mt-3">
                  <button class="btn btn-link btn-sm text-muted" @click="switchMode('login')">
                    Đã có tài khoản? Đăng nhập ngay
                  </button>
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
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { login, store, addUser } from '../store/index.js'
import { roleRoutes } from '../router/index.js'

const router = useRouter()

// Mode: 'login' | 'register'
const mode = ref('login')

// ─── Đăng nhập ───────────────────────────────────────────────────────────────
const loginRole = ref('')          // Vai trò được chọn trong dropdown
const username  = ref('')
const password  = ref('')
const error     = ref('')
const showPwd   = ref(false)

// Tất cả vai trò trong hệ thống
const roleOptions = [
  { value: 'admin',       label: '🛡️ Admin — Quản trị hệ thống'    },
  { value: 'citizen',     label: '👤 Customer — Người dân'          },
  { value: 'coordinator', label: '📋 Điều phối viên'                },
  { value: 'manager',     label: '📦 Quản lý kho'                   },
  { value: 'rescue_team', label: '🚒 Đội cứu hộ'                   },
]

// Vai trò có thể tự đăng ký (không cho phép tự tạo tài khoản Admin)
const registerRoleOptions = [
  { value: 'citizen',     label: '👤 Customer — Người dân'          },
  { value: 'coordinator', label: '📋 Điều phối viên'                },
  { value: 'manager',     label: '📦 Quản lý kho'                   },
  { value: 'rescue_team', label: '🚒 Đội cứu hộ'                   },
]

const demoAccounts = [
  { username: 'citizen1', password: '123456',   role: 'citizen',     label: 'Người dân',      icon: 'bi bi-person'      },
  { username: 'team1',    password: '123456',   role: 'rescue_team', label: 'Đội cứu hộ',     icon: 'bi bi-people'      },
  { username: 'coord1',   password: '123456',   role: 'coordinator', label: 'Điều phối viên', icon: 'bi bi-diagram-3'   },
  { username: 'manager1', password: '123456',   role: 'manager',     label: 'Quản lý kho',    icon: 'bi bi-box-seam'    },
  { username: 'admin',    password: 'admin123', role: 'admin',       label: 'Admin',          icon: 'bi bi-shield-lock' },
]

function fillDemo(acc) {
  username.value  = acc.username
  password.value  = acc.password
  loginRole.value = acc.role
}

function handleLogin() {
  error.value = ''
  if (!loginRole.value) { error.value = 'Vui lòng chọn vai trò trước khi đăng nhập!'; return }

  const user = login(username.value, password.value)
  if (!user) { error.value = 'Tên đăng nhập hoặc mật khẩu không đúng!'; return }

  // Xác nhận vai trò đã chọn khớp với vai trò thực của tài khoản
  if (user.role !== loginRole.value) {
    error.value = `Tài khoản này không thuộc vai trò đã chọn. Vai trò thực: ${roleOptions.find(r => r.value === user.role)?.label || user.role}`
    // Đăng xuất ngay vì login() đã lưu user
    store.currentUser = null
    return
  }

  router.push(roleRoutes[user.role] || '/login')
}

// ─── Đăng ký ─────────────────────────────────────────────────────────────────
const regForm = reactive({
  name: '', username: '', password: '', phone: '', role: 'citizen',
})
const regError   = ref('')
const regSuccess = ref('')
const showRegPwd = ref(false)

function handleRegister() {
  regError.value   = ''
  regSuccess.value = ''

  if (!regForm.name.trim())     { regError.value = 'Vui lòng nhập họ và tên!'; return }
  if (!regForm.username.trim()) { regError.value = 'Vui lòng nhập tên đăng nhập!'; return }
  if (regForm.password.length < 6) { regError.value = 'Mật khẩu phải có ít nhất 6 ký tự!'; return }

  // Kiểm tra trùng username
  const exists = store.users.find(u => u.username === regForm.username.trim())
  if (exists) { regError.value = 'Tên đăng nhập đã tồn tại, vui lòng chọn tên khác!'; return }

  addUser({
    name:     regForm.name.trim(),
    username: regForm.username.trim(),
    password: regForm.password,
    role:     regForm.role,
    phone:    regForm.phone.trim(),
  })

  regSuccess.value = 'Tạo tài khoản thành công! Bạn có thể đăng nhập ngay.'
  Object.assign(regForm, { name: '', username: '', password: '', phone: '', role: 'citizen' })
}

function switchMode(m) {
  mode.value       = m
  error.value      = ''
  regError.value   = ''
  regSuccess.value = ''
}
</script>

<style scoped>
.bg-login {
  background: linear-gradient(135deg, #1a6fc4 0%, #0d47a1 50%, #1565c0 100%);
}
</style>
