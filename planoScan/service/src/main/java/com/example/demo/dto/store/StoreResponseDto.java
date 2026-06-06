package com.example.demo.dto.store;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StoreResponseDto {

    private Long id;
    private String name;
    private String address;
    private Long companyId;
    private String companyName;
    private LocalDateTime createdAt;
}
