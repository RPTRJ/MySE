package controller

import (
	"errors"
	"net/http"
	"strconv"
	"time"

	"github.com/RPTRJ/MySE/backend/config"
	"github.com/RPTRJ/MySE/backend/entity"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

const birthdayLayout = "2006-01-02"

type UserPayload struct {
	FirstNameTH     string `json:"first_name_th" binding:"required"`
	LastNameTH      string `json:"last_name_th" binding:"required"`
	FirstNameEN     string `json:"first_name_en"`
	LastNameEN      string `json:"last_name_en"`
	Email           string `json:"email" binding:"required,email"`
	Password        string `json:"password"`
	ProfileImageURL string `json:"profile_image_url"`
	IDNumber        string `json:"id_number"`
	Phone           string `json:"phone"`
	Birthday        string `json:"birthday" binding:"required,datetime=2006-01-02"`
	PDPAConsent     bool   `json:"pdpa_consent"`
	AccountTypeID   uint   `json:"type_id" binding:"required"`
	IDDocTypeID     uint   `json:"id_type" binding:"required"`
}

type UserController struct {
	db *gorm.DB
}

func NewUserController() *UserController {
	return &UserController{
		db: config.GetDB(),
	}
}

func (uc *UserController) RegisterRoutes(router gin.IRoutes) {
	router.GET("/users", uc.ListUsers)
	router.GET("/users/:id", uc.GetUser)
	router.POST("/users", uc.CreateUser)
	router.PUT("/users/:id", uc.UpdateUser)
	router.DELETE("/users/:id", uc.DeleteUser)
}

func (uc *UserController) ListUsers(c *gin.Context) {
	var users []entity.User
	if err := uc.db.Preload("AccountType").Preload("IDDocType").Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": users})
}

func (uc *UserController) GetUser(c *gin.Context) {
	id, err := parseUintParam(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user id"})
		return
	}

	var user entity.User
	if err := uc.db.Preload("AccountType").Preload("IDDocType").First(&user, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": user})
}

func (uc *UserController) CreateUser(c *gin.Context) {
	var payload UserPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	birthday, err := time.Parse(birthdayLayout, payload.Birthday)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid birthday format"})
		return
	}

	passwordHash, err := config.HashPassword(payload.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to hash password"})
		return
	}

	user := entity.User{
		FirstNameTH:     payload.FirstNameTH,
		LastNameTH:      payload.LastNameTH,
		FirstNameEN:     payload.FirstNameEN,
		LastNameEN:      payload.LastNameEN,
		Email:           payload.Email,
		Password:        passwordHash,
		ProfileImageURL: payload.ProfileImageURL,
		IDNumber:        payload.IDNumber,
		Phone:           payload.Phone,
		Birthday:        birthday,
		PDPAConsent:     payload.PDPAConsent,
		AccountTypeID:   payload.AccountTypeID,
		IDDocTypeID:     payload.IDDocTypeID,
	}

	if payload.PDPAConsent {
		now := time.Now()
		user.PDPAConsentAt = &now
	}

	if err := uc.db.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": user})
}

func (uc *UserController) UpdateUser(c *gin.Context) {
	id, err := parseUintParam(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user id"})
		return
	}

	var payload UserPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user entity.User
	if err := uc.db.First(&user, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	birthday, err := time.Parse(birthdayLayout, payload.Birthday)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid birthday format"})
		return
	}

	user.FirstNameTH = payload.FirstNameTH
	user.LastNameTH = payload.LastNameTH
	user.FirstNameEN = payload.FirstNameEN
	user.LastNameEN = payload.LastNameEN
	user.Email = payload.Email
	if payload.Password != "" {
		passwordHash, err := config.HashPassword(payload.Password)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to hash password"})
			return
		}
		user.Password = passwordHash
	}
	user.ProfileImageURL = payload.ProfileImageURL
	user.IDNumber = payload.IDNumber
	user.Phone = payload.Phone
	user.Birthday = birthday
	user.PDPAConsent = payload.PDPAConsent
	if payload.PDPAConsent {
		now := time.Now()
		user.PDPAConsentAt = &now
	} else {
		user.PDPAConsentAt = nil
	}
	user.AccountTypeID = payload.AccountTypeID
	user.IDDocTypeID = payload.IDDocTypeID

	if err := uc.db.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": user})
}

func (uc *UserController) DeleteUser(c *gin.Context) {
	id, err := parseUintParam(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user id"})
		return
	}

	if err := uc.db.Delete(&entity.User{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Status(http.StatusNoContent)
}

func parseUintParam(value string) (uint, error) {
	id, err := strconv.ParseUint(value, 10, 64)
	if err != nil {
		return 0, err
	}
	return uint(id), nil
}
