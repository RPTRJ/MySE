package seed

import (
	"log"

	"github.com/sut68/team14/backend/config"
	"github.com/sut68/team14/backend/entity"
)

func SeedTemplates() {
	db := config.GetDB()

	// ดึง sections ที่มีอยู่
	var sections []entity.TemplatesSection
	db.Find(&sections)

	if len(sections) == 0 {
		log.Println("⚠ No sections found, skipping template seeding")
		return
	}

	// สร้าง map สำหรับหา section ID ตามชื่อ
	sectionMap := make(map[string]uint)
	for _, s := range sections {
		sectionMap[s.SectionName] = s.ID
	}

	// ✅ แก้ไขชื่อ SectionNames ให้ตรงกับที่ Seed ไว้ใน templates_section_seed.go
	templates := []struct {
		Name         string
		Description  string
		SectionNames []string
	}{
		{
			Name:        "Professional Portfolio",
			Description: "เทมเพลตสำหรับสร้างพอร์ตโฟลิโอแบบมืออาชีพ",
			SectionNames: []string{
				"Profile Left",       // แก้จาก Profile Page Full เป็น Profile Left
				"Portfolio Showcase", // ชื่อนี้ถูกต้องแล้ว
			},
		},
		{
			Name:        "Simple Profile",
			Description: "เทมเพลตโปรไฟล์แบบเรียบง่าย",
			SectionNames: []string{
				"Profile Left", // แก้จาก Profile Page Full
				"About Me Section", // เพิ่ม About Me เข้าไปหน่อยเพื่อความสมบูรณ์
			},
		},
		{
			Name:        "Creative Portfolio",
			Description: "เทมเพลตสำหรับพอร์ตโฟลิโอแนวสร้างสรรค์",
			SectionNames: []string{
				"Profile Right",      // แก้จาก Profile Page Full (ลองใช้ Profile Right บ้าง)
				"Portfolio Showcase", // แก้จาก Portfolio Gallery (เพราะเรายังไม่มี Gallery)
			},
		},
	}

	for _, t := range templates {
		var existing entity.Templates
		if err := db.Where("template_name = ?", t.Name).First(&existing).Error; err != nil {
			// สร้าง template ใหม่
			template := entity.Templates{
				TemplateName: t.Name,
				Description:  t.Description,
			}
			if err := db.Create(&template).Error; err != nil {
				log.Printf("❌ Error seeding template %s: %v", t.Name, err)
				continue
			}

			// สร้างความสัมพันธ์ template-sections
			createdSections := 0
			for i, sectionName := range t.SectionNames {
				if sectionID, ok := sectionMap[sectionName]; ok {
					ts := entity.TemplateSectionLink{
						TemplatesID:        template.ID,
						TemplatesSectionID: sectionID,
						OrderIndex:         uint(i),
					}
					if err := db.Create(&ts).Error; err != nil {
						log.Printf("❌ Error creating template_section: %v", err)
					} else {
						createdSections++
					}
				} else {
					log.Printf("⚠ Section '%s' not found in templates_sections", sectionName)
				}
			}
			log.Printf("✓ Seeded template: %s (%d/%d sections)", t.Name, createdSections, len(t.SectionNames))
		} else {
			log.Printf("- Template already exists: %s", t.Name)
		}
	}
}