<template>
  <div>
    <NavBar :user="store.currentUser" @logout="handleLogout" />

    <div class="container py-4">

      <!-- ═══ Tab navigation: Kho Hàng | Phân Phối | Thống Kê ═══════════════════ -->
      <ul class="nav nav-tabs mb-4 border-bottom">
        <li class="nav-item">
          <!-- :class="{ active: ... }" thêm class active khi đang ở tab này -->
          <button class="nav-link" :class="{ active: activeTab === 'inventory' }" @click="activeTab = 'inventory'">
            <i class="bi bi-box-seam me-1"></i>Kho Hàng
          </button>
        </li>
        <li class="nav-item">
          <button class="nav-link" :class="{ active: activeTab === 'distribution' }" @click="activeTab = 'distribution'">
            <i class="bi bi-truck me-1"></i>Phân Phối
          </button>
        </li>
        <li class="nav-item">
          <button class="nav-link" :class="{ active: activeTab === 'stats' }" @click="activeTab = 'stats'">
            <i class="bi bi-bar-chart-line me-1"></i>Thống Kê
          </button>
        </li>
      </ul>

      <!-- ══════════════════════════════════════════════════════════════════════════ -->
      <!-- TAB 1: KHO HÀNG — v-if chỉ render component khi tab đang active         -->
      <!-- ══════════════════════════════════════════════════════════════════════════ -->
      <div v-if="activeTab === 'inventory'">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h5 class="fw-semibold mb-0"><i class="bi bi-box-seam text-primary me-2"></i>Quản Lý Kho Hàng Cứu Trợ</h5>
          <!-- Nút mở modal thêm hàng mới -->
          <button class="btn btn-primary btn-sm" @click="showAddItem = true">
            <i class="bi bi-plus-circle me-1"></i>Thêm hàng
          </button>
        </div>

        <!-- Cảnh báo tồn kho thấp — chỉ hiện khi có mặt hàng nào dưới ngưỡng minStock -->
        <!-- lowStockItems là computed lọc những item có quantity <= minStock -->
        <div v-if="lowStockItems.length" class="alert alert-warning d-flex align-items-center gap-2">
          <i class="bi bi-exclamation-triangle-fill"></i>
          <!-- .map(i => i.name).join(', ') lấy tên các mặt hàng nối bằng dấu phẩy -->
          <span>Cảnh báo tồn kho thấp: <strong>{{ lowStockItems.map(i => i.name).join(', ') }}</strong></span>
        </div>

        <!-- Grid các thẻ mặt hàng — 3 cột trên màn hình md trở lên -->
        <div class="row g-3">
          <div v-for="item in store.inventory" :key="item.id" class="col-md-4">
            <!-- Viền vàng nếu tồn kho đang ở mức thấp (quantity <= minStock) -->
            <div class="card border-0 shadow-sm" :class="{ 'border border-warning': item.quantity <= item.minStock }">
              <div class="card-body">

                <!-- Tên hàng + badge "Tồn thấp" -->
                <div class="d-flex justify-content-between align-items-start mb-2">
                  <h6 class="fw-semibold mb-0">{{ item.name }}</h6>
                  <span v-if="item.quantity <= item.minStock" class="badge bg-warning text-dark small">Tồn thấp</span>
                </div>

                <!-- 3 số liệu: Tồn kho | Đã phát | Tồn tối thiểu -->
                <div class="row g-2 text-center mb-3">
                  <div class="col-4">
                    <div class="fs-4 fw-bold text-primary">{{ item.quantity }}</div>
                    <div class="text-muted" style="font-size:0.75rem">Tồn kho</div>
                  </div>
                  <div class="col-4">
                    <div class="fs-4 fw-bold text-success">{{ item.distributed }}</div>
                    <div class="text-muted" style="font-size:0.75rem">Đã phát</div>
                  </div>
                  <div class="col-4">
                    <div class="fs-4 fw-bold text-warning">{{ item.minStock }}</div>
                    <div class="text-muted" style="font-size:0.75rem">Tồn tối thiểu</div>
                  </div>
                </div>

                <!-- Progress bar tỷ lệ đã phát -->
                <!-- Công thức: distributed / (quantity + distributed) * 100 -->
                <!-- Phòng chia 0: kiểm tra quantity + distributed > 0 trước -->
                <div class="mb-2">
                  <div class="d-flex justify-content-between small text-muted mb-1">
                    <span>Tỷ lệ đã phát</span>
                    <span>{{ item.quantity + item.distributed > 0 ? Math.round(item.distributed / (item.quantity + item.distributed) * 100) : 0 }}%</span>
                  </div>
                  <div class="progress" style="height:6px">
                    <div class="progress-bar bg-success" :style="`width:${item.quantity + item.distributed > 0 ? item.distributed / (item.quantity + item.distributed) * 100 : 0}%`"></div>
                  </div>
                </div>

                <!-- Nút Sửa → mở modal Edit Item | Nút Phát → mở modal Distribute -->
                <div class="d-flex gap-2">
                  <button class="btn btn-outline-primary btn-sm flex-fill" @click="selectEditItem(item)">
                    <i class="bi bi-pencil me-1"></i>Sửa
                  </button>
                  <button class="btn btn-success btn-sm flex-fill" @click="selectDistributeItem(item)">
                    <i class="bi bi-truck me-1"></i>Phát
                  </button>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ══════════════════════════════════════════════════════════════════════════ -->
      <!-- TAB 2: PHÂN PHỐI — lịch sử các lần phát hàng                            -->
      <!-- ══════════════════════════════════════════════════════════════════════════ -->
      <div v-if="activeTab === 'distribution'">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h5 class="fw-semibold mb-0"><i class="bi bi-truck text-success me-2"></i>Ghi Nhận Phân Phối Hàng Cứu Trợ</h5>
          <!-- Nút mở modal ghi nhận phân phối mới -->
          <button class="btn btn-success btn-sm" @click="showDistributeForm = true">
            <i class="bi bi-plus-circle me-1"></i>Ghi nhận phân phối
          </button>
        </div>

        <!-- Bảng lịch sử phân phối — đọc trực tiếp từ store.distributions -->
        <div class="table-responsive">
          <table class="table table-hover shadow-sm bg-white rounded">
            <thead class="table-light">
              <tr>
                <th>#</th><th>Hàng cứu trợ</th><th>Số lượng</th><th>Địa điểm phát</th><th>Ngày</th><th>Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="d in store.distributions" :key="d.id">
                <td>{{ d.id }}</td>
                <td>{{ d.itemName }}</td>
                <td class="fw-semibold">{{ d.quantity }}</td>
                <td>{{ d.location }}</td>
                <td>{{ d.date }}</td>
                <td class="text-muted small">{{ d.note }}</td>
              </tr>
              <tr v-if="store.distributions.length === 0">
                <td colspan="6" class="text-center text-muted py-3">Chưa có lịch sử phân phối</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ══════════════════════════════════════════════════════════════════════════ -->
      <!-- TAB 3: THỐNG KÊ — tổng quan nguồn lực                                   -->
      <!-- ══════════════════════════════════════════════════════════════════════════ -->
      <div v-if="activeTab === 'stats'">
        <h5 class="fw-semibold mb-4"><i class="bi bi-bar-chart-line text-info me-2"></i>Thống Kê Nguồn Lực</h5>

        <!-- 4 thẻ tóm tắt: tổng mặt hàng, lần phân phối, tồn thấp, tổng đã phát -->
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

        <!-- Progress bar từng mặt hàng — xanh = còn trong kho, lá = đã phát -->
        <div class="card border-0 shadow-sm">
          <div class="card-header fw-semibold bg-white">Tình Trạng Tồn Kho Từng Mặt Hàng</div>
          <div class="card-body">
            <div v-for="item in store.inventory" :key="item.id" class="mb-3">
              <div class="d-flex justify-content-between mb-1">
                <span class="small fw-semibold">{{ item.name }}</span>
                <span class="small text-muted">{{ item.quantity }} {{ item.unit }} còn lại / {{ item.distributed }} đã phát</span>
              </div>
              <!-- Stacked progress bar: 2 phần xanh (tồn kho) + xanh lá (đã phát) -->
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

      <!-- ══════════════════════════════════════════════════════════════════════════ -->
      <!-- MODAL: THÊM MẶT HÀNG VÀO KHO                                            -->
      <!-- @click.self="..." đóng modal khi click vào nền (overlay), không phải card -->
      <!-- ══════════════════════════════════════════════════════════════════════════ -->
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
                <!-- v-model.number tự động convert string → number -->
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
              <!-- doAddItem() validate và gọi addInventoryItem từ store -->
              <button class="btn btn-primary btn-sm flex-fill" @click="doAddItem">Thêm</button>
              <button class="btn btn-secondary btn-sm" @click="showAddItem = false">Hủy</button>
            </div>
          </div>
        </div>
      </div>

      <!-- ══════════════════════════════════════════════════════════════════════════ -->
      <!-- MODAL: SỬA TỒN KHO                                                       -->
      <!-- ══════════════════════════════════════════════════════════════════════════ -->
      <div v-if="showEditItem" class="modal-overlay" @click.self="showEditItem = false">
        <div class="card shadow-lg" style="width:420px">
          <!-- Header hiển thị tên mặt hàng đang sửa -->
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
              <!-- doEditItem() gọi updateInventoryItem từ store -->
              <button class="btn btn-primary btn-sm flex-fill" @click="doEditItem">Lưu</button>
              <button class="btn btn-secondary btn-sm" @click="showEditItem = false">Hủy</button>
            </div>
          </div>
        </div>
      </div>

      <!-- ══════════════════════════════════════════════════════════════════════════ -->
      <!-- MODAL: GHI NHẬN PHÂN PHỐI                                                -->
      <!-- ══════════════════════════════════════════════════════════════════════════ -->
      <div v-if="showDistributeForm" class="modal-overlay" @click.self="showDistributeForm = false">
        <div class="card shadow-lg" style="width:420px">
          <div class="card-header fw-semibold">Ghi Nhận Phân Phối</div>
          <div class="card-body">

            <!-- Chọn mặt hàng — dropdown từ store.inventory -->
            <div class="mb-3">
              <label class="form-label small">Mặt hàng</label>
              <!-- v-model.number tự động parse value thành number -->
              <select v-model.number="distForm.itemId" class="form-select form-select-sm">
                <option value="">-- Chọn mặt hàng --</option>
                <option v-for="item in store.inventory" :key="item.id" :value="item.id">
                  {{ item.name }} (tồn: {{ item.quantity }} {{ item.unit }})
                </option>
              </select>
            </div>

            <!-- Số lượng phân phối -->
            <div class="mb-3">
              <label class="form-label small">Số lượng</label>
              <input v-model.number="distForm.quantity" type="number" class="form-control form-control-sm" min="1" />
            </div>

            <!-- Địa điểm phát hàng -->
            <div class="mb-3">
              <label class="form-label small">Địa điểm phát</label>
              <input v-model="distForm.location" class="form-control form-control-sm" placeholder="Địa điểm phân phối..." />
            </div>

            <!-- Ghi chú thêm -->
            <div class="mb-3">
              <label class="form-label small">Ghi chú</label>
              <input v-model="distForm.note" class="form-control form-control-sm" placeholder="Ghi chú..." />
            </div>

            <!-- Thông báo lỗi validation (ví dụ: số lượng > tồn kho) -->
            <div v-if="distError" class="alert alert-danger py-1 small">{{ distError }}</div>

            <div class="d-flex gap-2">
              <!-- doDistribute() validate + gọi addDistribution từ store -->
              <button class="btn btn-success btn-sm flex-fill" @click="doDistribute">Xác nhận</button>
              <button class="btn btn-secondary btn-sm" @click="showDistributeForm = false">Hủy</button>
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
import { store, logout, addInventoryItem, updateInventoryItem, addDistribution } from '../store/index.js'

const router = useRouter()

// Tab đang hiển thị: 'inventory' | 'distribution' | 'stats'
const activeTab = ref('inventory')

// Cờ hiển thị từng modal
const showAddItem       = ref(false)
const showEditItem      = ref(false)
const showDistributeForm = ref(false)

// Lưu thông báo lỗi khi phân phối không hợp lệ
const distError = ref('')

// Form thêm mặt hàng mới vào kho
const addItemForm = reactive({ name: '', quantity: 0, unit: 'cái', minStock: 10 })

// Form sửa tồn kho (pre-filled từ mặt hàng được chọn)
const editItemForm = reactive({ id: null, name: '', quantity: 0, minStock: 0 })

// Form ghi nhận phân phối
const distForm = reactive({ itemId: '', quantity: 1, location: '', note: '' })

// Danh sách mặt hàng có tồn kho dưới hoặc bằng mức tối thiểu
const lowStockItems = computed(() => store.inventory.filter(i => i.quantity <= i.minStock))

// 4 thẻ thống kê tóm tắt trong tab Stats
const summaryStats = computed(() => [
  { label: 'Tổng mặt hàng',     value: store.inventory.length,                                    icon: 'bi bi-grid-3x3-gap',       color: 'text-primary' },
  { label: 'Lần phân phối',     value: store.distributions.length,                                icon: 'bi bi-truck',               color: 'text-success' },
  { label: 'Tồn kho thấp',      value: lowStockItems.value.length,                                icon: 'bi bi-exclamation-triangle', color: 'text-warning' },
  {
    label: 'Tổng đã phân phối',
    // reduce() tính tổng số lượng tất cả các lần phân phối
    value: store.distributions.reduce((s, d) => s + d.quantity, 0),
    icon: 'bi bi-box-arrow-up', color: 'text-info',
  },
])

// Mở modal Sửa và điền sẵn dữ liệu của mặt hàng được chọn
function selectEditItem(item) {
  Object.assign(editItemForm, { id: item.id, name: item.name, quantity: item.quantity, minStock: item.minStock })
  showEditItem.value = true
}

// Thêm mặt hàng mới — validate tên không được rỗng
function doAddItem() {
  if (!addItemForm.name) return // Không làm gì nếu chưa nhập tên
  addInventoryItem({ name: addItemForm.name, quantity: addItemForm.quantity, unit: addItemForm.unit, minStock: addItemForm.minStock })
  Object.assign(addItemForm, { name: '', quantity: 0, unit: 'cái', minStock: 10 }) // Reset form
  showAddItem.value = false
}

// Lưu thay đổi tồn kho và ngưỡng tối thiểu
function doEditItem() {
  updateInventoryItem(editItemForm.id, { quantity: editItemForm.quantity, minStock: editItemForm.minStock })
  showEditItem.value = false
}

// Mở modal Phân phối và pre-fill mặt hàng được chọn (nếu click từ nút "Phát" trong thẻ hàng)
function selectDistributeItem(item) {
  distForm.itemId = item.id
  showDistributeForm.value = true
}

// Ghi nhận phân phối hàng với đầy đủ validation
function doDistribute() {
  distError.value = ''

  // Validation 1: phải chọn mặt hàng và nhập địa điểm
  if (!distForm.itemId || !distForm.location) { distError.value = 'Vui lòng điền đầy đủ thông tin!'; return }

  // Tìm mặt hàng trong store
  const item = store.inventory.find(i => i.id === Number(distForm.itemId))
  if (!item) return

  // Validation 2: số lượng phát không được vượt tồn kho
  if (distForm.quantity > item.quantity) { distError.value = 'Số lượng phát vượt quá tồn kho!'; return }

  // Gọi store để ghi nhận — tự động trừ kho và cộng distributed
  addDistribution({ itemId: Number(distForm.itemId), itemName: item.name, quantity: distForm.quantity, location: distForm.location, note: distForm.note })
  Object.assign(distForm, { itemId: '', quantity: 1, location: '', note: '' }) // Reset form
  showDistributeForm.value = false
}

function handleLogout() {
  logout()
  router.push('/login')
}
</script>

<style scoped>
/* Overlay nền tối cho tất cả modal — cố định toàn màn hình, z-index cao */
.modal-overlay {
  position: fixed;
  inset: 0;                       /* top:0 right:0 bottom:0 left:0 */
  background: rgba(0,0,0,0.4);   /* Nền đen, trong suốt 40% */
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;                  /* Cao hơn navbar Bootstrap (z-index: 1030) */
}
</style>
