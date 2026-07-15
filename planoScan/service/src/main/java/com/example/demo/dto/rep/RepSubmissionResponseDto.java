package com.example.demo.dto.rep;

import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RepSubmissionResponseDto {

  private UUID id;
  private String submittedAt;
  private String status;
  private String score;
  private String photoName;
}
