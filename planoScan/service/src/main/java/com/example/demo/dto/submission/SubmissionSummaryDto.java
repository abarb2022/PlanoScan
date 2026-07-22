package com.example.demo.dto.submission;

import java.util.UUID;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class SubmissionSummaryDto {
  UUID id;
  UUID repId;
  String repName;
  UUID storeId;
  String storeName;
  String planogramName;
  String photoUrl;
  float overallScore;
  int stars;
  String status;
  boolean flaggedForReview;
  String submittedAt;
}
