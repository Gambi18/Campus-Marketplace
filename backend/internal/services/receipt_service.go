package services

import (
	"bytes"
	"context"
	"fmt"
	"mime/multipart"
	"time"

	"github.com/jung-kurt/gofpdf"
)

type ReceiptService struct {
	cloudinary *CloudinaryService
}

func NewReceiptService(cloudinary *CloudinaryService) *ReceiptService {
	return &ReceiptService{cloudinary: cloudinary}
}

type ReceiptData struct {
	ReceiptNumber string
	Date          time.Time
	BuyerName     string
	SellerName    string
	ProductTitle  string
	CategoryName  string
	Condition     string
	Amount        string
	PlatformFee   string
	NetAmount     string
	PhoneNumber   string
	Operator      string
	Reference     string
	Status        string // "PAYMENT SUCCESSFUL" or "PAYMENT REFUNDED"
}

func (s *ReceiptService) GenerateAndUpload(ctx context.Context, data ReceiptData) (string, error) {
	// 1. Generate PDF bytes
	pdfBytes, err := s.generatePDF(data)
	if err != nil {
		return "", fmt.Errorf("error generating PDF: %w", err)
	}

	// 2. Convert bytes to multipart.File for Cloudinary upload
	file := newBytesFile(pdfBytes)

	// 3. Upload to Cloudinary
	url, err := s.cloudinary.UploadPDF(ctx, file, "receipts")
	if err != nil {
		return "", fmt.Errorf("error uploading receipt: %w", err)
	}

	return url, nil
}

func (s *ReceiptService) generatePDF(data ReceiptData) ([]byte, error) {
	pdf := gofpdf.New("P", "mm", "A4", "")
	pdf.AddPage()

	//  Header 
	pdf.SetFillColor(41, 128, 185)
	pdf.Rect(0, 0, 210, 40, "F")

	pdf.SetTextColor(255, 255, 255)
	pdf.SetFont("Arial", "B", 22)
	pdf.SetY(10)
	pdf.CellFormat(210, 10, "CAMPUS MARKETPLACE", "", 1, "C", false, 0, "")

	pdf.SetFont("Arial", "", 11)
	pdf.CellFormat(210, 8, "Official Payment Receipt", "", 1, "C", false, 0, "")

	//Receipt Number & Date
	pdf.SetY(50)
	pdf.SetTextColor(0, 0, 0)

	pdf.SetFillColor(240, 240, 240)
	pdf.Rect(10, 48, 190, 20, "F")

	pdf.SetFont("Arial", "B", 11)
	pdf.SetXY(15, 52)
	pdf.CellFormat(90, 8, "Receipt #: "+data.ReceiptNumber, "", 0, "L", false, 0, "")

	pdf.SetFont("Arial", "", 11)
	pdf.SetXY(105, 52)
	pdf.CellFormat(90, 8, "Date: "+data.Date.Format("02 Jan 2006, 15:04"), "", 1, "L", false, 0, "")

	//  Divider 
	pdf.SetY(75)
	pdf.SetDrawColor(41, 128, 185)
	pdf.Line(10, 75, 200, 75)

	//Parties 
	pdf.SetY(80)
	pdf.SetFont("Arial", "B", 12)
	pdf.SetTextColor(41, 128, 185)
	pdf.CellFormat(190, 8, "TRANSACTION PARTIES", "", 1, "L", false, 0, "")

	pdf.SetTextColor(0, 0, 0)
	pdf.SetFont("Arial", "B", 10)
	pdf.CellFormat(50, 7, "Buyer:", "", 0, "L", false, 0, "")
	pdf.SetFont("Arial", "", 10)
	pdf.CellFormat(140, 7, data.BuyerName, "", 1, "L", false, 0, "")

	pdf.SetFont("Arial", "B", 10)
	pdf.CellFormat(50, 7, "Seller:", "", 0, "L", false, 0, "")
	pdf.SetFont("Arial", "", 10)
	pdf.CellFormat(140, 7, data.SellerName, "", 1, "L", false, 0, "")

	//Divider 
	pdf.SetY(pdf.GetY() + 5)
	pdf.Line(10, pdf.GetY(), 200, pdf.GetY())

	//Product Details 
	pdf.SetY(pdf.GetY() + 5)
	pdf.SetFont("Arial", "B", 12)
	pdf.SetTextColor(41, 128, 185)
	pdf.CellFormat(190, 8, "PRODUCT DETAILS", "", 1, "L", false, 0, "")

	pdf.SetTextColor(0, 0, 0)
	rows := [][]string{
		{"Product:", data.ProductTitle},
		{"Category:", data.CategoryName},
		{"Condition:", data.Condition},
	}

	for _, row := range rows {
		pdf.SetFont("Arial", "B", 10)
		pdf.CellFormat(50, 7, row[0], "", 0, "L", false, 0, "")
		pdf.SetFont("Arial", "", 10)
		pdf.CellFormat(140, 7, row[1], "", 1, "L", false, 0, "")
	}

	// Divider 
	pdf.SetY(pdf.GetY() + 5)
	pdf.Line(10, pdf.GetY(), 200, pdf.GetY())

	//Payment Details 
	pdf.SetY(pdf.GetY() + 5)
	pdf.SetFont("Arial", "B", 12)
	pdf.SetTextColor(41, 128, 185)
	pdf.CellFormat(190, 8, "PAYMENT DETAILS", "", 1, "L", false, 0, "")

	pdf.SetTextColor(0, 0, 0)
	paymentRows := [][]string{
		{"Amount Paid:", data.Amount + " XAF"},
		{"Platform Fee:", data.PlatformFee + " XAF"},
		{"Net Amount:", data.NetAmount + " XAF"},
		{"Phone Number:", data.PhoneNumber},
		{"Operator:", data.Operator},
		{"Reference:", data.Reference},
	}

	for _, row := range paymentRows {
		pdf.SetFont("Arial", "B", 10)
		pdf.CellFormat(50, 7, row[0], "", 0, "L", false, 0, "")
		pdf.SetFont("Arial", "", 10)
		pdf.CellFormat(140, 7, row[1], "", 1, "L", false, 0, "")
	}

	// Status Banner 
	pdf.SetY(pdf.GetY() + 10)

	if data.Status == "PAYMENT SUCCESSFUL" {
		pdf.SetFillColor(39, 174, 96)
	} else {
		pdf.SetFillColor(231, 76, 60)
	}

	pdf.Rect(10, pdf.GetY(), 190, 15, "F")
	pdf.SetTextColor(255, 255, 255)
	pdf.SetFont("Arial", "B", 13)
	pdf.CellFormat(190, 15, data.Status, "", 1, "C", false, 0, "")

	// Footer 
	pdf.SetY(pdf.GetY() + 15)
	pdf.SetTextColor(128, 128, 128)
	pdf.SetFont("Arial", "I", 9)
	pdf.CellFormat(190, 6, "Thank you for using Campus Marketplace!", "", 1, "C", false, 0, "")
	pdf.CellFormat(190, 6, "This is an automatically generated receipt.", "", 1, "C", false, 0, "")

	//Output to bytes 
	var buf bytes.Buffer
	if err := pdf.Output(&buf); err != nil {
		return nil, fmt.Errorf("error outputting PDF: %w", err)
	}

	return buf.Bytes(), nil
}

// bytesFile wraps []byte to implement multipart.File
type bytesFile struct {
	*bytes.Reader
}

func newBytesFile(b []byte) multipart.File {
	return &bytesFile{bytes.NewReader(b)}
}

func (b *bytesFile) Close() error               { return nil }
func (b *bytesFile) ReadAt(p []byte, off int64) (int, error) {
	return b.Reader.ReadAt(p, off)
}
func (b *bytesFile) Seek(offset int64, whence int) (int64, error) {
	return b.Reader.Seek(offset, whence)
}