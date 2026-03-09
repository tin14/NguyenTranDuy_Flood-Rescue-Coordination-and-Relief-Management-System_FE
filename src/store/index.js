// Import hàm reactive từ Vue để tạo state có thể theo dõi thay đổi tự động
import { reactive } from 'vue'

// Tên key dùng để lưu/đọc dữ liệu trong localStorage của trình duyệt
const STORAGE_KEY = 'flood_rescue_app'

// Hàm đọc dữ liệu đã lưu từ localStorage (gọi khi trang web load lại)
// Nếu có dữ liệu thì parse JSON và trả về, nếu lỗi hoặc không có thì trả về null
function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) // Lấy chuỗi JSON từ localStorage
    if (saved) return JSON.parse(saved)              // Chuyển chuỗi JSON thành object JS
  } catch {}
  return null // Không có dữ liệu hoặc bị lỗi → trả về null
}

// Hàm tạo dữ liệu mặc định khi chưa có dữ liệu trong localStorage
function defaultState() {
  return {
    currentUser: null, // Người dùng đang đăng nhập (null = chưa đăng nhập)

    // Danh sách tất cả tài khoản trong hệ thống (dữ liệu demo)
    users: [
      { id: 1, name: 'Nguyễn Văn An',    username: 'citizen1', password: '123456',   role: 'citizen',     phone: '0901234567', active: true },
      { id: 2, name: 'Trần Thị Bình',    username: 'citizen2', password: '123456',   role: 'citizen',     phone: '0912345678', active: true },
      { id: 3, name: 'Đội Cứu Hộ A',    username: 'team1',    password: '123456',   role: 'rescue_team', phone: '0923456789', active: true },
      { id: 4, name: 'Đội Cứu Hộ B',    username: 'team2',    password: '123456',   role: 'rescue_team', phone: '0934567890', active: true },
      { id: 5, name: 'Điều Phối Viên 1', username: 'coord1',   password: '123456',   role: 'coordinator', phone: '0945678901', active: true },
      { id: 6, name: 'Quản Lý Kho 1',   username: 'manager1', password: '123456',   role: 'manager',     phone: '0956789012', active: true },
      { id: 7, name: 'Admin Hệ Thống',   username: 'admin',    password: 'admin123', role: 'admin',       phone: '0967890123', active: true },
      // Các role có thể là: citizen | rescue_team | coordinator | manager | admin
      // active: true = tài khoản đang hoạt động, false = bị khóa
    ],

    // Danh sách các yêu cầu cứu hộ (dữ liệu demo có sẵn)
    rescueRequests: [
      {
        id: 1,
        citizenId: 1,                           // ID của người dân gửi yêu cầu (phải khớp với users[].id)
        citizenName: 'Nguyễn Văn An',
        location: '123 Đường Lê Lợi, Phường 3, TP. Cần Thơ',
        coordinates: { lat: 10.0452, lng: 105.7469 }, // Tọa độ GPS để hiển thị bản đồ
        description: 'Nhà tôi bị ngập 1.5m nước, có 3 người già và 2 trẻ em cần được sơ tán gấp.',
        urgency: 'critical',    // Mức độ khẩn cấp: critical | high | medium | low
        status: 'assigned',     // Trạng thái: pending → verified → assigned → in_progress → completed
        assignedTeamId: 3,      // ID đội cứu hộ được phân công (phải khớp với teams[].id)
        assignedTeamName: 'Đội Cứu Hộ A',
        createdAt: '2024-10-15T08:30:00',
        updatedAt: '2024-10-15T09:00:00',
        citizenConfirmed: false, // Người dân đã xác nhận đã được cứu hộ chưa
        image: null,             // Ảnh đính kèm dạng base64 string, null nếu không có
        notes: 'Đã xác minh, mức ngập cao',
      },
      {
        id: 2,
        citizenId: 2,
        citizenName: 'Trần Thị Bình',
        location: '45 Đường Nguyễn Trãi, Phường 7, TP. Cần Thơ',
        coordinates: { lat: 10.0321, lng: 105.7812 },
        description: 'Mắc kẹt trên mái nhà, nước dâng nhanh, cần cứu gấp!',
        urgency: 'critical',
        status: 'pending',       // Đang chờ điều phối viên xác minh
        assignedTeamId: null,    // Chưa được phân công đội nào
        assignedTeamName: null,
        createdAt: '2024-10-15T09:15:00',
        updatedAt: '2024-10-15T09:15:00',
        citizenConfirmed: false,
        image: null,
        notes: '',
      },
      {
        id: 3,
        citizenId: 1,
        citizenName: 'Nguyễn Văn An',
        location: '78 Đường Trần Hưng Đạo, Huyện Vĩnh Thạnh',
        coordinates: { lat: 10.1234, lng: 105.6543 },
        description: 'Cần lương thực và nước uống, nhà bị cô lập 2 ngày nay.',
        urgency: 'high',
        status: 'completed',     // Đã hoàn thành cứu hộ
        assignedTeamId: 4,
        assignedTeamName: 'Đội Cứu Hộ B',
        createdAt: '2024-10-14T14:00:00',
        updatedAt: '2024-10-14T18:30:00',
        citizenConfirmed: true,  // Người dân đã xác nhận
        image: null,
        notes: 'Đã cứu hộ thành công',
      },
    ],

    // Danh sách hàng hóa trong kho cứu trợ
    inventory: [
      { id: 1, name: 'Gạo (kg)',         quantity: 5000, unit: 'kg',    distributed: 1200, minStock: 500 },
      { id: 2, name: 'Nước uống (chai)', quantity: 3000, unit: 'chai',  distributed: 800,  minStock: 300 },
      { id: 3, name: 'Mì tôm (thùng)',  quantity: 500,  unit: 'thùng', distributed: 150,  minStock: 50  },
      { id: 4, name: 'Áo phao',         quantity: 200,  unit: 'cái',   distributed: 45,   minStock: 20  },
      { id: 5, name: 'Thuốc y tế (bộ)', quantity: 100,  unit: 'bộ',    distributed: 30,   minStock: 10  },
      { id: 6, name: 'Chăn mền',        quantity: 300,  unit: 'cái',   distributed: 80,   minStock: 30  },
      // quantity:    số lượng còn trong kho hiện tại
      // distributed: tổng số lượng đã phát ra (lịch sử)
      // minStock:    ngưỡng tồn tối thiểu — nếu quantity <= minStock thì hiện cảnh báo
    ],

    // Lịch sử các lần phân phối hàng cứu trợ (dùng bởi Manager)
    distributions: [
      { id: 1, itemId: 1, itemName: 'Gạo (kg)',         quantity: 500, location: 'Phường 3, TP. Cần Thơ', date: '2024-10-14', note: 'Phát cho 50 hộ' },
      { id: 2, itemId: 2, itemName: 'Nước uống (chai)', quantity: 300, location: 'Huyện Vĩnh Thạnh',      date: '2024-10-14', note: 'Phát cho 30 hộ' },
      { id: 3, itemId: 1, itemName: 'Gạo (kg)',         quantity: 700, location: 'Phường 7, TP. Cần Thơ', date: '2024-10-15', note: 'Phát cho 70 hộ' },
      // itemId: phải khớp với inventory[].id để biết đây là mặt hàng nào
    ],

    // Thông tin các đội cứu hộ
    teams: [
      { id: 3, name: 'Đội Cứu Hộ A', memberCount: 8, status: 'busy',      currentTask: 1,    vehicles: ['Xuồng máy 01', 'Xe tải 01'] },
      { id: 4, name: 'Đội Cứu Hộ B', memberCount: 6, status: 'available', currentTask: null, vehicles: ['Xuồng máy 02'] },
      // QUAN TRỌNG: id của team phải trùng với id của user tương ứng trong mảng users
      // status: 'available' = sẵn sàng nhận nhiệm vụ, 'busy' = đang bận
      // currentTask: ID của yêu cầu cứu hộ đang thực hiện, null nếu rảnh
      // vehicles: danh sách tên phương tiện được gán cho đội này
    ],

    // Kho phương tiện — Coordinator điều phối gán cho các đội cứu hộ
    vehicles: [
      { id: 1, name: 'Xuồng máy 01', type: 'Xuồng máy',  status: 'assigned',  assignedTeamId: 3, assignedTeamName: 'Đội Cứu Hộ A' },
      { id: 2, name: 'Xe tải 01',    type: 'Xe tải',     status: 'assigned',  assignedTeamId: 3, assignedTeamName: 'Đội Cứu Hộ A' },
      { id: 3, name: 'Xuồng máy 02', type: 'Xuồng máy',  status: 'assigned',  assignedTeamId: 4, assignedTeamName: 'Đội Cứu Hộ B' },
      { id: 4, name: 'Xuồng máy 03', type: 'Xuồng máy',  status: 'available', assignedTeamId: null, assignedTeamName: null },
      { id: 5, name: 'Xe tải 02',    type: 'Xe tải',     status: 'available', assignedTeamId: null, assignedTeamName: null },
      { id: 6, name: 'Trực thăng 01',type: 'Trực thăng', status: 'available', assignedTeamId: null, assignedTeamName: null },
      // status: 'available' = sẵn sàng | 'assigned' = đang gán cho đội
    ],

    // Phiếu phân phối hàng cứu trợ cho đội — do Coordinator thực hiện
    // vehicleId/vehicleName: phương tiện được chọn để vận chuyển (null = chưa chỉ định)
    supplyOrders: [
      { id: 1, itemId: 1, itemName: 'Gạo (kg)',         quantity: 500, teamId: 3, teamName: 'Đội Cứu Hộ A', vehicleId: 1, vehicleName: 'Xuồng máy 01', date: '2024-10-14', note: 'Phát cho 50 hộ tại Phường 3' },
      { id: 2, itemId: 2, itemName: 'Nước uống (chai)', quantity: 300, teamId: 4, teamName: 'Đội Cứu Hộ B', vehicleId: 3, vehicleName: 'Xuồng máy 02', date: '2024-10-14', note: 'Phát cho 30 hộ tại Huyện Vĩnh Thạnh' },
      { id: 3, itemId: 1, itemName: 'Gạo (kg)',         quantity: 700, teamId: 3, teamName: 'Đội Cứu Hộ A', vehicleId: 2, vehicleName: 'Xe tải 01',    date: '2024-10-15', note: 'Phát cho 70 hộ tại Phường 7' },
    ],

    // Bộ đếm ID tự tăng — đảm bảo mỗi record mới có ID duy nhất
    nextId: {
      user:         8, // ID tiếp theo khi thêm người dùng mới
      request:      4, // ID tiếp theo khi tạo yêu cầu cứu hộ mới
      inventory:    7, // ID tiếp theo khi thêm mặt hàng mới vào kho
      distribution: 4, // ID tiếp theo khi ghi nhận phân phối (Manager)
      vehicle:      7, // ID tiếp theo khi thêm phương tiện mới
      supplyOrder:  4, // ID tiếp theo khi Coordinator tạo phiếu phân phối
    }
  }
}

// Đọc state đã lưu từ localStorage; nếu chưa có thì dùng dữ liệu mặc định
function initState() {
  const saved = loadState()
  if (!saved) return defaultState()
  // Đảm bảo các trường mới (vehicles, supplyOrders) tồn tại nếu dữ liệu cũ chưa có
  const def = defaultState()
  if (!saved.vehicles)     saved.vehicles     = def.vehicles
  if (!saved.supplyOrders) saved.supplyOrders = def.supplyOrders
  if (!saved.nextId.vehicle)     saved.nextId.vehicle     = def.nextId.vehicle
  if (!saved.nextId.supplyOrder) saved.nextId.supplyOrder = def.nextId.supplyOrder
  // Đảm bảo teams có trường vehicles
  if (saved.teams) {
    saved.teams.forEach(team => {
      if (!team.vehicles) team.vehicles = []
    })
  }
  return saved
}

// reactive() bọc object lại để Vue có thể theo dõi thay đổi và tự động cập nhật UI
export const store = reactive(initState())

// ─── Hàm lưu state vào localStorage ────────────────────────────────────────
// Gọi sau mỗi thao tác thay đổi dữ liệu để đảm bảo không mất khi reload trang
export function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store)) // Object → JSON string → lưu
  } catch {}
}

// ─── Đăng nhập ──────────────────────────────────────────────────────────────
// Tìm user khớp username + password và đang active
// Trả về object user nếu thành công, null nếu sai thông tin hoặc bị khóa
export function login(username, password) {
  const user = store.users.find(u => u.username === username && u.password === password && u.active)
  if (user) {
    store.currentUser = user // Lưu thông tin người dùng vào state toàn cục
    saveState()
    return user
  }
  return null // Đăng nhập thất bại
}

// ─── Đăng xuất ──────────────────────────────────────────────────────────────
export function logout() {
  store.currentUser = null // Xóa thông tin người dùng → router guard sẽ redirect về /login
  saveState()
}

// ─── Tạo yêu cầu cứu hộ mới ─────────────────────────────────────────────────
// req: object có các trường { citizenId, citizenName, location, description, urgency, createdAt, image, coordinates }
export function addRescueRequest(req) {
  const id = store.nextId.request++ // Lấy ID tiếp theo, sau đó tăng bộ đếm lên 1
  const newReq = {
    ...req,                           // Sao chép toàn bộ thuộc tính từ req vào object mới
    id,
    status: 'pending',                // Trạng thái ban đầu luôn là "chờ xác minh"
    assignedTeamId: null,             // Chưa có đội nào được phân công
    assignedTeamName: null,
    citizenConfirmed: false,          // Người dân chưa xác nhận hoàn thành
    updatedAt: new Date().toISOString(),
    notes: '',
  }
  store.rescueRequests.push(newReq)  // Thêm vào mảng yêu cầu trong store
  saveState()
  return newReq
}

// ─── Cập nhật trạng thái yêu cầu cứu hộ ────────────────────────────────────
// Dùng cho cả 3 role: coordinator (xác minh/phân công/hủy), rescue_team (bắt đầu/hoàn thành)
// Các tham số sau status đều là tùy chọn (undefined = không thay đổi)
export function updateRequestStatus(id, status, notes, teamId, teamName) {
  const req = store.rescueRequests.find(r => r.id === id) // Tìm yêu cầu theo ID
  if (req) {
    req.status = status
    if (notes !== undefined)    req.notes = notes            // Chỉ cập nhật nếu có truyền tham số
    if (teamId !== undefined)   req.assignedTeamId = teamId
    if (teamName !== undefined) req.assignedTeamName = teamName
    req.updatedAt = new Date().toISOString()

    // Nếu có phân công đội mới → đánh dấu đội đó là "đang bận"
    if (teamId) {
      const team = store.teams.find(t => t.id === teamId)
      if (team) { team.status = 'busy'; team.currentTask = id }
    }

    // Nếu hoàn thành → đánh dấu đội cứu hộ trở lại trạng thái "sẵn sàng"
    if (status === 'completed') {
      const team = store.teams.find(t => t.id === req.assignedTeamId)
      if (team) { team.status = 'available'; team.currentTask = null }
    }

    saveState()
  }
}

// ─── Người dân xác nhận đã được cứu hộ ─────────────────────────────────────
export function confirmRescue(requestId) {
  const req = store.rescueRequests.find(r => r.id === requestId)
  if (req) {
    req.citizenConfirmed = true       // Đánh dấu người dân đã xác nhận
    req.updatedAt = new Date().toISOString()
    saveState()
  }
}

// ─── Thêm mặt hàng mới vào kho ──────────────────────────────────────────────
// item: { name, quantity, unit, minStock }
export function addInventoryItem(item) {
  const id = store.nextId.inventory++
  store.inventory.push({ ...item, id, distributed: 0 }) // distributed bắt đầu từ 0 vì chưa phát
  saveState()
}

// ─── Cập nhật thông tin mặt hàng (số lượng tồn, ngưỡng tối thiểu) ───────────
export function updateInventoryItem(id, updates) {
  const item = store.inventory.find(i => i.id === id)
  if (item) {
    Object.assign(item, updates) // Ghi đè các trường được truyền vào, giữ nguyên phần còn lại
    saveState()
  }
}

// ─── Ghi nhận phân phối hàng cứu trợ (Manager) ──────────────────────────────
// dist: { itemId, itemName, quantity, location, note }
export function addDistribution(dist) {
  const id = store.nextId.distribution++
  const item = store.inventory.find(i => i.id === dist.itemId)
  if (item) {
    item.quantity -= dist.quantity
    item.distributed += dist.quantity
    store.distributions.push({
      ...dist,
      id,
      date: new Date().toISOString().slice(0, 10),
    })
    saveState()
  }
}

// ─── Thêm người dùng mới ────────────────────────────────────────────────────
// user: { name, username, password, role, phone }
export function addUser(user) {
  const id = store.nextId.user++
  store.users.push({ ...user, id, active: true }) // Tài khoản mới mặc định được kích hoạt
  saveState()
}

// ─── Cập nhật thông tin người dùng ──────────────────────────────────────────
// Dùng để sửa tên, role, SĐT hoặc khóa/mở khóa tài khoản (trường active)
export function updateUser(id, updates) {
  const user = store.users.find(u => u.id === id)
  if (user) {
    Object.assign(user, updates)
    saveState()
  }
}

// ─── Thêm phương tiện mới vào kho ───────────────────────────────────────────
// vehicle: { name, type }
export function addVehicle(vehicle) {
  const id = store.nextId.vehicle++
  store.vehicles.push({ ...vehicle, id, status: 'available', assignedTeamId: null, assignedTeamName: null })
  saveState()
}

// ─── Gán phương tiện cho đội cứu hộ (Coordinator) ───────────────────────────
export function assignVehicle(vehicleId, teamId, teamName) {
  const vehicle = store.vehicles.find(v => v.id === vehicleId)
  const team = store.teams.find(t => t.id === teamId)
  if (vehicle && team) {
    vehicle.status = 'assigned'
    vehicle.assignedTeamId = teamId
    vehicle.assignedTeamName = teamName
    // Thêm tên phương tiện vào danh sách vehicles của đội
    if (!team.vehicles) team.vehicles = []
    if (!team.vehicles.includes(vehicle.name)) {
      team.vehicles.push(vehicle.name)
    }
    saveState()
  }
}

// ─── Thu hồi phương tiện về kho (Coordinator) ───────────────────────────────
export function unassignVehicle(vehicleId) {
  const vehicle = store.vehicles.find(v => v.id === vehicleId)
  if (vehicle) {
    // Xóa tên phương tiện khỏi danh sách vehicles của đội
    const team = store.teams.find(t => t.id === vehicle.assignedTeamId)
    if (team && team.vehicles) {
      team.vehicles = team.vehicles.filter(v => v !== vehicle.name)
    }
    vehicle.status = 'available'
    vehicle.assignedTeamId = null
    vehicle.assignedTeamName = null
    saveState()
  }
}

// ─── Coordinator tạo phiếu phân phối hàng cho đội cứu hộ ────────────────────
// order: { itemId, itemName, quantity, teamId, teamName, vehicleId, vehicleName, note }
// Tự động trừ số lượng trong kho và cộng số lượng đã phát
export function addSupplyOrder(order) {
  const id = store.nextId.supplyOrder++
  const item = store.inventory.find(i => i.id === order.itemId)
  if (item) {
    item.quantity -= order.quantity
    item.distributed += order.quantity
    store.supplyOrders.push({
      ...order,
      id,
      date: new Date().toISOString().slice(0, 10),
    })
    saveState()
  }
}
