package controller

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team14/backend/config"
	"github.com/sut68/team14/backend/entity"
	"gorm.io/datatypes"
)

// GetActivities fetches activities for the user WITH FULL DETAILS
func GetActivities(c *gin.Context) {
	userID := c.Query("user_id")
	var activities []entity.Activity
	
	db := config.GetDB()
	if userID != "" {
		db = db.Where("user_id = ?", userID)
	}
	
	// ✅ IMPORTANT: Preload ALL related data including images
	if err := db.
		Preload("ActivityDetail").
		Preload("ActivityDetail.TypeActivity").
		Preload("ActivityDetail.LevelActivity").
		Preload("ActivityDetail.Images").  // ✅ เพิ่ม Preload Images
		Preload("Reward").
		Preload("User").
		Find(&activities).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": activities})
}

// GetWorkings fetches workings for the user WITH FULL DETAILS
func GetWorkings(c *gin.Context) {
	userID := c.Query("user_id")
	var workings []entity.Working
	
	db := config.GetDB()
	if userID != "" {
		db = db.Where("user_id = ?", userID)
	}

	// ✅ IMPORTANT: Preload ALL related data including images and links
	if err := db.
		Preload("WorkingDetail").
		Preload("WorkingDetail.TypeWorking").
		Preload("WorkingDetail.Images").  // ✅ เพิ่ม Preload Images
		Preload("WorkingDetail.Links").   // ✅ เพิ่ม Preload Links
		Preload("User").
		Find(&workings).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": workings})
}

// CreateTemplate creates a new template
func CreateTemplates(c *gin.Context) {
	var template entity.Templates
	if err := c.ShouldBindJSON(&template); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := config.GetDB().Create(&template).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": template})
}

// CreatePortfolio creates a new Portfolio (Custom/Empty)
func CreatePortfolio(c *gin.Context) {
	var portfolio entity.Portfolio
	if err := c.ShouldBindJSON(&portfolio); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Default values
	if portfolio.Status == "" {
		portfolio.Status = "draft"
	}
	
	// Ensure UserID
	if portfolio.UserID == 0 {
		var user entity.User
		if err := config.GetDB().First(&user).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "No users found"})
			return
		}
		portfolio.UserID = user.ID
	}

	// Ensure Color exists
	if portfolio.ColorsID == 0 {
		var color entity.Colors
		if err := config.GetDB().First(&color).Error; err == nil {
			portfolio.ColorsID = color.ID
		}
	}
	// Ensure Font exists
	if portfolio.FontID == 0 {
		var font entity.Font
		if err := config.GetDB().First(&font).Error; err == nil {
			portfolio.FontID = font.ID
		}
	}

	// Try to create
	if err := config.GetDB().Create(&portfolio).Error; err != nil {
		fmt.Println("⚠️ CreatePortfolio Error:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": portfolio})
}

// UseTemplate creates a new Portfolio based on a Template OR returns existing one
func UseTemplate(c *gin.Context) {
	id := c.Param("id")
	var template entity.Templates
	if err := config.GetDB().
		Preload("TemplateSectionLinks.TemplatesSection.SectionBlocks.TemplatesBlock").
		First(&template, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Template not found"})
		return
	}

	// Find valid user
	var user entity.User
	if err := config.GetDB().First(&user).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No users found"})
		return
	}

	// ✅ เช็คว่ามี Portfolio สำหรับ template นี้อยู่แล้วหรือไม่
	var existingPortfolio entity.Portfolio
	err := config.GetDB().
		Preload("PortfolioSections.PortfolioBlocks").
		Where("user_id = ? AND template_id = ?", user.ID, template.ID).
		First(&existingPortfolio).Error

	if err == nil {
		// ✅ มี Portfolio อยู่แล้ว - ส่งกลับไป
		fmt.Println("✅ Found existing portfolio for template:", template.ID)
		c.JSON(http.StatusOK, gin.H{
			"data": existingPortfolio,
			"message": "Using existing portfolio with saved sections",
		})
		return
	}

	// ✅ ไม่มี Portfolio สำหรับ template นี้ - สร้างใหม่
	fmt.Println("🆕 Creating new portfolio for template:", template.ID)

	portfolio := entity.Portfolio{
		PortfolioName: "My Portfolio from " + template.TemplateName,
		Status:        "draft",
		TemplateID:    &template.ID,
		UserID:        user.ID,
	}

	// Ensure Color
	var color entity.Colors
	if err := config.GetDB().First(&color).Error; err != nil {
		color = entity.Colors{
			ColorsName:      "Default",
			PrimaryColor:    "#000000",
			SecondaryColor:  "#FFFFFF",
			BackgroundColor: "#F0F0F0",
			HexValue:        "#000000",
		}
		config.GetDB().Create(&color)
	}
	portfolio.ColorsID = color.ID

	// Ensure Font
	var font entity.Font
	if err := config.GetDB().First(&font).Error; err != nil {
		font = entity.Font{
			FontName:     "Roboto",
			FontFamily:   "Roboto, sans-serif",
			FontCategory: "sans-serif",
			IsActive:     true,
		}
		config.GetDB().Create(&font)
	}
	portfolio.FontID = font.ID

	// Create Portfolio
	if err := config.GetDB().Create(&portfolio).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Copy Sections from Template
	for _, link := range template.TemplateSectionLinks {
		ts := link.TemplatesSection
		
		ps := entity.PortfolioSection{
			SectionTitle:    ts.SectionName,
			SectionPortKey:  ts.SectionName,
			IsEnabled:       true,
			SectionOrder:    int(link.OrderIndex),
			PortfolioID:     portfolio.ID,
		}
		
		if err := config.GetDB().Create(&ps).Error; err != nil {
			continue
		}
		
		// Copy Blocks
		for _, sb := range ts.SectionBlocks {
			pb := entity.PortfolioBlock{
				BlockPortType:      sb.TemplatesBlock.BlockType,
				BlockOrder:         sb.OrderIndex,
				PortfolioSectionID: ps.ID,
				Content:            sb.TemplatesBlock.DefaultContent,
			}
			config.GetDB().Create(&pb)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"data": portfolio,
		"message": "New portfolio created with template sections",
	})
}

// GetMyPortfolio - ดึง Portfolio ทั้งหมดของ user
func GetMyPortfolio(c *gin.Context) {
	userID := "1" // Hardcoded for dev

	var portfolios []entity.Portfolio
	if err := config.GetDB().
		Preload("PortfolioSections.PortfolioBlocks").
		Where("user_id = ?", userID).
		Order("updated_at desc").
		Find(&portfolios).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": portfolios})
}

// CreatePortfolioSection creates a new section for a portfolio
func CreatePortfolioSection(c *gin.Context) {
	var section entity.PortfolioSection
	if err := c.ShouldBindJSON(&section); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := config.GetDB().Create(&section).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": section})
}

// UpdatePortfolioSection updates a portfolio section
func UpdatePortfolioSection(c *gin.Context) {
	id := c.Param("id")
	var input entity.PortfolioSection
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var section entity.PortfolioSection
	if err := config.GetDB().First(&section, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Section not found"})
		return
	}

	// Update fields
	config.GetDB().Model(&section).Updates(input)

	c.JSON(http.StatusOK, gin.H{"data": section})
}

// ✅ CreatePortfolioBlock - สร้าง Block ใหม่
func CreatePortfolioBlock(c *gin.Context) {
	var payload struct {
		PortfolioSectionID uint           `json:"portfolio_section_id"`
		BlockOrder         int            `json:"block_order"`
		Content            datatypes.JSON `json:"content"`
	}

	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	block := entity.PortfolioBlock{
		PortfolioSectionID: payload.PortfolioSectionID,
		BlockOrder:         payload.BlockOrder,
		Content:            payload.Content,
		BlockPortType:      "text", // Default to text for now
	}

	if err := config.GetDB().Create(&block).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": block})
}

// ✅ UpdatePortfolioBlock - แก้ไข Block
func UpdatePortfolioBlock(c *gin.Context) {
	id := c.Param("id")
	
	var payload struct {
		Content    datatypes.JSON `json:"content"`
		BlockOrder int            `json:"block_order"`
	}

	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var block entity.PortfolioBlock
	if err := config.GetDB().First(&block, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Block not found"})
		return
	}

	// Update fields
	if payload.Content != nil {
		block.Content = payload.Content
	}
	if payload.BlockOrder > 0 {
		block.BlockOrder = payload.BlockOrder
	}

	if err := config.GetDB().Save(&block).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": block})
}

// ✅ DeletePortfolioBlock - ลบ Block
func DeletePortfolioBlock(c *gin.Context) {
	id := c.Param("id")
	
	if err := config.GetDB().Delete(&entity.PortfolioBlock{}, id).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Block deleted successfully"})
}
