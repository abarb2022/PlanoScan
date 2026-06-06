package com.example.demo.controller;
import com.example.demo.dto.store.StoreRequestDto;
import com.example.demo.dto.store.StoreResponseDto;
import com.example.demo.service.StoreService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import com.example.demo.dto.store.StorePageResponseDto;

@RestController
@RequestMapping("/api/admin/stores")
@CrossOrigin(origins = {"http://127.0.0.1:5173", "http://localhost:5173"})
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")  // entire controller is admin-only
public class AdminStoreController {

    private final StoreService storeService;

    @PostMapping
    public ResponseEntity<StoreResponseDto> createStore(
            @Valid @RequestBody StoreRequestDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(storeService.createStore(dto));
    }

    @GetMapping
    public ResponseEntity<StorePageResponseDto> getAllStores(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size,
            @RequestParam(name = "companyId", required = false) Long companyId) {
        return ResponseEntity.ok(storeService.getAllStores(page, size, companyId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<StoreResponseDto> getStore(@PathVariable(name = "id") Long id) {
        return ResponseEntity.ok(storeService.getStoreById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<StoreResponseDto> updateStore(
            @PathVariable(name = "id") Long id,
            @Valid @RequestBody StoreRequestDto dto) {
        return ResponseEntity.ok(storeService.updateStore(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteStore(@PathVariable(name = "id") Long id) {
        storeService.deleteStore(id);
        return ResponseEntity.noContent().build();
    }
}
