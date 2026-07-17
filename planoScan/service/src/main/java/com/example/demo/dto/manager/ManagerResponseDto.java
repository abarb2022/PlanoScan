package com.example.demo.dto.manager;

import java.time.LocalDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ManagerResponseDto {
  private UUID id;
  private String name;
  private String surname;
  private String email;
  private String phone;
  private UUID companyId;
  private String companyName;
  private LocalDateTime createdAt;
}
