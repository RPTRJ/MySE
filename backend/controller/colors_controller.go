package controller

import (
	"net/http"
	"github.com/sut68/team14/backend/entity"
	"github.com/gin-gonic/gin"
	"github.com/sut68/team14/backend/config"
)

// // สร้าง struct เพื่อเก็บ DB Connection
// type ColorController struct {
// 	DB *gorm.DB
// }

// ฟังก์ชันสำหรับดึงข้อมูลสีทั้งหมด
// func (ctrl *ColorController) GetAllColors(c *gin.Context) {
// 	var colors []entity.Colors // เตรียมตัวแปร slice มารับข้อมูล

// 	// คำสั่ง GORM ง่ายๆ: ค้นหา (Find) ข้อมูลทั้งหมดในตาราง Colors
// 	// แล้วเอาผลลัพธ์ไปใส่ในตัวแปร colors
// 	if err := ctrl.DB.Find(&colors).Error; err != nil {
// 		// ถ้ามี error (เช่น ต่อ DB ไม่ได้) ให้ส่ง 500 กลับไป
// 		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
// 		return
// 	}

// 	// ถ้าสำเร็จ ส่งข้อมูลกลับไปเป็น JSON พร้อม status 200 OK
// 	c.JSON(http.StatusOK, gin.H{
// 		"status": "success",
// 		"data":   colors,
// 	})
// }
func GetAllColors(c *gin.Context) {
	var colors []entity.Colors
	if err := config.GetDB().Find(&colors).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data":   colors,
	})
}	
