<template>
  <div>
    <!-- NavBar nhận prop user và lắng nghe sự kiện logout -->
    <NavBar :user="store.currentUser" @logout="handleLogout" />

    <div class="container py-4">

      <!-- Header -->
      <div class="mb-4">
        <h5 class="fw-semibold mb-0"><i class="bi bi-shield-lock text-primary me-2"></i>Quản Lý Người Dùng & Phân Quyền</h5>
      </div>

      <!-- ═══ Thống kê số lượng user theo từng role ═══════════════════════════ -->
      <!-- roleStats là computed trả về mảng 5 phần tử, mỗi phần tử là 1 role -->
      <div class="row g-3 mb-4">
        <!-- v-for lặp qua mảng roleStats, :key="s.role" giúp Vue nhận diện từng phần tử -->
        <div class="col-md-3" v-for="s in roleStats" :key="s.role">
          <div class="card border-0 shadow-sm text-center">
            <div class="card-body">
              <!-- :class binding nối động icon + size + màu từ object s -->
              <i :class="s.icon + ' fs-2 mb-1 ' + s.color"></i>
              <!-- Số lượng user của role này -->
              <div class="fs-3 fw-bold" :class="s.color">{{ s.count }}</div>
              <!-- Tên tiếng Việt của role -->
              <div class="text-muted small">{{ s.label }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══ Bộ lọc: theo role + tìm kiếm theo tên/username ══════════════════ -->
      <div class="d-flex gap-2 mb-3">
        <!-- Dropdown lọc role — v-model="filterRole", rỗng = hiện tất cả -->
        <select v-model="filterRole" class="form-select form-select-sm" style="width:auto">
          <option value="">Tất cả vai trò</option>
          <option value="citizen">Người dân</option>
          <option value="rescue_team">Đội cứu hộ</option>
          <option value="coordinator">Điều phối viên</option>
          <option value="manager">Quản lý</option>
          <option value="admin">Admin</option>
        </select>
        <!-- Ô tìm kiếm — tìm theo tên hoặc username, không phân biệt hoa thường -->
        <input v-model="search" class="form-control form-control-sm" style="width:220px" placeholder="Tìm theo tên hoặc username..." />
      </div>

      <!-- ═══ Bảng danh sách người dùng ════════════════════════════════════════ -->
      <div class="card border-0 shadow-sm">
        <div class="table-responsive">
          <table class="table table-hover mb-0">
            <thead class="table-light">
              <tr>
                <th>#</th>
                <th>Họ tên</th>
                <th>Tên đăng nhập</th>
                <th>Vai trò</th>
                <th>Số điện thoại</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              <!-- filteredUsers: đã lọc theo filterRole và search -->
              <tr v-for="user in filteredUsers" :key="user.id">
                <td>{{ user.id }}</td>
                <td class="fw-semibold">{{ user.name }}</td>
                <!-- <code> tag hiển thị username dạng monospace font -->
                <td><code>{{ user.username }}</code></td>
                <td>
                  <!-- Badge màu theo role — class và icon lấy từ roleInfo -->
                  <span class="badge" :class="roleBadge(user.role)">
                    <!-- roleIcon() trả về chuỗi class icon Bootstrap Icons -->
                    <i :class="roleIcon(user.role) + ' me-1'"></i>{{ roleName(user.role) }}
                  </span>
                </td>
                <td>{{ user.phone }}</td>
                <td>
                  <!-- Badge trạng thái: xanh lá nếu active, xám nếu bị khóa -->
                  <!-- Ternary operator: user.active ? ... : ... -->
                  <span class="badge" :class="user.active ? 'bg-success' : 'bg-secondary'">
                    {{ user.active ? 'Hoạt động' : 'Đã khóa' }}
                  </span>
                </td>
                <td>
                  <div class="d-flex gap-1">
                    <!-- Nút Sửa — mở modal Edit User với dữ liệu pre-filled -->
                    <button class="btn btn-sm btn-outline-primary" @click="startEdit(user)" title="Sửa">
                      <i class="bi bi-pencil"></i>
                    </button>

                    <!-- Nút Khóa/Mở khóa — KHÔNG hiện cho chính admin đang dùng -->
                    <!-- user.id !== store.currentUser.id: ẩn nút với tài khoản của mình -->
                    <button v-if="user.id !== store.currentUser.id"
                      class="btn btn-sm"
                      :class="user.active ? 'btn-outline-warning' : 'btn-outline-success'"
                      @click="toggleUser(user)"
                      :title="user.active ? 'Khóa' : 'Mở khóa'">
                      <!-- Icon ổ khóa thay đổi theo trạng thái: lock nếu đang active (để khóa), unlock nếu đã khóa (để mở) -->
                      <i :class="user.active ? 'bi bi-lock' : 'bi bi-unlock'"></i>
                    </button>
                  </div>
                </td>
              </tr>

              <!-- Hàng thông báo khi không tìm thấy kết quả -->
              <tr v-if="filteredUsers.length === 0">
                <td colspan="7" class="text-center text-muted py-3">Không tìm thấy người dùng</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ══════════════════════════════════════════════════════════════════════════ -->
      <!-- MODAL: CHỈNH SỬA NGƯỜI DÙNG                                             -->
      <!-- ══════════════════════════════════════════════════════════════════════════ -->
      <div v-if="showEditUser" class="modal-overlay" @click.self="showEditUser = false">
        <div class="card shadow-lg" style="width:440px">
          <div class="card-header fw-semibold"><i class="bi bi-pencil me-2"></i>Chỉnh Sửa Người Dùng</div>
          <div class="card-body">

            <!-- Họ tên -->
            <div class="mb-3">
              <label class="form-label small">Họ tên</label>
              <input v-model="editForm.name" class="form-control form-control-sm" />
            </div>

            <!-- Role và SĐT -->
            <div class="row g-2 mb-3">
              <div class="col">
                <label class="form-label small">Vai trò</label>
                <!-- :disabled ngăn admin tự đổi role của chính mình -->
                <!-- editForm.id === store.currentUser.id: true nếu đang sửa tài khoản của mình -->
                <select v-model="editForm.role" class="form-select form-select-sm" :disabled="editForm.id === store.currentUser.id">
                  <option value="citizen">Người dân</option>
                  <option value="rescue_team">Đội cứu hộ</option>
                  <option value="coordinator">Điều phối viên</option>
                  <option value="manager">Quản lý</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div class="col">
                <label class="form-label small">Số điện thoại</label>
                <input v-model="editForm.phone" class="form-control form-control-sm" />
              </div>
            </div>

            <div class="d-flex gap-2">
              <!-- doEditUser() gọi updateUser từ store -->
              <button class="btn btn-primary btn-sm flex-fill" @click="doEditUser">Lưu</button>
              <button class="btn btn-secondary btn-sm" @click="showEditUser = false">Hủy</button>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
// ref(): biến reactive đơn lẻ cần .value | computed(): tính toán tự động khi dependencies thay đổi
// reactive(): object reactive, truy cập trực tiếp không cần .value
import { ref, computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import NavBar from '../components/NavBar.vue'
// Nhập store (đọc dữ liệu) và các hàm CRUD từ module store trung tâm
import { store, logout, updateUser } from '../store/index.js'

const router = useRouter()

// Bộ lọc tìm kiếm
const filterRole = ref('') // Role đang lọc — rỗng = hiện tất cả
const search     = ref('') // Text tìm kiếm

// Cờ hiển thị modal
const showEditUser = ref(false)

// Form sửa user (được pre-filled từ startEdit())
// id: null ban đầu, sẽ được gán khi chọn user để sửa
const editForm = reactive({ id: null, name: '', role: '', phone: '' })

// Cấu hình badge cho từng role — badge class Bootstrap, icon Bootstrap Icons
// Dùng làm lookup table: roleInfo['admin'] → { label, badge, icon }
const roleInfo = {
  citizen:      { label: 'Người dân',       badge: 'bg-secondary',         icon: 'bi bi-person'      },
  rescue_team:  { label: 'Đội cứu hộ',      badge: 'bg-primary',           icon: 'bi bi-people'      },
  coordinator:  { label: 'Điều phối viên',  badge: 'bg-info text-dark',    icon: 'bi bi-diagram-3'   },
  manager:      { label: 'Quản lý',         badge: 'bg-warning text-dark', icon: 'bi bi-box-seam'    },
  admin:        { label: 'Admin',           badge: 'bg-danger',            icon: 'bi bi-shield-lock' },
}

// computed: mảng 5 phần tử cho 5 thẻ thống kê theo role
// Object.entries(roleInfo) → [['citizen', {...}], ['rescue_team', {...}], ...]
// .map() biến đổi mỗi entry thành object có thêm count và color
const roleStats = computed(() =>
  Object.entries(roleInfo).map(([role, info]) => ({
    role,                  // key của roleInfo (vd: 'admin')
    label: info.label,     // Tên tiếng Việt
    icon:  info.icon,      // Class icon Bootstrap Icons
    // Tính màu text từ badge class (ví dụ 'bg-primary' → 'text-primary')
    // includes() kiểm tra chuỗi badge có chứa từ khóa màu không
    color: 'text-' + (
      info.badge.includes('primary') ? 'primary' :
      info.badge.includes('success') ? 'success' :
      info.badge.includes('warning') ? 'warning' :
      info.badge.includes('info')    ? 'info'    :
      info.badge.includes('danger')  ? 'danger'  : 'secondary'
    ),
    // Đếm số user có role này — filter() lọc rồi đọc .length
    count: store.users.filter(u => u.role === role).length,
  }))
)

// computed: lọc danh sách user theo filterRole và search
// Tự động tính lại khi filterRole.value, search.value hoặc store.users thay đổi
const filteredUsers = computed(() => {
  const q = search.value.toLowerCase() // Chuyển lowercase để so sánh không phân biệt hoa thường
  return store.users.filter(u =>
    (!filterRole.value || u.role === filterRole.value) &&       // Lọc theo role nếu có chọn
    (!q || u.name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q)) // Tìm kiếm trong name hoặc username
  )
})

// Helper functions lấy thông tin từ roleInfo
// Optional chaining (?.) và fallback (|| ...) đề phòng trường hợp role không tồn tại
const roleName  = r => roleInfo[r]?.label  || r              // Tên tiếng Việt, fallback = role key
const roleBadge = r => roleInfo[r]?.badge  || 'bg-secondary' // Class badge Bootstrap
const roleIcon  = r => roleInfo[r]?.icon   || 'bi bi-person' // Icon class

// Mở modal Sửa và pre-fill dữ liệu của user được chọn
// Object.assign(target, source) — copy các thuộc tính từ source vào target
function startEdit(user) {
  Object.assign(editForm, { id: user.id, name: user.name, role: user.role, phone: user.phone })
  showEditUser.value = true // Hiện modal
}

// Lưu thay đổi thông tin user
function doEditUser() {
  // Chỉ cập nhật name, role, phone — không thay đổi username và password ở đây
  updateUser(editForm.id, { name: editForm.name, role: editForm.role, phone: editForm.phone })
  showEditUser.value = false // Đóng modal
}

// Toggle trạng thái active của user (khóa ↔ mở khóa)
// !user.active đảo ngược boolean: true → false, false → true
function toggleUser(user) {
  updateUser(user.id, { active: !user.active })
}

// Xử lý đăng xuất: xóa session trong store rồi về trang login
function handleLogout() {
  logout()
  router.push('/login')
}
</script>

<style scoped>
/* Overlay nền tối dùng chung cho cả 2 modal */
/* position:fixed + inset:0 → che phủ toàn bộ màn hình */
.modal-overlay {
  position: fixed;
  inset: 0;                      /* top:0 right:0 bottom:0 left:0 — shorthand CSS */
  background: rgba(0,0,0,0.4);  /* Nền đen, độ trong suốt 40% */
  display: flex;
  align-items: center;           /* Căn giữa theo chiều dọc */
  justify-content: center;       /* Căn giữa theo chiều ngang */
  z-index: 1050;                 /* Cao hơn navbar Bootstrap (z-index: 1030) */
}
</style>
