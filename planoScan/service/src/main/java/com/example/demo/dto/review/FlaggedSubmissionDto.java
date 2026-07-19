package com.example.demo.dto.review;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class FlaggedSubmissionDto {
  UUID submissionId;
  String repName;
  String repEmail;
  String storeName;
  String storeAddress;
  String assignmentDate;
  String submittedAt;
  String photoUrl;
  String planogramName;
  float overallScore;
  Map<String, Object> scoreDetail;
}
