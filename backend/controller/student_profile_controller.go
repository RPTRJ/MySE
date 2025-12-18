package controller

import (
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team14/backend/config"
	"github.com/sut68/team14/backend/entity"
	"gorm.io/gorm"
)

type StudentProfileController struct {
	db *gorm.DB
}

func NewStudentProfileController() *StudentProfileController {
	return &StudentProfileController{db: config.GetDB()}
}

func (pc *StudentProfileController) RegisterRoutes(router gin.IRoutes) {
	router.GET("/students/me/profile", pc.GetProfile)
	router.PUT("/students/me/profile", pc.UpdateProfile)
}

type profileUserPayload struct {
	FirstNameTH     string `json:"first_name_th"`
	LastNameTH      string `json:"last_name_th"`
	FirstNameEN     string `json:"first_name_en"`
	LastNameEN      string `json:"last_name_en"`
	Phone           string `json:"phone"`
	Birthday        string `json:"birthday"`
	ProfileImageURL string `json:"profile_image_url"`
}

type profileEducationPayload struct {
	EducationLevelID   uint   `json:"education_level_id"`
	EducationLevelName string `json:"education_level_name"`
	SchoolID           uint   `json:"school_id"`
	SchoolName         string `json:"school_name"`
	SchoolTypeID       uint   `json:"school_type_id"`
	SchoolTypeName     string `json:"school_type_name"`
	CurriculumTypeID   uint   `json:"curriculum_type_id"`
	CurriculumTypeName string `json:"curriculum_type_name"`
	CurriculumID       uint   `json:"curriculum_id"`
	IsProjectBased     *bool  `json:"is_project_based"`
}

type gedPayload struct {
	TotalScore   int    `json:"total_score"`
	RLAScore     int    `json:"rla_score"`
	MathScore    int    `json:"math_score"`
	ScienceScore int    `json:"science_score"`
	SocialScore  int    `json:"social_score"`
	CertFilePath string `json:"cert_file_path"`
}

type academicPayload struct {
	GPAX               float64 `json:"gpax"`
	GPAXSemesters      int     `json:"gpax_semesters"`
	GPAMath            float64 `json:"gpa_math"`
	GPAScience         float64 `json:"gpa_science"`
	GPAThai            float64 `json:"gpa_thai"`
	GPAEnglish         float64 `json:"gpa_english"`
	GPASocial          float64 `json:"gpa_social"`
	GPATotalScore      float64 `json:"gpa_total_score"`
	TranscriptFilePath string  `json:"transcript_file_path"`
}

type languageProficiencyPayload struct {
	TestType     string `json:"test_type"`
	Score        string `json:"score"`
	TestLevel    string `json:"test_level"`
	SATMath      *int   `json:"sat_math"`
	TestDate     string `json:"test_date"`
	CertFilePath string `json:"cert_file_path"`
}

type btdPayload struct {
	TestType     string  `json:"test_type"`
	Subject      string  `json:"subject"`
	RawScore     float64 `json:"raw_score"`
	ExamYear     int     `json:"exam_year"`
	CertFilePath string  `json:"cert_file_path"`
}

type StudentProfilePayload struct {
	User           profileUserPayload           `json:"user" binding:"required"`
	Education      profileEducationPayload      `json:"education"`
	ScoreType      string                       `json:"score_type"` // ged | academic | none
	GEDScore       *gedPayload                  `json:"ged_score"`
	AcademicScore  *academicPayload             `json:"academic_score"`
	LanguageScores []languageProficiencyPayload `json:"language_scores"`
	BTDTestScores  []btdPayload                 `json:"btd_test_scores"`
}

type profileOptions struct {
	EducationLevels []entity.EducationLevel `json:"education_levels"`
	SchoolTypes     []entity.SchoolType     `json:"school_types"`
	Schools         []entity.School         `json:"schools"`
	CurriculumTypes []entity.CurriculumType `json:"curriculum_types"`
}

type StudentProfileResponse struct {
	User           entity.User                       `json:"user"`
	Education      *entity.Education                 `json:"education,omitempty"`
	GEDScore       *entity.GEDScore                  `json:"ged_score,omitempty"`
	AcademicScore  *entity.AcademicScore             `json:"academic_score,omitempty"`
	LanguageScores []entity.LanguageProficiencyScore `json:"language_scores"`
	BTDTestScores  []entity.STDTestScore             `json:"btd_test_scores"`
	Options        profileOptions                    `json:"options"`
}

func (pc *StudentProfileController) GetProfile(c *gin.Context) {
	userID, ok := getUserIDFromContext(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not found in context"})
		return
	}

	resp, err := pc.buildProfileResponse(userID)
	if err != nil {
		status := http.StatusInternalServerError
		if errors.Is(err, gorm.ErrRecordNotFound) {
			status = http.StatusNotFound
		}
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": resp})
}

func (pc *StudentProfileController) UpdateProfile(c *gin.Context) {
	userID, ok := getUserIDFromContext(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not found in context"})
		return
	}

	var payload StudentProfilePayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if payload.ScoreType != "" && payload.ScoreType != "ged" && payload.ScoreType != "academic" && payload.ScoreType != "none" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "score_type must be ged, academic, or none"})
		return
	}

	tx := pc.db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
			panic(r)
		}
	}()

	var user entity.User
	if err := tx.First(&user, userID).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	user.FirstNameTH = payload.User.FirstNameTH
	user.LastNameTH = payload.User.LastNameTH
	user.FirstNameEN = payload.User.FirstNameEN
	user.LastNameEN = payload.User.LastNameEN
	user.Phone = payload.User.Phone
	user.ProfileImageURL = payload.User.ProfileImageURL

	if strings.TrimSpace(payload.User.Birthday) != "" {
		bd, err := time.Parse(birthdayLayout, payload.User.Birthday)
		if err != nil {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid birthday format"})
			return
		}
		user.Birthday = bd
	}

	if err := user.Validate(); err != nil {
		tx.Rollback()
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := tx.Save(&user).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var educationID uint
	if !isEducationPayloadEmpty(payload.Education) {
		var err error
		educationID, err = pc.upsertEducation(tx, userID, payload.Education)
		if err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	switch payload.ScoreType {
	case "ged":
		if payload.GEDScore == nil {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{"error": "ged_score is required when score_type is ged"})
			return
		}
		if err := tx.Where("user_id = ?", userID).Delete(&entity.AcademicScore{}).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		if err := pc.upsertGED(tx, userID, payload.GEDScore); err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	case "academic":
		if payload.AcademicScore == nil {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{"error": "academic_score is required when score_type is academic"})
			return
		}
		if err := tx.Where("user_id = ?", userID).Delete(&entity.GEDScore{}).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		if err := pc.upsertAcademic(tx, userID, payload.AcademicScore); err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	case "none":
		if err := tx.Where("user_id = ?", userID).Delete(&entity.GEDScore{}).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		if err := tx.Where("user_id = ?", userID).Delete(&entity.AcademicScore{}).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	default:
		// unknown type, clear both to keep consistency
		if err := tx.Where("user_id = ?", userID).Delete(&entity.GEDScore{}).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		if err := tx.Where("user_id = ?", userID).Delete(&entity.AcademicScore{}).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	if err := pc.replaceLanguageScores(tx, userID, payload.LanguageScores); err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if err := pc.replaceBTDScores(tx, userID, payload.BTDTestScores); err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	resp, err := pc.buildProfileResponse(userID)
	if err != nil {
		status := http.StatusInternalServerError
		if errors.Is(err, gorm.ErrRecordNotFound) {
			status = http.StatusNotFound
		}
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}

	// include the education id to surface creation success
	if resp.Education != nil && resp.Education.ID == 0 {
		resp.Education.ID = educationID
	}

	c.JSON(http.StatusOK, gin.H{"data": resp})
}

func (pc *StudentProfileController) upsertEducation(tx *gorm.DB, userID uint, payload profileEducationPayload) (uint, error) {
	var education entity.Education
	err := tx.Where("user_id = ?", userID).Preload("EducationLevel").Preload("CurriculumType").First(&education).Error
	if err != nil {
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			return 0, err
		}
		education = entity.Education{UserID: userID}
	}

	levelID, err := pc.findOrCreateEducationLevel(tx, payload.EducationLevelID, payload.EducationLevelName)
	if err != nil {
		return 0, err
	}
	if levelID != 0 {
		education.EducationLevelID = levelID
	}

	schoolTypeID, err := pc.findOrCreateSchoolType(tx, payload.SchoolTypeID, payload.SchoolTypeName)
	if err != nil {
		return 0, err
	}
	if schoolTypeID != 0 {
		education.SchoolTypeID = schoolTypeID
	}

	curTypeID, err := pc.findOrCreateCurriculumType(tx, payload.CurriculumTypeID, payload.CurriculumTypeName)
	if err != nil {
		return 0, err
	}
	if curTypeID != 0 {
		education.CurriculumTypeID = curTypeID
	}

	schoolID, schoolTypeID, isProjectBased, err := pc.findOrCreateSchool(tx, payload)
	if err != nil {
		return 0, err
	}
	if schoolID != 0 {
		education.SchoolID = &schoolID
		// If school carries a type, prefer that
		if schoolTypeID != 0 {
			education.SchoolTypeID = schoolTypeID
		}
		education.IsProjectBased = isProjectBased
	}

	if payload.CurriculumID != 0 {
		education.CurriculumID = &payload.CurriculumID
	} else {
		education.CurriculumID = nil
	}
	if payload.IsProjectBased != nil {
		education.IsProjectBased = *payload.IsProjectBased
	}

	if err := tx.Save(&education).Error; err != nil {
		return 0, err
	}
	return education.ID, nil
}

func (pc *StudentProfileController) findOrCreateEducationLevel(tx *gorm.DB, id uint, name string) (uint, error) {
	if id != 0 {
		return id, nil
	}
	if strings.TrimSpace(name) == "" {
		return 0, nil
	}

	var level entity.EducationLevel
	if err := tx.Where("name = ?", name).First(&level).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			level.Name = name
			if err := tx.Create(&level).Error; err != nil {
				return 0, err
			}
		} else {
			return 0, err
		}
	}
	return level.ID, nil
}

func (pc *StudentProfileController) findOrCreateCurriculumType(tx *gorm.DB, id uint, name string) (uint, error) {
	if id != 0 {
		return id, nil
	}
	if strings.TrimSpace(name) == "" {
		return 0, nil
	}

	var curType entity.CurriculumType
	if err := tx.Where("name = ?", name).First(&curType).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			curType.Name = name
			if err := tx.Create(&curType).Error; err != nil {
				return 0, err
			}
		} else {
			return 0, err
		}
	}
	return curType.ID, nil
}

func isEducationPayloadEmpty(p profileEducationPayload) bool {
	allEmptyStrings := strings.TrimSpace(p.EducationLevelName+p.CurriculumTypeName+p.SchoolTypeName) == ""
	return p.EducationLevelID == 0 &&
		p.SchoolTypeID == 0 &&
		p.SchoolID == 0 &&
		strings.TrimSpace(p.SchoolName) == "" &&
		p.CurriculumTypeID == 0 &&
		p.CurriculumID == 0 &&
		p.IsProjectBased == nil &&
		allEmptyStrings
}

func (pc *StudentProfileController) findOrCreateSchoolType(tx *gorm.DB, id uint, name string) (uint, error) {
	if id != 0 {
		return id, nil
	}
	if strings.TrimSpace(name) == "" {
		return 0, nil
	}

	var schoolType entity.SchoolType
	if err := tx.Where("name = ?", name).First(&schoolType).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			schoolType.Name = name
			if err := tx.Create(&schoolType).Error; err != nil {
				return 0, err
			}
		} else {
			return 0, err
		}
	}
	return schoolType.ID, nil
}

func (pc *StudentProfileController) findOrCreateSchool(tx *gorm.DB, payload profileEducationPayload) (uint, uint, bool, error) {
	if payload.SchoolID != 0 {
		var school entity.School
		if err := tx.Preload("SchoolType").First(&school, payload.SchoolID).Error; err != nil {
			return 0, 0, false, err
		}
		return school.ID, school.SchoolTypeID, school.IsProjectBased, nil
	}
	if strings.TrimSpace(payload.SchoolName) == "" {
		return 0, 0, false, nil
	}

	var school entity.School
	if err := tx.Where("name = ?", payload.SchoolName).Preload("SchoolType").First(&school).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			school.Name = payload.SchoolName
			// resolve school type if provided
			typeID, err := pc.findOrCreateSchoolType(tx, payload.SchoolTypeID, payload.SchoolTypeName)
			if err != nil {
				return 0, 0, false, err
			}
			school.SchoolTypeID = typeID
			// Project-based flag is defined at the school; default false unless known.
			if err := tx.Create(&school).Error; err != nil {
				return 0, 0, false, err
			}
		} else {
			return 0, 0, false, err
		}
	}
	return school.ID, school.SchoolTypeID, school.IsProjectBased, nil
}

func (pc *StudentProfileController) upsertGED(tx *gorm.DB, userID uint, payload *gedPayload) error {
	var ged entity.GEDScore
	err := tx.Where("user_id = ?", userID).First(&ged).Error
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return err
	}

	if errors.Is(err, gorm.ErrRecordNotFound) {
		ged = entity.GEDScore{UserID: userID}
	}

	ged.TotalScore = payload.TotalScore
	ged.RLAScore = payload.RLAScore
	ged.MathScore = payload.MathScore
	ged.ScienceScore = payload.ScienceScore
	ged.SocialScore = payload.SocialScore
	ged.CertFilePath = payload.CertFilePath

	return tx.Save(&ged).Error
}

func (pc *StudentProfileController) upsertAcademic(tx *gorm.DB, userID uint, payload *academicPayload) error {
	var ac entity.AcademicScore
	err := tx.Where("user_id = ?", userID).First(&ac).Error
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return err
	}

	if errors.Is(err, gorm.ErrRecordNotFound) {
		ac = entity.AcademicScore{UserID: userID}
	}

	ac.GPAX = payload.GPAX
	ac.GPAXSemesters = payload.GPAXSemesters
	ac.GPAMath = payload.GPAMath
	ac.GPAScience = payload.GPAScience
	ac.GPAThai = payload.GPAThai
	ac.GPAEnglish = payload.GPAEnglish
	ac.GPASocial = payload.GPASocial
	ac.GPATotalScore = payload.GPATotalScore
	ac.TranscriptFilePath = payload.TranscriptFilePath

	return tx.Save(&ac).Error
}

func (pc *StudentProfileController) replaceLanguageScores(tx *gorm.DB, userID uint, payloads []languageProficiencyPayload) error {
	if err := tx.Where("user_id = ?", userID).Delete(&entity.LanguageProficiencyScore{}).Error; err != nil {
		return err
	}

	for _, p := range payloads {
		if strings.TrimSpace(p.TestType) == "" {
			continue
		}
		var testDate time.Time
		if strings.TrimSpace(p.TestDate) != "" {
			parsed, err := time.Parse("2006-01-02", p.TestDate)
			if err != nil {
				return err
			}
			testDate = parsed
		}

		score := entity.LanguageProficiencyScore{
			UserID:       userID,
			TestType:     p.TestType,
			Score:        p.Score,
			TestLevel:    p.TestLevel,
			SATMath:      p.SATMath,
			TestDate:     testDate,
			CertFilePath: p.CertFilePath,
		}
		if err := tx.Create(&score).Error; err != nil {
			return err
		}
	}
	return nil
}

func (pc *StudentProfileController) replaceBTDScores(tx *gorm.DB, userID uint, payloads []btdPayload) error {
	if err := tx.Where("user_id = ?", userID).Delete(&entity.STDTestScore{}).Error; err != nil {
		return err
	}

	for _, p := range payloads {
		if strings.TrimSpace(p.TestType) == "" && strings.TrimSpace(p.Subject) == "" {
			continue
		}
		score := entity.STDTestScore{
			UserID:       userID,
			TestType:     p.TestType,
			Subject:      p.Subject,
			RawScore:     p.RawScore,
			ExamYear:     p.ExamYear,
			CertFilePath: p.CertFilePath,
		}
		if err := tx.Create(&score).Error; err != nil {
			return err
		}
	}
	return nil
}

func (pc *StudentProfileController) buildProfileResponse(userID uint) (*StudentProfileResponse, error) {
	fetchOne := func(query *gorm.DB, dest interface{}) (bool, error) {
		result := query.Limit(1).Find(dest)
		if err := result.Error; err != nil {
			return false, err
		}
		return result.RowsAffected > 0, nil
	}

	var user entity.User
	if err := pc.db.First(&user, userID).Error; err != nil {
		return nil, err
	}

	var education entity.Education
	var educationPtr *entity.Education
	if ok, err := fetchOne(
		pc.db.
			Preload("EducationLevel").
			Preload("CurriculumType").
			Preload("Curriculum").
			Preload("School").
			Preload("School.SchoolType").
			Preload("SchoolType").
			Where("user_id = ?", userID),
		&education,
	); err != nil {
		return nil, err
	} else if ok {
		educationPtr = &education
	}

	var ged entity.GEDScore
	var gedPtr *entity.GEDScore
	if ok, err := fetchOne(pc.db.Where("user_id = ?", userID), &ged); err != nil {
		return nil, err
	} else if ok {
		gedPtr = &ged
	}

	var ac entity.AcademicScore
	var acPtr *entity.AcademicScore
	if ok, err := fetchOne(pc.db.Where("user_id = ?", userID), &ac); err != nil {
		return nil, err
	} else if ok {
		acPtr = &ac
	}

	var langs []entity.LanguageProficiencyScore
	if err := pc.db.Where("user_id = ?", userID).Order("test_date desc").Find(&langs).Error; err != nil {
		return nil, err
	}

	var btds []entity.STDTestScore
	if err := pc.db.Where("user_id = ?", userID).Order("exam_year desc").Find(&btds).Error; err != nil {
		return nil, err
	}

	var levels []entity.EducationLevel
	if err := pc.db.Order("name asc").Find(&levels).Error; err != nil {
		return nil, err
	}
	var curTypes []entity.CurriculumType
	if err := pc.db.Order("name asc").Find(&curTypes).Error; err != nil {
		return nil, err
	}
	var schoolTypes []entity.SchoolType
	if err := pc.db.Order("name asc").Find(&schoolTypes).Error; err != nil {
		return nil, err
	}
	var schools []entity.School
	if err := pc.db.Preload("SchoolType").Order("name asc").Find(&schools).Error; err != nil {
		return nil, err
	}

	return &StudentProfileResponse{
		User:           user,
		Education:      educationPtr,
		GEDScore:       gedPtr,
		AcademicScore:  acPtr,
		LanguageScores: langs,
		BTDTestScores:  btds,
		Options: profileOptions{
			EducationLevels: levels,
			SchoolTypes:     schoolTypes,
			Schools:         schools,
			CurriculumTypes: curTypes,
		},
	}, nil
}
