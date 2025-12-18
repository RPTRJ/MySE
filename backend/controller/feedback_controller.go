package controller

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team14/backend/entity"
	"gorm.io/gorm"
)

type FeedbackController struct {
	DB *gorm.DB
}

func (c *FeedbackController) Create(ctx *gin.Context) {
	var feedback entity.Feedback
	if err := ctx.ShouldBindJSON(&feedback); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := c.DB.Create(&feedback).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusCreated, feedback)
}

func (c *FeedbackController) GetAll(ctx *gin.Context) {
	var feedbacks []entity.Feedback
	if err := c.DB.Preload("User").Preload("PortfolioSubmission").Find(&feedbacks).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, feedbacks)
}

func (c *FeedbackController) GetByID(ctx *gin.Context) {
	id, _ := strconv.Atoi(ctx.Param("id"))
	var feedback entity.Feedback
	if err := c.DB.Preload("User").Preload("PortfolioSubmission").First(&feedback, id).Error; err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	ctx.JSON(http.StatusOK, feedback)
}