package com.example.demo.dto.rep;

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
public class RepAssignmentResponseDto {

  private UUID id;
  private RepAssignmentStoreDto store;
  private String assignmentDate;
  private String status;
  private String lastSubmittedAt;
  private List<RepSubmissionResponseDto> submissions;
}
