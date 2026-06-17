package services

import (
	"context"
	"fmt"
	"io"
	"log"
	"mime/multipart"
	"os"
	"path/filepath"

	"github.com/cloudinary/cloudinary-go/v2"
	"github.com/cloudinary/cloudinary-go/v2/api/uploader"
	"github.com/google/uuid"
)

type CloudinaryService struct {
	client    *cloudinary.Cloudinary
	localMode bool
}

func NewCloudinaryService(cloudName, apiKey, apiSecret string) (*CloudinaryService, error) {
	if cloudName == "" {
		log.Println("Cloudinary not configured — using local file storage")
		if err := os.MkdirAll("./uploads", 0755); err != nil {
			return nil, fmt.Errorf("could not create uploads directory: %w", err)
		}
		return &CloudinaryService{localMode: true}, nil
	}
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

	if s.localMode {
		return s.uploadLocal(file, folder)
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

func (s *CloudinaryService) uploadLocal(file multipart.File, folder string) (string, error) {
	ext := ".jpg"
	data, err := io.ReadAll(file)
	if err != nil {
		return "", fmt.Errorf("error reading file: %w", err)
	}

	filename := uuid.New().String() + ext
	dir := filepath.Join("./uploads", folder)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return "", fmt.Errorf("could not create directory: %w", err)
	}

	path := filepath.Join(dir, filename)
	if err := os.WriteFile(path, data, 0644); err != nil {
		return "", fmt.Errorf("error writing file: %w", err)
	}

	log.Printf("Saved image locally: %s", path)
	baseURL := os.Getenv("APP_BASE_URL")
	if baseURL == "" {
		baseURL = "http://localhost:8080"
	}
	return baseURL + "/uploads/" + folder + "/" + filename, nil
}

func (s *CloudinaryService) DeleteImage(ctx context.Context, imageURL string) error {
	if s.localMode {
		localPath := "." + imageURL
		if err := os.Remove(localPath); err != nil && !os.IsNotExist(err) {
			return fmt.Errorf("error deleting local file: %w", err)
		}
		return nil
	}

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

func extractPublicID(url string) (string, error) {
	if url == "" {
		return "", fmt.Errorf("empty image URL")
	}

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

	if len(rest) > 1 && rest[0] == 'v' {
		for i, c := range rest {
			if c == '/' {
				rest = rest[i+1:]
				break
			}
		}
	}

	for i := len(rest) - 1; i >= 0; i-- {
		if rest[i] == '.' {
			rest = rest[:i]
			break
		}
	}

	return rest, nil
}

func (s *CloudinaryService) UploadPDF(ctx context.Context, file multipart.File, folder string) (string, error) {
	if file == nil {
		return "", fmt.Errorf("file is nil")
	}

	if s.localMode {
		return s.uploadLocal(file, folder)
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