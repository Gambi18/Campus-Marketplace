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
	Password  string `json:"password" bson:"password" binding:"required"`
	FullName  string `json:"full_name" bson:"full_name"`
	CreatedAt int64  `json:"created_at" bson:"created_at"`
	UpdatedAt int64  `json:"updated_at" bson:"updated_at"`
}

// Registration is what the user send while signin up
type RegisterRequest struct {
	Username  string `json:"username" binding:"required,min=3,max=50"`
	Email     string `json:"email" binding:"required,email"`
	Password  string `json:"password" binding:"required,min=6,max=50"`

}
// what user sends while logging in
type LoginRequest struct {
	Email     string `json:"email" binding:"required,email"`
	Password  string `json:"password" binding:"required"`

}

//AuthResponse is what we send after register or login

type AuthResponse struct {
	Token string  `json:"token"`
	User UserResponse `json:"user"`
}

type UserResponse struct {
	ID string `json:"id"`
	Username string `json:"username"`
	Email string `json:"email"`
	Role string `json:"role"`
	IsVerified bool `json:"is_verified"`
}
