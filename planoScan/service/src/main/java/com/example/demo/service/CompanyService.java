package com.example.demo.service;

import com.example.demo.dto.company.CompanyRequestDto;
import com.example.demo.dto.company.CompanyResponseDto;
import com.example.demo.entity.Company;
import com.example.demo.exception.ErrorCode;
import com.example.demo.exception.ServerException;
import com.example.demo.repository.CompanyRepository;
import com.example.demo.repository.StoreRepository;
import com.example.demo.repository.UserRepository;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CompanyService {

  private final CompanyRepository companyRepository;
  private final UserRepository userRepository;
  private final StoreRepository storeRepository;

  @Transactional(readOnly = true)
  public List<CompanyResponseDto> getAll() {
    return companyRepository.findAll().stream().map(this::toDto).toList();
  }

  @Transactional
  public CompanyResponseDto create(CompanyRequestDto dto) {
    if (companyRepository.findByName(dto.getName().trim()).isPresent()) {
      throw new ServerException(ErrorCode.COMPANY_ALREADY_EXISTS);
    }
    Company company = companyRepository.save(Company.builder().name(dto.getName().trim()).build());
    return toDto(company);
  }

  @Transactional
  public CompanyResponseDto update(UUID id, CompanyRequestDto dto) {
    Company company =
        companyRepository
            .findById(id)
            .orElseThrow(() -> new ServerException(ErrorCode.COMPANY_NOT_FOUND));

    companyRepository
        .findByName(dto.getName().trim())
        .filter(c -> !c.getId().equals(id))
        .ifPresent(
            c -> {
              throw new ServerException(ErrorCode.COMPANY_ALREADY_EXISTS);
            });

    company.setName(dto.getName().trim());
    return toDto(companyRepository.save(company));
  }

  @Transactional
  public void delete(UUID id) {
    if (!companyRepository.existsById(id)) {
      throw new ServerException(ErrorCode.COMPANY_NOT_FOUND);
    }
    if (userRepository.existsByCompanyId(id) || storeRepository.existsByCompanyId(id)) {
      throw new ServerException(ErrorCode.COMPANY_HAS_DEPENDENTS);
    }
    companyRepository.deleteById(id);
  }

  private CompanyResponseDto toDto(Company c) {
    return CompanyResponseDto.builder()
        .id(c.getId())
        .name(c.getName())
        .createdAt(c.getCreatedAt())
        .build();
  }
}
