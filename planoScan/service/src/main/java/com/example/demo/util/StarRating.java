package com.example.demo.util;

public final class StarRating {

  private StarRating() {}

  public static int fromScore(float score) {
    return Math.max(0, Math.min(5, Math.round(score / 20f)));
  }

  public static float minScoreForStars(int stars) {
    return switch (stars) {
      case 0 -> 0f;
      case 1 -> 10f;
      case 2 -> 30f;
      case 3 -> 50f;
      case 4 -> 70f;
      case 5 -> 90f;
      default -> throw new IllegalArgumentException("stars must be between 0 and 5");
    };
  }

  public static float maxScoreForStars(int stars) {
    return switch (stars) {
      case 0 -> 9.999f;
      case 1 -> 29.999f;
      case 2 -> 49.999f;
      case 3 -> 69.999f;
      case 4 -> 89.999f;
      case 5 -> 100f;
      default -> throw new IllegalArgumentException("stars must be between 0 and 5");
    };
  }
}
