package com.example.demo.dto.store;

import java.time.LocalDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StoreResponseDto {

    private UUID id;
    private String name;
    private String address;
    private UUID companyId;
    private String companyName;
    private LocalDateTime createdAt;
}
