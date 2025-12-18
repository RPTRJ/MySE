package seed

import (
	"time"

	"github.com/sut68/team14/backend/config"
	"github.com/sut68/team14/backend/entity"
)

// SeedPortfolioSubmissions จะสร้าง User และ Portfolio พื้นฐานให้เองถ้าไม่มี
func SeedPortfolioSubmissions() error {
	db := config.GetDB()
	now := time.Now()

	// --- Ensure UserTypes และ IDTypes ---
	var studentType entity.UserTypes
	db.FirstOrCreate(&studentType, entity.UserTypes{TypeName: "Student"})
	var citizenID entity.IDTypes
	db.FirstOrCreate(&citizenID, entity.IDTypes{IDName: "citizen_id"})

	// --- Ensure User ---
	var user entity.User
	db.FirstOrCreate(&user, entity.User{
		FirstNameTH:   "สมชาย",
		LastNameTH:    "ทดสอบ",
		Email:         "submission_user@example.com",
		Password:      "password123",
		ProfileImageURL: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Orange_tabby_cat_sitting_on_fallen_leaves-Hisashi-01A.jpg/960px-Orange_tabby_cat_sitting_on_fallen_leaves-Hisashi-01A.jpg",
		AccountTypeID: studentType.ID,
		IDDocTypeID:   citizenID.ID,
	})

	// --- Ensure Portfolio ---
	var portfolio entity.Portfolio
	db.FirstOrCreate(&portfolio, entity.Portfolio{
		PortfolioName: "Default Portfolio",
		UserID:        user.ID,
	})

	// --- Create Submissions ---
	submissions := []entity.PortfolioSubmission{
		{
			Version:            1,
			Status:             "awaiting",
			Submission_at:      now.AddDate(0, 0, -3),
			Is_current_version: true,
			PortfolioID:        portfolio.ID,
			UserID:             user.ID,
		},
		{
			Version:            1,
			Status:             "reviewed",
			Submission_at:      now.AddDate(0, 0, -5),
			ReviewedAt:         &now,
			Is_current_version: true,
			PortfolioID:        portfolio.ID,
			UserID:             user.ID,
		},
		{
			Version:            1,
			Status:             "approved",
			Submission_at:      now.AddDate(0, 0, -7),
			ApprovedAt:         &now,
			Is_current_version: true,
			PortfolioID:        portfolio.ID,
			UserID:             user.ID,
		},
	}

	for _, s := range submissions {
		if err := db.FirstOrCreate(&s, entity.PortfolioSubmission{
			PortfolioID: portfolio.ID,
			UserID:      user.ID,
			Version:     s.Version,
		}).Error; err != nil {
			return err
		}
	}

	return nil
}
