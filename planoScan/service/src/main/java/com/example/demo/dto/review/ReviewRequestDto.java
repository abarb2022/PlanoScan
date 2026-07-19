package com.example.demo.dto.review;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ReviewRequestDto {
  public enum Action { ACKNOWLEDGE, DISPUTE }

  @NotNull
  private Action action;
  private Float correctedScore;
  private String notes;
}
