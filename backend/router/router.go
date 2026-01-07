package router

import (
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/sut68/team14/backend/config"
	"github.com/sut68/team14/backend/controller"
	"github.com/sut68/team14/backend/middlewares"
	"github.com/sut68/team14/backend/services"
)

func SetupRoutes() *gin.Engine {

	r := gin.Default()

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// --- CORS Config ---
	corsConfig := cors.DefaultConfig()
	corsConfig.AllowOriginFunc = func(origin string) bool {
		if strings.HasPrefix(origin, "http://localhost") {
			return true
		}
		if strings.HasPrefix(origin, "http://127.0.0.1") {
			return true
		}
		if strings.HasPrefix(origin, "http://192.168") {
			return true
		}
		if strings.HasPrefix(origin, "http://10.") {
			return true
		}
		if strings.HasPrefix(origin, "http://169.254") {
			return true
		}
		return true // FOR DEBUGGING: Allow all origins to rule out CORS config issue temporarily
	}
	corsConfig.AllowMethods = []string{"GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"}
	corsConfig.AllowHeaders = []string{"Origin", "Content-Type", "Authorization", "Accept", "User-Agent", "Cache-Control", "Pragma"}
	corsConfig.ExposeHeaders = []string{"Content-Length"}
	corsConfig.AllowCredentials = true
	corsConfig.MaxAge = 12 * time.Hour
	r.Use(cors.New(corsConfig))

	// Serve static files
	r.Static("/uploads", "./uploads")

	// --- Init Services & Controllers ---
	db := config.GetDB()
	authService := services.NewAuthService(db)
	authController := controller.NewAuthController(authService)
	userController := controller.NewUserController()
	curriculumController := controller.NewCurriculumController()
	facultyController := controller.NewFacultyController()
	programController := controller.NewProgramController()
	selectionController := controller.NewSelectionController()
	profileController := controller.NewProfileController(db)
	referenceController := controller.NewReferenceController(db)
	educationAdminController := controller.NewEducationAdminController(db)
	courseGroupController := controller.NewCourseGroupController()

	// --- Public Routes ---
	authController.RegisterRoutes(r)
	r.GET("/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "pong"})
	})

	// Upload Route (Public)
	uploadController := controller.NewUploadController()
	r.POST("/upload", uploadController.UploadFile)

	// --- Protected Routes (ต้อง Login) ---
	protected := r.Group("")
	protected.Use(middlewares.Authorization())
	userController.RegisterSelfRoutes(protected)

	protected.GET("/reference/education-levels", referenceController.GetEducationLevels)
	protected.GET("/reference/school-types", referenceController.GetSchoolTypes)
	protected.GET("/reference/curriculum-types", referenceController.GetCurriculumTypes)
	protected.GET("/reference/schools", referenceController.SearchSchools)

	// --- User Profile (full profile) ---
	protected.GET("/users/me/profile", profileController.GetMe)
	protected.GET("/users/me/onboarding", profileController.GetOnboardingStatus)

	protected.PUT("/users/me", profileController.UpdateMe)
	protected.PUT("/users/me/profile-image", profileController.UpdateProfileImage) // ← เพิ่มใหม่
	protected.PUT("/users/me/education", profileController.UpsertEducation)
	protected.PUT("/users/me/academic-score", profileController.UpsertAcademicScore)
	protected.PUT("/users/me/ged-score", profileController.UpsertGEDScore)
	protected.PUT("/users/me/language-scores", profileController.ReplaceLanguageScores)

	// --- Onboarded Routes (ต้องผ่านการ Onboard) ---
	protectedOnboarded := protected.Group("")
	protectedOnboarded.Use(middlewares.RequireOnboarding())

	// --- Teacher Protected Routes ---เฟื่องเพิ่มตรงนี้
	teacher := protectedOnboarded.Group("/teacher")
	{
		teacher.GET("/users/:id/profile", profileController.GetUserProfile)
	}

	userController.RegisterRoutes(protectedOnboarded)

	// Register Routes เดิมของคุณ
	curriculumController.RegisterRoutes(r, protectedOnboarded)
	facultyController.RegisterRoutes(r, protected)
	programController.RegisterRoutes(r, protected)
	courseGroupController.RegisterRoutes(r, protectedOnboarded)

	// Selection & Notification Routes
	r.POST("/selections", selectionController.ToggleSelection)
	r.GET("/selections", selectionController.GetMySelections)
	r.POST("/selections/notify", selectionController.ToggleNotification)
	r.GET("/notifications", selectionController.GetNotifications)
	r.PATCH("/notifications/:id/read", selectionController.MarkAsRead)

	// ✅✅✅ Admin Routes Group  ✅✅✅
	admin := r.Group("/admin")
	{
		// API สำหรับดึงสถิติ
		admin.GET("/curricula/stats", curriculumController.GetSelectionStats)
	}

	// Other Routes
	// เรียกใช้ฟังก์ชัน routes ต่างๆ ที่นี่
	//ระบบเทมเพลต
	TemplateBlockRoutes(r)
	TemplateSectionsRoutes(r)
	SectionBlockRoutes(r)
	TemplateRoutes(r)
	CategoryTemplateRoutes(r)

	//ระบบแฟ้มสะสมผลงาน (Portfolio)
	PortfolioRoutes(protected)

	ColorsRoutes(r)

	WorkingRoutes(protected)
	ActivityRoutes(protected)
	FontRoutes(r)

	//ของScorecard
	RegisterCriteriaScoreRoutes(r, db)
	RegisterEvaluationRoutes(r, db)
	RegisterFeedbackRoutes(r, db)
	RegisterPortfolioSubmissionRoutes(r, db)
	RegisterScoreCriteriaRoutes(r, db)
	RegisterScorecardRoutes(r, db)

	// --- Admin Protected Routes ---
	adminProtected := protectedOnboarded.Group("/admin")
	{
		adminProtected.GET("/users/:id/profile", profileController.GetUserProfile)
	}

	// Education reference management (admin)
	educationAdminController.RegisterRoutes(protectedOnboarded)

	//ของประกาศ
	AnnouncementRouter(r)
	CetagoryRouter(r)
	AttachmentRouter(r)
	AdminLogRouter(r)

	return r
}
