package com.example.demo.dto.submission;

import java.util.List;

public record SubmissionPageResponseDto(
    List<SubmissionSummaryDto> content,
    int totalPages,
    long totalElements,
    int currentPage) {}
