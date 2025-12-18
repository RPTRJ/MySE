package controller

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"github.com/sut68/team14/backend/entity"

)

type CriteriaScoreController struct {
	DB *gorm.DB
}

func (c *CriteriaScoreController) Create(ctx *gin.Context) {
	var score entity.CriteriaScore
	if err := ctx.ShouldBindJSON(&score); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := c.DB.Create(&score).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusCreated, score)
}

func (c *CriteriaScoreController) GetAll(ctx *gin.Context) {
	var scores []entity.CriteriaScore
	if err := c.DB.Preload("ScoreCriteria").Find(&scores).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, scores)
}

func (c *CriteriaScoreController) GetByID(ctx *gin.Context) {
	id, _ := strconv.Atoi(ctx.Param("id"))
	var score entity.CriteriaScore
	if err := c.DB.Preload("ScoreCriteria").First(&score, id).Error; err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	ctx.JSON(http.StatusOK, score)
}