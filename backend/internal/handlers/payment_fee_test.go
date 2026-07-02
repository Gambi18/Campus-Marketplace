package handlers

import "testing"

func TestComputePlatformFee(t *testing.T) {
	cases := []struct {
		name   string
		amount float64
		rate   float64
		want   float64
	}{
		{"3pct sale round down", 1000, 0.03, 30},
		{"1pct refund", 1000, 0.01, 10},
		{"rounds to nearest whole XAF up", 999, 0.03, 30},   // 29.97 -> 30
		{"rounds to nearest whole XAF down", 700, 0.03, 21}, // 21.0 -> 21
		{"half rounds up", 50, 0.03, 2},                     // 1.5 -> 2
		{"zero amount", 0, 0.03, 0},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := computePlatformFee(tc.amount, tc.rate); got != tc.want {
				t.Fatalf("computePlatformFee(%v, %v) = %v, want %v", tc.amount, tc.rate, got, tc.want)
			}
		})
	}
}
