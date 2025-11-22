package entity

import "gorm.io/gorm"

type Curriculum struct {
	gorm.Model
	Code              string  `json:"code"`                 // รหัสหลักสูตร
	Name              string  `json:"name"`                 // ชื่อหลักสูตร
	Description       string  `json:"description"`          // รายละเอียด
	GPAXMin           float32 `json:"gpax_min"`             // GPAX ขั้นต่ำ
	PortfolioMaxPages int     `json:"portfolio_max_pages"`  // จำนวนหน้าพอร์ตสูงสุด
	Status            string  `json:"status"`               // draft/published/archived

	// FK
	FacultyID uint     `json:"faculty_id"`
	Faculty   *Faculty `gorm:"foreignKey:FacultyID" json:"faculty"`

	ProgramID uint     `json:"program_id"`
	Program   *Program `gorm:"foreignKey:ProgramID" json:"program"`

	UserID uint  `json:"user_id"` // คนสร้าง/ดูแลหลักสูตร
	User   *User `gorm:"foreignKey:UserID" json:"user"`

	// relation
	RequiredDocuments []CurriculumRequiredDocument `json:"required_documents"`
	Skills            []CurriculumSkill            `json:"skills"`
}
