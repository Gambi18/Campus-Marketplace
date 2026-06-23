package notification

const (
	NotificationNewMessage        = "NEW_MESSAGE"
	NotificationNewOffer          = "NEW_OFFER"
	NotificationOfferAccepted     = "OFFER_ACCEPTED"
	NotificationItemSold          = "ITEM_SOLD"
	NotificationListingApproved   = "LISTING_APPROVED"
	NotificationListingRejected   = "LISTING_REJECTED"
	NotificationPaymentReceived   = "PAYMENT_RECEIVED"
	NotificationPaymentConfirmed  = "PAYMENT_CONFIRMED"
	NotificationPaymentReleased   = "PAYMENT_RELEASED"
	NotificationAccountApproved   = "ACCOUNT_APPROVED"
	NotificationAccountRejected   = "ACCOUNT_REJECTED"
	NotificationAccountBlocked    = "ACCOUNT_BLOCKED"
	NotificationPasswordReset     = "PASSWORD_RESET"
	NotificationEmailVerification = "EMAIL_VERIFICATION"
)

type NotificationMetadata map[string]interface{}
