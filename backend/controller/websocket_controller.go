package controller

import (
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

// กำหนดการตั้งค่าสำหรับการ Upgrade connection (อนุญาตทุก Origin เพื่อความง่ายในการเทส)
var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
	// ✅ Set buffer sizes to limit memory usage
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}

// ✅ Rate limiter for WebSocket connections
type rateLimiter struct {
	mu          sync.Mutex
	clients     map[string]int
	maxPerIP    int
	cleanupTime time.Duration
}

var wsRateLimiter = &rateLimiter{
	clients:     make(map[string]int),
	maxPerIP:    5, // Max 5 connections per IP
	cleanupTime: time.Minute,
}

func (rl *rateLimiter) allow(ip string) bool {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	if rl.clients[ip] >= rl.maxPerIP {
		return false
	}
	rl.clients[ip]++
	return true
}

func (rl *rateLimiter) release(ip string) {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	if rl.clients[ip] > 0 {
		rl.clients[ip]--
	}
	if rl.clients[ip] == 0 {
		delete(rl.clients, ip)
	}
}

// ✅ Message rate limiter per connection
type messageRateLimiter struct {
	lastMessage time.Time
	minInterval time.Duration
}

func newMessageRateLimiter() *messageRateLimiter {
	return &messageRateLimiter{
		minInterval: 100 * time.Millisecond, // Max 10 messages per second
	}
}

func (mrl *messageRateLimiter) allow() bool {
	now := time.Now()
	if now.Sub(mrl.lastMessage) < mrl.minInterval {
		return false
	}
	mrl.lastMessage = now
	return true
}

// WebSocketHandler รับการเชื่อมต่อ - WITH RATE LIMITING & HEARTBEAT
func WebSocketHandler(c *gin.Context) {
	clientIP := c.ClientIP()

	// ✅ Check connection rate limit
	if !wsRateLimiter.allow(clientIP) {
		c.JSON(http.StatusTooManyRequests, gin.H{"error": "Too many WebSocket connections"})
		return
	}
	defer wsRateLimiter.release(clientIP)

	// 1. Upgrade HTTP -> WebSocket
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		fmt.Println("Error upgrading:", err)
		return
	}
	defer conn.Close()

	// ✅ Set connection limits - เพิ่มเวลาเป็น 5 นาที
	conn.SetReadLimit(4096) // Max message size: 4KB
	conn.SetReadDeadline(time.Now().Add(5 * time.Minute))
	conn.SetPongHandler(func(string) error {
		conn.SetReadDeadline(time.Now().Add(5 * time.Minute))
		return nil
	})

	fmt.Println("Client connected:", clientIP)

	// ✅ Create message rate limiter for this connection
	msgLimiter := newMessageRateLimiter()

	// ✅ Start ping goroutine to keep connection alive
	done := make(chan struct{})
	go func() {
		ticker := time.NewTicker(30 * time.Second) // Ping every 30 seconds
		defer ticker.Stop()
		for {
			select {
			case <-ticker.C:
				conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
				if err := conn.WriteMessage(websocket.PingMessage, nil); err != nil {
					return
				}
			case <-done:
				return
			}
		}
	}()
	defer close(done)

	// 2. วนลูปรับ/ส่งข้อมูล
	for {
		// รอรับข้อความจาก Client (Browser)
		messageType, p, err := conn.ReadMessage()
		if err != nil {
			fmt.Println("Client disconnected:", err)
			break
		}

		// ✅ Check message rate limit
		if !msgLimiter.allow() {
			continue // Skip message if rate limited
		}

		// พิมพ์ข้อความที่ได้รับดู
		fmt.Printf("Received from %s: %s\n", clientIP, p)

		// ส่งข้อความตอบกลับไปหา Client (Echo)
		msg := []byte(fmt.Sprintf("Server ได้รับข้อความว่า: %s", p))

		// ✅ Set write deadline
		conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
		if err := conn.WriteMessage(messageType, msg); err != nil {
			fmt.Println("Error writing:", err)
			break
		}
	}
}
