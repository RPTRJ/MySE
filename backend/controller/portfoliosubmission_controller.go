package controller

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team14/backend/entity"
	"gorm.io/gorm"
)

type PortfolioSubmissionController struct {
	DB *gorm.DB
}

// ===================== CRUD พื้นฐาน =====================

func (c *PortfolioSubmissionController) Create(ctx *gin.Context) {
	var submission entity.PortfolioSubmission
	if err := ctx.ShouldBindJSON(&submission); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := c.DB.Create(&submission).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusCreated, submission)
}

func (c *PortfolioSubmissionController) GetAll(ctx *gin.Context) {
	var submissions []entity.PortfolioSubmission
	if err := c.DB.Preload("User").Preload("Portfolio").Find(&submissions).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, submissions)
}

func (c *PortfolioSubmissionController) GetByID(ctx *gin.Context) {
	id, _ := strconv.Atoi(ctx.Param("id"))
	var submission entity.PortfolioSubmission
	if err := c.DB.Preload("User").Preload("Portfolio").First(&submission, id).Error; err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	ctx.JSON(http.StatusOK, submission)
}

//อันนี้คือการแก้ไข submission ทั้งหมด
func (c *PortfolioSubmissionController) Update(ctx *gin.Context) {
	id, _ := strconv.Atoi(ctx.Param("id"))
	var submission entity.PortfolioSubmission
	if err := c.DB.First(&submission, id).Error; err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	if err := ctx.ShouldBindJSON(&submission); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.DB.Save(&submission)
	ctx.JSON(http.StatusOK, submission)
}

func (c *PortfolioSubmissionController) Delete(ctx *gin.Context) {
	id, _ := strconv.Atoi(ctx.Param("id"))
	if err := c.DB.Delete(&entity.PortfolioSubmission{}, id).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"message": "deleted"})
}

// ===================== เพิ่มเติม =====================

// ดึงตามสถานะ
func (c *PortfolioSubmissionController) GetByStatus(ctx *gin.Context) {
	status := ctx.Param("status")
	var submissions []entity.PortfolioSubmission
	if err := c.DB.Preload("User").Preload("Portfolio").
		Where("status = ? AND is_current_version = ?", status, true).Find(&submissions).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, submissions)
}

// mark เป็น reviewed
func (c *PortfolioSubmissionController) MarkAsReviewed(ctx *gin.Context) {
	id, _ := strconv.Atoi(ctx.Param("id"))
	var submission entity.PortfolioSubmission
	if err := c.DB.Preload("User").Preload("Portfolio").First(&submission, id).Error; err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	submission.Status = "reviewed"
	now := time.Now()
	submission.ReviewedAt = &now
	if err := c.DB.Save(&submission).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, submission)
}

// mark เป็น approved
func (c *PortfolioSubmissionController) MarkAsApproved(ctx *gin.Context) {
	id, _ := strconv.Atoi(ctx.Param("id"))
	var submission entity.PortfolioSubmission
	if err := c.DB.Preload("User").Preload("Portfolio").First(&submission, id).Error; err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	submission.Status = "approved"
	now := time.Now()
	submission.ApprovedAt = &now
	if err := c.DB.Save(&submission).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, submission)
}

// update status โดยตรง
func (c *PortfolioSubmissionController) UpdateStatus(ctx *gin.Context) {
	id, _ := strconv.Atoi(ctx.Param("id"))
	var submission entity.PortfolioSubmission
	if err := c.DB.Preload("User").Preload("Portfolio").First(&submission, id).Error; err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}

	var body struct {
		Status string `json:"status"`
	}
	if err := ctx.ShouldBindJSON(&body); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	submission.Status = body.Status
	if err := c.DB.Save(&submission).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, submission)
}