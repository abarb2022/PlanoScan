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
public class DashboardVisitDto {
  private UUID storeId;
  private String storeName;
  private String storeAddress;
  private DashboardVisitStatus status;
  private Float score;
  private Integer stars;
  private List<DashboardPhotoDto> photos;
}
