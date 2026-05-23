package models
package models

// Product represents a marketplace product
type Product struct {
	ID          string  `json:"id" bson:"_id"`
	Title       string  `json:"title" bson:"title" binding:"required"`
	Description string  `json:"description" bson:"description"`
	Price       float64 `json:"price" bson:"price" binding:"required"`
	SellerID    string  `json:"seller_id" bson:"seller_id" binding:"required"`
	Category    string  `json:"category" bson:"category"`
	Images      []string `json:"images" bson:"images"`
	CreatedAt   int64   `json:"created_at" bson:"created_at"`
	UpdatedAt   int64   `json:"updated_at" bson:"updated_at"`
}

// User represents a marketplace user
type User struct {
	ID        string `json:"id" bson:"_id"`
	Email     string `json:"email" bson:"email" binding:"required,email"`
	Username  string `json:"username" bson:"username" binding:"required"`
	Password  string `json:"-" bson:"password" binding:"required"`
	FullName  string `json:"full_name" bson:"full_name"`
	CreatedAt int64  `json:"created_at" bson:"created_at"`
	UpdatedAt int64  `json:"updated_at" bson:"updated_at"`
}
