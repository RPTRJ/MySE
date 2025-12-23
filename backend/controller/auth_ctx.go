package controller

import (
	"errors"

	"github.com/gin-gonic/gin"
)

func getAuthUserID(ctx *gin.Context) (uint, error) {
	v, ok := ctx.Get("user_id")
	if !ok {
		return 0, errors.New("missing auth user_id in context")
	}

	id, ok := v.(uint)
	if ok && id > 0 {
		return id, nil
	}

	// เผื่อ middleware ใส่เป็น int
	if idInt, ok2 := v.(int); ok2 && idInt > 0 {
		return uint(idInt), nil
	}

	return 0, errors.New("invalid auth user_id in context")
}
