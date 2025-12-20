# T14 ระบบจัดการแฟ้มสะสมผลงานออนไลน์ (Online Portfolio Management System)
## สมาชิกในทีม

| รหัสนักศึกษา| ชื่อ - นามสกุล | ระบบย่อย |
|---------------|------------------|------------------|
| B6600907 | นางสาววรัทยา ปัตตะเน | ระบบจัดการเทมเพลต & ระบบตกแต่ง Portfolio |
| B6606053 | นางสาวญาณัจฉรา บุตรดี | ระบบตรวจทานและรับรองโดยอาจารย์ & ระบบประกาศและประชาสัมพันธ์ข่าวสาร |
| B6611897 | นายรพีพงศ์ สุโขพรธีรจิต  | ระบบจัดการข้อมูลส่วนตัวผู้ใช้ & ระบบแนะนำทักษะความพร้อมในการเข้าเรียน  |
| B6628857 | นายอาระดิน สีสุระ | ระบบจัดการข้อมูลหลักสูตร & ระบบบริหารรอบสมัครและปฏิทิน |
| B6643829 | นายนพรุจ อสัมภินพงศ์ | ระบบจัดการคลังผลงาน & ระบบจัดการคลังกิจกรรม  |

### ติดตั้ง Go dependencies (backend)

ให้เปิดเทอร์มินัลแล้วเข้าไปที่โฟลเดอร์ `backend` ก่อน

```bash
cd backend

# ติดตั้ง library หลักที่โปรเจกต์ใช้
go get github.com/gin-gonic/gin            # Web framework (REST API)
go get gorm.io/gorm                        # ORM หลัก
go get gorm.io/driver/postgres             # GORM driver สำหรับ PostgreSQL
go get golang.org/x/crypto/bcrypt          # ใช้ hash/check password

# (แนะนำ) จัดระเบียบ go.mod/go.sum ให้ตรงกับโค้ดล่าสุด
go mod tidy

 How to run

cd backend
go run cmd/seed/main.go
go run main.go