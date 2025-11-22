package controller

import (
	"net/http"
	"time"

	"github.com/RPTRJ/MySE/backend/config"
	"github.com/RPTRJ/MySE/backend/entity"
	"github.com/RPTRJ/MySE/backend/services"
	"github.com/gin-gonic/gin"
)

type LoginPayload struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type RegisterPayload struct {
	FirstNameTH     string `json:"first_name_th" binding:"required"`
	LastNameTH      string `json:"last_name_th" binding:"required"`
	FirstNameEN     string `json:"first_name_en"`
	LastNameEN      string `json:"last_name_en"`
	Email           string `json:"email" binding:"required,email"`
	Password        string `json:"password" binding:"required,min=6"`
	ProfileImageURL string `json:"profile_image_url"`
	IDNumber        string `json:"id_number"`
	Phone           string `json:"phone"`
	Birthday        string `json:"birthday" binding:"required,datetime=2006-01-02"`
	PDPAConsent     bool   `json:"pdpa_consent"`
	AccountTypeID   uint   `json:"type_id" binding:"required"`
	IDDocTypeID     uint   `json:"id_type" binding:"required"`
}

type AuthController struct {
	service *services.AuthService
}

func NewAuthController(service *services.AuthService) *AuthController {
	return &AuthController{service: service}
}

func (ac *AuthController) RegisterRoutes(router gin.IRoutes) {
	router.POST("/login", ac.Login)
	router.POST("/register", ac.Register)
}

func (ac *AuthController) Login(c *gin.Context) {
	var payload LoginPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := ac.service.Authenticate(payload.Email, payload.Password)
	if err != nil {
		status := http.StatusInternalServerError
		if err == services.ErrInvalidCredentials {
			status = http.StatusUnauthorized
		}
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}

	token, err := ac.service.GenerateToken(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token": token,
		"user":  user,
	})
}

func (ac *AuthController) Register(c *gin.Context) {
	var payload RegisterPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	birthday, err := time.Parse("2006-01-02", payload.Birthday)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid birthday format"})
		return
	}

	hashedPassword, err := config.HashPassword(payload.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to hash password"})
		return
	}

	user := &entity.User{
		FirstNameTH:     payload.FirstNameTH,
		LastNameTH:      payload.LastNameTH,
		FirstNameEN:     payload.FirstNameEN,
		LastNameEN:      payload.LastNameEN,
		Email:           payload.Email,
		Password:        hashedPassword,
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

	created, err := ac.service.Register(user)
	if err != nil {
		status := http.StatusInternalServerError
		if err.Error() == "email already in use" {
			status = http.StatusConflict
		}
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}

	token, err := ac.service.GenerateToken(created)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate token"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"token": token,
		"user":  created,
	})
}
