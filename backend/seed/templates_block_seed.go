package seed

import (
	"errors"
	"log"

	"github.com/sut68/team14/backend/config"
	"github.com/sut68/team14/backend/entity"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

func SeedTemplateBlocks() {
	db := config.GetDB()

	var count int64
	if err := db.Model(&entity.TemplatesBlock{}).Count(&count).Error; err != nil {
		log.Println("count template_blocks error:", err)
		return
	}
	if count > 0 {
		log.Println("template_blocks already seeded")
		return
	}

	templateBlocks := []entity.TemplatesBlock{
		{
			BlockName:      "picture1",
			BlockType:      "image",
			OrderIndex:     1,
			DefaultContent: datatypes.JSON([]byte(`{"url": "", "alt_text": ""}`)),
			DefaultStyle: datatypes.JSON([]byte(
				`{"width": "500px", 
            "height": "500px", 
            "border_radius": "0px",
            "padding": "10px", 
            "border": "1px solid #ccc",
            "box_shadow": "0 2px 4px rgba(0,0,0,0.1)", 
            "background_color": "#ffffff"}`)),
		},
		{
			BlockName:      "picture2",
			BlockType:      "image",
			OrderIndex:     2,
			DefaultContent: datatypes.JSON([]byte(`{"url": "", "alt_text": ""}`)),
			DefaultStyle: datatypes.JSON([]byte(
				`{"width": "500px", 
            "height": "500px", 
            "border_radius": "8px" ,
            "padding": "10px", 
            "border": "1px solid #ccc",
            "box_shadow": "0 2px 4px rgba(0,0,0,0.1)", 
            "background_color": "#ffffff"}`)),
		},
		{
			BlockName:      "picture3",
			BlockType:      "image",
			OrderIndex:     3,
			DefaultContent: datatypes.JSON([]byte(`{"url": "", "alt_text": ""}`)),
			DefaultStyle: datatypes.JSON([]byte(
				`{"width": "400px",
            "height": "400px",
            "border_radius": "16px",
            "padding": "10px",
            "border": "1px solid #ccc",
            "box_shadow": "0 2px 4px rgba(0,0,0,0.1)",
            "background_color": "#ffffff"}`)),
		},
		{
			BlockName:      "profile_picture",
			BlockType:      "image",
			OrderIndex:     4,
			DefaultContent: datatypes.JSON([]byte(`{"url": "", "alt_text": ""}`)),
			DefaultStyle: datatypes.JSON([]byte(
				`{"width": "300px",
            "height": "300px",
            "border_radius": "50%",
            "padding": "10px",
            "border": "1px solid #ccc",
            "box_shadow": "0 2px 4px rgba(0,0,0,0.1)",
            "background_color": "#ffffff"}`)),
		},
		{
			BlockName:      "picture4",
			BlockType:      "image",
			OrderIndex:     5,
			DefaultContent: datatypes.JSON([]byte(`{"url": "", "alt_text": ""}`)),
			DefaultStyle: datatypes.JSON([]byte(
				`{"width": "400px",
            "height": "400px",
            "border_radius": "32px 0px 32px 0px",
            "padding": "10px",
            "border": "1px solid #ccc",
            "box_shadow": "0 2px 4px rgba(0,0,0,0.1)",
            "background_color": "#ffffff"}`)),
		},
		{
			BlockName:      "picture5",
			BlockType:      "image",
			OrderIndex:     6,
			DefaultContent: datatypes.JSON([]byte(`{"url": "", "alt_text": ""}`)),
			DefaultStyle: datatypes.JSON([]byte(
				`{"width": "400px",
            "height": "400px",
            "border_radius": "0px 32px 0px 32px",
            "padding": "10px",
            "border": "1px solid #ccc",
            "box_shadow": "0 2px 4px rgba(0,0,0,0.1)",
            "background_color": "#ffffff"}`)),
		},
		{
			BlockName:      "textbox1",
			BlockType:      "text",
			OrderIndex:     7,
			DefaultContent: datatypes.JSON([]byte(`{"text": "Your text here", "font_size": "16px", "font_color": "#000000", "text_align": "left"}`)),
			DefaultStyle: datatypes.JSON([]byte(
				`{"width": "600px",
            "height": "auto",
            "border_radius": "0px",
            "padding": "10px",
            "border": "1px solid #ccc",
            "background_color": "#ffffff"}`)),
		},
		{
			BlockName:      "textbox2",
			BlockType:      "text",
			OrderIndex:     8,
			DefaultContent: datatypes.JSON([]byte(`{"text": "Your text here", "font_size": "16px", "font_color": "#000000", "text_align": "left"}`)),
			DefaultStyle: datatypes.JSON([]byte(
				`{"width": "600px",
            "height": "auto",
            "border_radius": "8px",
            "padding": "10px",
            "border": "1px solid #ccc",
            "background_color": "#ffffff"}`)),
		},
		{
			BlockName:      "textbox3",
			BlockType:      "text",
			OrderIndex:     9,
			DefaultContent: datatypes.JSON([]byte(`{"text": "Your text here", "font_size": "16px", "font_color": "#000000", "text_align": "left"}`)),
			DefaultStyle: datatypes.JSON([]byte(
				`{"width": "600px",
            "height": "auto",
            "border_radius": "0px",
            "padding": "10px",
            "border": "none",
            "background_color": "#ffffff"}`)),
		},
	}
	for _, block := range templateBlocks {
		var existing entity.TemplatesBlock

		err := db.Where("block_name = ? AND block_type = ?", block.BlockName, block.BlockType).First(&existing).Error
		switch {
		case errors.Is(err, gorm.ErrRecordNotFound):
			if err := db.Create(&block).Error; err != nil {
				log.Printf("Failed to create TemplateBlock %s: %v", block.BlockName, err)
			}
		case err != nil:
			log.Printf("Failed to query TemplateBlock %s: %v", block.BlockName, err)
		default:
			existing.DefaultContent = block.DefaultContent
			existing.DefaultStyle = block.DefaultStyle

			if err := db.Save(&existing).Error; err != nil {
				log.Printf("Failed to update TemplateBlock %s: %v", block.BlockName, err)
			}
		}
	}
}
