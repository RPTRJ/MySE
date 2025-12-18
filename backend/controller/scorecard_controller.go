package controller

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team14/backend/entity"
	"gorm.io/gorm"
)

type ScorecardController struct {
	DB *gorm.DB
}

func (c *ScorecardController) Create(ctx *gin.Context) {
	var scorecard entity.Scorecard
	if err := ctx.ShouldBindJSON(&scorecard); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := c.DB.Create(&scorecard).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusCreated, scorecard)
}

func (c *ScorecardController) GetAll(ctx *gin.Context) {
	var scorecards []entity.Scorecard
	if err := c.DB.Preload("User").Preload("PortfolioSubmission").Find(&scorecards).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, scorecards)
}

func (c *ScorecardController) GetByID(ctx *gin.Context) {
	id, _ := strconv.Atoi(ctx.Param("id"))
	var scorecard entity.Scorecard
	if err := c.DB.Preload("User").Preload("PortfolioSubmission").First(&scorecard, id).Error; err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	ctx.JSON(http.StatusOK, scorecard)
}