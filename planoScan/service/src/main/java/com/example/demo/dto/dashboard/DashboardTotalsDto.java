package com.example.demo.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardTotalsDto {
  private int outletsPlanned;
  private int outletsSubmitted;
  private int outletsMissed;
  private int outletsGraded;
  private int needsReview;
  private Float avgScore;
}
