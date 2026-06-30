package services

import (
	"context"
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

// uploadIfProvided uploads a file if not nil, returns empty string if nil
func (s *ProductService) uploadIfProvided(ctx context.Context, file multipart.File, folder string) (string, error) {
	if file == nil {
		return "", nil
	}
	url, err := s.cloudinary.UploadImage(ctx, file, folder)
	if err != nil {
		return "", fmt.Errorf("error uploading image: %w", err)
	}
	return url, nil
}

func (s *ProductService) CreateProduct(
	ctx context.Context,
	sellerID uuid.UUID,
	categoryID int32,
	title, description string, price float64, condition string,
	image1 multipart.File, // required
	image2 multipart.File, // optional
	image3 multipart.File, // optional
	image4 multipart.File, // optional
) (db.Product, error) {
	// Upload image 1 -required
	if image1 == nil {
		return db.Product{}, fmt.Errorf("at least one image is required")
	}
	url1, err := s.cloudinary.UploadImage(ctx, image1, "products")
	if err != nil {
		return db.Product{}, fmt.Errorf("error uploading image 1: %w", err)
	}

	//  Upload images 2, 3, 4 - optional
	url2, err := s.uploadIfProvided(ctx, image2, "products")
	if err != nil {
		return db.Product{}, err
	}

	url3, err := s.uploadIfProvided(ctx, image3, "products")
	if err != nil {
		return db.Product{}, err
	}

	url4, err := s.uploadIfProvided(ctx, image4, "products")
	if err != nil {
		return db.Product{}, err
	}

	// Save product to database
	product, err := s.queries.CreateProduct(ctx, db.CreateProductParams{
		SellerID:    sellerID,
		CategoryID:  categoryID,
		Title:       title,
		Description: description,
		Price:       fmt.Sprintf("%.2f", price),
		Condition:   condition,
		ImageUrl1:   url1,
		ImageUrl2:   url2,
		ImageUrl3:   url3,
		ImageUrl4:   url4,
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
	title, description string, price float64, condition string,
	image1 multipart.File,
	image2 multipart.File,
	image3 multipart.File,
	image4 multipart.File,
	existing1, existing2, existing3, existing4 string,
) (db.Product, error) {
	// Upload new images or keep existing ones
	url1 := existing1
	if image1 != nil {
		u, err := s.cloudinary.UploadImage(ctx, image1, "products")
		if err != nil {
			return db.Product{}, fmt.Errorf("error uploading image 1: %w", err)
		}
		if existing1 != "" {
			_ = s.cloudinary.DeleteImage(ctx, existing1)
		}
		url1 = u
	}

	url2 := existing2
	if image2 != nil {
		u, err := s.cloudinary.UploadImage(ctx, image2, "products")
		if err != nil {
			return db.Product{}, fmt.Errorf("error uploading image 2: %w", err)
		}
		if existing2 != "" {
			_ = s.cloudinary.DeleteImage(ctx, existing2)
		}
		url2 = u
	}

	url3 := existing3
	if image3 != nil {
		u, err := s.cloudinary.UploadImage(ctx, image3, "products")
		if err != nil {
			return db.Product{}, fmt.Errorf("error uploading image 3: %w", err)
		}
		if existing3 != "" {
			_ = s.cloudinary.DeleteImage(ctx, existing3)
		}
		url3 = u
	}

	url4 := existing4
	if image4 != nil {
		u, err := s.cloudinary.UploadImage(ctx, image4, "products")
		if err != nil {
			return db.Product{}, fmt.Errorf("error uploading image 4: %w", err)
		}
		if existing4 != "" {
			_ = s.cloudinary.DeleteImage(ctx, existing4)
		}
		url4 = u
	}

	// Update product in database
	product, err := s.queries.UpdateProduct(ctx, db.UpdateProductParams{
		ID:          productID,
		SellerID:    sellerID,
		CategoryID:  categoryID,
		Title:       title,
		Description: description,
		Price:       fmt.Sprintf("%.2f", price),
		Condition:   condition,
		ImageUrl1:   url1,
		ImageUrl2:   url2,
		ImageUrl3:   url3,
		ImageUrl4:   url4,
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
	image1, image2, image3, image4 string,
) error {
	//  Delete from database first
	err := s.queries.DeleteProduct(ctx, db.DeleteProductParams{
		ID:       productID,
		SellerID: sellerID,
	})
	if err != nil {
		return fmt.Errorf("error deleting product: %w", err)
	}

	//  Delete all images from cloudinary
	for _, url := range []string{image1, image2, image3, image4} {
		if url != "" {
			_ = s.cloudinary.DeleteImage(ctx, url)
		}
	}

	return nil
}