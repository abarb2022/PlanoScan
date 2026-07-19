package com.example.demo.ai.model;

import java.util.List;
import java.util.Map;

public record ScoringRequest(
    Map<String, Object> layoutSpec,
    byte[] submissionImageBytes,
    String submissionMimeType,
    List<ProductReference> productReferences) {

  public record ProductReference(String name, byte[] imageBytes, String mimeType) {}
}
