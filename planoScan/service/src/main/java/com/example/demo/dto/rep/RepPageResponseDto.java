package com.example.demo.dto.rep;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RepPageResponseDto {
  private List<RepResponseDto> content;
  private int totalPages;
  private long totalElements;
  private int currentPage;
}
