package seed

import (
	"time"

	"github.com/sut68/team14/backend/config"
	"github.com/sut68/team14/backend/entity"
)

// SeedPortfolioSubmissions จะสร้าง User และ Portfolio พื้นฐานให้เองถ้าไม่มี
func SeedPortfolioSubmissions() error {
	db := config.GetDB()
	if skipIfSeededDefault(db, &entity.PortfolioSubmission{}, "portfolio_submissions") {
		return nil
	}

	now := time.Now()

	// --- Ensure UserTypes และ IDTypes ---
	var studentType entity.UserTypes
	db.FirstOrCreate(&studentType, entity.UserTypes{TypeName: "Student"})
	var citizenID entity.IDTypes
	db.FirstOrCreate(&citizenID, entity.IDTypes{IDName: "citizen_id"})

	// --- Ensure Colors exists (get first one) ---
	var color entity.Colors
	if err := db.First(&color).Error; err != nil {
		// Create a default color if none exists
		color = entity.Colors{
			ColorsName:      "Default Blue",
			PrimaryColor:    "#1E90FF",
			SecondaryColor:  "#00BFFF",
			BackgroundColor: "#F0F8FF",
			HexValue:        "#000080",
		}
		db.Create(&color)
	}

	// --- Ensure Font exists (get first one) ---
	var font entity.Font
	if err := db.First(&font).Error; err != nil {
		// Create a default font if none exists
		font = entity.Font{
			FontFamily:   "Roboto, sans-serif",
			FontName:     "Roboto",
			FontCategory: "Sans-serif",
			FontVariant:  "400,700",
			FontURL:      "https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap",
			IsActive:     true,
		}
		db.Create(&font)
	}

	// --- Ensure User ---
	var user entity.User
	db.FirstOrCreate(&user, entity.User{
		FirstNameTH:     "สมชาย",
		LastNameTH:      "ทดสอบ",
		Email:           "submission_user@example.com",
		Password:        "password123",
		ProfileImageURL: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Orange_tabby_cat_sitting_on_fallen_leaves-Hisashi-01A.jpg/960px-Orange_tabby_cat_sitting_on_fallen_leaves-Hisashi-01A.jpg",
		AccountTypeID:   studentType.ID,
		IDDocTypeID:     citizenID.ID,
	})

	// --- Ensure Portfolio (with ColorsID and FontID) ---
	var portfolio entity.Portfolio
	if err := db.Where("user_id = ? AND portfolio_name = ?", user.ID, "Default Portfolio").First(&portfolio).Error; err != nil {
		portfolio = entity.Portfolio{
			PortfolioName: "Default Portfolio",
			UserID:        user.ID,
			ColorsID:      color.ID,
			FontID:        font.ID,
		}
		if err := db.Create(&portfolio).Error; err != nil {
			return err
		}
	}

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
