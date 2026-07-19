package com.example.demo.ai;

import com.example.demo.ai.model.PlanogramLayout;
import com.example.demo.ai.model.ScoringRequest;
import com.example.demo.ai.model.ScoringResult;
import java.util.Map;

public interface AiScoringClient {

  /**
   * Parses a planogram image into a structured layout. Called once when a manager uploads a
   * planogram; the result is saved to Planogram.layoutSpec so the image is never re-sent.
   */
  PlanogramLayout parsePlanogram(byte[] imageBytes, String mimeType);

  /**
   * Scores a rep's shelf photo against the planogram specification. Returns a structured result
   * with an overall score, four sub-scores, and a list of violations.
   */
  ScoringResult scoreSubmission(ScoringRequest request);

  /** Returns the identifier of the model being used, stored in Score.aiModelVersion. */
  String modelVersion();

  /** Converts a PlanogramLayout to the raw Map stored in Planogram.layoutSpec. */
  static Map<String, Object> layoutToMap(PlanogramLayout layout) {
    return Map.of(
        "shelves",
        layout.shelves().stream()
            .map(
                shelf ->
                    Map.of(
                        "number", shelf.number(),
                        "sections",
                        shelf.sections().stream()
                            .map(
                                s ->
                                    Map.of(
                                        "position", s.position(),
                                        "productName", s.productName(),
                                        "facings", s.facings()))
                            .toList()))
            .toList(),
        "totalShelves", layout.totalShelves(),
        "notes", layout.notes() == null ? "" : layout.notes());
  }
}
