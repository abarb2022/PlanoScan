package com.example.demo.ai.model;

import java.util.List;

public record PlanogramLayout(List<Shelf> shelves, int totalShelves, String notes) {
  public record Shelf(int number, List<Section> sections) {}

  public record Section(String position, String productName, int facings) {}
}
