package com.example.demo.dto.manager;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ManagerPageResponseDto {
  private List<ManagerResponseDto> content;
  private int totalPages;
  private long totalElements;
  private int currentPage;
}
