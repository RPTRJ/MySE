package controller

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team14/backend/entity"
	"gorm.io/gorm"
)



type EvaluationController struct {
	DB *gorm.DB
}

func (c *EvaluationController) Create(ctx *gin.Context) {
	var eval entity.Evaluation
	if err := ctx.ShouldBindJSON(&eval); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := c.DB.Create(&eval).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusCreated, eval)
}

func (c *EvaluationController) GetAll(ctx *gin.Context) {
	var evals []entity.Evaluation
	if err := c.DB.Preload("User").Preload("PortfolioSubmission").Preload("Scorecard").Find(&evals).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, evals)
}

func (c *EvaluationController) GetByID(ctx *gin.Context) {
	id, _ := strconv.Atoi(ctx.Param("id"))
	var eval entity.Evaluation
	if err := c.DB.Preload("User").Preload("PortfolioSubmission").Preload("Scorecard").First(&eval, id).Error; err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	ctx.JSON(http.StatusOK, eval)
}