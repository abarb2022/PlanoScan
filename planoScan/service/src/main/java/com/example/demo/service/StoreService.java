package com.example.demo.service;

import com.example.demo.dto.store.StorePageResponseDto;
import com.example.demo.dto.store.StoreRequestDto;
import com.example.demo.dto.store.StoreResponseDto;
import com.example.demo.entity.Company;
import com.example.demo.entity.Store;
import com.example.demo.exception.ErrorCode;
import com.example.demo.exception.ServerException;
import com.example.demo.repository.CompanyRepository;
import com.example.demo.repository.StoreRepository;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class StoreService {

  private final StoreRepository storeRepository;
  private final CompanyRepository companyRepository;

  @Transactional
  public StoreResponseDto createStore(StoreRequestDto dto) {
    Company company =
        companyRepository
            .findById(dto.getCompanyId())
            .orElseThrow(() -> new ServerException(ErrorCode.COMPANY_NOT_FOUND));

    if (storeRepository.existsByNameAndCompanyId(dto.getName(), dto.getCompanyId())) {
      throw new ServerException(ErrorCode.STORE_ALREADY_EXISTS);
    }

    Store store =
        Store.builder().name(dto.getName()).address(dto.getAddress()).company(company).build();

    return toDto(storeRepository.save(store));
  }

  @Transactional(readOnly = true)
  public StorePageResponseDto getAllStores(int page, int size, UUID companyId) {
    Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
    Page<Store> result =
        (companyId != null)
            ? storeRepository.findByCompanyId(companyId, pageable)
            : storeRepository.findAll(pageable);

    return new StorePageResponseDto(
        result.getContent().stream().map(this::toDto).toList(),
        result.getTotalPages(),
        result.getTotalElements(),
        result.getNumber());
  }

  @Transactional(readOnly = true)
  public StoreResponseDto getStoreById(UUID id) {
    return toDto(
        storeRepository
            .findById(id)
            .orElseThrow(() -> new ServerException(ErrorCode.STORE_NOT_FOUND)));
  }

  @Transactional
  public StoreResponseDto updateStore(UUID id, StoreRequestDto dto) {
    Store store =
        storeRepository
            .findById(id)
            .orElseThrow(() -> new ServerException(ErrorCode.STORE_NOT_FOUND));

    Company company =
        companyRepository
            .findById(dto.getCompanyId())
            .orElseThrow(() -> new ServerException(ErrorCode.COMPANY_NOT_FOUND));

    if (storeRepository.existsByNameAndCompanyIdAndIdNot(dto.getName(), dto.getCompanyId(), id)) {
      throw new ServerException(ErrorCode.STORE_ALREADY_EXISTS);
    }

    store.setName(dto.getName());
    store.setAddress(dto.getAddress());
    store.setCompany(company);
    return toDto(storeRepository.save(store));
  }

  @Transactional
  public void deleteStore(UUID id) {
    if (!storeRepository.existsById(id)) {
      throw new ServerException(ErrorCode.STORE_NOT_FOUND);
    }
    storeRepository.deleteById(id);
  }

  private StoreResponseDto toDto(Store store) {
    return new StoreResponseDto(
        store.getId(),
        store.getName(),
        store.getAddress(),
        store.getCompany().getId(),
        store.getCompany().getName(),
        store.getCreatedAt());
  }
}
