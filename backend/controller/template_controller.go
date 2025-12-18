package controller

import (
    "github.com/gin-gonic/gin"
    "github.com/sut68/team14/backend/config"
    "github.com/sut68/team14/backend/entity"
    "gorm.io/gorm"
    "net/http"
)

// GET /templates ทั้งหมด
func GetTemplates(c *gin.Context) {
    var templates []entity.Templates
    
    if err := config.GetDB().
        Preload("TemplateSectionLinks", func(db *gorm.DB) *gorm.DB {
            return db.Order("order_index ASC")
        }).
        Preload("TemplateSectionLinks.TemplatesSection").
        Preload("TemplateSectionLinks.TemplatesSection.SectionBlocks", func(db *gorm.DB) *gorm.DB {
            return db.Order("order_index ASC")
        }).
        Preload("TemplateSectionLinks.TemplatesSection.SectionBlocks.TemplatesBlock").
        Find(&templates).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    
    c.JSON(http.StatusOK, templates)
}

// GET /templates/:id
func GetTemplateByID(c *gin.Context) {
    templateID := c.Param("id")
    var template entity.Templates
    
    if err := config.GetDB().
        Preload("TemplateSectionLinks", func(db *gorm.DB) *gorm.DB {
            return db.Order("order_index ASC")
        }).
        Preload("TemplateSectionLinks.TemplatesSection").
        Preload("TemplateSectionLinks.TemplatesSection.SectionBlocks", func(db *gorm.DB) *gorm.DB {
            return db.Order("order_index ASC")
        }).
        Preload("TemplateSectionLinks.TemplatesSection.SectionBlocks.TemplatesBlock").
        First(&template, templateID).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "Template not found"})
        return
    }
    
    c.JSON(http.StatusOK, template)
}