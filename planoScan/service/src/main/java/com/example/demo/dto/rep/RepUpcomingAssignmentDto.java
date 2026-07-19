package com.example.demo.dto.rep;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RepUpcomingAssignmentDto {

  private String date;
  private RepAssignmentStoreDto store;
}
