package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strconv"
	"time"
)

type CamPayService struct {
	baseURL     string
	appUsername string
	appPassword string
	permanentToken string
	httpClient  *http.Client
}

//REQUEST/RESPONSE STRUCTS 

type CamPayTokenResponse struct {
	Token string `json:"token"`
}

type CamPayCollectRequest struct {
	Amount      string `json:"amount"`
	From        string `json:"from"`
	Description string `json:"description"`
	ExternalRef string `json:"external_ref"`
}

type CamPayCollectResponse struct {
	Reference   string `json:"reference"`
	UssdCode    string `json:"ussd_code"`
	Operator    string `json:"operator"`
	Status      string `json:"status"`
	Message     string `json:"message"`
	Code        string `json:"code"`
}

type CamPayTransactionStatus struct {
	Reference   string `json:"reference"`
	Status      string `json:"status"`
	Amount      string `json:"amount"`
	Operator    string `json:"operator"`
	Code        string `json:"code"`
	Message     string `json:"message"`
}

type CamPayWithdrawRequest struct {
	Amount      string `json:"amount"`
	To          string `json:"to"`
	Description string `json:"description"`
	ExternalRef string `json:"external_ref"`
}

type CamPayWithdrawResponse struct {
	Reference string `json:"reference"`
	Status    string `json:"status"`
	Message   string `json:"message"`
	Code      string `json:"code"`
}

// SERVICE 

func NewCamPayService(baseURL, appUsername, appPassword, permanentToken string) *CamPayService {
	return &CamPayService{
		baseURL:     baseURL,
		appUsername: appUsername,
		appPassword: appPassword,
		permanentToken: permanentToken,
		httpClient:  &http.Client{Timeout: 30 * time.Second},
	}
}

// getToken fetches a temporary access token from CamPay
func (s *CamPayService) getToken() (string, error) {
	payload := map[string]string{
		"username": s.appUsername,
		"password": s.appPassword,
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return "", fmt.Errorf("error marshaling token request: %w", err)
	}

	resp, err := s.httpClient.Post(
		s.baseURL+"/token/",
		"application/json",
		bytes.NewBuffer(body),
	)
	if err != nil {
		return "", fmt.Errorf("error calling CamPay token endpoint: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		body, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("CamPay token endpoint returned %d: %s", resp.StatusCode, string(body))
	}

	var tokenResp CamPayTokenResponse
	if err := json.NewDecoder(resp.Body).Decode(&tokenResp); err != nil {
		return "", fmt.Errorf("error decoding token response: %w", err)
	}

	if tokenResp.Token == "" {
		return "", fmt.Errorf("empty token received from CamPay")
	}

	return tokenResp.Token, nil
}

// doRequest makes an authenticated request to CamPay
func (s *CamPayService) doRequest(method, endpoint string, payload interface{}) ([]byte, error) {
	token := s.permanentToken
	if token == "" {
		var err error
		token, err = s.getToken()
		if err != nil {
			return nil, err
		}
	}

	var bodyReader io.Reader
	if payload != nil {
		body, err := json.Marshal(payload)
		if err != nil {
			return nil, fmt.Errorf("error marshaling request: %w", err)
		}
		bodyReader = bytes.NewBuffer(body)
	}

	req, err := http.NewRequest(method, s.baseURL+endpoint, bodyReader)
	if err != nil {
		return nil, fmt.Errorf("error creating request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Token "+token)

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("error making request: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("error reading response: %w", err)
	}

	// CamPay returns business errors (ER1xx/ER3xx) with a 200 body, but transport
	// or auth failures come back as 4xx/5xx — surface those instead of trying to
	// decode an error page as a success response.
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, fmt.Errorf("CamPay %s %s returned %d: %s", method, endpoint, resp.StatusCode, string(respBody))
	}

	return respBody, nil
}

func stripDecimals(amount string) string {
    f, err := strconv.ParseFloat(amount, 64)
    if err != nil {
        return amount
    }
    return strconv.Itoa(int(f))
}

// CollectPayment requests payment from a user's phone
func (s *CamPayService) CollectPayment(amount, phoneNumber, description, externalRef string) (*CamPayCollectResponse, error) {
	payload := CamPayCollectRequest{
		Amount:      stripDecimals(amount),
		From:        phoneNumber,
		Description: description,
		ExternalRef: externalRef,
	}

	respBody, err := s.doRequest("POST", "/collect/", payload)
	if err != nil {
		return nil, err
	}

	log.Printf(" CamPay raw response: %s", string(respBody))

	var collectResp CamPayCollectResponse
	if err := json.Unmarshal(respBody, &collectResp); err != nil {
		return nil, fmt.Errorf("error decoding collect response: %w", err)
	}

	log.Printf("CamPay parsed response: %+v", collectResp)

	switch collectResp.Code {
	case "ER101":
		return nil, fmt.Errorf("invalid phone number, ensure it starts with country code e.g 237XXXXXXXXX")
	case "ER102":
		return nil, fmt.Errorf("only MTN and Orange phone numbers are accepted")
	case "ER201":
		return nil, fmt.Errorf("invalid amount, decimal numbers are not allowed")
	case "ER301":
		return nil, fmt.Errorf("insufficient balance on buyer's account")
	}
	// temporary debug log
	log.Printf("CamPay collect response: %+v", collectResp)

	return &collectResp, nil
}

// GetTransactionStatus checks the status of a transaction
func (s *CamPayService) GetTransactionStatus(reference string) (*CamPayTransactionStatus, error) {
	respBody, err := s.doRequest("GET", "/transaction/"+reference+"/", nil)
	if err != nil {
		return nil, err
	}

	var status CamPayTransactionStatus
	if err := json.Unmarshal(respBody, &status); err != nil {
		return nil, fmt.Errorf("error decoding transaction status: %w", err)
	}

	return &status, nil
}

// Withdraw sends money to a phone number
func (s *CamPayService) Withdraw(amount, phoneNumber, description, externalRef string) (*CamPayWithdrawResponse, error) {
	payload := CamPayWithdrawRequest{
		Amount:      amount,
		To:          phoneNumber,
		Description: description,
		ExternalRef: externalRef,
	}

	respBody, err := s.doRequest("POST", "/withdraw/", payload)
	if err != nil {
		return nil, err
	}

	var withdrawResp CamPayWithdrawResponse
	if err := json.Unmarshal(respBody, &withdrawResp); err != nil {
		return nil, fmt.Errorf("error decoding withdraw response: %w", err)
	}

	return &withdrawResp, nil
}

