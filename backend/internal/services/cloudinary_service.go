package services

import (
	"context"
	"fmt"
	"log"
	"mime/multipart"

	"github.com/cloudinary/cloudinary-go/v2"
	"github.com/cloudinary/cloudinary-go/v2/api/uploader"
)

type CloudinaryService struct {
	client *cloudinary.Cloudinary
}

func NewCloudinaryService(cloudName, apiKey, apiSecret string) (*CloudinaryService, error) {
	client, err := cloudinary.NewFromParams(cloudName, apiKey, apiSecret)
	if err != nil {
		return nil, fmt.Errorf("error creating cloudinary client: %w", err)
	}
	return &CloudinaryService{client: client}, nil
}

func (s *CloudinaryService) UploadImage(ctx context.Context, file multipart.File, folder string) (string, error) {
    if file == nil {
        return "", fmt.Errorf("file is nil")
    }

    log.Println("Uploading image to Cloudinary...")
    result, err := s.client.Upload.Upload(ctx, file, uploader.UploadParams{
        Folder: "campus-marketplace/" + folder,
    })
    if err != nil {
        log.Printf("Cloudinary upload error: %v", err)
        return "", fmt.Errorf("error uploading image: %w", err)
    }


    return result.SecureURL, nil
}

func (s *CloudinaryService) DeleteImage(ctx context.Context, imageURL string) error {
	// Extracts public ID from URL
	publicID, err := extractPublicID(imageURL)
	if err != nil {
		return err
	}

	_, err = s.client.Upload.Destroy(ctx, uploader.DestroyParams{
		PublicID: publicID,
	})
	if err != nil {
		return fmt.Errorf("error deleting image: %w", err)
	}

	return nil
}

// extractPublicID pulls the public ID from a cloudinary URL
func extractPublicID(url string) (string, error) {
	// Cloudinary URLs look like:
	// https://res.cloudinary.com/cloud/image/upload/v123/campus-marketplace/products/abc123.jpg
	// We need: campus-marketplace/products/abc123
	if url == "" {
		return "", fmt.Errorf("empty image URL")
	}

	// Finds "upload/" and take everything after it, strips version and extension
	uploadIdx := -1
	for i := range url {
		if i+7 <= len(url) && url[i:i+7] == "upload/" {
			uploadIdx = i + 7
			break
		}
	}

	if uploadIdx == -1 {
		return "", fmt.Errorf("invalid cloudinary URL")
	}

	rest := url[uploadIdx:]

	// Skip version segment (v1234567890/)
	if len(rest) > 1 && rest[0] == 'v' {
		for i, c := range rest {
			if c == '/' {
				rest = rest[i+1:]
				break
			}
		}
	}

	// Remove file extension
	for i := len(rest) - 1; i >= 0; i-- {
		if rest[i] == '.' {
			rest = rest[:i]
			break
		}
	}

	return rest, nil
}

// upload PDF file to cloudinary
func (s *CloudinaryService) UploadPDF(ctx context.Context, file multipart.File, folder string) (string, error) {
	if file == nil {
		return "", fmt.Errorf("file is nil")
	}

	result, err := s.client.Upload.Upload(ctx, file, uploader.UploadParams{
		Folder:       "campus-marketplace/" + folder,
		ResourceType: "image", 
	})
	if err != nil {
		return "", fmt.Errorf("error uploading PDF: %w", err)
	}
	log.Printf("PDF uploaded: %s", result.SecureURL)

	return result.SecureURL, nil
}