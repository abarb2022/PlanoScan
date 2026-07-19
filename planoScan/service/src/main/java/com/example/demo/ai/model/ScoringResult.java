package com.example.demo.ai.model;

import java.util.List;

public record ScoringResult(
    int overallScore,
    SubScores subScores,
    List<Violation> violations,
    int confidence,
    String notes) {

  public record SubScores(
      int brandAccuracy, int quantityAccuracy, int positionAccuracy, int stockFullness) {}

  public record Violation(
      String severity, int shelf, String section, String expected, String found, String issue) {}
}
