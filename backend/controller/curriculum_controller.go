package controller

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team14/backend/config"
	"github.com/sut68/team14/backend/entity"
	"gorm.io/gorm"
)

type CurriculumController struct {
	db *gorm.DB
}

func NewCurriculumController() *CurriculumController {
	return &CurriculumController{
		db: config.GetDB(),
	}
}

// -------------------- ROUTES --------------------

func (cc *CurriculumController) RegisterRoutes(r *gin.Engine, protected *gin.RouterGroup) {
	// Public: สำหรับนักเรียนค้นหาหลักสูตร
	public := r.Group("/curricula")
	{
		public.GET("", cc.ListPublishedCurricula)
		public.GET("/:id", cc.GetCurriculumByID)
	}

	// Protected: สำหรับแอดมินจัดการหลักสูตร + summary + faculties/programs
	admin := protected.Group("/admin")
	{
		admin.GET("/curricula", cc.ListAllCurricula)
		admin.POST("/curricula", cc.CreateCurriculum)
		admin.PUT("/curricula/:id", cc.UpdateCurriculum)
		admin.DELETE("/curricula/:id", cc.DeleteCurriculum)
		admin.GET("/curricula/summary", cc.GetCurriculumSummary)
	}
}

// -------------------- HANDLERS (Student) --------------------

// ListPublishedCurricula : ใช้ในหน้าค้นหาฝั่งนักเรียน
func (cc *CurriculumController) ListPublishedCurricula(c *gin.Context) {
	search := c.Query("search")
	activeStatuses := []string{"open", "opening", "published"}

	// ✅ แก้ไขชื่อตารางเป็น "curriculums" (ตามที่ GORM สร้างให้)
	query := cc.db.
		Model(&entity.Curriculum{}).
		Select("curriculums.*"). 
		Preload("Faculty").
		Preload("Program").
		Preload("RequiredDocuments.DocumentType").
		Joins("LEFT JOIN faculties ON faculties.id = curriculums.faculty_id").
		Joins("LEFT JOIN programs ON programs.id = curriculums.program_id").
		Where("curriculums.status IN ?", activeStatuses)

	if search != "" {
		like := "%" + search + "%"
		query = query.Where(
			"curriculums.name LIKE ? OR curriculums.code LIKE ? OR curriculums.description LIKE ? OR faculties.name LIKE ? OR programs.name LIKE ?",
			like, like, like, like, like,
		)
	}

	var curricula []entity.Curriculum
	if err := query.Find(&curricula).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": curricula})
}

func (cc *CurriculumController) GetCurriculumByID(c *gin.Context) {
	id := c.Param("id")

	var curriculum entity.Curriculum
	if err := cc.db.
		Preload("Faculty").
		Preload("Program").
		Preload("RequiredDocuments.DocumentType").
		Preload("Skills.Skill").
		First(&curriculum, id).Error; err != nil {

		c.JSON(http.StatusNotFound, gin.H{"error": "curriculum not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": curriculum})
}

// -------------------- HANDLERS (Admin CRUD) --------------------

func (cc *CurriculumController) ListAllCurricula(c *gin.Context) {
	search := c.Query("search")

	// ✅ แก้ไขชื่อตารางเป็น "curriculums" เช่นกัน
	query := cc.db.
		Model(&entity.Curriculum{}).
		Select("curriculums.*").
		Preload("Faculty").
		Preload("Program").
		Preload("RequiredDocuments.DocumentType").
		Joins("LEFT JOIN faculties ON faculties.id = curriculums.faculty_id").
		Joins("LEFT JOIN programs ON programs.id = curriculums.program_id")

	if search != "" {
		like := "%" + search + "%"
		query = query.Where(
			"curriculums.name LIKE ? OR curriculums.code LIKE ? OR curriculums.description LIKE ? OR faculties.name LIKE ? OR programs.name LIKE ?",
			like, like, like, like, like,
		)
	}

	var curricula []entity.Curriculum
	if err := query.Find(&curricula).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": curricula})
}

// Payload และฟังก์ชัน Create/Update/Delete คงเดิม
type CurriculumPayload struct {
	Code              string  `json:"code"`
	Name              string  `json:"name"`
	Description       string  `json:"description"`
	Link              string  `json:"link"`
	GPAXMin           float32 `json:"gpax_min"`
	PortfolioMaxPages int     `json:"portfolio_max_pages"`
	Status            string  `json:"status"`
	FacultyID         uint    `json:"faculty_id"`
	ProgramID         uint    `json:"program_id"`
	UserID            uint    `json:"user_id"`
	ApplicationPeriod string  `json:"application_period"`
	Quota             int     `json:"quota"`
}

func (cc *CurriculumController) CreateCurriculum(c *gin.Context) {
	var payload CurriculumPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		log.Printf("CreateCurriculum bind error: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	cur := entity.Curriculum{
		Code:              payload.Code,
		Name:              payload.Name,
		Description:       payload.Description,
		Link:              payload.Link,
		GPAXMin:           payload.GPAXMin,
		PortfolioMaxPages: payload.PortfolioMaxPages,
		Status:            payload.Status,
		FacultyID:         payload.FacultyID,
		ProgramID:         payload.ProgramID,
		UserID:            payload.UserID,
		ApplicationPeriod: payload.ApplicationPeriod,
		Quota:             payload.Quota,
	}

	if err := cc.db.Create(&cur).Error; err != nil {
		log.Printf("CreateCurriculum DB error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": cur})
}

func (cc *CurriculumController) UpdateCurriculum(c *gin.Context) {
	id := c.Param("id")

	var payload CurriculumPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		log.Printf("UpdateCurriculum bind error: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var cur entity.Curriculum
	if err := cc.db.First(&cur, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "curriculum not found"})
		return
	}

	cur.Code = payload.Code
	cur.Name = payload.Name
	cur.Description = payload.Description
	cur.Link = payload.Link
	cur.GPAXMin = payload.GPAXMin
	cur.PortfolioMaxPages = payload.PortfolioMaxPages
	cur.Status = payload.Status
	cur.FacultyID = payload.FacultyID
	cur.ProgramID = payload.ProgramID
	cur.UserID = payload.UserID
	cur.ApplicationPeriod = payload.ApplicationPeriod
	cur.Quota = payload.Quota

	if err := cc.db.Save(&cur).Error; err != nil {
		log.Printf("UpdateCurriculum DB error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": cur})
}

func (cc *CurriculumController) DeleteCurriculum(c *gin.Context) {
	id := c.Param("id")

	if err := cc.db.Delete(&entity.Curriculum{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": true})
}

// -------------------- SUMMARY (Admin Report) --------------------

type ProgramStat struct {
	ProgramName  string `json:"program_name"`
	StudentCount int64  `json:"student_count"`
}

type CurriculumSummaryResponse struct {
	TotalCurricula int64         `json:"total_curricula"`
	OpenCurricula  int64         `json:"open_curricula"`
	TotalStudents  int64         `json:"total_students"`
	ByProgram      []ProgramStat `json:"by_program"`
}

func (cc *CurriculumController) GetCurriculumSummary(c *gin.Context) {
	var total, open int64
	cc.db.Model(&entity.Curriculum{}).Count(&total)

	activeStatuses := []string{"open", "opening", "published"}
	cc.db.Model(&entity.Curriculum{}).Where("status IN ?", activeStatuses).Count(&open)

	var totalStudents int64
	cc.db.Model(&entity.Education{}).Count(&totalStudents)

	var stats []ProgramStat
	// ✅ แก้ไขชื่อตาราง Join ในส่วน Summary ด้วยครับ
	cc.db.Table("educations").
		Joins("JOIN curriculums ON educations.curriculum_id = curriculums.id").
		Joins("JOIN programs ON curriculums.program_id = programs.id").
		Select("programs.name as program_name, COUNT(*) as student_count").
		Group("programs.id, programs.name").
		Scan(&stats)

	resp := CurriculumSummaryResponse{
		TotalCurricula: total,
		OpenCurricula:  open,
		TotalStudents:  totalStudents,
		ByProgram:      stats,
	}

	c.JSON(http.StatusOK, gin.H{"data": resp})
}