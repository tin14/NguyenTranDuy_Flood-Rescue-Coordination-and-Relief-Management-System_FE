<template>
  <div>
    <NavBar :user="store.currentUser" @logout="handleLogout" />

    <div class="container py-4">

      <!-- ═══ Banner thông tin đội cứu hộ ═══════════════════════════════════════ -->
      <!-- Hiển thị tên, trạng thái (sẵn sàng/đang bận) và phương tiện của đội -->
      <div class="alert alert-primary d-flex align-items-center gap-3 shadow-sm">
        <i class="bi bi-people-fill fs-2"></i>
        <div>
          <strong>{{ store.currentUser?.name }}</strong>
          <span class="ms-3">
            Trạng thái:
            <!-- Màu xanh lá nếu sẵn sàng, vàng nếu đang bận — dùng ternary operator -->
            <span :class="myTeam?.status === 'available' ? 'text-success fw-bold' : 'text-warning fw-bold'">
              {{ myTeam?.status === 'available' ? '✅ Sẵn sàng' : '🔄 Đang thực hiện nhiệm vụ' }}
            </span>
          </span>
          <!-- Hiện danh sách phương tiện nếu có — join bằng dấu phẩy -->
          <span v-if="myTeam?.vehicles?.length" class="ms-3">
            <i class="bi bi-truck me-1"></i>{{ myTeam.vehicles.join(', ') }}
          </span>
        </div>
      </div>

      <div class="row g-4">

        <!-- ═══ Danh sách nhiệm vụ hiện tại (cột trái) ════════════════════════ -->
        <div class="col-lg-6">
          <div class="card border-0 shadow-sm">
            <div class="card-header bg-primary text-white fw-semibold">
              <i class="bi bi-clipboard-check me-2"></i>Danh Sách Nhiệm Vụ
            </div>
            <div class="card-body p-0">

              <!-- State rỗng — không có nhiệm vụ nào đang active -->
              <div v-if="myTasks.length === 0" class="text-center text-muted py-5">
                <i class="bi bi-inbox fs-1 d-block mb-2"></i>Không có nhiệm vụ nào
              </div>

              <div v-else class="list-group list-group-flush">
                <!-- Mỗi nhiệm vụ: click để chọn và hiện chi tiết ở cột phải -->
                <!-- :class binding thêm viền đỏ bên trái nếu mức độ khẩn cấp = critical -->
                <div
                  v-for="task in myTasks"
                  :key="task.id"
                  class="list-group-item list-group-item-action p-3"
                  :class="{ 'border-start border-4 border-danger': task.urgency === 'critical' }"
                  @click="selectedTask = task"
                  style="cursor:pointer"
                >
                  <!-- Hàng badge + ID -->
                  <div class="d-flex justify-content-between mb-1">
                    <div>
                      <StatusBadge :status="task.status" class="me-1" />
                      <StatusBadge :status="task.urgency" type="urgency" />
                    </div>
                    <small class="text-muted">#{{ task.id }}</small>
                  </div>
                  <!-- Tên người cần cứu hộ -->
                  <div class="fw-semibold small mb-1">{{ task.citizenName }}</div>
                  <!-- Địa điểm -->
                  <div class="d-flex gap-1 text-muted small">
                    <i class="bi bi-geo-alt-fill text-danger"></i>{{ task.location }}
                  </div>
                  <!-- Mô tả — text-truncate cắt bớt nếu quá dài -->
                  <div class="text-muted small mt-1 text-truncate">{{ task.description }}</div>
                </div>
              </div>

            </div>
          </div>
        </div>

        <!-- ═══ Chi tiết nhiệm vụ được chọn + cập nhật trạng thái (cột phải) ═══ -->
        <div class="col-lg-6">

          <!-- Placeholder khi chưa chọn nhiệm vụ nào -->
          <div v-if="!selectedTask" class="card border-0 shadow-sm h-100 d-flex align-items-center justify-content-center text-muted">
            <div class="text-center py-5">
              <i class="bi bi-hand-index fs-1 d-block mb-2"></i>
              Chọn một nhiệm vụ để xem chi tiết
            </div>
          </div>

          <!-- Panel chi tiết — hiện khi đã chọn nhiệm vụ -->
          <div v-else class="card border-0 shadow-sm">
            <div class="card-header fw-semibold d-flex justify-content-between align-items-center">
              <span><i class="bi bi-info-circle me-2 text-primary"></i>Chi Tiết Nhiệm Vụ #{{ selectedTask.id }}</span>
              <!-- Nút X để bỏ chọn nhiệm vụ -->
              <button class="btn-close" @click="selectedTask = null"></button>
            </div>
            <div class="card-body">

              <!-- Badges trạng thái và mức độ -->
              <div class="mb-3">
                <StatusBadge :status="selectedTask.urgency" type="urgency" class="me-2 fs-6" />
                <StatusBadge :status="selectedTask.status" class="fs-6" />
              </div>

              <!-- Thông tin chi tiết -->
              <div class="mb-2"><i class="bi bi-person me-2 text-primary"></i><strong>Người yêu cầu:</strong> {{ selectedTask.citizenName }}</div>
              <div class="mb-2"><i class="bi bi-geo-alt me-2 text-danger"></i><strong>Địa điểm:</strong> {{ selectedTask.location }}</div>
              <div class="mb-2"><i class="bi bi-clock me-2 text-muted"></i><strong>Thời gian:</strong> {{ formatDate(selectedTask.createdAt) }}</div>
              <div class="mb-3">
                <i class="bi bi-chat-text me-2 text-secondary"></i><strong>Mô tả:</strong>
                <p class="text-muted small mt-1 mb-0">{{ selectedTask.description }}</p>
              </div>

              <!-- Khối GPS / bản đồ -->
              <div class="bg-light rounded-3 p-3 mb-3 text-center">
                <i class="bi bi-map fs-2 text-primary d-block mb-1"></i>
                <div class="small text-muted">Vị trí GPS</div>
                <!-- Hiện tọa độ số nếu có (request demo có tọa độ, request mới tạo = null) -->
                <div v-if="selectedTask.coordinates" class="small fw-mono">
                  {{ selectedTask.coordinates.lat }}, {{ selectedTask.coordinates.lng }}
                </div>
                <div v-else class="small text-muted">Chưa có tọa độ GPS</div>
                <!-- Có tọa độ: mở bản đồ theo lat/lng chính xác -->
                <a v-if="selectedTask.coordinates"
                   :href="`https://www.google.com/maps?q=${selectedTask.coordinates.lat},${selectedTask.coordinates.lng}`"
                   target="_blank" class="btn btn-sm btn-outline-primary mt-2">
                  <i class="bi bi-map me-1"></i>Mở Google Maps
                </a>
                <!-- Không có tọa độ: tìm kiếm theo tên địa chỉ -->
                <!-- encodeURIComponent() mã hóa ký tự đặc biệt để dùng an toàn trong URL -->
                <a v-else
                   :href="`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedTask.location)}`"
                   target="_blank" class="btn btn-sm btn-outline-primary mt-2">
                  <i class="bi bi-map me-1"></i>Tìm trên Google Maps
                </a>
              </div>

              <!-- ─── Khu vực cập nhật trạng thái ──────────────────────────── -->
              <div class="border-top pt-3">
                <label class="form-label fw-semibold">Cập nhật trạng thái</label>
                <div class="d-grid gap-2">

                  <!-- Nút "Bắt đầu thực hiện" — chỉ hiện khi status = 'assigned' -->
                  <!-- Chuyển trạng thái: assigned → in_progress -->
                  <button v-if="selectedTask.status === 'assigned'" class="btn btn-warning" @click="updateStatus('in_progress')">
                    <i class="bi bi-play-circle me-2"></i>Bắt đầu thực hiện
                  </button>

                  <!-- Nút "Báo cáo hoàn thành" — hiện khi assigned hoặc in_progress -->
                  <!-- Click mở form nhập ghi chú kết quả -->
                  <button v-if="['assigned','in_progress'].includes(selectedTask.status)" class="btn btn-success" @click="showCompleteForm = true">
                    <i class="bi bi-check-circle me-2"></i>Báo cáo hoàn thành
                  </button>

                </div>

                <!-- Form nhập ghi chú khi hoàn thành — hiện sau khi click "Báo cáo hoàn thành" -->
                <div v-if="showCompleteForm" class="mt-3">
                  <label class="form-label small">Ghi chú kết quả</label>
                  <textarea v-model="completeNote" class="form-control form-control-sm" rows="2" placeholder="Mô tả kết quả cứu hộ..."></textarea>
                  <div class="d-flex gap-2 mt-2">
                    <!-- Xác nhận hoàn thành → gọi completeTask() -->
                    <button class="btn btn-success btn-sm flex-fill" @click="completeTask">Xác nhận hoàn thành</button>
                    <!-- Hủy → ẩn form, không thay đổi trạng thái -->
                    <button class="btn btn-secondary btn-sm" @click="showCompleteForm = false">Hủy</button>
                  </div>
                </div>

                <!-- Thông báo đã hoàn thành — hiện khi status = 'completed' -->
                <div v-if="selectedTask.status === 'completed'" class="alert alert-success py-2 mt-2 mb-0">
                  <i class="bi bi-check-circle-fill me-1"></i>Nhiệm vụ đã hoàn thành
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>

      <!-- ═══ Bảng lịch sử nhiệm vụ đã hoàn thành ══════════════════════════════ -->
      <div class="card border-0 shadow-sm mt-4">
        <div class="card-header bg-success text-white fw-semibold">
          <i class="bi bi-trophy me-2"></i>Nhiệm Vụ Đã Hoàn Thành
        </div>
        <div class="table-responsive">
          <table class="table table-hover mb-0">
            <thead class="table-light">
              <tr>
                <th>#</th><th>Người yêu cầu</th><th>Địa điểm</th><th>Ghi chú</th><th>Hoàn thành lúc</th>
              </tr>
            </thead>
            <tbody>
              <!-- completedTasks lọc những yêu cầu có status=completed của đội này -->
              <tr v-for="t in completedTasks" :key="t.id">
                <td>{{ t.id }}</td>
                <td>{{ t.citizenName }}</td>
                <td class="small">{{ t.location }}</td>
                <td class="small text-muted">{{ t.notes }}</td>
                <td class="small">{{ formatDate(t.updatedAt) }}</td>
              </tr>
              <!-- Hàng rỗng nếu chưa hoàn thành nhiệm vụ nào -->
              <tr v-if="completedTasks.length === 0">
                <td colspan="5" class="text-center text-muted py-3">Chưa có nhiệm vụ hoàn thành</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import NavBar from '../components/NavBar.vue'
import StatusBadge from '../components/StatusBadge.vue'
import { store, logout, updateRequestStatus } from '../store/index.js'

const router = useRouter()

// Nhiệm vụ đang được chọn để xem chi tiết (null = chưa chọn)
const selectedTask = ref(null)

// Cờ hiển thị form nhập ghi chú khi báo cáo hoàn thành
const showCompleteForm = ref(false)

// Nội dung ghi chú kết quả cứu hộ
const completeNote = ref('')

// Lấy thông tin đội của người dùng hiện tại từ store.teams
// Dựa trên quy ước: teams[].id === users[].id
const myTeam = computed(() => store.teams.find(t => t.id === store.currentUser?.id))

// Lọc nhiệm vụ đang active (chưa hoàn thành) được phân công cho đội này
// Sắp xếp theo độ ưu tiên: critical(0) > high(1) > medium(2) > low(3)
const myTasks = computed(() =>
  store.rescueRequests
    .filter(r => r.assignedTeamId === store.currentUser?.id && r.status !== 'completed')
    .sort((a, b) => {
      const urgOrder = { critical: 0, high: 1, medium: 2, low: 3 }
      return (urgOrder[a.urgency] || 9) - (urgOrder[b.urgency] || 9) // Số nhỏ hơn = ưu tiên hơn
    })
)

// Lọc các nhiệm vụ đã hoàn thành của đội này, mới nhất lên đầu
const completedTasks = computed(() =>
  store.rescueRequests
    .filter(r => r.assignedTeamId === store.currentUser?.id && r.status === 'completed')
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
)

// Cập nhật trạng thái nhiệm vụ đang chọn (gọi từ nút "Bắt đầu thực hiện")
function updateStatus(status) {
  updateRequestStatus(selectedTask.value.id, status) // Cập nhật trong store
  // Làm mới selectedTask để UI phản ánh thay đổi trạng thái mới
  selectedTask.value = store.rescueRequests.find(r => r.id === selectedTask.value.id)
}

// Hoàn thành nhiệm vụ với ghi chú kết quả
function completeTask() {
  updateRequestStatus(selectedTask.value.id, 'completed', completeNote.value)
  // Làm mới selectedTask
  selectedTask.value = store.rescueRequests.find(r => r.id === selectedTask.value.id)
  // Ẩn form và reset ghi chú
  showCompleteForm.value = false
  completeNote.value = ''
}

function handleLogout() {
  logout()
  router.push('/login')
}

function formatDate(dt) {
  return new Date(dt).toLocaleString('vi-VN')
}
</script>
