<template>
  <div>
    <NavBar :user="store.currentUser" @logout="handleLogout" />

    <div class="container-fluid py-4 px-4">

      <!-- ═══ Tab navigation ══════════════════════════════════════════════════ -->
      <ul class="nav nav-tabs mb-4">
        <li class="nav-item">
          <button class="nav-link" :class="{ active: activeTab === 'requests' }" @click="activeTab = 'requests'">
            <i class="bi bi-list-task me-1"></i>Yêu Cầu Cứu Hộ
            <span v-if="pendingCount" class="badge bg-danger ms-1">{{ pendingCount }}</span>
          </button>
        </li>
        <li class="nav-item">
          <button class="nav-link" :class="{ active: activeTab === 'supply' }" @click="activeTab = 'supply'">
            <i class="bi bi-box-seam me-1"></i>Phân Phối Hàng Cứu Trợ
          </button>
        </li>
        <li class="nav-item">
          <button class="nav-link" :class="{ active: activeTab === 'vehicles' }" @click="activeTab = 'vehicles'">
            <i class="bi bi-truck me-1"></i>Điều Phối Phương Tiện
          </button>
        </li>
      </ul>

      <!-- ══════════════════════════════════════════════════════════════════════════ -->
      <!-- TAB 1: YÊU CẦU CỨU HỘ                                                    -->
      <!-- ══════════════════════════════════════════════════════════════════════════ -->
      <div v-if="activeTab === 'requests'">

        <!-- 4 thẻ thống kê tổng quan -->
        <div class="row g-3 mb-4">
          <div class="col-md-3" v-for="stat in stats" :key="stat.label">
            <div class="card border-0 shadow-sm">
              <div class="card-body d-flex align-items-center gap-3">
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

          <!-- Bảng danh sách yêu cầu (cột trái 7/12) -->
          <div class="col-xl-7">
            <div class="card border-0 shadow-sm">
              <div class="card-header d-flex justify-content-between align-items-center bg-white">
                <span class="fw-semibold"><i class="bi bi-list-task me-2 text-primary"></i>Danh Sách Yêu Cầu Cứu Hộ</span>
                <div class="d-flex gap-2">
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
                        <th>#</th><th>Người yêu cầu</th><th>Địa điểm</th><th>Mức độ</th><th>Trạng thái</th><th>Thời gian</th><th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="req in filteredRequests" :key="req.id"
                          :class="{ 'table-danger': req.urgency === 'critical' && req.status === 'pending' }">
                        <td>{{ req.id }}</td>
                        <td class="small">{{ req.citizenName }}</td>
                        <td class="small" style="max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ req.location }}</td>
                        <td><StatusBadge :status="req.urgency" type="urgency" /></td>
                        <td><StatusBadge :status="req.status" /></td>
                        <td class="small">{{ formatDate(req.createdAt) }}</td>
                        <td>
                          <button class="btn btn-sm btn-outline-primary" @click="selectRequest(req)">
                            <i class="bi bi-eye"></i>
                          </button>
                        </td>
                      </tr>
                      <tr v-if="filteredRequests.length === 0">
                        <td colspan="7" class="text-center text-muted py-3">Không có yêu cầu nào</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <!-- Panel chi tiết + thao tác điều phối (cột phải 5/12) -->
          <div class="col-xl-5">
            <div v-if="!selectedRequest" class="card border-0 shadow-sm h-100 d-flex align-items-center justify-content-center">
              <div class="text-center text-muted py-5">
                <i class="bi bi-hand-index fs-1 d-block mb-2"></i>
                Chọn yêu cầu để xem chi tiết và thực hiện thao tác
              </div>
            </div>

            <div v-else class="card border-0 shadow-sm">
              <div class="card-header fw-semibold d-flex justify-content-between">
                <span><i class="bi bi-file-text me-2 text-primary"></i>Yêu cầu #{{ selectedRequest.id }}</span>
                <button class="btn-close" @click="selectedRequest = null"></button>
              </div>
              <div class="card-body">
                <div class="mb-3 d-flex gap-2">
                  <StatusBadge :status="selectedRequest.urgency" type="urgency" class="fs-6" />
                  <StatusBadge :status="selectedRequest.status" class="fs-6" />
                </div>
                <div class="mb-2 small"><i class="bi bi-person text-primary me-2"></i><strong>Người yêu cầu:</strong> {{ selectedRequest.citizenName }}</div>
                <div class="mb-2 small"><i class="bi bi-geo-alt text-danger me-2"></i><strong>Địa điểm:</strong> {{ selectedRequest.location }}</div>
                <div class="mb-2 small"><i class="bi bi-clock text-muted me-2"></i><strong>Thời gian:</strong> {{ formatDate(selectedRequest.createdAt) }}</div>
                <div class="mb-3 small">
                  <i class="bi bi-chat-text text-secondary me-2"></i><strong>Mô tả:</strong>
                  <p class="text-muted mt-1 mb-0">{{ selectedRequest.description }}</p>
                </div>
                <div v-if="selectedRequest.assignedTeamName" class="alert alert-primary py-2 small">
                  <i class="bi bi-people-fill me-1"></i>Đã phân công: <strong>{{ selectedRequest.assignedTeamName }}</strong>
                </div>
                <div v-if="selectedRequest.notes" class="alert alert-info py-2 small">
                  <i class="bi bi-info-circle me-1"></i>{{ selectedRequest.notes }}
                </div>

                <!-- Khu vực thao tác điều phối -->
                <div class="border-top pt-3 mt-2">
                  <div class="fw-semibold mb-2">Thao tác điều phối</div>

                  <!-- [1] XÁC MINH -->
                  <div v-if="selectedRequest.status === 'pending'" class="mb-3">
                    <label class="form-label small">Xác minh và phân loại mức độ</label>
                    <select v-model="actionForm.urgency" class="form-select form-select-sm mb-2">
                      <option value="critical">🔴 Khẩn cấp</option>
                      <option value="high">🟠 Cao</option>
                      <option value="medium">🟡 Trung bình</option>
                      <option value="low">🟢 Thấp</option>
                    </select>
                    <input v-model="actionForm.notes" class="form-control form-control-sm mb-2" placeholder="Ghi chú xác minh..." />
                    <button class="btn btn-info btn-sm w-100" @click="verifyRequest">
                      <i class="bi bi-check2 me-1"></i>Xác minh yêu cầu
                    </button>
                  </div>

                  <!-- [2] PHÂN CÔNG ĐỘI -->
                  <div v-if="['verified', 'pending'].includes(selectedRequest.status)" class="mb-3">
                    <label class="form-label small">Phân công đội cứu hộ</label>
                    <select v-model="actionForm.teamId" class="form-select form-select-sm mb-2">
                      <option value="">-- Chọn đội cứu hộ --</option>
                      <option v-for="team in store.teams" :key="team.id" :value="team.id">
                        {{ team.name }} ({{ team.status === 'available' ? '✅ Sẵn sàng' : '🔄 Đang bận' }})
                        {{ teamVehicles(team.id).length ? '— ' + teamVehicles(team.id).join(', ') : '' }}
                      </option>
                    </select>
                    <button class="btn btn-primary btn-sm w-100" :disabled="!actionForm.teamId" @click="assignTeam">
                      <i class="bi bi-send me-1"></i>Phân công
                    </button>
                  </div>

                  <!-- [3] HỦY YÊU CẦU -->
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

      <!-- ══════════════════════════════════════════════════════════════════════════ -->
      <!-- TAB 2: PHÂN PHỐI HÀNG CỨU TRỢ CHO ĐỘI                                  -->
      <!-- ══════════════════════════════════════════════════════════════════════════ -->
      <div v-if="activeTab === 'supply'">
        <div class="row g-4">

          <!-- Cột trái: Form tạo phiếu phân phối -->
          <div class="col-xl-5">
            <div class="card border-0 shadow-sm">
              <div class="card-header fw-semibold bg-white">
                <i class="bi bi-box-seam text-primary me-2"></i>Tạo Phiếu Phân Phối Hàng
              </div>
              <div class="card-body">

                <!-- Tình trạng kho (info cho coordinator) -->
                <div class="alert alert-info small mb-3">
                  <strong><i class="bi bi-info-circle me-1"></i>Tình trạng kho (từ Quản lý kho):</strong>
                  <ul class="mb-0 mt-1">
                    <li v-for="item in store.inventory" :key="item.id">
                      {{ item.name }}: còn <strong>{{ item.quantity }} {{ item.unit }}</strong>
                      <span v-if="item.quantity <= item.minStock" class="badge bg-warning text-dark ms-1">Tồn thấp</span>
                    </li>
                  </ul>
                </div>

                <div class="mb-3">
                  <label class="form-label small fw-semibold">Chọn hàng cứu trợ</label>
                  <select v-model.number="supplyForm.itemId" class="form-select form-select-sm">
                    <option value="">-- Chọn mặt hàng --</option>
                    <option v-for="item in store.inventory" :key="item.id" :value="item.id" :disabled="item.quantity === 0">
                      {{ item.name }} (còn {{ item.quantity }} {{ item.unit }})
                    </option>
                  </select>
                </div>

                <div class="mb-3">
                  <label class="form-label small fw-semibold">Số lượng</label>
                  <input v-model.number="supplyForm.quantity" type="number" min="1" class="form-control form-control-sm" />
                </div>

                <div class="mb-3">
                  <label class="form-label small fw-semibold">Đội cứu hộ nhận hàng</label>
                  <select v-model.number="supplyForm.teamId" class="form-select form-select-sm" @change="supplyForm.vehicleId = ''">
                    <option value="">-- Chọn đội --</option>
                    <option v-for="team in store.teams" :key="team.id" :value="team.id">
                      {{ team.name }} ({{ team.status === 'available' ? 'Sẵn sàng' : 'Đang bận' }})
                    </option>
                  </select>
                </div>

                <div class="mb-3">
                  <label class="form-label small fw-semibold">Phương tiện vận chuyển</label>
                  <select v-model.number="supplyForm.vehicleId" class="form-select form-select-sm">
                    <option value="">-- Chọn phương tiện --</option>
                    <optgroup v-if="teamVehiclesForSupply.length" label="Phương tiện của đội">
                      <option v-for="v in teamVehiclesForSupply" :key="v.id" :value="v.id">
                        {{ v.name }} ({{ v.type }}) — đang gán cho {{ v.assignedTeamName }}
                      </option>
                    </optgroup>
                    <optgroup v-if="availableVehicles.length" label="Phương tiện sẵn sàng trong kho">
                      <option v-for="v in availableVehicles" :key="v.id" :value="v.id">
                        {{ v.name }} ({{ v.type }})
                      </option>
                    </optgroup>
                  </select>
                  <div v-if="supplyForm.teamId && teamVehiclesForSupply.length === 0 && availableVehicles.length === 0"
                       class="text-muted small mt-1">Không có phương tiện nào sẵn sàng</div>
                </div>

                <div class="mb-3">
                  <label class="form-label small fw-semibold">Ghi chú</label>
                  <input v-model="supplyForm.note" class="form-control form-control-sm" placeholder="Ghi chú phân phối..." />
                </div>

                <div v-if="supplyError" class="alert alert-danger py-2 small">{{ supplyError }}</div>

                <button class="btn btn-primary w-100" @click="doSupplyOrder">
                  <i class="bi bi-send me-1"></i>Xác nhận phân phối
                </button>
              </div>
            </div>
          </div>

          <!-- Cột phải: Lịch sử phân phối -->
          <div class="col-xl-7">
            <div class="card border-0 shadow-sm">
              <div class="card-header fw-semibold bg-white">
                <i class="bi bi-clock-history text-success me-2"></i>Lịch Sử Phân Phối Hàng Cứu Trợ
              </div>
              <div class="table-responsive">
                <table class="table table-hover mb-0">
                  <thead class="table-light">
                    <tr>
                      <th>#</th><th>Hàng cứu trợ</th><th>Số lượng</th><th>Đội nhận</th><th>Phương tiện</th><th>Ngày</th><th>Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="o in [...store.supplyOrders].reverse()" :key="o.id">
                      <td>{{ o.id }}</td>
                      <td>{{ o.itemName }}</td>
                      <td class="fw-semibold">{{ o.quantity }}</td>
                      <td><span class="badge bg-primary">{{ o.teamName }}</span></td>
                      <td>
                        <span v-if="o.vehicleName" class="badge bg-secondary">
                          <i class="bi bi-truck me-1"></i>{{ o.vehicleName }}
                        </span>
                        <span v-else class="text-muted small">—</span>
                      </td>
                      <td>{{ o.date }}</td>
                      <td class="text-muted small">{{ o.note }}</td>
                    </tr>
                    <tr v-if="store.supplyOrders.length === 0">
                      <td colspan="7" class="text-center text-muted py-3">Chưa có lịch sử phân phối</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ══════════════════════════════════════════════════════════════════════════ -->
      <!-- TAB 3: ĐIỀU PHỐI PHƯƠNG TIỆN                                             -->
      <!-- ══════════════════════════════════════════════════════════════════════════ -->
      <div v-if="activeTab === 'vehicles'">
        <div class="row g-4">

          <!-- Cột trái: Form gán phương tiện + thêm mới -->
          <div class="col-xl-4">

            <!-- Form gán phương tiện -->
            <div class="card border-0 shadow-sm mb-4">
              <div class="card-header fw-semibold bg-white">
                <i class="bi bi-truck text-primary me-2"></i>Gán Phương Tiện Cho Đội
              </div>
              <div class="card-body">
                <div class="mb-3">
                  <label class="form-label small fw-semibold">Phương tiện</label>
                  <select v-model.number="vehicleForm.vehicleId" class="form-select form-select-sm">
                    <option value="">-- Chọn phương tiện --</option>
                    <option v-for="v in availableVehicles" :key="v.id" :value="v.id">
                      {{ v.name }} ({{ v.type }})
                    </option>
                  </select>
                  <div v-if="availableVehicles.length === 0" class="text-muted small mt-1">Không còn phương tiện sẵn sàng</div>
                </div>
                <div class="mb-3">
                  <label class="form-label small fw-semibold">Đội cứu hộ</label>
                  <select v-model.number="vehicleForm.teamId" class="form-select form-select-sm">
                    <option value="">-- Chọn đội --</option>
                    <option v-for="team in store.teams" :key="team.id" :value="team.id">
                      {{ team.name }}
                    </option>
                  </select>
                </div>
                <div v-if="vehicleError" class="alert alert-danger py-2 small">{{ vehicleError }}</div>
                <button class="btn btn-primary w-100 btn-sm" @click="doAssignVehicle">
                  <i class="bi bi-send me-1"></i>Gán phương tiện
                </button>
              </div>
            </div>

            <!-- Form thêm phương tiện mới -->
            <div class="card border-0 shadow-sm">
              <div class="card-header fw-semibold bg-white">
                <i class="bi bi-plus-circle text-success me-2"></i>Thêm Phương Tiện Mới
              </div>
              <div class="card-body">
                <div class="mb-3">
                  <label class="form-label small fw-semibold">Tên phương tiện</label>
                  <input v-model="newVehicle.name" class="form-control form-control-sm" placeholder="VD: Xuồng máy 04" />
                </div>
                <div class="mb-3">
                  <label class="form-label small fw-semibold">Loại</label>
                  <select v-model="newVehicle.type" class="form-select form-select-sm">
                    <option value="Xuồng máy">Xuồng máy</option>
                    <option value="Xe tải">Xe tải</option>
                    <option value="Trực thăng">Trực thăng</option>
                    <option value="Xe cứu thương">Xe cứu thương</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>
                <button class="btn btn-success w-100 btn-sm" @click="doAddVehicle">
                  <i class="bi bi-plus me-1"></i>Thêm vào kho
                </button>
              </div>
            </div>
          </div>

          <!-- Cột phải: Bảng phương tiện toàn bộ -->
          <div class="col-xl-8">
            <div class="card border-0 shadow-sm">
              <div class="card-header fw-semibold bg-white d-flex justify-content-between align-items-center">
                <span><i class="bi bi-list-check text-info me-2"></i>Danh Sách Phương Tiện</span>
                <div class="d-flex gap-2 small text-muted">
                  <span><i class="bi bi-circle-fill text-success me-1"></i>Sẵn sàng: {{ availableVehicles.length }}</span>
                  <span><i class="bi bi-circle-fill text-warning me-1"></i>Đã gán: {{ assignedVehicles.length }}</span>
                </div>
              </div>
              <div class="table-responsive">
                <table class="table table-hover mb-0">
                  <thead class="table-light">
                    <tr>
                      <th>#</th><th>Tên phương tiện</th><th>Loại</th><th>Trạng thái</th><th>Đội được gán</th><th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="v in store.vehicles" :key="v.id">
                      <td>{{ v.id }}</td>
                      <td class="fw-semibold">{{ v.name }}</td>
                      <td><span class="badge bg-secondary">{{ v.type }}</span></td>
                      <td>
                        <span class="badge" :class="v.status === 'available' ? 'bg-success' : 'bg-warning text-dark'">
                          {{ v.status === 'available' ? 'Sẵn sàng' : 'Đã gán' }}
                        </span>
                      </td>
                      <td>{{ v.assignedTeamName || '—' }}</td>
                      <td>
                        <button v-if="v.status === 'assigned'" class="btn btn-outline-danger btn-sm" @click="doUnassignVehicle(v.id)" title="Thu hồi về kho">
                          <i class="bi bi-arrow-return-left"></i>
                        </button>
                        <span v-else class="text-muted small">—</span>
                      </td>
                    </tr>
                    <tr v-if="store.vehicles.length === 0">
                      <td colspan="6" class="text-center text-muted py-3">Chưa có phương tiện nào</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Phân bổ phương tiện theo đội -->
            <div class="card border-0 shadow-sm mt-4">
              <div class="card-header fw-semibold bg-white">
                <i class="bi bi-diagram-3 text-primary me-2"></i>Phương Tiện Theo Đội
              </div>
              <div class="card-body">
                <div v-for="team in store.teams" :key="team.id" class="mb-3">
                  <div class="d-flex justify-content-between align-items-center mb-1">
                    <span class="fw-semibold small">{{ team.name }}</span>
                    <span class="badge" :class="team.status === 'available' ? 'bg-success' : 'bg-warning text-dark'">
                      {{ team.status === 'available' ? 'Sẵn sàng' : 'Đang bận' }}
                    </span>
                  </div>
                  <div v-if="teamVehicles(team.id).length" class="d-flex flex-wrap gap-1">
                    <span v-for="vname in teamVehicles(team.id)" :key="vname" class="badge bg-primary">
                      <i class="bi bi-truck me-1"></i>{{ vname }}
                    </span>
                  </div>
                  <div v-else class="text-muted small fst-italic">Chưa có phương tiện nào</div>
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
import { ref, computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import NavBar from '../components/NavBar.vue'
import StatusBadge from '../components/StatusBadge.vue'
import { store, logout, updateRequestStatus, addSupplyOrder, addVehicle, assignVehicle, unassignVehicle } from '../store/index.js'

const router = useRouter()

// Tab đang hiển thị
const activeTab = ref('requests')

// ── Tab 1: Yêu cầu cứu hộ ──────────────────────────────────────────────────
const selectedRequest = ref(null)
const filterStatus    = ref('')
const filterUrgency   = ref('')
const actionForm = reactive({ urgency: 'high', notes: '', teamId: '' })

const pendingCount = computed(() => store.rescueRequests.filter(r => r.status === 'pending').length)

const stats = computed(() => [
  { label: 'Tổng yêu cầu', value: store.rescueRequests.length,                                                             icon: 'bi bi-clipboard-data', color: 'text-primary' },
  { label: 'Chờ xử lý',    value: store.rescueRequests.filter(r => r.status === 'pending').length,                         icon: 'bi bi-hourglass-split', color: 'text-warning' },
  { label: 'Đang xử lý',   value: store.rescueRequests.filter(r => ['assigned','in_progress'].includes(r.status)).length,  icon: 'bi bi-truck',           color: 'text-info'    },
  { label: 'Hoàn thành',   value: store.rescueRequests.filter(r => r.status === 'completed').length,                       icon: 'bi bi-check-circle',    color: 'text-success' },
])

const filteredRequests = computed(() => {
  return store.rescueRequests
    .filter(r =>
      (!filterStatus.value  || r.status  === filterStatus.value) &&
      (!filterUrgency.value || r.urgency === filterUrgency.value)
    )
    .sort((a, b) => {
      const urgOrder = { critical: 0, high: 1, medium: 2, low: 3 }
      const uo = (urgOrder[a.urgency] || 9) - (urgOrder[b.urgency] || 9)
      if (uo !== 0) return uo
      return new Date(b.createdAt) - new Date(a.createdAt)
    })
})

// Lấy danh sách tên phương tiện đang gán cho một đội (từ store.vehicles)
function teamVehicles(teamId) {
  return store.vehicles
    .filter(v => v.assignedTeamId === teamId)
    .map(v => v.name)
}

function selectRequest(req) {
  selectedRequest.value = req
  actionForm.urgency    = req.urgency
  actionForm.notes      = req.notes || ''
  actionForm.teamId     = req.assignedTeamId || ''
}

function verifyRequest() {
  const req = selectedRequest.value
  updateRequestStatus(req.id, 'verified', actionForm.notes)
  req.urgency = actionForm.urgency
  req.notes   = actionForm.notes
  selectedRequest.value = store.rescueRequests.find(r => r.id === req.id)
}

function assignTeam() {
  const team = store.teams.find(t => t.id === Number(actionForm.teamId))
  if (team) {
    updateRequestStatus(selectedRequest.value.id, 'assigned', actionForm.notes, team.id, team.name)
    selectedRequest.value = store.rescueRequests.find(r => r.id === selectedRequest.value.id)
  }
}

function cancelRequest() {
  updateRequestStatus(selectedRequest.value.id, 'cancelled', 'Đã hủy bởi điều phối viên')
  selectedRequest.value = store.rescueRequests.find(r => r.id === selectedRequest.value.id)
}

// ── Tab 2: Phân phối hàng ───────────────────────────────────────────────────
const supplyForm  = reactive({ itemId: '', quantity: 1, teamId: '', vehicleId: '', note: '' })
const supplyError = ref('')

// Phương tiện đang gán cho đội được chọn (ưu tiên hiện trước)
const teamVehiclesForSupply = computed(() =>
  supplyForm.teamId
    ? store.vehicles.filter(v => v.assignedTeamId === supplyForm.teamId)
    : []
)

function doSupplyOrder() {
  supplyError.value = ''
  if (!supplyForm.itemId || !supplyForm.teamId) { supplyError.value = 'Vui lòng chọn đủ mặt hàng và đội!'; return }
  const item = store.inventory.find(i => i.id === supplyForm.itemId)
  if (!item) return
  if (supplyForm.quantity < 1) { supplyError.value = 'Số lượng phải lớn hơn 0!'; return }
  if (supplyForm.quantity > item.quantity) { supplyError.value = 'Số lượng vượt quá tồn kho!'; return }
  const team = store.teams.find(t => t.id === supplyForm.teamId)
  const vehicle = supplyForm.vehicleId ? store.vehicles.find(v => v.id === supplyForm.vehicleId) : null
  addSupplyOrder({
    itemId:      supplyForm.itemId,
    itemName:    item.name,
    quantity:    supplyForm.quantity,
    teamId:      supplyForm.teamId,
    teamName:    team?.name || '',
    vehicleId:   vehicle?.id   || null,
    vehicleName: vehicle?.name || null,
    note:        supplyForm.note,
  })
  Object.assign(supplyForm, { itemId: '', quantity: 1, teamId: '', vehicleId: '', note: '' })
}

// ── Tab 3: Điều phối phương tiện ────────────────────────────────────────────
const vehicleForm  = reactive({ vehicleId: '', teamId: '' })
const vehicleError = ref('')
const newVehicle   = reactive({ name: '', type: 'Xuồng máy' })

const availableVehicles = computed(() => store.vehicles.filter(v => v.status === 'available'))
const assignedVehicles  = computed(() => store.vehicles.filter(v => v.status === 'assigned'))

function doAssignVehicle() {
  vehicleError.value = ''
  if (!vehicleForm.vehicleId || !vehicleForm.teamId) { vehicleError.value = 'Vui lòng chọn phương tiện và đội!'; return }
  const team = store.teams.find(t => t.id === vehicleForm.teamId)
  assignVehicle(vehicleForm.vehicleId, vehicleForm.teamId, team?.name || '')
  Object.assign(vehicleForm, { vehicleId: '', teamId: '' })
}

function doUnassignVehicle(vehicleId) {
  unassignVehicle(vehicleId)
}

function doAddVehicle() {
  if (!newVehicle.name.trim()) return
  addVehicle({ name: newVehicle.name.trim(), type: newVehicle.type })
  Object.assign(newVehicle, { name: '', type: 'Xuồng máy' })
}

// ── Chung ────────────────────────────────────────────────────────────────────
function handleLogout() {
  logout()
  router.push('/login')
}

function formatDate(dt) {
  return new Date(dt).toLocaleString('vi-VN')
}
</script>
