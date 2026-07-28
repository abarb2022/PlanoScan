package com.example.demo.dto.dashboard;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ManagerDashboardResponseDto {
  private String weekStart;
  private String weekEnd;
  private DashboardTotalsDto companyTotals;
  private List<RepWeeklyStatsDto> reps;
}
