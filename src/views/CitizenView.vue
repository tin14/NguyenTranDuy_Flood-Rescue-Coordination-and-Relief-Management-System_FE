<template>
  <div>
    <!-- NavBar nhận prop user và lắng nghe sự kiện logout -->
    <NavBar :user="store.currentUser" @logout="handleLogout" />

    <div class="container py-4">

      <!-- ═══ Thống kê nhanh (3 thẻ trên cùng) ═══════════════════════════════ -->
      <div class="row g-3 mb-4">

        <!-- Thẻ 1: Số yêu cầu đang chờ (pending + verified) -->
        <div class="col-md-4">
          <div class="card border-0 shadow-sm bg-warning bg-opacity-10">
            <div class="card-body d-flex align-items-center gap-3">
              <i class="bi bi-hourglass-split text-warning fs-1"></i>
              <div>
                <!-- myStats.pending được tính từ computed bên dưới -->
                <div class="fs-3 fw-bold text-warning">{{ myStats.pending }}</div>
                <div class="text-muted small">Đang chờ xử lý</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Thẻ 2: Số yêu cầu đang được cứu hộ (assigned + in_progress) -->
        <div class="col-md-4">
          <div class="card border-0 shadow-sm bg-primary bg-opacity-10">
            <div class="card-body d-flex align-items-center gap-3">
              <i class="bi bi-truck text-primary fs-1"></i>
              <div>
                <div class="fs-3 fw-bold text-primary">{{ myStats.inProgress }}</div>
                <div class="text-muted small">Đang cứu hộ</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Thẻ 3: Số yêu cầu đã hoàn thành -->
        <div class="col-md-4">
          <div class="card border-0 shadow-sm bg-success bg-opacity-10">
            <div class="card-body d-flex align-items-center gap-3">
              <i class="bi bi-check-circle text-success fs-1"></i>
              <div>
                <div class="fs-3 fw-bold text-success">{{ myStats.completed }}</div>
                <div class="text-muted small">Đã hoàn thành</div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <div class="row g-4">

        <!-- ═══ Form gửi yêu cầu cứu hộ (cột trái) ═══════════════════════════ -->
        <div class="col-lg-5">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-header bg-danger text-white fw-semibold">
              <i class="bi bi-sos me-2"></i>Gửi Yêu Cầu Cứu Hộ
            </div>
            <div class="card-body">

              <!-- Thông báo gửi thành công — hiện khi requestSent = true -->
              <div v-if="requestSent" class="alert alert-success">
                <i class="bi bi-check-circle me-2"></i>Yêu cầu đã được gửi thành công! Chúng tôi sẽ liên hệ sớm nhất.
                <!-- Nút để ẩn thông báo và cho phép gửi yêu cầu mới -->
                <button class="btn btn-sm btn-success ms-2" @click="requestSent = false">Gửi yêu cầu mới</button>
              </div>

              <!-- Form gửi yêu cầu — chỉ hiện khi chưa gửi hoặc đã reset -->
              <!-- v-else = ngược với v-if ở trên -->
              <form v-else @submit.prevent="submitRequest">

                <!-- Trường địa chỉ (bắt buộc) -->
                <div class="mb-3">
                  <label class="form-label fw-semibold">Địa chỉ / Vị trí <span class="text-danger">*</span></label>
                  <div class="input-group">
                    <span class="input-group-text"><i class="bi bi-geo-alt"></i></span>
                    <input v-model="form.location" class="form-control" placeholder="Số nhà, đường, phường/xã, quận/huyện..." required />
                  </div>
                  <!-- Nút mở Google Maps — chỉ hiện khi đã nhập địa chỉ -->
                  <!-- encodeURIComponent() mã hóa chuỗi để dùng an toàn trong URL -->
                  <a v-if="form.location"
                     :href="`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(form.location)}`"
                     target="_blank"
                     class="btn btn-sm btn-outline-secondary mt-1">
                    <i class="bi bi-map me-1"></i>Xem trên Google Maps
                  </a>
                </div>

                <!-- Trường mô tả tình trạng (bắt buộc) -->
                <div class="mb-3">
                  <label class="form-label fw-semibold">Mô tả tình trạng <span class="text-danger">*</span></label>
                  <textarea v-model="form.description" class="form-control" rows="3" placeholder="Mô tả chi tiết tình trạng, số người cần cứu hộ..." required></textarea>
                </div>

                <!-- Dropdown chọn mức độ khẩn cấp -->
                <div class="mb-3">
                  <label class="form-label fw-semibold">Mức độ khẩn cấp</label>
                  <select v-model="form.urgency" class="form-select">
                    <option value="critical">🔴 Khẩn cấp - Nguy hiểm tính mạng</option>
                    <option value="high">🟠 Cao - Cần hỗ trợ ngay</option>
                    <option value="medium">🟡 Trung bình - Cần hỗ trợ trong ngày</option>
                    <option value="low">🟢 Thấp - Cần hỗ trợ lương thực/nước</option>
                  </select>
                </div>

                <!-- Trường số điện thoại (tùy chọn) -->
                <!-- LƯU Ý: trường này có trong form nhưng chưa được lưu vào store -->
                <div class="mb-3">
                  <label class="form-label fw-semibold">Số điện thoại liên hệ</label>
                  <div class="input-group">
                    <span class="input-group-text"><i class="bi bi-telephone"></i></span>
                    <input v-model="form.phone" class="form-control" placeholder="Số điện thoại" />
                  </div>
                </div>

                <!-- Upload ảnh — @change gọi handleImage để đọc file và tạo preview -->
                <div class="mb-3">
                  <label class="form-label fw-semibold">Hình ảnh (tuỳ chọn)</label>
                  <input type="file" class="form-control" accept="image/*" @change="handleImage" />
                  <!-- Preview ảnh — chỉ hiện khi đã chọn file -->
                  <div v-if="form.imagePreview" class="mt-2">
                    <img :src="form.imagePreview" class="img-thumbnail" style="max-height:150px" />
                  </div>
                </div>

                <!-- Nút gửi yêu cầu -->
                <button type="submit" class="btn btn-danger w-100 py-2 fw-semibold">
                  <i class="bi bi-send me-2"></i>Gửi Yêu Cầu Cứu Hộ
                </button>

              </form>
            </div>
          </div>
        </div>

        <!-- ═══ Danh sách yêu cầu của tôi (cột phải) ══════════════════════════ -->
        <div class="col-lg-7">
          <div class="card border-0 shadow-sm">
            <div class="card-header bg-white fw-semibold d-flex justify-content-between align-items-center">
              <span><i class="bi bi-list-check me-2 text-primary"></i>Yêu Cầu Của Tôi</span>
              <!-- Badge hiển thị tổng số yêu cầu -->
              <span class="badge bg-primary rounded-pill">{{ myRequests.length }}</span>
            </div>
            <div class="card-body p-0">

              <!-- State rỗng — hiện khi chưa có yêu cầu nào -->
              <div v-if="myRequests.length === 0" class="text-center text-muted py-5">
                <i class="bi bi-inbox fs-1 d-block mb-2"></i>Chưa có yêu cầu nào
              </div>

              <!-- Danh sách yêu cầu — mỗi item là một list-group-item -->
              <div v-else class="list-group list-group-flush">
                <div v-for="req in myRequests" :key="req.id" class="list-group-item p-3">

                  <!-- Hàng trên: badge trạng thái + badge mức độ + ngày tạo -->
                  <div class="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <!-- StatusBadge component — type mặc định = 'status' -->
                      <StatusBadge :status="req.status" class="me-1" />
                      <!-- StatusBadge với type='urgency' dùng bảng màu khẩn cấp -->
                      <StatusBadge :status="req.urgency" type="urgency" />
                    </div>
                    <small class="text-muted">{{ formatDate(req.createdAt) }}</small>
                  </div>

                  <!-- Địa chỉ -->
                  <div class="d-flex gap-2 mb-1">
                    <i class="bi bi-geo-alt-fill text-danger mt-1"></i>
                    <span class="small">{{ req.location }}</span>
                  </div>

                  <!-- Mô tả -->
                  <div class="text-muted small mb-2">{{ req.description }}</div>

                  <!-- Tên đội cứu hộ được phân công — chỉ hiện khi đã được phân công -->
                  <div v-if="req.assignedTeamName" class="d-flex gap-2 text-primary small mb-2">
                    <i class="bi bi-people-fill mt-1"></i>
                    <span>Đội cứu hộ: <strong>{{ req.assignedTeamName }}</strong></span>
                  </div>

                  <!-- Ghi chú từ điều phối viên hoặc đội cứu hộ -->
                  <div v-if="req.notes" class="alert alert-info py-1 px-2 small mb-2">
                    <i class="bi bi-info-circle me-1"></i>{{ req.notes }}
                  </div>

                  <!-- Nút xác nhận — chỉ hiện khi: status='completed' VÀ chưa xác nhận -->
                  <div v-if="req.status === 'completed' && !req.citizenConfirmed" class="mt-2">
                    <button class="btn btn-success btn-sm" @click="confirmRescue(req.id)">
                      <i class="bi bi-check2-circle me-1"></i>Xác nhận đã được cứu hộ
                    </button>
                  </div>

                  <!-- Thông báo đã xác nhận — chỉ hiện sau khi citizen bấm xác nhận -->
                  <div v-if="req.citizenConfirmed" class="text-success small">
                    <i class="bi bi-check-circle-fill me-1"></i>Bạn đã xác nhận hoàn thành
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
// ref: biến reactive đơn giản | computed: giá trị tính toán tự động từ state
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import NavBar from '../components/NavBar.vue'
import StatusBadge from '../components/StatusBadge.vue'
// Import store (để đọc dữ liệu) và các hàm thao tác
import { store, logout, addRescueRequest, confirmRescue as confirmRescueStore } from '../store/index.js'

const router = useRouter()

// Dữ liệu form gửi yêu cầu — object reactive chứa tất cả trường
const form = ref({
  location: '',       // Địa chỉ cần cứu hộ
  description: '',    // Mô tả chi tiết tình trạng
  urgency: 'high',    // Mức độ mặc định là 'high'
  phone: '',          // Số điện thoại (chưa được lưu vào store)
  imagePreview: null, // Base64 string của ảnh đã chọn, null nếu chưa chọn
})

// Cờ hiển thị thông báo thành công sau khi gửi yêu cầu
const requestSent = ref(false)

// computed: tự lọc danh sách yêu cầu của người dùng hiện tại
// Sắp xếp mới nhất lên đầu (sort giảm dần theo createdAt)
const myRequests = computed(() =>
  store.rescueRequests
    .filter(r => r.citizenId === store.currentUser?.id) // Chỉ lấy yêu cầu của mình
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) // Mới nhất lên đầu
)

// computed: đếm số yêu cầu theo từng nhóm trạng thái cho 3 thẻ thống kê
const myStats = computed(() => ({
  pending:    myRequests.value.filter(r => ['pending', 'verified'].includes(r.status)).length,    // Chờ xử lý
  inProgress: myRequests.value.filter(r => ['assigned', 'in_progress'].includes(r.status)).length, // Đang cứu hộ
  completed:  myRequests.value.filter(r => r.status === 'completed').length,                       // Hoàn thành
}))

// Xử lý khi người dùng chọn ảnh — đọc file và tạo base64 preview
function handleImage(e) {
  const file = e.target.files[0]
  if (!file) return
  const reader = new FileReader() // API của trình duyệt để đọc file cục bộ
  // Callback khi đọc xong — ev.target.result là chuỗi base64
  reader.onload = ev => { form.value.imagePreview = ev.target.result }
  reader.readAsDataURL(file) // Đọc file dưới dạng Data URL (base64)
}

// Xử lý khi submit form gửi yêu cầu
function submitRequest() {
  // Tạo yêu cầu mới trong store với thông tin từ form
  addRescueRequest({
    citizenId:   store.currentUser.id,    // ID người dùng hiện tại
    citizenName: store.currentUser.name,  // Tên người dùng
    location:    form.value.location,
    description: form.value.description,
    urgency:     form.value.urgency,
    createdAt:   new Date().toISOString(), // Thời gian tạo = hiện tại
    image:       form.value.imagePreview,  // Ảnh base64 hoặc null
    coordinates: null,                     // GPS chưa tích hợp tự động → null
    // LƯU Ý: form.value.phone không được truyền vào — BUG cần sửa
  })

  // Reset form về trạng thái ban đầu
  form.value = { location: '', description: '', urgency: 'high', phone: '', imagePreview: null }

  // Hiện thông báo thành công
  requestSent.value = true
}

// Gọi hàm confirmRescue từ store khi người dùng bấm "Xác nhận đã được cứu hộ"
function confirmRescue(id) {
  confirmRescueStore(id) // Cập nhật citizenConfirmed = true trong store
}

// Xử lý đăng xuất
function handleLogout() {
  logout()              // Xóa currentUser trong store
  router.push('/login') // Điều hướng về trang đăng nhập
}

// Format timestamp ISO thành định dạng ngày giờ Việt Nam
// Ví dụ: "2024-10-15T08:30:00" → "15/10/2024, 08:30:00"
function formatDate(dt) {
  return new Date(dt).toLocaleString('vi-VN')
}
</script>
