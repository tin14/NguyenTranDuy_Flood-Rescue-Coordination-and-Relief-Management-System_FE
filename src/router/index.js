// Import các hàm cần thiết từ Vue Router
import { createRouter, createWebHashHistory } from 'vue-router'
// Import store để kiểm tra người dùng đang đăng nhập và role của họ
import { store } from '../store/index.js'

// Import tất cả các trang (View components)
import LoginView from '../views/LoginView.vue'
import CitizenView from '../views/CitizenView.vue'
import RescueTeamView from '../views/RescueTeamView.vue'
import CoordinatorView from '../views/CoordinatorView.vue'
import ManagerView from '../views/ManagerView.vue'
import AdminView from '../views/AdminView.vue'

// Mapping từ role → đường dẫn URL tương ứng
// Dùng để redirect về trang đúng sau khi đăng nhập hoặc khi truy cập sai trang
const roleRoutes = {
  citizen:      '/citizen',     // Người dân → /citizen
  rescue_team:  '/team',        // Đội cứu hộ → /team
  coordinator:  '/coordinator', // Điều phối viên → /coordinator
  manager:      '/manager',     // Quản lý kho → /manager
  admin:        '/admin',       // Quản trị viên → /admin
}

// Định nghĩa các route (đường dẫn) trong ứng dụng
const routes = [
  { path: '/',            redirect: '/login'               }, // Truy cập trang gốc → chuyển về /login
  { path: '/login',       component: LoginView,      meta: { public: true }                    }, // Trang đăng nhập — không cần đăng nhập
  { path: '/citizen',     component: CitizenView,    meta: { roles: ['citizen']      }         }, // Chỉ role 'citizen' được vào
  { path: '/team',        component: RescueTeamView, meta: { roles: ['rescue_team'] }          }, // Chỉ role 'rescue_team' được vào
  { path: '/coordinator', component: CoordinatorView,meta: { roles: ['coordinator'] }          }, // Chỉ role 'coordinator' được vào
  { path: '/manager',     component: ManagerView,    meta: { roles: ['manager']     }          }, // Chỉ role 'manager' được vào
  { path: '/admin',       component: AdminView,      meta: { roles: ['admin']       }          }, // Chỉ role 'admin' được vào
]

// Tạo router với lịch sử dạng hash (URL có dấu # — phù hợp deploy tĩnh không cần server config)
// Ví dụ URL: http://localhost:5173/#/login
const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

// ─── Navigation Guard (bảo vệ route) ────────────────────────────────────────
// Chạy trước mỗi lần chuyển trang, kiểm tra quyền truy cập
router.beforeEach((to, from, next) => {
  // Nếu trang đích là public (ví dụ /login) → cho đi thẳng, không cần kiểm tra
  if (to.meta.public) return next()

  // Nếu chưa đăng nhập → bắt buộc về trang đăng nhập
  if (!store.currentUser) return next('/login')

  // Nếu trang yêu cầu role cụ thể mà user không có role đó
  // → redirect về trang đúng với role của user
  if (to.meta.roles && !to.meta.roles.includes(store.currentUser.role)) {
    return next(roleRoutes[store.currentUser.role] || '/login')
  }

  // Tất cả điều kiện đã thỏa → cho phép điều hướng
  next()
})

// Export roleRoutes để dùng ở LoginView.vue (redirect sau đăng nhập)
export { roleRoutes }
export default router
