package com.example.demo.dto.assignment;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssignmentRuleResponseDto {
  private UUID id;
  private UUID storeId;
  private String storeName;
  private String storeAddress;
  private UUID repId;
  private String repName;
  private String repeatType;
  private DayOfWeek dayOfWeek;
  private LocalDate validFrom;
  private LocalDate validUntil;
  private LocalDateTime createdAt;
}
