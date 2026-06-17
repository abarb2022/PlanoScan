package com.example.demo.dto.store;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class StorePageResponseDto {
  private List<StoreResponseDto> content;
  private int totalPages;
  private long totalElements;
  private int currentPage;
}
