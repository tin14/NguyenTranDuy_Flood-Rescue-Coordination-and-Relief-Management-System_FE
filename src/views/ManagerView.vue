<template>
  <div>
    <NavBar :user="store.currentUser" @logout="handleLogout" />

    <div class="container py-4">

      <!-- ═══ Tab navigation ══════════════════════════════════════════════════ -->
      <ul class="nav nav-tabs mb-4 border-bottom">
        <li class="nav-item">
          <button class="nav-link" :class="{ active: activeTab === 'inventory' }" @click="activeTab = 'inventory'">
            <i class="bi bi-box-seam me-1"></i>Kho Hàng
          </button>
        </li>
        <li class="nav-item">
          <button class="nav-link" :class="{ active: activeTab === 'monitor' }" @click="activeTab = 'monitor'">
            <i class="bi bi-eye me-1"></i>Giám Sát Điều Phối
            <span v-if="store.supplyOrders?.length" class="badge bg-success ms-1">{{ store.supplyOrders.length }}</span>
          </button>
        </li>
        <li class="nav-item">
          <button class="nav-link" :class="{ active: activeTab === 'stats' }" @click="activeTab = 'stats'">
            <i class="bi bi-bar-chart-line me-1"></i>Thống Kê
          </button>
        </li>
      </ul>

      <!-- ══════════════════════════════════════════════════════════════════════ -->
      <!-- TAB 1: KHO HÀNG — quản lý tồn kho                                   -->
      <!-- ══════════════════════════════════════════════════════════════════════ -->
      <div v-if="activeTab === 'inventory'">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h5 class="fw-semibold mb-0">
            <i class="bi bi-box-seam text-primary me-2"></i>Quản Lý Kho Hàng Cứu Trợ
          </h5>
          <button class="btn btn-primary btn-sm" @click="showAddItem = true">
            <i class="bi bi-plus-circle me-1"></i>Thêm hàng
          </button>
        </div>

        <!-- Cảnh báo tồn kho thấp -->
        <div v-if="lowStockItems.length" class="alert alert-warning d-flex align-items-center gap-2 mb-3">
          <i class="bi bi-exclamation-triangle-fill"></i>
          <span>Cảnh báo tồn kho thấp: <strong>{{ lowStockItems.map(i => i.name).join(', ') }}</strong></span>
        </div>

        <!-- Ghi chú cho Coordinator -->
        <div class="alert alert-info d-flex align-items-start gap-2 mb-3">
          <i class="bi bi-info-circle-fill mt-1 flex-shrink-0"></i>
          <div class="small">
            <strong>Tình trạng sẵn sàng cho Điều phối viên:</strong>
            <ul class="mb-0 mt-1">
              <li v-for="item in store.inventory.filter(i => i.quantity > 0)" :key="item.id">
                <strong>{{ item.name }}</strong>: còn
                <strong class="text-success">{{ item.quantity }} {{ item.unit }}</strong>
                <span v-if="item.quantity <= item.minStock" class="badge bg-warning text-dark ms-1 small">Sắp hết</span>
              </li>
              <li v-if="store.inventory.every(i => i.quantity === 0)" class="text-danger">Kho hiện đang trống!</li>
            </ul>
          </div>
        </div>

        <!-- Grid thẻ mặt hàng -->
        <div class="row g-3">
          <div v-for="item in store.inventory" :key="item.id" class="col-md-4">
            <div class="card border-0 shadow-sm h-100"
                 :class="{ 'border border-warning': item.quantity <= item.minStock }">
              <div class="card-body">
                <div class="d-flex justify-content-between align-items-start mb-2">
                  <h6 class="fw-semibold mb-0">{{ item.name }}</h6>
                  <span v-if="item.quantity <= item.minStock" class="badge bg-warning text-dark small">Tồn thấp</span>
                </div>

                <div class="row g-2 text-center mb-3">
                  <div class="col-4">
                    <div class="fs-4 fw-bold text-primary">{{ item.quantity }}</div>
                    <div class="text-muted" style="font-size:0.72rem">Tồn kho</div>
                  </div>
                  <div class="col-4">
                    <div class="fs-4 fw-bold text-success">{{ item.distributed }}</div>
                    <div class="text-muted" style="font-size:0.72rem">Đã phát</div>
                  </div>
                  <div class="col-4">
                    <div class="fs-4 fw-bold text-warning">{{ item.minStock }}</div>
                    <div class="text-muted" style="font-size:0.72rem">Tối thiểu</div>
                  </div>
                </div>

                <div class="mb-3">
                  <div class="d-flex justify-content-between small text-muted mb-1">
                    <span>Tỷ lệ đã phát</span>
                    <span>{{ item.quantity + item.distributed > 0
                      ? Math.round(item.distributed / (item.quantity + item.distributed) * 100) : 0 }}%</span>
                  </div>
                  <div class="progress" style="height:6px">
                    <div class="progress-bar bg-success"
                         :style="`width:${item.quantity + item.distributed > 0 ? item.distributed / (item.quantity + item.distributed) * 100 : 0}%`">
                    </div>
                  </div>
                </div>

                <!-- Chỉ có nút Cập nhật tồn kho — Quản lý kho không trực tiếp phát hàng -->
                <button class="btn btn-outline-primary btn-sm w-100" @click="selectEditItem(item)">
                  <i class="bi bi-pencil me-1"></i>Cập nhật tồn kho
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ══════════════════════════════════════════════════════════════════════ -->
      <!-- TAB 2: GIÁM SÁT — theo dõi phân phối từ Coordinator (chỉ xem)       -->
      <!-- ══════════════════════════════════════════════════════════════════════ -->
      <div v-if="activeTab === 'monitor'">
        <h5 class="fw-semibold mb-4">
          <i class="bi bi-eye text-success me-2"></i>Giám Sát Điều Phối (do Điều Phối Viên thực hiện)
        </h5>

        <!-- Tóm tắt nhanh -->
        <div class="row g-3 mb-4">
          <div class="col-md-3">
            <div class="card border-0 shadow-sm text-center">
              <div class="card-body py-3">
                <i class="bi bi-truck fs-2 text-success mb-1 d-block"></i>
                <div class="fs-3 fw-bold text-success">{{ store.supplyOrders?.length || 0 }}</div>
                <div class="text-muted small">Phiếu phân phối</div>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card border-0 shadow-sm text-center">
              <div class="card-body py-3">
                <i class="bi bi-box-arrow-up fs-2 text-primary mb-1 d-block"></i>
                <div class="fs-3 fw-bold text-primary">{{ totalDistributedByCoord }}</div>
                <div class="text-muted small">Tổng hàng đã phát</div>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card border-0 shadow-sm text-center">
              <div class="card-body py-3">
                <i class="bi bi-car-front fs-2 text-warning mb-1 d-block"></i>
                <div class="fs-3 fw-bold text-warning">{{ assignedVehicleCount }}</div>
                <div class="text-muted small">Phương tiện đang dùng</div>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card border-0 shadow-sm text-center">
              <div class="card-body py-3">
                <i class="bi bi-check-circle fs-2 text-info mb-1 d-block"></i>
                <div class="fs-3 fw-bold text-info">{{ store.vehicles?.filter(v => v.status === 'available').length || 0 }}</div>
                <div class="text-muted small">Phương tiện sẵn sàng</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Bảng phân phối hàng từ Coordinator -->
        <div class="card border-0 shadow-sm mb-4">
          <div class="card-header fw-semibold bg-white d-flex align-items-center gap-2">
            <i class="bi bi-box-seam text-primary"></i>Lịch Sử Phân Phối Hàng Cứu Trợ
            <span class="badge bg-primary ms-auto">{{ store.supplyOrders?.length || 0 }} phiếu</span>
          </div>
          <div class="table-responsive">
            <table class="table table-hover mb-0">
              <thead class="table-light">
                <tr>
                  <th>#</th>
                  <th>Hàng cứu trợ</th>
                  <th>Số lượng</th>
                  <th>Đội cứu hộ nhận</th>
                  <th>Phương tiện vận chuyển</th>
                  <th>Ngày</th>
                  <th>Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="o in [...(store.supplyOrders || [])].reverse()" :key="o.id">
                  <td class="text-muted small">{{ o.id }}</td>
                  <td class="fw-semibold">{{ o.itemName }}</td>
                  <td><span class="badge bg-success">{{ o.quantity }}</span></td>
                  <td><span class="badge bg-primary">{{ o.teamName }}</span></td>
                  <td>
                    <span v-if="o.vehicleName" class="badge bg-secondary">
                      <i class="bi bi-truck me-1"></i>{{ o.vehicleName }}
                    </span>
                    <span v-else class="text-muted small fst-italic">Chưa chỉ định</span>
                  </td>
                  <td class="small">{{ o.date }}</td>
                  <td class="text-muted small">{{ o.note }}</td>
                </tr>
                <tr v-if="!store.supplyOrders?.length">
                  <td colspan="7" class="text-center text-muted py-4">
                    <i class="bi bi-inbox fs-3 d-block mb-2 text-secondary"></i>
                    Chưa có phiếu phân phối nào từ Điều phối viên
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Bảng tình trạng phương tiện từ Coordinator -->
        <div class="card border-0 shadow-sm">
          <div class="card-header fw-semibold bg-white d-flex align-items-center gap-2">
            <i class="bi bi-truck text-warning"></i>Tình Trạng Phương Tiện
            <span class="badge bg-warning text-dark ms-auto">{{ store.vehicles?.length || 0 }} phương tiện</span>
          </div>
          <div class="table-responsive">
            <table class="table table-hover mb-0">
              <thead class="table-light">
                <tr>
                  <th>#</th><th>Tên phương tiện</th><th>Loại</th><th>Trạng thái</th><th>Đội đang dùng</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="v in store.vehicles || []" :key="v.id">
                  <td class="text-muted small">{{ v.id }}</td>
                  <td class="fw-semibold">{{ v.name }}</td>
                  <td><span class="badge bg-secondary">{{ v.type }}</span></td>
                  <td>
                    <span class="badge"
                          :class="v.status === 'available' ? 'bg-success' : 'bg-warning text-dark'">
                      <i class="bi me-1"
                         :class="v.status === 'available' ? 'bi-circle-fill' : 'bi-arrow-right-circle-fill'"></i>
                      {{ v.status === 'available' ? 'Sẵn sàng' : 'Đang dùng' }}
                    </span>
                  </td>
                  <td>{{ v.assignedTeamName || '—' }}</td>
                </tr>
                <tr v-if="!store.vehicles?.length">
                  <td colspan="5" class="text-center text-muted py-3">Chưa có phương tiện nào</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ══════════════════════════════════════════════════════════════════════ -->
      <!-- TAB 3: THỐNG KÊ — tổng quan kho hàng                                 -->
      <!-- ══════════════════════════════════════════════════════════════════════ -->
      <div v-if="activeTab === 'stats'">
        <h5 class="fw-semibold mb-4">
          <i class="bi bi-bar-chart-line text-info me-2"></i>Thống Kê Kho Hàng
        </h5>

        <div class="row g-3 mb-4">
          <div class="col-md-3" v-for="s in summaryStats" :key="s.label">
            <div class="card border-0 shadow-sm text-center">
              <div class="card-body">
                <i :class="s.icon + ' fs-2 mb-2 ' + s.color"></i>
                <div class="fs-2 fw-bold" :class="s.color">{{ s.value }}</div>
                <div class="text-muted small">{{ s.label }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="card border-0 shadow-sm">
          <div class="card-header fw-semibold bg-white">Tình Trạng Tồn Kho Từng Mặt Hàng</div>
          <div class="card-body">
            <div v-for="item in store.inventory" :key="item.id" class="mb-3">
              <div class="d-flex justify-content-between mb-1">
                <span class="small fw-semibold">{{ item.name }}</span>
                <span class="small text-muted">
                  {{ item.quantity }} {{ item.unit }} còn lại /
                  {{ item.distributed }} đã phát
                </span>
              </div>
              <div class="progress" style="height:16px">
                <div class="progress-bar bg-primary"
                     :style="`width:${item.quantity + item.distributed > 0 ? item.quantity / (item.quantity + item.distributed) * 100 : 0}%`"
                     :title="`Tồn kho: ${item.quantity}`">
                  Tồn kho
                </div>
                <div class="progress-bar bg-success"
                     :style="`width:${item.quantity + item.distributed > 0 ? item.distributed / (item.quantity + item.distributed) * 100 : 0}%`"
                     :title="`Đã phát: ${item.distributed}`">
                  Đã phát
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ══════════════════════════════════════════════════════════════════════ -->
      <!-- MODAL: THÊM MẶT HÀNG VÀO KHO                                         -->
      <!-- ══════════════════════════════════════════════════════════════════════ -->
      <div v-if="showAddItem" class="modal-overlay" @click.self="showAddItem = false">
        <div class="card shadow-lg" style="width:420px">
          <div class="card-header fw-semibold">Thêm Hàng Vào Kho</div>
          <div class="card-body">
            <div class="mb-3">
              <label class="form-label small">Tên hàng hóa</label>
              <input v-model="addItemForm.name" class="form-control form-control-sm" placeholder="Tên mặt hàng" />
            </div>
            <div class="row g-2 mb-3">
              <div class="col">
                <label class="form-label small">Số lượng</label>
                <input v-model.number="addItemForm.quantity" type="number" class="form-control form-control-sm" min="0" />
              </div>
              <div class="col">
                <label class="form-label small">Đơn vị</label>
                <input v-model="addItemForm.unit" class="form-control form-control-sm" placeholder="kg, cái, thùng..." />
              </div>
              <div class="col">
                <label class="form-label small">Tồn tối thiểu</label>
                <input v-model.number="addItemForm.minStock" type="number" class="form-control form-control-sm" min="0" />
              </div>
            </div>
            <div class="d-flex gap-2">
              <button class="btn btn-primary btn-sm flex-fill" @click="doAddItem">Thêm</button>
              <button class="btn btn-secondary btn-sm" @click="showAddItem = false">Hủy</button>
            </div>
          </div>
        </div>
      </div>

      <!-- ══════════════════════════════════════════════════════════════════════ -->
      <!-- MODAL: CẬP NHẬT TỒN KHO                                              -->
      <!-- ══════════════════════════════════════════════════════════════════════ -->
      <div v-if="showEditItem" class="modal-overlay" @click.self="showEditItem = false">
        <div class="card shadow-lg" style="width:420px">
          <div class="card-header fw-semibold">Cập Nhật Tồn Kho: {{ editItemForm.name }}</div>
          <div class="card-body">
            <div class="mb-3">
              <label class="form-label small">Số lượng tồn kho</label>
              <input v-model.number="editItemForm.quantity" type="number" class="form-control form-control-sm" min="0" />
            </div>
            <div class="mb-3">
              <label class="form-label small">Tồn tối thiểu</label>
              <input v-model.number="editItemForm.minStock" type="number" class="form-control form-control-sm" min="0" />
            </div>
            <div class="d-flex gap-2">
              <button class="btn btn-primary btn-sm flex-fill" @click="doEditItem">Lưu</button>
              <button class="btn btn-secondary btn-sm" @click="showEditItem = false">Hủy</button>
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
import { store, logout, addInventoryItem, updateInventoryItem } from '../store/index.js'

const router = useRouter()

// Tab đang hiển thị: 'inventory' | 'monitor' | 'stats'
const activeTab = ref('inventory')

// Modal flags
const showAddItem  = ref(false)
const showEditItem = ref(false)

// Form thêm hàng mới
const addItemForm = reactive({ name: '', quantity: 0, unit: 'cái', minStock: 10 })

// Form cập nhật tồn kho
const editItemForm = reactive({ id: null, name: '', quantity: 0, minStock: 0 })

// Mặt hàng có tồn kho thấp
const lowStockItems = computed(() => store.inventory.filter(i => i.quantity <= i.minStock))

// Tổng số hàng đã phân phối bởi Coordinator
const totalDistributedByCoord = computed(() =>
  (store.supplyOrders || []).reduce((s, o) => s + o.quantity, 0)
)

// Số phương tiện đang được sử dụng
const assignedVehicleCount = computed(() =>
  (store.vehicles || []).filter(v => v.status === 'assigned').length
)

// 4 thẻ thống kê
const summaryStats = computed(() => [
  { label: 'Tổng mặt hàng',       value: store.inventory.length,                                       icon: 'bi bi-grid-3x3-gap',        color: 'text-primary' },
  { label: 'Tồn kho thấp',        value: lowStockItems.value.length,                                   icon: 'bi bi-exclamation-triangle', color: 'text-warning' },
  { label: 'Tổng tồn kho hiện tại', value: store.inventory.reduce((s, i) => s + i.quantity, 0),       icon: 'bi bi-boxes',                color: 'text-info'    },
  { label: 'Tổng đã phân phối',   value: store.inventory.reduce((s, i) => s + i.distributed, 0),      icon: 'bi bi-box-arrow-up',         color: 'text-success' },
])

function selectEditItem(item) {
  Object.assign(editItemForm, { id: item.id, name: item.name, quantity: item.quantity, minStock: item.minStock })
  showEditItem.value = true
}

function doAddItem() {
  if (!addItemForm.name.trim()) return
  addInventoryItem({ name: addItemForm.name.trim(), quantity: addItemForm.quantity, unit: addItemForm.unit, minStock: addItemForm.minStock })
  Object.assign(addItemForm, { name: '', quantity: 0, unit: 'cái', minStock: 10 })
  showAddItem.value = false
}

function doEditItem() {
  updateInventoryItem(editItemForm.id, { quantity: editItemForm.quantity, minStock: editItemForm.minStock })
  showEditItem.value = false
}

function handleLogout() {
  logout()
  router.push('/login')
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
}
</style>
