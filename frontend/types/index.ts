// User authentication types
export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface Session {
  access_token: string;
  refresh_token: string;
  user: User;
}

// Prediction request and response types
export interface PredictionResponse {
  freshness: "Fresh" | "Spoiled";
  freshness_confidence: number;
  marbling: "small" | "slight" | "modest" | "moderate" | "slightly_abundant";
  marbling_confidence: number;
  fat_ratio_percent: number;
  fat_ratio_category: "None" | "Small" | "Large";
  meat_quality_score: number;
  assessment_id: string;
  image_url: string;
}

// Assessment record type
export interface Assessment {
  id: string;
  user_id: string;
  image_url: string;
  freshness: string;
  freshness_confidence: number;
  marbling: string;
  marbling_confidence: number;
  fat_ratio: number;
  fat_category: string;
  meat_quality_score: number;
  created_at: string;
}

// Analytics data type
export interface AnalyticsData {
  total_assessments: number;
  average_mqs: number;
  freshness_distribution: {
    Fresh: number;
    Spoiled: number;
  };
  marbling_distribution: {
    small: number;
    slight: number;
    modest: number;
    moderate: number;
    slightly_abundant: number;
  };
}
