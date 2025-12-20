package controller

import (
	"errors"
	"fmt"
	"net/http"
	"regexp"
	"strings"
	"time"
	"unicode"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team14/backend/dto"
	"github.com/sut68/team14/backend/entity"
	"gorm.io/gorm"
)

var (
	// Compile regex once for better performance
	phoneRegex = regexp.MustCompile(`^\d{9,10}$`)
)

type ProfileController struct {
	DB *gorm.DB
}

func NewProfileController(db *gorm.DB) *ProfileController {
	return &ProfileController{DB: db}
}

// ============================================================================
// Public Handlers
// ============================================================================

// GetMe retrieves the authenticated user's complete profile
func (pc *ProfileController) GetMe(ctx *gin.Context) {
	userID, err := getAuthUserID(ctx)
	if err != nil {
		respondError(ctx, http.StatusUnauthorized, err)
		return
	}

	user, err := pc.getUser(userID)
	if err != nil {
		handleDBError(ctx, err, "user not found")
		return
	}

	profile, err := pc.buildUserProfile(userID, user)
	if err != nil {
		respondError(ctx, http.StatusInternalServerError, err)
		return
	}

	ctx.JSON(http.StatusOK, profile)
}

// UpdateMe updates the authenticated user's basic information
func (pc *ProfileController) UpdateMe(ctx *gin.Context) {
	userID, err := getAuthUserID(ctx)
	if err != nil {
		respondError(ctx, http.StatusUnauthorized, err)
		return
	}

	var req dto.UpdateMeRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		respondError(ctx, http.StatusBadRequest, err)
		return
	}

	if err := pc.validateUpdateMeRequest(&req); err != nil {
		respondError(ctx, http.StatusBadRequest, err)
		return
	}

	user, err := pc.getUser(userID)
	if err != nil {
		handleDBError(ctx, err, "user not found")
		return
	}

	pc.updateUserFields(user, &req)

	if err := pc.DB.Save(user).Error; err != nil {
		respondError(ctx, http.StatusInternalServerError, err)
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"user": user})
}

// UpsertEducation creates or updates education information
func (pc *ProfileController) UpsertEducation(ctx *gin.Context) {
	userID, err := getAuthUserID(ctx)
	if err != nil {
		respondError(ctx, http.StatusUnauthorized, err)
		return
	}

	var req dto.UpsertEducationRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		respondError(ctx, http.StatusBadRequest, err)
		return
	}

	if err := pc.validateEducationRequest(&req); err != nil {
		respondError(ctx, http.StatusBadRequest, err)
		return
	}

	edu, err := pc.findOrCreateEducation(userID)
	if err != nil {
		respondError(ctx, http.StatusInternalServerError, err)
		return
	}

	pc.updateEducationFields(edu, &req)

	if err := pc.saveRecord(edu); err != nil {
		respondError(ctx, http.StatusInternalServerError, err)
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"education": edu})
}

// UpsertAcademicScore creates or updates academic score
func (pc *ProfileController) UpsertAcademicScore(ctx *gin.Context) {
	userID, err := getAuthUserID(ctx)
	if err != nil {
		respondError(ctx, http.StatusUnauthorized, err)
		return
	}

	var req dto.UpsertAcademicScoreRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		respondError(ctx, http.StatusBadRequest, err)
		return
	}

	if err := pc.validateAcademicScoreRequest(&req); err != nil {
		respondError(ctx, http.StatusBadRequest, err)
		return
	}

	score, err := pc.findOrCreateAcademicScore(userID)
	if err != nil {
		respondError(ctx, http.StatusInternalServerError, err)
		return
	}

	pc.updateAcademicScoreFields(score, &req)

	if err := pc.saveRecord(score); err != nil {
		respondError(ctx, http.StatusInternalServerError, err)
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"academic_score": score})
}

// UpsertGEDScore creates or updates GED score
func (pc *ProfileController) UpsertGEDScore(ctx *gin.Context) {
	userID, err := getAuthUserID(ctx)
	if err != nil {
		respondError(ctx, http.StatusUnauthorized, err)
		return
	}

	var req dto.UpsertGEDScoreRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		respondError(ctx, http.StatusBadRequest, err)
		return
	}

	if err := pc.validateGEDScoreRequest(&req); err != nil {
		respondError(ctx, http.StatusBadRequest, err)
		return
	}

	score, err := pc.findOrCreateGEDScore(userID)
	if err != nil {
		respondError(ctx, http.StatusInternalServerError, err)
		return
	}

	pc.updateGEDScoreFields(score, &req)

	if err := pc.saveRecord(score); err != nil {
		respondError(ctx, http.StatusInternalServerError, err)
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"ged_score": score})
}

// ReplaceLanguageScores replaces all language proficiency scores
func (pc *ProfileController) ReplaceLanguageScores(ctx *gin.Context) {
	userID, err := getAuthUserID(ctx)
	if err != nil {
		respondError(ctx, http.StatusUnauthorized, err)
		return
	}

	var req dto.ReplaceLanguageScoresRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		respondError(ctx, http.StatusBadRequest, err)
		return
	}

	if err := pc.validateLanguageScoreItems(req.Items); err != nil {
		respondError(ctx, http.StatusBadRequest, err)
		return
	}

	if err := pc.replaceLanguageScores(userID, req.Items); err != nil {
		respondError(ctx, http.StatusInternalServerError, err)
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"ok": true})
}

// GetOnboardingStatus returns the completion status of onboarding steps
func (pc *ProfileController) GetOnboardingStatus(ctx *gin.Context) {
	userID, err := getAuthUserID(ctx)
	if err != nil {
		respondError(ctx, http.StatusUnauthorized, err)
		return
	}

	status := dto.OnboardingStatusResponse{
		HasEducation:     pc.hasRecords(&entity.Education{}, userID),
		HasAcademicScore: pc.hasRecords(&entity.AcademicScore{}, userID),
		HasGEDScore:      pc.hasRecords(&entity.GEDScore{}, userID),
		HasLanguageScore: pc.hasRecords(&entity.LanguageProficiencyScore{}, userID),
	}

	ctx.JSON(http.StatusOK, status)
}

// ============================================================================
// Helper Methods - Database Operations
// ============================================================================

func (pc *ProfileController) getUser(userID uint) (*entity.User, error) {
	var user entity.User
	err := pc.DB.First(&user, userID).Error
	return &user, err
}

func (pc *ProfileController) buildUserProfile(userID uint, user *entity.User) (gin.H, error) {
	profile := gin.H{"user": user}

	// Load language scores (always included, empty array if none)
	langScores, err := pc.getLanguageScores(userID)
	if err != nil {
		return nil, err
	}
	profile["language_scores"] = langScores

	// Load optional education data
	if edu, err := pc.getEducation(userID); err == nil {
		profile["education"] = edu
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}

	// Load optional academic score
	if acad, err := pc.getAcademicScore(userID); err == nil {
		profile["academic_score"] = acad
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}

	// Load optional GED score
	if ged, err := pc.getGEDScore(userID); err == nil {
		profile["ged_score"] = ged
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}

	return profile, nil
}

func (pc *ProfileController) getLanguageScores(userID uint) ([]entity.LanguageProficiencyScore, error) {
	var scores []entity.LanguageProficiencyScore
	err := pc.DB.Where("user_id = ?", userID).Find(&scores).Error
	if err != nil {
		return nil, err
	}
	return scores, nil
}

func (pc *ProfileController) getEducation(userID uint) (*entity.Education, error) {
	var edu entity.Education
	err := pc.DB.Where("user_id = ?", userID).
		Preload("EducationLevel").
		Preload("School").
		Preload("SchoolType").
		Preload("CurriculumType").
		First(&edu).Error
	return &edu, err
}

func (pc *ProfileController) getAcademicScore(userID uint) (*entity.AcademicScore, error) {
	var score entity.AcademicScore
	err := pc.DB.Where("user_id = ?", userID).First(&score).Error
	return &score, err
}

func (pc *ProfileController) getGEDScore(userID uint) (*entity.GEDScore, error) {
	var score entity.GEDScore
	err := pc.DB.Where("user_id = ?", userID).First(&score).Error
	return &score, err
}

func (pc *ProfileController) findOrCreateEducation(userID uint) (*entity.Education, error) {
	var edu entity.Education
	err := pc.DB.Where("user_id = ?", userID).First(&edu).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return &entity.Education{UserID: userID}, nil
	}
	return &edu, err
}

func (pc *ProfileController) findOrCreateAcademicScore(userID uint) (*entity.AcademicScore, error) {
	var score entity.AcademicScore
	err := pc.DB.Where("user_id = ?", userID).First(&score).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return &entity.AcademicScore{UserID: userID}, nil
	}
	return &score, err
}

func (pc *ProfileController) findOrCreateGEDScore(userID uint) (*entity.GEDScore, error) {
	var score entity.GEDScore
	err := pc.DB.Where("user_id = ?", userID).First(&score).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return &entity.GEDScore{UserID: userID}, nil
	}
	return &score, err
}

func (pc *ProfileController) saveRecord(record interface{}) error {
	return pc.DB.Save(record).Error
}

func (pc *ProfileController) replaceLanguageScores(userID uint, items []dto.LanguageScoreItem) error {
	return pc.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("user_id = ?", userID).Delete(&entity.LanguageProficiencyScore{}).Error; err != nil {
			return err
		}

		if len(items) == 0 {
			return nil
		}

		scores := pc.buildLanguageScores(userID, items)
		return tx.Create(&scores).Error
	})
}

func (pc *ProfileController) buildLanguageScores(userID uint, items []dto.LanguageScoreItem) []entity.LanguageProficiencyScore {
	scores := make([]entity.LanguageProficiencyScore, 0, len(items))

	for i := range items {
		score := entity.LanguageProficiencyScore{
			UserID:       userID,
			TestType:     strings.TrimSpace(items[i].TestType),
			Score:        strings.TrimSpace(items[i].Score),
			TestLevel:    strings.TrimSpace(items[i].TestLevel),
			TestDate:     derefTime(items[i].TestDate),
			CertFilePath: strings.TrimSpace(items[i].CertFilePath),
		}

		if items[i].SATMath != nil {
			score.SATMath = items[i].SATMath
		}

		scores = append(scores, score)
	}

	return scores
}

func (pc *ProfileController) hasRecords(model interface{}, userID uint) bool {
	var count int64
	pc.DB.Model(model).Where("user_id = ?", userID).Count(&count)
	return count > 0
}

// ============================================================================
// Helper Methods - Field Updates
// ============================================================================

func (pc *ProfileController) updateUserFields(user *entity.User, req *dto.UpdateMeRequest) {
	first := strings.TrimSpace(req.FirstName)
	last := strings.TrimSpace(req.LastName)

	if first != "" && last != "" {
		if isThaiText(first) && isThaiText(last) {
			user.FirstNameTH = first
			user.LastNameTH = last
			user.FirstNameEN = ""
			user.LastNameEN = ""
		} else if isEnglishText(first) && isEnglishText(last) {
			user.FirstNameEN = first
			user.LastNameEN = last
			user.FirstNameTH = ""
			user.LastNameTH = ""
		}
	}

	if req.Phone != "" {
		user.Phone = normalizePhone(req.Phone)
	}
}

func (pc *ProfileController) updateEducationFields(edu *entity.Education, req *dto.UpsertEducationRequest) {
	edu.EducationLevelID = req.EducationLevelID
	edu.SchoolID = req.SchoolID
	edu.SchoolName = strings.TrimSpace(req.SchoolName)
	edu.SchoolTypeID = req.SchoolTypeID
	edu.CurriculumTypeID = req.CurriculumTypeID
	edu.IsProjectBased = req.IsProjectBased
	edu.Status = entity.EducationStatus(req.Status)
	edu.StartDate = req.StartDate
	edu.EndDate = req.EndDate
	edu.GraduationYear = req.GraduationYear
}

func (pc *ProfileController) updateAcademicScoreFields(score *entity.AcademicScore, req *dto.UpsertAcademicScoreRequest) {
	score.GPAX = req.GPAX
	score.GPAXSemesters = req.GPAXSemesters
	score.GPAMath = req.GPAMath
	score.GPAScience = req.GPAScience
	score.GPAThai = req.GPAThai
	score.GPAEnglish = req.GPAEnglish
	score.GPASocial = req.GPASocial
	score.GPATotalScore = req.GPATotalScore
	score.TranscriptFilePath = strings.TrimSpace(req.TranscriptFilePath)
}

func (pc *ProfileController) updateGEDScoreFields(score *entity.GEDScore, req *dto.UpsertGEDScoreRequest) {
	score.TotalScore = req.TotalScore
	score.RLAScore = req.RLAScore
	score.MathScore = req.MathScore
	score.ScienceScore = req.ScienceScore
	score.SocialScore = req.SocialScore
	score.CertFilePath = strings.TrimSpace(req.CertFilePath)
}

// ============================================================================
// Helper Methods - Validation
// ============================================================================

func (pc *ProfileController) validateUpdateMeRequest(req *dto.UpdateMeRequest) error {
	first := strings.TrimSpace(req.FirstName)
	last := strings.TrimSpace(req.LastName)
	phone := strings.TrimSpace(req.Phone)

	// Names must be provided together
	if (first != "" && last == "") || (first == "" && last != "") {
		return errors.New("first_name and last_name must be provided together")
	}

	// Names must be in the same language
	if first != "" && last != "" {
		isThai := isThaiText(first) && isThaiText(last)
		isEng := isEnglishText(first) && isEnglishText(last)
		if !isThai && !isEng {
			return errors.New("first_name and last_name must be all Thai or all English")
		}
	}

	// Phone validation
	if phone != "" {
		normalized := normalizePhone(phone)
		if !phoneRegex.MatchString(normalized) {
			return errors.New("invalid phone format (must be 9-10 digits)")
		}
	}

	// At least one field must be provided
	if first == "" && last == "" && phone == "" {
		return errors.New("no fields to update")
	}

	return nil
}

func (pc *ProfileController) validateEducationRequest(req *dto.UpsertEducationRequest) error {
	if req.EducationLevelID == 0 {
		return errors.New("education_level_id is required")
	}

	name := strings.TrimSpace(req.SchoolName)
	if req.SchoolID == nil && name == "" {
		return errors.New("school_id or school_name is required")
	}

	if req.Status != "" && !isValidEducationStatus(req.Status) {
		return errors.New("invalid status")
	}

	return nil
}

func (pc *ProfileController) validateAcademicScoreRequest(req *dto.UpsertAcademicScoreRequest) error {
	if req.GPAX < 0 || req.GPAX > 4.00 {
		return errors.New("gpax must be between 0 and 4.00")
	}
	return nil
}

func (pc *ProfileController) validateGEDScoreRequest(req *dto.UpsertGEDScoreRequest) error {
	scores := []int{req.TotalScore, req.RLAScore, req.MathScore, req.ScienceScore, req.SocialScore}
	for _, score := range scores {
		if score < 0 {
			return errors.New("ged scores must not be negative")
		}
	}
	return nil
}

func (pc *ProfileController) validateLanguageScoreItems(items []dto.LanguageScoreItem) error {
	for i := range items {
		if strings.TrimSpace(items[i].TestType) == "" {
			return fmt.Errorf("items[%d].test_type is required", i)
		}
	}
	return nil
}

// ============================================================================
// Utility Functions
// ============================================================================

func respondError(ctx *gin.Context, status int, err error) {
	ctx.JSON(status, gin.H{"error": err.Error()})
}

func handleDBError(ctx *gin.Context, err error, notFoundMsg string) {
	if errors.Is(err, gorm.ErrRecordNotFound) {
		respondError(ctx, http.StatusNotFound, errors.New(notFoundMsg))
	} else {
		respondError(ctx, http.StatusInternalServerError, err)
	}
}

func derefTime(t *time.Time) time.Time {
	if t == nil {
		return time.Time{}
	}
	return *t
}

func normalizePhone(v string) string {
	// Remove all whitespace and dashes
	v = strings.Map(func(r rune) rune {
		if r == ' ' || r == '-' {
			return -1
		}
		return r
	}, v)
	return strings.TrimSpace(v)
}

func isValidEducationStatus(status string) bool {
	validStatuses := []entity.EducationStatus{
		entity.EducationStatusCurrent,
		entity.EducationStatusGraduated,
		entity.EducationStatusOther,
	}

	for _, valid := range validStatuses {
		if status == string(valid) {
			return true
		}
	}
	return false
}

// Text validation functions

func isThaiText(value string) bool {
	value = strings.TrimSpace(value)
	if value == "" {
		return false
	}

	for _, r := range value {
		if isAllowedWhitespace(r) {
			continue
		}
		if !unicode.In(r, unicode.Thai) {
			return false
		}
	}
	return true
}

func isEnglishText(value string) bool {
	value = strings.TrimSpace(value)
	if value == "" {
		return false
	}

	for _, r := range value {
		if isAllowedWhitespace(r) {
			continue
		}
		if !unicode.In(r, unicode.Latin) || !unicode.IsLetter(r) {
			return false
		}
	}
	return true
}

func isAllowedWhitespace(r rune) bool {
	return r == ' ' || r == '-' || r == '\''
}
