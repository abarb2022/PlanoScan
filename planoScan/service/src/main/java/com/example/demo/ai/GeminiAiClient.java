package com.example.demo.ai;

import com.example.demo.ai.model.PlanogramLayout;
import com.example.demo.ai.model.ScoringRequest;
import com.example.demo.ai.model.ScoringResult;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.io.JsonEOFException;
import com.fasterxml.jackson.core.json.JsonReadFeature;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Slf4j
@Component
public class GeminiAiClient implements AiScoringClient {

  private static final String GEMINI_URL =
      "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent";

  private static final String PARSE_PROMPT =
      """
      Analyze this planogram image showing a refrigerator or shelf layout used in retail.
      Extract the shelf structure into structured JSON.

      For each shelf, identify each distinct section (left/right or single), the product brand/name \
      visible, and the number of facing units shown in the front row.

      Return ONLY valid JSON with this exact structure, no markdown or explanation:
      {
        "shelves": [
          {
            "number": 1,
            "sections": [
              {"position": "left", "productName": "Bavaria N6 Can 330ml", "facings": 6},
              {"position": "right", "productName": "Natakhtari Can Mixed", "facings": 8}
            ]
          }
        ],
        "totalShelves": 4,
        "notes": "any notable observations"
      }
      """;

  private static final String SCORE_PROMPT_TEMPLATE =
      """
      You are a planogram compliance inspector for a beverage refrigerator in retail stores.

      PLANOGRAM SPECIFICATION — what the refrigerator MUST look like:
      %s

      Reference product images follow this text (if provided).
      The LAST image in this message is the rep's actual shelf photo to evaluate.

      Evaluate the rep's photo on exactly 4 dimensions:
      1. brandAccuracy (0-100): Correct products/brands present where specified?
      2. quantityAccuracy (0-100): Correct number of facing units in each section?
      3. positionAccuracy (0-100): Products in correct shelf positions per planogram?
      4. stockFullness (0-100): Refrigerator stocked beyond just the front row (no visible gaps)?

      Violation severity rules:
      - HIGH: Product entirely wrong, missing, or completely absent from a required section
      - MEDIUM: Quantity significantly off (more than 2 units), or two products swapped positions
      - LOW: Minor quantity variance (1-2 units), small ordering issues

      Return ONLY valid JSON, no markdown or explanation:
      {
        "overallScore": 85,
        "subScores": {
          "brandAccuracy": 90,
          "quantityAccuracy": 80,
          "positionAccuracy": 85,
          "stockFullness": 85
        },
        "violations": [
          {
            "severity": "HIGH",
            "shelf": 2,
            "section": "left",
            "expected": "Bavaria IPA 500ml x5",
            "found": "Unknown product x3",
            "issue": "Wrong product brand and understocked"
          }
        ],
        "confidence": 82,
        "notes": "brief overall assessment"
      }
      """;

  private final RestClient restClient;
  private final ObjectMapper objectMapper;
  private final ObjectMapper lenientMapper;
  private final String apiKey;
  private final String model;

  public GeminiAiClient(
      @Value("${gemini.api.key}") String apiKey,
      @Value("${gemini.model}") String model,
      ObjectMapper objectMapper) {
    this.apiKey = apiKey;
    this.model = model;
    this.objectMapper = objectMapper;
    ObjectMapper lenient = objectMapper.copy();
    lenient.getFactory()
        .enable(JsonReadFeature.ALLOW_UNQUOTED_FIELD_NAMES.mappedFeature())
        .enable(JsonReadFeature.ALLOW_TRAILING_COMMA.mappedFeature())
        .enable(JsonReadFeature.ALLOW_MISSING_VALUES.mappedFeature())
        .enable(JsonReadFeature.ALLOW_SINGLE_QUOTES.mappedFeature());
    this.lenientMapper = lenient;
    this.restClient = RestClient.builder().build();
  }

  @Override
  public PlanogramLayout parsePlanogram(byte[] imageBytes, String mimeType) {
    List<Map<String, Object>> parts = new ArrayList<>();
    parts.add(textPart(PARSE_PROMPT));
    parts.add(imagePart(imageBytes, mimeType));

    String json = callGemini(parts);
    return parse(json, PlanogramLayout.class, "planogram");
  }

  @Override
  public ScoringResult scoreSubmission(ScoringRequest request) {
    String specJson;
    try {
      specJson = objectMapper.writeValueAsString(request.layoutSpec());
    } catch (JsonProcessingException e) {
      throw new IllegalStateException("Failed to serialize layoutSpec", e);
    }

    List<Map<String, Object>> parts = new ArrayList<>();
    parts.add(textPart(String.format(SCORE_PROMPT_TEMPLATE, specJson)));

    for (ScoringRequest.ProductReference ref : request.productReferences()) {
      parts.add(textPart("Product reference: " + ref.name()));
      parts.add(imagePart(ref.imageBytes(), ref.mimeType()));
    }

    parts.add(imagePart(request.submissionImageBytes(), request.submissionMimeType()));

    String json = callGemini(parts);
    return parse(json, ScoringResult.class, "scoring");
  }

  @Override
  public String modelVersion() {
    return model;
  }

  private <T> T parse(String json, Class<T> type, String context) {
    try {
      return objectMapper.readValue(json, type);
    } catch (JsonEOFException e) {
      // Response is missing closing bracket(s). Try adding them before giving up —
      // this handles Gemini stopping right before the final `}` with no content missing.
      String closed = closeOpenBrackets(json);
      try {
        T result = objectMapper.readValue(closed, type);
        log.warn("Gemini {} response was missing closing bracket(s) — repaired structurally and saved.", context);
        return result;
      } catch (JsonProcessingException e2) {
        log.error(
            "Gemini {} response is truncated mid-content and cannot be repaired. "
                + "The result will not be saved. Try increasing maxOutputTokens.",
            context);
        throw new IllegalStateException("Gemini " + context + " response truncated", e);
      }
    } catch (JsonProcessingException e) {
      // Syntax error — try lenient parser (handles missing commas, unquoted keys, etc.)
      try {
        log.warn("Gemini {} response has JSON syntax issues — retrying with lenient parser", context);
        return lenientMapper.readValue(json, type);
      } catch (JsonProcessingException e2) {
        log.error("Failed to parse Gemini {} response: {}", context, json, e2);
        throw new IllegalStateException("Gemini returned unparseable " + context + " JSON", e2);
      }
    }
  }

  private String closeOpenBrackets(String json) {
    int braces = 0;
    int brackets = 0;
    boolean inString = false;
    boolean escape = false;
    for (int i = 0; i < json.length(); i++) {
      char c = json.charAt(i);
      if (escape) { escape = false; continue; }
      if (c == '\\' && inString) { escape = true; continue; }
      if (c == '"') { inString = !inString; continue; }
      if (inString) continue;
      if (c == '{') braces++;
      else if (c == '}') braces--;
      else if (c == '[') brackets++;
      else if (c == ']') brackets--;
    }
    StringBuilder sb = new StringBuilder(json);
    for (int i = 0; i < brackets; i++) sb.append(']');
    for (int i = 0; i < braces; i++) sb.append('}');
    return sb.toString();
  }

  private String callGemini(List<Map<String, Object>> parts) {
    Map<String, Object> body =
        Map.of(
            "contents", List.of(Map.of("parts", parts)),
            "generationConfig",
                Map.of(
                    "responseMimeType", "application/json",
                    "temperature", 0.1,
                    "maxOutputTokens", 8192));

    if (log.isDebugEnabled()) {
      try {
        List<String> textParts = parts.stream()
            .filter(p -> p.containsKey("text"))
            .map(p -> (String) p.get("text"))
            .toList();
        long imageCount = parts.stream().filter(p -> p.containsKey("inlineData")).count();
        long totalImageKb = parts.stream()
            .filter(p -> p.containsKey("inlineData"))
            .mapToLong(p -> {
              @SuppressWarnings("unchecked")
              Map<String, Object> inline = (Map<String, Object>) p.get("inlineData");
              String data = (String) inline.get("data");
              return data != null ? data.length() * 3L / 4 / 1024 : 0;
            })
            .sum();
        log.debug("Gemini request — {} part(s) total ({} image(s), ~{} KB), text prompts:\n{}",
            parts.size(), imageCount, totalImageKb, String.join("\n---\n", textParts));
      } catch (Exception ignored) {}
    }

    JsonNode response =
        restClient
            .post()
            .uri(GEMINI_URL + "?key={key}", model, apiKey)
            .header("Content-Type", "application/json")
            .body(body)
            .retrieve()
            .body(JsonNode.class);

    if (response == null) {
      throw new IllegalStateException("Gemini returned null response");
    }

    JsonNode candidates = response.path("candidates");
    if (!candidates.isArray() || candidates.isEmpty()) {
      log.error("Unexpected Gemini response: {}", response);
      throw new IllegalStateException("Gemini response has no candidates");
    }

    JsonNode candidate = candidates.get(0);
    String finishReason = candidate.path("finishReason").asText("UNKNOWN");
    if (!"STOP".equals(finishReason)) {
      log.warn("Gemini finishReason={} — response may be truncated", finishReason);
    }

    String text = candidate.path("content").path("parts").get(0).path("text").asText();
    String cleaned = cleanJson(text);
    log.info("Gemini raw response (finishReason={}):\n{}", finishReason, cleaned);
    return cleaned;
  }

  private String cleanJson(String raw) {
    String cleaned = raw.strip();
    if (cleaned.startsWith("```")) {
      int start = cleaned.indexOf('\n') + 1;
      int end = cleaned.lastIndexOf("```");
      if (end > start) {
        cleaned = cleaned.substring(start, end).strip();
      }
    }
    return cleaned;
  }

  private Map<String, Object> textPart(String text) {
    return Map.of("text", text);
  }

  private Map<String, Object> imagePart(byte[] bytes, String mimeType) {
    Map<String, Object> inline = new HashMap<>();
    inline.put("mimeType", mimeType);
    inline.put("data", Base64.getEncoder().encodeToString(bytes));
    return Map.of("inlineData", inline);
  }
}
