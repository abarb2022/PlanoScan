package com.example.demo.dto.rep;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class RepAssignmentPageResponseDto {
  private List<RepAssignmentResponseDto> content;
  private int totalPages;
  private long totalElements;
  private int currentPage;
}
