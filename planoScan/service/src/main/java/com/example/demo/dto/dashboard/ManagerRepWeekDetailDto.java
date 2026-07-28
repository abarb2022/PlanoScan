package com.example.demo.dto.dashboard;

import java.util.List;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ManagerRepWeekDetailDto {
  private UUID repId;
  private String repName;
  private String repEmail;
  private String weekStart;
  private String weekEnd;
  private DashboardTotalsDto totals;
  private List<DashboardDayDto> days;
}
