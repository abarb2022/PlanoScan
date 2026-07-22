package com.example.demo.dto.submission;

import java.util.Map;
import java.util.UUID;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class SubmissionDetailDto {
  UUID id;
  String repName;
  String repEmail;
  UUID storeId;
  String storeName;
  String storeAddress;
  String assignmentDate;
  String submittedAt;
  String photoUrl;
  String planogramName;
  float overallScore;
  int stars;
  String status;
  boolean flaggedForReview;
  Map<String, Object> scoreDetail;
}
