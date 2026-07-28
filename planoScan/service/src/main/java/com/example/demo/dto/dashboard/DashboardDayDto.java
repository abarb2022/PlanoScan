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
public class DashboardDayDto {
  private String date;
  private String dayLabel;
  private List<DashboardVisitDto> visits;
}
