package com.example.demo.dto.planogram;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class PlanogramResponseDto {
  UUID id;
  UUID companyId;
  String name;
  String productCategory;
  String referenceImageUrl;
  boolean parsed;
  Map<String, Object> layoutSpec;
  UUID storeId;
  String storeName;
  LocalDate validFrom;
  LocalDate validUntil;
  boolean active;
  LocalDateTime createdAt;
}
