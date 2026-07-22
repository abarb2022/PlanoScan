package com.example.demo.dto.planogram;

import java.util.UUID;
import lombok.Data;

@Data
public class SectionProductLinkDto {
  private int shelfNumber;
  private String position;
  private UUID productId;
}
