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
public class RepAssignmentStoreDto {

  private UUID id;
  private String name;
  private String address;
  private String companyName;
}
