package com.example.demo.service;

import com.example.demo.dto.store.StorePageResponseDto;
import com.example.demo.dto.store.StoreRequestDto;
import com.example.demo.dto.store.StoreResponseDto;
import com.example.demo.entity.Company;
import com.example.demo.entity.Store;
import com.example.demo.entity.User;
import com.example.demo.exception.ErrorCode;
import com.example.demo.exception.ServerException;
import com.example.demo.repository.CompanyRepository;
import com.example.demo.repository.StoreRepository;
import com.example.demo.repository.UserRepository;
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
  private final UserRepository userRepository;

  @Transactional
  public StoreResponseDto createStore(StoreRequestDto dto, String currentUserEmail) {
    User currentUser = getCurrentUser(currentUserEmail);
    Company company = resolveCompany(currentUser, dto.getCompanyId());

    if (storeRepository.existsByNameAndCompanyId(dto.getName(), company.getId())) {
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
  public StoreResponseDto updateStore(UUID id, StoreRequestDto dto, String currentUserEmail) {
    Store store =
        storeRepository
            .findById(id)
            .orElseThrow(() -> new ServerException(ErrorCode.STORE_NOT_FOUND));

    User currentUser = getCurrentUser(currentUserEmail);
    Company company = resolveCompany(currentUser, dto.getCompanyId());

    if (storeRepository.existsByNameAndCompanyIdAndIdNot(dto.getName(), company.getId(), id)) {
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

  private User getCurrentUser(String email) {
    return userRepository
        .findByEmail(email)
        .orElseThrow(() -> new ServerException(ErrorCode.USER_NOT_FOUND));
  }

  private Company resolveCompany(User currentUser, UUID companyId) {
    if (currentUser.getRole() == User.Role.ADMIN && companyId != null) {
      return companyRepository
          .findById(companyId)
          .orElseThrow(() -> new ServerException(ErrorCode.COMPANY_NOT_FOUND));
    }
    Company company = currentUser.getCompany();
    if (company == null) {
      throw new ServerException(ErrorCode.COMPANY_NOT_FOUND);
    }
    return company;
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
