package com.example.demo.dto.rep;

import java.time.LocalDateTime;
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
public class RepResponseDto {
  private UUID id;
  private String name;
  private String surname;
  private String email;
  private String phone;
  private UUID companyId;
  private String companyName;
  private LocalDateTime createdAt;
  private List<AssignedStoreSummary> assignedStores;

  @Data
  @AllArgsConstructor
  @NoArgsConstructor
  public static class AssignedStoreSummary {
    private UUID id;
    private String name;
  }
}
