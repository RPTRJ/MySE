package seed

import (
	"fmt"
	"log"

	"github.com/sut68/team14/backend/config"
	"github.com/sut68/team14/backend/entity"
	"gorm.io/gorm"
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
	items := []string{
		"มัธยมศึกษาตอนปลาย (ม.4-ม.6)",
		"อาชีวศึกษา (ปวช.)",
		"อาชีวศึกษา (ปวส.)",
		"เทียบเท่า ม.ปลาย (กศน.)",
		"GED",
		"International High School",
		"IB Diploma",
		"A-Level / UK Curriculum",
		"AP / US Curriculum",
		"Homeschool",
		"อื่นๆ",
	}

	for _, name := range items {
		var existing entity.EducationLevel
		if err := tx.Where("name = ?", name).First(&existing).Error; err != nil {
			// ไม่เจอ -> สร้างใหม่
			newItem := entity.EducationLevel{Name: name}
			if err := tx.Create(&newItem).Error; err != nil {
				log.Printf("❌ failed to seed EducationLevel %s: %v\n", name, err)
				return err
			} else {
				log.Printf("✅ seeded EducationLevel: %s\n", name)
			}
		}
	}
	return nil
}

func seedSchoolTypes(tx *gorm.DB) error {
	items := []string{
		"โรงเรียนรัฐบาล",
		"โรงเรียนเอกชน",
		"โรงเรียนสาธิต",
		"โรงเรียนนานาชาติ",
		"อาชีวศึกษา (วิทยาลัย/เทคนิค)",
		"กศน.",
		"ต่างประเทศ",
		"Homeschool",
		"อื่นๆ",
	}

	for _, name := range items {
		var existing entity.SchoolType
		if err := tx.Where("name = ?", name).First(&existing).Error; err != nil {
			newItem := entity.SchoolType{Name: name}
			if err := tx.Create(&newItem).Error; err != nil {
				log.Printf("❌ failed to seed SchoolType %s: %v\n", name, err)
				return err
			} else {
				log.Printf("✅ seeded SchoolType: %s\n", name)
			}
		}
	}
	return nil
}

func seedCurriculumTypes(tx *gorm.DB) error {
	items := []string{
		// สายสามัญ
		"วิทย์-คณิต",
		"ศิลป์-ภาษา",
		"ศิลป์-คำนวณ",
		"ศิลป์-สังคม",
		"ศิลป์-จีน",
		"ศิลป์-ญี่ปุ่น",
		"ศิลป์-เกาหลี",
		"ศิลป์-ฝรั่งเศส",
		"ศิลป์-เยอรมัน",
		"ศิลป์-สเปน",
		"กีฬา",
		"ดนตรี/นาฏศิลป์",
		"ศิลปกรรม",
		"STEM / Gifted",
		"English Program (EP)",
		"Mini English Program (MEP)",
		// สายอาชีพ
		"อุตสาหกรรม (ช่าง)",
		"ช่างยนต์",
		"ช่างไฟฟ้า/อิเล็กทรอนิกส์",
		"ช่างกลโรงงาน",
		"ช่างก่อสร้าง",
		"เทคนิคคอมพิวเตอร์/IT",
		"เมคคาทรอนิกส์/หุ่นยนต์",
		"พาณิชยกรรม/บัญชี",
		"ธุรกิจดิจิทัล",
		"การโรงแรม/ท่องเที่ยว",
		"คหกรรม/อาหาร",
		"เกษตร",
		"โลจิสติกส์",
		"อื่นๆ",
		// International Tracks
		"GED Track",
		"IB Track",
		"A-Level Track",
		"AP Track",
	}

	for _, name := range items {
		var existing entity.CurriculumType
		if err := tx.Where("name = ?", name).First(&existing).Error; err != nil {
			newItem := entity.CurriculumType{Name: name}
			if err := tx.Create(&newItem).Error; err != nil {
				log.Printf("❌ failed to seed CurriculumType %s: %v\n", name, err)
				return err
			} else {
				log.Printf("✅ seeded CurriculumType: %s\n", name)
			}
		}
	}
	return nil
}

func seedSchools(tx *gorm.DB) error {
	// Lookup IDs ของ SchoolType
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

	// ชุดตัวอย่าง
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

	// เพิ่ม dummy โรงเรียนเยอะๆ
	for i := 1; i <= 200; i++ {
		code := fmt.Sprintf("TH-DMY-%04d", i)
		name := fmt.Sprintf("โรงเรียนตัวอย่างสำหรับทดสอบ #%d", i)
		items = append(items, entity.School{
			Code:         code,
			Name:         name,
			SchoolTypeID: govID,
		})
	}

	// Insert โดย check ว่ามี code ซ้ำหรือไม่
	for _, school := range items {
		var existing entity.School
		if err := tx.Where("code = ?", school.Code).First(&existing).Error; err != nil {
			// ไม่เจอ -> สร้างใหม่
			if err := tx.Create(&school).Error; err != nil {
				log.Printf("❌ failed to seed School %s: %v\n", school.Code, err)
				return err
			} else {
				log.Printf("✅ seeded School: %s - %s\n", school.Code, school.Name)
			}
		}
	}
	return nil
}
