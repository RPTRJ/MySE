package controller

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team14/backend/config"
	"github.com/sut68/team14/backend/entity"
	"gorm.io/gorm"
)

type AdviceController struct {
	db *gorm.DB
}

func NewAdviceController() *AdviceController {
	return &AdviceController{
		db: config.GetDB(),
	}
}

func (ac *AdviceController) RegisterRoutes(teacher *gin.RouterGroup) {
	teacher.GET("/advice", ac.listAdvice)
	teacher.POST("/advice", ac.createAdvice)
	teacher.PUT("/advice/:id", ac.updateAdvice)
	teacher.DELETE("/advice/:id", ac.deleteAdvice)

	teacher.GET("/advice/skills", ac.listSkills)
	teacher.POST("/advice/skills", ac.createSkill)
	teacher.PUT("/advice/skills/:id", ac.updateSkill)
	teacher.DELETE("/advice/skills/:id", ac.deleteSkill)

	teacher.GET("/advice/courses", ac.listCourses)
	teacher.POST("/advice/courses", ac.createCourse)
	teacher.PUT("/advice/courses/:id", ac.updateCourse)
	teacher.DELETE("/advice/courses/:id", ac.deleteCourse)
}

// ===== Advice =====

type advicePayload struct {
	ProgramCode   string `json:"program_code"`
	ProgramNameTH string `json:"program_name_th"`
	ProgramNameEN string `json:"program_name_en"`
	Description   string `json:"description"`
	IconURL       string `json:"icon_url"`
	DurationYears int    `json:"duration_years"`
	TotalCredits  int    `json:"total_credits"`
	IsActive      bool   `json:"is_active"`
	SkillIDs      []uint `json:"skill_ids"`
	CourseIDs     []uint `json:"course_ids"`
}

func (ac *AdviceController) listAdvice(c *gin.Context) {
	var advices []entity.Advice
	if err := ac.db.
		Preload("AdviceSkills.Skill").
		Preload("AdviceCourses.Course").
		Order("id desc").
		Find(&advices).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": advices})
}

func (ac *AdviceController) createAdvice(c *gin.Context) {
	var payload advicePayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	adv := entity.Advice{
		ProgramCode:   payload.ProgramCode,
		ProgramNameTH: payload.ProgramNameTH,
		ProgramNameEN: payload.ProgramNameEN,
		Description:   payload.Description,
		IconURL:       payload.IconURL,
		DurationYears: payload.DurationYears,
		TotalCredits:  payload.TotalCredits,
		IsActive:      payload.IsActive,
	}

	err := ac.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&adv).Error; err != nil {
			return err
		}

		if len(payload.CourseIDs) > 0 {
			var links []entity.AdviceCourse
			for _, cid := range payload.CourseIDs {
				links = append(links, entity.AdviceCourse{
					AdviceID: adv.ID,
					CourseID: cid,
					// optional fields left zeroed (semester/year/is_required)
				})
			}
			if err := tx.Create(&links).Error; err != nil {
				return err
			}
		}

		if len(payload.SkillIDs) > 0 {
			var links []entity.AdviceSkill
			for _, sid := range payload.SkillIDs {
				links = append(links, entity.AdviceSkill{
					AdviceID: adv.ID,
					SkillID:  sid,
				})
			}
			if err := tx.Create(&links).Error; err != nil {
				return err
			}
		}

		return nil
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// reload with relations
	ac.db.Preload("AdviceSkills.Skill").Preload("AdviceCourses.Course").First(&adv, adv.ID)
	c.JSON(http.StatusCreated, gin.H{"data": adv})
}

func (ac *AdviceController) updateAdvice(c *gin.Context) {
	id := c.Param("id")
	var payload advicePayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var adv entity.Advice
	if err := ac.db.First(&adv, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "advice not found"})
		return
	}

	adv.ProgramCode = payload.ProgramCode
	adv.ProgramNameTH = payload.ProgramNameTH
	adv.ProgramNameEN = payload.ProgramNameEN
	adv.Description = payload.Description
	adv.IconURL = payload.IconURL
	adv.DurationYears = payload.DurationYears
	adv.TotalCredits = payload.TotalCredits
	adv.IsActive = payload.IsActive

	err := ac.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Save(&adv).Error; err != nil {
			return err
		}

		// reset links
		if err := tx.Where("advice_id = ?", adv.ID).Delete(&entity.AdviceCourse{}).Error; err != nil {
			return err
		}
		if err := tx.Where("advice_id = ?", adv.ID).Delete(&entity.AdviceSkill{}).Error; err != nil {
			return err
		}

		if len(payload.CourseIDs) > 0 {
			var links []entity.AdviceCourse
			for _, cid := range payload.CourseIDs {
				links = append(links, entity.AdviceCourse{
					AdviceID: adv.ID,
					CourseID: cid,
				})
			}
			if err := tx.Create(&links).Error; err != nil {
				return err
			}
		}

		if len(payload.SkillIDs) > 0 {
			var links []entity.AdviceSkill
			for _, sid := range payload.SkillIDs {
				links = append(links, entity.AdviceSkill{
					AdviceID: adv.ID,
					SkillID:  sid,
				})
			}
			if err := tx.Create(&links).Error; err != nil {
				return err
			}
		}

		return nil
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ac.db.Preload("AdviceSkills.Skill").Preload("AdviceCourses.Course").First(&adv, adv.ID)
	c.JSON(http.StatusOK, gin.H{"data": adv})
}

func (ac *AdviceController) deleteAdvice(c *gin.Context) {
	id := c.Param("id")

	err := ac.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("advice_id = ?", id).Delete(&entity.AdviceCourse{}).Error; err != nil {
			return err
		}
		if err := tx.Where("advice_id = ?", id).Delete(&entity.AdviceSkill{}).Error; err != nil {
			return err
		}
		if err := tx.Delete(&entity.Advice{}, id).Error; err != nil {
			return err
		}
		return nil
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": true})
}

// ===== Skills =====

type skillPayload struct {
	SkillNameTH string `json:"skill_name_th"`
	SkillNameEN string `json:"skill_name_en"`
	Category    int    `json:"category"`
	Description string `json:"description"`
}

func (ac *AdviceController) listSkills(c *gin.Context) {
	var skills []entity.Skill
	if err := ac.db.Order("id asc").Find(&skills).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": skills})
}

func (ac *AdviceController) createSkill(c *gin.Context) {
	var payload skillPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	s := entity.Skill{
		SkillNameTH: payload.SkillNameTH,
		SkillNameEN: payload.SkillNameEN,
		Category:    payload.Category,
		Description: payload.Description,
	}
	if err := ac.db.Create(&s).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"data": s})
}

func (ac *AdviceController) updateSkill(c *gin.Context) {
	id := c.Param("id")
	var payload skillPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var s entity.Skill
	if err := ac.db.First(&s, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "skill not found"})
		return
	}

	s.SkillNameTH = payload.SkillNameTH
	s.SkillNameEN = payload.SkillNameEN
	s.Category = payload.Category
	s.Description = payload.Description

	if err := ac.db.Save(&s).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": s})
}

func (ac *AdviceController) deleteSkill(c *gin.Context) {
	id := c.Param("id")

	err := ac.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("skill_id = ?", id).Delete(&entity.AdviceSkill{}).Error; err != nil {
			return err
		}
		return tx.Delete(&entity.Skill{}, id).Error
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": true})
}

// ===== Courses =====

type coursePayload struct {
	CourseCode   string `json:"course_code"`
	CourseNameTH string `json:"course_name_th"`
	CourseNameEN string `json:"course_name_en"`
	Credits      int    `json:"credits"`
	Category     int    `json:"category"`
	Description  string `json:"description"`
}

func (ac *AdviceController) listCourses(c *gin.Context) {
	var courses []entity.Course
	if err := ac.db.Order("id asc").Find(&courses).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": courses})
}

func (ac *AdviceController) createCourse(c *gin.Context) {
	var payload coursePayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	course := entity.Course{
		CourseCode:   payload.CourseCode,
		CourseNameTH: payload.CourseNameTH,
		CourseNameEN: payload.CourseNameEN,
		Credits:      payload.Credits,
		Category:     payload.Category,
		Description:  payload.Description,
	}
	if err := ac.db.Create(&course).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"data": course})
}

func (ac *AdviceController) updateCourse(c *gin.Context) {
	id := c.Param("id")
	var payload coursePayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var course entity.Course
	if err := ac.db.First(&course, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "course not found"})
		return
	}

	course.CourseCode = payload.CourseCode
	course.CourseNameTH = payload.CourseNameTH
	course.CourseNameEN = payload.CourseNameEN
	course.Credits = payload.Credits
	course.Category = payload.Category
	course.Description = payload.Description

	if err := ac.db.Save(&course).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": course})
}

func (ac *AdviceController) deleteCourse(c *gin.Context) {
	id := c.Param("id")

	err := ac.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("course_id = ?", id).Delete(&entity.AdviceCourse{}).Error; err != nil {
			return err
		}
		return tx.Delete(&entity.Course{}, id).Error
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": true})
}
