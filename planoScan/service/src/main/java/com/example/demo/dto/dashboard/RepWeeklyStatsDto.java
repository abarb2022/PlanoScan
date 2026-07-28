package com.example.demo.dto.dashboard;

import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RepWeeklyStatsDto {
  private UUID repId;
  private String repName;
  private String repEmail;
  private DashboardTotalsDto totals;
  private Float completionRate;
}
