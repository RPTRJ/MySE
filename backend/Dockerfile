# Go Image เวอร์ชัน 1.24 สำหรับการ Build แอปพลิเคชัน
FROM golang:1.24-alpine AS builder

#
WORKDIR /app

# คัดลอกไฟล์ go.mod และ go.sum เพื่อดาวน์โหลด dependencies
COPY go.mod go.sum ./
RUN go mod download

# คัดลอกโค้ดทั้งหมดไปยัง container
COPY . .

#สร้างไบนารีของแอปและวางไว้ที่ /se-68-api
RUN go build -o main .

# สร้าง Image ใหม่สำหรับรันแอปพลิเคชัน
FROM alpine:latest
WORKDIR /app

# คัดลอกเฉพาะไฟล์ไบนารีมาจาก builder
COPY --from=builder /app/main .

#เปิดพอร์ต 8080
EXPOSE 8080

#เริ่มทำงาน คำสั่งตอนที่ container รัน
CMD ["./main"]