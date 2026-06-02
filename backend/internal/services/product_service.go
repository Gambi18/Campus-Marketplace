package services

import (
	"context"
	"database/sql"
	"fmt"
	"mime/multipart"

	db "campus-marketplace/internal/db/sqlc"

	"github.com/google/uuid"
)

type ProductService struct {
	queries    *db.Queries
	cloudinary *CloudinaryService
}

func NewProductService(queries *db.Queries, cloudinary *CloudinaryService) *ProductService {
	return &ProductService{
		queries:    queries,
		cloudinary: cloudinary,
	}
}

func (s *ProductService) CreateProduct(
	ctx context.Context,
	sellerID uuid.UUID,
	categoryID int32,
	title, description, price string,
	file multipart.File,
) (db.Product, error) {
	// Upload image to cloudinary if provided
	var imageURL sql.NullString
	if file != nil {
		url, err := s.cloudinary.UploadImage(ctx, file, "products")
		if err != nil {
			return db.Product{}, fmt.Errorf("error uploading image: %w", err)
		}
		imageURL = sql.NullString{String: url, Valid: true}
	}

	// Save product to database
	product, err := s.queries.CreateProduct(ctx, db.CreateProductParams{
		SellerID:    sellerID,
		CategoryID:  categoryID,
		Title:       title,
		Description: description,
		Price:       price,
		ImageUrl:    imageURL,
	})
	if err != nil {
		return db.Product{}, fmt.Errorf("error creating product: %w", err)
	}

	return product, nil
}

func (s *ProductService) UpdateProduct(
	ctx context.Context,
	productID uuid.UUID,
	sellerID uuid.UUID,
	categoryID int32,
	title, description, price string,
	file multipart.File,
	existingImageURL string,
) (db.Product, error) {
	// Handle image , upload new one if provided
	imageURL := sql.NullString{String: existingImageURL, Valid: existingImageURL != ""}

	if file != nil {
		// Upload new image
		url, err := s.cloudinary.UploadImage(ctx, file, "products")
		if err != nil {
			return db.Product{}, fmt.Errorf("error uploading image: %w", err)
		}
		imageURL = sql.NullString{String: url, Valid: true}

		// Delete old image from cloudinary
		if existingImageURL != "" {
			_ = s.cloudinary.DeleteImage(ctx, existingImageURL)
		}
	}

	// Update product in database
	product, err := s.queries.UpdateProduct(ctx, db.UpdateProductParams{
		ID:          productID,
		SellerID:    sellerID,
		CategoryID:  categoryID,
		Title:       title,
		Description: description,
		Price:       price,
		ImageUrl:    imageURL,
	})
	if err != nil {
		return db.Product{}, fmt.Errorf("error updating product: %w", err)
	}

	return product, nil
}

func (s *ProductService) DeleteProduct(
	ctx context.Context,
	productID uuid.UUID,
	sellerID uuid.UUID,
	imageURL string,
) error {
	// Delete product from database first
	err := s.queries.DeleteProduct(ctx, db.DeleteProductParams{
		ID:       productID,
		SellerID: sellerID,
	})
	if err != nil {
		return fmt.Errorf("error deleting product: %w", err)
	}

	// Delete image from cloudinary
	if imageURL != "" {
		_ = s.cloudinary.DeleteImage(ctx, imageURL)
	}

	return nil
}