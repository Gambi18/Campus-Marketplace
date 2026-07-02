package handlers

import "testing"

// TestDetectOperator covers the pure phone-prefix -> operator mapping. The
// operator is derived from phone[3:6] (i.e. the 3 digits after the "237" country
// code), so callers pass numbers like "237650...". MTN owns an explicit prefix
// set; everything else falls through to Orange, and too-short input is "unknown".
func TestDetectOperator(t *testing.T) {
	tests := []struct {
		name  string
		phone string
		want  string
	}{
		{"mtn 650", "237650123456", "MTN"},
		{"mtn 670", "237670000000", "MTN"},
		{"mtn 679 boundary", "237679999999", "MTN"},
		{"orange 690", "237690123456", "Orange"},
		{"orange 655 not in mtn set", "237655123456", "Orange"},
		{"orange 680 not in mtn set", "237680123456", "Orange"},
		{"too short -> unknown", "23765", "unknown"},
		{"empty -> unknown", "", "unknown"},
		{"exactly 6 chars mtn prefix", "237650", "MTN"},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			if got := detectOperator(tc.phone); got != tc.want {
				t.Errorf("detectOperator(%q) = %q, want %q", tc.phone, got, tc.want)
			}
		})
	}
}
