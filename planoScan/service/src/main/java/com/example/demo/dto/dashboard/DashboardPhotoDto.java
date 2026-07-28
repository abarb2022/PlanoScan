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
public class DashboardPhotoDto {
  private UUID submissionId;
  private String photoUrl;
  private String submittedAt;
}
