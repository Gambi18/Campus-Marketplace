package notification

const (
    NotificationNewMessage       = "NEW_MESSAGE"
    NotificationNewOffer         = "NEW_OFFER"
    NotificationOfferAccepted    = "OFFER_ACCEPTED"
    NotificationItemSold         = "ITEM_SOLD"
    NotificationListingApproved  = "LISTING_APPROVED"
    NotificationListingRejected  = "LISTING_REJECTED"
    NotificationPasswordReset    = "PASSWORD_RESET"
    NotificationEmailVerification = "EMAIL_VERIFICATION"
)

type NotificationMetadata map[string]interface{}
