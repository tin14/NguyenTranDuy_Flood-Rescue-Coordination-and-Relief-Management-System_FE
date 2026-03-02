<template>
  <div>
    <NavBar :user="store.currentUser" @logout="handleLogout" />

    <div class="container-fluid py-4 px-4">

      <!-- ═══ Dashboard: 4 thẻ thống kê tổng quan ══════════════════════════════ -->
      <div class="row g-3 mb-4">
        <!-- v-for render 4 thẻ từ mảng stats (computed bên dưới) -->
        <div class="col-md-3" v-for="stat in stats" :key="stat.label">
          <div class="card border-0 shadow-sm">
            <div class="card-body d-flex align-items-center gap-3">
              <!-- :class binding động — icon và màu lấy từ object stat -->
              <i :class="stat.icon + ' fs-1 ' + stat.color"></i>
              <div>
                <div class="fs-2 fw-bold" :class="stat.color">{{ stat.value }}</div>
                <div class="text-muted small">{{ stat.label }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="row g-4">

        <!-- ═══ Bảng danh sách yêu cầu (cột trái 7/12) ═══════════════════════ -->
        <div class="col-xl-7">
          <div class="card border-0 shadow-sm">
            <div class="card-header d-flex justify-content-between align-items-center bg-white">
              <span class="fw-semibold"><i class="bi bi-list-task me-2 text-primary"></i>Danh Sách Yêu Cầu Cứu Hộ</span>

              <!-- Bộ lọc trạng thái và mức độ khẩn cấp -->
              <div class="d-flex gap-2">
                <!-- v-model="filterStatus" — khi thay đổi, filteredRequests tự tính lại -->
                <select v-model="filterStatus" class="form-select form-select-sm" style="width:auto">
                  <option value="">Tất cả trạng thái</option>
                  <option value="pending">Chờ xác minh</option>
                  <option value="verified">Đã xác minh</option>
                  <option value="assigned">Đã phân công</option>
                  <option value="in_progress">Đang xử lý</option>
                  <option value="completed">Hoàn thành</option>
                </select>
                <select v-model="filterUrgency" class="form-select form-select-sm" style="width:auto">
                  <option value="">Tất cả mức độ</option>
                  <option value="critical">Khẩn cấp</option>
                  <option value="high">Cao</option>
                  <option value="medium">Trung bình</option>
                  <option value="low">Thấp</option>
                </select>
              </div>
            </div>

            <div class="card-body p-0">
              <div class="table-responsive">
                <table class="table table-hover mb-0">
                  <thead class="table-light">
                    <tr>
                      <th>#</th>
                      <th>Người yêu cầu</th>
                      <th>Địa điểm</th>
                      <th>Mức độ</th>
                      <th>Trạng thái</th>
                      <th>Thời gian</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    <!-- filteredRequests đã được lọc + sắp xếp theo urgency -->
                    <!-- :class="{ 'table-danger': ... }" — tô đỏ hàng critical+pending -->
                    <tr v-for="req in filteredRequests" :key="req.id"
                        :class="{ 'table-danger': req.urgency === 'critical' && req.status === 'pending' }">
                      <td>{{ req.id }}</td>
                      <td class="small">{{ req.citizenName }}</td>
                      <!-- style cắt bớt text dài — overflow hidden + ellipsis -->
                      <td class="small" style="max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ req.location }}</td>
                      <td><StatusBadge :status="req.urgency" type="urgency" /></td>
                      <td><StatusBadge :status="req.status" /></td>
                      <td class="small">{{ formatDate(req.createdAt) }}</td>
                      <td>
                        <!-- Nút mắt — click mở panel chi tiết bên phải -->
                        <button class="btn btn-sm btn-outline-primary" @click="selectRequest(req)">
                          <i class="bi bi-eye"></i>
                        </button>
                      </td>
                    </tr>
                    <!-- Hàng thông báo khi không có kết quả nào khớp filter -->
                    <tr v-if="filteredRequests.length === 0">
                      <td colspan="7" class="text-center text-muted py-3">Không có yêu cầu nào</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- ═══ Panel chi tiết + thao tác điều phối (cột phải 5/12) ═══════════ -->
        <div class="col-xl-5">

          <!-- Placeholder khi chưa chọn yêu cầu nào -->
          <div v-if="!selectedRequest" class="card border-0 shadow-sm h-100 d-flex align-items-center justify-content-center">
            <div class="text-center text-muted py-5">
              <i class="bi bi-hand-index fs-1 d-block mb-2"></i>
              Chọn yêu cầu để xem chi tiết và thực hiện thao tác
            </div>
          </div>

          <!-- Panel chi tiết yêu cầu được chọn -->
          <div v-else class="card border-0 shadow-sm">
            <div class="card-header fw-semibold d-flex justify-content-between">
              <span><i class="bi bi-file-text me-2 text-primary"></i>Yêu cầu #{{ selectedRequest.id }}</span>
              <button class="btn-close" @click="selectedRequest = null"></button>
            </div>
            <div class="card-body">

              <!-- Badges mức độ và trạng thái -->
              <div class="mb-3 d-flex gap-2">
                <StatusBadge :status="selectedRequest.urgency" type="urgency" class="fs-6" />
                <StatusBadge :status="selectedRequest.status" class="fs-6" />
              </div>

              <!-- Thông tin yêu cầu -->
              <div class="mb-2 small"><i class="bi bi-person text-primary me-2"></i><strong>Người yêu cầu:</strong> {{ selectedRequest.citizenName }}</div>
              <div class="mb-2 small"><i class="bi bi-geo-alt text-danger me-2"></i><strong>Địa điểm:</strong> {{ selectedRequest.location }}</div>
              <div class="mb-2 small"><i class="bi bi-clock text-muted me-2"></i><strong>Thời gian:</strong> {{ formatDate(selectedRequest.createdAt) }}</div>
              <div class="mb-3 small">
                <i class="bi bi-chat-text text-secondary me-2"></i><strong>Mô tả:</strong>
                <p class="text-muted mt-1 mb-0">{{ selectedRequest.description }}</p>
              </div>

              <!-- Alert đội đang phụ trách — chỉ hiện khi đã phân công -->
              <div v-if="selectedRequest.assignedTeamName" class="alert alert-primary py-2 small">
                <i class="bi bi-people-fill me-1"></i>Đã phân công: <strong>{{ selectedRequest.assignedTeamName }}</strong>
              </div>

              <!-- Alert ghi chú xác minh -->
              <div v-if="selectedRequest.notes" class="alert alert-info py-2 small">
                <i class="bi bi-info-circle me-1"></i>{{ selectedRequest.notes }}
              </div>

              <!-- ─── Khu vực thao tác điều phối ─────────────────────────────── -->
              <div class="border-top pt-3 mt-2">
                <div class="fw-semibold mb-2">Thao tác điều phối</div>

                <!-- [1] XÁC MINH — chỉ hiện khi status = 'pending' -->
                <div v-if="selectedRequest.status === 'pending'" class="mb-3">
                  <label class="form-label small">Xác minh và phân loại mức độ</label>
                  <!-- Dropdown thay đổi urgency khi xác minh -->
                  <select v-model="actionForm.urgency" class="form-select form-select-sm mb-2">
                    <option value="critical">🔴 Khẩn cấp</option>
                    <option value="high">🟠 Cao</option>
                    <option value="medium">🟡 Trung bình</option>
                    <option value="low">🟢 Thấp</option>
                  </select>
                  <input v-model="actionForm.notes" class="form-control form-control-sm mb-2" placeholder="Ghi chú xác minh..." />
                  <!-- Click gọi verifyRequest() → status chuyển thành 'verified' -->
                  <button class="btn btn-info btn-sm w-100" @click="verifyRequest">
                    <i class="bi bi-check2 me-1"></i>Xác minh yêu cầu
                  </button>
                </div>

                <!-- [2] PHÂN CÔNG ĐỘI — hiện khi status là 'pending' hoặc 'verified' -->
                <!-- Coordinator có thể phân công thẳng không cần xác minh trước -->
                <div v-if="['verified', 'pending'].includes(selectedRequest.status)" class="mb-3">
                  <label class="form-label small">Phân công đội cứu hộ</label>
                  <select v-model="actionForm.teamId" class="form-select form-select-sm mb-2">
                    <option value="">-- Chọn đội cứu hộ --</option>
                    <!-- Liệt kê tất cả đội, hiển thị trạng thái và phương tiện -->
                    <option v-for="team in store.teams" :key="team.id" :value="team.id">
                      {{ team.name }} ({{ team.status === 'available' ? '✅ Sẵn sàng' : '🔄 Đang bận' }}) - {{ team.vehicles.join(', ') }}
                    </option>
                  </select>
                  <!-- :disabled="!actionForm.teamId" — vô hiệu nút nếu chưa chọn đội -->
                  <button class="btn btn-primary btn-sm w-100" :disabled="!actionForm.teamId" @click="assignTeam">
                    <i class="bi bi-send me-1"></i>Phân công
                  </button>
                </div>

                <!-- [3] HỦY YÊU CẦU — hiện với mọi trạng thái trừ completed và cancelled -->
                <div v-if="!['completed', 'cancelled'].includes(selectedRequest.status)">
                  <button class="btn btn-outline-danger btn-sm w-100" @click="cancelRequest">
                    <i class="bi bi-x-circle me-1"></i>Hủy yêu cầu
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
// reactive() cho object (không cần .value) | ref() cho giá trị đơn giản
import { ref, computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import NavBar from '../components/NavBar.vue'
import StatusBadge from '../components/StatusBadge.vue'
import { store, logout, updateRequestStatus } from '../store/index.js'

const router = useRouter()

// Yêu cầu đang được chọn để xem chi tiết
const selectedRequest = ref(null)

// Bộ lọc — khi thay đổi, filteredRequests tự tính lại
const filterStatus  = ref('') // Rỗng = hiện tất cả
const filterUrgency = ref('')

// Form thao tác điều phối — reactive() để không cần .value khi truy cập
const actionForm = reactive({
  urgency: 'high', // Mức độ khẩn cấp mặc định khi xác minh
  notes: '',       // Ghi chú xác minh
  teamId: '',      // ID đội cứu hộ được chọn để phân công
})

// 4 thẻ thống kê tổng quan trên dashboard
const stats = computed(() => [
  { label: 'Tổng yêu cầu', value: store.rescueRequests.length,                                                                    icon: 'bi bi-clipboard-data', color: 'text-primary' },
  { label: 'Chờ xử lý',    value: store.rescueRequests.filter(r => r.status === 'pending').length,                                icon: 'bi bi-hourglass-split', color: 'text-warning' },
  { label: 'Đang xử lý',   value: store.rescueRequests.filter(r => ['assigned','in_progress'].includes(r.status)).length,         icon: 'bi bi-truck',           color: 'text-info'    },
  { label: 'Hoàn thành',   value: store.rescueRequests.filter(r => r.status === 'completed').length,                              icon: 'bi bi-check-circle',    color: 'text-success' },
])

// Danh sách yêu cầu đã lọc theo filterStatus và filterUrgency
// Sắp xếp: critical trước, rồi theo thời gian mới nhất
const filteredRequests = computed(() => {
  return store.rescueRequests
    .filter(r =>
      (!filterStatus.value  || r.status  === filterStatus.value) &&  // Lọc theo status nếu có
      (!filterUrgency.value || r.urgency === filterUrgency.value)     // Lọc theo urgency nếu có
    )
    .sort((a, b) => {
      const urgOrder = { critical: 0, high: 1, medium: 2, low: 3 }
      const uo = (urgOrder[a.urgency] || 9) - (urgOrder[b.urgency] || 9) // So sánh urgency
      if (uo !== 0) return uo                     // Nếu khác urgency → sort theo urgency
      return new Date(b.createdAt) - new Date(a.createdAt) // Cùng urgency → mới nhất lên đầu
    })
})

// Khi click vào hàng trong bảng — chọn yêu cầu và điền form actionForm
function selectRequest(req) {
  selectedRequest.value  = req
  actionForm.urgency     = req.urgency           // Pre-fill urgency hiện tại
  actionForm.notes       = req.notes || ''        // Pre-fill ghi chú hiện tại
  actionForm.teamId      = req.assignedTeamId || '' // Pre-fill đội (nếu đã phân công)
}

// Xác minh yêu cầu: cập nhật status → 'verified' và lưu ghi chú
// LƯU Ý BUG: req.urgency được cập nhật sau saveState() → không persist khi reload
function verifyRequest() {
  const req = selectedRequest.value
  updateRequestStatus(req.id, 'verified', actionForm.notes) // Lưu status + notes vào store+localStorage
  req.urgency = actionForm.urgency  // Cập nhật urgency trong bộ nhớ (chưa được lưu vào localStorage)
  req.notes   = actionForm.notes
  // Làm mới selectedRequest từ store
  selectedRequest.value = store.rescueRequests.find(r => r.id === req.id)
}

// Phân công đội cứu hộ cho yêu cầu được chọn
function assignTeam() {
  // Number() chuyển teamId từ string sang số để khớp với team.id (kiểu number)
  const team = store.teams.find(t => t.id === Number(actionForm.teamId))
  if (team) {
    // Cập nhật: status → 'assigned', ghi chú, teamId, teamName
    updateRequestStatus(selectedRequest.value.id, 'assigned', actionForm.notes, team.id, team.name)
    selectedRequest.value = store.rescueRequests.find(r => r.id === selectedRequest.value.id)
  }
}

// Hủy yêu cầu — tự động thêm ghi chú lý do
function cancelRequest() {
  updateRequestStatus(selectedRequest.value.id, 'cancelled', 'Đã hủy bởi điều phối viên')
  selectedRequest.value = store.rescueRequests.find(r => r.id === selectedRequest.value.id)
}

function handleLogout() {
  logout()
  router.push('/login')
}

function formatDate(dt) {
  return new Date(dt).toLocaleString('vi-VN')
}
</script>
