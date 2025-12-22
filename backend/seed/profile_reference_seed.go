package seed

import (
	"fmt"
	"log"

	"github.com/sut68/team14/backend/config"
	"github.com/sut68/team14/backend/entity"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

func SeedProfileReference() {
	db := config.GetDB()
	if db == nil {
		log.Println("SeedProfileReference: db is nil")
		return
	}

	if err := db.Transaction(func(tx *gorm.DB) error {
		if err := seedEducationLevels(tx); err != nil {
			return err
		}
		if err := seedSchoolTypes(tx); err != nil {
			return err
		}
		if err := seedCurriculumTypes(tx); err != nil {
			return err
		}
		if err := seedSchools(tx); err != nil {
			return err
		}
		return nil
	}); err != nil {
		log.Printf("SeedProfileReference error: %v\n", err)
		return
	}

	log.Println("SeedProfileReference completed")
}

func seedEducationLevels(tx *gorm.DB) error {
	items := []entity.EducationLevel{
		{Name: "มัธยมศึกษาตอนปลาย (ม.4-ม.6)"},
		{Name: "อาชีวศึกษา (ปวช.)"},
		{Name: "อาชีวศึกษา (ปวส.)"},
		{Name: "GED"},
	}

	return tx.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "name"}},
		DoNothing: true,
	}).Create(&items).Error
}

func seedSchoolTypes(tx *gorm.DB) error {
	items := []entity.SchoolType{
		{Name: "โรงเรียนรัฐบาล"},
		{Name: "โรงเรียนเอกชน"},
		{Name: "โรงเรียนสาธิต"},
		{Name: "โรงเรียนนานาชาติ"},
		{Name: "อาชีวศึกษา (วิทยาลัย/เทคนิค)"},
		{Name: "กศน."},
		{Name: "ต่างประเทศ"},
		{Name: "Homeschool"},
		{Name: "อื่นๆ"},
	}

	return tx.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "name"}},
		DoNothing: true,
	}).Create(&items).Error
}

func seedCurriculumTypes(tx *gorm.DB) error {
	items := []entity.CurriculumType{
		// สายสามัญ
		{Name: "วิทย์-คณิต"},
		{Name: "ศิลป์-ภาษา"},
		{Name: "ศิลป์-คำนวณ"},
		{Name: "ศิลป์-สังคม"},
		{Name: "ศิลป์-จีน"},
		{Name: "ศิลป์-ญี่ปุ่น"},
		{Name: "ศิลป์-เกาหลี"},
		{Name: "ศิลป์-ฝรั่งเศส"},
		{Name: "ศิลป์-เยอรมัน"},
		{Name: "ศิลป์-สเปน"},
		{Name: "กีฬา"},
		{Name: "ดนตรี/นาฏศิลป์"},
		{Name: "ศิลปกรรม"},
		{Name: "STEM / Gifted"},
		{Name: "English Program (EP)"},
		{Name: "Mini English Program (MEP)"},

		// สายอาชีพ
		{Name: "อุตสาหกรรม (ช่าง)"},
		{Name: "ช่างยนต์"},
		{Name: "ช่างไฟฟ้า/อิเล็กทรอนิกส์"},
		{Name: "ช่างกลโรงงาน"},
		{Name: "ช่างก่อสร้าง"},
		{Name: "เทคนิคคอมพิวเตอร์/IT"},
		{Name: "เมคคาทรอนิกส์/หุ่นยนต์"},
		{Name: "พาณิชยกรรม/บัญชี"},
		{Name: "ธุรกิจดิจิทัล"},
		{Name: "การโรงแรม/ท่องเที่ยว"},
		{Name: "คหกรรม/อาหาร"},
		{Name: "เกษตร"},
		{Name: "โลจิสติกส์"},
		{Name: "อื่นๆ"},

		// International Tracks
		{Name: "GED Track"},
		{Name: "IB Track"},
		{Name: "A-Level Track"},
		{Name: "AP Track"},
	}

	return tx.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "name"}},
		DoNothing: true,
	}).Create(&items).Error
}

func seedSchools(tx *gorm.DB) error {
	typeNameToID := map[string]uint{}
	var st []entity.SchoolType
	if err := tx.Find(&st).Error; err != nil {
		return err
	}
	for _, x := range st {
		typeNameToID[x.Name] = x.ID
	}

	mustID := func(name string) (uint, error) {
		id, ok := typeNameToID[name]
		if !ok || id == 0 {
			return 0, fmt.Errorf("missing SchoolType: %s", name)
		}
		return id, nil
	}

	govID, err := mustID("โรงเรียนรัฐบาล")
	if err != nil {
		return err
	}
	privateID, err := mustID("โรงเรียนเอกชน")
	if err != nil {
		return err
	}
	demoID, err := mustID("โรงเรียนสาธิต")
	if err != nil {
		return err
	}
	interID, err := mustID("โรงเรียนนานาชาติ")
	if err != nil {
		return err
	}
	vocaID, err := mustID("อาชีวศึกษา (วิทยาลัย/เทคนิค)")
	if err != nil {
		return err
	}
	nonFormalID, err := mustID("กศน.")
	if err != nil {
		return err
	}
	foreignID, err := mustID("ต่างประเทศ")
	if err != nil {
		return err
	}
	homeID, err := mustID("Homeschool")
	if err != nil {
		return err
	}
	otherID, err := mustID("อื่นๆ")
	if err != nil {
		return err
	}

	items := []entity.School{
		{Code: "TH-BKK-0001", Name: "โรงเรียนเตรียมอุดมศึกษา", SchoolTypeID: govID},
		{Code: "TH-BKK-0002", Name: "โรงเรียนสวนกุหลาบวิทยาลัย", SchoolTypeID: govID},
		{Code: "TH-BKK-0003", Name: "โรงเรียนสตรีวิทยา", SchoolTypeID: govID},
		{Code: "TH-BKK-0004", Name: "โรงเรียนสาธิตจุฬาลงกรณ์มหาวิทยาลัย", SchoolTypeID: demoID},
		{Code: "TH-BKK-0005", Name: "Bangkok Patana School", SchoolTypeID: interID},
		{Code: "TH-BKK-0006", Name: "NIST International School", SchoolTypeID: interID},
		{Code: "TH-BKK-0007", Name: "โรงเรียนอัสสัมชัญ", SchoolTypeID: privateID},
		{Code: "TH-VOC-0001", Name: "วิทยาลัยเทคนิคกรุงเทพ", SchoolTypeID: vocaID},
		{Code: "TH-NAK-0001", Name: "โรงเรียนสุรนารีวิทยา", SchoolTypeID: govID},
		{Code: "TH-NAK-0002", Name: "โรงเรียนราชสีมาวิทยาลัย", SchoolTypeID: govID},
		{Code: "TH-NAK-0003", Name: "วิทยาลัยเทคนิคนครราชสีมา", SchoolTypeID: vocaID},
		{Code: "TH-NFE-0001", Name: "กศน. เขตพื้นที่ (ตัวอย่าง)", SchoolTypeID: nonFormalID},
		{Code: "TH-HSC-0001", Name: "Homeschool Program (ตัวอย่าง)", SchoolTypeID: homeID},
		{Code: "TH-FOR-0001", Name: "High School - USA (Sample)", SchoolTypeID: foreignID},
		{Code: "TH-OTH-0001", Name: "โรงเรียนตัวอย่าง A", SchoolTypeID: otherID},
		{Code: "TH-OTH-0002", Name: "โรงเรียนตัวอย่าง B", SchoolTypeID: otherID},
	}

	for i := 1; i <= 200; i++ {
		code := fmt.Sprintf("TH-DMY-%04d", i)
		name := fmt.Sprintf("โรงเรียนตัวอย่างสำหรับทดสอบ #%d", i)
		items = append(items, entity.School{
			Code:         code,
			Name:         name,
			SchoolTypeID: govID,
		})
	}

	return tx.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "code"}},
		DoNothing: true,
	}).Create(&items).Error
}
